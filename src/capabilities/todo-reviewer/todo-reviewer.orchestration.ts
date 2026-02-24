/**
 * Orchestration helpers for the todo-reviewer capability.
 *
 * Extracted from todo-reviewer.capability.ts to:
 * - Keep individual files under 300 lines
 * - Enable direct unit testing of pure functions
 * - Separate orchestration logic from capability definition
 *
 * @internal Exported for unit testing and capability reuse
 */

import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type { CapabilityContext } from '../../core/capability-registry/capability-registry.types.js'
import { fileNeedsCommit } from '../../core/utils/index.js'
import {
  parseJsonSafe,
  parseXmlBlock,
  REVIEW_SUMMARY_FALLBACK,
  TDD_SUMMARY_FALLBACK,
} from './todo-reviewer.helpers.js'
import type {
  CommitResult,
  ReviewSummary,
  TddFixStepResult,
  TddScanStepResult,
  TddSummary,
  TodoReviewerInput,
  TodoReviewerOutput,
} from './todo-reviewer.schema.js'
import { ReviewSummarySchema, TddSummarySchema } from './todo-reviewer.schema.js'

// ---------------------------------------------------------------------------
// Mutable state passed between orchestration helpers
// ---------------------------------------------------------------------------

/** Internal state accumulated across iterations. */
export interface IterationState {
  reviewSummary: ReviewSummary
  tddSummary: TddSummary
  tddScanResult: TddScanStepResult | null
  tddFixResult: TddFixStepResult | null
  reviewReport: string
  tddReport: string
  iterationsCompleted: number
  /** Whether spec had changes after last iteration (verified via git diff) */
  specHasChanges: boolean
  /** Whether loop exited early due to no changes */
  exitedEarly: boolean
}

// ---------------------------------------------------------------------------
// Pure helper functions (unit testable)
// ---------------------------------------------------------------------------

/**
 * Parse the initial review summary from the AI query response.
 */
export function parseReviewFromAiContent(content: string, specPath: string): ReviewSummary {
  const reviewXml = parseXmlBlock(content, 'review_summary')
  if (reviewXml) {
    return parseJsonSafe(reviewXml, ReviewSummarySchema, {
      ...REVIEW_SUMMARY_FALLBACK,
      spec_path: specPath,
    })
  }
  return { ...REVIEW_SUMMARY_FALLBACK, spec_path: specPath }
}

/**
 * Validate a raw TDD result against the schema, returning fallback on failure.
 */
export function validateTddResult(raw: unknown): TddSummary {
  const parsed = TddSummarySchema.safeParse(raw)
  return parsed.success ? parsed.data : TDD_SUMMARY_FALLBACK
}

/**
 * Determine final status from review and TDD summaries.
 *
 * TDD failure blocks when:
 * - Legacy tddSummary status is FAIL with meaningful output, OR
 * - New tddScanResult status is FAIL
 *
 * If TDD returned empty/fallback details, it's treated as indeterminate
 * (the TDD step didn't run successfully) and doesn't block.
 */
export function determineStatus(
  reviewSummary: ReviewSummary,
  tddSummary: TddSummary,
  tddScanResult?: TddScanStepResult | null,
): 'success' | 'failed' {
  // Legacy TDD validation check
  const tddIsIndeterminate =
    !tddSummary.details || tddSummary.details === 'Failed to parse TDD validation output'
  const legacyTddBlocks = tddSummary.status === 'FAIL' && !tddIsIndeterminate

  // New TDD scan check (prioritize scan result if available)
  const scanBlocks = tddScanResult ? tddScanResult.status === 'FAIL' : false

  const reviewOk = reviewSummary.status === 'READY' || reviewSummary.status === 'IN_REVIEW'
  return reviewOk && !legacyTddBlocks && !scanBlocks ? 'success' : 'failed'
}

/**
 * Assemble the final TodoReviewerOutput from accumulated state.
 */
export function buildOutput(state: IterationState, commitResult: CommitResult): TodoReviewerOutput {
  // Include scan/fix details in TDD report if available
  let enhancedTddReport = state.tddReport
  if (state.tddScanResult) {
    enhancedTddReport += `\n\n--- TDD Scan Summary ---\n`
    enhancedTddReport += `Status: ${state.tddScanResult.status}\n`
    enhancedTddReport += `Scope: ${state.tddScanResult.scope_analysis.tests_in_scope}/${state.tddScanResult.scope_analysis.tests_defined} in scope\n`
    enhancedTddReport += `Coverage: ${state.tddScanResult.coverage_analysis.fr_ec_with_tests}/${state.tddScanResult.coverage_analysis.fr_ec_total} FR/EC with tests\n`
    enhancedTddReport += `Issues: ${state.tddScanResult.issues.length} found\n`
    if (state.tddFixResult) {
      enhancedTddReport += `\n--- TDD Fix Summary ---\n`
      enhancedTddReport += `Status: ${state.tddFixResult.status}\n`
      enhancedTddReport += `Fixed: ${state.tddFixResult.issues_fixed}/${state.tddScanResult.issues.length}\n`
      enhancedTddReport += state.tddFixResult.fix_summary
    }
  }

  return {
    status: determineStatus(state.reviewSummary, state.tddSummary, state.tddScanResult),
    review_report: state.reviewReport,
    tdd_report: enhancedTddReport,
    iterations_completed: state.iterationsCompleted,
    commit_sha: commitResult?.commit_sha ?? null,
    commit_message: commitResult?.commit_message ?? null,
    files_changed: commitResult?.files_changed ?? [],
  }
}

// ---------------------------------------------------------------------------
// Orchestration helpers (with side effects)
// ---------------------------------------------------------------------------

/**
 * Extract and merge a nested review result into the running state.
 * Cost tracking is handled by framework propagation, not manual extraction.
 */
export function applyNestedReviewResult(
  reviewResult: TodoReviewerOutput,
  iteration: number,
  state: IterationState,
): void {
  if (!reviewResult || typeof reviewResult !== 'object') {
    return
  }
  const nestedReport = 'review_report' in reviewResult ? String(reviewResult.review_report) : ''
  const nestedXml = parseXmlBlock(nestedReport, 'review_summary')
  if (nestedXml) {
    state.reviewSummary = parseJsonSafe(nestedXml, ReviewSummarySchema, state.reviewSummary)
  }
  state.reviewReport += `\n\n--- Iteration ${iteration} ---\n${nestedReport.slice(0, 3000)}`
}

/**
 * Run additional review+TDD iterations (2..N), mutating state in place.
 *
 * Early exit logic:
 * - After each iteration, checks git diff to detect actual file changes
 * - If no changes detected (spec is stable), exits early
 * - If changes detected, continues to next iteration
 *
 * TDD pattern (per iteration):
 * - Run TDD scan step (comprehensive validation)
 * - If scan finds CRITICAL/HIGH issues (needs_fix: true), run TDD fix step
 * - Update state with scan and fix results
 */
export async function runAdditionalIterations(
  input: TodoReviewerInput,
  state: IterationState,
  context: CapabilityContext,
): Promise<void> {
  for (let i = 2; i <= input.iterations; i++) {
    // Check if spec has uncommitted changes before this iteration
    // If no changes from previous iteration, exit early (spec is stable)
    const hasChangesBefore = fileNeedsCommit(input.spec_path, input.cwd)
    if (!hasChangesBefore && i > 2) {
      // No changes after previous iteration = spec stabilized, exit early
      state.exitedEarly = true
      state.reviewReport += `\n\n--- Iteration ${i} skipped: spec stabilized (no changes) ---`
      break
    }

    const reviewResult = (await context.invokeCapability('todo_reviewer', {
      spec_path: input.spec_path,
      model: input.model,
      iterations: 1,
      cwd: input.cwd,
    })) as TodoReviewerOutput

    applyNestedReviewResult(reviewResult, i, state)

    // TDD scan step (NEW - comprehensive validation with Opus)
    const scanResult = (await context.invokeCapability('todo_tdd_scan_step', {
      spec_path: input.spec_path,
      review_summary: state.reviewSummary,
      cwd: input.cwd,
    })) as TddScanStepResult

    state.tddScanResult = scanResult

    // TDD fix step (CONDITIONAL - only if scan found blocking issues)
    if (scanResult.needs_fix) {
      const fixResult = (await context.invokeCapability('todo_tdd_fix_step', {
        spec_path: input.spec_path,
        scan_result: scanResult,
        cwd: input.cwd,
      })) as TddFixStepResult

      state.tddFixResult = fixResult
    } else {
      state.tddFixResult = null
    }

    // Update legacy tddSummary for backward compatibility
    state.tddSummary = {
      status: scanResult.status,
      details: scanResult.details,
      issues_found: scanResult.issues.length,
      spec_modified: scanResult.spec_modified || state.tddFixResult?.spec_modified || false,
    }

    state.tddReport += `\n\n--- Iteration ${i} ---\n${scanResult.details}`
    if (state.tddFixResult) {
      state.tddReport += `\nFix applied: ${state.tddFixResult.fix_summary}`
    }

    state.iterationsCompleted = i

    // Update change status after this iteration
    state.specHasChanges = fileNeedsCommit(input.spec_path, input.cwd)
  }
}

/**
 * Invoke the commit step and return its result.
 */
export async function invokeCommitStep(
  input: TodoReviewerInput,
  state: IterationState,
  context: CapabilityContext,
): Promise<CommitResult> {
  return (await context.invokeCapability('todo_commit_step', {
    spec_path: input.spec_path,
    review_summary: state.reviewSummary,
    tdd_summary: state.tddSummary,
    cwd: input.cwd,
  })) as CommitResult
}

// ---------------------------------------------------------------------------
// Initial state factory
// ---------------------------------------------------------------------------

/**
 * Create initial iteration state from AI result and first TDD validation.
 */
export function createInitialState(
  aiResult: AIQueryResult,
  reviewSummary: ReviewSummary,
  tddSummary: TddSummary,
  hasChangesAfterIter1: boolean,
  tddScanResult?: TddScanStepResult | null,
  tddFixResult?: TddFixStepResult | null,
): IterationState {
  return {
    reviewSummary,
    tddSummary,
    tddScanResult: tddScanResult ?? null,
    tddFixResult: tddFixResult ?? null,
    reviewReport: aiResult.content.slice(0, 5000),
    tddReport: tddSummary.details,
    iterationsCompleted: 1,
    specHasChanges: hasChangesAfterIter1,
    exitedEarly: false,
  }
}
