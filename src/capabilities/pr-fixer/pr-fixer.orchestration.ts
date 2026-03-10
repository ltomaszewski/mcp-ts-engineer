/**
 * Orchestration state machine for pr_fixer capability.
 * Two-tier fix strategy: direct fixes (Tier 1) and spec pipeline (Tier 2).
 * Includes iterative validation fix loop (up to MAX_VALIDATION_FIX_ROUNDS).
 *
 * @internal Exported for unit testing
 */

import { getProjectConfig } from '../../config/project-config.js'
import type { CapabilityContext } from '../../core/capability-registry/capability-registry.types.js'
import { FIXER_STATE_MARKER, parseState } from '../../core/utils/pr-comment-state.js'
import { loadProjectContext } from '../pr-reviewer/services/project-context-loader.js'
import { filterUnfixedIssues, parseReviewIssuesFromComment } from './pr-fixer.helpers.js'
import type {
  ClassifyStepOutput,
  DirectFixStepOutput,
  FixerCommentStepOutput,
  FixerCommitStepOutput,
  FixerIssueResult,
  FixerValidateStepOutput,
  PrFixerInput,
  PrFixerOutput,
} from './pr-fixer.schema.js'

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const MAX_VALIDATION_FIX_ROUNDS = 2

// ---------------------------------------------------------------------------
// Fixer phases
// ---------------------------------------------------------------------------

export type FixerPhase =
  | 'parse_state'
  | 'classify'
  | 'direct_fix'
  | 'validate'
  | 'fix_validation'
  | 'commit'
  | 'comment'
  | 'done'

// ---------------------------------------------------------------------------
// Per-issue tracker
// ---------------------------------------------------------------------------

export interface FixerIssueTracker {
  issue_id: string
  title: string
  severity: string
  file_path: string
  description: string
  suggestedFix: string
  classification: 'direct' | 'spec-required' | 'skip' | 'pending'
  status: 'pending' | 'fixing' | 'fixed' | 'failed' | 'skipped'
  method: 'direct' | 'spec' | 'none'
}

// ---------------------------------------------------------------------------
// Fixer state
// ---------------------------------------------------------------------------

export interface FixerState {
  phase: FixerPhase
  prNumber: number
  repoOwner: string
  repoName: string
  prBranch: string
  worktreePath: string
  round: number
  issues: FixerIssueTracker[]
  directFixOutput: DirectFixStepOutput | null
  validationPassed: boolean
  validationErrorSummary: string
  validationFixRound: number
  commitSha: string | null
  commentUrl: string
  filesChanged: string[]
  budgetSpent: number
  projectContextString: string
}

// ---------------------------------------------------------------------------
// Pure helpers
// ---------------------------------------------------------------------------

export function createInitialState(): FixerState {
  return {
    phase: 'parse_state',
    prNumber: 0,
    repoOwner: '',
    repoName: '',
    prBranch: '',
    worktreePath: '',
    round: 1,
    issues: [],
    directFixOutput: null,
    validationPassed: false,
    validationErrorSummary: '',
    validationFixRound: 0,
    commitSha: null,
    commentUrl: '',
    filesChanged: [],
    budgetSpent: 0,
    projectContextString: '',
  }
}

export function shouldSkipPhase(phase: FixerPhase, state: FixerState): boolean {
  switch (phase) {
    case 'direct_fix':
      return state.issues.filter((i) => i.classification === 'direct').length === 0

    case 'validate':
      return !state.directFixOutput || state.directFixOutput.fixes_applied === 0

    case 'fix_validation':
      // Skip if validation passed, no errors to fix, or max retries reached
      return (
        state.validationPassed ||
        !state.validationErrorSummary ||
        state.validationFixRound >= MAX_VALIDATION_FIX_ROUNDS
      )

    case 'commit':
      return (
        !state.directFixOutput ||
        state.directFixOutput.fixes_applied === 0 ||
        !state.validationPassed
      )

    default:
      return false
  }
}

export function getNextPhase(current: FixerPhase, state: FixerState): FixerPhase {
  const phaseOrder: FixerPhase[] = [
    'parse_state',
    'classify',
    'direct_fix',
    'validate',
    'fix_validation',
    'commit',
    'comment',
    'done',
  ]

  const currentIndex = phaseOrder.indexOf(current)
  if (currentIndex === -1 || currentIndex === phaseOrder.length - 1) return 'done'

  for (let i = currentIndex + 1; i < phaseOrder.length; i++) {
    const next = phaseOrder[i]!
    if (!shouldSkipPhase(next, state)) return next
  }

  return 'done'
}

export function buildOutput(state: FixerState): PrFixerOutput {
  const resolved = state.issues.filter((i) => i.status === 'fixed').length
  const failed = state.issues.filter((i) => i.status === 'failed').length
  const skipped = state.issues.filter((i) => i.status === 'skipped').length
  const directFixes = state.issues.filter(
    (i) => i.status === 'fixed' && i.method === 'direct',
  ).length
  const specFixes = state.issues.filter((i) => i.status === 'fixed' && i.method === 'spec').length

  // Issues that were actually attempted (not skipped)
  const attempted = state.issues.filter((i) => i.status !== 'skipped').length

  let status: PrFixerOutput['status']
  if (state.issues.length === 0) {
    status = 'nothing_to_fix'
  } else if (attempted === 0) {
    // All issues were skipped
    status = 'nothing_to_fix'
  } else if (resolved === attempted) {
    status = 'success'
  } else if (resolved > 0) {
    status = 'partial'
  } else {
    status = 'failed'
  }

  const perIssue: FixerIssueResult[] = state.issues.map((i) => ({
    issue_id: i.issue_id,
    title: i.title,
    status: i.status === 'fixed' ? 'fixed' : i.status === 'skipped' ? 'skipped' : 'failed',
    method: i.method,
  }))

  return {
    status,
    issues_input: state.issues.length,
    issues_resolved: resolved,
    issues_failed: failed,
    issues_skipped: skipped,
    direct_fixes: directFixes,
    spec_fixes: specFixes,
    files_changed: state.filesChanged,
    cost_usd: state.budgetSpent,
    round: state.round,
    per_issue: perIssue,
  }
}

// ---------------------------------------------------------------------------
// Orchestration loop
// ---------------------------------------------------------------------------

export async function runFixerOrchestration(
  input: PrFixerInput,
  context: CapabilityContext,
): Promise<PrFixerOutput> {
  const state = createInitialState()
  const budgetLimit = input.budget ?? 5.0

  // Parse PR number and repo info
  if (input.pr.includes('github.com')) {
    const match = input.pr.match(/\/pull\/(\d+)/)
    state.prNumber = match ? parseInt(match[1]!, 10) : parseInt(input.pr, 10)
  } else {
    state.prNumber = parseInt(input.pr, 10)
  }
  const config = getProjectConfig()
  state.repoOwner = config.repoOwner || ''
  state.repoName = config.repoName || ''

  // Pre-populate worktree path if cwd provided (skip pr_context_step in executeParseState)
  if (input.cwd) {
    state.worktreePath = input.cwd
  }

  try {
    while (state.phase !== 'done') {
      if (state.budgetSpent >= budgetLimit) {
        context.logger.warn('Budget exceeded, stopping early', {
          budgetSpent: state.budgetSpent,
          budgetLimit,
          phase: state.phase,
        })
        break
      }

      await executePhase(state, context)
      state.budgetSpent = context.getSessionCost().totalCostUsd
      state.phase = getNextPhase(state.phase, state)
    }
  } catch (error) {
    context.logger.error('Fixer orchestration error', {
      error: error instanceof Error ? error.message : String(error),
      phase: state.phase,
    })
  }

  await ensureCommentPosted(state, context)

  return buildOutput(state)
}

// ---------------------------------------------------------------------------
// Phase execution
// ---------------------------------------------------------------------------

async function executePhase(state: FixerState, context: CapabilityContext): Promise<void> {
  context.logger.info(`Executing fixer phase: ${state.phase}`)

  switch (state.phase) {
    case 'parse_state':
      await executeParseState(state, context)
      break
    case 'classify':
      await executeClassify(state, context)
      break
    case 'direct_fix':
      await executeDirectFix(state, context)
      break
    case 'validate':
      await executeValidate(state, context)
      break
    case 'fix_validation':
      await executeFixValidation(state, context)
      break
    case 'commit':
      await executeCommit(state, context)
      break
    case 'comment':
      await executeComment(state, context)
      break
  }
}

/**
 * Parse state: Fetch reviewer comment, extract issues, detect round.
 */
async function executeParseState(state: FixerState, context: CapabilityContext): Promise<void> {
  // Fetch reviewer comment via pr_preflight_step to get PR branch
  const preflightResult = (await context.invokeCapability('pr_preflight_step', {
    pr: String(state.prNumber),
    incremental: false,
  })) as { proceed: boolean; pr_context?: { pr_branch: string } }

  if (preflightResult.pr_context) {
    state.prBranch = preflightResult.pr_context.pr_branch
  }

  // Set up worktree (skip if already pre-populated from input.cwd)
  if (!state.worktreePath) {
    const contextResult = (await context.invokeCapability('pr_context_step', {
      pr_context: {
        pr_number: state.prNumber,
        repo_owner: state.repoOwner,
        repo_name: state.repoName,
        pr_branch: state.prBranch,
        base_branch: 'main',
        files_changed: [],
        diff_content: '',
        is_draft: false,
        is_closed: false,
      },
    })) as { worktree_path: string }

    state.worktreePath = contextResult.worktree_path
  } else {
    context.logger.info('Reusing external worktree', { worktreePath: state.worktreePath })
  }

  // Fetch the latest reviewer comment to extract issues
  const commentBody = await fetchReviewerComment(state, context)
  if (!commentBody) {
    context.logger.info('No reviewer comment found')
    state.issues = []
    return
  }

  // Parse issues from comment
  const allIssues = parseReviewIssuesFromComment(commentBody)
  const unfixed = filterUnfixedIssues(allIssues)

  // Detect round from previous fixer state
  const previousState = parseState(FIXER_STATE_MARKER, commentBody)
  if (previousState) {
    state.round = previousState.round + 1
  }

  // Convert to trackers
  state.issues = unfixed.map((issue) => ({
    issue_id: issue.id || `${issue.file}-${issue.title}`.slice(0, 12),
    title: issue.title,
    severity: issue.severity,
    file_path: issue.file,
    description: issue.description,
    suggestedFix: issue.suggestedFix,
    classification: 'pending' as const,
    status: 'pending' as const,
    method: 'none' as const,
  }))

  // Load project context for informed fixing decisions
  try {
    const issueFilePaths = state.issues.map((i) => i.file_path)
    const projectConfig = getProjectConfig()
    const projectContext = await loadProjectContext(projectConfig, issueFilePaths)
    state.projectContextString = projectContext.context
    context.logger.info('Project context loaded for fixer', {
      knowledgeBase: projectContext.knowledgeBaseLoaded,
      codemaps: projectContext.codemapsLoaded,
      rules: projectContext.rulesLoaded.length,
      skills: projectContext.skillsLoaded.length,
    })
  } catch (err) {
    context.logger.warn('Failed to load project context for fixer', {
      error: err instanceof Error ? err.message : String(err),
    })
    state.projectContextString = ''
  }
}

/**
 * Classify phase: Categorize issues as direct/spec-required/skip.
 */
async function executeClassify(state: FixerState, context: CapabilityContext): Promise<void> {
  if (state.issues.length === 0) return

  const issuesSummary = state.issues
    .map(
      (i) =>
        `- ID: ${i.issue_id} | [${i.severity}] ${i.title}\n  File: ${i.file_path}\n  Description: ${i.description}\n  Suggested: ${i.suggestedFix}`,
    )
    .join('\n\n')

  const result = (await context.invokeCapability('pr_fixer_classify_step', {
    issues_summary: issuesSummary,
    issue_ids: state.issues.map((i) => i.issue_id),
    project_context: state.projectContextString || undefined,
  })) as ClassifyStepOutput

  // Apply classifications
  for (const classification of result.classifications) {
    const tracker = state.issues.find((i) => i.issue_id === classification.issue_id)
    if (tracker) {
      if (classification.classification === 'skip') {
        tracker.classification = 'skip'
        tracker.status = 'skipped'
        tracker.method = 'none'
      } else {
        tracker.classification = classification.classification as 'direct' | 'spec-required'
      }
    }
  }
}

/**
 * Direct fix phase: Apply mechanical fixes.
 */
async function executeDirectFix(state: FixerState, context: CapabilityContext): Promise<void> {
  const directIssues = state.issues.filter((i) => i.classification === 'direct')
  if (directIssues.length === 0) return

  const issuesSummary = directIssues
    .map(
      (i, idx) =>
        `${idx + 1}. [${i.severity}] ${i.file_path}\n   ID: ${i.issue_id}\n   Title: ${i.title}\n   Description: ${i.description}\n   Fix: ${i.suggestedFix}`,
    )
    .join('\n\n')

  const result = (await context.invokeCapability('pr_fixer_direct_fix_step', {
    issues_summary: issuesSummary,
    worktree_path: state.worktreePath,
    project_context: state.projectContextString || undefined,
  })) as DirectFixStepOutput

  state.directFixOutput = result
  state.filesChanged = [...new Set([...state.filesChanged, ...result.files_changed])]

  // Update issue statuses
  for (const fixedId of result.issues_fixed) {
    const tracker = state.issues.find((i) => i.issue_id === fixedId)
    if (tracker) {
      tracker.status = 'fixed'
      tracker.method = 'direct'
    }
  }
  for (const failedId of result.issues_failed_ids) {
    const tracker = state.issues.find((i) => i.issue_id === failedId)
    if (tracker) {
      tracker.status = 'failed'
      tracker.method = 'direct'
    }
  }
}

/**
 * Validate phase: Run tsc + tests.
 * Stores error_summary for fix_validation phase if validation fails.
 */
async function executeValidate(state: FixerState, context: CapabilityContext): Promise<void> {
  const result = (await context.invokeCapability('pr_fixer_validate_step', {
    worktree_path: state.worktreePath,
    files_changed: state.filesChanged,
  })) as FixerValidateStepOutput

  state.validationPassed = result.tsc_passed && result.tests_passed
  state.validationErrorSummary = result.error_summary || ''

  if (!state.validationPassed) {
    context.logger.warn('Validation failed', {
      tsc_passed: result.tsc_passed,
      tests_passed: result.tests_passed,
      validationFixRound: state.validationFixRound,
      maxRounds: MAX_VALIDATION_FIX_ROUNDS,
      hasErrorSummary: !!result.error_summary,
    })
  }
}

/**
 * Fix validation phase: Fix tsc/test/lint failures introduced by direct fixes.
 * After fixing, loops back to validate by resetting phase.
 */
async function executeFixValidation(state: FixerState, context: CapabilityContext): Promise<void> {
  state.validationFixRound++
  context.logger.info('Attempting to fix validation errors', {
    round: state.validationFixRound,
    maxRounds: MAX_VALIDATION_FIX_ROUNDS,
  })

  const result = (await context.invokeCapability('pr_fixer_fix_validation_step', {
    worktree_path: state.worktreePath,
    error_summary: state.validationErrorSummary,
    files_changed: state.filesChanged,
    project_context: state.projectContextString || undefined,
  })) as DirectFixStepOutput

  // Track new files changed
  state.filesChanged = [...new Set([...state.filesChanged, ...result.files_changed])]

  if (result.files_changed.length === 0) {
    context.logger.warn('Fix validation made no changes, giving up')
    // Mark direct-fixed issues as failed since validation can't be fixed
    markDirectFixedAsFailed(state)
    return
  }

  // Re-validate after fix attempt
  const validateResult = (await context.invokeCapability('pr_fixer_validate_step', {
    worktree_path: state.worktreePath,
    files_changed: state.filesChanged,
  })) as FixerValidateStepOutput

  state.validationPassed = validateResult.tsc_passed && validateResult.tests_passed
  state.validationErrorSummary = validateResult.error_summary || ''

  if (state.validationPassed) {
    context.logger.info('Validation passed after fix round', { round: state.validationFixRound })
    // Restore direct-fixed issues that were previously working
    restoreDirectFixed(state)
  } else if (state.validationFixRound >= MAX_VALIDATION_FIX_ROUNDS) {
    context.logger.warn('Max validation fix rounds reached, giving up')
    markDirectFixedAsFailed(state)
  }
  // Otherwise, getNextPhase will loop back to fix_validation if conditions met
}

/**
 * Commit phase: Commit and push fixes.
 */
async function executeCommit(state: FixerState, context: CapabilityContext): Promise<void> {
  const fixedIssues = state.issues.filter((i) => i.status === 'fixed')
  const result = (await context.invokeCapability('pr_fixer_commit_step', {
    worktree_path: state.worktreePath,
    pr_branch: state.prBranch,
    fixes_applied: state.directFixOutput?.fixes_applied ?? 0,
    issue_titles: fixedIssues.map((i) => i.title),
  })) as FixerCommitStepOutput

  if (result.committed && result.commit_sha) {
    state.commitSha = result.commit_sha
  }
}

/**
 * Comment phase: Post/update fixer comment on PR.
 */
async function executeComment(state: FixerState, context: CapabilityContext): Promise<void> {
  const output = buildOutput(state)

  const result = (await context.invokeCapability('pr_fixer_comment_step', {
    pr_number: state.prNumber,
    repo_owner: state.repoOwner,
    repo_name: state.repoName,
    round: state.round,
    output,
  })) as FixerCommentStepOutput

  state.commentUrl = result.comment_url
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Ensure fixer comment is posted even after budget/error exit.
 */
async function ensureCommentPosted(state: FixerState, context: CapabilityContext): Promise<void> {
  if (state.commentUrl || state.prNumber <= 0 || !state.repoOwner || !state.repoName) return

  try {
    await executeComment(state, context)
  } catch (commentError) {
    context.logger.warn('Failed to post fixer comment after error', {
      error: commentError instanceof Error ? commentError.message : String(commentError),
      prNumber: state.prNumber,
    })
  }
}

function markDirectFixedAsFailed(state: FixerState): void {
  for (const tracker of state.issues) {
    if (tracker.status === 'fixed' && tracker.method === 'direct') {
      tracker.status = 'failed'
    }
  }
}

function restoreDirectFixed(state: FixerState): void {
  // Issues that were marked 'fixed' by direct_fix but then set to 'failed'
  // by a previous validation failure — restore them since validation now passes
  for (const tracker of state.issues) {
    if (tracker.status === 'failed' && tracker.method === 'direct') {
      // Check if the direct fix step originally marked this as fixed
      const wasFixed = state.directFixOutput?.issues_fixed.includes(tracker.issue_id)
      if (wasFixed) {
        tracker.status = 'fixed'
      }
    }
  }
}

async function fetchReviewerComment(
  state: FixerState,
  context: CapabilityContext,
): Promise<string | null> {
  // Use an AI agent to fetch the comment via gh CLI
  // This reuses the echo_agent pattern for a simple shell command
  try {
    const result = (await context.invokeCapability('pr_fixer_fetch_comment_step', {
      pr_number: state.prNumber,
      repo_owner: state.repoOwner,
      repo_name: state.repoName,
    })) as { comment_body: string }
    return result.comment_body || null
  } catch {
    context.logger.warn('Failed to fetch reviewer comment')
    return null
  }
}
