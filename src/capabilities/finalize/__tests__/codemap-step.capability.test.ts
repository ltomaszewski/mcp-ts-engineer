import { vi } from 'vitest'

/**
 * Tests for codemap-step sub-capability definition.
 */

import type { AIQueryResult } from '../../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import { finalizeCodemapStepCapability } from '../codemap-step.capability.js'
import type { CodemapStepInput } from '../finalize.schema.js'

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

describe('finalizeCodemapStepCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(finalizeCodemapStepCapability.id).toBe('finalize_codemap_step')
    })

    it('has correct type', () => {
      expect(finalizeCodemapStepCapability.type).toBe('tool')
    })

    it('has correct visibility', () => {
      expect(finalizeCodemapStepCapability.visibility).toBe('internal')
    })

    it("has name containing 'Internal'", () => {
      expect(finalizeCodemapStepCapability.name).toContain('Internal')
    })

    it("has description containing 'Internal'", () => {
      expect(finalizeCodemapStepCapability.description).toContain('Internal')
    })

    it('has non-empty description', () => {
      expect(finalizeCodemapStepCapability.description).toBeTruthy()
      expect(finalizeCodemapStepCapability.description.length).toBeGreaterThan(0)
    })

    it('defaults to sonnet model', () => {
      expect(finalizeCodemapStepCapability.defaultRequestOptions?.model).toBe('sonnet')
    })

    it('defaults to 50 maxTurns', () => {
      expect(finalizeCodemapStepCapability.defaultRequestOptions?.maxTurns).toBe(50)
    })

    it('defaults to $3.0 budget', () => {
      expect(finalizeCodemapStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(3.0)
    })

    it('has claude_code preset', () => {
      const tools = finalizeCodemapStepCapability.defaultRequestOptions?.tools
      expect(tools).toBeDefined()
      expect(tools).toHaveProperty('type', 'preset')
      if (tools && 'preset' in tools) {
        expect(tools.preset).toBe('claude_code')
      }
    })

    it('has bypassPermissions enabled', () => {
      expect(finalizeCodemapStepCapability.defaultRequestOptions?.permissionMode).toBe(
        'bypassPermissions',
      )
    })

    it('has allowDangerouslySkipPermissions enabled', () => {
      expect(
        finalizeCodemapStepCapability.defaultRequestOptions?.allowDangerouslySkipPermissions,
      ).toBe(true)
    })

    it('has prompt registry with v1', () => {
      expect(finalizeCodemapStepCapability.promptRegistry).toBeDefined()
      expect(finalizeCodemapStepCapability.promptRegistry.v1).toBeDefined()
    })

    it('has current prompt version v1', () => {
      expect(finalizeCodemapStepCapability.currentPromptVersion).toBe('v1')
    })

    it('has outputSchema configured', () => {
      expect(finalizeCodemapStepCapability.defaultRequestOptions?.outputSchema).toBeDefined()
    })
  })

  describe('preparePromptInput', () => {
    it('extracts filesChanged, monorepoRoot, and cwd', () => {
      const input: CodemapStepInput = {
        files_changed: ['src/file1.ts', 'src/file2.ts'],
        cwd: '/some/path',
      }
      const context = createMockContext()

      const result = finalizeCodemapStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        filesChanged: ['src/file1.ts', 'src/file2.ts'],
        monorepoRoot: expect.any(String),
        cwd: '/some/path',
      })
      expect((result as Record<string, unknown>).monorepoRoot).toBeTruthy()
    })

    it('handles missing cwd', () => {
      const input: CodemapStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = finalizeCodemapStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        filesChanged: ['src/file.ts'],
        monorepoRoot: expect.any(String),
        cwd: undefined,
      })
    })
  })

  describe('processResult', () => {
    it('parses valid codemap_result XML block', async () => {
      const codemapResult = {
        updated: true,
        codemaps_changed: ['.claude/codemaps/feature.md'],
        summary: 'Updated feature codemap',
      }
      const content = `Codemap update complete.\n<codemap_result>${JSON.stringify(codemapResult)}</codemap_result>`
      const aiResult = createMockAiResult(content)
      const input: CodemapStepInput = {
        files_changed: ['src/feature.ts'],
      }
      const context = createMockContext()

      const result = await finalizeCodemapStepCapability.processResult(input, aiResult, context)

      expect(result).toEqual(codemapResult)
    })

    it('returns fallback on parse failure (no XML block)', async () => {
      const content = 'No codemap result block here.'
      const aiResult = createMockAiResult(content)
      const input: CodemapStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeCodemapStepCapability.processResult(input, aiResult, context)

      expect(result.updated).toBe(false)
      expect(result.codemaps_changed).toEqual([])
      expect(result.summary).toContain(content)
    })

    it('returns fallback on invalid JSON in XML block', async () => {
      const content = `<codemap_result>not valid json</codemap_result>`
      const aiResult = createMockAiResult(content)
      const input: CodemapStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeCodemapStepCapability.processResult(input, aiResult, context)

      expect(result.updated).toBe(false)
    })

    it('returns fallback on invalid schema in XML block', async () => {
      const invalidResult = {
        updated: 'not_boolean',
        codemaps_changed: 'not_array',
      }
      const content = `<codemap_result>${JSON.stringify(invalidResult)}</codemap_result>`
      const aiResult = createMockAiResult(content)
      const input: CodemapStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeCodemapStepCapability.processResult(input, aiResult, context)

      expect(result.updated).toBe(false)
    })

    it('handles no updates needed', async () => {
      const codemapResult = {
        updated: false,
        codemaps_changed: [],
        summary: 'No structural changes detected',
      }
      const content = `<codemap_result>${JSON.stringify(codemapResult)}</codemap_result>`
      const aiResult = createMockAiResult(content)
      const input: CodemapStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeCodemapStepCapability.processResult(input, aiResult, context)

      expect(result.updated).toBe(false)
      expect(result.summary).toBe('No structural changes detected')
    })

    it('handles multiple codemaps changed', async () => {
      const codemapResult = {
        updated: true,
        codemaps_changed: ['.claude/codemaps/feature1.md', '.claude/codemaps/feature2.md'],
        summary: 'Updated 2 codemaps',
      }
      const content = `<codemap_result>${JSON.stringify(codemapResult)}</codemap_result>`
      const aiResult = createMockAiResult(content)
      const input: CodemapStepInput = {
        files_changed: ['src/file1.ts', 'src/file2.ts'],
      }
      const context = createMockContext()

      const result = await finalizeCodemapStepCapability.processResult(input, aiResult, context)

      expect(result.codemaps_changed).toHaveLength(2)
    })
  })
})
