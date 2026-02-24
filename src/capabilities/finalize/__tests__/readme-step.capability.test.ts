import { vi } from 'vitest'

/**
 * Tests for readme-step sub-capability definition.
 */

import type { AIQueryResult } from '../../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import type { ReadmeStepInput } from '../finalize.schema.js'
import { finalizeReadmeStepCapability } from '../readme-step.capability.js'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockContext(): CapabilityContext {
  return {
    session: {
      id: 'test-session',
      state: 'active',
      startedAt: '2026-02-07T00:00:00Z',
      invocations: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    },
    invocation: {
      id: 'test-invocation',
      capability: 'test_capability',
      input: {},
      timestamp: '2026-02-07T00:00:00Z',
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
      startedAt: '2026-02-07T00:00:00Z',
      request: { prompt: 'test' },
      turns: [],
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('finalizeReadmeStepCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(finalizeReadmeStepCapability.id).toBe('finalize_readme_step')
    })

    it('has correct type', () => {
      expect(finalizeReadmeStepCapability.type).toBe('tool')
    })

    it('has correct visibility', () => {
      expect(finalizeReadmeStepCapability.visibility).toBe('internal')
    })

    it("has name containing 'Internal'", () => {
      expect(finalizeReadmeStepCapability.name).toContain('Internal')
    })

    it("has description containing 'Internal'", () => {
      expect(finalizeReadmeStepCapability.description).toContain('Internal')
    })

    it('has non-empty description', () => {
      expect(finalizeReadmeStepCapability.description).toBeTruthy()
      expect(finalizeReadmeStepCapability.description.length).toBeGreaterThan(0)
    })

    it('has prompt registry with v1', () => {
      expect(finalizeReadmeStepCapability.promptRegistry).toBeDefined()
      expect(finalizeReadmeStepCapability.promptRegistry.v1).toBeDefined()
    })

    it('has current prompt version v1', () => {
      expect(finalizeReadmeStepCapability.currentPromptVersion).toBe('v1')
    })
  })

  describe('default options', () => {
    it('defaults to haiku model', () => {
      expect(finalizeReadmeStepCapability.defaultRequestOptions?.model).toBe('haiku')
    })

    it('defaults to 30 maxTurns', () => {
      expect(finalizeReadmeStepCapability.defaultRequestOptions?.maxTurns).toBe(30)
    })

    it('defaults to $1.0 budget', () => {
      expect(finalizeReadmeStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(1.0)
    })

    it('has claude_code preset', () => {
      const tools = finalizeReadmeStepCapability.defaultRequestOptions?.tools
      expect(tools).toBeDefined()
      expect(tools).toHaveProperty('type', 'preset')
      if (tools && 'preset' in tools) {
        expect(tools.preset).toBe('claude_code')
      }
    })

    it('has bypassPermissions enabled', () => {
      expect(finalizeReadmeStepCapability.defaultRequestOptions?.permissionMode).toBe(
        'bypassPermissions',
      )
      expect(
        finalizeReadmeStepCapability.defaultRequestOptions?.allowDangerouslySkipPermissions,
      ).toBe(true)
    })
  })

  describe('preparePromptInput', () => {
    it('extracts filesChanged and cwd', () => {
      const input: ReadmeStepInput = {
        files_changed: ['src/file1.ts', 'src/file2.ts'],
        cwd: '/some/path',
      }
      const context = createMockContext()

      const result = finalizeReadmeStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        filesChanged: ['src/file1.ts', 'src/file2.ts'],
        cwd: '/some/path',
      })
    })

    it('handles missing cwd', () => {
      const input: ReadmeStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = finalizeReadmeStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        filesChanged: ['src/file.ts'],
        cwd: undefined,
      })
    })
  })

  describe('processResult', () => {
    it('parses valid readme_result XML block', async () => {
      const readmeResult = {
        updated: true,
        readmes_changed: ['apps/my-server/README.md', 'packages/types/README.md'],
        summary: 'Updated 2 READMEs with new API endpoints',
      }
      const content = `README updates complete.\n<readme_result>${JSON.stringify(readmeResult)}</readme_result>`
      const aiResult = createMockAiResult(content)
      const input: ReadmeStepInput = {
        files_changed: ['src/api/user.ts'],
      }
      const context = createMockContext()

      const result = await finalizeReadmeStepCapability.processResult(input, aiResult, context)

      expect(result).toEqual(readmeResult)
    })

    it('returns fallback on parse failure (no XML block)', async () => {
      const content = 'No readme result block here.'
      const aiResult = createMockAiResult(content)
      const input: ReadmeStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeReadmeStepCapability.processResult(input, aiResult, context)

      expect(result.updated).toBe(false)
      expect(result.readmes_changed).toEqual([])
      expect(result.summary).toContain('No readme result block here.')
    })

    it('returns fallback on invalid JSON in XML block', async () => {
      const content = `<readme_result>not valid json</readme_result>`
      const aiResult = createMockAiResult(content)
      const input: ReadmeStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeReadmeStepCapability.processResult(input, aiResult, context)

      expect(result.updated).toBe(false)
      expect(result.readmes_changed).toEqual([])
    })

    it('returns fallback on invalid schema in XML block', async () => {
      const invalidResult = {
        updated: 'not_boolean',
        readmes_changed: 123,
      }
      const content = `<readme_result>${JSON.stringify(invalidResult)}</readme_result>`
      const aiResult = createMockAiResult(content)
      const input: ReadmeStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeReadmeStepCapability.processResult(input, aiResult, context)

      expect(result.updated).toBe(false)
      expect(result.readmes_changed).toEqual([])
    })

    it('handles no updates needed (updated=false)', async () => {
      const readmeResult = {
        updated: false,
        readmes_changed: [],
        summary: 'No documented features changed',
      }
      const content = `<readme_result>${JSON.stringify(readmeResult)}</readme_result>`
      const aiResult = createMockAiResult(content)
      const input: ReadmeStepInput = {
        files_changed: ['src/internal/helper.ts'],
      }
      const context = createMockContext()

      const result = await finalizeReadmeStepCapability.processResult(input, aiResult, context)

      expect(result.updated).toBe(false)
      expect(result.readmes_changed).toEqual([])
      expect(result.summary).toBe('No documented features changed')
    })

    it('handles multiple READMEs changed', async () => {
      const readmeResult = {
        updated: true,
        readmes_changed: [
          'apps/my-server/README.md',
          'apps/mcp-ts-engineer/README.md',
          'packages/utils/README.md',
        ],
        summary: 'Updated 3 READMEs with new dependencies',
      }
      const content = `<readme_result>${JSON.stringify(readmeResult)}</readme_result>`
      const aiResult = createMockAiResult(content)
      const input: ReadmeStepInput = {
        files_changed: ['package.json', 'apps/my-server/package.json'],
      }
      const context = createMockContext()

      const result = await finalizeReadmeStepCapability.processResult(input, aiResult, context)

      expect(result.updated).toBe(true)
      expect(result.readmes_changed).toHaveLength(3)
      expect(result.summary).toBe('Updated 3 READMEs with new dependencies')
    })
  })
})
