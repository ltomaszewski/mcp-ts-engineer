/**
 * Error response builder for capability invocations.
 * Extracted from invocation-handler.ts to keep files under 300 lines.
 */

import type { ChildSessionCostEntry } from '../cost/cost-report.schemas.js'
import { extractCauseChain, extractErrorChain } from '../utils/index.js'
import type { CapabilityRegistryDeps } from './capability-registry.js'
import {
  categorizeError,
  extractModelFromCostSummary,
  generateSpecHash,
  sanitizeInput,
} from './invocation-helpers.js'
import type { McpToolResponse } from './invocation-handler.types.js'

/**
 * Build MCP error response from a caught error.
 * Extracts and logs the full error chain including causes.
 */
export async function buildErrorResponse(
  error: unknown,
  capabilityName: string,
  sessionId: string | undefined,
  invocationId: string | undefined,
  deps: CapabilityRegistryDeps,
  rawInput: unknown,
  validatedInput?: unknown,
): Promise<McpToolResponse> {
  const errorMessage = error instanceof Error ? error.message : String(error)
  const errorName = error instanceof Error ? error.constructor.name : 'Error'
  const fullErrorMessage = extractErrorChain(error)
  const causeChain = extractCauseChain(error)

  const errorContext: Record<string, unknown> = {
    capability: capabilityName,
    error: errorMessage,
    errorType: errorName,
    fullError: fullErrorMessage,
    causeChain,
  }

  if (sessionId) errorContext.sid = sessionId
  if (invocationId) errorContext.iid = invocationId

  if (error instanceof Error && error.stack) {
    errorContext.stack = error.stack
  }

  deps.logger.error('Capability invocation failed', errorContext)

  // Write error session to cost report if costs were incurred (non-blocking)
  if (sessionId && (validatedInput || rawInput)) {
    const finalSession = deps.sessionManager.getSession(sessionId)
    if (finalSession) {
      const costSummary = deps.costTracker.getSessionSummary(sessionId)

      if (costSummary.totalCostUsd > 0) {
        const childEntries: ChildSessionCostEntry[] = deps.costTracker
          .getChildCostEntries(sessionId)
          .map((entry) => ({
            sid: entry.childSessionId || entry.sid,
            capability: entry.capabilityName,
            costUsd: entry.costUsd,
            turns: entry.turns || 0,
            inputTokens: entry.inputTokens,
            outputTokens: entry.outputTokens,
            model: entry.model,
            status: entry.status || 'success',
            ...(entry.commitSha ? { commitSha: entry.commitSha } : {}),
            ...(entry.promptCacheWrite !== undefined
              ? { promptCacheWrite: entry.promptCacheWrite }
              : {}),
            ...(entry.promptCacheRead !== undefined
              ? { promptCacheRead: entry.promptCacheRead }
              : {}),
            ...(entry.promptVersion !== undefined ? { promptVersion: entry.promptVersion } : {}),
            ...(entry.totalTokensIn !== undefined ? { totalTokensIn: entry.totalTokensIn } : {}),
            ...(entry.totalTokensOut !== undefined ? { totalTokensOut: entry.totalTokensOut } : {}),
          }))

        deps.costReportWriter
          .writeSessionToReport(
            finalSession,
            costSummary,
            childEntries,
            undefined,
            {
              capability: capabilityName,
              model: extractModelFromCostSummary(costSummary),
              status: 'error',
              input: sanitizeInput(validatedInput || rawInput),
              specHash: generateSpecHash(validatedInput || rawInput),
              errorType: categorizeError(error) as
                | 'validation'
                | 'budget'
                | 'timeout'
                | 'ai_error'
                | 'capability'
                | 'halted'
                | 'unknown',
              errorMessage: errorMessage.slice(0, 1000),
            },
          )
          .catch((reportError) => {
            deps.logger.warn('Failed to write error session to cost report', {
              sid: sessionId,
              error: reportError instanceof Error ? reportError.message : String(reportError),
            })
          })
      }
    }
  }

  const errorResponse: Record<string, unknown> = {
    error: errorName,
    message: errorMessage,
    fullError: fullErrorMessage,
    causeChain,
    session_id: sessionId ?? null,
  }

  if (sessionId) {
    const costSummary = deps.costTracker.getSessionSummary(sessionId)
    errorResponse.cost_usd = costSummary.totalCostUsd
    errorResponse.turns = costSummary.totalTurns
    errorResponse._input_tokens = costSummary.totalInputTokens
    errorResponse._output_tokens = costSummary.totalOutputTokens

    if ((costSummary.totalPromptCacheWrite ?? 0) > 0) {
      errorResponse._cache_creation_input_tokens = costSummary.totalPromptCacheWrite
    }
    if ((costSummary.totalPromptCacheRead ?? 0) > 0) {
      errorResponse._cache_read_input_tokens = costSummary.totalPromptCacheRead
    }

    const modelKeys = Object.keys(costSummary.byModel)
    if (modelKeys.length > 0) {
      errorResponse._model = modelKeys[0]
    }
  }

  return {
    content: [{ type: 'text', text: JSON.stringify(errorResponse) }],
    isError: true,
  }
}
