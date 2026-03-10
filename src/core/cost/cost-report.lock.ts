/**
 * File locking utilities for atomic cost report writes.
 * Extracted from cost-report.writer.ts to keep files under 300 lines.
 */

import crypto from 'node:crypto'
import fs from 'node:fs/promises'
import path from 'node:path'
import { LOCK_JITTER_MS, LOCK_POLL_MS, LOCK_TIMEOUT_MS, STALE_LOCK_AGE_MS } from '../../config/constants.js'

/**
 * Acquires a lock for the given date's report file.
 * Uses O_CREAT | O_EXCL for atomic lock creation.
 *
 * @param reportsDir - Directory where report and lock files live
 * @param date - Date string (YYYY-MM-DD) used to name the lock file
 * @throws Error if lock cannot be acquired within LOCK_TIMEOUT_MS
 */
export async function acquireLock(reportsDir: string, date: string): Promise<void> {
  const lockPath = path.join(reportsDir, `${date}.lock`)
  const startTime = Date.now()

  while (true) {
    try {
      // Try to create lock file (O_CREAT | O_EXCL)
      const handle = await fs.open(lockPath, 'wx')
      await handle.writeFile(process.pid.toString())
      await handle.close()
      return // Lock acquired
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== 'EEXIST') {
        throw error
      }

      // Lock file exists - check if stale
      try {
        const stats = await fs.stat(lockPath)
        const lockAge = Date.now() - stats.mtimeMs

        if (lockAge > STALE_LOCK_AGE_MS) {
          // Stale lock - try to remove
          try {
            await fs.unlink(lockPath)
            continue // Retry acquisition
          } catch {
            // Another process may have removed it
          }
        }
      } catch {
        // Lock file disappeared - retry
        continue
      }

      // Check timeout
      if (Date.now() - startTime > LOCK_TIMEOUT_MS) {
        throw new Error(`Lock acquisition timeout for ${date}`)
      }

      // Wait with jitter
      const jitter = crypto.randomInt(0, LOCK_JITTER_MS)
      await sleep(LOCK_POLL_MS + jitter)
    }
  }
}

/**
 * Releases the lock for the given date's report file.
 *
 * @param reportsDir - Directory where the lock file lives
 * @param date - Date string (YYYY-MM-DD)
 */
export async function releaseLock(reportsDir: string, date: string): Promise<void> {
  const lockPath = path.join(reportsDir, `${date}.lock`)

  try {
    await fs.unlink(lockPath)
  } catch {
    // Ignore errors (lock may have been removed as stale)
  }
}

/**
 * Sleep for the specified duration.
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
