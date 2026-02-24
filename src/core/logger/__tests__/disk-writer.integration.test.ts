/**
 * Integration tests for DiskWriter with actual file writes to persistent directory.
 */

import { promises as fs } from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { DiskWriter } from '../disk-writer.js'
import type { LogEntry } from '../logger.types.js'

describe('DiskWriter Integration Tests', () => {
  // Use a temp directory for all tests — NEVER touch production ~/.claude/ logs
  const TEST_DEFAULT_DIR = path.join(os.tmpdir(), 'test-mcp-logs-default')

  const createTestEntry = (): LogEntry => ({
    timestamp: new Date().toISOString(),
    level: 'INFO',
    message: 'Integration test log entry',
    context: { test: true },
  })

  const getTodayFilename = (instanceId: string): string => {
    return `${new Date().toISOString().split('T')[0]}-combined-${instanceId}.ndjson`
  }

  const cleanupDirectory = async (dir: string): Promise<void> => {
    await fs.rm(dir, { recursive: true, force: true }).catch(() => {})
  }

  describe('default directory write', () => {
    let writer: DiskWriter

    beforeEach(async () => {
      await cleanupDirectory(TEST_DEFAULT_DIR)
      writer = new DiskWriter(TEST_DEFAULT_DIR)
    })

    afterEach(async () => {
      await writer.closeAll()
      await cleanupDirectory(TEST_DEFAULT_DIR)
    })

    it('should write logs to configured directory', async () => {
      await writer.initialize()
      const entry = createTestEntry()
      await writer.write(entry)
      await writer.flush()

      // Verify file exists in test directory
      const expectedPath = path.join(TEST_DEFAULT_DIR, getTodayFilename(writer.getInstanceId()))
      const fileExists = await fs
        .access(expectedPath)
        .then(() => true)
        .catch(() => false)

      expect(fileExists).toBe(true)

      // Verify content
      const content = await fs.readFile(expectedPath, 'utf-8')
      const lines = content.trim().split('\n')
      expect(lines.length).toBeGreaterThan(0)

      const parsedEntry = JSON.parse(lines[0])
      expect(parsedEntry.level).toBe('INFO')
      expect(parsedEntry.message).toBe('Integration test log entry')
    })

    it('should create subdirectories sessions/ and reports/', async () => {
      await writer.initialize()

      // Verify sessions/ subdirectory
      const sessionsPath = path.join(TEST_DEFAULT_DIR, 'sessions')
      const sessionsStats = await fs.stat(sessionsPath)
      expect(sessionsStats.isDirectory()).toBe(true)

      // Verify reports/ subdirectory
      const reportsPath = path.join(TEST_DEFAULT_DIR, 'reports')
      const reportsStats = await fs.stat(reportsPath)
      expect(reportsStats.isDirectory()).toBe(true)
    })
  })

  describe('environment variable override', () => {
    const CUSTOM_LOG_DIR = '/tmp/test-mcp-logs-integration'
    let writer: DiskWriter
    let originalLogDir: string | undefined

    beforeEach(async () => {
      // Save original env var
      originalLogDir = process.env.LOG_DIR

      // Clean custom directory before test
      await cleanupDirectory(CUSTOM_LOG_DIR)

      // Set custom LOG_DIR
      process.env.LOG_DIR = CUSTOM_LOG_DIR

      writer = new DiskWriter()
    })

    afterEach(async () => {
      await writer.closeAll()
      await cleanupDirectory(CUSTOM_LOG_DIR)

      // Restore original env var
      if (originalLogDir === undefined) {
        delete process.env.LOG_DIR
      } else {
        process.env.LOG_DIR = originalLogDir
      }
    })

    it('should write logs to custom directory from LOG_DIR env var', async () => {
      await writer.initialize()
      const entry = createTestEntry()
      await writer.write(entry)
      await writer.flush()

      // Verify file exists in custom directory
      const expectedPath = path.join(CUSTOM_LOG_DIR, getTodayFilename(writer.getInstanceId()))
      const fileExists = await fs
        .access(expectedPath)
        .then(() => true)
        .catch(() => false)

      expect(fileExists).toBe(true)

      // Verify content
      const content = await fs.readFile(expectedPath, 'utf-8')
      const lines = content.trim().split('\n')
      expect(lines.length).toBeGreaterThan(0)

      const parsedEntry = JSON.parse(lines[0])
      expect(parsedEntry.level).toBe('INFO')
      expect(parsedEntry.message).toBe('Integration test log entry')
    })
  })

  describe('session logs in subdirectory', () => {
    const CUSTOM_LOG_DIR = '/tmp/test-mcp-logs-sessions'
    let writer: DiskWriter

    beforeEach(async () => {
      await cleanupDirectory(CUSTOM_LOG_DIR)
      writer = new DiskWriter(CUSTOM_LOG_DIR)
    })

    afterEach(async () => {
      await writer.closeAll()
      await cleanupDirectory(CUSTOM_LOG_DIR)
    })

    it('should write session logs to sessions/ subdirectory and combined log to root', async () => {
      const sessionId = 'test-session-integration'
      await writer.initialize()
      await writer.openSession(sessionId)

      const entry = createTestEntry()
      await writer.write(entry, sessionId)
      await writer.flush()

      // Verify session log in sessions/ subdirectory
      const today = new Date().toISOString().split('T')[0]
      const sessionLogPath = path.join(CUSTOM_LOG_DIR, 'sessions', `${today}-${sessionId}.ndjson`)
      const sessionFileExists = await fs
        .access(sessionLogPath)
        .then(() => true)
        .catch(() => false)

      expect(sessionFileExists).toBe(true)

      // Verify combined log in root
      const combinedLogPath = path.join(CUSTOM_LOG_DIR, getTodayFilename(writer.getInstanceId()))
      const combinedFileExists = await fs
        .access(combinedLogPath)
        .then(() => true)
        .catch(() => false)

      expect(combinedFileExists).toBe(true)

      // Verify content in session log
      const sessionContent = await fs.readFile(sessionLogPath, 'utf-8')
      const sessionLines = sessionContent.trim().split('\n')
      expect(sessionLines.length).toBeGreaterThan(0)

      const sessionEntry = JSON.parse(sessionLines[0])
      expect(sessionEntry.level).toBe('INFO')
      expect(sessionEntry.message).toBe('Integration test log entry')

      // Verify content in combined log
      const combinedContent = await fs.readFile(combinedLogPath, 'utf-8')
      const combinedLines = combinedContent.trim().split('\n')
      expect(combinedLines.length).toBeGreaterThan(0)

      const combinedEntry = JSON.parse(combinedLines[0])
      expect(combinedEntry.level).toBe('INFO')
      expect(combinedEntry.message).toBe('Integration test log entry')
    })
  })
})
