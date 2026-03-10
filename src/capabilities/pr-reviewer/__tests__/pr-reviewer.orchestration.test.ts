/**
 * Test suite for PR reviewer orchestration helpers.
 * Validates pure functions (no mocks needed).
 */

import {
  buildOutput,
  countBySeverity,
  createInitialState,
  getDefaultBudget,
  getNextPhase,
  isOverBudget,
  type ReviewPhase,
  type ReviewState,
  shouldSkipPhase,
} from '../pr-reviewer.orchestration.js'
import type { ReviewIssue } from '../pr-reviewer.schema.js'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function makeIssue(
  severity: ReviewIssue['severity'],
  title: string,
  auto_fixable = false,
): ReviewIssue {
  return { severity, title, file_path: 'f', details: 'd', auto_fixable, confidence: 80 }
}

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------

describe('createInitialState', () => {
  it('returns state with all fields initialized', () => {
    const state = createInitialState()
    expect(state.phase).toBe('preflight')
    expect(state.prContext).toBeNull()
    expect(state.worktreePath).toBeNull()
    expect(state.agentResults).toEqual([])
    expect(state.mergedIssues).toEqual([])
    expect(state.validatedIssues).toEqual([])
    expect(state.autoFixableIssues).toEqual([])
    expect(state.manualIssues).toEqual([])
    expect(state.fixesApplied).toBe(0)
    expect(state.budgetSpent).toBe(0)
    expect(state.commentUrl).toBe('')
  })

  it('AC-7: initializes projectContextString as empty string', () => {
    const state = createInitialState()
    expect(state.projectContextString).toBe('')
  })

  it('initializes round to 1 and headSha to empty string', () => {
    const state = createInitialState()
    expect(state.round).toBe(1)
    expect(state.headSha).toBe('')
  })
})

// ---------------------------------------------------------------------------
// getDefaultBudget
// ---------------------------------------------------------------------------

describe('getDefaultBudget', () => {
  it('always returns $10 regardless of mode', () => {
    expect(getDefaultBudget('review-fix')).toBe(10)
    expect(getDefaultBudget('review-only')).toBe(10)
    expect(getDefaultBudget('any-other')).toBe(10)
  })
})

// ---------------------------------------------------------------------------
// isOverBudget
// ---------------------------------------------------------------------------

describe('isOverBudget', () => {
  it('returns true when spent >= limit', () => {
    const state = { ...createInitialState(), budgetSpent: 5 }
    expect(isOverBudget(state, 5)).toBe(true)
  })

  it('returns false when spent < limit', () => {
    const state = { ...createInitialState(), budgetSpent: 4.99 }
    expect(isOverBudget(state, 5)).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// countBySeverity
// ---------------------------------------------------------------------------

describe('countBySeverity', () => {
  it('counts issues by severity', () => {
    const issues: ReviewIssue[] = [
      {
        severity: 'CRITICAL',
        title: 'a',
        file_path: 'f',
        details: 'd',
        auto_fixable: false,
        confidence: 90,
      },
      {
        severity: 'HIGH',
        title: 'b',
        file_path: 'f',
        details: 'd',
        auto_fixable: false,
        confidence: 80,
      },
      {
        severity: 'HIGH',
        title: 'c',
        file_path: 'f',
        details: 'd',
        auto_fixable: false,
        confidence: 80,
      },
      {
        severity: 'MEDIUM',
        title: 'd',
        file_path: 'f',
        details: 'd',
        auto_fixable: false,
        confidence: 70,
      },
      {
        severity: 'LOW',
        title: 'e',
        file_path: 'f',
        details: 'd',
        auto_fixable: false,
        confidence: 60,
      },
    ]
    expect(countBySeverity(issues)).toEqual({ critical: 1, high: 2, medium: 1, low: 1 })
  })

  it('returns zeros for empty list', () => {
    expect(countBySeverity([])).toEqual({ critical: 0, high: 0, medium: 0, low: 0 })
  })
})

// ---------------------------------------------------------------------------
// shouldSkipPhase — state-based, mode no longer drives skip logic
// ---------------------------------------------------------------------------

describe('shouldSkipPhase', () => {
  const baseState = createInitialState()

  describe('fix phase', () => {
    it('skips when no auto-fixable issues exist', () => {
      expect(shouldSkipPhase('fix', baseState, 'review-fix')).toBe(true)
    })

    it('does not skip when auto-fixable issues exist', () => {
      const state: ReviewState = {
        ...baseState,
        autoFixableIssues: [makeIssue('LOW', 't', true)],
      }
      expect(shouldSkipPhase('fix', state, 'review-fix')).toBe(false)
    })

    it('does not skip based on mode alone when auto-fixable issues exist', () => {
      const state: ReviewState = {
        ...baseState,
        autoFixableIssues: [makeIssue('LOW', 't', true)],
      }
      // Mode does not affect fix skip logic anymore
      expect(shouldSkipPhase('fix', state, 'review-only')).toBe(false)
    })
  })

  describe('cleanup phase', () => {
    it('skips when no auto-fixable issues existed', () => {
      expect(shouldSkipPhase('cleanup', baseState, 'review-fix')).toBe(true)
    })

    it('does not skip when auto-fixable issues existed', () => {
      const state: ReviewState = {
        ...baseState,
        autoFixableIssues: [makeIssue('LOW', 't', true)],
      }
      expect(shouldSkipPhase('cleanup', state, 'review-fix')).toBe(false)
    })
  })

  describe('test phase', () => {
    it('skips when no fixes were applied', () => {
      expect(shouldSkipPhase('test', baseState, 'review-fix')).toBe(true)
    })

    it('does not skip when fixes were applied', () => {
      const state: ReviewState = { ...baseState, fixesApplied: 1 }
      expect(shouldSkipPhase('test', state, 'review-fix')).toBe(false)
    })
  })

  describe('commit phase', () => {
    it('skips when no fixes were applied', () => {
      expect(shouldSkipPhase('commit', baseState, 'review-fix')).toBe(true)
    })

    it('does not skip when fixes were applied and tests passed', () => {
      const state: ReviewState = { ...baseState, fixesApplied: 2, testsPassed: true }
      expect(shouldSkipPhase('commit', state, 'review-fix')).toBe(false)
    })

    it('skips when fixes were applied but tests failed', () => {
      const state: ReviewState = { ...baseState, fixesApplied: 2, testsPassed: false }
      expect(shouldSkipPhase('commit', state, 'review-fix')).toBe(true)
    })
  })

  describe('other phases', () => {
    it('does not skip comment phase', () => {
      expect(shouldSkipPhase('comment', baseState, 'review-fix')).toBe(false)
    })

    it('does not skip review phase', () => {
      expect(shouldSkipPhase('review', baseState, 'review-fix')).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// getNextPhase
// ---------------------------------------------------------------------------

describe('getNextPhase', () => {
  const baseState = createInitialState()

  describe('phase order', () => {
    it('does not include revert phase', () => {
      const stateWithFixes: ReviewState = {
        ...baseState,
        autoFixableIssues: [makeIssue('LOW', 't', true)],
        fixesApplied: 1,
        testsPassed: true,
      }
      const visitedPhases: ReviewPhase[] = ['preflight']
      let current: ReviewPhase = 'preflight'
      while (current !== 'done') {
        current = getNextPhase(current, 'review-fix', stateWithFixes)
        visitedPhases.push(current)
      }
      expect(visitedPhases).not.toContain('revert')
    })

    it('ends with done', () => {
      const visitedPhases: ReviewPhase[] = ['preflight']
      let current: ReviewPhase = 'preflight'
      while (current !== 'done') {
        current = getNextPhase(current, 'review-fix', baseState)
        visitedPhases.push(current)
      }
      expect(visitedPhases[visitedPhases.length - 1]).toBe('done')
    })
  })

  describe('state-based phase skipping', () => {
    it('skips fix/cleanup/test/commit when no auto-fixable issues and no fixes', () => {
      const phases: ReviewPhase[] = []
      let current: ReviewPhase = 'preflight'
      while (current !== 'done') {
        current = getNextPhase(current, 'review-fix', baseState)
        phases.push(current)
      }
      expect(phases).not.toContain('fix')
      expect(phases).not.toContain('cleanup')
      expect(phases).not.toContain('test')
      expect(phases).not.toContain('commit')
    })

    it('includes fix/cleanup/test/commit when auto-fixable issues exist, fixes applied, and tests passed', () => {
      const stateWithFixes: ReviewState = {
        ...baseState,
        autoFixableIssues: [makeIssue('LOW', 't', true)],
        fixesApplied: 1,
        testsPassed: true,
      }
      const phases: ReviewPhase[] = []
      let current: ReviewPhase = 'preflight'
      while (current !== 'done') {
        current = getNextPhase(current, 'review-fix', stateWithFixes)
        phases.push(current)
      }
      expect(phases).toContain('fix')
      expect(phases).toContain('cleanup')
      expect(phases).toContain('test')
      expect(phases).toContain('commit')
    })

    it('skips commit when fixes applied but tests failed', () => {
      const stateWithFailedTests: ReviewState = {
        ...baseState,
        autoFixableIssues: [makeIssue('LOW', 't', true)],
        fixesApplied: 1,
        testsPassed: false,
      }
      const phases: ReviewPhase[] = []
      let current: ReviewPhase = 'preflight'
      while (current !== 'done') {
        current = getNextPhase(current, 'review-fix', stateWithFailedTests)
        phases.push(current)
      }
      expect(phases).toContain('fix')
      expect(phases).toContain('test')
      expect(phases).not.toContain('commit')
    })
  })
})

// ---------------------------------------------------------------------------
// buildOutput — AC-7: auto-fix enforcement and MEDIUM escalation
// ---------------------------------------------------------------------------

describe('buildOutput', () => {
  it('returns failed status when critical issues exist', () => {
    const state: ReviewState = {
      ...createInitialState(),
      validatedIssues: [makeIssue('CRITICAL', 'crit-1')],
    }
    expect(buildOutput(state).status).toBe('failed')
  })

  it('returns partial when HIGH issues exist and no fixes applied', () => {
    const state: ReviewState = {
      ...createInitialState(),
      validatedIssues: [makeIssue('HIGH', 'high-1')],
      fixesApplied: 0,
    }
    expect(buildOutput(state).status).toBe('partial')
  })

  it('AC-7: returns partial when 1 unfixed auto-fixable issue exists', () => {
    const issue = makeIssue('MEDIUM', 'auto-fix-1', true)
    const state: ReviewState = {
      ...createInitialState(),
      validatedIssues: [issue],
      autoFixableIssues: [issue],
      issuesFixed: [], // not fixed
    }
    expect(buildOutput(state).status).toBe('partial')
  })

  it('AC-7: returns success when all auto-fixable issues were fixed', () => {
    const issue = makeIssue('MEDIUM', 'auto-fix-1', true)
    const state: ReviewState = {
      ...createInitialState(),
      validatedIssues: [issue],
      autoFixableIssues: [issue],
      issuesFixed: ['auto-fix-1'],
      fixesApplied: 1,
    }
    expect(buildOutput(state).status).toBe('success')
  })

  it('returns partial when 3 or more unfixed MEDIUM issues', () => {
    const state: ReviewState = {
      ...createInitialState(),
      validatedIssues: [
        makeIssue('MEDIUM', 'm1'),
        makeIssue('MEDIUM', 'm2'),
        makeIssue('MEDIUM', 'm3'),
      ],
      issuesFixed: [],
    }
    expect(buildOutput(state).status).toBe('partial')
  })

  it('returns success when only 2 unfixed MEDIUM issues', () => {
    const state: ReviewState = {
      ...createInitialState(),
      validatedIssues: [makeIssue('MEDIUM', 'm1'), makeIssue('MEDIUM', 'm2')],
      issuesFixed: [],
    }
    expect(buildOutput(state).status).toBe('success')
  })

  it('returns success when 3 MEDIUMs exist but 1 was fixed', () => {
    const state: ReviewState = {
      ...createInitialState(),
      validatedIssues: [
        makeIssue('MEDIUM', 'm1'),
        makeIssue('MEDIUM', 'm2'),
        makeIssue('MEDIUM', 'm3'),
      ],
      issuesFixed: ['m1'],
      fixesApplied: 1,
    }
    expect(buildOutput(state).status).toBe('success')
  })

  it('returns correct issue counts', () => {
    const state: ReviewState = {
      ...createInitialState(),
      validatedIssues: [makeIssue('HIGH', 'h1'), makeIssue('MEDIUM', 'm1'), makeIssue('LOW', 'l1')],
      fixesApplied: 1,
      issuesFixed: ['h1'],
    }
    const output = buildOutput(state)
    expect(output.issues_found).toBe(3)
    expect(output.issues_fixed).toBe(1)
    expect(output.high_count).toBe(1)
    expect(output.medium_count).toBe(1)
    expect(output.low_count).toBe(1)
  })

  it('returns success with issues_found: 0 for clean review (no issues)', () => {
    const state: ReviewState = {
      ...createInitialState(),
      validatedIssues: [],
      autoFixableIssues: [],
      manualIssues: [],
      fixesApplied: 0,
      issuesFixed: [],
    }
    const output = buildOutput(state)
    expect(output.status).toBe('success')
    expect(output.issues_found).toBe(0)
    expect(output.issues_fixed).toBe(0)
    expect(output.critical_count).toBe(0)
    expect(output.high_count).toBe(0)
    expect(output.medium_count).toBe(0)
    expect(output.low_count).toBe(0)
  })

  it('never returns failed with issues_found: 0 (contradictory state)', () => {
    // With zero validated issues, status should always be success
    const state: ReviewState = {
      ...createInitialState(),
      validatedIssues: [],
    }
    const output = buildOutput(state)
    expect(output.status).not.toBe('failed')
  })
})
