/**
 * Zod schemas for todo-reviewer capability input, output, and inter-session data contracts.
 *
 * Defines validation schemas for:
 * - TodoReviewerInput: Top-level capability input
 * - ReviewSummary: Output from the spec review sub-capability
 * - TddSummary: Output from the TDD validation sub-capability
 * - CommitResult: Output from the commit sub-capability
 * - TddValidateStepInput: Input for TDD validation step
 * - CommitStepInput: Input for commit step
 * - TodoReviewerOutput: Final capability output
 */

import { z } from "zod";

// ---------------------------------------------------------------------------
// Sub-capability data contracts (inter-session)
// ---------------------------------------------------------------------------

/**
 * Summary produced by the spec review sub-capability.
 * Describes the quality and readiness of a specification.
 */
export const ReviewSummarySchema = z.object({
  status: z
    .enum(["READY", "IN_REVIEW", "BLOCKED"])
    .describe("Spec review status: READY (implementation complete), IN_REVIEW (reviewed, awaiting implementation), or BLOCKED"),
  spec_path: z.string().describe("Path to the reviewed spec file"),
  target_app: z
    .string()
    .describe("Target app or package the spec applies to"),
  corrections_applied: z
    .number()
    .int()
    .describe("Number of corrections applied to the spec"),
  blockers_remaining: z
    .number()
    .int()
    .describe("Number of unresolved blockers"),
  warnings: z.number().int().describe("Number of warnings found"),
  cross_app_status: z
    .enum(["READY", "BLOCKED", "N/A"])
    .describe("Cross-app consistency check status"),
  consistency_score: z
    .string()
    .describe("Human-readable consistency score (e.g. '8/10')"),
  key_findings: z
    .array(z.string())
    .describe("Summary of key findings from the review"),
  spec_modified: z
    .boolean()
    .describe("Whether the spec file was modified during review"),
});

/**
 * Summary produced by the TDD validation sub-capability.
 * Describes whether test stubs validate against the spec.
 */
export const TddSummarySchema = z.object({
  status: z
    .enum(["PASS", "FAIL", "WARN"])
    .describe("Overall TDD validation result"),
  details: z.string().describe("Human-readable explanation of the result"),
  issues_found: z
    .number()
    .int()
    .describe("Number of issues detected during validation"),
  spec_modified: z
    .boolean()
    .describe("Whether the spec was modified to fix TDD issues"),
});

/**
 * Individual TDD validation issue from scan step.
 */
export const TddIssueSchema = z.object({
  severity: z
    .enum(["CRITICAL", "HIGH", "MEDIUM", "WARN"])
    .describe("Issue severity: CRITICAL/HIGH block, MEDIUM/WARN don't"),
  title: z.string().describe("Brief description of the issue"),
  file_path: z
    .string()
    .optional()
    .describe("Affected file path if applicable"),
  details: z.string().describe("Explanation of the issue"),
  remediation: z.string().describe("Copy-paste fix template"),
});

/**
 * Scope boundary analysis from TDD scan step.
 */
export const ScopeAnalysisSchema = z.object({
  files_changed: z
    .number()
    .int()
    .min(0)
    .describe("Count from 'Files Changed' section"),
  tests_defined: z.number().int().min(0).describe("Total test files in spec"),
  tests_in_scope: z
    .number()
    .int()
    .min(0)
    .describe("Tests targeting changed files"),
  tests_out_of_scope: z
    .number()
    .int()
    .min(0)
    .describe("Tests targeting unchanged files"),
  justified_regression: z
    .number()
    .int()
    .min(0)
    .describe("Out-of-scope with documented justification"),
  unjustified_scope_creep: z
    .number()
    .int()
    .min(0)
    .describe("Out-of-scope without justification"),
  scope_verdict: z
    .enum(["CLEAN", "CREEP_DETECTED", "OVER_TESTED"])
    .describe("Overall scope boundary assessment"),
});

/**
 * Coverage adequacy analysis from TDD scan step.
 */
export const CoverageAnalysisSchema = z.object({
  coverage_target: z
    .string()
    .describe("Coverage target (e.g. '80%') or 'missing'"),
  coverage_explicit: z
    .boolean()
    .describe("Target is explicitly stated in spec"),
  fr_ec_total: z.number().int().min(0).describe("Total FR/EC count"),
  fr_ec_with_tests: z
    .number()
    .int()
    .min(0)
    .describe("FR/EC with mapped tests"),
  forward_traceability: z
    .enum(["complete", "gaps"])
    .describe("FR/EC → tests traceability"),
  backward_traceability: z
    .enum(["complete", "orphan_tests"])
    .describe("tests → FR/EC traceability"),
  test_scenarios: z.object({
    happy_path: z.boolean().describe("Happy path test exists"),
    edge_cases: z.number().int().min(0).describe("Edge case test count"),
    error_conditions: z
      .number()
      .int()
      .min(0)
      .describe("Error condition test count"),
  }),
  yagni_violations: z
    .number()
    .int()
    .min(0)
    .describe("Tests for library/framework internals"),
});

/**
 * Result from the TDD scan step (comprehensive validation).
 */
export const TddScanStepResultSchema = z.object({
  status: z
    .enum(["PASS", "FAIL", "WARN"])
    .describe("Overall TDD scan result"),
  scope_analysis: ScopeAnalysisSchema.describe("Scope boundary analysis"),
  coverage_analysis: CoverageAnalysisSchema.describe(
    "Coverage adequacy analysis",
  ),
  issues: z.array(TddIssueSchema).describe("List of detected issues"),
  spec_modified: z
    .boolean()
    .describe("Whether scan made any corrections"),
  needs_fix: z
    .boolean()
    .describe("True if CRITICAL or HIGH issues exist"),
  details: z.string().describe("Human-readable summary"),
});

/**
 * Input for the TDD scan step.
 */
export const TddScanStepInputSchema = z.object({
  spec_path: z
    .string()
    .min(1, "spec_path is required")
    .describe("Path to the spec file to scan"),
  review_summary: ReviewSummarySchema.describe(
    "Review summary from the preceding review step",
  ),
  cwd: z
    .string()
    .optional()
    .describe("Working directory for tool execution"),
});

/**
 * Input for the TDD fix step.
 */
export const TddFixStepInputSchema = z.object({
  spec_path: z
    .string()
    .min(1, "spec_path is required")
    .describe("Path to the spec file to fix"),
  scan_result: TddScanStepResultSchema.describe(
    "Scan result from the TDD scan step",
  ),
  cwd: z
    .string()
    .optional()
    .describe("Working directory for tool execution"),
});

/**
 * Result from the TDD fix step.
 */
export const TddFixStepResultSchema = z.object({
  status: z
    .enum(["success", "partial", "failed"])
    .describe("Fix operation status"),
  issues_fixed: z.number().int().min(0).describe("Number of issues fixed"),
  issues_remaining: z
    .number()
    .int()
    .min(0)
    .describe("Number of issues remaining"),
  spec_modified: z.boolean().describe("Whether spec was modified"),
  fix_summary: z.string().describe("Human-readable fix summary"),
});

/**
 * Result from the commit sub-capability.
 * Describes whether a commit was made and its details.
 */
export const CommitResultSchema = z.object({
  committed: z.boolean().describe("Whether a commit was created"),
  commit_sha: z
    .string()
    .nullable()
    .describe("Git commit SHA if committed, null otherwise"),
  commit_message: z
    .string()
    .nullable()
    .describe("Commit message if committed, null otherwise"),
  files_changed: z
    .array(z.string())
    .describe("List of files included in the commit"),
});

// ---------------------------------------------------------------------------
// Sub-capability step input schemas
// ---------------------------------------------------------------------------

/**
 * Input for the TDD validation step.
 * Receives the spec path and review summary from the previous step.
 */
export const TddValidateStepInputSchema = z.object({
  spec_path: z
    .string()
    .min(1, "spec_path is required")
    .describe("Path to the spec file to validate"),
  review_summary: ReviewSummarySchema.describe(
    "Review summary from the preceding review step",
  ),
  cwd: z
    .string()
    .optional()
    .describe("Working directory for tool execution"),
});

/**
 * Input for the commit step.
 * Receives the spec path, review summary, and TDD summary from previous steps.
 */
export const CommitStepInputSchema = z.object({
  spec_path: z
    .string()
    .min(1, "spec_path is required")
    .describe("Path to the spec file"),
  review_summary: ReviewSummarySchema.describe(
    "Review summary from the review step",
  ),
  tdd_summary: TddSummarySchema.describe(
    "TDD summary from the validation step",
  ),
  cwd: z
    .string()
    .optional()
    .describe("Working directory for tool execution"),
});

// ---------------------------------------------------------------------------
// Top-level capability input/output
// ---------------------------------------------------------------------------

/**
 * Input schema for todo_reviewer capability.
 * Validates spec path, model selection, and iteration count.
 */
export const TodoReviewerInputSchema = z.object({
  spec_path: z
    .string()
    .min(1, "spec_path is required")
    .refine((s) => s.endsWith(".md"), "spec_path must end in .md")
    .describe("Path to the spec markdown file to review"),
  model: z
    .enum(["opus", "sonnet"])
    .default("sonnet")
    .describe("Model to use for the review"),
  iterations: z
    .number()
    .int()
    .min(1)
    .max(10)
    .default(3)
    .describe("Number of review-TDD-validate cycles to run (1-10)"),
  cwd: z
    .string()
    .optional()
    .describe("Working directory for tool execution (defaults to server cwd)"),
}) as z.ZodType<{
  spec_path: string;
  model: "opus" | "sonnet";
  iterations: number;
  cwd?: string;
}>;

/**
 * Output schema for todo_reviewer capability.
 * Defines the structure of the final review result.
 */
export const TodoReviewerOutputSchema = z.object({
  status: z
    .enum(["success", "failed"])
    .describe("Overall capability execution status"),
  review_report: z
    .string()
    .describe("Human-readable review report from the last iteration"),
  tdd_report: z
    .string()
    .describe("Human-readable TDD validation report from the last iteration"),
  iterations_completed: z
    .number()
    .int()
    .min(1)
    .max(10)
    .describe("Number of review-TDD cycles actually completed"),
  commit_sha: z
    .string()
    .nullable()
    .describe("Git commit SHA if changes were committed, null otherwise"),
  commit_message: z
    .string()
    .nullable()
    .describe("Commit message if changes were committed, null otherwise"),
  files_changed: z
    .array(z.string())
    .describe("List of files changed across all iterations"),
  session_id: z.string().optional().describe("Unique session identifier for this invocation (injected by framework)"),
});

// ---------------------------------------------------------------------------
// Inferred TypeScript types
// ---------------------------------------------------------------------------

/** Top-level input type with defaults resolved. */
export type TodoReviewerInput = {
  spec_path: string;
  model: "opus" | "sonnet";
  iterations: number;
  cwd?: string;
};

// NOTE: Default model is "sonnet". Schema defaults apply when omitted by caller.

/** Top-level output type. */
export type TodoReviewerOutput = z.infer<typeof TodoReviewerOutputSchema>;

/** Review summary data contract. */
export type ReviewSummary = z.infer<typeof ReviewSummarySchema>;

/** TDD validation summary data contract. */
export type TddSummary = z.infer<typeof TddSummarySchema>;

/** Commit result data contract. */
export type CommitResult = z.infer<typeof CommitResultSchema>;

/** Input for the TDD validation step. */
export type TddValidateStepInput = z.infer<typeof TddValidateStepInputSchema>;

/** Input for the commit step. */
export type CommitStepInput = z.infer<typeof CommitStepInputSchema>;

/** TDD issue data contract. */
export type TddIssue = z.infer<typeof TddIssueSchema>;

/** Scope analysis data contract. */
export type ScopeAnalysis = z.infer<typeof ScopeAnalysisSchema>;

/** Coverage analysis data contract. */
export type CoverageAnalysis = z.infer<typeof CoverageAnalysisSchema>;

/** TDD scan step result data contract. */
export type TddScanStepResult = z.infer<typeof TddScanStepResultSchema>;

/** Input for the TDD scan step. */
export type TddScanStepInput = z.infer<typeof TddScanStepInputSchema>;

/** Input for the TDD fix step. */
export type TddFixStepInput = z.infer<typeof TddFixStepInputSchema>;

/** TDD fix step result data contract. */
export type TddFixStepResult = z.infer<typeof TddFixStepResultSchema>;
