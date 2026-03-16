/**
 * Working directory resolution utilities.
 * Single source of truth for cwd fallback logic across the codebase.
 */

import { getProjectConfig } from '../../config/project-config.js'

/**
 * Resolves the effective working directory.
 * Uses provided cwd or falls back to monorepoRoot from project config.
 *
 * @param cwd - Explicit working directory (e.g. worktree path), or undefined
 * @returns Resolved absolute path
 */
export function resolveCwd(cwd: string | undefined): string {
  return cwd ?? getProjectConfig().monorepoRoot
}

/**
 * Joins a root directory with a relative path for shell commands.
 * Avoids inconsistent inline path construction across prompt templates.
 *
 * @param root - Resolved cwd or monorepoRoot
 * @param relativePath - Project-relative path (e.g. 'apps/my-server')
 * @returns Combined path string
 */
export function cwdPath(root: string, relativePath: string): string {
  return `${root}/${relativePath}`
}
