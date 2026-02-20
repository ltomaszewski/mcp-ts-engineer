import { z } from "zod";

// ========================
// Input Schemas
// ========================

/**
 * Main capability input schema for finalize orchestrator.
 * Validates files_changed (required array of strings, min 1 item),
 * cwd (optional string), skip_tests (optional boolean, default false),
 * skip_codemaps (optional boolean, default false).
 */
export const FinalizeInputSchema = z.object({
  files_changed: z.array(z.string()).min(1, "files_changed must contain at least one file"),
  cwd: z.string().optional(),
  skip_tests: z.boolean().default(false),
  skip_codemaps: z.boolean().default(false),
  skip_readmes: z.boolean().default(false),
  spec_path: z.string().optional().describe("Path to the spec file to mark as IMPLEMENTED after successful finalization"),
}) as z.ZodType<{
  files_changed: string[];
  cwd?: string;
  skip_tests: boolean;
  skip_codemaps: boolean;
  skip_readmes: boolean;
  spec_path?: string;
}>;

export type FinalizeInput = z.infer<typeof FinalizeInputSchema>;

/**
 * FinalizePlan schema - extracted from orchestrator AI planning session.
 * Contains workspace list and codemap areas for downstream steps.
 */
export const FinalizePlanSchema = z.object({
  workspaces: z.array(z.string()),
  codemap_areas: z.array(z.string()),
});

export type FinalizePlan = z.infer<typeof FinalizePlanSchema>;

// ========================
// Inter-Session Data Contracts
// ========================

/**
 * AuditResult schema - output from audit step.
 * Contains audit status, fixes applied count, issues remaining,
 * TypeScript validation result, and summary.
 */
export const AuditResultSchema = z.object({
  status: z.enum(["pass", "warn", "fail"]),
  fixes_applied: z.number().int().nonnegative(),
  issues_remaining: z.number().int().nonnegative(),
  tsc_passed: z.boolean(),
  summary: z.string(),
});

export type AuditResult = z.infer<typeof AuditResultSchema>;

/**
 * TestResult schema - output from test step.
 * Contains test pass status, list of workspaces tested, and summary.
 */
export const TestResultSchema = z.object({
  passed: z.boolean(),
  workspaces_tested: z.array(z.string()),
  summary: z.string(),
});

export type TestResult = z.infer<typeof TestResultSchema>;

/**
 * CodemapResult schema - output from codemap step.
 * Contains update status, list of changed codemaps, and summary.
 */
export const CodemapResultSchema = z.object({
  updated: z.boolean(),
  codemaps_changed: z.array(z.string()),
  summary: z.string(),
});

export type CodemapResult = z.infer<typeof CodemapResultSchema>;

/**
 * ReadmeResult schema - output from readme step.
 * Contains update status, list of changed READMEs, and summary.
 */
export const ReadmeResultSchema = z.object({
  updated: z.boolean(),
  readmes_changed: z.array(z.string()),
  summary: z.string(),
});

export type ReadmeResult = z.infer<typeof ReadmeResultSchema>;

/**
 * FinalizeCommitResult schema - output from commit step.
 * Contains commit status, SHA, commit message, and files committed.
 */
export const FinalizeCommitResultSchema = z.object({
  committed: z.boolean(),
  commit_sha: z.string().nullable(),
  commit_message: z.string().nullable(),
  files_committed: z.array(z.string()),
});

export type FinalizeCommitResult = z.infer<typeof FinalizeCommitResultSchema>;

// ========================
// Sub-Capability Input Schemas
// ========================

/**
 * AuditStepInput schema - input for audit sub-capability.
 * Contains list of files to audit and optional working directory.
 */
export const AuditStepInputSchema = z.object({
  files_changed: z.array(z.string()).min(1),
  cwd: z.string().optional(),
});

export type AuditStepInput = z.infer<typeof AuditStepInputSchema>;

/**
 * TestStepInput schema - input for test sub-capability.
 * Contains list of workspaces to test and optional working directory.
 */
export const TestStepInputSchema = z.object({
  workspaces: z.array(z.string()).min(1),
  cwd: z.string().optional(),
});

export type TestStepInput = z.infer<typeof TestStepInputSchema>;

/**
 * CodemapStepInput schema - input for codemap sub-capability.
 * Contains list of files that changed and optional working directory.
 */
export const CodemapStepInputSchema = z.object({
  files_changed: z.array(z.string()).min(1),
  cwd: z.string().optional(),
});

export type CodemapStepInput = z.infer<typeof CodemapStepInputSchema>;

/**
 * ReadmeStepInput schema - input for readme sub-capability.
 * Contains list of files that changed and optional working directory.
 */
export const ReadmeStepInputSchema = z.object({
  files_changed: z.array(z.string()).min(1),
  cwd: z.string().optional(),
});

export type ReadmeStepInput = z.infer<typeof ReadmeStepInputSchema>;

/**
 * CommitStepInput schema - input for commit sub-capability.
 * Contains audit summary, codemap summary, list of affected files, and cwd.
 */
export const CommitStepInputSchema = z.object({
  audit_summary: z.string(),
  codemap_summary: z.string(),
  readme_summary: z.string().optional(),
  files_affected: z.array(z.string()),
  cwd: z.string().optional(),
});

export type CommitStepInput = z.infer<typeof CommitStepInputSchema>;

// ========================
// Output Schema
// ========================

/**
 * FinalizeOutput schema - final output from finalize orchestrator.
 * Aggregates results from all steps: audit, test, codemap, commit.
 * tests_passed and codemaps_updated are nullable (null if skipped).
 */
export const FinalizeOutputSchema = z.object({
  status: z.enum(["success", "failed"]),
  audit_status: z.enum(["pass", "warn", "fail"]),
  audit_fixes_applied: z.number().int().nonnegative(),
  audit_summary: z.string(),
  tests_passed: z.boolean().nullable(),
  tests_summary: z.string(),
  codemaps_updated: z.boolean().nullable(),
  codemaps_summary: z.string(),
  readmes_updated: z.boolean().nullable(),
  readmes_summary: z.string(),
  commit_sha: z.string().nullable(),
  commit_message: z.string().nullable(),
  session_id: z.string().optional().describe("Unique session identifier for this invocation (injected by framework)"),
});

export type FinalizeOutput = z.infer<typeof FinalizeOutputSchema>;
