import { vi } from 'vitest'

/**
 * Tests for commit-step sub-capability definition.
 */

import type { AIQueryResult } from '../../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import { finalizeCommitStepCapability } from '../commit-step.capability.js'
import type { CommitStepInput } from '../finalize.schema.js'

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

describe('finalizeCommitStepCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(finalizeCommitStepCapability.id).toBe('finalize_commit_step')
    })

    it('has correct type', () => {
      expect(finalizeCommitStepCapability.type).toBe('tool')
    })

    it('has correct visibility', () => {
      expect(finalizeCommitStepCapability.visibility).toBe('internal')
    })

    it("has name containing 'Internal'", () => {
      expect(finalizeCommitStepCapability.name).toContain('Internal')
    })

    it("has description containing 'Internal'", () => {
      expect(finalizeCommitStepCapability.description).toContain('Internal')
    })

    it('has non-empty description', () => {
      expect(finalizeCommitStepCapability.description).toBeTruthy()
      expect(finalizeCommitStepCapability.description.length).toBeGreaterThan(0)
    })

    it('defaults to haiku model', () => {
      expect(finalizeCommitStepCapability.defaultRequestOptions?.model).toBe('haiku')
    })

    it('defaults to 40 maxTurns', () => {
      expect(finalizeCommitStepCapability.defaultRequestOptions?.maxTurns).toBe(40)
    })

    it('defaults to $5.0 budget', () => {
      expect(finalizeCommitStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(5.0)
    })

    it('has claude_code preset', () => {
      const tools = finalizeCommitStepCapability.defaultRequestOptions?.tools
      expect(tools).toBeDefined()
      expect(tools).toHaveProperty('type', 'preset')
      if (tools && 'preset' in tools) {
        expect(tools.preset).toBe('claude_code')
      }
    })

    it('has bypassPermissions enabled', () => {
      expect(finalizeCommitStepCapability.defaultRequestOptions?.permissionMode).toBe(
        'bypassPermissions',
      )
    })

    it('has allowDangerouslySkipPermissions enabled', () => {
      expect(
        finalizeCommitStepCapability.defaultRequestOptions?.allowDangerouslySkipPermissions,
      ).toBe(true)
    })

    it('has prompt registry with v1', () => {
      expect(finalizeCommitStepCapability.promptRegistry).toBeDefined()
      expect(finalizeCommitStepCapability.promptRegistry.v1).toBeDefined()
    })

    it('has current prompt version v1', () => {
      expect(finalizeCommitStepCapability.currentPromptVersion).toBe('v1')
    })
  })

  describe('preparePromptInput', () => {
    it('extracts all required fields', () => {
      const input: CommitStepInput = {
        audit_summary: 'Fixed 3 issues',
        codemap_summary: 'Updated 2 codemaps',
        files_affected: ['src/file1.ts', '.claude/codemaps/feature.md'],
        cwd: '/some/path',
      }
      const context = createMockContext()

      const result = finalizeCommitStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        auditSummary: 'Fixed 3 issues',
        codemapSummary: 'Updated 2 codemaps',
        filesAffected: ['src/file1.ts', '.claude/codemaps/feature.md'],
        sessionId: 'test-session',
        cwd: '/some/path',
        readmeSummary: 'No README changes',
      })
    })

    it('handles missing cwd', () => {
      const input: CommitStepInput = {
        audit_summary: 'No issues',
        codemap_summary: 'No changes',
        files_affected: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = finalizeCommitStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        auditSummary: 'No issues',
        codemapSummary: 'No changes',
        filesAffected: ['src/file.ts'],
        sessionId: 'test-session',
        cwd: undefined,
        readmeSummary: 'No README changes',
      })
    })

    it('includes sessionId from context.session.id', () => {
      const input: CommitStepInput = {
        audit_summary: 'Fixed 3 issues',
        codemap_summary: 'Updated 2 codemaps',
        files_affected: ['src/file1.ts'],
      }
      const context = createMockContext()
      context.session.id = 'xyz789abc123'

      const result = finalizeCommitStepCapability.preparePromptInput(input, context) as Record<
        string,
        unknown
      >

      expect(result.sessionId).toBe('xyz789abc123')
    })

    it('includes readmeSummary in prompt input when provided', () => {
      const input: CommitStepInput = {
        audit_summary: 'Fixed 3 issues',
        codemap_summary: 'Updated 2 codemaps',
        readme_summary: 'Updated 2 READMEs',
        files_affected: ['src/file1.ts'],
      }
      const context = createMockContext()

      const result = finalizeCommitStepCapability.preparePromptInput(input, context)

      expect(result).toHaveProperty('readmeSummary', 'Updated 2 READMEs')
    })

    it("uses fallback 'No README changes' when readme_summary is undefined", () => {
      const input: CommitStepInput = {
        audit_summary: 'Fixed 3 issues',
        codemap_summary: 'Updated 2 codemaps',
        files_affected: ['src/file1.ts'],
      }
      const context = createMockContext()

      const result = finalizeCommitStepCapability.preparePromptInput(input, context)

      expect(result).toHaveProperty('readmeSummary', 'No README changes')
    })
  })

  describe('processResult', () => {
    it('parses valid finalize_commit_result XML block', async () => {
      const commitResult = {
        committed: true,
        commit_sha: 'abc123def456',
        commit_message: 'chore: finalize audit fixes and codemap updates',
        files_committed: ['src/file.ts', '.claude/codemaps/feature.md'],
      }
      const content = `Commit complete.\n<finalize_commit_result>${JSON.stringify(commitResult)}</finalize_commit_result>`
      const aiResult = createMockAiResult(content)
      const input: CommitStepInput = {
        audit_summary: 'Fixed issues',
        codemap_summary: 'Updated codemaps',
        files_affected: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeCommitStepCapability.processResult(input, aiResult, context)

      expect(result).toEqual(commitResult)
    })

    it('returns fallback on parse failure (no XML block)', async () => {
      const content = 'No commit result block here.'
      const aiResult = createMockAiResult(content)
      const input: CommitStepInput = {
        audit_summary: 'Fixed issues',
        codemap_summary: 'Updated codemaps',
        files_affected: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeCommitStepCapability.processResult(input, aiResult, context)

      expect(result.committed).toBe(false)
      expect(result.commit_sha).toBeNull()
      expect(result.commit_message).toBeNull()
      expect(result.files_committed).toEqual([])
    })

    it('returns fallback on invalid JSON in XML block', async () => {
      const content = `<finalize_commit_result>not valid json</finalize_commit_result>`
      const aiResult = createMockAiResult(content)
      const input: CommitStepInput = {
        audit_summary: 'Fixed issues',
        codemap_summary: 'Updated codemaps',
        files_affected: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeCommitStepCapability.processResult(input, aiResult, context)

      expect(result.committed).toBe(false)
    })

    it('returns fallback on invalid schema in XML block', async () => {
      const invalidResult = {
        committed: 'not_boolean',
        commit_sha: 123,
      }
      const content = `<finalize_commit_result>${JSON.stringify(invalidResult)}</finalize_commit_result>`
      const aiResult = createMockAiResult(content)
      const input: CommitStepInput = {
        audit_summary: 'Fixed issues',
        codemap_summary: 'Updated codemaps',
        files_affected: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeCommitStepCapability.processResult(input, aiResult, context)

      expect(result.committed).toBe(false)
    })

    it('handles no commit (no changes)', async () => {
      const commitResult = {
        committed: false,
        commit_sha: null,
        commit_message: null,
        files_committed: [],
      }
      const content = `<finalize_commit_result>${JSON.stringify(commitResult)}</finalize_commit_result>`
      const aiResult = createMockAiResult(content)
      const input: CommitStepInput = {
        audit_summary: 'No issues',
        codemap_summary: 'No changes',
        files_affected: [],
      }
      const context = createMockContext()

      const result = await finalizeCommitStepCapability.processResult(input, aiResult, context)

      expect(result.committed).toBe(false)
      expect(result.commit_sha).toBeNull()
    })

    it('handles successful commit with SHA', async () => {
      const commitResult = {
        committed: true,
        commit_sha: '1234567890abcdef',
        commit_message: 'chore(finalize): audit fixes',
        files_committed: ['src/file1.ts', 'src/file2.ts'],
      }
      const content = `<finalize_commit_result>${JSON.stringify(commitResult)}</finalize_commit_result>`
      const aiResult = createMockAiResult(content)
      const input: CommitStepInput = {
        audit_summary: 'Fixed 2 files',
        codemap_summary: 'No changes',
        files_affected: ['src/file1.ts', 'src/file2.ts'],
      }
      const context = createMockContext()

      const result = await finalizeCommitStepCapability.processResult(input, aiResult, context)

      expect(result.committed).toBe(true)
      expect(result.commit_sha).toBe('1234567890abcdef')
      expect(result.files_committed).toHaveLength(2)
    })
  })
})
