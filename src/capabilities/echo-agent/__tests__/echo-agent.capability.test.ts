/**
 * Tests for echo-agent CapabilityDefinition.
 */

import type { AIQueryResult } from '../../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import { echoAgentCapability } from '../echo-agent.capability.js'
import type { EchoAgentInput } from '../echo-agent.schema.js'

// Mock CapabilityContext
const createMockContext = (): CapabilityContext => ({
  session: {
    id: 'test-session',
    state: 'active',
    startedAt: '2026-01-29T00:00:00Z',
    invocations: [],
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalCost: 0,
  },
  invocation: {
    id: 'test-invocation',
    capability: 'echo_agent',
    input: {},
    timestamp: '2026-01-29T00:00:00Z',
  },
  logger: {
    info: () => {},
    debug: () => {},
    error: () => {},
    warn: () => {},
  },
  getSessionCost: () => ({
    totalCostUsd: 0,
    totalInputTokens: 0,
    totalOutputTokens: 0,
    totalTurns: 0,
  }),
  promptVersion: 'v1',
  providerName: 'ClaudeProvider',
  invokeCapability: async () => ({}),
})

describe('echoAgentCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(echoAgentCapability.id).toBe('echo_agent')
    })

    it('has correct type', () => {
      expect(echoAgentCapability.type).toBe('tool')
    })

    it('has correct name', () => {
      expect(echoAgentCapability.name).toBe('Echo Agent')
    })

    it('has non-empty description', () => {
      expect(echoAgentCapability.description).toBeTruthy()
      expect(echoAgentCapability.description.length).toBeGreaterThan(0)
    })

    it('has input schema', () => {
      expect(echoAgentCapability.inputSchema).toBeDefined()
    })

    it('has prompt registry', () => {
      expect(echoAgentCapability.promptRegistry).toBeDefined()
      expect(echoAgentCapability.promptRegistry.v1).toBeDefined()
    })

    it('has current prompt version', () => {
      expect(echoAgentCapability.currentPromptVersion).toBe('v1')
    })
  })

  describe('default request options', () => {
    it('has default request options', () => {
      expect(echoAgentCapability.defaultRequestOptions).toBeDefined()
    })

    it('defaults to haiku model', () => {
      expect(echoAgentCapability.defaultRequestOptions?.model).toBe('haiku')
    })

    it('defaults to 50 turns', () => {
      expect(echoAgentCapability.defaultRequestOptions?.maxTurns).toBe(50)
    })

    it('defaults to $3.00 budget', () => {
      expect(echoAgentCapability.defaultRequestOptions?.maxBudgetUsd).toBe(3.0)
    })

    it('uses claude_code tools preset', () => {
      expect(echoAgentCapability.defaultRequestOptions?.tools).toEqual({
        type: 'preset',
        preset: 'claude_code',
      })
    })

    it('uses bypassPermissions mode', () => {
      expect(echoAgentCapability.defaultRequestOptions?.permissionMode).toBe('bypassPermissions')
    })

    it('allows dangerously skip permissions', () => {
      expect(echoAgentCapability.defaultRequestOptions?.allowDangerouslySkipPermissions).toBe(true)
    })
  })

  describe('preparePromptInput', () => {
    it('extracts prompt field from input', () => {
      const input: EchoAgentInput = {
        prompt: 'Hello, world!',
        model: 'haiku',
      }
      const context = createMockContext()

      const result = echoAgentCapability.preparePromptInput(input, context)

      expect(result).toEqual({ prompt: 'Hello, world!', cwd: undefined })
    })

    it('extracts prompt with sonnet model', () => {
      const input: EchoAgentInput = {
        prompt: 'Test prompt',
        model: 'sonnet',
      }
      const context = createMockContext()

      const result = echoAgentCapability.preparePromptInput(input, context)

      expect(result).toEqual({ prompt: 'Test prompt', cwd: undefined })
    })

    it('passes cwd from input', () => {
      const input: EchoAgentInput = {
        prompt: 'Test with cwd',
        model: 'haiku',
        cwd: '/some/path',
      }
      const context = createMockContext()

      const result = echoAgentCapability.preparePromptInput(input, context)

      expect(result).toEqual({ prompt: 'Test with cwd', cwd: '/some/path' })
    })
  })

  describe('processResult', () => {
    it('extracts response, cost, and turns from AI result', async () => {
      const input: EchoAgentInput = {
        prompt: 'Test',
        model: 'haiku',
      }
      const aiResult: AIQueryResult = {
        content: 'AI response text',
        usage: {
          inputTokens: 10,
          outputTokens: 20,
          totalTokens: 30,
        },
        costUsd: 0.000123,
        turns: 1,
        terminationReason: 'success',
        trace: {
          tid: 'testtrace00000000000000000000000',
          startedAt: '2026-01-29T00:00:00Z',
          request: { prompt: 'Test' },
          turns: [],
        },
      }
      const context = createMockContext()

      const result = await echoAgentCapability.processResult(input, aiResult, context)

      expect(result).toEqual({
        response: 'AI response text',
        cost_usd: 0.000123,
        turns: 1,
      })
    })

    it('handles multi-turn result', async () => {
      const input: EchoAgentInput = {
        prompt: 'Complex task',
        model: 'sonnet',
      }
      const aiResult: AIQueryResult = {
        content: 'Multi-turn response',
        usage: {
          inputTokens: 100,
          outputTokens: 200,
          totalTokens: 300,
        },
        costUsd: 0.005,
        turns: 3,
        terminationReason: 'success',
        trace: {
          tid: 'testtrace00000000000000000000000',
          startedAt: '2026-01-29T00:00:00Z',
          request: { prompt: 'Complex task' },
          turns: [],
        },
      }
      const context = createMockContext()

      const result = await echoAgentCapability.processResult(input, aiResult, context)

      expect(result.turns).toBe(3)
      expect(result.cost_usd).toBe(0.005)
    })
  })
})
