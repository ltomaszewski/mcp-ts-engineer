import { vi } from 'vitest'

/**
 * Tests for commit-step sub-capability definition.
 */

import type { AIQueryResult } from '../../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import { commitStepCapability } from '../commit-step.capability.js'
import type { CommitStepInput } from '../todo-code-writer.schema.js'

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

function createMockAiResult(
  content: string,
  structuredOutput?: Record<string, unknown>,
): AIQueryResult {
  return {
    content,
    structuredOutput,
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

describe('commitStepCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(commitStepCapability.id).toBe('todo_code_writer_commit_step')
    })

    it('has correct type', () => {
      expect(commitStepCapability.type).toBe('tool')
    })

    it('has correct visibility', () => {
      expect(commitStepCapability.visibility).toBe('internal')
    })

    it('has non-empty name', () => {
      expect(commitStepCapability.name).toBeTruthy()
      expect(commitStepCapability.name.length).toBeGreaterThan(0)
    })

    it('has non-empty description', () => {
      expect(commitStepCapability.description).toBeTruthy()
      expect(commitStepCapability.description.length).toBeGreaterThan(0)
    })

    it('defaults to haiku model', () => {
      expect(commitStepCapability.defaultRequestOptions?.model).toBe('haiku')
    })

    it('defaults to 20 maxTurns', () => {
      expect(commitStepCapability.defaultRequestOptions?.maxTurns).toBe(20)
    })

    it('defaults to $0.5 budget', () => {
      expect(commitStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(0.5)
    })

    it('has prompt registry with v1', () => {
      expect(commitStepCapability.promptRegistry).toBeDefined()
      expect(commitStepCapability.promptRegistry.v1).toBeDefined()
    })

    it('has current prompt version v1', () => {
      expect(commitStepCapability.currentPromptVersion).toBe('v1')
    })

    it('has outputSchema configured', () => {
      expect(commitStepCapability.defaultRequestOptions?.outputSchema).toBeDefined()
    })
  })

  describe('preparePromptInput', () => {
    it('extracts specPath, filesChanged, phaseSummaries, finalAuditSummary, and cwd', () => {
      const input: CommitStepInput = {
        spec_path: 'docs/specs/feature.md',
        files_changed: ['src/test1.ts', 'src/test2.ts'],
        phase_summaries: ['Phase 1 complete', 'Phase 2 complete'],
        final_audit_summary: 'All checks passed',
        cwd: '/some/path',
      }
      const context = createMockContext()

      const result = commitStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        specPath: 'docs/specs/feature.md',
        filesChanged: ['src/test1.ts', 'src/test2.ts'],
        phaseSummaries: ['Phase 1 complete', 'Phase 2 complete'],
        finalAuditSummary: 'All checks passed',
        sessionId: 'test-session',
        cwd: '/some/path',
        partialRun: undefined,
        failureContext: undefined,
      })
    })

    it('handles missing cwd', () => {
      const input: CommitStepInput = {
        spec_path: 'docs/specs/feature.md',
        files_changed: ['src/test.ts'],
        phase_summaries: ['Done'],
        final_audit_summary: 'Pass',
      }
      const context = createMockContext()

      const result = commitStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        specPath: 'docs/specs/feature.md',
        filesChanged: ['src/test.ts'],
        phaseSummaries: ['Done'],
        finalAuditSummary: 'Pass',
        sessionId: 'test-session',
        cwd: undefined,
        partialRun: undefined,
        failureContext: undefined,
      })
    })

    it('includes partialRun and failureContext when input has partial_run', () => {
      const input: CommitStepInput = {
        spec_path: 'docs/specs/feature.md',
        files_changed: ['src/test.ts'],
        phase_summaries: ['Phase 1 complete'],
        final_audit_summary: 'Partial audit',
        partial_run: true,
        failure_context: 'Phase 2 failed: build errors',
      }
      const context = createMockContext()

      const result = commitStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        specPath: 'docs/specs/feature.md',
        filesChanged: ['src/test.ts'],
        phaseSummaries: ['Phase 1 complete'],
        finalAuditSummary: 'Partial audit',
        sessionId: 'test-session',
        cwd: undefined,
        partialRun: true,
        failureContext: 'Phase 2 failed: build errors',
      })
    })

    it('omits partial fields when input has no partial_run', () => {
      const input: CommitStepInput = {
        spec_path: 'docs/specs/feature.md',
        files_changed: ['src/test.ts'],
        phase_summaries: ['Done'],
        final_audit_summary: 'Pass',
      }
      const context = createMockContext()

      const result = commitStepCapability.preparePromptInput(input, context) as Record<
        string,
        unknown
      >

      expect(result.partialRun).toBeUndefined()
      expect(result.failureContext).toBeUndefined()
    })

    it('includes sessionId from context.session.id', () => {
      const input: CommitStepInput = {
        spec_path: 'docs/specs/feature.md',
        files_changed: ['src/test.ts'],
        phase_summaries: ['Phase 1 complete'],
        final_audit_summary: 'Pass',
      }
      const context = createMockContext()
      context.session.id = 'abc123def456'

      const result = commitStepCapability.preparePromptInput(input, context) as Record<
        string,
        unknown
      >

      expect(result.sessionId).toBe('abc123def456')
    })
  })

  describe('processResult', () => {
    it('uses structured output when available', async () => {
      const structuredOutput = {
        committed: true,
        commit_sha: 'abc123def456',
        commit_message: 'feat(test): implement feature',
        files_changed: ['src/test1.ts', 'src/test2.ts'],
      }
      const aiResult = createMockAiResult('Some content', structuredOutput)
      const input: CommitStepInput = {
        spec_path: 'docs/specs/feature.md',
        files_changed: ['src/test1.ts', 'src/test2.ts'],
        phase_summaries: ['Done'],
        final_audit_summary: 'Pass',
      }
      const context = createMockContext()

      const result = await commitStepCapability.processResult(input, aiResult, context)

      expect(result).toEqual(structuredOutput)
    })

    it('falls back to XML parsing when structured output unavailable', async () => {
      const commitResult = {
        committed: true,
        commit_sha: 'xyz789',
        commit_message: 'chore: update files',
        files_changed: ['src/file.ts'],
      }
      const content = `Commit created.\n<commit_result>${JSON.stringify(commitResult)}</commit_result>`
      const aiResult = createMockAiResult(content)
      const input: CommitStepInput = {
        spec_path: 'docs/specs/feature.md',
        files_changed: ['src/file.ts'],
        phase_summaries: ['Done'],
        final_audit_summary: 'Pass',
      }
      const context = createMockContext()

      const result = await commitStepCapability.processResult(input, aiResult, context)

      expect(result).toEqual(commitResult)
    })

    it('returns fallback on parse failure (no XML block)', async () => {
      const content = 'No commit result block here.'
      const aiResult = createMockAiResult(content)
      const input: CommitStepInput = {
        spec_path: 'docs/specs/feature.md',
        files_changed: ['src/test.ts'],
        phase_summaries: ['Done'],
        final_audit_summary: 'Pass',
      }
      const context = createMockContext()

      const result = await commitStepCapability.processResult(input, aiResult, context)

      expect(result.committed).toBe(false)
      expect(result.commit_sha).toBeNull()
      expect(result.commit_message).toBeNull()
      expect(result.files_changed).toEqual([])
    })

    it('returns fallback on invalid JSON in XML block', async () => {
      const content = `<commit_result>not valid json</commit_result>`
      const aiResult = createMockAiResult(content)
      const input: CommitStepInput = {
        spec_path: 'docs/specs/feature.md',
        files_changed: ['src/test.ts'],
        phase_summaries: ['Done'],
        final_audit_summary: 'Pass',
      }
      const context = createMockContext()

      const result = await commitStepCapability.processResult(input, aiResult, context)

      expect(result.committed).toBe(false)
    })

    it('returns fallback on invalid structured output schema', async () => {
      const invalidStructuredOutput = {
        committed: 'not_a_boolean', // Wrong type
        commit_sha: 123, // Wrong type
        commit_message: true, // Wrong type
        files_changed: 'not_an_array', // Wrong type
      }
      const aiResult = createMockAiResult('Content', invalidStructuredOutput)
      const input: CommitStepInput = {
        spec_path: 'docs/specs/feature.md',
        files_changed: ['src/test.ts'],
        phase_summaries: ['Done'],
        final_audit_summary: 'Pass',
      }
      const context = createMockContext()

      const result = await commitStepCapability.processResult(input, aiResult, context)

      expect(result.committed).toBe(false)
    })

    it('handles commit with null SHA and message when committed=false', async () => {
      const structuredOutput = {
        committed: false,
        commit_sha: null,
        commit_message: null,
        files_changed: [],
      }
      const aiResult = createMockAiResult('No changes to commit', structuredOutput)
      const input: CommitStepInput = {
        spec_path: 'docs/specs/feature.md',
        files_changed: [],
        phase_summaries: ['No changes'],
        final_audit_summary: 'Pass',
      }
      const context = createMockContext()

      const result = await commitStepCapability.processResult(input, aiResult, context)

      expect(result.committed).toBe(false)
      expect(result.commit_sha).toBeNull()
      expect(result.commit_message).toBeNull()
    })
  })
})
