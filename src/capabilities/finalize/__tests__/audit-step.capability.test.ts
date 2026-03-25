import { vi } from 'vitest'

/**
 * Tests for audit-step sub-capability definition.
 */

import type { AIQueryResult } from '../../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import { finalizeAuditStepCapability } from '../audit-step.capability.js'
import type { AuditStepInput } from '../finalize.schema.js'

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

describe('finalizeAuditStepCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(finalizeAuditStepCapability.id).toBe('finalize_audit_step')
    })

    it('has correct type', () => {
      expect(finalizeAuditStepCapability.type).toBe('tool')
    })

    it('has correct visibility', () => {
      expect(finalizeAuditStepCapability.visibility).toBe('internal')
    })

    it("has name containing 'Internal'", () => {
      expect(finalizeAuditStepCapability.name).toContain('Internal')
    })

    it("has description containing 'Internal'", () => {
      expect(finalizeAuditStepCapability.description).toContain('Internal')
    })

    it('has non-empty description', () => {
      expect(finalizeAuditStepCapability.description).toBeTruthy()
      expect(finalizeAuditStepCapability.description.length).toBeGreaterThan(0)
    })

    it('defaults to sonnet model', () => {
      expect(finalizeAuditStepCapability.defaultRequestOptions?.model).toBe('sonnet-1m')
    })

    it('defaults to 120 maxTurns', () => {
      expect(finalizeAuditStepCapability.defaultRequestOptions?.maxTurns).toBe(120)
    })

    it('defaults to $6.0 budget', () => {
      expect(finalizeAuditStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(6.0)
    })

    it('has claude_code preset', () => {
      const tools = finalizeAuditStepCapability.defaultRequestOptions?.tools
      expect(tools).toBeDefined()
      expect(tools).toHaveProperty('type', 'preset')
      if (tools && 'preset' in tools) {
        expect(tools.preset).toBe('claude_code')
      }
    })

    it('has bypassPermissions enabled', () => {
      expect(finalizeAuditStepCapability.defaultRequestOptions?.permissionMode).toBe(
        'bypassPermissions',
      )
    })

    it('has allowDangerouslySkipPermissions enabled', () => {
      expect(
        finalizeAuditStepCapability.defaultRequestOptions?.allowDangerouslySkipPermissions,
      ).toBe(true)
    })

    it('has prompt registry with v1 and v2', () => {
      expect(finalizeAuditStepCapability.promptRegistry).toBeDefined()
      expect(finalizeAuditStepCapability.promptRegistry.v1).toBeDefined()
      expect(finalizeAuditStepCapability.promptRegistry.v2).toBeDefined()
    })

    it('has current prompt version v2', () => {
      expect(finalizeAuditStepCapability.currentPromptVersion).toBe('v2')
    })

    it('has v1 marked as deprecated', () => {
      expect(finalizeAuditStepCapability.promptRegistry.v1.deprecated).toBe(true)
      expect(finalizeAuditStepCapability.promptRegistry.v1.sunsetDate).toBe('2026-03-01')
    })
  })

  describe('preparePromptInput', () => {
    it('extracts filesChanged and cwd', () => {
      const input: AuditStepInput = {
        files_changed: ['src/file1.ts', 'src/file2.ts'],
        cwd: '/some/path',
      }
      const context = createMockContext()

      const result = finalizeAuditStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        filesChanged: ['src/file1.ts', 'src/file2.ts'],
        cwd: '/some/path',
      })
    })

    it('handles missing cwd', () => {
      const input: AuditStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = finalizeAuditStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        filesChanged: ['src/file.ts'],
        cwd: undefined,
      })
    })
  })

  describe('processResult', () => {
    it('parses valid audit_result XML block', async () => {
      const auditResult = {
        status: 'pass',
        fixes_applied: 3,
        issues_remaining: 0,
        tsc_passed: true,
        summary: 'Fixed 3 issues',
      }
      const content = `Audit complete.\n<audit_result>${JSON.stringify(auditResult)}</audit_result>`
      const aiResult = createMockAiResult(content)
      const input: AuditStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeAuditStepCapability.processResult(input, aiResult, context)

      expect(result).toEqual(auditResult)
    })

    it('returns fallback on parse failure (no XML block)', async () => {
      const content = 'No audit result block here.'
      const aiResult = createMockAiResult(content)
      const input: AuditStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeAuditStepCapability.processResult(input, aiResult, context)

      expect(result.status).toBe('fail')
      expect(result.fixes_applied).toBe(0)
      expect(result.issues_remaining).toBe(0)
      expect(result.tsc_passed).toBe(false)
      expect(result.summary).toContain(content)
    })

    it('returns fallback on invalid JSON in XML block', async () => {
      const content = `<audit_result>not valid json</audit_result>`
      const aiResult = createMockAiResult(content)
      const input: AuditStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeAuditStepCapability.processResult(input, aiResult, context)

      expect(result.status).toBe('fail')
      expect(result.fixes_applied).toBe(0)
    })

    it('returns fallback on invalid schema in XML block', async () => {
      const invalidResult = {
        status: 'invalid_status',
        fixes_applied: -1,
      }
      const content = `<audit_result>${JSON.stringify(invalidResult)}</audit_result>`
      const aiResult = createMockAiResult(content)
      const input: AuditStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeAuditStepCapability.processResult(input, aiResult, context)

      expect(result.status).toBe('fail')
    })

    it('handles warn status', async () => {
      const auditResult = {
        status: 'warn',
        fixes_applied: 1,
        issues_remaining: 2,
        tsc_passed: true,
        summary: 'Minor warnings remain',
      }
      const content = `<audit_result>${JSON.stringify(auditResult)}</audit_result>`
      const aiResult = createMockAiResult(content)
      const input: AuditStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeAuditStepCapability.processResult(input, aiResult, context)

      expect(result.status).toBe('warn')
      expect(result.fixes_applied).toBe(1)
      expect(result.issues_remaining).toBe(2)
    })

    it('handles fail status', async () => {
      const auditResult = {
        status: 'fail',
        fixes_applied: 0,
        issues_remaining: 5,
        tsc_passed: false,
        summary: 'Critical failures',
      }
      const content = `<audit_result>${JSON.stringify(auditResult)}</audit_result>`
      const aiResult = createMockAiResult(content)
      const input: AuditStepInput = {
        files_changed: ['src/file.ts'],
      }
      const context = createMockContext()

      const result = await finalizeAuditStepCapability.processResult(input, aiResult, context)

      expect(result.status).toBe('fail')
      expect(result.tsc_passed).toBe(false)
    })
  })
})
