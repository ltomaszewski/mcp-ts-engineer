import {
  serializeState,
  parseState,
  REVIEWER_STATE_MARKER,
  FIXER_STATE_MARKER,
  type PrCommentState,
} from '../pr-comment-state.js'

describe('serializeState', () => {
  it('produces a hidden HTML comment with marker and JSON', () => {
    const state: PrCommentState = {
      v: 1,
      round: 1,
      sha: 'abc123',
      issues: { def456: 'open' },
    }
    const result = serializeState(REVIEWER_STATE_MARKER, state)
    expect(result).toBe(
      '<!-- pr-review-state:{"v":1,"round":1,"sha":"abc123","issues":{"def456":"open"}} -->',
    )
  })

  it('works with fixer marker', () => {
    const state: PrCommentState = {
      v: 1,
      round: 2,
      sha: 'xyz789',
      issues: { aaa111: 'fixed', bbb222: 'wontfix' },
    }
    const result = serializeState(FIXER_STATE_MARKER, state)
    expect(result).toContain('<!-- pr-fixer-state:')
    expect(result).toContain('"round":2')
  })
})

describe('parseState', () => {
  it('extracts state from comment body', () => {
    const body = [
      '## PR Review',
      'Some content here',
      '<!-- pr-review-state:{"v":1,"round":1,"sha":"abc","issues":{"x":"open"}} -->',
    ].join('\n')

    const state = parseState(REVIEWER_STATE_MARKER, body)
    expect(state).toEqual({
      v: 1,
      round: 1,
      sha: 'abc',
      issues: { x: 'open' },
    })
  })

  it('returns null when marker not found', () => {
    const body = '## PR Review\nNo state here'
    expect(parseState(REVIEWER_STATE_MARKER, body)).toBeNull()
  })

  it('returns null for invalid JSON', () => {
    const body = '<!-- pr-review-state:{invalid} -->'
    expect(parseState(REVIEWER_STATE_MARKER, body)).toBeNull()
  })

  it('returns null for wrong version', () => {
    const body = '<!-- pr-review-state:{"v":2,"round":1,"sha":"abc","issues":{}} -->'
    expect(parseState(REVIEWER_STATE_MARKER, body)).toBeNull()
  })

  it('distinguishes between different markers', () => {
    const body = '<!-- pr-fixer-state:{"v":1,"round":1,"sha":"abc","issues":{}} -->'
    expect(parseState(REVIEWER_STATE_MARKER, body)).toBeNull()
    expect(parseState(FIXER_STATE_MARKER, body)).not.toBeNull()
  })

  it('round-trips through serialize → parse', () => {
    const original: PrCommentState = {
      v: 1,
      round: 3,
      sha: 'deadbeef',
      issues: { a: 'open', b: 'fixed', c: 'wontfix' },
    }
    const serialized = serializeState(REVIEWER_STATE_MARKER, original)
    const parsed = parseState(REVIEWER_STATE_MARKER, `Some text\n${serialized}\nMore text`)
    expect(parsed).toEqual(original)
  })
})
