/**
 * Test suite for PR fixer orchestration state machine.
 */

import {
  buildOutput,
  createInitialState,
  type FixerIssueTracker,
  type FixerPhase,
  type FixerState,
  getNextPhase,
  MAX_VALIDATION_FIX_ROUNDS,
  shouldSkipPhase,
} from '../pr-fixer.orchestration.js'
import { prFixerCapability } from '../pr-fixer.capability.js'
import { prFixerClassifyStepCapability } from '../pr-fixer-classify-step.capability.js'
import { prFixerDirectFixStepCapability } from '../pr-fixer-direct-fix-step.capability.js'
import { prFixerFixValidationStepCapability } from '../pr-fixer-fix-validation-step.capability.js'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function makeTracker(overrides?: Partial<FixerIssueTracker>): FixerIssueTracker {
  return {
    issue_id: 'abc123def456',
    title: 'Test issue',
    severity: 'HIGH',
    file_path: 'src/test.ts',
    description: 'Test description',
    suggestedFix: 'Fix it',
    classification: 'direct',
    status: 'pending',
    method: 'none',
    ...overrides,
  }
}

// ---------------------------------------------------------------------------
// createInitialState
// ---------------------------------------------------------------------------

describe('createInitialState', () => {
  it('returns state with all fields initialized', () => {
    const state = createInitialState()
    expect(state.phase).toBe('parse_state')
    expect(state.round).toBe(1)
    expect(state.issues).toEqual([])
    expect(state.directFixOutput).toBeNull()
    expect(state.validationPassed).toBe(false)
    expect(state.validationErrorSummary).toBe('')
    expect(state.validationFixRound).toBe(0)
    expect(state.commitSha).toBeNull()
    expect(state.filesChanged).toEqual([])
    expect(state.budgetSpent).toBe(0)
  })
})

// ---------------------------------------------------------------------------
// shouldSkipPhase
// ---------------------------------------------------------------------------

describe('shouldSkipPhase', () => {
  const baseState = createInitialState()

  describe('direct_fix phase', () => {
    it('skips when no direct-classified issues', () => {
      const state: FixerState = {
        ...baseState,
        issues: [makeTracker({ classification: 'skip' })],
      }
      expect(shouldSkipPhase('direct_fix', state)).toBe(true)
    })

    it('does not skip when direct-classified issues exist', () => {
      const state: FixerState = {
        ...baseState,
        issues: [makeTracker({ classification: 'direct' })],
      }
      expect(shouldSkipPhase('direct_fix', state)).toBe(false)
    })
  })

  describe('validate phase', () => {
    it('skips when no direct fix output', () => {
      expect(shouldSkipPhase('validate', baseState)).toBe(true)
    })

    it('skips when no fixes applied', () => {
      const state: FixerState = {
        ...baseState,
        directFixOutput: {
          fixes_applied: 0,
          fixes_failed: 0,
          issues_fixed: [],
          issues_failed_ids: [],
          files_changed: [],
        },
      }
      expect(shouldSkipPhase('validate', state)).toBe(true)
    })

    it('does not skip when fixes applied', () => {
      const state: FixerState = {
        ...baseState,
        directFixOutput: {
          fixes_applied: 2,
          fixes_failed: 0,
          issues_fixed: ['a', 'b'],
          issues_failed_ids: [],
          files_changed: ['src/a.ts'],
        },
      }
      expect(shouldSkipPhase('validate', state)).toBe(false)
    })
  })

  describe('fix_validation phase', () => {
    it('skips when validation passed', () => {
      const state: FixerState = {
        ...baseState,
        validationPassed: true,
        validationErrorSummary: 'some error',
        validationFixRound: 0,
      }
      expect(shouldSkipPhase('fix_validation', state)).toBe(true)
    })

    it('skips when no error summary', () => {
      const state: FixerState = {
        ...baseState,
        validationPassed: false,
        validationErrorSummary: '',
        validationFixRound: 0,
      }
      expect(shouldSkipPhase('fix_validation', state)).toBe(true)
    })

    it('skips when max retries reached', () => {
      const state: FixerState = {
        ...baseState,
        validationPassed: false,
        validationErrorSummary: 'test failed',
        validationFixRound: MAX_VALIDATION_FIX_ROUNDS,
      }
      expect(shouldSkipPhase('fix_validation', state)).toBe(true)
    })

    it('does not skip when validation failed with errors and retries available', () => {
      const state: FixerState = {
        ...baseState,
        validationPassed: false,
        validationErrorSummary: 'test failed: expected 0 but got 2',
        validationFixRound: 0,
      }
      expect(shouldSkipPhase('fix_validation', state)).toBe(false)
    })
  })

  describe('commit phase', () => {
    it('skips when no fixes applied', () => {
      expect(shouldSkipPhase('commit', baseState)).toBe(true)
    })

    it('skips when validation failed', () => {
      const state: FixerState = {
        ...baseState,
        directFixOutput: {
          fixes_applied: 1,
          fixes_failed: 0,
          issues_fixed: ['a'],
          issues_failed_ids: [],
          files_changed: ['src/a.ts'],
        },
        validationPassed: false,
      }
      expect(shouldSkipPhase('commit', state)).toBe(true)
    })

    it('does not skip when fixes applied and validation passed', () => {
      const state: FixerState = {
        ...baseState,
        directFixOutput: {
          fixes_applied: 1,
          fixes_failed: 0,
          issues_fixed: ['a'],
          issues_failed_ids: [],
          files_changed: ['src/a.ts'],
        },
        validationPassed: true,
      }
      expect(shouldSkipPhase('commit', state)).toBe(false)
    })
  })

  describe('other phases', () => {
    it('does not skip parse_state', () => {
      expect(shouldSkipPhase('parse_state', baseState)).toBe(false)
    })

    it('does not skip classify', () => {
      expect(shouldSkipPhase('classify', baseState)).toBe(false)
    })

    it('does not skip comment', () => {
      expect(shouldSkipPhase('comment', baseState)).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// getNextPhase
// ---------------------------------------------------------------------------

describe('getNextPhase', () => {
  const baseState = createInitialState()

  it('follows full phase order when all conditions met', () => {
    const state: FixerState = {
      ...baseState,
      issues: [makeTracker({ classification: 'direct' })],
      directFixOutput: {
        fixes_applied: 1,
        fixes_failed: 0,
        issues_fixed: ['a'],
        issues_failed_ids: [],
        files_changed: ['src/a.ts'],
      },
      validationPassed: true,
    }

    const phases: FixerPhase[] = []
    let current: FixerPhase = 'parse_state'
    while (current !== 'done') {
      current = getNextPhase(current, state)
      phases.push(current)
    }

    expect(phases).toContain('classify')
    expect(phases).toContain('direct_fix')
    expect(phases).toContain('validate')
    expect(phases).toContain('commit')
    expect(phases).toContain('comment')
    expect(phases).toContain('done')
    // fix_validation should be skipped because validation passed
    expect(phases).not.toContain('fix_validation')
  })

  it('includes fix_validation when validation failed with errors', () => {
    const state: FixerState = {
      ...baseState,
      issues: [makeTracker({ classification: 'direct' })],
      directFixOutput: {
        fixes_applied: 1,
        fixes_failed: 0,
        issues_fixed: ['a'],
        issues_failed_ids: [],
        files_changed: ['src/a.ts'],
      },
      validationPassed: false,
      validationErrorSummary: 'test failed',
      validationFixRound: 0,
    }

    const nextAfterValidate = getNextPhase('validate', state)
    expect(nextAfterValidate).toBe('fix_validation')
  })

  it('skips fix_validation when max rounds reached', () => {
    const state: FixerState = {
      ...baseState,
      issues: [makeTracker({ classification: 'direct' })],
      directFixOutput: {
        fixes_applied: 1,
        fixes_failed: 0,
        issues_fixed: ['a'],
        issues_failed_ids: [],
        files_changed: ['src/a.ts'],
      },
      validationPassed: false,
      validationErrorSummary: 'test failed',
      validationFixRound: MAX_VALIDATION_FIX_ROUNDS,
    }

    const nextAfterValidate = getNextPhase('validate', state)
    // Should skip fix_validation AND commit (validation failed), go to comment
    expect(nextAfterValidate).toBe('comment')
  })

  it('skips direct_fix/validate/commit when no direct issues', () => {
    const state: FixerState = {
      ...baseState,
      issues: [makeTracker({ classification: 'skip', status: 'skipped' })],
    }

    const phases: FixerPhase[] = []
    let current: FixerPhase = 'parse_state'
    while (current !== 'done') {
      current = getNextPhase(current, state)
      phases.push(current)
    }

    expect(phases).not.toContain('direct_fix')
    expect(phases).not.toContain('validate')
    expect(phases).not.toContain('fix_validation')
    expect(phases).not.toContain('commit')
    expect(phases).toContain('comment')
  })

  it('returns done for unknown phase', () => {
    expect(getNextPhase('done', baseState)).toBe('done')
  })
})

// ---------------------------------------------------------------------------
// buildOutput
// ---------------------------------------------------------------------------

describe('buildOutput', () => {
  const baseState = createInitialState()

  it('returns nothing_to_fix when no issues', () => {
    const output = buildOutput(baseState)
    expect(output.status).toBe('nothing_to_fix')
    expect(output.issues_input).toBe(0)
  })

  it('returns success when all issues fixed', () => {
    const state: FixerState = {
      ...baseState,
      issues: [
        makeTracker({ issue_id: 'a', status: 'fixed', method: 'direct' }),
        makeTracker({ issue_id: 'b', status: 'fixed', method: 'direct' }),
      ],
      filesChanged: ['src/a.ts'],
    }
    const output = buildOutput(state)
    expect(output.status).toBe('success')
    expect(output.issues_resolved).toBe(2)
    expect(output.direct_fixes).toBe(2)
    expect(output.issues_failed).toBe(0)
  })

  it('returns partial when some fixed', () => {
    const state: FixerState = {
      ...baseState,
      issues: [
        makeTracker({ issue_id: 'a', status: 'fixed', method: 'direct' }),
        makeTracker({ issue_id: 'b', status: 'failed', method: 'direct' }),
      ],
    }
    const output = buildOutput(state)
    expect(output.status).toBe('partial')
    expect(output.issues_resolved).toBe(1)
    expect(output.issues_failed).toBe(1)
  })

  it('returns failed when none fixed', () => {
    const state: FixerState = {
      ...baseState,
      issues: [
        makeTracker({ issue_id: 'a', status: 'failed', method: 'direct' }),
        makeTracker({ issue_id: 'b', status: 'failed', method: 'direct' }),
      ],
    }
    const output = buildOutput(state)
    expect(output.status).toBe('failed')
  })

  it('counts skipped issues correctly', () => {
    const state: FixerState = {
      ...baseState,
      issues: [
        makeTracker({ issue_id: 'a', status: 'fixed', method: 'direct' }),
        makeTracker({ issue_id: 'b', status: 'skipped', method: 'none' }),
      ],
    }
    const output = buildOutput(state)
    expect(output.issues_skipped).toBe(1)
    expect(output.status).toBe('success')
  })

  it('includes per_issue details', () => {
    const state: FixerState = {
      ...baseState,
      issues: [
        makeTracker({ issue_id: 'a', title: 'Fix A', status: 'fixed', method: 'direct' }),
        makeTracker({ issue_id: 'b', title: 'Fix B', status: 'failed', method: 'direct' }),
      ],
    }
    const output = buildOutput(state)
    expect(output.per_issue).toHaveLength(2)
    expect(output.per_issue[0]?.issue_id).toBe('a')
    expect(output.per_issue[0]?.status).toBe('fixed')
    expect(output.per_issue[1]?.status).toBe('failed')
  })

  it('includes round number', () => {
    const state: FixerState = { ...baseState, round: 3 }
    const output = buildOutput(state)
    expect(output.round).toBe(3)
  })
})

// ---------------------------------------------------------------------------
// Capability definition budget/maxTurns assertions
// ---------------------------------------------------------------------------

describe('prFixerCapability definition metadata', () => {
  it('has maxTurns of 5', () => {
    expect(prFixerCapability.defaultRequestOptions?.maxTurns).toBe(5)
  })
})

describe('prFixerDirectFixStepCapability definition metadata', () => {
  it('has maxBudgetUsd of 3.0', () => {
    expect(prFixerDirectFixStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(3.0)
  })
})

describe('prFixerClassifyStepCapability definition metadata', () => {
  it('has model of sonnet', () => {
    expect(prFixerClassifyStepCapability.defaultRequestOptions?.model).toBe('sonnet')
  })

  it('has maxTurns of 10', () => {
    expect(prFixerClassifyStepCapability.defaultRequestOptions?.maxTurns).toBe(10)
  })

  it('has maxBudgetUsd of 0.5', () => {
    expect(prFixerClassifyStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(0.5)
  })
})

describe('prFixerFixValidationStepCapability definition metadata', () => {
  it('has maxBudgetUsd of 3.0', () => {
    expect(prFixerFixValidationStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(3.0)
  })
})
