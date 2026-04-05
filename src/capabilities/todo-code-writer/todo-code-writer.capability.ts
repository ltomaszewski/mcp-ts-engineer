/**
 * Todo code writer orchestrator capability definition.
 * Planner session is its own AI query (embedded in orchestrator).
 * processResult chains phase execution loop (eng + audit per phase), final audit, and commit.
 */

import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import { updateSpecStatus } from '../../core/utils/index.js'
import {
  buildOutput,
  invokeCommitStep,
  invokeFinalAudit,
  parsePhasePlanFromAiContent,
  runPhaseLoop,
} from './orchestration/index.js'
import { PLANNER_CURRENT_VERSION, PLANNER_PROMPT_VERSIONS } from './prompts/index.js'
import type { TodoCodeWriterInput, TodoCodeWriterOutput } from './todo-code-writer.schema.js'
import { TodoCodeWriterInputSchema } from './todo-code-writer.schema.js'

// Re-export helpers so existing imports from this file still work
export { parseJsonSafe, parseXmlBlock } from './todo-code-writer.helpers.js'

/**
 * Main todo_code_writer orchestrator capability.
 *
 * The AI query IS the planner session. processResult then orchestrates:
 * - Parse phase plan from planner output
 * - For each phase: engineering step → audit step
 * - Final audit on all modified files
 * - Commit step to commit all changes
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. Sub-agents require unrestricted tool access to implement
 * code, run tests, and commit changes. This is safe because input is validated via Zod
 * schema and the capability is invoked only through the MCP server's authenticated channel.
 */
export const todoCodeWriterCapability: CapabilityDefinition<
  TodoCodeWriterInput,
  TodoCodeWriterOutput
> = {
  id: 'todo_code_writer',
  type: 'tool',
  name: 'Todo Code Writer',
  description:
    'Orchestrates autonomous implementation of todo specs through sequential phase execution. ' +
    'Reads spec, splits into phases via planner, executes each phase with engineering and ' +
    'audit steps, runs final repository-wide audit, and commits all changes atomically. ' +
    'Uses fresh context per step for quality. Returns status, audit results, and commit info.',
  inputSchema: TodoCodeWriterInputSchema,
  promptRegistry: PLANNER_PROMPT_VERSIONS,
  currentPromptVersion: PLANNER_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 100,
    maxBudgetUsd: 5.0,
    maxThinkingTokens: 8000,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
  },

  preparePromptInput: (input: TodoCodeWriterInput, _context) => ({
    specPath: input.spec_path,
    maxPhases: input.max_phases,
    cwd: input.cwd,
  }),

  processResult: async (
    input: TodoCodeWriterInput,
    aiResult: AIQueryResult,
    context: CapabilityContext,
  ): Promise<TodoCodeWriterOutput> => {
    // --- Step 1: Parse phase plan from planner output ---
    const phasePlan = parsePhasePlanFromAiContent(aiResult.content)

    // If no phases, skip phase loop but still run final audit and commit
    if (phasePlan.phases.length === 0) {
      const finalAuditResult = await invokeFinalAudit(input, [], context)
      const commitResult = await invokeCommitStep(input, [], [], finalAuditResult.summary, context)

      return buildOutput(0, finalAuditResult, commitResult, [], null, null)
    }

    // --- Step 2: Run phase execution loop with retry and halt logic ---
    const { phaseStatuses, allModifiedFiles, phaseSummaries, halted, failedPhase, failureReason } =
      await runPhaseLoop(input, phasePlan, context)

    // --- Step 3: Handle halted state ---
    if (halted && allModifiedFiles.length === 0) {
      // No successful files - skip commit, return failed status
      return buildOutput(
        0,
        { status: 'fail', issues_found: 0, summary: 'No phases completed successfully' },
        { committed: false, commit_sha: null, commit_message: null, files_changed: [] },
        phaseStatuses,
        failedPhase,
        failureReason,
      )
    }

    // --- Step 4: Run final audit (on successful files or all if not halted) ---
    const finalAuditResult = await invokeFinalAudit(input, allModifiedFiles, context)

    // --- Step 4.5: Mark spec as READY (implementation complete) ---
    if (!halted) {
      try {
        const specUpdated = await updateSpecStatus(input.spec_path, 'IN_REVIEW', 'READY', input.cwd)
        if (specUpdated && !allModifiedFiles.includes(input.spec_path)) {
          allModifiedFiles.push(input.spec_path)
        }
      } catch (error) {
        context.logger.warn(`Failed to update spec status: ${error}`)
      }
    }

    // --- Step 5: Run commit step ---
    const commitResult = halted
      ? await invokeCommitStep(
          input,
          allModifiedFiles,
          phaseSummaries,
          finalAuditResult.summary,
          context,
          {
            partial_run: true,
            failure_context: failureReason || 'Unknown failure',
          },
        )
      : await invokeCommitStep(
          input,
          allModifiedFiles,
          phaseSummaries,
          finalAuditResult.summary,
          context,
        )

    // --- Step 6: Build and return final output ---
    const phasesCompleted = phaseStatuses.filter(
      (ps) => ps.eng_status === 'success' && ps.audit_status !== 'skipped',
    ).length

    return buildOutput(
      phasesCompleted,
      finalAuditResult,
      commitResult,
      phaseStatuses,
      failedPhase,
      failureReason,
    )
  },
}
