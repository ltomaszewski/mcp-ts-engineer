/**
 * Orchestration helpers for the pr-reviewer capability.
 *
 * Extracted to enable:
 * - Unit testing of pure functions
 * - Separation of orchestration logic from capability definition
 * - Files under 300 lines
 *
 * @internal Exported for unit testing and capability reuse
 */

import { getProjectConfig } from '../../config/project-config.js'
import type { CapabilityContext } from '../../core/capability-registry/capability-registry.types.js'
import { generateIssueId } from '../../core/utils/issue-id.js'
import { parseReviewIssuesFromComment } from '../pr-fixer/pr-fixer.helpers.js'
import {
  chunkFiles,
  filterReviewableFiles,
  getDiffForFiles,
  splitDiffByFile,
} from './pr-reviewer.helpers.js'
import type {
  AggregateStepOutput,
  CleanupStepOutput,
  CommentStepOutput,
  CommitStepOutput,
  ContextStepOutput,
  FixStepOutput,
  PrContext,
  PreflightStepOutput,
  PrReviewerInput,
  PrReviewerOutput,
  ReviewIssue,
  ReviewStepOutput,
  TestStepOutput,
  ValidateStepOutput,
} from './pr-reviewer.schema.js'
import { ReviewIssueSchema } from './pr-reviewer.schema.js'
import { loadProjectContext } from './services/project-context-loader.js'

// ---------------------------------------------------------------------------
// Review phases
// ---------------------------------------------------------------------------

export type ReviewPhase =
  | 'preflight'
  | 'context'
  | 'review'
  | 'aggregate'
  | 'validate'
  | 'fix'
  | 'cleanup'
  | 'test'
  | 'commit'
  | 'comment'
  | 'done'

// ---------------------------------------------------------------------------
// Review state (accumulated across phases)
// ---------------------------------------------------------------------------

export interface ReviewState {
  prContext: PrContext | null
  worktreePath: string | null
  /** True only when the worktree was created by pr_reviewer (pr-*-review pattern). External worktrees must not be cleaned up. */
  worktreeOwnedByReviewer: boolean
  agentResults: ReviewStepOutput[]
  mergedIssues: ReviewIssue[]
  validatedIssues: ReviewIssue[]
  autoFixableIssues: ReviewIssue[]
  manualIssues: ReviewIssue[]
  fixesApplied: number
  fixesFailed: number
  issuesFixed: string[]
  testsPassed: boolean
  commitSha: string | null
  commentUrl: string
  budgetSpent: number
  phase: ReviewPhase
  /** Project-specific context string assembled by ProjectContextLoader for prompt injection */
  projectContextString: string
  /** Previous issues from prior review runs (for cross-run dedup in incremental mode) */
  previousIssues: ReviewIssue[]
  /** Review round counter (increments if previous state detected) */
  round: number
  /** HEAD SHA at time of review */
  headSha: string
}

// ---------------------------------------------------------------------------
// Pure helper functions (unit testable)
// ---------------------------------------------------------------------------

/**
 * Create initial review state.
 */
export function createInitialState(): ReviewState {
  return {
    prContext: null,
    worktreePath: null,
    worktreeOwnedByReviewer: false,
    agentResults: [],
    mergedIssues: [],
    validatedIssues: [],
    autoFixableIssues: [],
    manualIssues: [],
    fixesApplied: 0,
    fixesFailed: 0,
    issuesFixed: [],
    testsPassed: false,
    commitSha: null,
    commentUrl: '',
    budgetSpent: 0,
    phase: 'preflight',
    projectContextString: '',
    previousIssues: [],
    round: 1,
    headSha: '',
  }
}

/**
 * Get default budget. Always $10 (review-fix is the only mode).
 */
export function getDefaultBudget(_mode: string): number {
  return 10
}

/**
 * Determine if the budget has been exceeded.
 */
export function isOverBudget(state: ReviewState, budgetLimit: number): boolean {
  return state.budgetSpent >= budgetLimit
}

/**
 * Count issues by severity.
 */
export function countBySeverity(issues: ReviewIssue[]): {
  critical: number
  high: number
  medium: number
  low: number
} {
  return issues.reduce(
    (acc, issue) => {
      if (issue.severity === 'CRITICAL') acc.critical++
      else if (issue.severity === 'HIGH') acc.high++
      else if (issue.severity === 'MEDIUM') acc.medium++
      else if (issue.severity === 'LOW') acc.low++
      return acc
    },
    { critical: 0, high: 0, medium: 0, low: 0 },
  )
}

/**
 * Determine if a phase should be skipped based on state.
 * Mode is no longer used — skip logic is driven entirely by state.
 */
export function shouldSkipPhase(phase: ReviewPhase, state: ReviewState, _mode: string): boolean {
  switch (phase) {
    case 'fix':
      // Skip if no auto-fixable issues
      return state.autoFixableIssues.length === 0

    case 'cleanup':
      // Skip if no fixable issues existed
      return state.autoFixableIssues.length === 0

    case 'test':
      // Skip if no fixes were applied
      return state.fixesApplied === 0

    case 'commit':
      // Skip if no fixes were applied OR tests failed
      return state.fixesApplied === 0 || !state.testsPassed

    default:
      return false
  }
}

/**
 * Get the next phase based on current phase and state.
 *
 * Phase flow:
 * - preflight → context → review → aggregate → validate → fix → cleanup → test → commit → comment → done
 * - Skips fix/cleanup/test/commit if no auto-fixable issues or no fixes applied
 * - Worktree cleanup runs via catch/finally in runOrchestration (not as a phase)
 */
export function getNextPhase(current: ReviewPhase, mode: string, state: ReviewState): ReviewPhase {
  const phaseOrder: ReviewPhase[] = [
    'preflight',
    'context',
    'review',
    'aggregate',
    'validate',
    'fix',
    'cleanup',
    'test',
    'commit',
    'comment',
    'done',
  ]

  const currentIndex = phaseOrder.indexOf(current)
  if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) {
    return 'done'
  }

  // Find next non-skipped phase
  for (let i = currentIndex + 1; i < phaseOrder.length; i++) {
    const nextPhase = phaseOrder[i]
    if (!shouldSkipPhase(nextPhase, state, mode)) {
      return nextPhase
    }
  }

  return 'done'
}

// ---------------------------------------------------------------------------
// Orchestration helper (with side effects)
// ---------------------------------------------------------------------------

/**
 * Main orchestration loop that chains step capabilities.
 *
 * Pattern:
 * 1. Initialize state
 * 2. Loop through phases until "done"
 * 3. Invoke appropriate capability for each phase
 * 4. Update state based on results
 * 5. Check budget before each phase
 * 6. Always run revert phase (cleanup) even on errors
 *
 * @returns Final PR reviewer output
 */
export async function runOrchestration(
  input: PrReviewerInput,
  context: CapabilityContext,
): Promise<PrReviewerOutput> {
  const state = createInitialState()
  const budgetLimit = input.budget ?? getDefaultBudget(input.mode)

  try {
    while (state.phase !== 'done') {
      // Budget check before each phase
      if (isOverBudget(state, budgetLimit)) {
        context.logger.warn('Budget exceeded, stopping early', {
          budgetSpent: state.budgetSpent,
          budgetLimit,
          phase: state.phase,
        })
        break
      }

      // Execute current phase
      await executePhase(state, input, context)

      // Sync budget from real session cost (covers all sub-capability AI calls)
      state.budgetSpent = context.getSessionCost().totalCostUsd

      // Move to next phase
      state.phase = getNextPhase(state.phase, input.mode, state)
    }
  } catch (error) {
    context.logger.error('Orchestration error', {
      error: error instanceof Error ? error.message : String(error),
      errorName: error instanceof Error ? error.name : 'Error',
      phase: state.phase,
    })
    // Always run revert to cleanup worktree
    if (state.worktreePath) {
      await cleanupWorktree(state, context)
    }
    throw error
  }

  // Always run revert at the end
  if (state.worktreePath) {
    await cleanupWorktree(state, context)
  }

  return buildOutput(state)
}

/**
 * Execute a single phase, updating state based on the result.
 */
async function executePhase(
  state: ReviewState,
  input: PrReviewerInput,
  context: CapabilityContext,
): Promise<void> {
  context.logger.info(`Executing phase: ${state.phase}`)

  switch (state.phase) {
    case 'preflight':
      await executePreflight(state, input, context)
      break

    case 'context':
      await executeContext(state, input, context)
      break

    case 'review':
      await executeReview(state, input, context)
      break

    case 'aggregate':
      await executeAggregate(state, context)
      break

    case 'validate':
      await executeValidate(state, context)
      break

    case 'fix':
      await executeFix(
        state,
        input,
        context,
        state.budgetSpent,
        input.budget ?? getDefaultBudget(input.mode),
      )
      break

    case 'cleanup':
      await executeCleanup(state, context)
      break

    case 'test':
      await executeTest(state, context)
      break

    case 'commit':
      await executeCommit(state, context)
      break

    case 'comment':
      await executeComment(state, input, context)
      break

    default:
      context.logger.warn(`Unknown phase: ${state.phase}`)
  }
}

/**
 * Preflight phase: Check if PR should be reviewed.
 */
async function executePreflight(
  state: ReviewState,
  input: PrReviewerInput,
  context: CapabilityContext,
): Promise<void> {
  const result = (await context.invokeCapability('pr_preflight_step', {
    pr: input.pr,
    incremental: input.incremental,
  })) as PreflightStepOutput

  if (!result.proceed || !result.pr_context) {
    throw new Error(`Preflight check failed: ${result.skip_reason ?? 'Unknown reason'}`)
  }

  state.prContext = result.pr_context

  // In incremental mode, load previous issues from last review comment for cross-run dedup
  if (input.incremental && state.prContext) {
    try {
      const previousComment = await fetchPreviousReviewComment(state.prContext, context)
      if (previousComment) {
        const issueData = parseReviewIssuesFromComment(previousComment)
        state.previousIssues = convertIssueDataToReviewIssues(issueData)
        context.logger.info('Loaded previous review issues for incremental dedup', {
          count: state.previousIssues.length,
        })
      }
    } catch (error) {
      context.logger.warn('Failed to load previous review issues', {
        error: error instanceof Error ? error.message : String(error),
      })
    }
  }
}

/**
 * Fetch the latest pr_reviewer comment from a PR using gh CLI.
 */
async function fetchPreviousReviewComment(
  prContext: PrContext,
  _context: CapabilityContext,
): Promise<string | null> {
  try {
    const { execSync } = await import('node:child_process')
    const cmd = `gh pr view ${prContext.pr_number} --repo ${prContext.repo_owner}/${prContext.repo_name} --json comments --jq '.comments | map(select(.body | contains("Issues Data"))) | last | .body'`
    const output = execSync(cmd, { encoding: 'utf-8', timeout: 15000 }).trim()
    return output || null
  } catch {
    return null
  }
}

/**
 * Convert ReviewIssueData (from PR comments) to ReviewIssue (internal schema).
 * Used to populate previousIssues for cross-run deduplication.
 */
function convertIssueDataToReviewIssues(
  issueData: ReturnType<typeof parseReviewIssuesFromComment>,
): ReviewIssue[] {
  const results: ReviewIssue[] = []
  for (const d of issueData) {
    const parsed = ReviewIssueSchema.safeParse({
      severity: d.severity,
      category: d.category || undefined,
      title: d.title,
      file_path: d.file,
      line: d.line ?? undefined,
      details: d.description,
      suggestion: d.suggestedFix || undefined,
      auto_fixable: d.autoFixable,
      confidence: 70,
    })
    if (parsed.success) results.push(parsed.data)
  }
  return results
}

/**
 * Context phase: Setup worktree and load diff.
 * Merges diff_content and files_changed back into prContext
 * since the preflight step only collects metadata.
 */
async function executeContext(
  state: ReviewState,
  _input: PrReviewerInput,
  context: CapabilityContext,
): Promise<void> {
  if (!state.prContext) {
    throw new Error('PR context not available')
  }

  const result = (await context.invokeCapability('pr_context_step', {
    pr_context: state.prContext,
  })) as ContextStepOutput

  state.worktreePath = result.worktree_path

  if (!state.worktreePath) {
    throw new Error('Context step returned empty worktree_path')
  }

  // Only claim ownership if the worktree follows the pr-*-review pattern (created by context step).
  // External worktrees (e.g. from /issue-implement pipeline) must NOT be removed on cleanup.
  state.worktreeOwnedByReviewer = /\.worktrees\/pr-\d+-review/.test(state.worktreePath)

  // Merge context step output back into prContext.
  // The preflight step collects PR metadata; the context step fetches the actual diff.
  if (result.diff_content) {
    state.prContext = { ...state.prContext, diff_content: result.diff_content }
  }
  if (result.files_changed && result.files_changed.length > 0) {
    state.prContext = { ...state.prContext, files_changed: result.files_changed }
  }
}

/**
 * Review phase: Chunked review with file filtering.
 *
 * 1. Filter non-reviewable files (docs, build artifacts, etc.)
 * 2. Split diff by file for targeted chunks
 * 3. Chunk files into groups of 10
 * 4. Review each chunk sequentially (avoids budget race conditions)
 * 5. Aggregate step merges all chunk results with deduplication
 */
async function executeReview(
  state: ReviewState,
  _input: PrReviewerInput,
  context: CapabilityContext,
): Promise<void> {
  if (!state.prContext || !state.worktreePath) {
    throw new Error('PR context or worktree not available')
  }

  // 1. Filter out non-reviewable files
  const reviewableFiles = filterReviewableFiles(state.prContext.files_changed)
  if (reviewableFiles.length === 0) {
    state.agentResults = [{ agent: 'multi-review', issues: [] }]
    return
  }

  // 2. Split diff by file for targeted chunks
  const diffByFile = splitDiffByFile(state.prContext.diff_content)

  // 3. Chunk files into groups
  const chunks = chunkFiles(reviewableFiles, 10)

  // 4. Load project context once
  const contextResult = await loadProjectContext(getProjectConfig(), reviewableFiles)
  state.projectContextString = contextResult.context

  context.logger.info('Starting chunked review', {
    totalFiles: state.prContext.files_changed.length,
    reviewableFiles: reviewableFiles.length,
    chunks: chunks.length,
  })

  // 5. Review each chunk sequentially
  for (const chunk of chunks) {
    const chunkDiff = getDiffForFiles(diffByFile, chunk, 30000)
    const chunkContext = {
      ...state.prContext,
      files_changed: chunk,
    }

    const result = (await context.invokeCapability('pr_review_step', {
      pr_context: chunkContext,
      diff_content: chunkDiff,
      worktree_path: state.worktreePath,
      project_context: state.projectContextString,
    })) as ReviewStepOutput

    const results = Array.isArray(result) ? result : [result]
    state.agentResults.push(...results)
  }
}

/**
 * Aggregate phase: Merge and deduplicate issues.
 */
async function executeAggregate(state: ReviewState, context: CapabilityContext): Promise<void> {
  const result = (await context.invokeCapability('pr_aggregate_step', {
    agent_results: state.agentResults,
    previous_issues: state.previousIssues.length > 0 ? state.previousIssues : undefined,
  })) as AggregateStepOutput

  state.mergedIssues = result.issues
}

/**
 * Validate phase: Filter and categorize issues, assign deterministic issue IDs.
 */
async function executeValidate(state: ReviewState, context: CapabilityContext): Promise<void> {
  const result = (await context.invokeCapability('pr_validate_step', {
    issues: state.mergedIssues,
    agent_results: state.agentResults,
  })) as ValidateStepOutput

  // Assign deterministic issue IDs to all validated issues
  for (const issue of result.issues) {
    issue.issue_id = generateIssueId(issue.file_path, issue.title)
  }
  for (const issue of result.auto_fixable) {
    issue.issue_id = generateIssueId(issue.file_path, issue.title)
  }
  for (const issue of result.manual) {
    issue.issue_id = generateIssueId(issue.file_path, issue.title)
  }

  state.validatedIssues = result.issues
  state.autoFixableIssues = result.auto_fixable
  state.manualIssues = result.manual
}

/**
 * Fix phase: Apply automatic fixes with project context.
 */
async function executeFix(
  state: ReviewState,
  _input: PrReviewerInput,
  context: CapabilityContext,
  budgetSpent: number,
  budgetLimit: number,
): Promise<void> {
  if (!state.worktreePath) {
    throw new Error('Worktree not available')
  }

  const budgetRemaining = budgetLimit - budgetSpent

  const result = (await context.invokeCapability('pr_fix_step', {
    issues: state.autoFixableIssues,
    worktree_path: state.worktreePath,
    budget_remaining: budgetRemaining,
    project_context: state.projectContextString,
  })) as FixStepOutput

  state.fixesApplied = result.fixes_applied
  state.fixesFailed = result.fixes_failed
  state.issuesFixed = result.issues_fixed
  // Note: budgetSpent is synced from session cost after each phase in runOrchestration
}

/**
 * Cleanup phase: Remove unused exports, verify types.
 */
async function executeCleanup(state: ReviewState, context: CapabilityContext): Promise<void> {
  if (!state.worktreePath) {
    throw new Error('Worktree not available')
  }

  ;(await context.invokeCapability('pr_cleanup_step', {
    worktree_path: state.worktreePath,
    files_changed: state.prContext?.files_changed ?? [],
  })) as CleanupStepOutput
}

/**
 * Test phase: Run tests for changed files.
 */
async function executeTest(state: ReviewState, context: CapabilityContext): Promise<void> {
  if (!state.worktreePath || !state.prContext) {
    throw new Error('Worktree or PR context not available')
  }

  const result = (await context.invokeCapability('pr_test_step', {
    worktree_path: state.worktreePath,
    files_changed: state.prContext.files_changed,
  })) as TestStepOutput

  state.testsPassed = result.tests_passed
}

/**
 * Commit phase: Commit and push fixes.
 */
async function executeCommit(state: ReviewState, context: CapabilityContext): Promise<void> {
  if (!state.worktreePath || !state.prContext) {
    throw new Error('Worktree or PR context not available')
  }

  const result = (await context.invokeCapability('pr_commit_step', {
    worktree_path: state.worktreePath,
    pr_branch: state.prContext.pr_branch,
    fixes_applied: state.fixesApplied,
  })) as CommitStepOutput

  if (result.committed && result.commit_sha) {
    state.commitSha = result.commit_sha
  }
}

/**
 * Comment phase: Post review comment to PR with unfixed issue counts.
 */
async function executeComment(
  state: ReviewState,
  input: PrReviewerInput,
  context: CapabilityContext,
): Promise<void> {
  if (!state.prContext) {
    throw new Error('PR context not available')
  }

  // Calculate unfixed counts for escalation logic in comment step
  const unfixedMediumCount = state.validatedIssues.filter(
    (issue) => issue.severity === 'MEDIUM' && !state.issuesFixed.includes(issue.title),
  ).length
  const unfixedAutoFixableCount = state.autoFixableIssues.filter(
    (issue) => !state.issuesFixed.includes(issue.title),
  ).length

  const result = (await context.invokeCapability('pr_comment_step', {
    pr_context: state.prContext,
    issues: state.validatedIssues,
    fixes_applied: state.fixesApplied,
    cost_usd: state.budgetSpent,
    mode: input.mode,
    incremental: input.incremental,
    unfixed_medium_count: unfixedMediumCount,
    unfixed_auto_fixable_count: unfixedAutoFixableCount,
    round: state.round,
    head_sha: state.headSha,
  })) as CommentStepOutput

  state.commentUrl = result.comment_url
}

/**
 * Cleanup worktree helper.
 * Only removes worktrees that were created by the reviewer (pr-*-review pattern).
 * External worktrees (e.g. from /issue-implement pipeline) are left intact.
 */
async function cleanupWorktree(state: ReviewState, context: CapabilityContext): Promise<void> {
  if (!state.worktreePath) {
    return
  }

  if (!state.worktreeOwnedByReviewer) {
    context.logger.info('Skipping worktree cleanup — worktree not created by reviewer', {
      worktreePath: state.worktreePath,
    })
    return
  }

  try {
    await context.invokeCapability('pr_revert_step', {
      worktree_path: state.worktreePath,
    })
  } catch (error) {
    context.logger.warn('Worktree cleanup failed', {
      error: error instanceof Error ? error.message : String(error),
    })
  }
}

/**
 * Build final output from accumulated state.
 * Applies auto-fix enforcement and MEDIUM escalation logic.
 */
export function buildOutput(state: ReviewState): PrReviewerOutput {
  const counts = countBySeverity(state.validatedIssues)

  // Calculate unfixed auto-fixable and medium counts
  const unfixedAutoFixable = state.autoFixableIssues.filter(
    (issue) => !state.issuesFixed.includes(issue.title),
  ).length
  const unfixedMediums = state.validatedIssues.filter(
    (issue) => issue.severity === 'MEDIUM' && !state.issuesFixed.includes(issue.title),
  ).length

  // Determine status with auto-fix enforcement and MEDIUM escalation
  let status: 'success' | 'partial' | 'failed'
  if (counts.critical > 0) {
    status = 'failed'
  } else if (counts.high > 0 && state.fixesApplied === 0) {
    status = 'partial'
  } else if (unfixedAutoFixable > 0) {
    // Any auto-fixable issue left unfixed escalates to partial
    status = 'partial'
  } else if (unfixedMediums >= 3) {
    // 3+ unfixed MEDIUMs escalate to partial
    status = 'partial'
  } else {
    status = 'success'
  }

  return {
    status,
    issues_found: state.validatedIssues.length,
    issues_fixed: state.fixesApplied,
    critical_count: counts.critical,
    high_count: counts.high,
    medium_count: counts.medium,
    low_count: counts.low,
    unfixed_medium_count: unfixedMediums,
    unfixed_auto_fixable_count: unfixedAutoFixable,
    comment_url: state.commentUrl,
    cost_usd: state.budgetSpent,
    worktree_path: state.worktreePath ?? undefined,
    round: state.round,
    last_reviewed_sha: state.headSha || undefined,
  }
}
