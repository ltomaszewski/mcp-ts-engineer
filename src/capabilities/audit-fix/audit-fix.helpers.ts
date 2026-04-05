/**
 * Shared helper functions and constants for the audit-fix capability.
 *
 * Extracted to:
 * - Keep individual files under 300 lines
 * - Deduplicate constants used across sub-capabilities
 * - Enable direct unit testing of pure helpers
 *
 * @internal Exported for unit testing and sub-capability reuse
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readdirSync, statSync } from 'node:fs'
import { join } from 'node:path'
import type { CapabilityContext } from '../../core/capability-registry/capability-registry.types.js'
// Re-export shared utilities from core
import { parseJsonSafe, parseXmlBlock } from '../../core/utils/index.js'
import type {
  AuditPlan,
  AuditStepResult,
  CommitResult,
  DepsFixStepResult,
  DepsScanStepResult,
  EngFixResult,
  LintFixResult,
  LintScanResult,
  ProjectResult,
  TestResult,
} from './audit-fix.schema.js'
import { AuditPlanSchema } from './audit-fix.schema.js'
export { parseJsonSafe, parseXmlBlock }

// ---------------------------------------------------------------------------
// Default fallback values (shared across orchestrator + sub-capabilities)
// ---------------------------------------------------------------------------

/** Default AuditStepResult returned when AI output cannot be parsed. */
export const AUDIT_STEP_RESULT_FALLBACK: AuditStepResult = {
  status: 'fail',
  fixes_applied: 0,
  issues_remaining: 0,
  tsc_passed: false,
  summary: 'Failed to parse audit output',
  files_with_issues: [],
}

/** Default EngFixResult returned when AI output cannot be parsed. */
export const ENG_FIX_RESULT_FALLBACK: EngFixResult = {
  status: 'failed',
  files_modified: [],
  summary: 'Failed to parse engineering output',
}

/** Default CommitResult returned when AI output cannot be parsed. */
export const COMMIT_RESULT_FALLBACK: CommitResult = {
  committed: false,
  commit_sha: null,
  commit_message: null,
  files_changed: [],
}

/** Default TestResult returned when AI output cannot be parsed. */
export const TEST_RESULT_FALLBACK: TestResult = {
  passed: false,
  tests_total: 0,
  tests_failed: 0,
  failure_summary: 'Failed to parse test output',
  workspaces_tested: [],
}

/** Default LintScanResult returned when AI output cannot be parsed. */
export const LINT_SCAN_RESULT_FALLBACK: LintScanResult = {
  lint_available: false,
  lint_passed: false,
  error_count: 0,
  warning_count: 0,
  lint_report: '',
  files_with_lint_errors: [],
}

/** Default LintFixResult returned when AI output cannot be parsed. */
export const LINT_FIX_RESULT_FALLBACK: LintFixResult = {
  status: 'failed',
  files_modified: [],
  summary: 'Failed to parse lint fix output',
}

/** Default DepsScanStepResult returned when AI output cannot be parsed. */
export const DEPS_SCAN_STEP_RESULT_FALLBACK: DepsScanStepResult = {
  audit_ran: false,
  vulnerabilities_found: 0,
  vulnerabilities_by_severity: {
    critical: 0,
    high: 0,
    moderate: 0,
    low: 0,
  },
  audit_json: '',
}

/** Default DepsFixStepResult returned when AI output cannot be parsed. */
export const DEPS_FIX_STEP_RESULT_FALLBACK: DepsFixStepResult = {
  fix_ran: false,
  vulnerabilities_fixed: 0,
  vulnerabilities_remaining: 0,
  files_modified: [],
  fix_summary: 'Failed to parse deps fix output',
}

// ---------------------------------------------------------------------------
// Submodule detection
// ---------------------------------------------------------------------------

/**
 * Detects git submodule paths via `git submodule status`.
 * Uses execFileSync (no shell) to avoid injection risks.
 *
 * @param cwd - Working directory to run git from
 * @returns Array of relative submodule paths (e.g. ['packages/mcp-ts-engineer'])
 */
export function detectSubmodules(cwd: string | undefined): string[] {
  if (!cwd) return []

  try {
    const output = execFileSync('git', ['submodule', 'status'], {
      cwd,
      timeout: 10_000,
      encoding: 'utf-8',
    })

    return output
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => {
        // Format: " <sha> <path> (<ref>)" or "-<sha> <path>" or "+<sha> <path>"
        const parts = line.trim().split(/\s+/)
        return parts[1] ?? ''
      })
      .filter((p) => p.length > 0)
  } catch {
    return []
  }
}

// ---------------------------------------------------------------------------
// Project discovery
// ---------------------------------------------------------------------------

/**
 * Discovers projects in apps/ and packages/ directories.
 * Returns a list of projects that have package.json files.
 * Filters out excluded paths (explicit + auto-detected submodules).
 *
 * @param cwd - Working directory to search from (root of monorepo)
 * @param exclude - Explicit paths to exclude from discovery
 * @returns List of discovered projects with path, reason, and priority
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: directory scanning with nested conditions
export function discoverProjects(
  cwd: string | undefined,
  exclude?: string[],
): AuditPlan['projects'] {
  if (!cwd) {
    return []
  }

  // Merge explicit excludes with auto-detected submodules
  const submodules = detectSubmodules(cwd)
  const excludeSet = new Set([...(exclude ?? []), ...submodules])

  const projects: AuditPlan['projects'] = []

  try {
    // Scan apps/ directory
    const appsPath = join(cwd, 'apps')
    if (existsSync(appsPath)) {
      const apps = readdirSync(appsPath)
      for (const app of apps) {
        const appPath = join(appsPath, app)
        const relativePath = `apps/${app}`
        const stats = statSync(appPath)
        if (
          stats.isDirectory() &&
          existsSync(join(appPath, 'package.json')) &&
          !excludeSet.has(relativePath)
        ) {
          projects.push({
            path: relativePath,
            reason: 'Discovered TypeScript project in apps/',
            priority: 1,
          })
        }
      }
    }

    // Scan packages/ directory
    const packagesPath = join(cwd, 'packages')
    if (existsSync(packagesPath)) {
      const packages = readdirSync(packagesPath)
      for (const pkg of packages) {
        const pkgPath = join(packagesPath, pkg)
        const relativePath = `packages/${pkg}`
        const stats = statSync(pkgPath)
        if (
          stats.isDirectory() &&
          existsSync(join(pkgPath, 'package.json')) &&
          !excludeSet.has(relativePath)
        ) {
          projects.push({
            path: relativePath,
            reason: 'Discovered TypeScript project in packages/',
            priority: 2,
          })
        }
      }
    }
  } catch {
    // Return empty array on any error (directory doesn't exist, permission issues, etc.)
    return []
  }

  return projects
}

// ---------------------------------------------------------------------------
// Orchestration helpers (used by audit-fix.capability.ts)
// ---------------------------------------------------------------------------

/** Parse the audit plan from the planner AI response. */
export function parseAuditPlan(content: string): AuditPlan {
  const planXml = parseXmlBlock(content, 'audit_plan')
  if (planXml) {
    return parseJsonSafe(planXml, AuditPlanSchema, { projects: [] })
  }
  return { projects: [] }
}

/** Invoke the audit sub-capability for a project. */
export async function invokeAuditStep(
  projectPath: string,
  cwd: string | undefined,
  context: CapabilityContext,
): Promise<AuditStepResult> {
  return (await context.invokeCapability('audit_fix_audit_step', {
    project_path: projectPath,
    cwd,
  })) as AuditStepResult
}

/** Invoke the eng fix sub-capability for a project. */
export async function invokeEngStep(
  projectPath: string,
  auditSummary: string,
  filesWithIssues: string[],
  iterationNumber: number,
  cwd: string | undefined,
  context: CapabilityContext,
  testFailureSummary?: string,
  specPath?: string,
): Promise<EngFixResult> {
  return (await context.invokeCapability('audit_fix_eng_step', {
    project_path: projectPath,
    audit_summary: auditSummary,
    files_with_issues: filesWithIssues,
    iteration_number: iterationNumber,
    cwd,
    test_failure_summary: testFailureSummary,
    spec_path: specPath,
  })) as EngFixResult
}

/** Invoke the commit sub-capability for a project. */
export async function invokeCommitStep(
  projectPath: string,
  filesChanged: string[],
  auditSummary: string,
  cwd: string | undefined,
  context: CapabilityContext,
): Promise<CommitResult> {
  return (await context.invokeCapability('audit_fix_commit_step', {
    project_path: projectPath,
    files_changed: filesChanged,
    audit_summary: auditSummary,
    cwd,
  })) as CommitResult
}

/** Invoke the lint scan sub-capability for a project. */
export async function invokeLintScanStep(
  projectPath: string,
  cwd: string | undefined,
  context: CapabilityContext,
): Promise<LintScanResult> {
  return (await context.invokeCapability('audit_fix_lint_scan_step', {
    project_path: projectPath,
    cwd,
  })) as LintScanResult
}

/** Invoke the lint fix sub-capability for a project. */
export async function invokeLintFixStep(
  projectPath: string,
  lintReport: string,
  filesWithLintErrors: string[],
  cwd: string | undefined,
  context: CapabilityContext,
): Promise<LintFixResult> {
  return (await context.invokeCapability('audit_fix_lint_fix_step', {
    project_path: projectPath,
    lint_report: lintReport,
    files_with_lint_errors: filesWithLintErrors,
    cwd,
  })) as LintFixResult
}

/** Invoke the deps scan sub-capability for a project. */
export async function invokeDepsScanStep(
  projectPath: string,
  cwd: string | undefined,
  context: CapabilityContext,
): Promise<DepsScanStepResult> {
  return (await context.invokeCapability('audit_fix_deps_scan_step', {
    project_path: projectPath,
    cwd,
  })) as DepsScanStepResult
}

/** Invoke the deps fix sub-capability for a project. */
export async function invokeDepsFixStep(
  projectPath: string,
  vulnerabilitiesFound: number,
  cwd: string | undefined,
  context: CapabilityContext,
): Promise<DepsFixStepResult> {
  return (await context.invokeCapability('audit_fix_deps_fix_step', {
    project_path: projectPath,
    vulnerabilities_found: vulnerabilitiesFound,
    cwd,
  })) as DepsFixStepResult
}

/** Determine overall status from project results. */
export function determineOverallStatus(
  projectResults: ProjectResult[],
): 'success' | 'partial' | 'failed' {
  if (projectResults.length === 0) {
    return 'failed'
  }

  const passCount = projectResults.filter((r) => r.final_audit_status === 'pass').length

  if (passCount === projectResults.length) {
    return 'success'
  }
  if (passCount > 0) {
    return 'partial'
  }
  return 'failed'
}

/** Build summary string from project results. */
export function buildSummary(projectResults: ProjectResult[], totalIterations: number): string {
  const passCount = projectResults.filter((r) => r.final_audit_status === 'pass').length
  const totalProjects = projectResults.length

  return `Audited ${totalProjects} project(s) in ${totalIterations} total iteration(s). ${passCount}/${totalProjects} passed.`
}

// Re-export process project functions from extracted file
export {
  deriveWorkspacesFromProject,
  invokeTestStep,
  processProject,
} from './audit-fix-process-project.js'
