/**
 * Phase execution loop for todo-code-writer orchestration.
 */

import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import { delay, MAX_RETRIES, RETRY_DELAYS_MS } from '../todo-code-writer.helpers.js'
import type {
  PhaseAuditResult,
  PhaseEngResult,
  PhasePlan,
  PhaseStatus,
  TodoCodeWriterInput,
} from '../todo-code-writer.schema.js'
import type { AuditStepResult, EngStepResult, PhaseLoopResult } from '../todo-code-writer.types.js'

/**
 * Execute engineering step for a phase with retry logic.
 * Retries on exception (network/crash), halts immediately on logical failure (status: "failed").
 */
async function runEngStepWithRetry(
  phase: PhasePlan['phases'][number],
  input: TodoCodeWriterInput,
  phasePlan: PhasePlan,
  context: CapabilityContext,
): Promise<EngStepResult> {
  let engRetryAttempts = 0
  let engResult: PhaseEngResult | null = null
  let pendingFiles: string[] = []
  let phaseSummary: string | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      engResult = (await context.invokeCapability('todo_code_writer_phase_eng_step', {
        spec_path: input.spec_path,
        phase_plan: phasePlan,
        current_phase_number: phase.phase_number,
        cwd: input.cwd,
      })) as PhaseEngResult

      // Check for logical failure (no retry)
      if (engResult.status === 'failed') {
        return {
          engResult,
          halted: true,
          failedPhase: phase.phase_number,
          failureReason: engResult.summary,
          retryAttempts: 0, // Logical failure doesn't count retries
          pendingFiles: [],
          phaseSummary: null,
        }
      }

      // Success - store pending files and summary
      pendingFiles = [...engResult.files_modified]
      phaseSummary = engResult.summary
      break // Success, exit retry loop
    } catch (error) {
      context.logger.warn(
        `Engineering step phase ${phase.phase_number} attempt ${attempt + 1} failed: ${error}`,
      )

      if (attempt < MAX_RETRIES) {
        engRetryAttempts++ // Increment retry count only when actually retrying
        await delay(RETRY_DELAYS_MS[attempt])
      } else {
        // Exhausted retries - halt
        return {
          engResult: null,
          halted: true,
          failedPhase: phase.phase_number,
          failureReason: error instanceof Error ? error.message : String(error),
          retryAttempts: engRetryAttempts,
          pendingFiles: [],
          phaseSummary: null,
        }
      }
    }
  }

  return {
    engResult,
    halted: false,
    failedPhase: null,
    failureReason: null,
    retryAttempts: engRetryAttempts,
    pendingFiles,
    phaseSummary,
  }
}

/**
 * Execute audit step for a phase with retry logic.
 * Retries on exception, halts after exhausting retries.
 */
async function runAuditStepWithRetry(
  phase: PhasePlan['phases'][number],
  engResult: PhaseEngResult,
  pendingFiles: string[],
  input: TodoCodeWriterInput,
  context: CapabilityContext,
): Promise<AuditStepResult> {
  let auditRetryAttempts = 0
  let auditResult: PhaseAuditResult | null = null

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      auditResult = (await context.invokeCapability('todo_code_writer_phase_audit_step', {
        spec_path: input.spec_path,
        phase_number: phase.phase_number,
        files_modified: pendingFiles,
        eng_summary: engResult.summary,
        cwd: input.cwd,
      })) as PhaseAuditResult

      // Success
      break // Exit retry loop
    } catch (error) {
      context.logger.warn(
        `Audit step phase ${phase.phase_number} attempt ${attempt + 1} failed: ${error}`,
      )

      if (attempt < MAX_RETRIES) {
        auditRetryAttempts++ // Increment retry count only when actually retrying
        await delay(RETRY_DELAYS_MS[attempt])
      } else {
        // Exhausted retries - halt, discard pending files
        return {
          auditResult: null,
          halted: true,
          failedPhase: phase.phase_number,
          failureReason: error instanceof Error ? error.message : String(error),
          retryAttempts: auditRetryAttempts,
        }
      }
    }
  }

  return {
    auditResult,
    halted: false,
    failedPhase: null,
    failureReason: null,
    retryAttempts: auditRetryAttempts,
  }
}

/**
 * Mark all unexecuted phases as skipped after a halt.
 */
export function markSkippedPhases(
  executedPhaseNumbers: Set<number>,
  allPhases: PhasePlan['phases'],
): PhaseStatus[] {
  const skippedStatuses: PhaseStatus[] = []

  for (const phase of allPhases) {
    if (!executedPhaseNumbers.has(phase.phase_number)) {
      skippedStatuses.push({
        phase_number: phase.phase_number,
        eng_status: 'skipped',
        audit_status: 'skipped',
        files_modified: [],
        retry_attempts: 0,
      })
    }
  }

  return skippedStatuses
}

/**
 * Run the phase execution loop: for each phase, invoke eng step then audit step.
 * Returns aggregated results, all modified files, and halt information.
 *
 * Two-mode retry logic:
 * - Engineering step: Retry on exception (network/crash), halt immediately on logical failure (status: "failed")
 * - Audit step: Retry on exception, halt after exhausting retries
 *
 * Deferred file tracking: Files only added to allModifiedFiles after successful audit,
 * ensuring failed phases don't contribute to the commit.
 */
export async function runPhaseLoop(
  input: TodoCodeWriterInput,
  phasePlan: PhasePlan,
  context: CapabilityContext,
): Promise<PhaseLoopResult> {
  const phaseResults: Array<{ eng: PhaseEngResult; audit: PhaseAuditResult }> = []
  const phaseStatuses: PhaseStatus[] = []
  const allModifiedFiles: string[] = []
  const phaseSummaries: string[] = []
  let halted = false
  let failedPhase: number | null = null
  let failureReason: string | null = null

  for (const phase of phasePlan.phases) {
    // --- Engineering Step with Retry Logic ---
    const engStepResult = await runEngStepWithRetry(phase, input, phasePlan, context)

    if (engStepResult.halted) {
      halted = true
      failedPhase = engStepResult.failedPhase
      failureReason = engStepResult.failureReason
      phaseStatuses.push({
        phase_number: phase.phase_number,
        eng_status: 'failed',
        audit_status: 'skipped',
        files_modified: [],
        retry_attempts: engStepResult.retryAttempts,
      })
      break
    }

    const { engResult, pendingFiles, phaseSummary } = engStepResult
    if (phaseSummary) phaseSummaries.push(phaseSummary)

    // --- Audit Step with Retry Logic ---
    const auditStepResult = await runAuditStepWithRetry(
      phase,
      engResult!,
      pendingFiles,
      input,
      context,
    )

    if (auditStepResult.halted) {
      halted = true
      failedPhase = auditStepResult.failedPhase
      failureReason = auditStepResult.failureReason
      phaseStatuses.push({
        phase_number: phase.phase_number,
        eng_status: 'success',
        audit_status: 'fail',
        files_modified: [], // Pending files discarded
        retry_attempts: auditStepResult.retryAttempts,
      })
      break
    }

    // --- Quality Gate: Block on audit failure, retry eng with feedback ---
    if (auditStepResult.auditResult!.status === 'fail') {
      context.logger.warn(
        `Phase ${phase.phase_number} audit failed, retrying eng step with audit feedback`,
      )

      // Re-invoke eng step with audit feedback
      const retryEngResult = (await context.invokeCapability('todo_code_writer_phase_eng_step', {
        spec_path: input.spec_path,
        phase_plan: phasePlan,
        current_phase_number: phase.phase_number,
        cwd: input.cwd,
        audit_feedback: auditStepResult.auditResult!.summary,
      })) as PhaseEngResult

      if (retryEngResult.status === 'failed') {
        halted = true
        failedPhase = phase.phase_number
        failureReason = `Audit failed, eng retry also failed: ${retryEngResult.summary}`
        phaseStatuses.push({
          phase_number: phase.phase_number,
          eng_status: 'failed',
          audit_status: 'fail',
          files_modified: [],
          retry_attempts: 1,
        })
        break
      }

      // Re-run audit on fixed code
      const reauditResult = await runAuditStepWithRetry(
        phase,
        retryEngResult,
        [...retryEngResult.files_modified],
        input,
        context,
      )

      if (reauditResult.halted || reauditResult.auditResult?.status === 'fail') {
        halted = true
        failedPhase = phase.phase_number
        failureReason = `Phase still failing after audit retry: ${reauditResult.auditResult?.summary ?? reauditResult.failureReason}`
        phaseStatuses.push({
          phase_number: phase.phase_number,
          eng_status: 'success',
          audit_status: 'fail',
          files_modified: [],
          retry_attempts: 1,
        })
        break
      }

      // Retry succeeded — commit retry files
      allModifiedFiles.push(...retryEngResult.files_modified)
      phaseStatuses.push({
        phase_number: phase.phase_number,
        eng_status: 'success',
        audit_status: reauditResult.auditResult!.status,
        files_modified: [...retryEngResult.files_modified],
        retry_attempts: 1,
      })
      phaseResults.push({ eng: retryEngResult, audit: reauditResult.auditResult! })
      continue
    }

    // Success - commit pending files
    allModifiedFiles.push(...pendingFiles)
    phaseStatuses.push({
      phase_number: phase.phase_number,
      eng_status: 'success',
      audit_status: auditStepResult.auditResult!.status,
      files_modified: pendingFiles,
      retry_attempts: 0,
    })
    phaseResults.push({ eng: engResult!, audit: auditStepResult.auditResult! })
  }

  // Mark unexecuted phases as skipped
  const executedPhases = new Set(phaseStatuses.map((ps) => ps.phase_number))
  const skippedStatuses = markSkippedPhases(executedPhases, phasePlan.phases)
  phaseStatuses.push(...skippedStatuses)

  // Deduplicate modified files
  const uniqueFiles = [...new Set(allModifiedFiles)]

  return {
    phaseResults,
    phaseStatuses,
    allModifiedFiles: uniqueFiles,
    phaseSummaries,
    halted,
    failedPhase,
    failureReason,
  }
}
