/**
 * Invocation handler — orchestrates the full lifecycle of a capability invocation:
 * validation → session → AI query → cost tracking → response.
 *
 * Finalize logic lives in invocation-handler.finalize.ts.
 * Error response logic lives in invocation-handler.error.ts.
 */

import { INVOCATION_HARD_TIMEOUT_MS, MAX_DAILY_BUDGET_USD } from '../../config/constants.js'
import type { AIModel, AIQueryResult } from '../ai-provider/ai-provider.types.js'
import type { CostEntry } from '../cost/cost.types.js'
import {
  AIProviderError,
  CapabilityError,
  ServerShuttingDownError,
  ValidationError,
} from '../errors.js'
import type { CapabilityRegistryDeps } from './capability-registry.js'
import type { CapabilityContext, CapabilityDefinition } from './capability-registry.types.js'
import { createCapabilityContext } from './context-builder.js'
import { buildErrorResponse } from './invocation-handler.error.js'
import { finalizeInvocation } from './invocation-handler.finalize.js'
import type { McpToolResponse } from './invocation-handler.types.js'
import { mergeAndValidateAIQueryRequest } from './request-validation.js'

// Re-export McpToolResponse so existing imports continue to work
export type { McpToolResponse }

/**
 * Handle capability invocation with full lifecycle orchestration.
 *
 * @param capabilityName - Name of the capability to invoke
 * @param rawInput - Raw input from MCP client
 * @param capabilities - Map of registered capabilities
 * @param deps - Framework dependencies
 * @param isShuttingDown - Whether the server is shutting down
 * @param selfInvoke - Callback for nested child capability invocations
 * @returns MCP response with result or error
 */
export async function handleCapabilityInvocation(
  capabilityName: string,
  rawInput: unknown,
  capabilities: Map<string, CapabilityDefinition>,
  deps: CapabilityRegistryDeps,
  isShuttingDown: boolean,
  selfInvoke: (name: string, input: unknown) => Promise<McpToolResponse>,
): Promise<McpToolResponse> {
  let sessionId: string | undefined
  let invocationId: string | undefined
  let validatedInput: unknown | undefined

  try {
    // 1. Get capability definition
    const capability = capabilities.get(capabilityName)
    if (!capability) {
      throw new CapabilityError(`Capability ${capabilityName} not found`)
    }

    // 2. Validate input with Zod BEFORE creating session
    const validationResult = capability.inputSchema.safeParse(rawInput)
    if (!validationResult.success) {
      throw new ValidationError(`Input validation failed: ${validationResult.error.message}`, {
        cause: validationResult.error,
      })
    }
    validatedInput = validationResult.data

    // 3. Check if server is shutting down
    if (isShuttingDown) {
      return ServerShuttingDownError.toMcpResponse()
    }

    // 4. Check daily budget
    const dailyTotal = await deps.costReportWriter.getDailyTotalCost()
    if (dailyTotal >= MAX_DAILY_BUDGET_USD) {
      throw new CapabilityError(
        `Daily budget limit exceeded: ${dailyTotal.toFixed(2)} >= ${MAX_DAILY_BUDGET_USD}`,
      )
    }

    // 5. Create session
    const session = deps.sessionManager.createSession(capabilityName)
    sessionId = session.id

    // 6. Open per-session log file
    await deps.diskWriter.openSession(session.id)

    // 7. Start invocation
    invocationId = deps.sessionManager.startInvocation(session.id, capabilityName)

    const invocationLogger = deps.logger.withContext({
      sid: session.id,
      capability: capabilityName,
      iid: invocationId,
    })

    invocationLogger.info('Capability invocation started', {
      promptVersion: capability.currentPromptVersion,
    })

    try {
      // 8. Create context, execute, finalize
      const context = createCapabilityContext(
        session.id,
        invocationId,
        capability,
        deps,
        selfInvoke,
      )
      const { costEntry, ...result } = await executeCapability(
        capability,
        validatedInput,
        context,
        capabilityName,
        deps,
      )
      return await finalizeInvocation(
        session.id,
        invocationId,
        capabilityName,
        result,
        costEntry,
        deps,
        invocationLogger,
        validatedInput,
        capability.currentPromptVersion,
      )
    } catch (error) {
      if (sessionId) {
        deps.sessionManager.closeSession(sessionId)
        await deps.diskWriter.closeSession(sessionId)
      }
      throw error
    }
  } catch (error) {
    return await buildErrorResponse(
      error,
      capabilityName,
      sessionId,
      invocationId,
      deps,
      rawInput,
      validatedInput,
    )
  }
}

/**
 * Execute the AI query for a capability with hard timeout protection.
 * Defense-in-depth: even if the provider's watchdog fails, this kills the invocation.
 */
async function executeCapability(
  capability: CapabilityDefinition,
  validatedInput: unknown,
  context: CapabilityContext,
  capabilityName: string,
  deps: CapabilityRegistryDeps,
): Promise<{ output: unknown; aiResult: AIQueryResult; costEntry: CostEntry }> {
  const promptInput = capability.preparePromptInput(validatedInput, context)

  const promptVersion = deps.promptLoader.getPrompt(capabilityName, capability.currentPromptVersion)
  const builtPrompt = promptVersion.build(promptInput)

  const mergedRequest = mergeAndValidateAIQueryRequest(capability, builtPrompt, validatedInput)

  const aiResult = await Promise.race([
    deps.aiProvider.query(mergedRequest),
    rejectAfterTimeout(
      INVOCATION_HARD_TIMEOUT_MS,
      `Capability ${capabilityName} exceeded ${INVOCATION_HARD_TIMEOUT_MS}ms hard timeout`,
    ),
  ])

  const costEntry = buildCostEntry(context.session.id, context.invocation.id, aiResult)
  deps.costTracker.recordCost(context.session.id, context.invocation.id, capabilityName, costEntry)

  const output = await capability.processResult(validatedInput, aiResult, context)

  return { output, aiResult, costEntry }
}

/**
 * Returns a promise that rejects after the given timeout.
 * Used with Promise.race as a hard timeout for capability execution.
 */
function rejectAfterTimeout(ms: number, message: string): Promise<never> {
  return new Promise((_, reject) => {
    setTimeout(() => reject(new AIProviderError(message)), ms)
  })
}

/**
 * Build a cost entry from AI result.
 * @internal
 */
function buildCostEntry(
  sessionId: string,
  invocationId: string,
  aiResult: AIQueryResult,
): import('../cost/cost.types.js').CostEntry {
  const entry: import('../cost/cost.types.js').CostEntry = {
    id: `cost_${invocationId}`,
    sid: sessionId,
    model: (aiResult.model || 'haiku') as AIModel,
    inputTokens: aiResult.usage.inputTokens,
    outputTokens: aiResult.usage.outputTokens,
    costUsd: aiResult.costUsd,
    timestamp: new Date().toISOString(),
    turns: aiResult.turns,
  }

  if (aiResult.usage.promptCacheWrite !== undefined) {
    entry.promptCacheWrite = aiResult.usage.promptCacheWrite
  }
  if (aiResult.usage.promptCacheRead !== undefined) {
    entry.promptCacheRead = aiResult.usage.promptCacheRead
  }

  return entry
}
