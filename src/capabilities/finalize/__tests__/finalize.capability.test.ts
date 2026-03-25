import { vi } from 'vitest'

/**
 * Tests for finalize orchestrator capability.
 */

import type { AIQueryResult } from '../../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import { finalizeCapability } from '../finalize.capability.js'
import type { FinalizeInput } from '../finalize.schema.js'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockContext(
  invokeCapabilityResults: Record<string, unknown> = {},
): CapabilityContext {
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
    invokeCapability: vi.fn(async (capabilityId: string) => {
      return invokeCapabilityResults[capabilityId]
    }),
  }
}

function createMockAiResult(content: string): AIQueryResult {
  return {
    content,
    usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    costUsd: 0.5,
    turns: 10,
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

describe('finalizeCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(finalizeCapability.id).toBe('finalize')
    })

    it('has correct type', () => {
      expect(finalizeCapability.type).toBe('tool')
    })

    it('has correct visibility', () => {
      expect(finalizeCapability.visibility).toBe('public')
    })

    it("has name 'Finalize'", () => {
      expect(finalizeCapability.name).toBe('Finalize')
    })

    it('has non-empty description', () => {
      expect(finalizeCapability.description).toBeTruthy()
      expect(finalizeCapability.description.length).toBeGreaterThan(0)
    })

    it('defaults to sonnet model', () => {
      expect(finalizeCapability.defaultRequestOptions?.model).toBe('sonnet')
    })

    it('defaults to 50 maxTurns', () => {
      expect(finalizeCapability.defaultRequestOptions?.maxTurns).toBe(50)
    })

    it('defaults to $3.0 budget', () => {
      expect(finalizeCapability.defaultRequestOptions?.maxBudgetUsd).toBe(3.0)
    })

    it('has claude_code preset', () => {
      const tools = finalizeCapability.defaultRequestOptions?.tools
      expect(tools).toBeDefined()
      expect(tools).toHaveProperty('type', 'preset')
      if (tools && 'preset' in tools) {
        expect(tools.preset).toBe('claude_code')
      }
    })

    it('has bypassPermissions enabled', () => {
      expect(finalizeCapability.defaultRequestOptions?.permissionMode).toBe('bypassPermissions')
    })

    it('has allowDangerouslySkipPermissions enabled', () => {
      expect(finalizeCapability.defaultRequestOptions?.allowDangerouslySkipPermissions).toBe(true)
    })

    it('has prompt registry with v1', () => {
      expect(finalizeCapability.promptRegistry).toBeDefined()
      expect(finalizeCapability.promptRegistry.v1).toBeDefined()
    })

    it('has current prompt version v1', () => {
      expect(finalizeCapability.currentPromptVersion).toBe('v1')
    })
  })

  describe('preparePromptInput', () => {
    it('extracts filesChanged, monorepoRoot, and cwd', () => {
      const input: FinalizeInput = {
        files_changed: ['src/file1.ts', 'src/file2.ts'],
        cwd: '/some/path',

        skip_codemaps: false,
        skip_readmes: false,
      }
      const context = createMockContext()

      const result = finalizeCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        filesChanged: ['src/file1.ts', 'src/file2.ts'],
        monorepoRoot: expect.any(String),
        cwd: '/some/path',
      })
      expect((result as Record<string, unknown>).monorepoRoot).toBeTruthy()
    })

    it('handles missing cwd', () => {
      const input: FinalizeInput = {
        files_changed: ['src/file.ts'],

        skip_codemaps: false,
        skip_readmes: false,
      }
      const context = createMockContext()

      const result = finalizeCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        filesChanged: ['src/file.ts'],
        monorepoRoot: expect.any(String),
        cwd: undefined,
      })
    })
  })

  describe('processResult orchestration', () => {
    it('calls all steps in sequence when no skip flags', async () => {
      const auditResult = {
        status: 'pass' as const,
        fixes_applied: 2,
        issues_remaining: 0,
        tsc_passed: true,
        summary: 'Fixed 2 issues',
      }
      const testResult = {
        passed: true,
        workspaces_tested: ['apps/my-server'],
        summary: 'All tests passed',
      }
      const codemapResult = {
        updated: true,
        codemaps_changed: ['.claude/codemaps/feature.md'],
        summary: 'Updated 1 codemap',
      }
      const commitResult = {
        committed: true,
        commit_sha: 'abc123',
        commit_message: 'chore: finalize',
        files_committed: ['src/file.ts'],
      }

      const context = createMockContext({
        finalize_audit_step: auditResult,
        finalize_test_step: testResult,
        finalize_codemap_step: codemapResult,
        finalize_commit_step: commitResult,
      })

      const input: FinalizeInput = {
        files_changed: ['apps/my-server/src/file.ts'],

        skip_codemaps: false,
        skip_readmes: false,
      }

      const finalizePlan = {
        workspaces: ['apps/my-server'],
        codemap_areas: ['my-server'],
      }
      const aiResult = createMockAiResult(
        `<finalize_plan>${JSON.stringify(finalizePlan)}</finalize_plan>`,
      )

      const result = await finalizeCapability.processResult(input, aiResult, context)

      expect(context.invokeCapability).toHaveBeenCalledWith('finalize_audit_step', {
        files_changed: ['apps/my-server/src/file.ts'],
        cwd: undefined,
      })
      expect(context.invokeCapability).toHaveBeenCalledWith('finalize_test_step', {
        workspaces: ['apps/my-server'],
        cwd: undefined,
      })
      expect(context.invokeCapability).toHaveBeenCalledWith('finalize_codemap_step', {
        files_changed: ['apps/my-server/src/file.ts'],
        cwd: undefined,
      })
      expect(context.invokeCapability).toHaveBeenCalledWith('finalize_commit_step', {
        audit_summary: 'Fixed 2 issues',
        codemap_summary: 'Updated 1 codemap',
        readme_summary: 'No README changes',
        files_affected: ['apps/my-server/src/file.ts', '.claude/codemaps/feature.md'],
        cwd: undefined,
      })

      expect(result.status).toBe('success')
      expect(result.audit_status).toBe('pass')
      expect(result.tests_passed).toBe(true)
      expect(result.codemaps_updated).toBe(true)
      expect(result.commit_sha).toBe('abc123')
    })

    it('skips codemap step when skip_codemaps=true', async () => {
      const auditResult = {
        status: 'pass' as const,
        fixes_applied: 0,
        issues_remaining: 0,
        tsc_passed: true,
        summary: 'No issues',
      }
      const testResult = {
        passed: true,
        workspaces_tested: [],
        summary: 'No workspaces tested',
      }
      const commitResult = {
        committed: true,
        commit_sha: 'abc123',
        commit_message: 'chore: finalize',
        files_committed: [],
      }

      const context = createMockContext({
        finalize_audit_step: auditResult,
        finalize_test_step: testResult,
        finalize_commit_step: commitResult,
      })

      const input: FinalizeInput = {
        files_changed: ['apps/my-server/src/file.ts'],

        skip_codemaps: true,
        skip_readmes: false,
      }

      const finalizePlan = {
        workspaces: ['apps/my-server'],
        codemap_areas: [],
      }
      const aiResult = createMockAiResult(
        `<finalize_plan>${JSON.stringify(finalizePlan)}</finalize_plan>`,
      )

      const result = await finalizeCapability.processResult(input, aiResult, context)

      expect(context.invokeCapability).toHaveBeenCalledWith(
        'finalize_audit_step',
        expect.any(Object),
      )
      expect(context.invokeCapability).toHaveBeenCalledWith(
        'finalize_test_step',
        expect.any(Object),
      )
      expect(context.invokeCapability).not.toHaveBeenCalledWith(
        'finalize_codemap_step',
        expect.any(Object),
      )
      expect(context.invokeCapability).toHaveBeenCalledWith(
        'finalize_commit_step',
        expect.any(Object),
      )

      expect(result.codemaps_updated).toBeNull()
      expect(result.codemaps_summary).toBe('Codemaps skipped')
    })

    it('sets status to failed when tsc_passed=false', async () => {
      const auditResult = {
        status: 'fail' as const,
        fixes_applied: 0,
        issues_remaining: 3,
        tsc_passed: false,
        summary: 'TypeScript errors',
      }
      const commitResult = {
        committed: false,
        commit_sha: null,
        commit_message: null,
        files_committed: [],
      }

      const context = createMockContext({
        finalize_audit_step: auditResult,
        finalize_commit_step: commitResult,
      })

      const input: FinalizeInput = {
        files_changed: ['src/file.ts'],

        skip_codemaps: true,
        skip_readmes: false,
      }

      const finalizePlan = {
        workspaces: [],
        codemap_areas: [],
      }
      const aiResult = createMockAiResult(
        `<finalize_plan>${JSON.stringify(finalizePlan)}</finalize_plan>`,
      )

      const result = await finalizeCapability.processResult(input, aiResult, context)

      expect(result.status).toBe('failed')
    })

    it('sets status to failed when tests fail', async () => {
      const auditResult = {
        status: 'pass' as const,
        fixes_applied: 0,
        issues_remaining: 0,
        tsc_passed: true,
        summary: 'No issues',
      }
      const testResult = {
        passed: false,
        workspaces_tested: ['apps/my-server'],
        summary: '3 tests failed',
      }
      const commitResult = {
        committed: false,
        commit_sha: null,
        commit_message: null,
        files_committed: [],
      }

      const context = createMockContext({
        finalize_audit_step: auditResult,
        finalize_test_step: testResult,
        finalize_commit_step: commitResult,
      })

      const input: FinalizeInput = {
        files_changed: ['apps/my-server/src/file.ts'],

        skip_codemaps: true,
        skip_readmes: false,
      }

      const finalizePlan = {
        workspaces: [],
        codemap_areas: [],
      }
      const aiResult = createMockAiResult(
        `<finalize_plan>${JSON.stringify(finalizePlan)}</finalize_plan>`,
      )

      const result = await finalizeCapability.processResult(input, aiResult, context)

      expect(result.status).toBe('failed')
      expect(result.tests_passed).toBe(false)
    })
  })

  describe('finalize plan parsing', () => {
    it('parses valid finalize_plan JSON with schema validation', async () => {
      const auditResult = {
        status: 'pass' as const,
        fixes_applied: 0,
        issues_remaining: 0,
        tsc_passed: true,
        summary: 'Clean',
      }
      const testResult = {
        passed: true,
        workspaces_tested: ['apps/test'],
        summary: 'Tests passed',
      }
      const codemapResult = {
        updated: false,
        codemaps_changed: [],
        summary: 'No changes',
      }
      const commitResult = {
        committed: false,
        commit_sha: null,
        commit_message: null,
        files_committed: [],
      }

      const context = createMockContext({
        finalize_audit_step: auditResult,
        finalize_test_step: testResult,
        finalize_codemap_step: codemapResult,
        finalize_commit_step: commitResult,
      })

      const input: FinalizeInput = {
        files_changed: ['apps/test/src/file.ts'],

        skip_codemaps: false,
        skip_readmes: false,
      }

      const finalizePlan = {
        workspaces: ['apps/test'],
        codemap_areas: ['test-area'],
      }
      const aiResult = createMockAiResult(
        `<finalize_plan>${JSON.stringify(finalizePlan)}</finalize_plan>`,
      )

      const result = await finalizeCapability.processResult(input, aiResult, context)

      // Should use the parsed workspaces from plan
      expect(context.invokeCapability).toHaveBeenCalledWith('finalize_test_step', {
        workspaces: ['apps/test'],
        cwd: undefined,
      })
      expect(result.status).toBe('success')
    })

    it('falls back to empty arrays when finalize_plan XML missing', async () => {
      const auditResult = {
        status: 'pass' as const,
        fixes_applied: 0,
        issues_remaining: 0,
        tsc_passed: true,
        summary: 'Clean',
      }
      const testResult = {
        passed: true,
        workspaces_tested: [],
        summary: 'No workspaces detected',
      }
      const codemapResult = {
        updated: false,
        codemaps_changed: [],
        summary: 'No changes',
      }
      const commitResult = {
        committed: false,
        commit_sha: null,
        commit_message: null,
        files_committed: [],
      }

      const context = createMockContext({
        finalize_audit_step: auditResult,
        finalize_test_step: testResult,
        finalize_codemap_step: codemapResult,
        finalize_commit_step: commitResult,
      })

      const input: FinalizeInput = {
        files_changed: ['apps/test/src/file.ts'],

        skip_codemaps: false,
        skip_readmes: false,
      }

      // AI result without finalize_plan block
      const aiResult = createMockAiResult('No plan here')

      const result = await finalizeCapability.processResult(input, aiResult, context)

      // Should fall back to detectWorkspaces
      expect(context.invokeCapability).toHaveBeenCalledWith('finalize_test_step', {
        workspaces: ['apps/test'],
        cwd: undefined,
      })
      expect(result.status).toBe('success')
    })

    it('falls back to empty arrays when finalize_plan contains invalid JSON', async () => {
      const auditResult = {
        status: 'pass' as const,
        fixes_applied: 0,
        issues_remaining: 0,
        tsc_passed: true,
        summary: 'Clean',
      }
      const testResult = {
        passed: true,
        workspaces_tested: [],
        summary: 'No workspaces',
      }
      const codemapResult = {
        updated: false,
        codemaps_changed: [],
        summary: 'No changes',
      }
      const commitResult = {
        committed: false,
        commit_sha: null,
        commit_message: null,
        files_committed: [],
      }

      const context = createMockContext({
        finalize_audit_step: auditResult,
        finalize_test_step: testResult,
        finalize_codemap_step: codemapResult,
        finalize_commit_step: commitResult,
      })

      const input: FinalizeInput = {
        files_changed: ['apps/test/src/file.ts'],

        skip_codemaps: false,
        skip_readmes: false,
      }

      // AI result with malformed JSON in finalize_plan
      const aiResult = createMockAiResult(`<finalize_plan>{ invalid json }</finalize_plan>`)

      const result = await finalizeCapability.processResult(input, aiResult, context)

      // Should fall back to detectWorkspaces due to parse failure
      expect(context.invokeCapability).toHaveBeenCalledWith('finalize_test_step', {
        workspaces: ['apps/test'],
        cwd: undefined,
      })
      expect(result.status).toBe('success')
    })

    it('falls back to empty arrays when finalize_plan fails schema validation', async () => {
      const auditResult = {
        status: 'pass' as const,
        fixes_applied: 0,
        issues_remaining: 0,
        tsc_passed: true,
        summary: 'Clean',
      }
      const testResult = {
        passed: true,
        workspaces_tested: [],
        summary: 'No workspaces',
      }
      const codemapResult = {
        updated: false,
        codemaps_changed: [],
        summary: 'No changes',
      }
      const commitResult = {
        committed: false,
        commit_sha: null,
        commit_message: null,
        files_committed: [],
      }

      const context = createMockContext({
        finalize_audit_step: auditResult,
        finalize_test_step: testResult,
        finalize_codemap_step: codemapResult,
        finalize_commit_step: commitResult,
      })

      const input: FinalizeInput = {
        files_changed: ['apps/test/src/file.ts'],

        skip_codemaps: false,
        skip_readmes: false,
      }

      // AI result with JSON that doesn't match schema (missing required fields)
      const aiResult = createMockAiResult(
        `<finalize_plan>${JSON.stringify({ wrong_field: 'value' })}</finalize_plan>`,
      )

      const result = await finalizeCapability.processResult(input, aiResult, context)

      // Should fall back to detectWorkspaces due to validation failure
      expect(context.invokeCapability).toHaveBeenCalledWith('finalize_test_step', {
        workspaces: ['apps/test'],
        cwd: undefined,
      })
      expect(result.status).toBe('success')
    })
  })
})
