import { describe, expect, it } from 'vitest'
import { REACT_HOOKS_REVIEW_RULES } from '../react-hooks-review.js'

describe('REACT_HOOKS_REVIEW_RULES', () => {
  it('is a non-empty string', () => {
    expect(typeof REACT_HOOKS_REVIEW_RULES).toBe('string')
    expect(REACT_HOOKS_REVIEW_RULES.length).toBeGreaterThan(100)
  })

  it('contains ALWAYS section', () => {
    expect(REACT_HOOKS_REVIEW_RULES).toContain('### ALWAYS Rules')
  })

  it('contains NEVER section', () => {
    expect(REACT_HOOKS_REVIEW_RULES).toContain('### NEVER Rules')
  })

  it('contains Audit Checklist', () => {
    expect(REACT_HOOKS_REVIEW_RULES).toContain('### Audit Checklist')
  })

  it('contains Pattern → Fix table', () => {
    expect(REACT_HOOKS_REVIEW_RULES).toContain('Pattern')
    expect(REACT_HOOKS_REVIEW_RULES).toContain('Fix')
  })

  it('covers key hook APIs', () => {
    expect(REACT_HOOKS_REVIEW_RULES).toContain('useCallback')
    expect(REACT_HOOKS_REVIEW_RULES).toContain('useMemo')
    expect(REACT_HOOKS_REVIEW_RULES).toContain('useEffect')
  })

  it('covers key anti-patterns', () => {
    expect(REACT_HOOKS_REVIEW_RULES).toContain('referentially stable')
    expect(REACT_HOOKS_REVIEW_RULES).toContain('dependency')
    expect(REACT_HOOKS_REVIEW_RULES).toContain('inline')
  })
})
