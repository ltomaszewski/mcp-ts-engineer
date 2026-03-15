import { vi } from 'vitest'

/**
 * Tests for git utility functions.
 */

// ---------------------------------------------------------------------------
// Mock child_process and node:fs before importing the module under test
// ---------------------------------------------------------------------------
const { mockExecFileSync } = vi.hoisted(() => ({
  mockExecFileSync: vi.fn<(file: string, args: string[], opts: unknown) => Buffer>(),
}))

const { mockExistsSync, mockReadFileSync, mockStatSync } = vi.hoisted(() => ({
  mockExistsSync: vi.fn<(path: string) => boolean>(),
  mockReadFileSync: vi.fn<(path: string, encoding: string) => string>(),
  mockStatSync: vi.fn<(path: string) => { isFile: () => boolean; isDirectory: () => boolean }>(),
}))

vi.mock('node:child_process', () => ({
  execFileSync: mockExecFileSync,
}))

vi.mock('node:fs', () => ({
  existsSync: mockExistsSync,
  readFileSync: mockReadFileSync,
  statSync: mockStatSync,
}))

// Dynamic import after mock setup (required for ESM mocking)
const { hasUncommittedChanges, isFileTracked, fileNeedsCommit, resolveGitRoot } = await import(
  '../git-utils.js'
)

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

  describe('resolveGitRoot', () => {
    it('returns git rev-parse output for normal repos', () => {
      // execFileSync with encoding:'utf-8' returns string, not Buffer
      mockExecFileSync.mockReturnValueOnce('/repo/root\n' as unknown as Buffer)

      const result = resolveGitRoot('/repo/root/src')

      expect(result).toBe('/repo/root')
      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        ['rev-parse', '--show-toplevel'],
        expect.objectContaining({ cwd: '/repo/root/src' }),
      )
    })

    it('returns git rev-parse output for worktree directories', () => {
      // git rev-parse --show-toplevel works correctly in worktrees too
      mockExecFileSync.mockReturnValueOnce('/repo/.worktrees/feature\n' as unknown as Buffer)

      const result = resolveGitRoot('/repo/.worktrees/feature')

      expect(result).toBe('/repo/.worktrees/feature')
    })

    it('falls back to walking up when git command fails', () => {
      // git rev-parse fails
      mockExecFileSync.mockImplementationOnce(() => {
        throw new Error('not a git repo')
      })
      // Fallback: walk up to find .git
      mockExistsSync.mockImplementation((p: string) => p === '/repo/.git')
      mockStatSync.mockReturnValue({
        isFile: () => false,
        isDirectory: () => true,
      })

      const result = resolveGitRoot('/repo/src/deep')

      expect(result).toBe('/repo')
    })

    it('resolves worktree .git file to main repo root in fallback', () => {
      // git rev-parse fails
      mockExecFileSync.mockImplementationOnce(() => {
        throw new Error('not a git repo')
      })
      // Walk up finds .git file at worktree root
      mockExistsSync.mockImplementation(
        (p: string) => p === '/main-repo/.worktrees/feature/.git',
      )
      mockStatSync.mockReturnValue({
        isFile: () => true,
        isDirectory: () => false,
      })
      mockReadFileSync.mockReturnValue(
        'gitdir: /main-repo/.git/worktrees/feature\n',
      )

      const result = resolveGitRoot('/main-repo/.worktrees/feature/src')

      expect(result).toBe('/main-repo')
    })

    it('returns input dir when no .git found anywhere', () => {
      mockExecFileSync.mockImplementationOnce(() => {
        throw new Error('not a git repo')
      })
      mockExistsSync.mockReturnValue(false)

      const result = resolveGitRoot('/no-git-here')

      expect(result).toBe('/no-git-here')
    })
  })
})
