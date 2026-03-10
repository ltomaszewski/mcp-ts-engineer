/**
 * Finalize invocation — success path for capability invocations.
 * Extracted from invocation-handler.ts to keep files under 300 lines.
 */

import type { AIQueryResult } from '../ai-provider/ai-provider.types.js'
import type { ChildSessionCostEntry } from '../cost/cost-report.schemas.js'
import type { CostEntry } from '../cost/cost.types.js'
import { extractErrorChain } from '../utils/index.js'
import type { CapabilityRegistryDeps } from './capability-registry.js'
import { generateSpecHash, sanitizeInput } from './invocation-helpers.js'
import type { McpToolResponse } from './invocation-handler.types.js'

/**
 * Finalize a successful invocation: record cost, close session, write report.
 */
export async function finalizeInvocation(
  sessionId: string,
  invocationId: string,
  capabilityName: string,
  result: { output: unknown; aiResult: AIQueryResult },
  costEntry: CostEntry,
  deps: CapabilityRegistryDeps,
  invocationLogger: ReturnType<CapabilityRegistryDeps['logger']['withContext']>,
  validatedInput: unknown,
  promptVersion?: string,
): Promise<McpToolResponse> {
  const { output, aiResult } = result

  invocationLogger.info('AI query completed', {
    model: aiResult.model || 'unknown',
    inputTokens: aiResult.usage.inputTokens,
    outputTokens: aiResult.usage.outputTokens,
    costUsd: aiResult.costUsd,
    turns: aiResult.turns,
    durationMs: aiResult.trace?.durationMs,
    terminationReason: aiResult.terminationReason,
    hasTrace: !!aiResult.trace,
  })

  if (aiResult.trace) {
    invocationLogger.debug('ai.execution_trace', { trace: aiResult.trace })
  }

  const costSummary = deps.costTracker.getSessionSummary(sessionId)
  deps.sessionManager.completeInvocation(sessionId, invocationId, output, costEntry)

  invocationLogger.info('Capability invocation completed', {
    status: 'success',
    totalCostUsd: costSummary.totalCostUsd,
    totalInputTokens: costSummary.totalInputTokens,
    totalOutputTokens: costSummary.totalOutputTokens,
  })

  await deps.diskWriter.flush()
  deps.sessionManager.closeSession(sessionId)
  await deps.diskWriter.closeSession(sessionId)

  // Write cost report (non-fatal)
  try {
    const finalSession = deps.sessionManager.getSession(sessionId)
    if (finalSession) {
      const commitSha = (output as Record<string, unknown>)?.commit_sha as string | null | undefined

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
      await deps.costReportWriter.writeSessionToReport(
        finalSession,
        costSummary,
        childEntries,
        commitSha ?? undefined,
        {
          capability: capabilityName,
          model: aiResult.model || 'unknown',
          status: 'success',
          input: sanitizeInput(validatedInput),
          specHash: generateSpecHash(validatedInput),
        },
      )
    }
  } catch (error) {
    deps.logger.error('Failed to write cost report (non-fatal)', {
      error: error instanceof Error ? error.message : String(error),
      fullError: extractErrorChain(error),
      sid: sessionId,
    })
  }

  const outputWithSessionId = {
    ...(output as Record<string, unknown>),
    session_id: sessionId,
    cost_usd: costSummary.totalCostUsd,
    turns: costSummary.totalTurns,
    _input_tokens: costSummary.totalInputTokens,
    _output_tokens: costSummary.totalOutputTokens,
    _model: aiResult.model,
    ...((costSummary.totalPromptCacheWrite ?? 0) > 0
      ? { _cache_creation_input_tokens: costSummary.totalPromptCacheWrite }
      : {}),
    ...((costSummary.totalPromptCacheRead ?? 0) > 0
      ? { _cache_read_input_tokens: costSummary.totalPromptCacheRead }
      : {}),
    ...(promptVersion ? { _prompt_version: promptVersion } : {}),
  }
  return {
    content: [{ type: 'text', text: JSON.stringify(outputWithSessionId) }],
  }
}
