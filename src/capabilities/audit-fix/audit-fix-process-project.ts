/**
 * Process project orchestration logic for audit-fix capability.
 * Extracted from audit-fix.helpers.ts to keep files under 300 lines.
 *
 * Contains the main processProject loop and related helper functions.
 *
 * @internal Exported for audit-fix orchestrator use
 */

import { execFileSync } from 'node:child_process'
import { AUDIT_FIX_PROJECT_TIMEOUT_MS } from '../../config/constants.js'
import type { CapabilityContext } from '../../core/capability-registry/capability-registry.types.js'
import { isFatalError } from '../../core/errors.js'
import {
  AUDIT_STEP_RESULT_FALLBACK,
  DEPS_FIX_STEP_RESULT_FALLBACK,
  DEPS_SCAN_STEP_RESULT_FALLBACK,
  ENG_FIX_RESULT_FALLBACK,
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
  EngFixResult,
  LintScanResult,
  ProjectResult,
  TestResult,
} from './audit-fix.schema.js'

/** Maximum retries for eng step when agent dies (e.g. context compaction) */
const MAX_ENG_RETRIES = 1

/** Check wall-clock timeout and throw if exceeded */
function checkProjectTimeout(projectStartTime: number, projectPath: string): void {
  const elapsed = Date.now() - projectStartTime
  if (elapsed > AUDIT_FIX_PROJECT_TIMEOUT_MS) {
    throw new Error(
      `Project ${projectPath} exceeded ${AUDIT_FIX_PROJECT_TIMEOUT_MS / 60_000}min wall-clock limit (elapsed: ${Math.round(elapsed / 60_000)}min)`,
    )
  }
}

/** Log error context and re-throw if fatal */
function handleStepError(
  error: unknown,
  projectPath: string,
  phase: string,
  step: string,
  projectStartTime: number,
): void {
  const elapsed = Math.round((Date.now() - projectStartTime) / 1000)
  const msg = error instanceof Error ? error.message : String(error)
  // Structured WARN log to stderr (no logger available in processProject scope)
  process.stderr.write(
    JSON.stringify({
      level: 'WARN',
      msg: `audit-fix step error: ${msg}`,
      project: projectPath,
      phase,
      step,
      elapsed_s: elapsed,
    }) + '\n',
  )
  if (isFatalError(error)) throw error
}

/**
 * Detects files changed on disk via git, independent of agent self-reporting.
 * Catches both tracked modifications and untracked new files within a project.
 */
function detectChangedFiles(cwd: string, projectPath: string): string[] {
  try {
    const diffOutput = execFileSync('git', ['diff', '--name-only', 'HEAD', '--', projectPath], {
      cwd,
      encoding: 'utf-8',
      timeout: 10_000,
    }).trim()

    const untrackedOutput = execFileSync(
      'git',
      ['ls-files', '--others', '--exclude-standard', '--', projectPath],
      { cwd, encoding: 'utf-8', timeout: 10_000 },
    ).trim()

    const files = [
      ...diffOutput.split('\n').filter(Boolean),
      ...untrackedOutput.split('\n').filter(Boolean),
    ]
    return [...new Set(files)]
  } catch {
    return []
  }
}

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
  let depsFixCount = 0
  let lintFixCount = 0

  const projectStartTime = Date.now()

  try {
    // PHASE 1: DEPS (first - before any other steps)
    // --------------------------------------------------
    checkProjectTimeout(projectStartTime, projectPath)
    let depsScanResult: DepsScanStepResult = DEPS_SCAN_STEP_RESULT_FALLBACK
    try {
      depsScanResult = await invokeDepsScanStep(projectPath, cwd, context)
    } catch (error) {
      handleStepError(error, projectPath, 'deps', 'deps_scan', projectStartTime)
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
        // Track modified files (prefixed with projectPath) and fix count
        allFilesModified.push(...depsFixResult.files_modified.map((f) => `${projectPath}/${f}`))
        depsFixCount += depsFixResult.vulnerabilities_fixed
      } catch (error) {
        handleStepError(error, projectPath, 'deps', 'deps_fix', projectStartTime)
      }
    }

    // PHASE 2: LINT (after deps, before audit)
    // --------------------------------------------------
    checkProjectTimeout(projectStartTime, projectPath)
    let lintScanResult: LintScanResult = LINT_SCAN_RESULT_FALLBACK
    try {
      lintScanResult = await invokeLintScanStep(projectPath, cwd, context)
    } catch (error) {
      handleStepError(error, projectPath, 'lint', 'lint_scan', projectStartTime)
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
        lintFixCount += lintFixResult.files_modified.length
      } catch (error) {
        handleStepError(error, projectPath, 'lint', 'lint_fix', projectStartTime)
      }
    }

    // PHASE 3: AUDIT (separate - no lint data mixed in)
    // --------------------------------------------------
    while (projectIterations < maxIterPerProject && projectIterations < remainingCap) {
      checkProjectTimeout(projectStartTime, projectPath)

      projectIterations++

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

      // Eng step with retry + git diff recovery
      let engResult: EngFixResult = ENG_FIX_RESULT_FALLBACK
      for (let attempt = 0; attempt <= MAX_ENG_RETRIES; attempt++) {
        try {
          engResult = await invokeEngStep(
            projectPath,
            auditResult.summary,
            auditResult.files_with_issues,
            projectIterations,
            cwd,
            context,
            testResult?.failure_summary,
            specPath,
          )

          if (engResult.files_modified.length > 0) break

          // Agent returned empty — recover via git diff (e.g. after context compaction)
          if (cwd) {
            const gitFiles = detectChangedFiles(cwd, projectPath)
            if (gitFiles.length > 0) {
              engResult = {
                status: 'success',
                files_modified: gitFiles,
                summary: `${engResult.summary} [recovered ${gitFiles.length} file(s) via git diff]`,
              }
              break
            }
          }

          if (attempt < MAX_ENG_RETRIES) {
            await new Promise((r) => setTimeout(r, 1000))
          }
        } catch (error) {
          handleStepError(error, projectPath, 'audit', 'eng_fix', projectStartTime)
          if (attempt < MAX_ENG_RETRIES) {
            await new Promise((r) => setTimeout(r, 1000))
          }
        }
      }

      if (engResult.files_modified.length === 0) {
        break
      }

      allFilesModified.push(...engResult.files_modified)
      totalFixes += auditResult.fixes_applied
    }

    // Deterministic commit: merge AI-reported files with actual git changes
    let commitFiles = [...new Set(allFilesModified)]
    if (cwd) {
      const gitChangedFiles = detectChangedFiles(cwd, projectPath)
      if (gitChangedFiles.length > 0) {
        commitFiles = [...new Set([...commitFiles, ...gitChangedFiles])]
      }
    }

    let commitResult: CommitResult | null = null
    if (commitFiles.length > 0) {
      commitResult = await invokeCommitStep(
        projectPath,
        commitFiles,
        lastAuditResult.summary,
        cwd,
        context,
      )
    }

    const allPhaseFixes = totalFixes + depsFixCount + lintFixCount

    return {
      result: {
        project_path: projectPath,
        iterations: projectIterations,
        total_fixes: allPhaseFixes,
        final_audit_status: lastAuditResult.status,
        files_modified: commitResult?.files_changed ?? [...new Set(commitFiles)],
        commit_sha: commitResult?.commit_sha ?? null,
        summary: lastAuditResult.summary,
        tests_passed: lastTestResult?.passed ?? null,
      },
      iterationsUsed: projectIterations,
    }
  } catch (error) {
    // CRITICAL: re-throw fatal errors before building fallback result
    if (isFatalError(error)) throw error

    const allPhaseFixes = totalFixes + depsFixCount + lintFixCount
    const errorMsg = error instanceof Error ? error.message : String(error)
    return {
      result: {
        project_path: projectPath,
        iterations: projectIterations,
        total_fixes: allPhaseFixes,
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
