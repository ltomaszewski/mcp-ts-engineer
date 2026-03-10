/**
 * Process project orchestration logic for audit-fix capability.
 * Extracted from audit-fix.helpers.ts to keep files under 300 lines.
 *
 * Contains the main processProject loop and related helper functions.
 *
 * @internal Exported for audit-fix orchestrator use
 */

import type { CapabilityContext } from '../../core/capability-registry/capability-registry.types.js'
import {
  AUDIT_STEP_RESULT_FALLBACK,
  DEPS_FIX_STEP_RESULT_FALLBACK,
  DEPS_SCAN_STEP_RESULT_FALLBACK,
  invokeAuditStep,
  invokeCommitStep,
  invokeDepsFixStep,
  invokeDepsScanStep,
  invokeEngStep,
  invokeLintFixStep,
  invokeLintScanStep,
  LINT_SCAN_RESULT_FALLBACK,
} from './audit-fix.helpers.js'
import type {
  AuditStepResult,
  CommitResult,
  DepsFixStepResult,
  DepsScanStepResult,
  LintScanResult,
  ProjectResult,
  TestResult,
} from './audit-fix.schema.js'

/**
 * Derives workspace list from project path for test execution.
 * Currently returns the project path itself as the single workspace.
 * Can be enhanced to detect sub-workspaces within a project.
 */
export function deriveWorkspacesFromProject(projectPath: string): string[] {
  return [projectPath]
}

/**
 * Invokes the test step sub-capability for a project.
 * Executes tests in the specified workspaces and returns aggregated results.
 */
export async function invokeTestStep(
  projectPath: string,
  workspaces: string[],
  cwd: string | undefined,
  context: CapabilityContext,
): Promise<TestResult> {
  return (await context.invokeCapability('audit_fix_test_step', {
    project_path: projectPath,
    workspaces,
    cwd,
  })) as TestResult
}

/**
 * Process a single project through the audit -> fix loop.
 * Returns the ProjectResult and the number of iterations consumed.
 */
// biome-ignore lint/complexity/noExcessiveCognitiveComplexity: orchestration logic with multiple phases
export async function processProject(
  projectPath: string,
  maxIterPerProject: number,
  remainingCap: number,
  cwd: string | undefined,
  context: CapabilityContext,
  specPath: string | undefined,
): Promise<{ result: ProjectResult; iterationsUsed: number }> {
  let projectIterations = 0
  const allFilesModified: string[] = []
  let totalFixes = 0
  let lastAuditResult: AuditStepResult = AUDIT_STEP_RESULT_FALLBACK
  let lastTestResult: TestResult | null = null

  try {
    // PHASE 1: DEPS (first - before any other steps)
    // --------------------------------------------------
    let depsScanResult: DepsScanStepResult = DEPS_SCAN_STEP_RESULT_FALLBACK
    try {
      depsScanResult = await invokeDepsScanStep(projectPath, cwd, context)
    } catch {
      // Non-blocking: continue with fallback if deps scan fails
      depsScanResult = DEPS_SCAN_STEP_RESULT_FALLBACK
    }

    // Only run deps fix if audit ran AND vulnerabilities found
    if (depsScanResult.audit_ran && depsScanResult.vulnerabilities_found > 0) {
      let depsFixResult: DepsFixStepResult = DEPS_FIX_STEP_RESULT_FALLBACK
      try {
        depsFixResult = await invokeDepsFixStep(
          projectPath,
          depsScanResult.vulnerabilities_found,
          cwd,
          context,
        )
        // Track modified files (prefixed with projectPath)
        allFilesModified.push(...depsFixResult.files_modified.map((f) => `${projectPath}/${f}`))
      } catch {
        // Non-blocking: deps fix failure doesn't stop workflow
      }
    }

    // PHASE 2: LINT (after deps, before audit)
    // --------------------------------------------------
    let lintScanResult: LintScanResult = LINT_SCAN_RESULT_FALLBACK
    try {
      lintScanResult = await invokeLintScanStep(projectPath, cwd, context)
    } catch {
      // Non-blocking: continue with fallback if lint scan fails
      lintScanResult = LINT_SCAN_RESULT_FALLBACK
    }

    // Only run lint fix if lint is available AND failed
    if (lintScanResult.lint_available && !lintScanResult.lint_passed) {
      try {
        const lintFixResult = await invokeLintFixStep(
          projectPath,
          lintScanResult.lint_report,
          lintScanResult.files_with_lint_errors,
          cwd,
          context,
        )
        allFilesModified.push(...lintFixResult.files_modified)
      } catch {
        // Non-blocking: lint fix failure doesn't stop audit
      }
    }

    // PHASE 3: AUDIT (separate - no lint data mixed in)
    // --------------------------------------------------
    while (projectIterations < maxIterPerProject && projectIterations < remainingCap) {
      const auditResult = await invokeAuditStep(projectPath, cwd, context)
      lastAuditResult = auditResult

      // Run tests
      const workspaces = deriveWorkspacesFromProject(projectPath)
      const testResult = await invokeTestStep(projectPath, workspaces, cwd, context)
      lastTestResult = testResult

      // Early exit if audit passes and tests pass
      if (
        auditResult.status === 'pass' &&
        auditResult.issues_remaining === 0 &&
        testResult.passed
      ) {
        break
      }

      const engResult = await invokeEngStep(
        projectPath,
        auditResult.summary,
        auditResult.files_with_issues,
        projectIterations + 1,
        cwd,
        context,
        testResult?.failure_summary,
        specPath,
      )

      if (engResult.files_modified.length === 0) {
        break
      }

      allFilesModified.push(...engResult.files_modified)
      totalFixes += auditResult.fixes_applied
      projectIterations++
    }

    let commitResult: CommitResult | null = null
    if (allFilesModified.length > 0) {
      commitResult = await invokeCommitStep(
        projectPath,
        [...new Set(allFilesModified)],
        lastAuditResult.summary,
        cwd,
        context,
      )
    }

    return {
      result: {
        project_path: projectPath,
        iterations: projectIterations,
        total_fixes: totalFixes,
        final_audit_status: lastAuditResult.status,
        files_modified: [...new Set(allFilesModified)],
        commit_sha: commitResult?.commit_sha ?? null,
        summary: lastAuditResult.summary,
        tests_passed: lastTestResult?.passed ?? null,
      },
      iterationsUsed: projectIterations,
    }
  } catch (error) {
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      result: {
        project_path: projectPath,
        iterations: projectIterations,
        total_fixes: totalFixes,
        final_audit_status: 'fail',
        files_modified: [...new Set(allFilesModified)],
        commit_sha: null,
        summary: `Error during audit-fix: ${errorMsg}`,
        tests_passed: lastTestResult?.passed ?? null,
      },
      iterationsUsed: projectIterations,
    }
  }
}
