/**
 * Test suite for FeedbackLogger service.
 * Validates JSONL logging with rotation.
 */

import fs from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { FeedbackLogger } from '../services/feedback-logger.js'

describe('FeedbackLogger', () => {
  let testDir: string
  let logger: FeedbackLogger

  beforeEach(async () => {
    // Create temp directory for test logs
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'feedback-logger-test-'))
    const logPath = path.join(testDir, 'feedback.jsonl')
    logger = new FeedbackLogger(logPath)
  })

  afterEach(async () => {
    // Cleanup test directory
    await fs.rm(testDir, { recursive: true, force: true })
  })

  describe('append', () => {
    it("creates log file if it doesn't exist", async () => {
      await logger.append([
        {
          pr_number: 123,
          issue_title: 'Unused variable',
          severity: 'MEDIUM' as const,
          confidence: 85,
          was_fixed: true,
          outcome: 'success' as const,
        },
      ])

      const logPath = path.join(testDir, 'feedback.jsonl')
      const exists = await fs
        .access(logPath)
        .then(() => true)
        .catch(() => false)
      expect(exists).toBe(true)
    })

    it('appends single entry as JSONL', async () => {
      const entry = {
        pr_number: 123,
        issue_title: 'Unused import',
        severity: 'LOW' as const,
        confidence: 90,
        was_fixed: true,
        outcome: 'success' as const,
      }

      await logger.append([entry])

      const logPath = path.join(testDir, 'feedback.jsonl')
      const content = await fs.readFile(logPath, 'utf-8')
      const lines = content.trim().split('\n')
      expect(lines).toHaveLength(1)

      const parsed = JSON.parse(lines[0])
      expect(parsed.pr_number).toBe(123)
      expect(parsed.issue_title).toBe('Unused import')
      expect(parsed.timestamp).toBeDefined()
    })

    it('appends multiple entries', async () => {
      const entries = [
        {
          pr_number: 123,
          issue_title: 'Issue 1',
          severity: 'HIGH' as const,
          confidence: 75,
          was_fixed: false,
          outcome: 'skipped' as const,
        },
        {
          pr_number: 123,
          issue_title: 'Issue 2',
          severity: 'MEDIUM' as const,
          confidence: 80,
          was_fixed: true,
          outcome: 'success' as const,
        },
      ]

      await logger.append(entries)

      const logPath = path.join(testDir, 'feedback.jsonl')
      const content = await fs.readFile(logPath, 'utf-8')
      const lines = content.trim().split('\n')
      expect(lines).toHaveLength(2)

      const parsed1 = JSON.parse(lines[0])
      const parsed2 = JSON.parse(lines[1])
      expect(parsed1.issue_title).toBe('Issue 1')
      expect(parsed2.issue_title).toBe('Issue 2')
    })

    it('appends to existing file', async () => {
      await logger.append([
        {
          pr_number: 100,
          issue_title: 'First',
          severity: 'LOW' as const,
          confidence: 70,
          was_fixed: true,
          outcome: 'success' as const,
        },
      ])

      await logger.append([
        {
          pr_number: 200,
          issue_title: 'Second',
          severity: 'HIGH' as const,
          confidence: 95,
          was_fixed: true,
          outcome: 'success' as const,
        },
      ])

      const logPath = path.join(testDir, 'feedback.jsonl')
      const content = await fs.readFile(logPath, 'utf-8')
      const lines = content.trim().split('\n')
      expect(lines).toHaveLength(2)
    })

    it('handles empty findings array', async () => {
      await logger.append([])

      const logPath = path.join(testDir, 'feedback.jsonl')
      const exists = await fs
        .access(logPath)
        .then(() => true)
        .catch(() => false)
      // File should not be created for empty array
      expect(exists).toBe(false)
    })

    it('adds timestamp to each entry', async () => {
      const beforeTime = Date.now()
      await logger.append([
        {
          pr_number: 123,
          issue_title: 'Test',
          severity: 'LOW' as const,
          confidence: 80,
          was_fixed: true,
          outcome: 'success' as const,
        },
      ])
      const afterTime = Date.now()

      const logPath = path.join(testDir, 'feedback.jsonl')
      const content = await fs.readFile(logPath, 'utf-8')
      const parsed = JSON.parse(content.trim())

      expect(parsed.timestamp).toBeDefined()
      const entryTime = new Date(parsed.timestamp).getTime()
      expect(entryTime).toBeGreaterThanOrEqual(beforeTime)
      expect(entryTime).toBeLessThanOrEqual(afterTime)
    })
  })

  describe('rotation', () => {
    it('rotates log when exceeding 10k entries', async () => {
      // Create log with 10,000 entries
      const entries = Array.from({ length: 10000 }, (_, i) => ({
        pr_number: 1,
        issue_title: `Issue ${i}`,
        severity: 'LOW' as const,
        confidence: 70,
        was_fixed: true,
        outcome: 'success' as const,
      }))

      // Batch append to avoid memory issues
      for (let i = 0; i < 100; i++) {
        await logger.append(entries.slice(i * 100, (i + 1) * 100))
      }

      // Add one more to trigger rotation
      await logger.append([
        {
          pr_number: 2,
          issue_title: 'Trigger rotation',
          severity: 'HIGH' as const,
          confidence: 85,
          was_fixed: true,
          outcome: 'success' as const,
        },
      ])

      const logPath = path.join(testDir, 'feedback.jsonl')
      const content = await fs.readFile(logPath, 'utf-8')
      const lines = content.trim().split('\n')

      // Should have rotated - only recent entry remains
      expect(lines.length).toBeLessThan(10000)
      expect(lines.length).toBeGreaterThan(0)

      // Check that archived file exists
      const files = await fs.readdir(testDir)
      const archiveFiles = files.filter((f) => f.startsWith('feedback.jsonl.'))
      expect(archiveFiles.length).toBeGreaterThan(0)
    })
  })

  describe('error resilience', () => {
    it('handles write failure gracefully', async () => {
      const invalidLogger = new FeedbackLogger('/invalid/path/feedback.jsonl')

      // Should not throw
      await expect(
        invalidLogger.append([
          {
            pr_number: 123,
            issue_title: 'Test',
            severity: 'LOW' as const,
            confidence: 70,
            was_fixed: true,
            outcome: 'success' as const,
          },
        ]),
      ).resolves.not.toThrow()
    })
  })
})
