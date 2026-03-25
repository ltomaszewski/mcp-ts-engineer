import { type Mock, vi } from 'vitest'

/**
 * Tests for todo-code-writer orchestrator CapabilityDefinition.
 */

import type { AIQueryResult } from '../../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import { todoCodeWriterCapability } from '../todo-code-writer.capability.js'
import type { TodoCodeWriterInput } from '../todo-code-writer.schema.js'

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
      totalCostUsd: 0.5,
      totalInputTokens: 1000,
      totalOutputTokens: 2000,
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
    structuredOutput: undefined,
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

const VALID_PHASE_PLAN = {
  phases: [
    {
      phase_number: 1,
      purpose: 'Implement schemas',
      dependencies: ['none'],
      files: [
        { path: 'src/schemas.ts', action: 'CREATE' as const, purpose: 'Define data schemas' },
      ],
    },
    {
      phase_number: 2,
      purpose: 'Implement helpers',
      dependencies: ['1'],
      files: [{ path: 'src/helpers.ts', action: 'CREATE' as const, purpose: 'Utility functions' }],
    },
  ],
}

const VALID_ENG_RESULT = {
  status: 'success' as const,
  files_modified: ['src/schemas.ts'],
  summary: 'Schemas implemented successfully',
}

const VALID_AUDIT_RESULT = {
  status: 'pass' as const,
  issues_found: 0,
  summary: 'No issues found',
}

const VALID_FINAL_AUDIT_RESULT = {
  status: 'pass' as const,
  issues_found: 0,
  summary: 'All files integrate correctly',
}

const VALID_COMMIT_RESULT = {
  committed: true,
  commit_sha: 'abc123def456',
  commit_message: 'feat: implement feature',
  files_changed: ['src/schemas.ts', 'src/helpers.ts'],
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('todoCodeWriterCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(todoCodeWriterCapability.id).toBe('todo_code_writer')
    })

    it('has correct type', () => {
      expect(todoCodeWriterCapability.type).toBe('tool')
    })

    it('has correct name', () => {
      expect(todoCodeWriterCapability.name).toBe('Todo Code Writer')
    })

    it('has non-empty description', () => {
      expect(todoCodeWriterCapability.description).toBeTruthy()
      expect(todoCodeWriterCapability.description.length).toBeGreaterThan(0)
    })

    it('has input schema', () => {
      expect(todoCodeWriterCapability.inputSchema).toBeDefined()
    })

    it('has prompt registry with v1', () => {
      expect(todoCodeWriterCapability.promptRegistry).toBeDefined()
      expect(todoCodeWriterCapability.promptRegistry.v1).toBeDefined()
    })

    it('has current prompt version v1', () => {
      expect(todoCodeWriterCapability.currentPromptVersion).toBe('v1')
    })

    it('defaults to public visibility when not specified', () => {
      expect(todoCodeWriterCapability.visibility).toBeUndefined()
    })
  })

  describe('default request options', () => {
    it('has default request options', () => {
      expect(todoCodeWriterCapability.defaultRequestOptions).toBeDefined()
    })

    it('defaults to sonnet model', () => {
      expect(todoCodeWriterCapability.defaultRequestOptions?.model).toBe('sonnet[1m]')
    })

    it('defaults to 100 maxTurns', () => {
      expect(todoCodeWriterCapability.defaultRequestOptions?.maxTurns).toBe(100)
    })

    it('defaults to $5.00 budget', () => {
      expect(todoCodeWriterCapability.defaultRequestOptions?.maxBudgetUsd).toBe(5.0)
    })

    it('uses claude_code tools preset', () => {
      expect(todoCodeWriterCapability.defaultRequestOptions?.tools).toEqual({
        type: 'preset',
        preset: 'claude_code',
      })
    })

    it('uses bypassPermissions mode', () => {
      expect(todoCodeWriterCapability.defaultRequestOptions?.permissionMode).toBe(
        'bypassPermissions',
      )
    })

    it('allows dangerously skip permissions', () => {
      expect(todoCodeWriterCapability.defaultRequestOptions?.allowDangerouslySkipPermissions).toBe(
        true,
      )
    })
  })

  describe('preparePromptInput', () => {
    it('extracts specPath, maxPhases from input', () => {
      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }
      const context = createMockContext()

      const result = todoCodeWriterCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        specPath: 'docs/specs/feature.md',
        maxPhases: 5,
        cwd: undefined,
      })
    })

    it('passes cwd from input', () => {
      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
        cwd: '/some/path',
      }
      const context = createMockContext()

      const result = todoCodeWriterCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        specPath: 'docs/specs/feature.md',
        maxPhases: 5,
        cwd: '/some/path',
      })
    })
  })

  describe('processResult orchestration', () => {
    let context: CapabilityContext
    let mockInvoke: Mock<CapabilityContext['invokeCapability']>

    beforeEach(() => {
      context = createMockContext()
      mockInvoke = vi.fn<CapabilityContext['invokeCapability']>()
      context.invokeCapability = mockInvoke
    })

    it('parses phase plan and orchestrates eng→audit per phase, then final audit and commit', async () => {
      const planJson = JSON.stringify(VALID_PHASE_PLAN)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      // Mock sub-capability invocations
      mockInvoke
        .mockResolvedValueOnce(VALID_ENG_RESULT) // Phase 1 eng
        .mockResolvedValueOnce(VALID_AUDIT_RESULT) // Phase 1 audit
        .mockResolvedValueOnce({
          ...VALID_ENG_RESULT,
          files_modified: ['src/helpers.ts'],
          summary: 'Helpers done',
        }) // Phase 2 eng
        .mockResolvedValueOnce(VALID_AUDIT_RESULT) // Phase 2 audit
        .mockResolvedValueOnce(VALID_FINAL_AUDIT_RESULT) // Final audit
        .mockResolvedValueOnce(VALID_COMMIT_RESULT) // Commit

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      expect(output.status).toBe('success')
      expect(output.phases_completed).toBe(2)
      expect(output.final_audit_status).toBe('pass')
      expect(output.commit_sha).toBe('abc123def456')
      expect(output.commit_message).toBe('feat: implement feature')
      expect(output.files_changed).toEqual(['src/schemas.ts', 'src/helpers.ts'])

      // Verify sub-capability calls
      expect(mockInvoke).toHaveBeenCalledTimes(6)
      expect(mockInvoke).toHaveBeenNthCalledWith(
        1,
        'todo_code_writer_phase_eng_step',
        expect.objectContaining({
          spec_path: 'docs/specs/feature.md',
          phase_plan: VALID_PHASE_PLAN,
          current_phase_number: 1,
        }),
      )
      expect(mockInvoke).toHaveBeenNthCalledWith(
        2,
        'todo_code_writer_phase_audit_step',
        expect.objectContaining({
          spec_path: 'docs/specs/feature.md',
          phase_number: 1,
        }),
      )
      expect(mockInvoke).toHaveBeenNthCalledWith(
        5,
        'todo_code_writer_final_audit_step',
        expect.anything(),
      )
      expect(mockInvoke).toHaveBeenNthCalledWith(
        6,
        'todo_code_writer_commit_step',
        expect.anything(),
      )
    })

    it('handles empty phase plan by skipping phase loop', async () => {
      const emptyPlanJson = JSON.stringify({ phases: [] })
      const aiContent = `No phases.\n<phase_plan>${emptyPlanJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      mockInvoke
        .mockResolvedValueOnce(VALID_FINAL_AUDIT_RESULT) // Final audit
        .mockResolvedValueOnce({ ...VALID_COMMIT_RESULT, files_changed: [] }) // Commit

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      expect(output.status).toBe('success')
      expect(output.phases_completed).toBe(0)
      expect(mockInvoke).toHaveBeenCalledTimes(2) // Only final audit + commit
    })

    it('returns failed status when final audit fails', async () => {
      const planJson = JSON.stringify(VALID_PHASE_PLAN)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      const failedAuditResult = {
        status: 'fail' as const,
        issues_found: 5,
        summary: 'Critical issues detected',
      }

      mockInvoke
        .mockResolvedValueOnce(VALID_ENG_RESULT)
        .mockResolvedValueOnce(VALID_AUDIT_RESULT)
        .mockResolvedValueOnce(VALID_ENG_RESULT)
        .mockResolvedValueOnce(VALID_AUDIT_RESULT)
        .mockResolvedValueOnce(failedAuditResult) // Failed final audit
        .mockResolvedValueOnce(VALID_COMMIT_RESULT)

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      expect(output.status).toBe('failed')
      expect(output.final_audit_status).toBe('fail')
    })

    it('uses fallback phase plan when parsing fails', async () => {
      const aiContent = 'No valid phase plan here.'
      const aiResult = createMockAiResult(aiContent)

      mockInvoke
        .mockResolvedValueOnce(VALID_FINAL_AUDIT_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT)

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      expect(output.phases_completed).toBe(0) // Fallback has empty phases
      expect(mockInvoke).toHaveBeenCalledTimes(2) // Only final audit + commit
    })

    it('deduplicates modified files across phases', async () => {
      const planJson = JSON.stringify(VALID_PHASE_PLAN)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      mockInvoke
        .mockResolvedValueOnce({
          ...VALID_ENG_RESULT,
          files_modified: ['src/schemas.ts', 'src/common.ts'],
        })
        .mockResolvedValueOnce(VALID_AUDIT_RESULT)
        .mockResolvedValueOnce({
          ...VALID_ENG_RESULT,
          files_modified: ['src/common.ts', 'src/helpers.ts'],
        }) // Duplicate src/common.ts
        .mockResolvedValueOnce(VALID_AUDIT_RESULT)
        .mockResolvedValueOnce(VALID_FINAL_AUDIT_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT)

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      await todoCodeWriterCapability.processResult(input, aiResult, context)

      // Final audit should receive deduplicated list
      const finalAuditCall = mockInvoke.mock.calls.find(
        (call) => call[0] === 'todo_code_writer_final_audit_step',
      )
      expect(finalAuditCall).toBeDefined()
      const finalAuditInput = finalAuditCall?.[1] as { all_modified_files: string[] }
      expect(finalAuditInput.all_modified_files).toHaveLength(3)
      expect(new Set(finalAuditInput.all_modified_files).size).toBe(3) // No duplicates
    })

    it('passes phase summaries to commit step', async () => {
      const planJson = JSON.stringify(VALID_PHASE_PLAN)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      mockInvoke
        .mockResolvedValueOnce({ ...VALID_ENG_RESULT, summary: 'Phase 1 summary' })
        .mockResolvedValueOnce(VALID_AUDIT_RESULT)
        .mockResolvedValueOnce({ ...VALID_ENG_RESULT, summary: 'Phase 2 summary' })
        .mockResolvedValueOnce(VALID_AUDIT_RESULT)
        .mockResolvedValueOnce(VALID_FINAL_AUDIT_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT)

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      await todoCodeWriterCapability.processResult(input, aiResult, context)

      const commitCall = mockInvoke.mock.calls.find(
        (call) => call[0] === 'todo_code_writer_commit_step',
      )
      expect(commitCall).toBeDefined()
      const commitInput = commitCall?.[1] as { phase_summaries: string[] }
      expect(commitInput.phase_summaries).toEqual(['Phase 1 summary', 'Phase 2 summary'])
    })
  })

  describe('retry and halt logic', () => {
    let context: CapabilityContext
    let mockInvoke: Mock<CapabilityContext['invokeCapability']>

    beforeEach(() => {
      context = createMockContext()
      mockInvoke = vi.fn<CapabilityContext['invokeCapability']>()
      context.invokeCapability = mockInvoke
    })

    it('retries eng step up to 2 times on exception, then halts', async () => {
      const planJson = JSON.stringify(VALID_PHASE_PLAN)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      // Eng step fails 3 times (exhausts retries)
      mockInvoke
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))
        .mockRejectedValueOnce(new Error('Network timeout'))

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      expect(output.status).toBe('failed')
      expect(output.failed_phase).toBe(1)
      expect(output.failure_reason).toContain('Network timeout')
      expect(output.phases_completed).toBe(0)
      expect(output.files_changed).toEqual([])
      expect(mockInvoke).toHaveBeenCalledTimes(3) // 3 attempts for eng step (1 initial + 2 retries)
    })

    it('does not retry on logical failure (status: failed)', async () => {
      const planJson = JSON.stringify(VALID_PHASE_PLAN)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      const failedEngResult = {
        status: 'failed' as const,
        files_modified: [],
        summary: 'Tests failed',
      }

      mockInvoke.mockResolvedValueOnce(failedEngResult) // Logical failure

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      expect(output.status).toBe('failed')
      expect(output.failed_phase).toBe(1)
      expect(output.failure_reason).toContain('Tests failed')
      expect(mockInvoke).toHaveBeenCalledTimes(1) // No retries for logical failure
    })

    it('retries audit step up to 2 times on exception', async () => {
      const singlePhasePlan = {
        phases: [VALID_PHASE_PLAN.phases[0]],
      }
      const planJson = JSON.stringify(singlePhasePlan)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      mockInvoke
        .mockResolvedValueOnce(VALID_ENG_RESULT) // Eng succeeds
        .mockRejectedValueOnce(new Error('Audit crash'))
        .mockRejectedValueOnce(new Error('Audit crash'))
        .mockRejectedValueOnce(new Error('Audit crash')) // Audit fails 3 times

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      expect(output.status).toBe('failed')
      expect(output.failed_phase).toBe(1)
      expect(output.failure_reason).toContain('Audit crash')
      expect(mockInvoke).toHaveBeenCalledTimes(4) // 1 eng + 3 audit attempts (1 initial + 2 retries)
    })

    it('excludes eng files when audit fails after eng succeeds (deferred file tracking)', async () => {
      const singlePhasePlan = {
        phases: [VALID_PHASE_PLAN.phases[0]],
      }
      const planJson = JSON.stringify(singlePhasePlan)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      mockInvoke
        .mockResolvedValueOnce(VALID_ENG_RESULT) // Eng succeeds, modifies files
        .mockRejectedValueOnce(new Error('Audit crash'))
        .mockRejectedValueOnce(new Error('Audit crash'))
        .mockRejectedValueOnce(new Error('Audit crash')) // Audit exhausts retries

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      // Files should NOT be included because audit failed (deferred tracking)
      expect(output.files_changed).toEqual([])
      expect(output.failed_phase).toBe(1)
    })

    it('commits successful phases when later phase fails', async () => {
      const planJson = JSON.stringify(VALID_PHASE_PLAN)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      mockInvoke
        .mockResolvedValueOnce(VALID_ENG_RESULT) // Phase 1 eng succeeds
        .mockResolvedValueOnce(VALID_AUDIT_RESULT) // Phase 1 audit succeeds
        .mockRejectedValueOnce(new Error('Phase 2 crash'))
        .mockRejectedValueOnce(new Error('Phase 2 crash'))
        .mockRejectedValueOnce(new Error('Phase 2 crash')) // Phase 2 eng fails
        .mockResolvedValueOnce(VALID_FINAL_AUDIT_RESULT) // Final audit on phase 1 files
        .mockResolvedValueOnce({ ...VALID_COMMIT_RESULT, files_changed: ['src/schemas.ts'] }) // Commit phase 1 only

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      expect(output.status).toBe('failed') // Overall failed
      expect(output.failed_phase).toBe(2)
      expect(output.phases_completed).toBe(1) // Only phase 1 completed
      expect(output.files_changed).toEqual(['src/schemas.ts']) // Only phase 1 files

      // Verify partial_run flag passed to commit
      const commitCall = mockInvoke.mock.calls.find(
        (call) => call[0] === 'todo_code_writer_commit_step',
      )
      expect(commitCall).toBeDefined()
      const commitInput = commitCall?.[1] as { partial_run?: boolean; failure_context?: string }
      expect(commitInput.partial_run).toBe(true)
      expect(commitInput.failure_context).toContain('Phase 2 crash')
    })

    it('does not commit when phase 1 fails', async () => {
      const planJson = JSON.stringify(VALID_PHASE_PLAN)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      mockInvoke
        .mockRejectedValueOnce(new Error('Phase 1 crash'))
        .mockRejectedValueOnce(new Error('Phase 1 crash'))
        .mockRejectedValueOnce(new Error('Phase 1 crash')) // Phase 1 eng fails

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      expect(output.status).toBe('failed')
      expect(output.failed_phase).toBe(1)
      expect(output.phases_completed).toBe(0)
      expect(output.files_changed).toEqual([])
      // No final audit or commit calls
      expect(mockInvoke).toHaveBeenCalledTimes(3) // Only eng retries
    })

    it('passes partial_run and failure_context to commit step', async () => {
      const planJson = JSON.stringify(VALID_PHASE_PLAN)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      mockInvoke
        .mockResolvedValueOnce(VALID_ENG_RESULT) // Phase 1 succeeds
        .mockResolvedValueOnce(VALID_AUDIT_RESULT)
        .mockResolvedValueOnce({ ...VALID_ENG_RESULT, status: 'failed', summary: 'Build failed' }) // Phase 2 logical failure
        .mockResolvedValueOnce(VALID_FINAL_AUDIT_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT)

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      await todoCodeWriterCapability.processResult(input, aiResult, context)

      const commitCall = mockInvoke.mock.calls.find(
        (call) => call[0] === 'todo_code_writer_commit_step',
      )
      expect(commitCall).toBeDefined()
      const commitInput = commitCall?.[1] as { partial_run?: boolean; failure_context?: string }
      expect(commitInput.partial_run).toBe(true)
      expect(commitInput.failure_context).toBe('Build failed')
    })

    it('reports per-phase status in output phase_results', async () => {
      const planJson = JSON.stringify(VALID_PHASE_PLAN)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      mockInvoke
        .mockResolvedValueOnce(VALID_ENG_RESULT) // Phase 1 succeeds
        .mockResolvedValueOnce(VALID_AUDIT_RESULT)
        .mockRejectedValueOnce(new Error('Phase 2 error'))
        .mockRejectedValueOnce(new Error('Phase 2 error'))
        .mockRejectedValueOnce(new Error('Phase 2 error')) // Phase 2 fails
        .mockResolvedValueOnce(VALID_FINAL_AUDIT_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT)

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      expect(output.phase_results).toHaveLength(2)
      expect(output.phase_results[0]).toMatchObject({
        phase_number: 1,
        eng_status: 'success',
        audit_status: 'pass',
        files_modified: ['src/schemas.ts'],
        retry_attempts: 0,
      })
      expect(output.phase_results[1]).toMatchObject({
        phase_number: 2,
        eng_status: 'failed',
        audit_status: 'skipped',
        files_modified: [],
        retry_attempts: 2, // 2 retries after initial attempt
      })
    })

    it('excludes failed phase files from commit file list', async () => {
      const planJson = JSON.stringify(VALID_PHASE_PLAN)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      mockInvoke
        .mockResolvedValueOnce({ ...VALID_ENG_RESULT, files_modified: ['src/schemas.ts'] })
        .mockResolvedValueOnce(VALID_AUDIT_RESULT)
        .mockResolvedValueOnce({
          ...VALID_ENG_RESULT,
          files_modified: ['src/helpers.ts'],
          status: 'failed',
        })
        .mockResolvedValueOnce(VALID_FINAL_AUDIT_RESULT)
        .mockResolvedValueOnce({ ...VALID_COMMIT_RESULT, files_changed: ['src/schemas.ts'] })

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      // src/helpers.ts should NOT be in files_changed because phase 2 failed
      expect(output.files_changed).toEqual(['src/schemas.ts'])

      // Verify final audit only received successful files
      const finalAuditCall = mockInvoke.mock.calls.find(
        (call) => call[0] === 'todo_code_writer_final_audit_step',
      )
      const finalAuditInput = finalAuditCall?.[1] as { all_modified_files: string[] }
      expect(finalAuditInput.all_modified_files).toEqual(['src/schemas.ts'])
    })

    it('success path unchanged (no retries, no halt fields)', async () => {
      const planJson = JSON.stringify(VALID_PHASE_PLAN)
      const aiContent = `Planner result.\n<phase_plan>${planJson}</phase_plan>`
      const aiResult = createMockAiResult(aiContent)

      mockInvoke
        .mockResolvedValueOnce(VALID_ENG_RESULT) // Phase 1 eng
        .mockResolvedValueOnce(VALID_AUDIT_RESULT) // Phase 1 audit
        .mockResolvedValueOnce({ ...VALID_ENG_RESULT, files_modified: ['src/helpers.ts'] }) // Phase 2 eng
        .mockResolvedValueOnce(VALID_AUDIT_RESULT) // Phase 2 audit
        .mockResolvedValueOnce(VALID_FINAL_AUDIT_RESULT) // Final audit
        .mockResolvedValueOnce(VALID_COMMIT_RESULT) // Commit

      const input: TodoCodeWriterInput = {
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet[1m]',
        max_phases: 5,
      }

      const output = await todoCodeWriterCapability.processResult(input, aiResult, context)

      expect(output.status).toBe('success')
      expect(output.failed_phase).toBe(null)
      expect(output.failure_reason).toBe(null)
      expect(output.phases_completed).toBe(2)

      // Verify commit was called WITHOUT partial_run flag
      const commitCall = mockInvoke.mock.calls.find(
        (call) => call[0] === 'todo_code_writer_commit_step',
      )
      const commitInput = commitCall?.[1] as { partial_run?: boolean; failure_context?: string }
      expect(commitInput.partial_run).toBeUndefined()
      expect(commitInput.failure_context).toBeUndefined()
    })
  })
})
