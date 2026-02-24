/**
 * Todo reviewer orchestrator capability definition.
 * Session 1 is its own AI query (10-phase review).
 * processResult chains Sessions 2 (TDD validate) and 3 (commit) via invokeCapability.
 *
 * Iteration logic:
 * - After each iteration, checks git diff to detect actual file changes
 * - If no changes detected after an iteration, exits early (spec is stable)
 * - If changes detected, continues to next iteration
 * - Commits once after the final iteration (or early exit)
 *
 * Note: Orchestration helpers are extracted to todo-reviewer.orchestration.ts
 * to keep this file under 300 lines. See that module for pure helper functions.
 */

import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import { fileNeedsCommit } from '../../core/utils/index.js'
import { validateAndCorrectSpecPaths } from '../../core/utils/spec-path-utils/spec-path-orchestration.js'
import { REVIEW_CURRENT_VERSION, REVIEW_PROMPT_VERSIONS } from './prompts/index.js'
import type { IterationState } from './todo-reviewer.orchestration.js'
// Import orchestration helpers from extracted module
import {
  buildOutput,
  createInitialState,
  invokeCommitStep,
  parseReviewFromAiContent,
  runAdditionalIterations,
  validateTddResult,
} from './todo-reviewer.orchestration.js'
import type {
  TddFixStepResult,
  TddScanStepResult,
  TddSummary,
  TodoReviewerInput,
  TodoReviewerOutput,
} from './todo-reviewer.schema.js'
import { TodoReviewerInputSchema } from './todo-reviewer.schema.js'

// Re-export for backward compatibility
export { ValidationError } from '../../core/errors.js'
export { parseJsonSafe, parseXmlBlock } from './todo-reviewer.helpers.js'

// ---------------------------------------------------------------------------
// Orchestrator capability
// ---------------------------------------------------------------------------

/**
 * Main todo_reviewer orchestrator capability.
 *
 * The AI query IS Session 1 (10-phase review). processResult then orchestrates:
 * - Iteration loop: Review -> TDD Validate (1..N times, all iterations execute)
 * - Session 3: Commit (once, after all iterations)
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. Sub-agents require unrestricted tool access to read/write
 * spec files and run git operations. This is safe because input is validated via Zod schema
 * and the capability is invoked only through the MCP server's authenticated channel.
 */
export const todoReviewerCapability: CapabilityDefinition<TodoReviewerInput, TodoReviewerOutput> = {
  id: 'todo_reviewer',
  type: 'tool',
  name: 'Todo Reviewer',
  description:
    'Reviews and validates todo spec files using iterative review-validate cycles: ' +
    '(1) architecture review with 10-phase analysis, (2) TDD coverage validation, ' +
    'repeated 1-10 times (configurable, default 3), then (3) conditional auto-commit. ' +
    'Each session gets a fresh context window. Exits early if no changes detected ' +
    '(spec stabilized). Commits once after final iteration if changes were made. ' +
    'Returns structured report with findings, iteration count, and commit info.',
  inputSchema: TodoReviewerInputSchema,
  promptRegistry: REVIEW_PROMPT_VERSIONS,
  currentPromptVersion: REVIEW_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 80,
    maxBudgetUsd: 5.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
  },

  preparePromptInput: (input: TodoReviewerInput, _context) => ({
    specPath: input.spec_path,
    cwd: input.cwd,
  }),

  processResult: async (
    input: TodoReviewerInput,
    aiResult: AIQueryResult,
    context: CapabilityContext,
  ): Promise<TodoReviewerOutput> => {
    // --- Iteration 1: Parse review + validate paths + TDD scan→fix ---
    const reviewSummary = parseReviewFromAiContent(aiResult.content, input.spec_path)

    // Validate and correct file paths in the spec (async 3-tier strategy)
    await validateAndCorrectSpecPaths(input.spec_path, reviewSummary.target_app, context, input.cwd)

    // TDD scan step (NEW - comprehensive validation with Opus)
    const scanResult = (await context.invokeCapability('todo_tdd_scan_step', {
      spec_path: input.spec_path,
      review_summary: reviewSummary,
      cwd: input.cwd,
    })) as TddScanStepResult

    // TDD fix step (CONDITIONAL - only if scan found blocking issues)
    let fixResult: TddFixStepResult | null = null
    if (scanResult.needs_fix) {
      fixResult = (await context.invokeCapability('todo_tdd_fix_step', {
        spec_path: input.spec_path,
        scan_result: scanResult,
        cwd: input.cwd,
      })) as TddFixStepResult
    }

    // Create legacy tddSummary for backward compatibility
    const tddSummary: TddSummary = {
      status: scanResult.status,
      details: scanResult.details,
      issues_found: scanResult.issues.length,
      spec_modified: scanResult.spec_modified || fixResult?.spec_modified || false,
    }

    // Check if iteration 1 made any changes to the spec file
    const hasChangesAfterIter1 = fileNeedsCommit(input.spec_path, input.cwd)

    const state: IterationState = createInitialState(
      aiResult,
      reviewSummary,
      validateTddResult(tddSummary),
      hasChangesAfterIter1,
      scanResult,
      fixResult,
    )

    // Early exit: if iteration 1 made no changes and multiple iterations requested,
    // skip remaining iterations (spec is already stable)
    if (!hasChangesAfterIter1 && input.iterations > 1) {
      state.exitedEarly = true
      state.reviewReport +=
        '\n\n--- Iterations 2+ skipped: spec already stable (no changes from iteration 1) ---'
    }

    // --- Iterations 2..N (skip if early exit triggered) ---
    if (!state.exitedEarly) {
      await runAdditionalIterations(input, state, context)
    }

    // --- Commit + build output ---
    const commitResult = await invokeCommitStep(input, state, context)

    return buildOutput(state, commitResult)
  },
}
