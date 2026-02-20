/**
 * Invocation handler — extracted from CapabilityRegistry.
 * Orchestrates the full lifecycle of a capability invocation:
 * validation → session → AI query → cost tracking → response.
 */

import type {
  CapabilityDefinition,
  CapabilityContext,
} from "./capability-registry.types.js";
import type { AIQueryResult, AIModel } from "../ai-provider/ai-provider.types.js";
import type { CapabilityRegistryDeps } from "./capability-registry.js";
import {
  CapabilityError,
  ValidationError,
  ServerShuttingDownError,
} from "../errors.js";
import { mergeAndValidateAIQueryRequest } from "./request-validation.js";
import { createCapabilityContext } from "./context-builder.js";
import { MAX_DAILY_BUDGET_USD } from "../../config/constants.js";
import { extractErrorChain, extractCauseChain } from "../utils/index.js";
import type { ChildSessionCostEntry } from "../cost/cost-report.schemas.js";
import type { CostEntry } from "../cost/cost.types.js";
import {
  generateSpecHash,
  sanitizeInput,
  categorizeError,
  extractModelFromCostSummary,
} from "./invocation-helpers.js";

/** MCP tool response shape */
export type McpToolResponse = {
  content: Array<{ type: "text"; text: string }>;
  isError?: boolean;
};

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
  selfInvoke: (name: string, input: unknown) => Promise<McpToolResponse>
): Promise<McpToolResponse> {
  let sessionId: string | undefined;
  let invocationId: string | undefined;
  let validatedInput: unknown | undefined;

  try {
    // 1. Get capability definition
    const capability = capabilities.get(capabilityName);
    if (!capability) {
      throw new CapabilityError(`Capability ${capabilityName} not found`);
    }

    // 2. Validate input with Zod BEFORE creating session
    const validationResult = capability.inputSchema.safeParse(rawInput);
    if (!validationResult.success) {
      throw new ValidationError(
        `Input validation failed: ${validationResult.error.message}`,
        { cause: validationResult.error }
      );
    }
    validatedInput = validationResult.data;

    // 3. Check if server is shutting down
    if (isShuttingDown) {
      return ServerShuttingDownError.toMcpResponse();
    }

    // 4. Check daily budget
    const dailyTotal = await deps.costReportWriter.getDailyTotalCost();
    if (dailyTotal >= MAX_DAILY_BUDGET_USD) {
      throw new CapabilityError(
        `Daily budget limit exceeded: ${dailyTotal.toFixed(2)} >= ${MAX_DAILY_BUDGET_USD}`
      );
    }

    // 5. Create session
    const session = deps.sessionManager.createSession(capabilityName);
    sessionId = session.id;

    // 6. Open per-session log file
    await deps.diskWriter.openSession(session.id);

    // 7. Start invocation
    invocationId = deps.sessionManager.startInvocation(session.id, capabilityName);

    const invocationLogger = deps.logger.withContext({
      sid: session.id,
      capability: capabilityName,
      iid: invocationId,
    });

    invocationLogger.info("Capability invocation started", {
      promptVersion: capability.currentPromptVersion,
    });

    try {
      // 8. Create context, execute, finalize
      const context = createCapabilityContext(
        session.id, invocationId, capability, deps, selfInvoke
      );
      const { costEntry, ...result } = await executeCapability(
        capability, validatedInput, context, capabilityName, deps
      );
      return await finalizeInvocation(
        session.id, invocationId, capabilityName, result, costEntry, deps, invocationLogger, validatedInput, capability.currentPromptVersion
      );
    } catch (error) {
      if (sessionId) {
        deps.sessionManager.closeSession(sessionId);
        await deps.diskWriter.closeSession(sessionId);
      }
      throw error;
    }
  } catch (error) {
    return await buildErrorResponse(error, capabilityName, sessionId, invocationId, deps, rawInput, validatedInput);
  }
}


/**
 * Execute the AI query for a capability.
 */
async function executeCapability(
  capability: CapabilityDefinition,
  validatedInput: unknown,
  context: CapabilityContext,
  capabilityName: string,
  deps: CapabilityRegistryDeps
): Promise<{ output: unknown; aiResult: AIQueryResult; costEntry: CostEntry }> {
  const promptInput = capability.preparePromptInput(validatedInput, context);

  const promptVersion = deps.promptLoader.getPrompt(
    capabilityName,
    capability.currentPromptVersion
  );
  const builtPrompt = promptVersion.build(promptInput);

  const mergedRequest = mergeAndValidateAIQueryRequest(
    capability, builtPrompt, validatedInput
  );

  const aiResult = await deps.aiProvider.query(mergedRequest);

  // Record cost immediately after AI query (before processResult which may throw)
  // This ensures costs are tracked even if processResult fails
  const costEntry = buildCostEntry(context.session.id, context.invocation.id, aiResult);
  deps.costTracker.recordCost(
    context.session.id,
    context.invocation.id,
    capabilityName,
    costEntry
  );

  const output = await capability.processResult(validatedInput, aiResult, context);

  return { output, aiResult, costEntry };
}

/**
 * Finalize a successful invocation: record cost, close session, write report.
 */
async function finalizeInvocation(
  sessionId: string,
  invocationId: string,
  capabilityName: string,
  result: { output: unknown; aiResult: AIQueryResult },
  costEntry: CostEntry,
  deps: CapabilityRegistryDeps,
  invocationLogger: ReturnType<CapabilityRegistryDeps["logger"]["withContext"]>,
  validatedInput: unknown,
  promptVersion?: string
): Promise<McpToolResponse> {
  const { output, aiResult } = result;

  invocationLogger.info("AI query completed", {
    model: aiResult.model || "unknown",
    inputTokens: aiResult.usage.inputTokens,
    outputTokens: aiResult.usage.outputTokens,
    costUsd: aiResult.costUsd,
    turns: aiResult.turns,
    durationMs: aiResult.trace?.durationMs,
    terminationReason: aiResult.terminationReason,
    hasTrace: !!aiResult.trace,
  });

  if (aiResult.trace) {
    invocationLogger.debug("ai.execution_trace", { trace: aiResult.trace });
  }

  // Cost was already recorded in executeCapability (before processResult)
  // Complete invocation
  const costSummary = deps.costTracker.getSessionSummary(sessionId);
  deps.sessionManager.completeInvocation(sessionId, invocationId, output, costEntry);

  invocationLogger.info("Capability invocation completed", {
    status: "success",
    totalCostUsd: costSummary.totalCostUsd,
    totalInputTokens: costSummary.totalInputTokens,
    totalOutputTokens: costSummary.totalOutputTokens,
  });

  await deps.diskWriter.flush();
  deps.sessionManager.closeSession(sessionId);
  await deps.diskWriter.closeSession(sessionId);

  // Write cost report (non-fatal)
  try {
    const finalSession = deps.sessionManager.getSession(sessionId);
    if (finalSession) {
      // Extract commit_sha from output if present
      const commitSha = (output as Record<string, unknown>)?.commit_sha as string | null | undefined;

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
          status: entry.status || "success",
          ...(entry.commitSha ? { commitSha: entry.commitSha } : {}),
          // NEW: Cache metrics for child entries (AC-9, AC-2)
          ...(entry.promptCacheWrite !== undefined ? { promptCacheWrite: entry.promptCacheWrite } : {}),
          ...(entry.promptCacheRead !== undefined ? { promptCacheRead: entry.promptCacheRead } : {}),
          // NEW: Prompt version propagation (AC-3, AC-5)
          ...(entry.promptVersion !== undefined ? { promptVersion: entry.promptVersion } : {}),
          // NEW: Total token fields (AC-10, AC-11)
          ...(entry.totalTokensIn !== undefined ? { totalTokensIn: entry.totalTokensIn } : {}),
          ...(entry.totalTokensOut !== undefined ? { totalTokensOut: entry.totalTokensOut } : {}),
        }));
      await deps.costReportWriter.writeSessionToReport(
        finalSession,
        costSummary,
        childEntries,
        commitSha ?? undefined,
        {
          capability: capabilityName,
          model: aiResult.model || "unknown",
          status: "success",
          input: sanitizeInput(validatedInput),
          specHash: generateSpecHash(validatedInput),
        }
      );
    }
  } catch (error) {
    deps.logger.error("Failed to write cost report (non-fatal)", {
      error: error instanceof Error ? error.message : String(error),
      fullError: extractErrorChain(error),
      sid: sessionId,
    });
  }

  const outputWithSessionId = {
    ...(output as Record<string, unknown>),
    session_id: sessionId,
    cost_usd: costSummary.totalCostUsd,
    turns: costSummary.totalTurns,
    _input_tokens: costSummary.totalInputTokens,
    _output_tokens: costSummary.totalOutputTokens,
    _model: aiResult.model,
    // Cache metrics for child cost propagation
    ...((costSummary.totalPromptCacheWrite ?? 0) > 0
      ? { _cache_creation_input_tokens: costSummary.totalPromptCacheWrite }
      : {}),
    ...((costSummary.totalPromptCacheRead ?? 0) > 0
      ? { _cache_read_input_tokens: costSummary.totalPromptCacheRead }
      : {}),
    // Prompt version for child cost propagation
    ...(promptVersion ? { _prompt_version: promptVersion } : {}),
  };
  return {
    content: [{ type: "text", text: JSON.stringify(outputWithSessionId) }],
  };
}

/**
 * Build a cost entry from AI result.
 * @internal
 */
function buildCostEntry(
  sessionId: string,
  invocationId: string,
  aiResult: AIQueryResult
): import("../cost/cost.types.js").CostEntry {
  const entry: import("../cost/cost.types.js").CostEntry = {
    id: `cost_${invocationId}`,
    sid: sessionId,
    model: (aiResult.model || "haiku") as AIModel,
    inputTokens: aiResult.usage.inputTokens,
    outputTokens: aiResult.usage.outputTokens,
    costUsd: aiResult.costUsd,
    timestamp: new Date().toISOString(),
    turns: aiResult.turns,
  };

  // Include cache metrics if present
  if (aiResult.usage.promptCacheWrite !== undefined) {
    entry.promptCacheWrite = aiResult.usage.promptCacheWrite;
  }
  if (aiResult.usage.promptCacheRead !== undefined) {
    entry.promptCacheRead = aiResult.usage.promptCacheRead;
  }

  return entry;
}

/**
 * Build MCP error response from a caught error.
 * Extracts and logs the full error chain including causes.
 */
async function buildErrorResponse(
  error: unknown,
  capabilityName: string,
  sessionId: string | undefined,
  invocationId: string | undefined,
  deps: CapabilityRegistryDeps,
  rawInput: unknown,
  validatedInput?: unknown
): Promise<McpToolResponse> {
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorName = error instanceof Error ? error.constructor.name : "Error";
  const fullErrorMessage = extractErrorChain(error);
  const causeChain = extractCauseChain(error);

  const errorContext: Record<string, unknown> = {
    capability: capabilityName,
    error: errorMessage,
    errorType: errorName,
    fullError: fullErrorMessage,
    causeChain,
  };

  if (sessionId) errorContext.sid = sessionId;
  if (invocationId) errorContext.iid = invocationId;

  // Log stack trace if available for debugging
  if (error instanceof Error && error.stack) {
    errorContext.stack = error.stack;
  }

  deps.logger.error("Capability invocation failed", errorContext);

  // Write error session to cost report if costs were incurred (non-blocking)
  if (sessionId && (validatedInput || rawInput)) {
    const finalSession = deps.sessionManager.getSession(sessionId);
    if (finalSession) {
      const costSummary = deps.costTracker.getSessionSummary(sessionId);

      // Only write if costs were actually incurred
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
            status: entry.status || "success",
            ...(entry.commitSha ? { commitSha: entry.commitSha } : {}),
            // NEW: Cache metrics for child entries (AC-9, AC-2)
            ...(entry.promptCacheWrite !== undefined ? { promptCacheWrite: entry.promptCacheWrite } : {}),
            ...(entry.promptCacheRead !== undefined ? { promptCacheRead: entry.promptCacheRead } : {}),
            // NEW: Prompt version propagation (AC-3, AC-5)
            ...(entry.promptVersion !== undefined ? { promptVersion: entry.promptVersion } : {}),
            // NEW: Total token fields (AC-10, AC-11)
            ...(entry.totalTokensIn !== undefined ? { totalTokensIn: entry.totalTokensIn } : {}),
            ...(entry.totalTokensOut !== undefined ? { totalTokensOut: entry.totalTokensOut } : {}),
          }));

        // Non-blocking write with error handling
        deps.costReportWriter
          .writeSessionToReport(
            finalSession,
            costSummary,
            childEntries,
            undefined, // No commit SHA on error
            {
              capability: capabilityName,
              model: extractModelFromCostSummary(costSummary),
              status: "error",
              input: sanitizeInput(validatedInput || rawInput),
              specHash: generateSpecHash(validatedInput || rawInput),
              errorType: categorizeError(error) as
                | "validation"
                | "budget"
                | "timeout"
                | "ai_error"
                | "capability"
                | "halted"
                | "unknown",
              errorMessage: errorMessage.slice(0, 1000),
            }
          )
          .catch((reportError) => {
            deps.logger.warn("Failed to write error session to cost report", {
              sid: sessionId,
              error:
                reportError instanceof Error
                  ? reportError.message
                  : String(reportError),
            });
          });
      }
    }
  }

  // Include cost metadata if session exists (for cost propagation)
  // Include full error chain for debugging
  const errorResponse: Record<string, unknown> = {
    error: errorName,
    message: errorMessage,
    fullError: fullErrorMessage,
    causeChain,
    session_id: sessionId ?? null,
  };

  if (sessionId) {
    const costSummary = deps.costTracker.getSessionSummary(sessionId);
    errorResponse.cost_usd = costSummary.totalCostUsd;
    errorResponse.turns = costSummary.totalTurns;
    errorResponse._input_tokens = costSummary.totalInputTokens;
    errorResponse._output_tokens = costSummary.totalOutputTokens;

    // Cache metrics for child cost propagation
    if ((costSummary.totalPromptCacheWrite ?? 0) > 0) {
      errorResponse._cache_creation_input_tokens = costSummary.totalPromptCacheWrite;
    }
    if ((costSummary.totalPromptCacheRead ?? 0) > 0) {
      errorResponse._cache_read_input_tokens = costSummary.totalPromptCacheRead;
    }

    // Extract model from costSummary.byModel (first model in the map)
    const modelKeys = Object.keys(costSummary.byModel);
    if (modelKeys.length > 0) {
      errorResponse._model = modelKeys[0];
    }
  }

  return {
    content: [{ type: "text", text: JSON.stringify(errorResponse) }],
    isError: true,
  };
}

