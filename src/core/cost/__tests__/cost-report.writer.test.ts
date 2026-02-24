/**
 * Tests for CostReportWriter - daily cost report JSON writer with atomic writes.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import type { Session } from '../../session/session.types.js'
import type { CostSummary } from '../cost.types.js'
import type { ChildSessionCostEntry } from '../cost-report.schemas.js'
import { CostReportWriter } from '../cost-report.writer.js'

describe('CostReportWriter', () => {
  const testReportsDir = path.join(process.cwd(), 'logs', 'reports-test')
  let writer: CostReportWriter

  beforeEach(async () => {
    // Create test reports directory
    await fs.mkdir(testReportsDir, { recursive: true, mode: 0o700 })
    writer = new CostReportWriter(testReportsDir)
  })

  afterEach(async () => {
    // Clean up test directory
    try {
      await fs.rm(testReportsDir, { recursive: true, force: true })
    } catch {
      // Ignore cleanup errors
    }
  })

  describe('getDailyTotalCost', () => {
    it('returns 0 when no report exists for date', async () => {
      const total = await writer.getDailyTotalCost('2024-01-15')
      expect(total).toBe(0)
    })

    it('returns aggregated cost from existing report', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.01,
            count: 1,
          },
        },
      }

      await writer.writeSessionToReport(session, costSummary)

      const total = await writer.getDailyTotalCost('2024-01-15')
      expect(total).toBeCloseTo(0.01, 5)
    })

    it("uses today's date when no date provided", async () => {
      const today = new Date().toISOString().split('T')[0]
      if (!today) throw new Error('Invalid date')

      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: `${today}T10:00:00.000Z`,
        completedAt: `${today}T10:05:00.000Z`,
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary)

      const total = await writer.getDailyTotalCost()
      expect(total).toBeCloseTo(0.01, 5)
    })
  })

  describe('readDailyReport', () => {
    it('returns null when report does not exist', async () => {
      const report = await writer.readDailyReport('2024-01-15')
      expect(report).toBeNull()
    })

    it('reads and validates report against Zod schema', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.date).toBe('2024-01-15')
      expect(report?.totalCostUsd).toBeCloseTo(0.01, 5)
      expect(report?.totalSessions).toBe(1)
    })

    it('throws error when report JSON is corrupted', async () => {
      const reportPath = path.join(testReportsDir, '2024-01-15.json')
      await fs.writeFile(reportPath, '{ invalid json', { mode: 0o600 })

      await expect(writer.readDailyReport('2024-01-15')).rejects.toThrow()
    })

    it('throws error when report fails Zod validation', async () => {
      const reportPath = path.join(testReportsDir, '2024-01-15.json')
      const invalidReport = {
        date: '2024-01-15',
        totalCostUsd: -0.01, // Negative cost (invalid)
        totalSessions: 1,
        sessions: [],
        aggregatedByModel: {},
      }
      await fs.writeFile(reportPath, JSON.stringify(invalidReport), { mode: 0o600 })

      await expect(writer.readDailyReport('2024-01-15')).rejects.toThrow()
    })
  })

  describe('writeSessionToReport', () => {
    it('creates new report when none exists', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.01,
            count: 1,
          },
        },
      }

      await writer.writeSessionToReport(session, costSummary)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.sid).toBe('0123456789abcdef0123456789abcdef')
    })

    it('appends session to existing report', async () => {
      const session1: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const session2: Session = {
        id: 'fedcba9876543210fedcba9876543210',
        state: 'completed',
        startedAt: '2024-01-15T11:00:00.000Z',
        completedAt: '2024-01-15T11:05:00.000Z',
        invocations: [],
        totalInputTokens: 200,
        totalOutputTokens: 100,
        totalCost: 0.02,
      }

      const costSummary1: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      const costSummary2: CostSummary = {
        totalInputTokens: 200,
        totalOutputTokens: 100,
        totalCostUsd: 0.02,
        operationCount: 2,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session1, costSummary1)
      await writer.writeSessionToReport(session2, costSummary2)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report?.sessions).toHaveLength(2)
      expect(report?.totalSessions).toBe(2)
      expect(report?.totalCostUsd).toBeCloseTo(0.03, 5)
    })

    it('aggregates model breakdown across sessions', async () => {
      const session1: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const session2: Session = {
        id: 'fedcba9876543210fedcba9876543210',
        state: 'completed',
        startedAt: '2024-01-15T11:00:00.000Z',
        completedAt: '2024-01-15T11:05:00.000Z',
        invocations: [],
        totalInputTokens: 200,
        totalOutputTokens: 100,
        totalCost: 0.02,
      }

      const costSummary1: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 100,
            outputTokens: 50,
            costUsd: 0.01,
            count: 1,
          },
        },
      }

      const costSummary2: CostSummary = {
        totalInputTokens: 200,
        totalOutputTokens: 100,
        totalCostUsd: 0.02,
        operationCount: 2,
        totalTurns: 0,
        byModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 200,
            outputTokens: 100,
            costUsd: 0.02,
            count: 2,
          },
        },
      }

      await writer.writeSessionToReport(session1, costSummary1)
      await writer.writeSessionToReport(session2, costSummary2)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report?.aggregatedByModel['claude-3-5-sonnet-20241022']).toBeDefined()
      expect(report?.aggregatedByModel['claude-3-5-sonnet-20241022']?.inputTokens).toBe(300)
      expect(report?.aggregatedByModel['claude-3-5-sonnet-20241022']?.outputTokens).toBe(150)
      expect(report?.aggregatedByModel['claude-3-5-sonnet-20241022']?.costUsd).toBeCloseTo(0.03, 5)
      expect(report?.aggregatedByModel['claude-3-5-sonnet-20241022']?.count).toBe(3)
    })

    it('uses atomic write with temp file', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary)

      // Verify no temp files left behind
      const files = await fs.readdir(testReportsDir)
      const tempFiles = files.filter((f) => f.includes('.tmp'))

      expect(tempFiles).toHaveLength(0)
    })

    it('sets correct file permissions (0o600)', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary)

      const reportPath = path.join(testReportsDir, '2024-01-15.json')
      const stats = await fs.stat(reportPath)

      // Check permissions (owner read/write only)
      const mode = stats.mode & 0o777
      expect(mode).toBe(0o600)
    })

    it('includes childSessions array when child entries provided', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCost: 0.05,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        operationCount: 5,
        totalTurns: 5,
        byModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 1000,
            outputTokens: 500,
            costUsd: 0.05,
            count: 5,
          },
        },
      }

      const childEntries: ChildSessionCostEntry[] = [
        {
          sid: 'child123456789abcdef0123456789ab',
          capability: 'eng-executor',
          costUsd: 0.03,
          turns: 3,
          inputTokens: 600,
          outputTokens: 300,
          model: 'claude-3-5-sonnet-20241022',
          status: 'success',
        },
        {
          sid: 'child987654321fedcba9876543210fe',
          capability: 'audit-executor',
          costUsd: 0.02,
          turns: 2,
          inputTokens: 400,
          outputTokens: 200,
          model: 'claude-3-5-haiku-20241022',
          status: 'success',
        },
      ]

      await writer.writeSessionToReport(session, costSummary, childEntries)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.childSessions).toBeDefined()
      expect(report?.sessions[0]?.childSessions).toHaveLength(2)
      expect(report?.sessions[0]?.childSessions?.[0]?.sid).toBe('child123456789abcdef0123456789ab')
      expect(report?.sessions[0]?.childSessions?.[0]?.capability).toBe('eng-executor')
      expect(report?.sessions[0]?.childSessions?.[0]?.costUsd).toBeCloseTo(0.03, 5)
      expect(report?.sessions[0]?.childSessions?.[0]?.turns).toBe(3)
    })

    it('omits childSessions when no child entries provided', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.childSessions).toBeUndefined()
    })

    it('omits childSessions when empty array provided', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary, [])

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.childSessions).toBeUndefined()
    })

    it('persists commitSha when provided', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary, undefined, 'abc123def456789')

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.commitSha).toBe('abc123def456789')
    })

    it('omits commitSha when not provided', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.commitSha).toBeUndefined()
    })

    it('populates all metadata fields when provided', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary, undefined, undefined, {
        capability: 'todo-code-writer',
        model: 'claude-3-5-sonnet-20241022',
        status: 'success',
        input: { spec_path: 'test.md', max_phases: 5 },
        specHash: 'abc123def4567890',
        errorType: undefined,
        errorMessage: undefined,
      })

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.capability).toBe('todo-code-writer')
      expect(report?.sessions[0]?.model).toBe('claude-3-5-sonnet-20241022')
      expect(report?.sessions[0]?.status).toBe('success')
      expect(report?.sessions[0]?.input).toEqual({ spec_path: 'test.md', max_phases: 5 })
      expect(report?.sessions[0]?.specHash).toBe('abc123def4567890')
    })

    it('uses default values when metadata missing', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.capability).toBe('unknown')
      expect(report?.sessions[0]?.model).toBe('unknown')
      expect(report?.sessions[0]?.status).toBe('success')
    })

    it('omits optional metadata fields when undefined', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary, undefined, undefined, {
        capability: 'test-capability',
        model: 'sonnet',
        status: 'success',
        input: undefined,
        specHash: undefined,
        errorType: undefined,
        errorMessage: undefined,
      })

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions[0]?.input).toBeUndefined()
      expect(report?.sessions[0]?.specHash).toBeUndefined()
      expect(report?.sessions[0]?.errorType).toBeUndefined()
      expect(report?.sessions[0]?.errorMessage).toBeUndefined()
    })

    it('includes error metadata in error sessions', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary, undefined, undefined, {
        capability: 'todo-code-writer',
        model: 'sonnet',
        status: 'error',
        input: { spec_path: 'test.md' },
        specHash: 'abc123',
        errorType: 'timeout',
        errorMessage: 'Timeout after 60 seconds',
      })

      const report = await writer.readDailyReport('2024-01-15')

      expect(report?.sessions[0]?.status).toBe('error')
      expect(report?.sessions[0]?.errorType).toBe('timeout')
      expect(report?.sessions[0]?.errorMessage).toBe('Timeout after 60 seconds')
    })

    it('maintains backward compatibility without metadata parameter', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      // Call without metadata parameter (backward compatibility)
      await writer.writeSessionToReport(session, costSummary)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      // Should have default values
      expect(report?.sessions[0]?.capability).toBe('unknown')
      expect(report?.sessions[0]?.model).toBe('unknown')
      expect(report?.sessions[0]?.status).toBe('success')
    })

    it('writes child session metadata with model and status fields', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCost: 0.05,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        operationCount: 5,
        totalTurns: 5,
        byModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 600,
            outputTokens: 300,
            costUsd: 0.03,
            count: 3,
          },
          'claude-3-5-haiku-20241022': {
            inputTokens: 400,
            outputTokens: 200,
            costUsd: 0.02,
            count: 2,
          },
        },
      }

      const childEntries: ChildSessionCostEntry[] = [
        {
          sid: 'child123456789abcdef0123456789ab',
          capability: 'eng-executor',
          costUsd: 0.03,
          turns: 3,
          inputTokens: 600,
          outputTokens: 300,
          model: 'claude-3-5-sonnet-20241022',
          status: 'success',
        },
        {
          sid: 'child987654321fedcba9876543210fe',
          capability: 'audit-executor',
          costUsd: 0.02,
          turns: 2,
          inputTokens: 400,
          outputTokens: 200,
          model: 'claude-3-5-haiku-20241022',
          status: 'error',
        },
      ]

      await writer.writeSessionToReport(session, costSummary, childEntries)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.childSessions).toHaveLength(2)
      expect(report?.sessions[0]?.childSessions?.[0]?.model).toBe('claude-3-5-sonnet-20241022')
      expect(report?.sessions[0]?.childSessions?.[0]?.status).toBe('success')
      expect(report?.sessions[0]?.childSessions?.[1]?.model).toBe('claude-3-5-haiku-20241022')
      expect(report?.sessions[0]?.childSessions?.[1]?.status).toBe('error')
    })

    it('correlates sessions with same spec_path via specHash', async () => {
      const session1: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const session2: Session = {
        id: 'fedcba9876543210fedcba9876543210',
        state: 'completed',
        startedAt: '2024-01-15T11:00:00.000Z',
        completedAt: '2024-01-15T11:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const session3: Session = {
        id: '11111111222222223333333344444444',
        state: 'completed',
        startedAt: '2024-01-15T12:00:00.000Z',
        completedAt: '2024-01-15T12:05:00.000Z',
        invocations: [],
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCost: 0.01,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 100,
        totalOutputTokens: 50,
        totalCostUsd: 0.01,
        operationCount: 1,
        totalTurns: 0,
        byModel: {},
      }

      // Sessions 1 and 2 have same spec_path, session 3 has different
      await writer.writeSessionToReport(session1, costSummary, undefined, undefined, {
        capability: 'todo-reviewer',
        model: 'sonnet',
        status: 'success',
        input: { spec_path: 'docs/specs/feature-a.md' },
        specHash: 'a1b2c3d4e5f67890',
      })

      await writer.writeSessionToReport(session2, costSummary, undefined, undefined, {
        capability: 'todo-code-writer',
        model: 'sonnet',
        status: 'success',
        input: { spec_path: 'docs/specs/feature-a.md' },
        specHash: 'a1b2c3d4e5f67890',
      })

      await writer.writeSessionToReport(session3, costSummary, undefined, undefined, {
        capability: 'todo-reviewer',
        model: 'sonnet',
        status: 'success',
        input: { spec_path: 'docs/specs/feature-b.md' },
        specHash: '9876543210fedcba',
      })

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(3)

      // Sessions 1 and 2 should have identical specHash
      const specHash1 = report?.sessions[0]?.specHash
      const specHash2 = report?.sessions[1]?.specHash
      const specHash3 = report?.sessions[2]?.specHash

      expect(specHash1).toBe('a1b2c3d4e5f67890')
      expect(specHash2).toBe('a1b2c3d4e5f67890')
      expect(specHash3).toBe('9876543210fedcba')
      expect(specHash1).toBe(specHash2)
      expect(specHash1).not.toBe(specHash3)
    })

    it('propagates commit SHA in child sessions', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCost: 0.05,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        operationCount: 5,
        totalTurns: 5,
        byModel: {
          'claude-3-5-sonnet-20241022': {
            inputTokens: 1000,
            outputTokens: 500,
            costUsd: 0.05,
            count: 5,
          },
        },
      }

      const childEntries: ChildSessionCostEntry[] = [
        {
          sid: 'child123456789abcdef0123456789ab',
          capability: 'eng-executor',
          costUsd: 0.03,
          turns: 3,
          inputTokens: 600,
          outputTokens: 300,
          model: 'claude-3-5-sonnet-20241022',
          status: 'success',
          commitSha: 'abc1234def567890abc1234def567890abc12345',
        },
        {
          sid: 'child987654321fedcba9876543210fe',
          capability: 'audit-executor',
          costUsd: 0.02,
          turns: 2,
          inputTokens: 400,
          outputTokens: 200,
          model: 'claude-3-5-sonnet-20241022',
          status: 'success',
          commitSha: null,
        },
      ]

      await writer.writeSessionToReport(session, costSummary, childEntries)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.childSessions).toHaveLength(2)
      expect(report?.sessions[0]?.childSessions?.[0]?.commitSha).toBe(
        'abc1234def567890abc1234def567890abc12345',
      )
      expect(report?.sessions[0]?.childSessions?.[1]?.commitSha).toBeNull()
    })

    it('includes cache metrics in SessionCostEntry when present (AC-8)', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 10000,
        totalOutputTokens: 500,
        totalCost: 0.05,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 10000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        operationCount: 1,
        totalTurns: 0,
        totalPromptCacheWrite: 2000,
        totalPromptCacheRead: 7000,
        cacheHitRate: 0.7,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.totalPromptCacheWrite).toBe(2000)
      expect(report?.sessions[0]?.totalPromptCacheRead).toBe(7000)
      expect(report?.sessions[0]?.cacheHitRate).toBe(0.7)
    })

    it('omits cache metrics from SessionCostEntry when zero (AC-8, AC-10)', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCost: 0.05,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        operationCount: 1,
        totalTurns: 0,
        totalPromptCacheWrite: 0,
        totalPromptCacheRead: 0,
        cacheHitRate: 0,
        byModel: {},
      }

      await writer.writeSessionToReport(session, costSummary)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.totalPromptCacheWrite).toBeUndefined()
      expect(report?.sessions[0]?.totalPromptCacheRead).toBeUndefined()
      expect(report?.sessions[0]?.cacheHitRate).toBeUndefined()
    })

    it('includes cache metrics in child session entries (AC-9)', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 10000,
        totalOutputTokens: 500,
        totalCost: 0.05,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 10000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        operationCount: 1,
        totalTurns: 3,
        byModel: {},
      }

      const childEntries: ChildSessionCostEntry[] = [
        {
          sid: 'child123456789abcdef0123456789ab',
          capability: 'eng-executor',
          costUsd: 0.03,
          turns: 3,
          inputTokens: 10000,
          outputTokens: 500,
          model: 'claude-3-5-sonnet-20241022',
          status: 'success',
          promptCacheWrite: 2000,
          promptCacheRead: 7000,
        },
      ]

      await writer.writeSessionToReport(session, costSummary, childEntries)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.childSessions).toHaveLength(1)
      expect(report?.sessions[0]?.childSessions?.[0]?.promptCacheWrite).toBe(2000)
      expect(report?.sessions[0]?.childSessions?.[0]?.promptCacheRead).toBe(7000)
    })

    it('omits cache metrics from child entries when undefined (AC-9, AC-10)', async () => {
      const session: Session = {
        id: '0123456789abcdef0123456789abcdef',
        state: 'completed',
        startedAt: '2024-01-15T10:00:00.000Z',
        completedAt: '2024-01-15T10:05:00.000Z',
        invocations: [],
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCost: 0.05,
      }

      const costSummary: CostSummary = {
        totalInputTokens: 1000,
        totalOutputTokens: 500,
        totalCostUsd: 0.05,
        operationCount: 1,
        totalTurns: 3,
        byModel: {},
      }

      const childEntries: ChildSessionCostEntry[] = [
        {
          sid: 'child123456789abcdef0123456789ab',
          capability: 'eng-executor',
          costUsd: 0.05,
          turns: 3,
          inputTokens: 1000,
          outputTokens: 500,
          model: 'claude-3-5-sonnet-20241022',
          status: 'success',
          // No cache fields
        },
      ]

      await writer.writeSessionToReport(session, costSummary, childEntries)

      const report = await writer.readDailyReport('2024-01-15')

      expect(report).not.toBeNull()
      expect(report?.sessions).toHaveLength(1)
      expect(report?.sessions[0]?.childSessions).toHaveLength(1)
      expect(report?.sessions[0]?.childSessions?.[0]?.promptCacheWrite).toBeUndefined()
      expect(report?.sessions[0]?.childSessions?.[0]?.promptCacheRead).toBeUndefined()
    })
  })
})
