import { vi } from 'vitest'

/**
 * Tests for test-step sub-capability definition.
 */

import type { AIQueryResult } from '../../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import type { TestStepInput } from '../finalize.schema.js'
import { finalizeTestStepCapability } from '../test-step.capability.js'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockContext(): CapabilityContext {
  return {
    session: {
      id: 'test-session',
      state: 'active',
      startedAt: '2026-01-30T00:00:00Z',
      invocations: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    },
    invocation: {
      id: 'test-invocation',
      capability: 'test_capability',
      input: {},
      timestamp: '2026-01-30T00:00:00Z',
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
    invokeCapability: vi.fn<CapabilityContext['invokeCapability']>(),
  }
}

function createMockAiResult(content: string): AIQueryResult {
  return {
    content,
    usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    costUsd: 0.1,
    turns: 5,
    terminationReason: 'success',
    trace: {
      tid: 'testtrace00000000000000000000000',
      startedAt: '2026-01-30T00:00:00Z',
      request: { prompt: 'test' },
      turns: [],
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('finalizeTestStepCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(finalizeTestStepCapability.id).toBe('finalize_test_step')
    })

    it('has correct type', () => {
      expect(finalizeTestStepCapability.type).toBe('tool')
    })

    it('has correct visibility', () => {
      expect(finalizeTestStepCapability.visibility).toBe('internal')
    })

    it("has name containing 'Internal'", () => {
      expect(finalizeTestStepCapability.name).toContain('Internal')
    })

    it("has description containing 'Internal'", () => {
      expect(finalizeTestStepCapability.description).toContain('Internal')
    })

    it('has non-empty description', () => {
      expect(finalizeTestStepCapability.description).toBeTruthy()
      expect(finalizeTestStepCapability.description.length).toBeGreaterThan(0)
    })

    it('defaults to sonnet model', () => {
      expect(finalizeTestStepCapability.defaultRequestOptions?.model).toBe('sonnet')
    })

    it('defaults to 30 maxTurns', () => {
      expect(finalizeTestStepCapability.defaultRequestOptions?.maxTurns).toBe(30)
    })

    it('defaults to $2.0 budget', () => {
      expect(finalizeTestStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(2.0)
    })

    it('has claude_code preset', () => {
      const tools = finalizeTestStepCapability.defaultRequestOptions?.tools
      expect(tools).toBeDefined()
      expect(tools).toHaveProperty('type', 'preset')
      if (tools && 'preset' in tools) {
        expect(tools.preset).toBe('claude_code')
      }
    })

    it('has bypassPermissions enabled', () => {
      expect(finalizeTestStepCapability.defaultRequestOptions?.permissionMode).toBe(
        'bypassPermissions',
      )
    })

    it('has allowDangerouslySkipPermissions enabled', () => {
      expect(
        finalizeTestStepCapability.defaultRequestOptions?.allowDangerouslySkipPermissions,
      ).toBe(true)
    })

    it('has prompt registry with v1 and v2', () => {
      expect(finalizeTestStepCapability.promptRegistry).toBeDefined()
      expect(finalizeTestStepCapability.promptRegistry.v1).toBeDefined()
      expect(finalizeTestStepCapability.promptRegistry.v2).toBeDefined()
    })

    it('has current prompt version v2', () => {
      expect(finalizeTestStepCapability.currentPromptVersion).toBe('v2')
    })
  })

  describe('preparePromptInput', () => {
    it('extracts workspaces and cwd', () => {
      const input: TestStepInput = {
        workspaces: ['apps/my-server', 'packages/core'],
        cwd: '/some/path',
      }
      const context = createMockContext()

      const result = finalizeTestStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        workspaces: ['apps/my-server', 'packages/core'],
        cwd: '/some/path',
      })
    })

    it('handles missing cwd', () => {
      const input: TestStepInput = {
        workspaces: ['apps/my-server'],
      }
      const context = createMockContext()

      const result = finalizeTestStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        workspaces: ['apps/my-server'],
        cwd: undefined,
      })
    })
  })

  describe('processResult', () => {
    it('parses valid test_result XML block', async () => {
      const testResult = {
        passed: true,
        workspaces_tested: ['apps/my-server', 'packages/core'],
        summary: 'All tests passed',
      }
      const content = `Tests complete.\n<test_result>${JSON.stringify(testResult)}</test_result>`
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        workspaces: ['apps/my-server', 'packages/core'],
      }
      const context = createMockContext()

      const result = await finalizeTestStepCapability.processResult(input, aiResult, context)

      expect(result).toEqual(testResult)
    })

    it('returns fallback on parse failure (no XML block)', async () => {
      const content = 'No test result block here.'
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        workspaces: ['apps/my-server'],
      }
      const context = createMockContext()

      const result = await finalizeTestStepCapability.processResult(input, aiResult, context)

      expect(result.passed).toBe(false)
      expect(result.workspaces_tested).toEqual([])
      expect(result.summary).toContain(content)
    })

    it('returns fallback on invalid JSON in XML block', async () => {
      const content = `<test_result>not valid json</test_result>`
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        workspaces: ['apps/my-server'],
      }
      const context = createMockContext()

      const result = await finalizeTestStepCapability.processResult(input, aiResult, context)

      expect(result.passed).toBe(false)
    })

    it('returns fallback on invalid schema in XML block', async () => {
      const invalidResult = {
        passed: 'not_boolean',
        workspaces_tested: 'not_array',
      }
      const content = `<test_result>${JSON.stringify(invalidResult)}</test_result>`
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        workspaces: ['apps/my-server'],
      }
      const context = createMockContext()

      const result = await finalizeTestStepCapability.processResult(input, aiResult, context)

      expect(result.passed).toBe(false)
    })

    it('handles failed tests', async () => {
      const testResult = {
        passed: false,
        workspaces_tested: ['apps/my-server'],
        summary: '3 tests failed',
      }
      const content = `<test_result>${JSON.stringify(testResult)}</test_result>`
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        workspaces: ['apps/my-server'],
      }
      const context = createMockContext()

      const result = await finalizeTestStepCapability.processResult(input, aiResult, context)

      expect(result.passed).toBe(false)
      expect(result.summary).toBe('3 tests failed')
    })

    it('handles empty workspaces_tested', async () => {
      const testResult = {
        passed: true,
        workspaces_tested: [],
        summary: 'No workspaces tested',
      }
      const content = `<test_result>${JSON.stringify(testResult)}</test_result>`
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        workspaces: ['apps/my-server'],
      }
      const context = createMockContext()

      const result = await finalizeTestStepCapability.processResult(input, aiResult, context)

      expect(result.workspaces_tested).toEqual([])
    })
  })
})
