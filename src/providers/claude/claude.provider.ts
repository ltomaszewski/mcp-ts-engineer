/**
 * Claude Agent SDK provider implementation.
 * Wraps the Claude Agent SDK query function with full execution tracing.
 */

import { query } from "@anthropic-ai/claude-agent-sdk";
import type {
  AIProvider,
  AIQueryRequest,
  AIQueryResult,
  AIStreamEvent,
  AIExecutionTrace,
  AIRawEvent,
} from "../../core/ai-provider/ai-provider.types.js";
import { redactSensitive } from "../../core/logger/redact.js";
import { AIProviderError } from "../../core/errors.js";
import { MAX_TRACE_ENTRY_SIZE_BYTES } from "../../config/constants.js";
import { randomBytes } from "crypto";
import { createRequire } from "module";
import { dirname, join } from "path";
import type { SDKMessage } from "./sdk-message.types.js";
import {
  isAssistantMessage,
  isUserMessage,
  isResultMessage,
} from "./sdk-message.types.js";
import {
  createInitialAccumulator,
  processAssistantMessage,
  processUserMessage,
  processResultMessage,
} from "./message-handlers.js";

/** Type for the SDK query function (for dependency injection) */
export type SDKQueryFunction = typeof query;

/**
 * Resolve the path to the Claude Code CLI executable.
 * Needed because npm workspace hoisting can break the SDK's internal resolution.
 */
function resolveClaudeCodeCli(): string {
  const require = createRequire(import.meta.url);
  const sdkEntry = require.resolve("@anthropic-ai/claude-agent-sdk");
  return join(dirname(sdkEntry), "cli.js");
}

/**
 * Claude Provider implementation using Claude Agent SDK.
 * Captures full execution trace including turn-by-turn conversation history,
 * tool calls, and thinking blocks.
 */
export class ClaudeProvider implements AIProvider {
  private readonly cliPath: string;

  /**
   * Create a Claude provider instance.
   *
   * @param queryFn - Claude Agent SDK query function (injected for testability)
   */
  constructor(private readonly queryFn: SDKQueryFunction = query) {
    this.cliPath = resolveClaudeCodeCli();
  }

  /**
   * Query Claude with full trace capture.
   *
   * @param request - AI query request with all SDK options
   * @returns Promise resolving to result with full redacted trace
   * @throws {AIProviderError} If query execution fails
   */
  async query(request: AIQueryRequest): Promise<AIQueryResult> {
    const traceId = this.generateTraceId();
    const startTime = Date.now();

    const trace: AIExecutionTrace = {
      tid: traceId,
      startedAt: new Date(startTime).toISOString(),
      request: { ...request },
      turns: [],
      rawEvents: [],
    };

    try {
      const options = this.mapRequestToOptions(request);
      const acc = createInitialAccumulator();

      for await (const message of this.queryFn({
        prompt: request.prompt,
        options,
      })) {
        const sdkMsg = message as SDKMessage;
        trace.rawEvents!.push(this.captureRawEvent(message as Record<string, unknown>));

        if (isAssistantMessage(sdkMsg)) {
          processAssistantMessage(sdkMsg, acc, trace);
        } else if (isUserMessage(sdkMsg)) {
          processUserMessage(sdkMsg, acc);
        } else if (isResultMessage(sdkMsg)) {
          processResultMessage(sdkMsg, acc, trace);
        }
      }

      const endTime = Date.now();
      trace.completedAt = new Date(endTime).toISOString();
      trace.durationMs = endTime - startTime;
      trace.durationApiMs = acc.durationApiMs || endTime - startTime;
      trace.sessionId = acc.sessionId;

      const result: AIQueryResult = {
        content: acc.textResponse,
        usage: acc.usage,
        costUsd: acc.totalCostUsd,
        turns: acc.numTurns,
        model: request.model,
        terminationReason: acc.terminationReason,
        sessionId: acc.sessionId,
        structuredOutput: acc.structuredOutput,
        trace: this.redactAndTruncateTrace(trace),
      };

      trace.result = result;
      return result;
    } catch (error) {
      const endTime = Date.now();
      trace.completedAt = new Date(endTime).toISOString();
      trace.durationMs = endTime - startTime;

      // Capture detailed error information in trace
      if (error instanceof Error) {
        trace.error = error.message;
        trace.errorType = error.constructor.name;
        trace.errorStack = error.stack;
        if (error.cause) {
          trace.errorCause = error.cause instanceof Error
            ? `${error.cause.constructor.name}: ${error.cause.message}`
            : String(error.cause);
        }
      } else {
        trace.error = String(error);
      }

      // Re-throw with cause chain preserved
      if (error instanceof AIProviderError) {
        throw error; // Already an AIProviderError, don't double-wrap
      }
      throw new AIProviderError("Claude query failed", { cause: error });
    }
  }

  /**
   * Optional streaming support.
   * Yields real-time events as the SDK processes the query.
   */
  async *stream(request: AIQueryRequest): AsyncGenerator<AIStreamEvent> {
    const options = this.mapRequestToOptions(request);
    let currentTurnNumber = 0;

    for await (const message of this.queryFn({
      prompt: request.prompt,
      options,
    })) {
      const sdkMsg = message as SDKMessage;

      if (isAssistantMessage(sdkMsg)) {
        currentTurnNumber++;
        for (const raw of sdkMsg.message.content) {
          const block = raw as unknown as Record<string, unknown>;
          const blockType = block.type as string;

          if (blockType === "text") {
            yield { type: "text_delta", text: block.text as string };
          } else if (blockType === "thinking") {
            yield { type: "thinking_delta", text: block.thinking as string };
          } else if (blockType === "tool_use") {
            yield {
              type: "tool_use_start",
              toolUseId: block.id as string,
              name: block.name as string,
            };
          }
        }
      } else if (isResultMessage(sdkMsg)) {
        yield { type: "turn_complete", turnNumber: currentTurnNumber };

        const result: AIQueryResult = {
          content: "",
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          costUsd: sdkMsg.total_cost_usd ?? 0,
          turns: sdkMsg.num_turns ?? 0,
          model: request.model,
          terminationReason: sdkMsg.is_error ? "error" : "success",
          trace: {
            tid: this.generateTraceId(),
            startedAt: new Date().toISOString(),
            request,
            turns: [],
          },
        };

        yield { type: "result", result };
      }
    }
  }

  /**
   * Map AIQueryRequest to SDK options Record.
   */
  private mapRequestToOptions(
    request: AIQueryRequest
  ): Record<string, unknown> {
    const options: Record<string, unknown> = {
      pathToClaudeCodeExecutable: this.cliPath,
    };

    if (request.systemPrompt) {
      options.systemPrompt = request.systemPrompt;
    }

    // Compose appendSystemPrompt
    const appendParts: string[] = [];
    if (
      request.systemPrompt &&
      typeof request.systemPrompt === "object" &&
      "append" in request.systemPrompt &&
      request.systemPrompt.append
    ) {
      appendParts.push(request.systemPrompt.append);
    }
    if (request.appendSystemPrompt) {
      appendParts.push(request.appendSystemPrompt);
    }
    if (appendParts.length > 0) {
      options.appendSystemPrompt = appendParts.join("\n\n");
    }

    if (request.model) options.model = request.model;
    if (request.fallbackModel) options.fallbackModel = request.fallbackModel;
    if (request.maxThinkingTokens) options.maxThinkingTokens = request.maxThinkingTokens;

    // Tool configuration
    if (request.tools) {
      if (!Array.isArray(request.tools) && request.tools.type === "preset") {
        options.tools = { type: "preset", preset: request.tools.preset };
        if (request.tools.customTools && request.tools.customTools.length > 0) {
          options.tools = request.tools.customTools;
        }
        if (request.tools.allowedTools) options.allowedTools = request.tools.allowedTools;
        if (request.tools.disallowedTools) options.disallowedTools = request.tools.disallowedTools;
      } else {
        options.tools = request.tools;
      }
    }
    if (request.allowedAgentTools) options.allowedTools = request.allowedAgentTools;
    if (request.disallowedAgentTools) options.disallowedTools = request.disallowedAgentTools;
    if (request.customAgentTools) options.tools = request.customAgentTools;

    if (request.allowDangerouslySkipPermissions)
      options.allowDangerouslySkipPermissions = request.allowDangerouslySkipPermissions;

    if (request.maxTurns) options.maxTurns = request.maxTurns;
    if (request.maxBudgetUsd) options.maxBudgetUsd = request.maxBudgetUsd;
    if (request.timeout) options.timeout = request.timeout;
    if (request.permissionMode) options.permissionMode = request.permissionMode;
    if (request.cwd) options.cwd = request.cwd;
    if (request.additionalDirectories) options.additionalDirectories = request.additionalDirectories;
    if (request.settingSources) options.settingSources = request.settingSources;
    if (request.mcpServers) options.mcpServers = request.mcpServers;
    if (request.hooks) options.hooks = request.hooks;
    if (request.subagents) options.agents = request.subagents;
    if (request.sandbox) options.sandbox = request.sandbox;
    if (request.resumeSessionId) options.resume = request.resumeSessionId;
    if (request.outputSchema) options.outputFormat = request.outputSchema;

    if (request.signal) {
      const controller = new AbortController();
      request.signal.addEventListener("abort", () => controller.abort());
      options.abortController = controller;
    }

    return options;
  }

  /**
   * Redact sensitive information and truncate large traces.
   */
  private redactAndTruncateTrace(trace: AIExecutionTrace): AIExecutionTrace {
    const redacted = redactSensitive(trace) as AIExecutionTrace;

    const estimatedSize = this.estimateTraceSize(redacted);
    if (estimatedSize > MAX_TRACE_ENTRY_SIZE_BYTES) {
      const maxTurns = 10;
      if (redacted.turns.length > maxTurns) {
        const keepFirst = Math.floor(maxTurns / 2);
        const keepLast = maxTurns - keepFirst;
        redacted.turns = [
          ...redacted.turns.slice(0, keepFirst),
          ...redacted.turns.slice(-keepLast),
        ];
      }
    }

    return redacted;
  }

  /**
   * Estimate trace size in bytes (rough approximation).
   */
  private estimateTraceSize(trace: AIExecutionTrace): number {
    try {
      return JSON.stringify(trace).length;
    } catch {
      return 1000;
    }
  }

  /** Generate unique trace ID. */
  private generateTraceId(): string {
    return randomBytes(16).toString("hex");
  }

  /**
   * Capture an SDK message as a raw event for full observability.
   */
  private captureRawEvent(message: Record<string, unknown>): AIRawEvent {
    const type = (message.type as string) ?? "unknown";
    const subtype = message.subtype as string | undefined;

    const data: Record<string, unknown> = {};
    for (const [key, value] of Object.entries(message)) {
      if (key === "type" || key === "subtype") continue;
      data[key] = value;
    }

    return { type, subtype, timestamp: new Date().toISOString(), data };
  }
}
