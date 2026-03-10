/**
 * Phase execution functions for pr-reviewer orchestration.
 * Extracted to keep files under 300 lines.
 *
 * @internal Exported for orchestration only
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
  PrReviewerInput,
  ReviewIssue,
  ReviewStepOutput,
  TestStepOutput,
  ValidateStepOutput,
} from './pr-reviewer.schema.js'
import { ReviewIssueSchema } from './pr-reviewer.schema.js'
import type { PreflightStepOutput } from './pr-reviewer.schema.js'
import { loadProjectContext } from './services/project-context-loader.js'
import type { ReviewState } from './pr-reviewer.state.js'
import { getDefaultBudget } from './pr-reviewer.state.js'

// ---------------------------------------------------------------------------
// Phase dispatcher
// ---------------------------------------------------------------------------

/**
 * Execute a single phase, updating state based on the result.
 */
export async function executePhase(
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

// ---------------------------------------------------------------------------
// Preflight phase
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Context phase
// ---------------------------------------------------------------------------

/**
 * Context phase: Setup worktree and load diff.
 * Merges diff_content and files_changed back into prContext.
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

  state.worktreeOwnedByReviewer = /\.worktrees\/pr-\d+-review/.test(state.worktreePath)

  if (result.diff_content) {
    state.prContext = { ...state.prContext, diff_content: result.diff_content }
  }
  if (result.files_changed && result.files_changed.length > 0) {
    state.prContext = { ...state.prContext, files_changed: result.files_changed }
  }
}

// ---------------------------------------------------------------------------
// Review phase
// ---------------------------------------------------------------------------

/**
 * Review phase: Chunked review with file filtering.
 */
async function executeReview(
  state: ReviewState,
  _input: PrReviewerInput,
  context: CapabilityContext,
): Promise<void> {
  if (!state.prContext || !state.worktreePath) {
    throw new Error('PR context or worktree not available')
  }

  const reviewableFiles = filterReviewableFiles(state.prContext.files_changed)
  if (reviewableFiles.length === 0) {
    state.agentResults = [{ agent: 'multi-review', issues: [] }]
    return
  }

  const diffByFile = splitDiffByFile(state.prContext.diff_content)
  const chunks = chunkFiles(reviewableFiles, 10)
  const contextResult = await loadProjectContext(getProjectConfig(), reviewableFiles)
  state.projectContextString = contextResult.context

  context.logger.info('Starting chunked review', {
    totalFiles: state.prContext.files_changed.length,
    reviewableFiles: reviewableFiles.length,
    chunks: chunks.length,
  })

  for (const chunk of chunks) {
    const chunkDiff = getDiffForFiles(diffByFile, chunk, 30000)
    const chunkContext = { ...state.prContext, files_changed: chunk }

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

// ---------------------------------------------------------------------------
// Analysis phases
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Fix phases
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Completion phases
// ---------------------------------------------------------------------------

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
    issues_fixed: state.issuesFixed,
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
    issues_fixed: state.issuesFixed,
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

// ---------------------------------------------------------------------------
// Cleanup worktree
// ---------------------------------------------------------------------------

/**
 * Cleanup worktree helper.
 * Only removes worktrees that were created by the reviewer (pr-*-review pattern).
 */
export async function cleanupWorktree(
  state: ReviewState,
  context: CapabilityContext,
): Promise<void> {
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
