/**
 * Spec status update utility.
 * Handles programmatic transitions between spec lifecycle states.
 */

import { readFile, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'

/**
 * Update spec status from one state to another.
 * Handles both bold (**Status**: X) and plain (Status: X) markdown formats.
 *
 * @param specPath - Relative or absolute path to the spec file
 * @param fromStatus - Current status value to find (e.g., "IN_REVIEW")
 * @param toStatus - New status value to set (e.g., "READY")
 * @param cwd - Optional working directory for resolving relative paths
 * @returns true if the file was updated, false if no replacement was made
 * @throws on file read/write errors
 *
 * @example
 * ```ts
 * // Transition spec from IN_REVIEW to READY
 * const updated = await updateSpecStatus(
 *   "docs/specs/app/feature.md",
 *   "IN_REVIEW",
 *   "READY"
 * );
 * if (updated) {
 *   console.log("Spec status updated successfully");
 * }
 * ```
 */
export async function updateSpecStatus(
  specPath: string,
  fromStatus: string,
  toStatus: string,
  cwd?: string,
): Promise<boolean> {
  const absolutePath = resolve(cwd || process.cwd(), specPath)
  const content = await readFile(absolutePath, 'utf8')

  // Try bold markdown format first (**Status**: X)
  const boldPattern = new RegExp(`\\*\\*Status\\*\\*:\\s*${fromStatus}`, 'g')
  let updated = content.replace(boldPattern, `**Status**: ${toStatus}`)

  // Fallback to plain format (Status: X)
  if (updated === content) {
    const plainPattern = new RegExp(`Status:\\s*${fromStatus}`, 'g')
    updated = content.replace(plainPattern, `Status: ${toStatus}`)
  }

  if (updated !== content) {
    await writeFile(absolutePath, updated, 'utf8')
    return true
  }

  return false
}
