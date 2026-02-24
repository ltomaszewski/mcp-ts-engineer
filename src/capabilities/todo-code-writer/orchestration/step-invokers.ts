/**
 * Step invokers for todo-code-writer orchestration.
 */

import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import { PHASE_PLAN_FALLBACK, parseJsonSafe, parseXmlBlock } from '../todo-code-writer.helpers.js'
import type {
  CommitResult,
  FinalAuditResult,
  PhasePlan,
  PhaseStatus,
  TodoCodeWriterInput,
  TodoCodeWriterOutput,
} from '../todo-code-writer.schema.js'
import { PhasePlanSchema } from '../todo-code-writer.schema.js'

/**
 * Parse the phase plan from the planner AI query response.
 */
export function parsePhasePlanFromAiContent(content: string): PhasePlan {
  const planXml = parseXmlBlock(content, 'phase_plan')
  if (planXml) {
    return parseJsonSafe(planXml, PhasePlanSchema, PHASE_PLAN_FALLBACK)
  }
  return PHASE_PLAN_FALLBACK
}

/**
 * Invoke the final audit step on all modified files.
 */
export async function invokeFinalAudit(
  input: TodoCodeWriterInput,
  allModifiedFiles: string[],
  context: CapabilityContext,
): Promise<FinalAuditResult> {
  return (await context.invokeCapability('todo_code_writer_final_audit_step', {
    spec_path: input.spec_path,
    all_modified_files: allModifiedFiles,
    cwd: input.cwd,
  })) as FinalAuditResult
}

/**
 * Invoke the commit step to commit all changes.
 * Accepts optional partial_run parameter for commits after halted execution.
 */
export async function invokeCommitStep(
  input: TodoCodeWriterInput,
  filesChanged: string[],
  phaseSummaries: string[],
  finalAuditSummary: string,
  context: CapabilityContext,
  partialRun?: { partial_run: boolean; failure_context: string },
): Promise<CommitResult> {
  return (await context.invokeCapability('todo_code_writer_commit_step', {
    spec_path: input.spec_path,
    files_changed: filesChanged,
    phase_summaries: phaseSummaries,
    final_audit_summary: finalAuditSummary,
    cwd: input.cwd,
    ...partialRun,
  })) as CommitResult
}

/**
 * Build the final TodoCodeWriterOutput from all accumulated results.
 */
export function buildOutput(
  phasesCompleted: number,
  finalAuditResult: FinalAuditResult,
  commitResult: CommitResult,
  phaseResults: PhaseStatus[],
  failedPhase: number | null,
  failureReason: string | null,
): TodoCodeWriterOutput {
  return {
    status: finalAuditResult.status === 'pass' && failedPhase === null ? 'success' : 'failed',
    phases_completed: phasesCompleted,
    final_audit_status: finalAuditResult.status,
    commit_sha: commitResult.commit_sha,
    commit_message: commitResult.commit_message,
    files_changed: commitResult.files_changed,
    failed_phase: failedPhase,
    failure_reason: failureReason,
    phase_results: phaseResults,
  }
}
