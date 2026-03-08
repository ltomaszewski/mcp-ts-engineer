import { describe, expect, it } from 'vitest'
import { isValidGitRef, isValidGitSha, isValidPath, shellQuote } from '../shell-safe.js'

describe('shellQuote', () => {
  it('wraps simple values in single quotes', () => {
    expect(shellQuote('hello')).toBe("'hello'")
  })

  it('escapes embedded single quotes', () => {
    expect(shellQuote("it's")).toBe("'it'\\''s'")
  })

  it('handles empty string', () => {
    expect(shellQuote('')).toBe("''")
  })

  it('neutralizes shell metacharacters by enclosing in single quotes', () => {
    const malicious = 'main; rm -rf /'
    const quoted = shellQuote(malicious)
    expect(quoted).toBe("'main; rm -rf /'")
    // Metacharacters are safely inside single quotes and won't be interpreted by shell
    expect(quoted.startsWith("'")).toBe(true)
    expect(quoted.endsWith("'")).toBe(true)
  })

  it('neutralizes command substitution', () => {
    expect(shellQuote('$(whoami)')).toBe("'$(whoami)'")
  })

  it('neutralizes backtick substitution', () => {
    expect(shellQuote('`whoami`')).toBe("'`whoami`'")
  })

  it('neutralizes pipe and redirect', () => {
    expect(shellQuote('foo | bar > baz')).toBe("'foo | bar > baz'")
  })
})

describe('isValidGitRef', () => {
  it('accepts valid branch names', () => {
    expect(isValidGitRef('main')).toBe(true)
    expect(isValidGitRef('feature/my-branch')).toBe(true)
    expect(isValidGitRef('release/v1.0.0')).toBe(true)
    expect(isValidGitRef('fix/issue-123')).toBe(true)
    expect(isValidGitRef('user/feature_branch')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidGitRef('')).toBe(false)
  })

  it('rejects shell metacharacters', () => {
    expect(isValidGitRef('main; rm -rf /')).toBe(false)
    expect(isValidGitRef('branch && echo pwned')).toBe(false)
    expect(isValidGitRef('branch | cat /etc/passwd')).toBe(false)
    expect(isValidGitRef('$(whoami)')).toBe(false)
    expect(isValidGitRef('`whoami`')).toBe(false)
  })

  it('rejects path traversal', () => {
    expect(isValidGitRef('../../etc/passwd')).toBe(false)
  })

  it('rejects .lock suffix', () => {
    expect(isValidGitRef('branch.lock')).toBe(false)
  })

  it('rejects trailing slash', () => {
    expect(isValidGitRef('branch/')).toBe(false)
  })

  it('rejects very long refs', () => {
    expect(isValidGitRef('a'.repeat(257))).toBe(false)
  })
})

describe('isValidGitSha', () => {
  it('accepts valid short SHA', () => {
    expect(isValidGitSha('abc1234')).toBe(true)
  })

  it('accepts valid full SHA (40 chars)', () => {
    expect(isValidGitSha('abc1234567890def1234567890abc12345678901')).toBe(true)
  })

  it('rejects too short', () => {
    expect(isValidGitSha('abc123')).toBe(false)
  })

  it('rejects too long', () => {
    expect(isValidGitSha('a'.repeat(41))).toBe(false)
  })

  it('rejects non-hex characters', () => {
    expect(isValidGitSha('abcdefg')).toBe(false)
    expect(isValidGitSha('ABCDEF1')).toBe(false)
  })

  it('rejects shell metacharacters', () => {
    expect(isValidGitSha('abc1234; rm')).toBe(false)
  })
})

describe('isValidPath', () => {
  it('accepts valid paths', () => {
    expect(isValidPath('.worktrees/pr-123-review-1234567')).toBe(true)
    expect(isValidPath('/absolute/path/to/dir')).toBe(true)
    expect(isValidPath('relative/path')).toBe(true)
  })

  it('rejects empty string', () => {
    expect(isValidPath('')).toBe(false)
  })

  it('rejects path traversal', () => {
    expect(isValidPath('../../../etc/passwd')).toBe(false)
    expect(isValidPath('foo/../bar')).toBe(false)
  })

  it('rejects shell metacharacters', () => {
    expect(isValidPath('path; rm -rf /')).toBe(false)
    expect(isValidPath('path && echo pwned')).toBe(false)
    expect(isValidPath('$(whoami)')).toBe(false)
    expect(isValidPath('`whoami`')).toBe(false)
  })

  it('rejects very long paths', () => {
    expect(isValidPath('a'.repeat(513))).toBe(false)
  })
})
