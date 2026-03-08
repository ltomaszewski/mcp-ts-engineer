import { vi } from 'vitest'

/**
 * Tests for git utility functions.
 */

// ---------------------------------------------------------------------------
// Mock child_process before importing the module under test (ESM mocking)
// ---------------------------------------------------------------------------
const { mockExecFileSync } = vi.hoisted(() => ({
  mockExecFileSync: vi.fn<(file: string, args: string[], opts: unknown) => Buffer>(),
}))

vi.mock('node:child_process', () => ({
  execFileSync: mockExecFileSync,
}))

// Dynamic import after mock setup (required for ESM mocking)
const { hasUncommittedChanges, isFileTracked, fileNeedsCommit } = await import('../git-utils.js')

beforeEach(() => {
  vi.clearAllMocks()
})

describe('git-utils', () => {
  describe('hasUncommittedChanges', () => {
    it('returns false when file has no changes (both git diff commands succeed)', () => {
      // Both commands succeed = no changes
      mockExecFileSync.mockReturnValue(Buffer.from(''))

      const result = hasUncommittedChanges('test.md')

      expect(result).toBe(false)
      expect(mockExecFileSync).toHaveBeenCalledTimes(2)
    })

    it('returns true when file has unstaged changes (first git diff fails)', () => {
      // First call (unstaged) fails
      mockExecFileSync.mockImplementationOnce(() => {
        throw new Error('exit code 1')
      })

      const result = hasUncommittedChanges('test.md')

      expect(result).toBe(true)
      expect(mockExecFileSync).toHaveBeenCalledTimes(1)
    })

    it('returns true when file has staged changes (second git diff fails)', () => {
      // First call (unstaged) succeeds
      mockExecFileSync.mockReturnValueOnce(Buffer.from(''))
      // Second call (staged) fails
      mockExecFileSync.mockImplementationOnce(() => {
        throw new Error('exit code 1')
      })

      const result = hasUncommittedChanges('test.md')

      expect(result).toBe(true)
      expect(mockExecFileSync).toHaveBeenCalledTimes(2)
    })

    it('uses provided cwd for git operations', () => {
      mockExecFileSync.mockReturnValue(Buffer.from(''))

      hasUncommittedChanges('test.md', '/custom/path')

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['diff', '--quiet']),
        expect.objectContaining({ cwd: '/custom/path' }),
      )
    })
  })

  describe('isFileTracked', () => {
    it('returns true when file is tracked', () => {
      mockExecFileSync.mockReturnValue(Buffer.from('test.md'))

      const result = isFileTracked('test.md')

      expect(result).toBe(true)
      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        expect.arrayContaining(['ls-files', '--error-unmatch']),
        expect.any(Object),
      )
    })

    it('returns false when file is not tracked', () => {
      mockExecFileSync.mockImplementation(() => {
        throw new Error('exit code 1')
      })

      const result = isFileTracked('untracked.md')

      expect(result).toBe(false)
    })

    it('uses provided cwd for git operations', () => {
      mockExecFileSync.mockReturnValue(Buffer.from(''))

      isFileTracked('test.md', '/custom/path')

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        expect.any(Array),
        expect.objectContaining({ cwd: '/custom/path' }),
      )
    })
  })

  describe('fileNeedsCommit', () => {
    it('returns true when file has uncommitted changes', () => {
      // hasUncommittedChanges returns true (first diff fails)
      mockExecFileSync.mockImplementationOnce(() => {
        throw new Error('exit code 1')
      })

      const result = fileNeedsCommit('test.md')

      expect(result).toBe(true)
    })

    it('returns true when file is untracked (new file)', () => {
      // hasUncommittedChanges returns false (both diffs succeed)
      mockExecFileSync
        .mockReturnValueOnce(Buffer.from('')) // unstaged diff
        .mockReturnValueOnce(Buffer.from('')) // staged diff

      // isFileTracked returns false (ls-files fails)
      mockExecFileSync.mockImplementationOnce(() => {
        throw new Error('exit code 1')
      })

      const result = fileNeedsCommit('new-file.md')

      expect(result).toBe(true)
    })

    it('returns false when file is clean and tracked', () => {
      // hasUncommittedChanges returns false
      mockExecFileSync
        .mockReturnValueOnce(Buffer.from('')) // unstaged diff
        .mockReturnValueOnce(Buffer.from('')) // staged diff

      // isFileTracked returns true
      mockExecFileSync.mockReturnValueOnce(Buffer.from('test.md'))

      const result = fileNeedsCommit('test.md')

      expect(result).toBe(false)
    })

    it('uses provided cwd', () => {
      // Make all checks pass (clean file)
      mockExecFileSync
        .mockReturnValueOnce(Buffer.from(''))
        .mockReturnValueOnce(Buffer.from(''))
        .mockReturnValueOnce(Buffer.from('test.md'))

      fileNeedsCommit('test.md', '/custom/path')

      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        expect.any(Array),
        expect.objectContaining({ cwd: '/custom/path' }),
      )
    })
  })
})
