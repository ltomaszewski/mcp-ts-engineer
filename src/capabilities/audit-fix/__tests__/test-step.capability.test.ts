import { vi } from 'vitest'

/**
 * Tests for test-step sub-capability definition (audit-fix).
 * Validates capability metadata, prompt preparation, and result processing.
 */

import type { AIQueryResult } from '../../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import type { TestStepInput } from '../audit-fix.schema.js'
import { auditFixTestStepCapability } from '../test-step.capability.js'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockContext(): CapabilityContext {
  return {
    session: {
      id: 'test-session',
      state: 'active',
      startedAt: '2026-02-03T00:00:00Z',
      invocations: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    },
    invocation: {
      id: 'test-invocation',
      capability: 'test_capability',
      input: {},
      timestamp: '2026-02-03T00:00:00Z',
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
      startedAt: '2026-02-03T00:00:00Z',
      request: { prompt: 'test' },
      turns: [],
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('auditFixTestStepCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(auditFixTestStepCapability.id).toBe('audit_fix_test_step')
    })

    it('has correct type', () => {
      expect(auditFixTestStepCapability.type).toBe('tool')
    })

    it('has correct visibility', () => {
      expect(auditFixTestStepCapability.visibility).toBe('internal')
    })

    it("has name containing 'Internal'", () => {
      expect(auditFixTestStepCapability.name).toContain('Internal')
    })

    it("has description containing 'Internal'", () => {
      expect(auditFixTestStepCapability.description).toContain('Internal')
    })

    it('has non-empty description', () => {
      expect(auditFixTestStepCapability.description).toBeTruthy()
      expect(auditFixTestStepCapability.description.length).toBeGreaterThan(0)
    })

    it('defaults to sonnet model', () => {
      expect(auditFixTestStepCapability.defaultRequestOptions?.model).toBe('sonnet-1m')
    })

    it('defaults to 30 maxTurns', () => {
      expect(auditFixTestStepCapability.defaultRequestOptions?.maxTurns).toBe(30)
    })

    it('defaults to $2.0 budget', () => {
      expect(auditFixTestStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(2.0)
    })

    it('has claude_code preset', () => {
      const tools = auditFixTestStepCapability.defaultRequestOptions?.tools
      expect(tools).toBeDefined()
      expect(tools).toHaveProperty('type', 'preset')
      if (tools && 'preset' in tools) {
        expect(tools.preset).toBe('claude_code')
      }
    })

    it('has bypassPermissions enabled', () => {
      expect(auditFixTestStepCapability.defaultRequestOptions?.permissionMode).toBe(
        'bypassPermissions',
      )
    })

    it('has allowDangerouslySkipPermissions enabled', () => {
      expect(
        auditFixTestStepCapability.defaultRequestOptions?.allowDangerouslySkipPermissions,
      ).toBe(true)
    })

    it('has prompt registry with v1 and v2', () => {
      expect(auditFixTestStepCapability.promptRegistry).toBeDefined()
      expect(auditFixTestStepCapability.promptRegistry.v1).toBeDefined()
      expect(auditFixTestStepCapability.promptRegistry.v2).toBeDefined()
    })

    it('has current prompt version v2', () => {
      expect(auditFixTestStepCapability.currentPromptVersion).toBe('v2')
    })
  })

  describe('preparePromptInput', () => {
    it('extracts project_path, workspaces, and cwd', () => {
      const input: TestStepInput = {
        project_path: 'apps/my-server',
        workspaces: ['apps/my-server', 'packages/core'],
        cwd: '/some/path',
      }
      const context = createMockContext()

      const result = auditFixTestStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        project_path: 'apps/my-server',
        workspaces: ['apps/my-server', 'packages/core'],
        cwd: '/some/path',
      })
    })

    it('handles missing cwd', () => {
      const input: TestStepInput = {
        project_path: 'apps/my-server',
        workspaces: ['apps/my-server'],
      }
      const context = createMockContext()

      const result = auditFixTestStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        project_path: 'apps/my-server',
        workspaces: ['apps/my-server'],
        cwd: undefined,
      })
    })

    it('handles single workspace', () => {
      const input: TestStepInput = {
        project_path: 'packages/types',
        workspaces: ['packages/types'],
      }
      const context = createMockContext()

      const result = auditFixTestStepCapability.preparePromptInput(input, context) as {
        project_path: string
        workspaces: string[]
        cwd?: string
      }

      expect(result.workspaces).toEqual(['packages/types'])
    })
  })

  describe('processResult', () => {
    it('parses valid test_result XML block with passing tests', async () => {
      const testResult = {
        passed: true,
        tests_total: 150,
        tests_failed: 0,
        failure_summary: '',
        workspaces_tested: ['apps/my-server', 'packages/core'],
      }
      const content = `Tests complete.\n<test_result>${JSON.stringify(testResult)}</test_result>`
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        project_path: 'apps/my-server',
        workspaces: ['apps/my-server', 'packages/core'],
      }
      const context = createMockContext()

      const result = await auditFixTestStepCapability.processResult(input, aiResult, context)

      expect(result).toEqual(testResult)
      expect(result.passed).toBe(true)
      expect(result.tests_total).toBe(150)
      expect(result.tests_failed).toBe(0)
    })

    it('parses valid test_result XML block with failed tests', async () => {
      const testResult = {
        passed: false,
        tests_total: 150,
        tests_failed: 5,
        failure_summary: '5 tests failed in auth module:\n- test1\n- test2',
        workspaces_tested: ['apps/my-server'],
      }
      const content = `<test_result>${JSON.stringify(testResult)}</test_result>`
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        project_path: 'apps/my-server',
        workspaces: ['apps/my-server'],
      }
      const context = createMockContext()

      const result = await auditFixTestStepCapability.processResult(input, aiResult, context)

      expect(result.passed).toBe(false)
      expect(result.tests_total).toBe(150)
      expect(result.tests_failed).toBe(5)
      expect(result.failure_summary).toContain('5 tests failed')
    })

    it('returns fallback on parse failure (no XML block)', async () => {
      const content = 'No test result block here. Tests ran but output was malformed.'
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        project_path: 'apps/my-server',
        workspaces: ['apps/my-server'],
      }
      const context = createMockContext()

      const result = await auditFixTestStepCapability.processResult(input, aiResult, context)

      expect(result.passed).toBe(false)
      expect(result.tests_total).toBe(0)
      expect(result.tests_failed).toBe(0)
      expect(result.workspaces_tested).toEqual([])
      expect(result.failure_summary).toContain(content)
    })

    it('returns fallback on invalid JSON in XML block', async () => {
      const content = `<test_result>not valid json</test_result>`
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        project_path: 'apps/my-server',
        workspaces: ['apps/my-server'],
      }
      const context = createMockContext()

      const result = await auditFixTestStepCapability.processResult(input, aiResult, context)

      expect(result.passed).toBe(false)
      expect(result.tests_total).toBe(0)
      expect(result.tests_failed).toBe(0)
    })

    it('returns fallback on invalid schema in XML block', async () => {
      const invalidResult = {
        passed: 'not_boolean',
        tests_total: 'not_number',
        tests_failed: -1,
        workspaces_tested: 'not_array',
      }
      const content = `<test_result>${JSON.stringify(invalidResult)}</test_result>`
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        project_path: 'apps/my-server',
        workspaces: ['apps/my-server'],
      }
      const context = createMockContext()

      const result = await auditFixTestStepCapability.processResult(input, aiResult, context)

      expect(result.passed).toBe(false)
      expect(result.tests_total).toBe(0)
      expect(result.tests_failed).toBe(0)
    })

    it('handles empty workspaces_tested', async () => {
      const testResult = {
        passed: true,
        tests_total: 0,
        tests_failed: 0,
        failure_summary: 'No tests found',
        workspaces_tested: [],
      }
      const content = `<test_result>${JSON.stringify(testResult)}</test_result>`
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        project_path: 'apps/my-server',
        workspaces: ['apps/my-server'],
      }
      const context = createMockContext()

      const result = await auditFixTestStepCapability.processResult(input, aiResult, context)

      expect(result.workspaces_tested).toEqual([])
      expect(result.tests_total).toBe(0)
    })

    it('handles multiple workspaces tested', async () => {
      const testResult = {
        passed: true,
        tests_total: 200,
        tests_failed: 0,
        failure_summary: '',
        workspaces_tested: ['apps/my-server', 'packages/types', 'packages/utils'],
      }
      const content = `<test_result>${JSON.stringify(testResult)}</test_result>`
      const aiResult = createMockAiResult(content)
      const input: TestStepInput = {
        project_path: '.',
        workspaces: ['apps/my-server', 'packages/types', 'packages/utils'],
      }
      const context = createMockContext()

      const result = await auditFixTestStepCapability.processResult(input, aiResult, context)

      expect(result.workspaces_tested).toHaveLength(3)
      expect(result.passed).toBe(true)
      expect(result.tests_total).toBe(200)
    })
  })
})
