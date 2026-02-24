/**
 * Zod schemas for todo-code-writer capability input, output, and inter-session data contracts.
 *
 * Defines validation schemas for:
 * - TodoCodeWriterInput: Top-level capability input
 * - PhasePlan: Output from the planner session
 * - PhaseEngResult: Output from the engineering step
 * - PhaseAuditResult: Output from the phase audit step
 * - FinalAuditResult: Output from the final audit step
 * - CommitResult: Output from the commit step
 * - TodoCodeWriterOutput: Final capability output
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Sub-capability data contracts (inter-session)
// ---------------------------------------------------------------------------

/**
 * File to be created or modified in a phase.
 */
export const PhaseFileSchema = z.object({
  path: z.string().describe('File path'),
  action: z.enum(['CREATE', 'MODIFY']).describe('Action to perform'),
  purpose: z.string().describe("Brief description of file's role in this phase"),
})

/**
 * Individual phase definition in the implementation plan.
 */
export const PhaseSchema = z.object({
  phase_number: z.number().int().describe('Phase number (1-indexed)'),
  purpose: z.string().describe('One-sentence description of phase goal'),
  dependencies: z.array(z.string()).describe("Phase numbers or 'none' if no dependencies"),
  files: z.array(PhaseFileSchema).describe('Files to create or modify'),
})

/**
 * Plan produced by the planner session.
 * Contains ordered phases for sequential execution.
 */
export const PhasePlanSchema = z.object({
  phases: z.array(PhaseSchema).describe('Ordered list of implementation phases'),
})

/**
 * Result from the engineering step for a single phase.
 * Contains actual files modified and summary of work.
 */
export const PhaseEngResultSchema = z.object({
  status: z.enum(['success', 'failed']).describe('Engineering step execution status'),
  files_modified: z.array(z.string()).describe('Actual files changed during engineering'),
  summary: z.string().describe('Brief summary of implementation work'),
})

/**
 * Result from the phase audit step.
 * Validates code against spec requirements for a single phase.
 */
export const PhaseAuditResultSchema = z.object({
  status: z.enum(['pass', 'warn', 'fail']).describe('Audit status for this phase'),
  issues_found: z.number().int().describe('Number of issues detected'),
  summary: z.string().describe('Brief summary of audit findings'),
})

/**
 * Status tracking for a single phase execution.
 * Includes retry attempts and outcome details.
 */
export const PhaseStatusSchema = z.object({
  phase_number: z.number().int().describe('Phase number (1-indexed)'),
  eng_status: z
    .enum(['success', 'failed', 'skipped'])
    .describe('Engineering step execution status'),
  audit_status: z.enum(['pass', 'warn', 'fail', 'skipped']).describe('Audit step execution status'),
  files_modified: z.array(z.string()).describe('Files modified during this phase'),
  retry_attempts: z.number().int().min(0).describe('Number of retry attempts for this phase'),
})

/**
 * Result from the final repository-wide audit.
 * Validates all changes integrate correctly.
 */
export const FinalAuditResultSchema = z.object({
  status: z.enum(['pass', 'warn', 'fail']).describe('Final audit status'),
  issues_found: z.number().int().describe('Number of issues detected'),
  summary: z.string().describe('Brief summary of final audit'),
})

/**
 * Result from the commit step.
 * Contains git commit details if successful.
 */
export const CommitResultSchema = z.object({
  committed: z.boolean().describe('Whether a commit was created'),
  commit_sha: z.string().nullable().describe('Git commit SHA if committed, null otherwise'),
  commit_message: z.string().nullable().describe('Commit message if committed, null otherwise'),
  files_changed: z.array(z.string()).describe('List of files included in the commit'),
})

// ---------------------------------------------------------------------------
// Sub-capability step input schemas
// ---------------------------------------------------------------------------

/**
 * Input for the phase engineering step.
 * Receives spec path, full phase plan, and current phase number.
 */
export const PhaseEngStepInputSchema = z.object({
  spec_path: z.string().min(1, 'spec_path is required').describe('Path to the spec file'),
  phase_plan: PhasePlanSchema.describe('Full phase plan from planner'),
  current_phase_number: z.number().int().min(1).describe('Current phase number to implement'),
  cwd: z.string().optional().describe('Working directory for tool execution'),
})

/**
 * Input for the phase audit step.
 * Receives spec path, phase number, files modified, and engineering summary.
 */
export const PhaseAuditStepInputSchema = z.object({
  spec_path: z.string().min(1, 'spec_path is required').describe('Path to the spec file'),
  phase_number: z.number().int().min(1).describe('Phase number that was implemented'),
  files_modified: z.array(z.string()).describe('Files modified during engineering step'),
  eng_summary: z.string().describe('Engineering summary from previous step'),
  cwd: z.string().optional().describe('Working directory for tool execution'),
})

/**
 * Input for the final audit step.
 * Receives spec path and all modified files across all phases.
 */
export const FinalAuditStepInputSchema = z.object({
  spec_path: z.string().min(1, 'spec_path is required').describe('Path to the spec file'),
  all_modified_files: z.array(z.string()).describe('All files modified across all phases'),
  cwd: z.string().optional().describe('Working directory for tool execution'),
})

/**
 * Input for the commit step.
 * Receives spec path, files changed, phase summaries, and final audit summary.
 */
export const CommitStepInputSchema = z.object({
  spec_path: z.string().min(1, 'spec_path is required').describe('Path to the spec file'),
  files_changed: z.array(z.string()).describe('All files to commit'),
  phase_summaries: z.array(z.string()).describe('Summaries from each phase'),
  final_audit_summary: z.string().describe('Summary from final audit'),
  cwd: z.string().optional().describe('Working directory for tool execution'),
  partial_run: z
    .boolean()
    .optional()
    .describe('Whether this is a partial run (not all phases completed)'),
  failure_context: z
    .string()
    .optional()
    .describe('Context about the failure if partial_run is true'),
})

// ---------------------------------------------------------------------------
// Top-level capability input/output
// ---------------------------------------------------------------------------

/**
 * Input schema for todo_code_writer capability.
 * Validates spec path, model selection, max phases, and working directory.
 */
export const TodoCodeWriterInputSchema = z.object({
  spec_path: z
    .string()
    .min(1, 'spec_path is required')
    .refine((s) => s.endsWith('.md'), 'spec_path must end in .md')
    .describe('Path to the spec markdown file to implement'),
  model: z
    .enum(['opus', 'sonnet', 'haiku'])
    .default('sonnet')
    .describe('Model to use for engineering steps'),
  max_phases: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(5)
    .describe('Maximum number of implementation phases (1-10)'),
  cwd: z
    .string()
    .optional()
    .describe('Working directory for tool execution (defaults to server cwd)'),
}) as z.ZodType<{
  spec_path: string
  model: 'opus' | 'sonnet' | 'haiku'
  max_phases: number
  cwd?: string
}>

/**
 * Output schema for todo_code_writer capability.
 * Defines the structure of the final implementation result.
 */
export const TodoCodeWriterOutputSchema = z.object({
  status: z.enum(['success', 'failed']).describe('Overall capability execution status'),
  phases_completed: z.number().int().min(0).max(10).describe('Number of phases actually completed'),
  final_audit_status: z.enum(['pass', 'warn', 'fail']).describe('Final audit result'),
  commit_sha: z
    .string()
    .nullable()
    .describe('Git commit SHA if changes were committed, null otherwise'),
  commit_message: z
    .string()
    .nullable()
    .describe('Commit message if changes were committed, null otherwise'),
  files_changed: z.array(z.string()).describe('List of files changed across all phases'),
  session_id: z
    .string()
    .optional()
    .describe('Unique session identifier for this invocation (injected by framework)'),
  failed_phase: z
    .number()
    .int()
    .nullable()
    .describe('Phase number where execution failed, null if no failure'),
  failure_reason: z
    .string()
    .nullable()
    .describe('Human-readable reason for failure, null if no failure'),
  phase_results: z.array(PhaseStatusSchema).describe('Detailed status for each phase executed'),
})

// ---------------------------------------------------------------------------
// Inferred TypeScript types
// ---------------------------------------------------------------------------

/** Top-level input type with defaults resolved. */
export type TodoCodeWriterInput = {
  spec_path: string
  model: 'opus' | 'sonnet' | 'haiku'
  max_phases: number
  cwd?: string
}

/** Top-level output type. */
export type TodoCodeWriterOutput = z.infer<typeof TodoCodeWriterOutputSchema>

/** Phase plan data contract. */
export type PhasePlan = z.infer<typeof PhasePlanSchema>

/** Individual phase definition. */
export type Phase = z.infer<typeof PhaseSchema>

/** Phase file definition. */
export type PhaseFile = z.infer<typeof PhaseFileSchema>

/** Engineering result data contract. */
export type PhaseEngResult = z.infer<typeof PhaseEngResultSchema>

/** Phase audit result data contract. */
export type PhaseAuditResult = z.infer<typeof PhaseAuditResultSchema>

/** Final audit result data contract. */
export type FinalAuditResult = z.infer<typeof FinalAuditResultSchema>

/** Commit result data contract. */
export type CommitResult = z.infer<typeof CommitResultSchema>

/** Phase status tracking data contract. */
export type PhaseStatus = z.infer<typeof PhaseStatusSchema>

/** Input for the phase engineering step. */
export type PhaseEngStepInput = z.infer<typeof PhaseEngStepInputSchema>

/** Input for the phase audit step. */
export type PhaseAuditStepInput = z.infer<typeof PhaseAuditStepInputSchema>

/** Input for the final audit step. */
export type FinalAuditStepInput = z.infer<typeof FinalAuditStepInputSchema>

/** Input for the commit step. */
export type CommitStepInput = z.infer<typeof CommitStepInputSchema>
