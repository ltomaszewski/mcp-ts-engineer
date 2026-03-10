/**
 * Fixer state types and pure helper functions for pr-fixer orchestration.
 * Extracted to keep files under 300 lines and enable isolated unit testing.
 */

import type {
  DirectFixStepOutput,
  FixerIssueResult,
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
