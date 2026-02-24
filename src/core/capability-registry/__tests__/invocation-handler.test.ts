import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { vi } from 'vitest'
/**
 * Tests for invocation-handler - model injection in MCP responses.
 */

import { z } from 'zod'
import type { AIProvider, AIQueryResult } from '../../ai-provider/ai-provider.types.js'
import { CostTracker } from '../../cost/cost.tracker.js'
import { CostReportWriter } from '../../cost/cost-report.writer.js'
import { AIProviderError, CapabilityError, TimeoutError, ValidationError } from '../../errors.js'
import { DiskWriter } from '../../logger/disk-writer.js'
import { Logger } from '../../logger/logger.js'
import { PromptLoader } from '../../prompt/prompt.loader.js'
import { SessionManager } from '../../session/session.manager.js'
import type { CapabilityRegistryDeps } from '../capability-registry.js'
import type { CapabilityDefinition } from '../capability-registry.types.js'
import { handleCapabilityInvocation } from '../invocation-handler.js'
import {
  categorizeError,
  extractModelFromCostSummary,
  generateSpecHash,
  sanitizeInput,
} from '../invocation-helpers.js'

describe('invocation-handler - _model injection', () => {
  let capabilities: Map<string, CapabilityDefinition>
  let deps: CapabilityRegistryDeps
  let mockAIProvider: CapabilityRegistryDeps['aiProvider']

  const __dirname = path.dirname(fileURLToPath(import.meta.url))
  const logsTestsDir = path.join(__dirname, '../../../../logs_tests/invocation-handler')

  beforeEach(async () => {
    const sessionManager = new SessionManager()
    const costTracker = new CostTracker()
    const costReportWriter = new CostReportWriter(path.join(logsTestsDir, 'reports'))
    const diskWriter = new DiskWriter(logsTestsDir)
    const promptLoader = new PromptLoader()
    const logger = new Logger({ diskWriter })

    mockAIProvider = {
      query: vi.fn<AIProvider['query']>().mockResolvedValue({
        content: 'AI response',
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

    // Define test capability
    const testCapability: CapabilityDefinition = {
      id: 'test-model-injection',
      type: 'tool',
      name: 'Test Model Injection',
      description: 'Test capability for model injection',
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

    capabilities = new Map([['test-model-injection', testCapability]])

    // Register prompts using PromptLoader
    promptLoader.registerCapabilityPrompts(
      'test-model-injection',
      testCapability.promptRegistry,
      testCapability.currentPromptVersion,
    )
  })

  afterEach(async () => {
    await deps.diskWriter.closeAll()
  })

  describe('Success Response', () => {
    it('includes _model field in success response', async () => {
      const response = await handleCapabilityInvocation(
        'test-model-injection',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      expect(response.isError).toBeUndefined()
      expect(response.content).toHaveLength(1)
      expect(response.content[0].type).toBe('text')

      const parsed = JSON.parse(response.content[0].text)
      expect(parsed._model).toBe('claude-3-5-sonnet-20241022')
    })

    it('includes all cost metadata fields in success response', async () => {
      const response = await handleCapabilityInvocation(
        'test-model-injection',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      const parsed = JSON.parse(response.content[0].text)
      expect(parsed).toMatchObject({
        output: 'AI response',
        session_id: expect.any(String),
        cost_usd: expect.any(Number),
        turns: expect.any(Number),
        _input_tokens: 100,
        _output_tokens: 50,
        _model: 'claude-3-5-sonnet-20241022',
      })
    })
  })

  describe('Error Response', () => {
    it('includes _model field in error response when session exists', async () => {
      // Mock processResult to throw error AFTER AI query succeeds and cost is recorded
      const errorCapability: CapabilityDefinition = {
        id: 'test-error-with-model',
        type: 'tool',
        name: 'Test Error With Model',
        description: 'Test error response with model',
        inputSchema: z.object({ input: z.string() }),
        promptRegistry: {
          v1: {
            version: 'v1',
            createdAt: new Date().toISOString(),
            description: 'Test',
            deprecated: false,
            build: (input) => ({ userPrompt: JSON.stringify(input) }),
          },
        },
        currentPromptVersion: 'v1',
        preparePromptInput: (input) => input,
        processResult: () => {
          throw new Error('processResult failed')
        },
      }

      capabilities.set('test-error-with-model', errorCapability)
      deps.promptLoader.registerCapabilityPrompts(
        'test-error-with-model',
        errorCapability.promptRegistry,
        errorCapability.currentPromptVersion,
      )

      const response = await handleCapabilityInvocation(
        'test-error-with-model',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      expect(response.isError).toBe(true)
      expect(response.content).toHaveLength(1)
      expect(response.content[0].type).toBe('text')

      const parsed = JSON.parse(response.content[0].text)
      expect(parsed.error).toBe('Error')
      expect(parsed.message).toBe('processResult failed')
      expect(parsed._model).toBe('claude-3-5-sonnet-20241022')
    })

    it('includes all cost metadata in error response when session exists', async () => {
      // Reuse the error capability from previous test
      const errorCapability: CapabilityDefinition = {
        id: 'test-error-metadata',
        type: 'tool',
        name: 'Test Error Metadata',
        description: 'Test error response with all metadata',
        inputSchema: z.object({ input: z.string() }),
        promptRegistry: {
          v1: {
            version: 'v1',
            createdAt: new Date().toISOString(),
            description: 'Test',
            deprecated: false,
            build: (input) => ({ userPrompt: JSON.stringify(input) }),
          },
        },
        currentPromptVersion: 'v1',
        preparePromptInput: (input) => input,
        processResult: () => {
          throw new Error('processResult failed')
        },
      }

      capabilities.set('test-error-metadata', errorCapability)
      deps.promptLoader.registerCapabilityPrompts(
        'test-error-metadata',
        errorCapability.promptRegistry,
        errorCapability.currentPromptVersion,
      )

      const response = await handleCapabilityInvocation(
        'test-error-metadata',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      const parsed = JSON.parse(response.content[0].text)
      expect(parsed).toMatchObject({
        error: 'Error',
        message: 'processResult failed',
        session_id: expect.any(String),
        cost_usd: 0.001,
        turns: 1,
        _input_tokens: 100,
        _output_tokens: 50,
        _model: 'claude-3-5-sonnet-20241022',
      })
    })

    it('omits _model when session does not exist (validation error)', async () => {
      // Invalid input - error before session creation
      const response = await handleCapabilityInvocation(
        'test-model-injection',
        { invalidField: 'test' }, // Invalid input
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      expect(response.isError).toBe(true)
      const parsed = JSON.parse(response.content[0].text)
      expect(parsed.session_id).toBeNull()
      expect(parsed._model).toBeUndefined()
    })
  })

  describe('Model Extraction from CostSummary', () => {
    it('extracts model from costSummary.byModel map in error response', async () => {
      // This test verifies the implementation detail:
      // When there's an error after AI query, the model should be extracted from costSummary.byModel
      mockAIProvider.query = vi.fn<AIProvider['query']>().mockResolvedValueOnce({
        content: 'AI response',
        model: 'opus',
        usage: { inputTokens: 200, outputTokens: 100, totalTokens: 300 },
        costUsd: 0.005,
        turns: 2,
        terminationReason: 'success',
        trace: {
          tid: '00000000000000000000000000000002',
          startedAt: new Date().toISOString(),
          request: { prompt: 'test' },
          turns: [],
        },
      } as AIQueryResult)

      // Mock processResult to throw error AFTER AI query succeeds
      const testCapability: CapabilityDefinition = {
        id: 'test-model-extraction',
        type: 'tool',
        name: 'Test Model Extraction',
        description: 'Test model extraction from cost summary',
        inputSchema: z.object({ input: z.string() }),
        promptRegistry: {
          v1: {
            version: 'v1',
            createdAt: new Date().toISOString(),
            description: 'Test',
            deprecated: false,
            build: (input) => ({ userPrompt: JSON.stringify(input) }),
          },
        },
        currentPromptVersion: 'v1',
        preparePromptInput: (input) => input,
        processResult: () => {
          throw new Error('processResult failed')
        },
      }

      capabilities.set('test-model-extraction', testCapability)
      deps.promptLoader.registerCapabilityPrompts(
        'test-model-extraction',
        testCapability.promptRegistry,
        testCapability.currentPromptVersion,
      )

      const response = await handleCapabilityInvocation(
        'test-model-extraction',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      expect(response.isError).toBe(true)
      const parsed = JSON.parse(response.content[0].text)
      expect(parsed._model).toBe('opus')
    })
  })

  describe('commit_sha extraction and persistence', () => {
    it('extracts commit_sha from output and passes to report writer', async () => {
      // Create a capability that returns commit_sha in output
      const commitCapability: CapabilityDefinition = {
        id: 'test-commit-sha',
        type: 'tool',
        name: 'Test Commit SHA',
        description: 'Test commit_sha extraction',
        inputSchema: z.object({ input: z.string() }),
        promptRegistry: {
          v1: {
            version: 'v1',
            createdAt: new Date().toISOString(),
            description: 'Test',
            deprecated: false,
            build: (input) => ({ userPrompt: JSON.stringify(input) }),
          },
        },
        currentPromptVersion: 'v1',
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({
          output: result.content,
          commit_sha: 'abc123def456789',
        }),
      }

      capabilities.set('test-commit-sha', commitCapability)
      deps.promptLoader.registerCapabilityPrompts(
        'test-commit-sha',
        commitCapability.promptRegistry,
        commitCapability.currentPromptVersion,
      )

      // Spy on writeSessionToReport to verify commitSha is passed
      const writeSessionSpy = vi.spyOn(deps.costReportWriter, 'writeSessionToReport')

      const response = await handleCapabilityInvocation(
        'test-commit-sha',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      expect(response.isError).toBeUndefined()
      const parsed = JSON.parse(response.content[0].text)
      expect(parsed.commit_sha).toBe('abc123def456789')

      // Verify writeSessionToReport was called with commitSha
      expect(writeSessionSpy).toHaveBeenCalled()
      const callArgs = writeSessionSpy.mock.calls[0]
      expect(callArgs[3]).toBe('abc123def456789') // 4th parameter is commitSha
    })
  })

  describe('Helper Functions', () => {
    describe('generateSpecHash', () => {
      it('returns 16-char hex for valid spec_path', () => {
        const input = { spec_path: 'docs/specs/test.md' }
        const hash = generateSpecHash(input)

        expect(hash).toBeDefined()
        expect(hash).toHaveLength(16)
        expect(hash).toMatch(/^[0-9a-f]{16}$/)
      })

      it('returns undefined for missing spec_path', () => {
        const input = { other_field: 'value' }
        const hash = generateSpecHash(input)
        expect(hash).toBeUndefined()
      })

      it('returns undefined for non-string spec_path', () => {
        const input = { spec_path: 123 }
        const hash = generateSpecHash(input)
        expect(hash).toBeUndefined()
      })

      it('produces consistent hash for same spec_path', () => {
        const input = { spec_path: 'docs/specs/feature.md' }
        const hash1 = generateSpecHash(input)
        const hash2 = generateSpecHash(input)
        expect(hash1).toBe(hash2)
      })

      it('produces different hashes for different spec_paths', () => {
        const input1 = { spec_path: 'docs/specs/feature-a.md' }
        const input2 = { spec_path: 'docs/specs/feature-b.md' }
        const hash1 = generateSpecHash(input1)
        const hash2 = generateSpecHash(input2)
        expect(hash1).not.toBe(hash2)
      })
    })

    describe('sanitizeInput', () => {
      it("removes keys containing 'token'", () => {
        const input = { userToken: 'secret123', validField: 'data' }
        const result = sanitizeInput(input)
        expect(result).toBeDefined()
        expect(result?.userToken).toBeUndefined()
        expect(result?.validField).toBe('data')
      })

      it("removes keys containing 'secret'", () => {
        const input = { api_secret: 'xyz', validField: 'data' }
        const result = sanitizeInput(input)
        expect(result).toBeDefined()
        expect(result?.api_secret).toBeUndefined()
        expect(result?.validField).toBe('data')
      })

      it("removes keys containing 'password', 'key', 'auth' (case insensitive)", () => {
        const input1 = { password: 'pass123', data: 'ok' }
        const result1 = sanitizeInput(input1)
        expect(result1?.password).toBeUndefined()
        expect(result1?.data).toBe('ok')

        const input2 = { apiKey: 'key123', data: 'ok' }
        const result2 = sanitizeInput(input2)
        expect(result2?.apiKey).toBeUndefined()
        expect(result2?.data).toBe('ok')

        const input3 = { authHeader: 'Bearer token', data: 'ok' }
        const result3 = sanitizeInput(input3)
        expect(result3?.authHeader).toBeUndefined()
        expect(result3?.data).toBe('ok')

        // Test case insensitive
        const input4 = { SECRET_KEY: 'xyz', API_TOKEN: 'abc', data: 'ok' }
        const result4 = sanitizeInput(input4)
        expect(result4?.SECRET_KEY).toBeUndefined()
        expect(result4?.API_TOKEN).toBeUndefined()
        expect(result4?.data).toBe('ok')
      })

      it('truncates string values over 500 chars', () => {
        const longString = 'A'.repeat(600)
        const input = { longField: longString, shortField: 'short' }
        const result = sanitizeInput(input)
        expect(result).toBeDefined()
        expect(result?.longField).toBe(`${'A'.repeat(500)}...[truncated]`)
        expect(result?.shortField).toBe('short')
      })

      it('preserves short strings and non-string values', () => {
        const input = {
          text: 'short',
          number: 42,
          bool: true,
          obj: { nested: 'value' },
        }
        const result = sanitizeInput(input)
        expect(result).toEqual(input)
      })

      it('returns undefined for non-object input', () => {
        expect(sanitizeInput(null)).toBeUndefined()
        expect(sanitizeInput('string')).toBeUndefined()
        expect(sanitizeInput(123)).toBeUndefined()
        expect(sanitizeInput(undefined)).toBeUndefined()
      })

      it('returns undefined for empty object', () => {
        const result = sanitizeInput({})
        expect(result).toBeUndefined()
      })

      it('returns undefined when only sensitive keys present', () => {
        const input = { token: 'abc', secret: 'xyz', password: '123' }
        const result = sanitizeInput(input)
        expect(result).toBeUndefined()
      })
    })

    describe('categorizeError', () => {
      it("returns 'validation' for ValidationError", () => {
        const error = new ValidationError('Invalid input')
        expect(categorizeError(error)).toBe('validation')
      })

      it("returns 'ai_error' for AIProviderError", () => {
        const error = new AIProviderError('AI query failed')
        expect(categorizeError(error)).toBe('ai_error')
      })

      it("returns 'timeout' for TimeoutError", () => {
        const error = new TimeoutError('Request timed out')
        expect(categorizeError(error)).toBe('timeout')
      })

      it("returns 'halted' for CapabilityError with 'halted' message", () => {
        const error = new CapabilityError('Session halted by user')
        expect(categorizeError(error)).toBe('halted')
      })

      it("returns 'halted' for CapabilityError with 'tests failed' message", () => {
        const error = new CapabilityError('Build tests failed')
        expect(categorizeError(error)).toBe('halted')
      })

      it("returns 'capability' for CapabilityError without 'halted' or 'tests failed'", () => {
        const error = new CapabilityError('Unknown capability error')
        expect(categorizeError(error)).toBe('capability')
      })

      it("returns 'unknown' for generic Error", () => {
        const error = new Error('Generic error')
        expect(categorizeError(error)).toBe('unknown')
      })

      it("returns 'unknown' for non-Error value", () => {
        expect(categorizeError('string error')).toBe('unknown')
        expect(categorizeError(null)).toBe('unknown')
        expect(categorizeError({ message: 'object' })).toBe('unknown')
      })
    })

    describe('extractModelFromCostSummary', () => {
      it('returns first model from byModel with single model', () => {
        const costSummary = {
          byModel: {
            'claude-3-5-sonnet-20241022': {
              inputTokens: 100,
              outputTokens: 50,
              costUsd: 0.01,
              count: 1,
            },
          },
          totalInputTokens: 100,
          totalOutputTokens: 50,
          totalCostUsd: 0.01,
          operationCount: 1,
          totalTurns: 1,
        }
        expect(extractModelFromCostSummary(costSummary)).toBe('claude-3-5-sonnet-20241022')
      })

      it('returns first model from byModel with multiple models', () => {
        const costSummary = {
          byModel: {
            'claude-3-5-sonnet-20241022': {
              inputTokens: 100,
              outputTokens: 50,
              costUsd: 0.01,
              count: 1,
            },
            'claude-3-5-haiku-20241022': {
              inputTokens: 50,
              outputTokens: 25,
              costUsd: 0.005,
              count: 1,
            },
          },
          totalInputTokens: 150,
          totalOutputTokens: 75,
          totalCostUsd: 0.015,
          operationCount: 2,
          totalTurns: 2,
        }
        const result = extractModelFromCostSummary(costSummary)
        // Should return first key in the object (JavaScript object key order)
        expect(result).toBeDefined()
        expect(['claude-3-5-sonnet-20241022', 'claude-3-5-haiku-20241022']).toContain(result)
      })

      it("returns 'unknown' for empty byModel", () => {
        const costSummary = {
          byModel: {},
          totalInputTokens: 0,
          totalOutputTokens: 0,
          totalCostUsd: 0,
          operationCount: 0,
          totalTurns: 0,
        }
        expect(extractModelFromCostSummary(costSummary)).toBe('unknown')
      })
    })
  })

  describe('Metadata Capture', () => {
    it('finalizeInvocation passes metadata to writeSessionToReport', async () => {
      const writeSessionSpy = vi.spyOn(deps.costReportWriter, 'writeSessionToReport')

      const response = await handleCapabilityInvocation(
        'test-model-injection',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      expect(response.isError).toBeUndefined()
      expect(writeSessionSpy).toHaveBeenCalled()

      // Verify metadata parameter (5th parameter)
      const callArgs = writeSessionSpy.mock.calls[0]
      const metadata = callArgs?.[4]
      expect(metadata).toBeDefined()
      if (!metadata) throw new Error('Metadata should be defined')
      expect(metadata.capability).toBe('test-model-injection')
      expect(metadata.model).toBe('claude-3-5-sonnet-20241022')
      expect(metadata.status).toBe('success')
    })

    it('buildErrorResponse writes error session to cost report', async () => {
      const writeSessionSpy = vi.spyOn(deps.costReportWriter, 'writeSessionToReport')

      // Create capability that throws error
      const errorCapability: CapabilityDefinition = {
        id: 'test-error-metadata',
        type: 'tool',
        name: 'Test Error Metadata',
        description: 'Test',
        inputSchema: z.object({ input: z.string() }),
        promptRegistry: {
          v1: {
            version: 'v1',
            createdAt: new Date().toISOString(),
            description: 'Test',
            deprecated: false,
            build: (input) => ({ userPrompt: JSON.stringify(input) }),
          },
        },
        currentPromptVersion: 'v1',
        preparePromptInput: (input) => input,
        processResult: () => {
          throw new Error('processResult failed')
        },
      }

      capabilities.set('test-error-metadata', errorCapability)
      deps.promptLoader.registerCapabilityPrompts(
        'test-error-metadata',
        errorCapability.promptRegistry,
        errorCapability.currentPromptVersion,
      )

      const response = await handleCapabilityInvocation(
        'test-error-metadata',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      expect(response.isError).toBe(true)
      expect(writeSessionSpy).toHaveBeenCalled()

      // Verify error metadata
      const callArgs = writeSessionSpy.mock.calls[0]
      const metadata = callArgs?.[4]
      if (!metadata) throw new Error('Metadata should be defined')
      expect(metadata.status).toBe('error')
      expect(metadata.errorType).toBeDefined()
      expect(metadata.errorMessage).toBeDefined()
    })

    it('error session writing is non-fatal - does not throw if writer fails', async () => {
      // Mock writeSessionToReport to throw
      vi.spyOn(deps.costReportWriter, 'writeSessionToReport').mockRejectedValueOnce(
        new Error('Write failed'),
      )

      const errorCapability: CapabilityDefinition = {
        id: 'test-non-fatal-write',
        type: 'tool',
        name: 'Test Non-Fatal Write',
        description: 'Test',
        inputSchema: z.object({ input: z.string() }),
        promptRegistry: {
          v1: {
            version: 'v1',
            createdAt: new Date().toISOString(),
            description: 'Test',
            deprecated: false,
            build: (input) => ({ userPrompt: JSON.stringify(input) }),
          },
        },
        currentPromptVersion: 'v1',
        preparePromptInput: (input) => input,
        processResult: () => {
          throw new Error('processResult failed')
        },
      }

      capabilities.set('test-non-fatal-write', errorCapability)
      deps.promptLoader.registerCapabilityPrompts(
        'test-non-fatal-write',
        errorCapability.promptRegistry,
        errorCapability.currentPromptVersion,
      )

      // Should not throw despite writer failure
      const response = await handleCapabilityInvocation(
        'test-non-fatal-write',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      expect(response.isError).toBe(true)
      // Original error should be returned, not the write error
      const parsed = JSON.parse(response.content[0].text)
      expect(parsed.message).toBe('processResult failed')
    })

    it('buildErrorResponse does not write cost report when totalCostUsd is 0', async () => {
      const writeSessionSpy = vi.spyOn(deps.costReportWriter, 'writeSessionToReport')

      // Mock cost tracker to return zero costs
      vi.spyOn(deps.costTracker, 'getSessionSummary').mockReturnValue({
        byModel: {},
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostUsd: 0,
        operationCount: 0,
        totalTurns: 0,
      })

      // Create capability that throws error immediately (no AI query)
      const errorCapability: CapabilityDefinition = {
        id: 'test-zero-cost',
        type: 'tool',
        name: 'Test Zero Cost',
        description: 'Test',
        inputSchema: z.object({ input: z.string() }),
        promptRegistry: {
          v1: {
            version: 'v1',
            createdAt: new Date().toISOString(),
            description: 'Test',
            deprecated: false,
            build: (input) => ({ userPrompt: JSON.stringify(input) }),
          },
        },
        currentPromptVersion: 'v1',
        preparePromptInput: (_input) => {
          throw new Error('Validation error before AI query')
        },
        processResult: () => ({}),
      }

      capabilities.set('test-zero-cost', errorCapability)
      deps.promptLoader.registerCapabilityPrompts(
        'test-zero-cost',
        errorCapability.promptRegistry,
        errorCapability.currentPromptVersion,
      )

      const response = await handleCapabilityInvocation(
        'test-zero-cost',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      expect(response.isError).toBe(true)
      // Should NOT call writeSessionToReport when costs are zero
      expect(writeSessionSpy).not.toHaveBeenCalled()
    })
  })

  describe('Cache Metrics Extraction (AC-2, AC-10)', () => {
    it('buildCostEntry includes cache tokens when present (AC-2)', async () => {
      // Mock AI provider to return cache metrics
      mockAIProvider.query = vi.fn<AIProvider['query']>().mockResolvedValue({
        content: 'AI response with cache',
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

      const response = await handleCapabilityInvocation(
        'test-model-injection',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      // Verify invocation succeeds with cache metrics present
      expect(response.isError).toBeUndefined()
      expect(response.content[0].type).toBe('text')
      const parsed = JSON.parse(response.content[0].text)
      expect(parsed.session_id).toBeDefined()

      // Verify cache metrics are included in MCP response for child propagation
      expect(parsed._cache_creation_input_tokens).toBe(2000)
      expect(parsed._cache_read_input_tokens).toBe(7000)
    })

    it('includes _prompt_version in success response', async () => {
      const response = await handleCapabilityInvocation(
        'test-model-injection',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      const parsed = JSON.parse(response.content[0].text)
      expect(parsed._prompt_version).toBe('v1')
    })

    it('buildCostEntry omits cache tokens when undefined (AC-2, AC-10)', async () => {
      // Mock AI provider WITHOUT cache metrics
      mockAIProvider.query = vi.fn<AIProvider['query']>().mockResolvedValue({
        content: 'AI response without cache',
        model: 'claude-3-5-sonnet-20241022',
        usage: {
          inputTokens: 100,
          outputTokens: 50,
          totalTokens: 150,
          // No cache fields
        },
        costUsd: 0.001,
        turns: 1,
        terminationReason: 'success',
        trace: {
          tid: '00000000000000000000000000000002',
          startedAt: new Date().toISOString(),
          request: { prompt: 'test' },
          turns: [],
        },
      } as AIQueryResult)

      const response = await handleCapabilityInvocation(
        'test-model-injection',
        { input: 'test' },
        capabilities,
        deps,
        false,
        async () => ({ content: [{ type: 'text', text: '{}' }] }),
      )

      // Verify invocation succeeds without cache metrics
      expect(response.isError).toBeUndefined()
      expect(response.content[0].type).toBe('text')
      const sessionId = JSON.parse(response.content[0].text).session_id
      expect(sessionId).toBeDefined()

      // Verify cache metrics are omitted when not present
      const parsed = JSON.parse(response.content[0].text)
      expect(parsed._cache_creation_input_tokens).toBeUndefined()
      expect(parsed._cache_read_input_tokens).toBeUndefined()
    })
  })
})
