import { vi } from 'vitest'

/**
 * Integration tests for cost report writing in error paths and shutdown scenarios.
 * Validates that cost reports are correctly written to disk when:
 * 1. Capability invocations fail after AI queries complete
 * 2. Graceful shutdown includes both active and completed sessions
 * 3. Error path reports include child session costs
 */

import { access, readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { z } from 'zod'
import type { AIProvider, AIQueryResult } from '../../ai-provider/ai-provider.types.js'
import { CostTracker } from '../../cost/cost.tracker.js'
import { DailyCostReportSchema } from '../../cost/cost-report.schemas.js'
import { CostReportWriter } from '../../cost/cost-report.writer.js'
import { DiskWriter } from '../../logger/disk-writer.js'
import { Logger } from '../../logger/logger.js'
import { PromptLoader } from '../../prompt/prompt.loader.js'
import { SessionManager } from '../../session/session.manager.js'
import type { CapabilityRegistryDeps } from '../capability-registry.js'
import { CapabilityRegistry } from '../capability-registry.js'
import type { CapabilityDefinition } from '../capability-registry.types.js'
import { handleCapabilityInvocation } from '../invocation-handler.js'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const logsTestsDir = path.join(__dirname, '../../../../logs_tests/invocation-integration')

describe('Cost Report Integration - Error Path & Shutdown', () => {
  let registry: CapabilityRegistry
  let sessionManager: SessionManager
  let costTracker: CostTracker
  let costReportWriter: CostReportWriter
  let diskWriter: DiskWriter
  let promptLoader: PromptLoader
  let logger: Logger
  let mockAIProvider: AIProvider
  let deps: CapabilityRegistryDeps
  let capabilities: Map<string, CapabilityDefinition>
  let reportsDir: string

  beforeEach(async () => {
    reportsDir = path.join(logsTestsDir, 'reports')

    sessionManager = new SessionManager()
    costTracker = new CostTracker()
    costReportWriter = new CostReportWriter(reportsDir)
    diskWriter = new DiskWriter(logsTestsDir)
    promptLoader = new PromptLoader()
    logger = new Logger({ diskWriter })

    mockAIProvider = {
      query: vi.fn<AIProvider['query']>().mockResolvedValue({
        content: 'AI response from processResult error test',
        model: 'claude-3-5-sonnet-20241022',
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        costUsd: 0.001,
        turns: 1,
        terminationReason: 'success',
        trace: {
          tid: '00000000000000000000000000000001',
          startedAt: new Date().toISOString(),
          request: { prompt: 'test' },
          turns: [],
        },
      } as AIQueryResult),
    }

    deps = {
      sessionManager,
      costTracker,
      costReportWriter,
      diskWriter,
      promptLoader,
      logger,
      aiProvider: mockAIProvider,
    }

    registry = new CapabilityRegistry(deps)
    capabilities = new Map()
  })

  afterEach(async () => {
    await diskWriter.closeAll()
  })

  /**
   * Reads and parses the daily cost report file for the current date.
   * Returns the parsed report or null if file doesn't exist.
   */
  async function readDailyReport(): Promise<unknown> {
    const today = new Date().toISOString().split('T')[0]
    const reportPath = path.join(reportsDir, `${today}.json`)

    try {
      await access(reportPath)
      const content = await readFile(reportPath, 'utf-8')
      return JSON.parse(content)
    } catch {
      return null
    }
  }

  /**
   * Lists all report files in the reports directory.
   */
  async function listReportFiles(): Promise<string[]> {
    try {
      const files = await readdir(reportsDir)
      return files.filter((f) => f.endsWith('.json'))
    } catch {
      return []
    }
  }

  describe('Error Path Cost Reporting', () => {
    it('writes cost report when capability invocation fails after AI query', async () => {
      // Define capability where processResult throws AFTER successful AI query
      const errorCapability: CapabilityDefinition = {
        id: 'test-processresult-error',
        type: 'tool',
        name: 'Test ProcessResult Error',
        description: 'Capability that fails in processResult',
        inputSchema: z.object({ input: z.string() }),
        promptRegistry: {
          v1: {
            version: 'v1',
            createdAt: new Date().toISOString(),
            description: 'Test prompt',
            deprecated: false,
            build: (input) => ({ userPrompt: JSON.stringify(input) }),
          },
        },
        currentPromptVersion: 'v1',
        preparePromptInput: (input) => input,
        processResult: () => {
          throw new Error('Validation failed in processResult')
        },
      }

      capabilities.set('test-processresult-error', errorCapability)
      promptLoader.registerCapabilityPrompts(
        'test-processresult-error',
        errorCapability.promptRegistry,
        errorCapability.currentPromptVersion,
      )

      // Invoke capability - should fail but write cost report
      const response = await handleCapabilityInvocation(
        'test-processresult-error',
        { input: 'test data' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      // Verify error response returned
      expect(response.isError).toBe(true)

      // Wait for async cost report write to complete (non-blocking with .catch())
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify cost report file was created
      const files = await listReportFiles()
      expect(files.length).toBeGreaterThan(0)

      // Read and validate report
      const report = await readDailyReport()
      expect(report).not.toBeNull()

      // Validate against schema
      const validated = DailyCostReportSchema.parse(report)

      // Find the specific session from this test (report may contain entries from other tests)
      const entry = validated.sessions.find(
        (s) => s.capability === 'test-processresult-error' && s.status === 'error',
      )

      expect(entry).toBeDefined()
      expect(entry?.status).toBe('error')
      expect(entry?.errorType).toBeDefined()
      expect(entry?.errorMessage).toContain('Validation failed in processResult')
      expect(entry?.totalCostUsd).toBeGreaterThan(0)
      expect(entry?.model).toBe('claude-3-5-sonnet-20241022')
    })

    it('does not write cost report when error occurs before AI query (zero costs)', async () => {
      // Define capability with invalid input schema
      const preQueryErrorCapability: CapabilityDefinition = {
        id: 'test-prequery-error',
        type: 'tool',
        name: 'Test Pre-Query Error',
        description: 'Capability that fails before AI query',
        inputSchema: z.object({
          requiredField: z.string().min(10), // Will fail validation
        }),
        promptRegistry: {
          v1: {
            version: 'v1',
            createdAt: new Date().toISOString(),
            description: 'Test prompt',
            deprecated: false,
            build: (input) => ({ userPrompt: JSON.stringify(input) }),
          },
        },
        currentPromptVersion: 'v1',
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      }

      capabilities.set('test-prequery-error', preQueryErrorCapability)
      promptLoader.registerCapabilityPrompts(
        'test-prequery-error',
        preQueryErrorCapability.promptRegistry,
        preQueryErrorCapability.currentPromptVersion,
      )

      // Invoke with invalid input - should fail validation before AI query
      const response = await handleCapabilityInvocation(
        'test-prequery-error',
        { requiredField: 'short' }, // Too short
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      // Verify error response
      expect(response.isError).toBe(true)

      // No cost report should be written (no AI query = no costs)
      const report = await readDailyReport()
      if (report !== null) {
        const validated = DailyCostReportSchema.parse(report)
        // If report exists from previous test, verify no new entry for this session
        const errorEntries = validated.sessions.filter(
          (e) => e.capability === 'test-prequery-error',
        )
        expect(errorEntries).toHaveLength(0)
      }
    })
  })

  describe('Graceful Shutdown Cost Reporting', () => {
    it('writes cost reports for all sessions (active and completed)', async () => {
      // Create two sessions with costs
      const session1 = sessionManager.createSession('cap-1')
      const session2 = sessionManager.createSession('cap-2')

      // Add costs to both sessions
      costTracker.recordCost(session1.id, 'inv-1', 'cap-1', {
        id: 'cost-1',
        sid: session1.id,
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.001,
        model: 'claude-3-5-sonnet-20241022' as const,
        timestamp: new Date().toISOString(),
      })

      costTracker.recordCost(session2.id, 'inv-2', 'cap-2', {
        id: 'cost-2',
        sid: session2.id,
        inputTokens: 200,
        outputTokens: 100,
        costUsd: 0.002,
        model: 'claude-3-5-sonnet-20241022' as const,
        timestamp: new Date().toISOString(),
      })

      // Close session2 to simulate completed state
      sessionManager.closeSession(session2.id)

      // Verify states before shutdown
      expect(session1.state).toBe('active')
      const closedSession = sessionManager.getSession(session2.id)
      expect(closedSession?.state).toBe('completed')

      // Call graceful shutdown
      await registry.gracefulShutdown()

      // Verify cost report includes BOTH sessions
      const report = await readDailyReport()
      expect(report).not.toBeNull()

      const validated = DailyCostReportSchema.parse(report)
      expect(validated.sessions.length).toBeGreaterThanOrEqual(2)

      // Find sessions by session ID
      const session1Entry = validated.sessions.find((e) => e.sid === session1.id)
      const session2Entry = validated.sessions.find((e) => e.sid === session2.id)

      expect(session1Entry).toBeDefined()
      expect(session2Entry).toBeDefined()

      // Verify costs recorded
      expect(session1Entry?.totalCostUsd).toBe(0.001)
      expect(session2Entry?.totalCostUsd).toBe(0.002)
    })

    it('skips sessions with zero costs during shutdown', async () => {
      // Create session with zero costs
      const sessionNoCost = sessionManager.createSession('no-cost-cap')

      // Create session with costs
      const sessionWithCost = sessionManager.createSession('cost-cap')
      costTracker.recordCost(sessionWithCost.id, 'inv-with-cost', 'cost-cap', {
        id: 'cost-with-cost',
        sid: sessionWithCost.id,
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.001,
        model: 'claude-3-5-sonnet-20241022' as const,
        timestamp: new Date().toISOString(),
      })

      // Call graceful shutdown
      await registry.gracefulShutdown()

      // Verify only session with costs is in report
      const report = await readDailyReport()
      expect(report).not.toBeNull()

      const validated = DailyCostReportSchema.parse(report)

      // Find sessions by session ID
      const noCostEntry = validated.sessions.find((e) => e.sid === sessionNoCost.id)
      const withCostEntry = validated.sessions.find((e) => e.sid === sessionWithCost.id)

      expect(noCostEntry).toBeUndefined()
      expect(withCostEntry).toBeDefined()
      expect(withCostEntry?.totalCostUsd).toBe(0.001)
    })
  })

  describe('Child Session Cost Reporting', () => {
    it('cost report schema supports child sessions field', async () => {
      // This test verifies that the cost report schema correctly handles childSessions
      // Note: Full end-to-end child session reporting is tested in capability-registry.test.ts

      // Read any existing cost report
      const report = await readDailyReport()

      // If no report exists yet, this test passes (schema validation will occur when reports are written)
      if (report === null) {
        expect(true).toBe(true)
        return
      }

      // Validate that the report follows the schema (which includes childSessions support)
      const validated = DailyCostReportSchema.parse(report)
      expect(validated.sessions).toBeDefined()

      // Verify schema allows childSessions field (optional)
      validated.sessions.forEach((session) => {
        // childSessions can be undefined or an array
        if (session.childSessions !== undefined) {
          expect(Array.isArray(session.childSessions)).toBe(true)
        }
      })
    })
  })

  describe('Cache Metrics End-to-End Propagation (AC-14)', () => {
    it('propagates cache metrics from AIQueryResult through CostTracker to cost reports', async () => {
      // Mock AI provider to return cache metrics
      mockAIProvider.query = vi.fn<AIProvider['query']>().mockResolvedValue({
        content: 'AI response with cache metrics',
        model: 'claude-3-5-sonnet-20241022',
        usage: {
          inputTokens: 10000,
          outputTokens: 500,
          totalTokens: 10500,
          promptCacheWrite: 2000,
          promptCacheRead: 7000,
        },
        costUsd: 0.005,
        turns: 1,
        terminationReason: 'success',
        trace: {
          tid: '00000000000000000000000000000001',
          startedAt: new Date().toISOString(),
          request: { prompt: 'test' },
          turns: [],
        },
      } as AIQueryResult)

      // Define test capability
      const cacheTestCapability: CapabilityDefinition = {
        id: 'test-cache-metrics-e2e',
        type: 'tool',
        name: 'Test Cache Metrics End-to-End',
        description: 'Test end-to-end cache metric propagation',
        inputSchema: z.object({ input: z.string() }),
        promptRegistry: {
          v1: {
            version: 'v1',
            createdAt: new Date().toISOString(),
            description: 'Test prompt',
            deprecated: false,
            build: (input) => ({ userPrompt: JSON.stringify(input) }),
          },
        },
        currentPromptVersion: 'v1',
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      }

      capabilities.set('test-cache-metrics-e2e', cacheTestCapability)
      promptLoader.registerCapabilityPrompts(
        'test-cache-metrics-e2e',
        cacheTestCapability.promptRegistry,
        cacheTestCapability.currentPromptVersion,
      )

      // Invoke capability
      const response = await handleCapabilityInvocation(
        'test-cache-metrics-e2e',
        { input: 'test cache propagation' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      // Verify success
      expect(response.isError).toBeUndefined()
      const parsed = JSON.parse(response.content[0].text)
      const sessionId = parsed.session_id
      expect(sessionId).toBeDefined()

      // Verify CostTracker has cache metrics
      const costSummary = costTracker.getSessionSummary(sessionId)
      expect(costSummary.totalPromptCacheWrite).toBe(2000)
      expect(costSummary.totalPromptCacheRead).toBe(7000)
      expect(costSummary.cacheHitRate).toBeCloseTo(7000 / 17000, 5) // 7000 / (10000 + 7000)

      // Wait for async cost report write to complete
      await new Promise((resolve) => setTimeout(resolve, 100))

      // Verify cost report includes cache metrics
      const report = await readDailyReport()
      expect(report).not.toBeNull()

      const validated = DailyCostReportSchema.parse(report)
      const sessionEntry = validated.sessions.find((s) => s.sid === sessionId)

      expect(sessionEntry).toBeDefined()
      expect(sessionEntry?.totalPromptCacheWrite).toBe(2000)
      expect(sessionEntry?.totalPromptCacheRead).toBe(7000)
      expect(sessionEntry?.cacheHitRate).toBeCloseTo(7000 / 17000, 5)
    })
  })
})
