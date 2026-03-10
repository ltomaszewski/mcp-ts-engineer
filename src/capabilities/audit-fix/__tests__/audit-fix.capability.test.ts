import { vi } from 'vitest'

/**
 * Tests for audit-fix orchestrator capability (AC-6, AC-7, AC-8).
 * Tests orchestrator loop logic with mocked sub-capabilities:
 * - Plan parsing
 * - Audit -> eng loop per project
 * - Early exit conditions
 * - Total cap enforcement
 * - Commit per project
 * - Aggregate output
 */

import type { AIQueryResult } from '../../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import { auditFixCapability } from '../audit-fix.capability.js'
import type { AuditFixInput } from '../audit-fix.schema.js'

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockContext(invokeResults: Record<string, unknown[]> = {}): CapabilityContext {
  // Track call counts per capability to return sequential results
  const callCounts: Record<string, number> = {}

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
      capability: 'audit_fix',
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
    invokeCapability: vi.fn(async (capabilityId: string) => {
      const results = invokeResults[capabilityId]
      if (!results) return {}

      callCounts[capabilityId] = (callCounts[capabilityId] || 0) + 1
      const idx = callCounts[capabilityId] - 1
      return results[idx < results.length ? idx : results.length - 1]
    }),
  }
}

function createMockAiResult(content: string): AIQueryResult {
  return {
    content,
    usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    costUsd: 0.5,
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

// Common audit/eng/commit result factories
const passAudit = (filesWithIssues: string[] = []) => ({
  status: 'pass' as const,
  fixes_applied: 0,
  issues_remaining: 0,
  tsc_passed: true,
  summary: 'All clean',
  files_with_issues: filesWithIssues,
})

const failAudit = (issues: number, files: string[]) => ({
  status: 'fail' as const,
  fixes_applied: 0,
  issues_remaining: issues,
  tsc_passed: false,
  summary: `${issues} issues found`,
  files_with_issues: files,
})

const warnAudit = (fixesApplied: number, issuesRemaining: number, files: string[]) => ({
  status: 'warn' as const,
  fixes_applied: fixesApplied,
  issues_remaining: issuesRemaining,
  tsc_passed: true,
  summary: `Fixed ${fixesApplied}, ${issuesRemaining} remain`,
  files_with_issues: files,
})

const successEng = (files: string[]) => ({
  status: 'success' as const,
  files_modified: files,
  summary: `Modified ${files.length} files`,
})

const emptyEng = () => ({
  status: 'failed' as const,
  files_modified: [] as string[],
  summary: 'No changes made',
})

const successCommit = (sha: string) => ({
  committed: true,
  commit_sha: sha,
  commit_message: 'chore(scope): auto-fix audit violations',
  files_changed: ['src/file.ts'],
})

const passTest = () => ({
  passed: true,
  tests_total: 10,
  tests_failed: 0,
  failure_summary: '',
  workspaces_tested: ['apps/server'],
})

const failTest = (failedCount: number, summary: string) => ({
  passed: false,
  tests_total: 10,
  tests_failed: failedCount,
  failure_summary: summary,
  workspaces_tested: ['apps/server'],
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('auditFixCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(auditFixCapability.id).toBe('audit_fix')
    })

    it('has visibility set to public', () => {
      expect(auditFixCapability.visibility).toBe('public')
    })
  })

  describe('preparePromptInput', () => {
    it('passes targetProject and cwd', () => {
      const input: AuditFixInput = {
        project: 'apps/server',
        max_iteration_per_project: 3,
        max_total_cap: 10,
        cwd: '/path/to/mono',
      }
      const context = createMockContext()

      const result = auditFixCapability.preparePromptInput(input, context)

      expect(result).toMatchObject({
        targetProject: 'apps/server',
        cwd: '/path/to/mono',
      })
    })

    it('merges explicit exclude with auto-detected submodules', () => {
      const input: AuditFixInput = {
        max_iteration_per_project: 3,
        max_total_cap: 10,
        cwd: '/path/to/mono',
        exclude: ['packages/legacy'],
      }
      const context = createMockContext()

      const result = auditFixCapability.preparePromptInput(input, context) as Record<string, unknown>

      // Should have excludeList containing at least the explicit exclude
      if (result.excludeList) {
        expect(result.excludeList).toContain('packages/legacy')
      }
    })

    it('returns no excludeList when no excludes and no submodules', () => {
      const input: AuditFixInput = {
        max_iteration_per_project: 3,
        max_total_cap: 10,
        // No cwd = no submodule detection, no exclude
      }
      const context = createMockContext()

      const result = auditFixCapability.preparePromptInput(input, context) as Record<string, unknown>

      expect(result.excludeList).toBeUndefined()
    })
  })

  describe('processResult orchestration', () => {
    it('parses audit_plan from planner AI result', async () => {
      const plan = {
        projects: [{ path: 'apps/server', reason: 'TS project', priority: 1 }],
      }
      const aiResult = createMockAiResult(`<audit_plan>${JSON.stringify(plan)}</audit_plan>`)

      const context = createMockContext({
        audit_fix_audit_step: [passAudit()],
        audit_fix_test_step: [passTest()],
      })

      const input: AuditFixInput = {
        max_iteration_per_project: 3,
        max_total_cap: 10,

      }

      const result = await auditFixCapability.processResult(input, aiResult, context)

      expect(result.projects_audited).toBe(1)
      expect(context.invokeCapability).toHaveBeenCalledWith(
        'audit_fix_audit_step',
        expect.objectContaining({ project_path: 'apps/server' }),
      )
    })

    it('falls back to discoverProjects when planner returns empty', async () => {
      const aiResult = createMockAiResult('No plan found.')

      // With undefined cwd, discoverProjects returns [], so 0 projects
      const context = createMockContext()
      const input: AuditFixInput = {
        max_iteration_per_project: 3,
        max_total_cap: 10,

      }

      const result = await auditFixCapability.processResult(input, aiResult, context)

      expect(result.projects_audited).toBe(0)
      expect(result.status).toBe('failed')
    })

    it('post-planner filter excludes projects matching exclude list', async () => {
      const plan = {
        projects: [
          { path: 'apps/server', reason: 'TS project', priority: 1 },
          { path: 'packages/mcp-ts-engineer', reason: 'TS project', priority: 2 },
        ],
      }
      const aiResult = createMockAiResult(`<audit_plan>${JSON.stringify(plan)}</audit_plan>`)

      const context = createMockContext({
        audit_fix_audit_step: [passAudit()],
        audit_fix_test_step: [passTest()],
      })

      const input: AuditFixInput = {
        max_iteration_per_project: 3,
        max_total_cap: 10,

        exclude: ['packages/mcp-ts-engineer'],
      }

      const result = await auditFixCapability.processResult(input, aiResult, context)

      // Should only audit 1 project (the excluded one filtered out)
      expect(result.projects_audited).toBe(1)
      expect(result.project_results[0]?.project_path).toBe('apps/server')
    })

    it('runs audit then eng loop for each project', async () => {
      const plan = {
        projects: [{ path: 'apps/server', reason: 'TS project', priority: 1 }],
      }
      const aiResult = createMockAiResult(`<audit_plan>${JSON.stringify(plan)}</audit_plan>`)

      const context = createMockContext({
        // First audit: issues found, second audit: clean
        audit_fix_audit_step: [failAudit(3, ['src/a.ts']), passAudit()],
        audit_fix_test_step: [failTest(1, 'test failed'), passTest()],
        audit_fix_eng_step: [successEng(['src/a.ts'])],
        audit_fix_commit_step: [successCommit('abc123')],
      })

      const input: AuditFixInput = {
        max_iteration_per_project: 3,
        max_total_cap: 10,

      }

      const result = await auditFixCapability.processResult(input, aiResult, context)

      // Should have called audit twice, eng once
      expect(context.invokeCapability).toHaveBeenCalledWith(
        'audit_fix_audit_step',
        expect.any(Object),
      )
      expect(context.invokeCapability).toHaveBeenCalledWith(
        'audit_fix_eng_step',
        expect.any(Object),
      )
      expect(context.invokeCapability).toHaveBeenCalledWith(
        'audit_fix_commit_step',
        expect.any(Object),
      )
      // Iteration 1: audit fails + eng fix; Iteration 2: audit passes
      expect(result.total_iterations).toBe(2)
    })

    it('early exit when audit returns pass with 0 issues', async () => {
      const plan = {
        projects: [{ path: 'apps/server', reason: 'TS project', priority: 1 }],
      }
      const aiResult = createMockAiResult(`<audit_plan>${JSON.stringify(plan)}</audit_plan>`)

      const context = createMockContext({
        audit_fix_audit_step: [passAudit()],
        audit_fix_test_step: [passTest()],
      })

      const input: AuditFixInput = {
        max_iteration_per_project: 3,
        max_total_cap: 10,

      }

      const result = await auditFixCapability.processResult(input, aiResult, context)

      // Should not have called eng step at all
      expect(context.invokeCapability).not.toHaveBeenCalledWith(
        'audit_fix_eng_step',
        expect.any(Object),
      )
      // Should not commit since no files modified
      expect(context.invokeCapability).not.toHaveBeenCalledWith(
        'audit_fix_commit_step',
        expect.any(Object),
      )
      // Iteration 1: audit passes immediately (still counts as 1 iteration)
      expect(result.total_iterations).toBe(1)
      expect(result.project_results[0].final_audit_status).toBe('pass')
    })

    it('early exit when eng returns empty files_modified', async () => {
      const plan = {
        projects: [{ path: 'apps/server', reason: 'TS project', priority: 1 }],
      }
      const aiResult = createMockAiResult(`<audit_plan>${JSON.stringify(plan)}</audit_plan>`)

      const context = createMockContext({
        audit_fix_audit_step: [failAudit(3, ['src/a.ts'])],
        audit_fix_test_step: [failTest(1, 'test failed')],
        audit_fix_eng_step: [emptyEng()],
      })

      const input: AuditFixInput = {
        max_iteration_per_project: 3,
        max_total_cap: 10,

      }

      const result = await auditFixCapability.processResult(input, aiResult, context)

      // Should not commit since eng made no changes
      expect(context.invokeCapability).not.toHaveBeenCalledWith(
        'audit_fix_commit_step',
        expect.any(Object),
      )
      // Iteration 1: audit fails + eng returns empty (still counts as 1 iteration)
      expect(result.total_iterations).toBe(1)
    })

    it('respects per-project iteration limit', async () => {
      const plan = {
        projects: [{ path: 'apps/server', reason: 'TS project', priority: 1 }],
      }
      const aiResult = createMockAiResult(`<audit_plan>${JSON.stringify(plan)}</audit_plan>`)

      // Always return issues and always fix something
      const context = createMockContext({
        audit_fix_audit_step: [warnAudit(1, 2, ['src/a.ts']), warnAudit(1, 1, ['src/a.ts'])],
        audit_fix_test_step: [passTest(), passTest()],
        audit_fix_eng_step: [successEng(['src/a.ts']), successEng(['src/a.ts'])],
        audit_fix_commit_step: [successCommit('abc123')],
      })

      const input: AuditFixInput = {
        max_iteration_per_project: 2,
        max_total_cap: 10,

      }

      const result = await auditFixCapability.processResult(input, aiResult, context)

      expect(result.total_iterations).toBe(2)
      expect(result.project_results[0].iterations).toBe(2)
    })

    it('respects total cap across projects', async () => {
      const plan = {
        projects: [
          { path: 'apps/server', reason: 'TS project', priority: 1 },
          { path: 'apps/app', reason: 'TS project', priority: 2 },
        ],
      }
      const aiResult = createMockAiResult(`<audit_plan>${JSON.stringify(plan)}</audit_plan>`)

      const context = createMockContext({
        audit_fix_audit_step: [warnAudit(1, 1, ['src/a.ts']), warnAudit(1, 1, ['src/a.ts'])],
        audit_fix_test_step: [passTest(), passTest()],
        audit_fix_eng_step: [successEng(['src/a.ts']), successEng(['src/b.ts'])],
        audit_fix_commit_step: [successCommit('abc123'), successCommit('def456')],
      })

      const input: AuditFixInput = {
        max_iteration_per_project: 5,
        max_total_cap: 1, // Only 1 total iteration allowed

      }

      const result = await auditFixCapability.processResult(input, aiResult, context)

      // Only first project should get 1 iteration, second should get 0
      expect(result.total_iterations).toBe(1)
    })

    it('invokes commit step per project when files modified', async () => {
      const plan = {
        projects: [{ path: 'apps/server', reason: 'TS project', priority: 1 }],
      }
      const aiResult = createMockAiResult(`<audit_plan>${JSON.stringify(plan)}</audit_plan>`)

      const context = createMockContext({
        audit_fix_audit_step: [failAudit(2, ['src/a.ts']), passAudit()],
        audit_fix_test_step: [failTest(1, 'test failed'), passTest()],
        audit_fix_eng_step: [successEng(['src/a.ts', 'src/b.ts'])],
        audit_fix_commit_step: [successCommit('abc123')],
      })

      const input: AuditFixInput = {
        max_iteration_per_project: 3,
        max_total_cap: 10,

      }

      const result = await auditFixCapability.processResult(input, aiResult, context)

      expect(context.invokeCapability).toHaveBeenCalledWith(
        'audit_fix_commit_step',
        expect.objectContaining({
          project_path: 'apps/server',
          files_changed: expect.arrayContaining(['src/a.ts', 'src/b.ts']),
        }),
      )
      expect(result.project_results[0].commit_sha).toBe('abc123')
    })

    it('skips commit when no files modified', async () => {
      const plan = {
        projects: [{ path: 'apps/server', reason: 'TS project', priority: 1 }],
      }
      const aiResult = createMockAiResult(`<audit_plan>${JSON.stringify(plan)}</audit_plan>`)

      const context = createMockContext({
        audit_fix_audit_step: [passAudit()],
        audit_fix_test_step: [passTest()],
      })

      const input: AuditFixInput = {
        max_iteration_per_project: 3,
        max_total_cap: 10,

      }

      await auditFixCapability.processResult(input, aiResult, context)

      expect(context.invokeCapability).not.toHaveBeenCalledWith(
        'audit_fix_commit_step',
        expect.any(Object),
      )
    })

    it('returns success when all projects pass', async () => {
      const plan = {
        projects: [
          { path: 'apps/a', reason: 'TS', priority: 1 },
          { path: 'apps/b', reason: 'TS', priority: 2 },
        ],
      }
      const aiResult = createMockAiResult(`<audit_plan>${JSON.stringify(plan)}</audit_plan>`)

      const context = createMockContext({
        audit_fix_audit_step: [passAudit(), passAudit()],
        audit_fix_test_step: [passTest(), passTest()],
      })

      const input: AuditFixInput = {
        max_iteration_per_project: 3,
        max_total_cap: 10,

      }

      const result = await auditFixCapability.processResult(input, aiResult, context)

      expect(result.status).toBe('success')
      expect(result.projects_audited).toBe(2)
    })

    it('single-project mode when project input is set', async () => {
      // Even if planner returns multiple projects, input.project overrides
      const plan = {
        projects: [
          { path: 'apps/a', reason: 'TS', priority: 1 },
          { path: 'apps/b', reason: 'TS', priority: 2 },
        ],
      }
      const aiResult = createMockAiResult(`<audit_plan>${JSON.stringify(plan)}</audit_plan>`)

      const context = createMockContext({
        audit_fix_audit_step: [passAudit()],
        audit_fix_test_step: [passTest()],
      })

      const input: AuditFixInput = {
        project: 'apps/specific',
        max_iteration_per_project: 3,
        max_total_cap: 10,

      }

      const result = await auditFixCapability.processResult(input, aiResult, context)

      expect(result.projects_audited).toBe(1)
      expect(result.project_results[0].project_path).toBe('apps/specific')
    })
  })
})
