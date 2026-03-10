/**
 * Phase execution functions for pr-fixer orchestration.
 * Extracted to keep files under 300 lines.
 *
 * @internal Exported for orchestration only
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
  FixerValidateStepOutput,
} from './pr-fixer.schema.js'
import { buildOutput } from './pr-fixer.state.js'
import type { FixerState } from './pr-fixer.state.js'
import { MAX_VALIDATION_FIX_ROUNDS } from './pr-fixer.state.js'

// ---------------------------------------------------------------------------
// Phase dispatcher
// ---------------------------------------------------------------------------

export async function executePhase(state: FixerState, context: CapabilityContext): Promise<void> {
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

// ---------------------------------------------------------------------------
// Phase implementations
// ---------------------------------------------------------------------------

/**
 * Parse state: Fetch reviewer comment, extract issues, detect round.
 */
async function executeParseState(state: FixerState, context: CapabilityContext): Promise<void> {
  const preflightResult = (await context.invokeCapability('pr_preflight_step', {
    pr: String(state.prNumber),
    incremental: false,
  })) as { proceed: boolean; pr_context?: { pr_branch: string } }

  if (preflightResult.pr_context) {
    state.prBranch = preflightResult.pr_context.pr_branch
  }

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

  const commentBody = await fetchReviewerComment(state, context)
  if (!commentBody) {
    context.logger.info('No reviewer comment found')
    state.issues = []
    return
  }

  const allIssues = parseReviewIssuesFromComment(commentBody)
  const unfixed = filterUnfixedIssues(allIssues)

  const previousState = parseState(FIXER_STATE_MARKER, commentBody)
  if (previousState) {
    state.round = previousState.round + 1
  }

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

  state.filesChanged = [...new Set([...state.filesChanged, ...result.files_changed])]

  if (result.files_changed.length === 0) {
    context.logger.warn('Fix validation made no changes, giving up')
    markDirectFixedAsFailed(state)
    return
  }

  const validateResult = (await context.invokeCapability('pr_fixer_validate_step', {
    worktree_path: state.worktreePath,
    files_changed: state.filesChanged,
  })) as FixerValidateStepOutput

  state.validationPassed = validateResult.tsc_passed && validateResult.tests_passed
  state.validationErrorSummary = validateResult.error_summary || ''

  if (state.validationPassed) {
    context.logger.info('Validation passed after fix round', { round: state.validationFixRound })
    restoreDirectFixed(state)
  } else if (state.validationFixRound >= MAX_VALIDATION_FIX_ROUNDS) {
    context.logger.warn('Max validation fix rounds reached, giving up')
    markDirectFixedAsFailed(state)
  }
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
export async function executeComment(state: FixerState, context: CapabilityContext): Promise<void> {
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

function markDirectFixedAsFailed(state: FixerState): void {
  for (const tracker of state.issues) {
    if (tracker.status === 'fixed' && tracker.method === 'direct') {
      tracker.status = 'failed'
    }
  }
}

function restoreDirectFixed(state: FixerState): void {
  for (const tracker of state.issues) {
    if (tracker.status === 'failed' && tracker.method === 'direct') {
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
