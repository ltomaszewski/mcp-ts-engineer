/**
 * Zod schemas for the audit-fix capability and its sub-capabilities.
 * Defines input/output contracts for the orchestrator and internal steps.
 */

import { z } from 'zod'

// ========================
// Input Schemas
// ========================

/**
 * Main capability input schema for audit-fix orchestrator.
 * Validates project (optional string), max_iteration_per_project (1-10, default 3),
 * max_total_cap (1-20, default 10), cwd (optional string),
 * skip_tests (boolean, default false), and spec_path (optional string).
 */
export const AuditFixInputSchema = z.object({
  project: z.string().optional(),
  max_iteration_per_project: z.number().int().min(1).max(10).default(3),
  max_total_cap: z.number().int().min(1).max(20).default(10),
  cwd: z.string().optional(),
  skip_tests: z.boolean().optional(),
  spec_path: z.string().optional(),
  exclude: z.array(z.string()).optional(),
}) as z.ZodType<{
  project?: string
  max_iteration_per_project: number
  max_total_cap: number
  cwd?: string
  skip_tests?: boolean
  spec_path?: string
  exclude?: string[]
}>

export type AuditFixInput = z.infer<typeof AuditFixInputSchema>

/**
 * AuditPlan schema - extracted from planner AI planning session.
 * Contains list of projects to audit with priority ordering.
 */
export const AuditPlanSchema = z.object({
  projects: z.array(
    z.object({
      path: z.string(),
      reason: z.string(),
      priority: z.number().int().min(1),
    }),
  ),
})

export type AuditPlan = z.infer<typeof AuditPlanSchema>

/**
 * TestStepInput schema - input for test step sub-capability.
 * Contains project path, workspaces to test, and optional working directory.
 */
export const TestStepInputSchema = z.object({
  project_path: z.string().min(1, 'project_path is required'),
  workspaces: z.array(z.string().min(1)).min(1, 'At least one workspace required'),
  cwd: z.string().optional(),
})

export type TestStepInput = z.infer<typeof TestStepInputSchema>

/**
 * TestResult schema - output from test step.
 * Contains test execution results: pass status, counts, summary, and workspaces tested.
 */
export const TestResultSchema = z.object({
  passed: z.boolean(),
  tests_total: z.number().int().nonnegative(),
  tests_failed: z.number().int().nonnegative(),
  failure_summary: z.string(),
  workspaces_tested: z.array(z.string()),
})

export type TestResult = z.infer<typeof TestResultSchema>

// ========================
// Inter-Session Data Contracts
// ========================

/**
 * AuditStepResult schema - output from audit step.
 * Extends finalize's AuditResult with files_with_issues field.
 * Contains audit status, fixes applied count, issues remaining,
 * TypeScript validation result, summary, and files with issues.
 */
export const AuditStepResultSchema = z.object({
  status: z.enum(['pass', 'warn', 'fail']),
  fixes_applied: z.number().int().nonnegative(),
  issues_remaining: z.number().int().nonnegative(),
  tsc_passed: z.boolean(),
  summary: z.string(),
  files_with_issues: z.array(z.string()),
})

export type AuditStepResult = z.infer<typeof AuditStepResultSchema>

/**
 * EngFixResult schema - output from eng-step.
 * Contains fix status, list of files modified, and summary.
 */
export const EngFixResultSchema = z.object({
  status: z.enum(['success', 'failed']),
  files_modified: z.array(z.string()),
  summary: z.string(),
})

export type EngFixResult = z.infer<typeof EngFixResultSchema>

/**
 * CommitResult schema - output from commit step.
 * Contains commit status, SHA, commit message, and files changed.
 */
export const CommitResultSchema = z.object({
  committed: z.boolean(),
  commit_sha: z.string().nullable(),
  commit_message: z.string().nullable(),
  files_changed: z.array(z.string()),
})

export type CommitResult = z.infer<typeof CommitResultSchema>

/**
 * ProjectResult schema - aggregated result for a single project.
 * Contains project path, iteration count, total fixes, final audit status,
 * files modified, commit SHA, summary, and optional tests_passed status.
 */
export const ProjectResultSchema = z.object({
  project_path: z.string(),
  iterations: z.number().int().nonnegative(),
  total_fixes: z.number().int().nonnegative(),
  final_audit_status: z.enum(['pass', 'warn', 'fail']),
  files_modified: z.array(z.string()),
  commit_sha: z.string().nullable(),
  summary: z.string(),
  tests_passed: z.boolean().nullable().optional(),
})

export type ProjectResult = z.infer<typeof ProjectResultSchema>

// ========================
// Sub-Capability Input Schemas
// ========================

/**
 * AuditStepInput schema - input for audit sub-capability.
 * Contains project path to audit and optional working directory.
 */
export const AuditStepInputSchema = z.object({
  project_path: z.string(),
  cwd: z.string().optional(),
})

export type AuditStepInput = z.infer<typeof AuditStepInputSchema>

/**
 * EngStepInput schema - input for eng-step sub-capability.
 * Contains project path, audit summary, files with issues,
 * iteration number, optional working directory, optional test failure summary,
 * and optional spec path.
 */
export const EngStepInputSchema = z.object({
  project_path: z.string(),
  audit_summary: z.string(),
  files_with_issues: z.array(z.string()),
  iteration_number: z.number().int().positive(),
  cwd: z.string().optional(),
  test_failure_summary: z.string().optional(),
  spec_path: z.string().optional(),
})

export type EngStepInput = z.infer<typeof EngStepInputSchema>

/**
 * CommitStepInput schema - input for commit sub-capability.
 * Contains project path, files changed, audit summary, and cwd.
 */
export const CommitStepInputSchema = z.object({
  project_path: z.string(),
  files_changed: z.array(z.string()),
  audit_summary: z.string(),
  cwd: z.string().optional(),
})

export type CommitStepInput = z.infer<typeof CommitStepInputSchema>

// ========================
// Output Schema
// ========================

/**
 * AuditFixOutput schema - final output from audit-fix orchestrator.
 * Aggregates results from all projects: status, projects audited,
 * total iterations, per-project results, summary, and optional session ID.
 */
export const AuditFixOutputSchema = z.object({
  status: z.enum(['success', 'partial', 'failed']),
  projects_audited: z.number().int().nonnegative(),
  total_iterations: z.number().int().nonnegative(),
  project_results: z.array(ProjectResultSchema),
  summary: z.string(),
  session_id: z
    .string()
    .optional()
    .describe('Unique session identifier for this invocation (injected by framework)'),
})

export type AuditFixOutput = z.infer<typeof AuditFixOutputSchema>

// ========================
// Lint Step Schemas
// ========================

/**
 * LintScanInput schema - input for lint scan sub-capability.
 * Contains project path to scan and optional working directory.
 */
export const LintScanInputSchema = z.object({
  project_path: z.string().min(1, 'project_path is required'),
  cwd: z.string().optional(),
})

export type LintScanInput = z.infer<typeof LintScanInputSchema>

/**
 * LintScanResult schema - output from lint scan step.
 * Contains lint availability status, pass status, error/warning counts,
 * full lint report, and files with lint errors.
 */
export const LintScanResultSchema = z.object({
  lint_available: z.boolean(),
  lint_passed: z.boolean(),
  error_count: z.number().int().nonnegative(),
  warning_count: z.number().int().nonnegative(),
  lint_report: z.string(),
  files_with_lint_errors: z.array(z.string()),
})

export type LintScanResult = z.infer<typeof LintScanResultSchema>

/**
 * LintFixInput schema - input for lint fix sub-capability.
 * Contains project path, lint report, files with errors, and optional cwd.
 */
export const LintFixInputSchema = z.object({
  project_path: z.string().min(1),
  lint_report: z.string(),
  files_with_lint_errors: z.array(z.string()),
  cwd: z.string().optional(),
})

export type LintFixInput = z.infer<typeof LintFixInputSchema>

/**
 * LintFixResult schema - output from lint fix step.
 * Contains fix status, files modified, and summary.
 */
export const LintFixResultSchema = z.object({
  status: z.enum(['success', 'failed']),
  files_modified: z.array(z.string()),
  summary: z.string(),
})

export type LintFixResult = z.infer<typeof LintFixResultSchema>

// ========================
// Deps Step Schemas
// ========================

/**
 * VulnerabilitiesBySeverity schema - breakdown of vulnerabilities by severity level.
 * Contains counts for critical, high, moderate, and low severity vulnerabilities.
 */
export const VulnerabilitiesBySeveritySchema = z.object({
  critical: z.number().int().nonnegative(),
  high: z.number().int().nonnegative(),
  moderate: z.number().int().nonnegative(),
  low: z.number().int().nonnegative(),
})

export type VulnerabilitiesBySeverity = z.infer<typeof VulnerabilitiesBySeveritySchema>

/**
 * DepsScanStepInput schema - input for deps scan sub-capability.
 * Contains project path to scan and optional working directory.
 */
export const DepsScanStepInputSchema = z.object({
  project_path: z.string().min(1, 'project_path is required'),
  cwd: z.string().optional(),
})

export type DepsScanStepInput = z.infer<typeof DepsScanStepInputSchema>

/**
 * DepsScanStepResult schema - output from deps scan step.
 * Contains audit execution status, vulnerability counts, severity breakdown, and raw audit JSON.
 */
export const DepsScanStepResultSchema = z.object({
  audit_ran: z.boolean(),
  vulnerabilities_found: z.number().int().nonnegative(),
  vulnerabilities_by_severity: VulnerabilitiesBySeveritySchema,
  audit_json: z.string(),
})

export type DepsScanStepResult = z.infer<typeof DepsScanStepResultSchema>

/**
 * DepsFixStepInput schema - input for deps fix sub-capability.
 * Contains project path, vulnerabilities count from scan, and optional working directory.
 */
export const DepsFixStepInputSchema = z.object({
  project_path: z.string().min(1, 'project_path is required'),
  vulnerabilities_found: z.number().int().nonnegative(),
  cwd: z.string().optional(),
})

export type DepsFixStepInput = z.infer<typeof DepsFixStepInputSchema>

/**
 * DepsFixStepResult schema - output from deps fix step.
 * Contains fix execution status, counts of fixed/remaining vulnerabilities,
 * files modified, and summary.
 */
export const DepsFixStepResultSchema = z.object({
  fix_ran: z.boolean(),
  vulnerabilities_fixed: z.number().int().nonnegative(),
  vulnerabilities_remaining: z.number().int().nonnegative(),
  files_modified: z.array(z.string()),
  fix_summary: z.string(),
})

export type DepsFixStepResult = z.infer<typeof DepsFixStepResultSchema>
