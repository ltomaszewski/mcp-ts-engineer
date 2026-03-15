/**
 * Git utility functions for checking file status and resolving git context.
 * Used by orchestrators to detect actual file changes vs AI-reported changes.
 * Handles git worktrees where .git is a pointer file, not a directory.
 */

import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, isAbsolute, join, resolve } from 'node:path'

/**
 * Resolve the **main** git repository root from a given directory.
 * Handles both normal repos (.git is a directory) and worktrees (.git is a file
 * containing "gitdir: /path/to/main/.git/worktrees/name").
 *
 * Uses `git rev-parse --git-common-dir` which returns the shared .git directory
 * even from worktrees (unlike --show-toplevel which returns the worktree path).
 * Falls back to walking up the filesystem if git resolution fails.
 *
 * @param cwd - Directory to resolve from (may be a worktree or main repo)
 * @returns The main git repository root path (parent of .git)
 */
export function resolveGitRoot(cwd: string): string {
  try {
    const gitCommonDir = execFileSync('git', ['rev-parse', '--git-common-dir'], {
      cwd,
      encoding: 'utf-8',
      stdio: 'pipe',
      timeout: 5_000,
    }).trim()
    // --git-common-dir returns the shared .git dir (e.g. "/repo/.git")
    // Resolve to absolute (it may be relative like ".git") then take parent
    return resolve(cwd, gitCommonDir, '..')
  } catch {
    // Fallback: walk up looking for .git directory or file
    return findGitRoot(cwd)
  }
}

/**
 * Parse a worktree .git file to resolve the main repository root.
 * Worktree .git files contain "gitdir: /path/to/main/.git/worktrees/name".
 *
 * @param gitFilePath - Path to the .git file
 * @returns The main repo root path, or undefined if not a valid worktree pointer
 */
export function resolveWorktreeGitFile(gitFilePath: string): string | undefined {
  try {
    const content = readFileSync(gitFilePath, 'utf-8').trim()
    const match = content.match(/^gitdir:\s*(.+)$/)
    if (!match) return undefined
    // Resolve relative gitdir paths against the directory containing the .git file
    const rawGitdir = match[1]
    const gitdir = isAbsolute(rawGitdir)
      ? rawGitdir
      : resolve(dirname(gitFilePath), rawGitdir)
    const worktreesIdx = gitdir.lastIndexOf('/worktrees/')
    if (worktreesIdx === -1) return undefined
    // Strip /worktrees/<name> to get main .git dir, then take parent
    const mainGitDir = gitdir.substring(0, worktreesIdx)
    return resolve(mainGitDir, '..')
  } catch {
    return undefined
  }
}

/**
 * Walk up from startDir to find a directory containing .git (file or directory).
 * Used as fallback when `git rev-parse` fails.
 */
function findGitRoot(startDir: string): string {
  let dir = startDir
  while (true) {
    const gitPath = join(dir, '.git')
    if (existsSync(gitPath)) {
      const stat = statSync(gitPath)
      // For worktrees, .git is a file — parse it to find the main repo
      if (stat.isFile()) {
        const mainRoot = resolveWorktreeGitFile(gitPath)
        if (mainRoot) return mainRoot
      }
      return dir
    }
    const parent = resolve(dir, '..')
    if (parent === dir) break
    dir = parent
  }
  return startDir
}

/**
 * Check if a file has uncommitted changes (staged or unstaged).
 *
 * Uses `git diff --quiet` which returns:
 * - Exit code 0: No changes
 * - Exit code 1: Changes exist
 *
 * @param filePath - Relative or absolute path to the file
 * @param cwd - Optional working directory for git operations
 * @returns true if the file has uncommitted changes, false otherwise
 *
 * @example
 * ```ts
 * const hasChanges = hasUncommittedChanges("docs/specs/app/feature.md");
 * if (hasChanges) {
 *   console.log("File was modified");
 * }
 * ```
 */
export function hasUncommittedChanges(filePath: string, cwd?: string): boolean {
  const workingDir = cwd || process.cwd()
  const absolutePath = resolve(workingDir, filePath)

  try {
    // Check both staged and unstaged changes
    // git diff --quiet exits with 1 if there are changes, 0 if clean
    execFileSync('git', ['diff', '--quiet', '--', absolutePath], {
      cwd: workingDir,
      stdio: 'pipe',
    })

    // Also check staged changes
    execFileSync('git', ['diff', '--quiet', '--cached', '--', absolutePath], {
      cwd: workingDir,
      stdio: 'pipe',
    })

    // Both commands succeeded (exit 0) = no changes
    return false
  } catch (_error) {
    // Exit code 1 = changes exist (expected)
    // Any other error is treated as "has changes" to be safe
    return true
  }
}

/**
 * Check if a file is tracked by git.
 *
 * @param filePath - Relative or absolute path to the file
 * @param cwd - Optional working directory for git operations
 * @returns true if the file is tracked, false if untracked or not in a git repo
 */
export function isFileTracked(filePath: string, cwd?: string): boolean {
  const workingDir = cwd || process.cwd()
  const absolutePath = resolve(workingDir, filePath)

  try {
    execFileSync('git', ['ls-files', '--error-unmatch', absolutePath], {
      cwd: workingDir,
      stdio: 'pipe',
    })
    return true
  } catch (_error) {
    // File is untracked or not in a git repo
    return false
  }
}

/**
 * Check if a file has any changes (tracked modifications OR is untracked).
 * This is a more comprehensive check for "does this file need to be committed".
 *
 * @param filePath - Relative or absolute path to the file
 * @param cwd - Optional working directory for git operations
 * @returns true if the file has changes or is new/untracked, false if clean
 */
export function fileNeedsCommit(filePath: string, cwd?: string): boolean {
  const workingDir = cwd || process.cwd()

  // Check if file has uncommitted modifications
  if (hasUncommittedChanges(filePath, workingDir)) {
    return true
  }

  // Check if file is untracked (new file not yet added)
  if (!isFileTracked(filePath, workingDir)) {
    // File exists but is not tracked = needs to be added and committed
    return true
  }

  return false
}
