/**
 * Capability context builder — extracted from invocation-handler.
 * Constructs CapabilityContext with all dependencies and utilities.
 */

import { z } from 'zod'
import type { AIModel } from '../ai-provider/ai-provider.types.js'
import { CapabilityError } from '../errors.js'
import { parseJsonSafe } from '../utils/index.js'
import type { CapabilityRegistryDeps } from './capability-registry.js'
import type { CapabilityContext, CapabilityDefinition } from './capability-registry.types.js'
import type { McpToolResponse } from './invocation-handler.js'

/**
 * Creates a logger proxy with bound session/invocation context.
 *
 * @param baseLogger - Logger instance with withContext already applied
 * @returns Logger proxy with info, debug, error, warn methods
 */
function createLoggerProxy(
  baseLogger: ReturnType<typeof import('../logger/index.js').Logger.prototype.withContext>,
): CapabilityContext['logger'] {
  return {
    info: (msg, ctx) => baseLogger.info(msg, ctx),
    debug: (msg, ctx) => baseLogger.debug(msg, ctx),
    error: (msg, ctx) => baseLogger.error(msg, ctx),
    warn: (msg, ctx) => baseLogger.warn(msg, ctx),
  }
}

/**
 * Creates a session cost getter function.
 *
 * @param costTracker - Cost tracker instance
 * @param sessionId - Session identifier
 * @returns Function that returns current session cost summary
 */
function createSessionCostGetter(
  costTracker: CapabilityRegistryDeps['costTracker'],
  sessionId: string,
): () => {
  totalCostUsd: number
  totalInputTokens: number
  totalOutputTokens: number
  totalTurns: number
} {
  return () => {
    const summary = costTracker.getSessionSummary(sessionId)
    return {
      totalCostUsd: summary.totalCostUsd,
      totalInputTokens: summary.totalInputTokens,
      totalOutputTokens: summary.totalOutputTokens,
      totalTurns: summary.totalTurns,
    }
  }
}

/**
 * Propagates child capability costs to the parent session.
 * Extracts cost metadata from child result and records it in parent's cost tracker.
 *
 * @param parsed - Parsed JSON result from child capability
 * @param sessionId - Parent session ID
 * @param invocationId - Parent invocation ID
 * @param childCapabilityName - Name of child capability
 * @param deps - Registry dependencies (costTracker, sessionManager)
 */
function propagateChildCost(
  parsed: unknown,
  sessionId: string,
  invocationId: string,
  childCapabilityName: string,
  deps: CapabilityRegistryDeps,
): void {
  if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
    const childSessionId = (parsed as Record<string, unknown>).session_id
    const costUsd = (parsed as Record<string, unknown>).cost_usd
    const turns = (parsed as Record<string, unknown>).turns
    const inputTokens = (parsed as Record<string, unknown>)._input_tokens
    const outputTokens = (parsed as Record<string, unknown>)._output_tokens
    const model = (parsed as Record<string, unknown>)._model
    const commitSha = (parsed as Record<string, unknown>).commit_sha
    const isError = (parsed as Record<string, unknown>).error !== undefined

    // Extract cache metrics and prompt version from child output
    const cacheWrite = (parsed as Record<string, unknown>)._cache_creation_input_tokens
    const cacheRead = (parsed as Record<string, unknown>)._cache_read_input_tokens
    const promptVer = (parsed as Record<string, unknown>)._prompt_version

    // Calculate total token fields
    const totalTokensIn =
      typeof inputTokens === 'number' && typeof cacheRead === 'number'
        ? inputTokens + cacheRead
        : typeof inputTokens === 'number'
          ? inputTokens
          : undefined
    const totalTokensOut = typeof outputTokens === 'number' ? outputTokens : undefined

    // Propagate child cost to parent session if metadata exists
    if (
      typeof childSessionId === 'string' &&
      typeof costUsd === 'number' &&
      typeof inputTokens === 'number' &&
      typeof outputTokens === 'number'
    ) {
      // Record child cost in parent's cost tracker
      deps.costTracker.recordChildCost(sessionId, invocationId, childCapabilityName, {
        id: `cost_child_${childSessionId}`,
        sid: sessionId,
        model: (typeof model === 'string' ? model : 'claude-3-5-sonnet-20241022') as AIModel,
        inputTokens,
        outputTokens,
        costUsd,
        timestamp: new Date().toISOString(),
        childSessionId,
        turns: typeof turns === 'number' ? turns : undefined,
        commitSha: typeof commitSha === 'string' ? commitSha : undefined,
        status: isError ? 'error' : 'success',
        ...(typeof cacheWrite === 'number' && cacheWrite > 0
          ? { promptCacheWrite: cacheWrite }
          : {}),
        ...(typeof cacheRead === 'number' && cacheRead > 0 ? { promptCacheRead: cacheRead } : {}),
        ...(typeof promptVer === 'string' && promptVer.length > 0
          ? { promptVersion: promptVer }
          : {}),
        ...(totalTokensIn !== undefined ? { totalTokensIn } : {}),
        ...(totalTokensOut !== undefined ? { totalTokensOut } : {}),
      })

      // Propagate to parent session totals
      deps.sessionManager.propagateChildCost(sessionId, {
        costUsd,
        inputTokens,
        outputTokens,
      })
    }
  }
}

/**
 * Create CapabilityContext for a capability invocation.
 */
export function createCapabilityContext(
  sessionId: string,
  invocationId: string,
  capability: CapabilityDefinition,
  deps: CapabilityRegistryDeps,
  selfInvoke: (name: string, input: unknown) => Promise<McpToolResponse>,
): CapabilityContext {
  const session = deps.sessionManager.getSession(sessionId)
  if (!session) {
    throw new CapabilityError(`Session ${sessionId} not found`)
  }

  let invocation = session.invocations.find((inv) => inv.id === invocationId)
  if (!invocation) {
    invocation = {
      id: invocationId,
      capability: capability.id,
      input: {},
      timestamp: new Date().toISOString(),
    }
  }

  const contextLogger = deps.logger.withContext({
    sid: sessionId,
    iid: invocationId,
    capability: capability.id,
  })

  return {
    session,
    invocation,
    logger: createLoggerProxy(contextLogger),
    getSessionCost: createSessionCostGetter(deps.costTracker, sessionId),
    promptVersion: capability.currentPromptVersion,
    providerName: 'ClaudeProvider',
    invokeCapability: async (childCapabilityName, input) => {
      const childResult = await selfInvoke(childCapabilityName, input)

      // Safe JSON parsing with validation (works for both success and error responses)
      const resultText = childResult.content[0]?.text || '{}'
      const parsed = parseJsonSafe(resultText, z.unknown(), {})

      // Extract child cost metadata from MCP response (even for failed invocations)
      propagateChildCost(parsed, sessionId, invocationId, childCapabilityName, deps)

      // After propagating cost, throw error if child failed
      if (childResult.isError) {
        throw new CapabilityError(
          `Child capability ${childCapabilityName} failed: ${childResult.content[0]?.text}`,
        )
      }

      return parsed
    },
  }
}
