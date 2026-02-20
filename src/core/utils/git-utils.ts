/**
 * Git utility functions for checking file status.
 * Used by orchestrators to detect actual file changes vs AI-reported changes.
 */

import { execSync } from "node:child_process";
import { resolve } from "node:path";

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
  const workingDir = cwd || process.cwd();
  const absolutePath = resolve(workingDir, filePath);

  try {
    // Check both staged and unstaged changes
    // git diff --quiet exits with 1 if there are changes, 0 if clean
    execSync(`git diff --quiet -- "${absolutePath}"`, {
      cwd: workingDir,
      stdio: "pipe",
    });

    // Also check staged changes
    execSync(`git diff --quiet --cached -- "${absolutePath}"`, {
      cwd: workingDir,
      stdio: "pipe",
    });

    // Both commands succeeded (exit 0) = no changes
    return false;
  } catch (error) {
    // Exit code 1 = changes exist (expected)
    // Any other error is treated as "has changes" to be safe
    return true;
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
  const workingDir = cwd || process.cwd();
  const absolutePath = resolve(workingDir, filePath);

  try {
    execSync(`git ls-files --error-unmatch "${absolutePath}"`, {
      cwd: workingDir,
      stdio: "pipe",
    });
    return true;
  } catch (error) {
    // File is untracked or not in a git repo
    return false;
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
  const workingDir = cwd || process.cwd();

  // Check if file has uncommitted modifications
  if (hasUncommittedChanges(filePath, workingDir)) {
    return true;
  }

  // Check if file is untracked (new file not yet added)
  if (!isFileTracked(filePath, workingDir)) {
    // File exists but is not tracked = needs to be added and committed
    return true;
  }

  return false;
}
