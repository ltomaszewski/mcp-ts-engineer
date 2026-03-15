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
const {
  hasUncommittedChanges,
  isFileTracked,
  fileNeedsCommit,
  resolveGitRoot,
  resolveWorktreeGitFile,
} = await import('../git-utils.js')

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
    it('returns repo root for normal repos at root via --git-common-dir', () => {
      // --git-common-dir returns ".git" (relative to cwd) when at repo root
      mockExecFileSync.mockReturnValueOnce('.git\n' as unknown as Buffer)

      const result = resolveGitRoot('/repo/root')

      // resolve('/repo/root', '.git', '..') = /repo/root
      expect(result).toBe('/repo/root')
      expect(mockExecFileSync).toHaveBeenCalledWith(
        'git',
        ['rev-parse', '--git-common-dir'],
        expect.objectContaining({ cwd: '/repo/root' }),
      )
    })

    it('returns repo root from subdirectory via --git-common-dir', () => {
      // --git-common-dir from /repo/root/src returns relative path to .git
      mockExecFileSync.mockReturnValueOnce('../.git\n' as unknown as Buffer)

      const result = resolveGitRoot('/repo/root/src')

      // resolve('/repo/root/src', '../.git', '..') = /repo/root
      expect(result).toBe('/repo/root')
    })

    it('resolves worktree to main repo root via --git-common-dir', () => {
      // --git-common-dir returns the shared .git dir even from worktrees
      mockExecFileSync.mockReturnValueOnce('/repo/.git\n' as unknown as Buffer)

      const result = resolveGitRoot('/repo/.worktrees/feature')

      // Should resolve to parent of .git = /repo
      expect(result).toBe('/repo')
    })

    it('resolves relative --git-common-dir paths correctly', () => {
      // In a worktree, --git-common-dir may return a relative path like
      // "../../.git" when worktree is at /repo/.worktrees/feature
      mockExecFileSync.mockReturnValueOnce('../../.git\n' as unknown as Buffer)

      const result = resolveGitRoot('/repo/.worktrees/feature')

      // resolve('/repo/.worktrees/feature', '../../.git', '..') = /repo
      expect(result).toBe('/repo')
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

  describe('resolveWorktreeGitFile', () => {
    it('parses valid worktree .git file and returns main repo root', () => {
      mockReadFileSync.mockReturnValue(
        'gitdir: /main-repo/.git/worktrees/feature\n',
      )

      const result = resolveWorktreeGitFile('/some/.git')

      expect(result).toBe('/main-repo')
    })

    it('resolves relative gitdir path against .git file location', () => {
      // Git writes relative paths in worktree .git files by default
      // From /repo/.worktrees/feature to /repo/.git/worktrees/feature = ../../.git/worktrees/feature
      mockReadFileSync.mockReturnValue(
        'gitdir: ../../.git/worktrees/feature\n',
      )

      const result = resolveWorktreeGitFile('/repo/.worktrees/feature/.git')

      // dirname(.git file) = /repo/.worktrees/feature
      // resolve('/repo/.worktrees/feature', '../../.git/worktrees/feature') = /repo/.git/worktrees/feature
      // strip /worktrees/feature → /repo/.git → parent = /repo
      expect(result).toBe('/repo')
    })

    it('returns undefined for non-worktree .git file content', () => {
      mockReadFileSync.mockReturnValue('gitdir: /some/other/path\n')

      const result = resolveWorktreeGitFile('/some/.git')

      expect(result).toBeUndefined()
    })

    it('returns undefined when .git file has no gitdir line', () => {
      mockReadFileSync.mockReturnValue('not a gitdir line\n')

      const result = resolveWorktreeGitFile('/some/.git')

      expect(result).toBeUndefined()
    })

    it('returns undefined when .git file cannot be read', () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error('ENOENT')
      })

      const result = resolveWorktreeGitFile('/some/.git')

      expect(result).toBeUndefined()
    })
  })
})
