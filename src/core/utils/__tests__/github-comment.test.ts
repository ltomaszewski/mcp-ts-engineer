import { type Mock, afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { findCommentByMarker, postOrUpdateComment } from '../github-comment.js'
import { FIXER_STATE_MARKER, REVIEWER_STATE_MARKER, serializeState } from '../pr-comment-state.js'

// Mock child_process
vi.mock('node:child_process', () => ({
  execFileSync: vi.fn(),
}))

// Import the mock after vi.mock
import { execFileSync } from 'node:child_process'
const mockExec = execFileSync as Mock

beforeEach(() => {
  vi.clearAllMocks()
})

afterEach(() => {
  vi.restoreAllMocks()
})

// ---------------------------------------------------------------------------
// findCommentByMarker
// ---------------------------------------------------------------------------

describe('findCommentByMarker', () => {
  it('returns comment ID when marker found', () => {
    mockExec.mockReturnValueOnce('12345\n')

    const result = findCommentByMarker('owner', 'repo', 42, '<!-- pr-review-state:')
    expect(result).toBe('12345')
  })

  it('returns null when no match found', () => {
    mockExec.mockReturnValueOnce('null\n')

    const result = findCommentByMarker('owner', 'repo', 42, '<!-- pr-review-state:')
    expect(result).toBeNull()
  })

  it('returns null when result is empty', () => {
    mockExec.mockReturnValueOnce('')

    const result = findCommentByMarker('owner', 'repo', 42, '<!-- pr-review-state:')
    expect(result).toBeNull()
  })

  it('returns null when gh throws', () => {
    mockExec.mockImplementationOnce(() => {
      throw new Error('gh: not found')
    })

    const result = findCommentByMarker('owner', 'repo', 42, '<!-- pr-review-state:')
    expect(result).toBeNull()
  })

  it('returns null when result is not digit-only', () => {
    mockExec.mockReturnValueOnce('abc\n')

    const result = findCommentByMarker('owner', 'repo', 42, '<!-- pr-review-state:')
    expect(result).toBeNull()
  })

  it('accepts HTML comment markers (the real use case)', () => {
    mockExec.mockReturnValueOnce('99999')

    const result = findCommentByMarker('owner', 'repo', 1, '<!-- pr-review-state:')
    expect(result).toBe('99999')
    expect(mockExec).toHaveBeenCalledWith(
      'gh',
      expect.arrayContaining([
        expect.stringContaining('contains("<!-- pr-review-state:")'),
      ]),
      expect.any(Object),
    )
  })

  it('accepts pr-fixer-state marker', () => {
    mockExec.mockReturnValueOnce('88888')

    const result = findCommentByMarker('owner', 'repo', 1, '<!-- pr-fixer-state:')
    expect(result).toBe('88888')
  })

  it('rejects marker containing double quotes (jq safety)', () => {
    const result = findCommentByMarker('owner', 'repo', 1, 'bad"marker')
    expect(result).toBeNull()
    expect(mockExec).not.toHaveBeenCalled()
  })

  it('rejects marker containing backslash (jq safety)', () => {
    const result = findCommentByMarker('owner', 'repo', 1, 'bad\\marker')
    expect(result).toBeNull()
    expect(mockExec).not.toHaveBeenCalled()
  })

  it('rejects unsafe owner', () => {
    const result = findCommentByMarker('bad;owner', 'repo', 1, '<!-- test:')
    expect(result).toBeNull()
  })

  it('rejects unsafe repo', () => {
    const result = findCommentByMarker('owner', 'bad;repo', 1, '<!-- test:')
    expect(result).toBeNull()
  })

  it('uses 15s timeout', () => {
    mockExec.mockReturnValueOnce('123')

    findCommentByMarker('owner', 'repo', 1, '<!-- test:')
    expect(mockExec).toHaveBeenCalledWith(
      'gh',
      expect.any(Array),
      expect.objectContaining({ timeout: 15_000 }),
    )
  })

  it('retries on transient error', () => {
    mockExec
      .mockImplementationOnce(() => {
        throw new Error('ETIMEDOUT')
      })
      .mockReturnValueOnce('12345')

    const result = findCommentByMarker('owner', 'repo', 42, '<!-- test:')
    expect(result).toBe('12345')
    expect(mockExec).toHaveBeenCalledTimes(2)
  })
})

// ---------------------------------------------------------------------------
// postOrUpdateComment
// ---------------------------------------------------------------------------

describe('postOrUpdateComment', () => {
  const body = '## Review\nSome content\n<!-- pr-review-state:{"v":1} -->'

  describe('new comment (no existing)', () => {
    it('posts via gh api and returns html_url', () => {
      // findCommentByMarker returns null (no existing)
      mockExec.mockReturnValueOnce('null\n')
      // gh api POST returns JSON
      mockExec.mockReturnValueOnce(
        JSON.stringify({ html_url: 'https://github.com/o/r/pull/1#issuecomment-123' }),
      )

      const url = postOrUpdateComment('owner', 'repo', 1, body, '<!-- pr-review-state:')
      expect(url).toBe('https://github.com/o/r/pull/1#issuecomment-123')

      // Verify the POST call uses gh api (not gh pr comment)
      const postCall = mockExec.mock.calls[1]
      expect(postCall[0]).toBe('gh')
      expect(postCall[1]).toContain('api')
      expect(postCall[1]).toContain('-X')
      expect(postCall[1]).toContain('POST')
      expect(postCall[1]).toContain('repos/owner/repo/issues/1/comments')
    })

    it('sends body as JSON payload via --input -', () => {
      mockExec.mockReturnValueOnce('null\n')
      mockExec.mockReturnValueOnce(JSON.stringify({ html_url: 'https://url' }))

      postOrUpdateComment('owner', 'repo', 1, body, '<!-- pr-review-state:')

      const postCall = mockExec.mock.calls[1]
      const options = postCall[2] as { input: string }
      const payload = JSON.parse(options.input)
      expect(payload.body).toBe(body)
    })
  })

  describe('update existing comment', () => {
    it('updates via PATCH and returns html_url', () => {
      // findCommentByMarker returns existing ID
      mockExec.mockReturnValueOnce('55555')
      // PATCH returns JSON
      mockExec.mockReturnValueOnce(
        JSON.stringify({ html_url: 'https://github.com/o/r/pull/1#issuecomment-55555' }),
      )

      const url = postOrUpdateComment('owner', 'repo', 1, body, '<!-- pr-review-state:')
      expect(url).toBe('https://github.com/o/r/pull/1#issuecomment-55555')

      const patchCall = mockExec.mock.calls[1]
      expect(patchCall[1]).toContain('PATCH')
      expect(patchCall[1]).toContain('repos/owner/repo/issues/comments/55555')
    })
  })

  describe('body size validation', () => {
    it('throws when body exceeds GitHub limit', () => {
      const hugeBody = 'x'.repeat(65537)
      expect(() => postOrUpdateComment('owner', 'repo', 1, hugeBody, '<!-- test:')).toThrow(
        /exceeds GitHub limit/,
      )
      expect(mockExec).not.toHaveBeenCalled()
    })

    it('accepts body at exactly the limit', () => {
      const maxBody = 'x'.repeat(65536)
      mockExec.mockReturnValueOnce('null\n')
      mockExec.mockReturnValueOnce(JSON.stringify({ html_url: 'https://url' }))

      expect(() =>
        postOrUpdateComment('owner', 'repo', 1, maxBody, '<!-- test:'),
      ).not.toThrow()
    })
  })

  describe('input validation', () => {
    it('throws on unsafe owner', () => {
      expect(() => postOrUpdateComment('bad;owner', 'repo', 1, body, '<!-- test:')).toThrow(
        /Unsafe owner/,
      )
    })

    it('throws on unsafe repo', () => {
      expect(() => postOrUpdateComment('owner', 'bad;repo', 1, body, '<!-- test:')).toThrow(
        /Unsafe repo/,
      )
    })
  })

  describe('retry behavior', () => {
    it('retries POST on transient error and succeeds', () => {
      // findCommentByMarker - no existing
      mockExec.mockReturnValueOnce('null\n')
      // First POST attempt - transient failure
      mockExec.mockImplementationOnce(() => {
        throw new Error('ETIMEDOUT')
      })
      // Second POST attempt - success
      mockExec.mockReturnValueOnce(JSON.stringify({ html_url: 'https://url' }))

      const url = postOrUpdateComment('owner', 'repo', 1, body, '<!-- pr-review-state:')
      expect(url).toBe('https://url')
      // find (1) + failed POST (1) + successful POST (1) = 3
      expect(mockExec).toHaveBeenCalledTimes(3)
    })

    it('does not retry on non-transient error', () => {
      mockExec.mockReturnValueOnce('null\n')
      mockExec.mockImplementationOnce(() => {
        throw new Error('HTTP 422: Validation Failed')
      })

      expect(() =>
        postOrUpdateComment('owner', 'repo', 1, body, '<!-- pr-review-state:'),
      ).toThrow(/422/)
      // find (1) + failed POST (1) = 2 (no retry)
      expect(mockExec).toHaveBeenCalledTimes(2)
    })

    it('throws after max retries exhausted', () => {
      mockExec.mockReturnValueOnce('null\n')
      // All POST attempts fail with transient error
      mockExec.mockImplementation(() => {
        throw new Error('ETIMEDOUT')
      })

      expect(() =>
        postOrUpdateComment('owner', 'repo', 1, body, '<!-- pr-review-state:'),
      ).toThrow(/ETIMEDOUT/)
    })
  })

  describe('returns empty string when html_url missing', () => {
    it('POST response without html_url returns empty string', () => {
      mockExec.mockReturnValueOnce('null\n')
      mockExec.mockReturnValueOnce(JSON.stringify({ id: 123 }))

      const url = postOrUpdateComment('owner', 'repo', 1, body, '<!-- test:')
      expect(url).toBe('')
    })

    it('PATCH response without html_url returns empty string', () => {
      mockExec.mockReturnValueOnce('55555')
      mockExec.mockReturnValueOnce(JSON.stringify({ id: 55555 }))

      const url = postOrUpdateComment('owner', 'repo', 1, body, '<!-- test:')
      expect(url).toBe('')
    })
  })
})

// ---------------------------------------------------------------------------
// Integration tests: real marker constants + full comment lifecycle
// ---------------------------------------------------------------------------

describe('integration: real marker constants', () => {
  const prUrl = 'https://github.com/test-owner/test-repo/pull/42#issuecomment-789'

  it('REVIEWER_STATE_MARKER works with findCommentByMarker', () => {
    const marker = `<!-- ${REVIEWER_STATE_MARKER}:`
    mockExec.mockReturnValueOnce('44444')

    const result = findCommentByMarker('test-owner', 'test-repo', 42, marker)
    expect(result).toBe('44444')

    // Verify jq expression is correct
    const jqArg = mockExec.mock.calls[0][1][3] as string
    expect(jqArg).toContain(`contains("<!-- ${REVIEWER_STATE_MARKER}:")`)
  })

  it('FIXER_STATE_MARKER works with findCommentByMarker', () => {
    const marker = `<!-- ${FIXER_STATE_MARKER}:`
    mockExec.mockReturnValueOnce('55555')

    const result = findCommentByMarker('test-owner', 'test-repo', 42, marker)
    expect(result).toBe('55555')
  })

  it('full reviewer lifecycle: create new comment with state marker', () => {
    const marker = `<!-- ${REVIEWER_STATE_MARKER}:`
    const stateMarker = serializeState(REVIEWER_STATE_MARKER, {
      v: 1,
      round: 1,
      sha: 'abc123',
      issues: { 'issue-1': 'open' },
    })
    const commentBody = `## ✅ PR Review\n\nNo issues.\n\n${stateMarker}`

    // No existing comment
    mockExec.mockReturnValueOnce('null\n')
    // POST returns URL
    mockExec.mockReturnValueOnce(JSON.stringify({ html_url: prUrl }))

    const url = postOrUpdateComment('test-owner', 'test-repo', 42, commentBody, marker)
    expect(url).toBe(prUrl)

    // Verify POST payload contains the comment body with state marker
    const postOptions = mockExec.mock.calls[1][2] as { input: string }
    const payload = JSON.parse(postOptions.input)
    expect(payload.body).toContain(`<!-- ${REVIEWER_STATE_MARKER}:`)
    expect(payload.body).toContain('"issue-1":"open"')
  })

  it('full reviewer lifecycle: update existing comment (second round)', () => {
    const marker = `<!-- ${REVIEWER_STATE_MARKER}:`
    const stateMarker = serializeState(REVIEWER_STATE_MARKER, {
      v: 1,
      round: 2,
      sha: 'def456',
      issues: { 'issue-1': 'fixed', 'issue-2': 'open' },
    })
    const commentBody = `## ⚠️ PR Review — Changes Requested\n\n${stateMarker}`

    // Existing comment found
    mockExec.mockReturnValueOnce('77777')
    // PATCH returns updated URL
    mockExec.mockReturnValueOnce(
      JSON.stringify({ html_url: 'https://github.com/o/r/pull/42#issuecomment-77777' }),
    )

    const url = postOrUpdateComment('test-owner', 'test-repo', 42, commentBody, marker)
    expect(url).toBe('https://github.com/o/r/pull/42#issuecomment-77777')

    // Verify PATCH was used (not POST)
    const patchCall = mockExec.mock.calls[1]
    expect(patchCall[1]).toContain('PATCH')
    expect(patchCall[1]).toContain('repos/test-owner/test-repo/issues/comments/77777')
  })

  it('full fixer lifecycle: create and then update fixer comment', () => {
    const marker = `<!-- ${FIXER_STATE_MARKER}:`
    const body1 = `## PR Fixer — Round 1\n\n${serializeState(FIXER_STATE_MARKER, {
      v: 1, round: 1, sha: '', issues: { 'i1': 'fixed' },
    })}`

    // Round 1: no existing comment → POST
    mockExec.mockReturnValueOnce('null\n')
    mockExec.mockReturnValueOnce(JSON.stringify({ html_url: 'https://url/1' }))

    const url1 = postOrUpdateComment('owner', 'repo', 10, body1, marker)
    expect(url1).toBe('https://url/1')

    vi.clearAllMocks()

    // Round 2: existing comment found → PATCH
    const body2 = `## PR Fixer — Round 2\n\n${serializeState(FIXER_STATE_MARKER, {
      v: 1, round: 2, sha: '', issues: { 'i1': 'fixed', 'i2': 'fixed' },
    })}`

    mockExec.mockReturnValueOnce('88888')
    mockExec.mockReturnValueOnce(JSON.stringify({ html_url: 'https://url/2' }))

    const url2 = postOrUpdateComment('owner', 'repo', 10, body2, marker)
    expect(url2).toBe('https://url/2')

    const patchCall = mockExec.mock.calls[1]
    expect(patchCall[1]).toContain('PATCH')
  })
})
