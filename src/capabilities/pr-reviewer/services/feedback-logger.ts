/**
 * FeedbackLogger service - JSONL append with 10k entry rotation.
 * Tracks PR review outcomes for confidence adjustment.
 */

import fs from 'node:fs/promises'
import type { Logger } from '../../../core/logger/index.js'

/**
 * Feedback entry structure.
 */
export interface FeedbackEntry {
  pr_number: number
  issue_title: string
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  confidence: number
  was_fixed: boolean
  outcome: 'success' | 'reverted' | 'skipped'
}

/**
 * JSONL logger for PR review feedback with automatic rotation.
 */
export class FeedbackLogger {
  private logPath: string
  private readonly rotationThreshold = 10000
  private logger?: Logger

  constructor(logPath: string, logger?: Logger) {
    this.logPath = logPath
    this.logger = logger
  }

  /**
   * Append feedback entries to the JSONL log.
   * Automatically rotates if entry count exceeds threshold.
   *
   * @param entries - Feedback entries to append
   */
  async append(entries: FeedbackEntry[]): Promise<void> {
    if (entries.length === 0) {
      return
    }

    try {
      // Add timestamp to each entry
      const timestampedEntries = entries.map((entry) => ({
        ...entry,
        timestamp: new Date().toISOString(),
      }))

      // Convert to JSONL format (one JSON object per line)
      const jsonlContent = `${timestampedEntries.map((entry) => JSON.stringify(entry)).join('\n')}\n`

      // Append to file (create if doesn't exist)
      await fs.appendFile(this.logPath, jsonlContent, 'utf-8')

      // Check if rotation is needed
      await this.rotateIfNeeded()
    } catch (error) {
      // Log error but don't throw - feedback logging is non-critical
      if (this.logger) {
        this.logger.error(`Failed to append feedback: ${error}`)
      }
    }
  }

  /**
   * Rotate log file if entry count exceeds threshold.
   * Archives old entries and keeps only recent ones.
   */
  private async rotateIfNeeded(): Promise<void> {
    try {
      // Read current log
      const content = await fs.readFile(this.logPath, 'utf-8')
      const lines = content
        .trim()
        .split('\n')
        .filter((line) => line.length > 0)

      if (lines.length <= this.rotationThreshold) {
        return
      }

      // Archive old log with timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-')
      const archivePath = `${this.logPath}.${timestamp}`
      await fs.rename(this.logPath, archivePath)

      // Keep only recent entries (last 5000)
      const recentEntries = lines.slice(-5000)
      await fs.writeFile(this.logPath, `${recentEntries.join('\n')}\n`, 'utf-8')
    } catch (error) {
      // Rotation failure is non-critical
      if (this.logger) {
        this.logger.error(`Failed to rotate log: ${error}`)
      }
    }
  }

  /**
   * Read all feedback entries from the log.
   * Used for confidence adjustment calculations.
   *
   * @returns Array of feedback entries
   */
  async readAll(): Promise<FeedbackEntry[]> {
    try {
      const content = await fs.readFile(this.logPath, 'utf-8')
      const lines = content
        .trim()
        .split('\n')
        .filter((line) => line.length > 0)

      return lines.map((line) => {
        const parsed = JSON.parse(line)
        // Remove timestamp for return (not part of FeedbackEntry interface)
        const { timestamp, ...entry } = parsed
        return entry as FeedbackEntry
      })
    } catch (_error) {
      // File might not exist yet
      return []
    }
  }
}
