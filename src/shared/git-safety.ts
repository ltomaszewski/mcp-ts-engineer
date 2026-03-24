/**
 * Git safety utilities for protecting infrastructure files from accidental deletion.
 *
 * Used by pr-reviewer orchestration to auto-revert deletions of protected files
 * (scripts, config files, E2E helpers) that agents may incorrectly remove.
 */

import { execFileSync } from 'child_process'

/**
 * Patterns matching infrastructure files that must never be deleted by automated tools.
 * These files are invoked by tooling, CI, or test runners — not imported by app code,
 * so static analysis (knip) cannot detect their usage.
 */
const PROTECTED_PATTERNS: readonly RegExp[] = [
  /(?:^|\/)?scripts\//, // */scripts/**
  /(?:^|\/)\.maestro\//, // */.maestro/**
  /(?:^|\/)metro\.config\./, // metro.config.*
  /(?:^|\/)babel\.config\./, // babel.config.*
  /(?:^|\/)jest\.config\./, // jest.config.*
  /(?:^|\/)vitest\.config\./, // vitest.config.*
  /(?:^|\/)knip\./, // knip.config.*, knip.json
  /(?:^|\/)app\.config\./, // app.config.ts (Expo)
  /(?:^|\/)tailwind\.config\./, // tailwind.config.*
  /(?:^|\/)tsconfig\./, // tsconfig*.json
  /(?:^|\/)biome\.json/, // biome.json
]

/**
 * Check if a file path matches a protected pattern.
 */
export function isProtectedPath(filePath: string): boolean {
  return PROTECTED_PATTERNS.some((p) => p.test(filePath))
}

/**
 * Detect and revert deleted protected files in the working directory.
 *
 * Parses `git diff --name-status HEAD` for deleted files (D status),
 * checks them against protected patterns, and restores matches
 * with `git checkout HEAD -- <file>`.
 *
 * @returns List of file paths that were reverted
 */
export function revertDeletedProtectedFiles(cwd: string): string[] {
  let output: string
  try {
    output = execFileSync('git', ['diff', '--name-status', 'HEAD'], {
      cwd,
      encoding: 'utf-8',
      timeout: 10_000,
    })
  } catch {
    // If git diff fails (no HEAD, not a repo, etc.), skip validation
    return []
  }

  const deletedProtected = output
    .split('\n')
    .filter((line) => line.startsWith('D\t'))
    .map((line) => line.slice(2))
    .filter(isProtectedPath)

  for (const file of deletedProtected) {
    try {
      execFileSync('git', ['checkout', 'HEAD', '--', file], {
        cwd,
        encoding: 'utf-8',
        timeout: 5_000,
      })
    } catch {
      // Best-effort recovery — log will capture any failures
    }
  }

  return deletedProtected
}
