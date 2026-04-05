/**
 * Stale lock and orphaned temp file cleanup.
 * Runs at server startup to remove leftovers from crashed processes.
 */

import fs from 'node:fs/promises'
import path from 'node:path'
import { STALE_LOCK_AGE_MS } from '../../config/constants.js'

/**
 * Remove stale .lock files and orphaned .tmp-* files from the reports directory.
 *
 * A lock is considered stale if its mtime is older than STALE_LOCK_AGE_MS.
 * Orphaned .tmp-* files are always removed (they indicate incomplete writes).
 *
 * @param reportsDir - Directory containing cost report files
 * @returns Number of files cleaned up
 */
export async function cleanupStaleLocks(reportsDir: string): Promise<number> {
  let cleaned = 0

  let entries: string[]
  try {
    entries = await fs.readdir(reportsDir)
  } catch {
    // Directory doesn't exist yet — nothing to clean
    return 0
  }

  const now = Date.now()

  for (const entry of entries) {
    const filePath = path.join(reportsDir, entry)

    if (entry.endsWith('.lock')) {
      try {
        const stats = await fs.stat(filePath)
        if (now - stats.mtimeMs > STALE_LOCK_AGE_MS) {
          await fs.unlink(filePath)
          cleaned++
        }
      } catch {
        // File disappeared between readdir and stat — ignore
      }
    } else if (entry.startsWith('.tmp-')) {
      try {
        await fs.unlink(filePath)
        cleaned++
      } catch {
        // File disappeared — ignore
      }
    }
  }

  return cleaned
}
