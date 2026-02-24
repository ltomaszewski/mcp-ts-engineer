/**
 * Deterministic issue ID generation.
 * SHA-256 hash of file path + title, truncated to 12 hex chars.
 */

import { createHash } from 'node:crypto'

/**
 * Generate a deterministic issue ID from file path and title.
 * Same inputs always produce the same ID.
 *
 * @param filePath - File path the issue relates to
 * @param title - Issue title
 * @returns 12-character hex string
 */
export function generateIssueId(filePath: string, title: string): string {
  const input = `${filePath}::${title}`
  return createHash('sha256').update(input).digest('hex').slice(0, 12)
}
