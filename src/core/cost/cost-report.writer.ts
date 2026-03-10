/**
 * CostReportWriter - writes daily cost reports with atomic file operations and lock file pattern.
 */

import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { getDefaultLogDir } from '../../config/constants.js'
import { resolveLogPath } from '../logger/path-utils.js'
import { acquireLock, releaseLock } from './cost-report.lock.js'
import type { Session } from '../session/session.types.js'
import type { CostSummary } from './cost.types.js'
import type {
  ChildSessionCostEntry,
  DailyCostReport,
  SessionCostEntry,
  SessionModelBreakdown,
} from './cost-report.schemas.js'
import { DailyCostReportSchema } from './cost-report.schemas.js'

/**
 * CostReportWriter manages daily cost reports with atomic writes and file locking.
 *
 * Features:
 * - Atomic writes using temp file + rename
 * - Lock file pattern with stale lock detection
 * - Zod schema validation on read
 * - Creates logs/reports directory with 0o700 permissions
 * - Sets file permissions to 0o600 (owner read/write only)
 */
export class CostReportWriter {
  /** Directory for cost reports */
  private readonly reportsDir: string

  /**
   * Creates a new CostReportWriter.
   *
   * @param reportsDir - Directory for cost reports (default: logs/reports)
   */
  constructor(reportsDir?: string) {
    this.reportsDir = reportsDir || path.join(resolveLogPath(getDefaultLogDir()), 'reports')
  }

  /**
   * Reads a daily cost report.
   *
   * @param date - Date in YYYY-MM-DD format (defaults to today)
   * @returns Daily cost report or null if not found
   * @throws Error if report JSON is corrupted or fails validation
   */
  async readDailyReport(date?: string): Promise<DailyCostReport | null> {
    const reportDate = date || this.getTodayDate()
    const reportPath = path.join(this.reportsDir, `${reportDate}.json`)

    try {
      const content = await fs.readFile(reportPath, 'utf-8')
      const parsed = JSON.parse(content) as unknown

      // Validate against Zod schema
      const result = DailyCostReportSchema.safeParse(parsed)
      if (!result.success) {
        throw new Error(`Invalid report format: ${result.error.message}`)
      }

      return result.data
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
        return null
      }
      throw error
    }
  }

  /**
   * Gets the total cost for a given day.
   *
   * @param date - Date in YYYY-MM-DD format (defaults to today)
   * @returns Total cost in USD (0 if no report exists)
   */
  async getDailyTotalCost(date?: string): Promise<number> {
    const report = await this.readDailyReport(date)
    return report?.totalCostUsd ?? 0
  }

  /**
   * Writes a session to the daily cost report using read-merge-write pattern.
   *
   * @param session - Session to write
   * @param costSummary - Cost summary for the session
   * @param childEntries - Optional child session cost entries
   * @param commitSha - Optional git commit SHA produced by this session
   * @param metadata - Optional metadata for enhanced logging
   */
  async writeSessionToReport(
    session: Session,
    costSummary: CostSummary,
    childEntries?: ChildSessionCostEntry[],
    commitSha?: string | null,
    metadata?: {
      capability: string
      model: string
      status: 'success' | 'error' | 'halted'
      input?: Record<string, unknown>
      specHash?: string
      errorType?:
        | 'validation'
        | 'budget'
        | 'timeout'
        | 'ai_error'
        | 'capability'
        | 'halted'
        | 'unknown'
      errorMessage?: string
    },
  ): Promise<void> {
    const reportDate = session.startedAt.split('T')[0]
    if (!reportDate) {
      throw new Error('Invalid session startedAt timestamp')
    }

    // Ensure reports directory exists
    await fs.mkdir(this.reportsDir, { recursive: true, mode: 0o700 })

    // Acquire lock
    await acquireLock(this.reportsDir, reportDate)

    try {
      // Read existing report or create new one
      let report = await this.readDailyReport(reportDate)

      if (!report) {
        report = {
          date: reportDate,
          totalCostUsd: 0,
          totalSessions: 0,
          sessions: [],
          aggregatedByModel: {},
        }
      }

      // Convert CostSummary to SessionCostEntry (coerce to 0 defensively)
      const sessionEntry: SessionCostEntry = {
        sid: session.id,
        startedAt: session.startedAt,
        completedAt: session.completedAt,
        totalInputTokens: costSummary.totalInputTokens ?? 0,
        totalOutputTokens: costSummary.totalOutputTokens ?? 0,
        totalCostUsd: costSummary.totalCostUsd,
        invocationCount: costSummary.operationCount,
        byModel: this.convertToSessionModelBreakdown(costSummary.byModel),
        capability: metadata?.capability ?? 'unknown',
        model: metadata?.model ?? 'unknown',
        status: metadata?.status ?? 'success',
        ...(commitSha != null ? { commitSha } : {}),
        ...(metadata?.specHash ? { specHash: metadata.specHash } : {}),
        ...(metadata?.input ? { input: metadata.input } : {}),
        ...(metadata?.errorType
          ? {
              errorType: metadata.errorType as
                | 'validation'
                | 'budget'
                | 'timeout'
                | 'ai_error'
                | 'capability'
                | 'halted'
                | 'unknown',
            }
          : {}),
        ...(metadata?.errorMessage ? { errorMessage: metadata.errorMessage } : {}),
        // Cache metrics (only include if > 0 for cleaner reports)
        ...((costSummary.totalPromptCacheWrite ?? 0) > 0
          ? {
              totalPromptCacheWrite: costSummary.totalPromptCacheWrite,
            }
          : {}),
        ...((costSummary.totalPromptCacheRead ?? 0) > 0
          ? {
              totalPromptCacheRead: costSummary.totalPromptCacheRead,
            }
          : {}),
        ...((costSummary.cacheHitRate ?? 0) > 0
          ? {
              cacheHitRate: costSummary.cacheHitRate,
            }
          : {}),
      }

      // Add child sessions if provided and non-empty
      if (childEntries && childEntries.length > 0) {
        sessionEntry.childSessions = childEntries
      }

      // Append session
      report.sessions.push(sessionEntry)

      // Update aggregates
      report.totalCostUsd += costSummary.totalCostUsd
      report.totalSessions += 1

      // Aggregate model breakdown
      for (const [model, breakdown] of Object.entries(costSummary.byModel)) {
        if (!report.aggregatedByModel[model]) {
          report.aggregatedByModel[model] = {
            inputTokens: 0,
            outputTokens: 0,
            costUsd: 0,
            count: 0,
          }
        }

        const aggregated = report.aggregatedByModel[model]
        if (aggregated) {
          aggregated.inputTokens += breakdown.inputTokens
          aggregated.outputTokens += breakdown.outputTokens
          aggregated.costUsd += breakdown.costUsd
          aggregated.count += breakdown.count

          // Aggregate cache and total token metrics
          const cacheWrite = breakdown.promptCacheWrite || 0
          const cacheRead = breakdown.promptCacheRead || 0
          const tokensIn = breakdown.totalTokensIn || 0
          const tokensOut = breakdown.totalTokensOut || 0

          if (cacheWrite > 0 || aggregated.promptCacheWrite) {
            aggregated.promptCacheWrite = (aggregated.promptCacheWrite || 0) + cacheWrite
          }
          if (cacheRead > 0 || aggregated.promptCacheRead) {
            aggregated.promptCacheRead = (aggregated.promptCacheRead || 0) + cacheRead
          }
          if (tokensIn > 0 || aggregated.totalTokensIn) {
            aggregated.totalTokensIn = (aggregated.totalTokensIn || 0) + tokensIn
          }
          if (tokensOut > 0 || aggregated.totalTokensOut) {
            aggregated.totalTokensOut = (aggregated.totalTokensOut || 0) + tokensOut
          }
        }
      }

      // Atomic write
      await this.atomicWrite(reportDate, report)
    } finally {
      // Release lock
      await releaseLock(this.reportsDir, reportDate)
    }
  }

  /**
   * Converts Partial<Record> from CostSummary to Record for SessionModelBreakdown.
   * @internal
   */
  private convertToSessionModelBreakdown(
    byModel: Partial<
      Record<
        string,
        {
          inputTokens: number
          outputTokens: number
          promptCacheWrite?: number
          promptCacheRead?: number
          totalTokensIn?: number
          totalTokensOut?: number
          costUsd: number
          count: number
        }
      >
    >,
  ): SessionModelBreakdown {
    const result: SessionModelBreakdown = {}

    for (const [model, breakdown] of Object.entries(byModel)) {
      if (breakdown) {
        const entry: SessionModelBreakdown[string] = {
          inputTokens: breakdown.inputTokens,
          outputTokens: breakdown.outputTokens,
          costUsd: breakdown.costUsd,
          count: breakdown.count,
        }

        // Only include optional fields when > 0 for cleaner reports
        if (breakdown.promptCacheWrite && breakdown.promptCacheWrite > 0) {
          entry.promptCacheWrite = breakdown.promptCacheWrite
        }
        if (breakdown.promptCacheRead && breakdown.promptCacheRead > 0) {
          entry.promptCacheRead = breakdown.promptCacheRead
        }
        if (breakdown.totalTokensIn && breakdown.totalTokensIn > 0) {
          entry.totalTokensIn = breakdown.totalTokensIn
        }
        if (breakdown.totalTokensOut && breakdown.totalTokensOut > 0) {
          entry.totalTokensOut = breakdown.totalTokensOut
        }

        result[model] = entry
      }
    }

    return result
  }

  /**
   * Performs atomic write using temp file + rename.
   * @internal
   */
  private async atomicWrite(date: string, report: DailyCostReport): Promise<void> {
    const reportPath = path.join(this.reportsDir, `${date}.json`)
    const tempSuffix = crypto.randomBytes(8).toString('hex')
    const tempPath = `${reportPath}.tmp-${tempSuffix}`

    try {
      // Write to temp file
      await fs.writeFile(tempPath, JSON.stringify(report, null, 2), {
        mode: 0o600,
      })

      // Atomic rename
      await fs.rename(tempPath, reportPath)
    } catch (error) {
      // Clean up temp file on error
      try {
        await fs.unlink(tempPath)
      } catch {
        // Ignore cleanup errors
      }
      throw error
    }
  }

  /**
   * Gets today's date in YYYY-MM-DD format.
   * @internal
   */
  private getTodayDate(): string {
    return new Date().toISOString().split('T')[0] as string
  }
}
