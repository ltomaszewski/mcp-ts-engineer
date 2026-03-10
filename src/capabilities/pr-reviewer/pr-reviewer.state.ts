/**
 * Review state types and pure helper functions for pr-reviewer orchestration.
 * Extracted to keep files under 300 lines and enable isolated unit testing.
 */

import type {
  PrContext,
  PrReviewerOutput,
  ReviewIssue,
  ReviewStepOutput,
} from './pr-reviewer.schema.js'

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
