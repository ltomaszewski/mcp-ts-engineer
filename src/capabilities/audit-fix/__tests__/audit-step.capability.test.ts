import { vi } from 'vitest'

/**
 * Tests for audit-step sub-capability definition (AC-6).
 * Tests preparePromptInput builds project-scoped input,
 * processResult parses XML and structured output, fallback on parse failure.
 */

import type { AIQueryResult } from '../../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import type { AuditStepInput } from '../audit-fix.schema.js'
import { auditFixAuditStepCapability } from '../audit-step.capability.js'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockContext(): CapabilityContext {
  return {
    session: {
      id: 'test-session',
      state: 'active',
      startedAt: '2026-02-01T00:00:00Z',
      invocations: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    },
    invocation: {
      id: 'test-invocation',
      capability: 'audit_fix_audit_step',
      input: {},
      timestamp: '2026-02-01T00:00:00Z',
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
      startedAt: '2026-02-01T00:00:00Z',
      request: { prompt: 'test' },
      turns: [],
    },
  }
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('auditFixAuditStepCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(auditFixAuditStepCapability.id).toBe('audit_fix_audit_step')
    })

    it('has visibility set to internal', () => {
      expect(auditFixAuditStepCapability.visibility).toBe('internal')
    })

    it('includes path validation hooks in defaultRequestOptions', () => {
      expect(auditFixAuditStepCapability.defaultRequestOptions?.hooks).toBeDefined()
      const hooks = auditFixAuditStepCapability.defaultRequestOptions?.hooks as unknown as {
        PreToolUse?: unknown[]
      }
      expect(hooks?.PreToolUse).toHaveLength(2)
    })
  })

  describe('preparePromptInput', () => {
    it('builds project-scoped input with projectPath and cwd', () => {
      const input: AuditStepInput = {
        project_path: 'apps/my-server',
        cwd: '/path/to/monorepo',
      }
      const context = createMockContext()

      const result = auditFixAuditStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        projectPath: 'apps/my-server',
        cwd: '/path/to/monorepo',
      })
    })

    it('handles missing cwd', () => {
      const input: AuditStepInput = {
        project_path: 'packages/utils',
      }
      const context = createMockContext()

      const result = auditFixAuditStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        projectPath: 'packages/utils',
        cwd: undefined,
      })
    })
  })

  describe('processResult', () => {
    it('parses valid audit_result XML block with files_with_issues', async () => {
      const auditResult = {
        status: 'warn',
        fixes_applied: 3,
        issues_remaining: 2,
        tsc_passed: true,
        summary: 'Fixed 3 issues, 2 remain',
        files_with_issues: ['src/service.ts', 'src/utils.ts'],
      }
      const content = `Audit complete.\n<audit_result>${JSON.stringify(auditResult)}</audit_result>`
      const aiResult = createMockAiResult(content)
      const input: AuditStepInput = { project_path: 'apps/server' }
      const context = createMockContext()

      const result = await auditFixAuditStepCapability.processResult(input, aiResult, context)

      expect(result).toEqual(auditResult)
    })

    it('returns fallback on parse failure (no XML block)', async () => {
      const content = 'No audit result block here.'
      const aiResult = createMockAiResult(content)
      const input: AuditStepInput = { project_path: 'apps/server' }
      const context = createMockContext()

      const result = await auditFixAuditStepCapability.processResult(input, aiResult, context)

      expect(result.status).toBe('fail')
      expect(result.fixes_applied).toBe(0)
      expect(result.tsc_passed).toBe(false)
      expect(result.files_with_issues).toEqual([])
      expect(result.summary).toContain(content)
    })

    it('returns fallback on invalid JSON in XML block', async () => {
      const content = `<audit_result>not valid json</audit_result>`
      const aiResult = createMockAiResult(content)
      const input: AuditStepInput = { project_path: 'apps/server' }
      const context = createMockContext()

      const result = await auditFixAuditStepCapability.processResult(input, aiResult, context)

      expect(result.status).toBe('fail')
      expect(result.fixes_applied).toBe(0)
    })
  })
})
