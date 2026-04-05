/**
 * Claude Agent SDK provider implementation.
 * Wraps the Claude Agent SDK query function with full execution tracing.
 */

import { randomBytes } from 'node:crypto'
import { createRequire } from 'node:module'
import { dirname, join } from 'node:path'
import { query } from '@anthropic-ai/claude-agent-sdk'
import {
  MAX_TRACE_ENTRY_SIZE_BYTES,
  SDK_HARD_TIMEOUT_MS,
  SDK_IDLE_TIMEOUT_MS,
} from '../../config/constants.js'
import type {
  AIExecutionTrace,
  AIProvider,
  AIQueryRequest,
  AIQueryResult,
  AIRawEvent,
  AIStreamEvent,
} from '../../core/ai-provider/ai-provider.types.js'
import { AIProviderError } from '../../core/errors.js'
import { redactSensitive } from '../../core/logger/redact.js'
import { mapRequestToOptions } from './claude-provider.options.js'
import {
  createInitialAccumulator,
  processAssistantMessage,
  processResultMessage,
  processUserMessage,
} from './message-handlers.js'
import type { SDKMessage } from './sdk-message.types.js'
import { isAssistantMessage, isResultMessage, isUserMessage } from './sdk-message.types.js'

/** Type for the SDK query function (for dependency injection) */
export type SDKQueryFunction = typeof query

/**
 * Resolve the path to the Claude Code CLI executable.
 * Needed because npm workspace hoisting can break the SDK's internal resolution.
 */
function resolveClaudeCodeCli(): string {
  const require = createRequire(import.meta.url)
  const sdkEntry = require.resolve('@anthropic-ai/claude-agent-sdk')
  return join(dirname(sdkEntry), 'cli.js')
}

/**
 * Claude Provider implementation using Claude Agent SDK.
 * Captures full execution trace including turn-by-turn conversation history,
 * tool calls, and thinking blocks.
 */
export class ClaudeProvider implements AIProvider {
  private readonly cliPath: string

  /**
   * Create a Claude provider instance.
   *
   * @param queryFn - Claude Agent SDK query function (injected for testability)
   */
  constructor(private readonly queryFn: SDKQueryFunction = query) {
    this.cliPath = resolveClaudeCodeCli()
  }

  /**
   * Query Claude with full trace capture and watchdog timeouts.
   *
   * Two-layer timeout protection:
   * - Idle watchdog: resets on every SDK message, fires if no message for SDK_IDLE_TIMEOUT_MS
   * - Hard timeout: absolute maximum query duration (SDK_HARD_TIMEOUT_MS)
   *
   * Both use AbortController to kill the spawned CLI subprocess on timeout,
   * preventing orphaned processes that consume memory indefinitely.
   *
   * @param request - AI query request with all SDK options
   * @returns Promise resolving to result with full redacted trace
   * @throws {AIProviderError} If query execution fails or times out
   */
  async query(request: AIQueryRequest): Promise<AIQueryResult> {
    const startTime = Date.now()
    const trace = this.createTrace(request)
    const watchdog = createWatchdog(request)

    try {
      const options = this.mapRequestToOptions(request)
      options.abortController = watchdog.controller
      const acc = createInitialAccumulator()

      watchdog.resetIdle()

      for await (const message of this.queryFn({
        prompt: request.prompt,
        options,
      })) {
        watchdog.resetIdle()

        const sdkMsg = message as SDKMessage
        if (request.traceLevel === 'full') {
          trace.rawEvents?.push(this.captureRawEvent(message as Record<string, unknown>))
        }

        if (isAssistantMessage(sdkMsg)) {
          processAssistantMessage(sdkMsg, acc, trace)
        } else if (isUserMessage(sdkMsg)) {
          processUserMessage(sdkMsg, acc)
        } else if (isResultMessage(sdkMsg)) {
          processResultMessage(sdkMsg, acc, trace)
        }
      }

      const endTime = Date.now()
      trace.completedAt = new Date(endTime).toISOString()
      trace.durationMs = endTime - startTime
      trace.durationApiMs = acc.durationApiMs || endTime - startTime
      trace.sessionId = acc.sessionId

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
      }

      trace.result = result
      return result
    } catch (error) {
      this.captureTraceError(trace, startTime, error)
      if (error instanceof AIProviderError) {
        throw error
      }
      throw new AIProviderError('Claude query failed', { cause: error })
    } finally {
      watchdog.cleanup()
    }
  }

  /**
   * Optional streaming support.
   * Yields real-time events as the SDK processes the query.
   */
  async *stream(request: AIQueryRequest): AsyncGenerator<AIStreamEvent> {
    const options = this.mapRequestToOptions(request)
    let currentTurnNumber = 0

    for await (const message of this.queryFn({
      prompt: request.prompt,
      options,
    })) {
      const sdkMsg = message as SDKMessage

      if (isAssistantMessage(sdkMsg)) {
        currentTurnNumber++
        for (const raw of sdkMsg.message.content) {
          const block = raw as unknown as Record<string, unknown>
          const blockType = block.type as string

          if (blockType === 'text') {
            yield { type: 'text_delta', text: block.text as string }
          } else if (blockType === 'thinking') {
            yield { type: 'thinking_delta', text: block.thinking as string }
          } else if (blockType === 'tool_use') {
            yield {
              type: 'tool_use_start',
              toolUseId: block.id as string,
              name: block.name as string,
            }
          }
        }
      } else if (isResultMessage(sdkMsg)) {
        yield { type: 'turn_complete', turnNumber: currentTurnNumber }

        const result: AIQueryResult = {
          content: '',
          usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
          costUsd: sdkMsg.total_cost_usd ?? 0,
          turns: sdkMsg.num_turns ?? 0,
          model: request.model,
          terminationReason: sdkMsg.is_error ? 'error' : 'success',
          trace: {
            tid: this.generateTraceId(),
            startedAt: new Date().toISOString(),
            request,
            turns: [],
          },
        }

        yield { type: 'result', result }
      }
    }
  }

  /**
   * Map AIQueryRequest to SDK options Record.
   */
  private mapRequestToOptions(request: AIQueryRequest): Record<string, unknown> {
    return mapRequestToOptions(request, this.cliPath)
  }

  /**
   * Redact sensitive information and truncate large traces.
   */
  private redactAndTruncateTrace(trace: AIExecutionTrace): AIExecutionTrace {
    const redacted = redactSensitive(trace) as AIExecutionTrace

    const estimatedSize = this.estimateTraceSize(redacted)
    if (estimatedSize > MAX_TRACE_ENTRY_SIZE_BYTES) {
      const maxTurns = 10
      if (redacted.turns.length > maxTurns) {
        const keepFirst = Math.floor(maxTurns / 2)
        const keepLast = maxTurns - keepFirst
        redacted.turns = [...redacted.turns.slice(0, keepFirst), ...redacted.turns.slice(-keepLast)]
      }
    }

    return redacted
  }

  /**
   * Estimate trace size in bytes using a heuristic (avoids JSON.stringify overhead).
   * Counts turns, blocks, and raw events with average sizes.
   */
  private estimateTraceSize(trace: AIExecutionTrace): number {
    const BASE_SIZE = 500 // trace metadata (tid, timestamps, request summary)
    const TURN_SIZE = 200 // per-turn overhead (turnNumber, arrays)
    const BLOCK_SIZE = 300 // average content block size
    const RAW_EVENT_SIZE = 400 // average raw event size
    const TOOL_RESULT_SIZE = 500 // average tool result size

    let estimate = BASE_SIZE
    for (const turn of trace.turns) {
      estimate += TURN_SIZE
      estimate += turn.assistantBlocks.length * BLOCK_SIZE
      estimate += (turn.toolResults?.length ?? 0) * TOOL_RESULT_SIZE
    }
    estimate += (trace.rawEvents?.length ?? 0) * RAW_EVENT_SIZE
    return estimate
  }

  /** Generate unique trace ID. */
  private generateTraceId(): string {
    return randomBytes(16).toString('hex')
  }

  /** Create initial trace object for a query. */
  private createTrace(request: AIQueryRequest): AIExecutionTrace {
    return {
      tid: this.generateTraceId(),
      startedAt: new Date().toISOString(),
      request: { ...request },
      turns: [],
      rawEvents: request.traceLevel === 'full' ? [] : undefined,
    }
  }

  /** Capture error details into the trace object. */
  private captureTraceError(trace: AIExecutionTrace, startTime: number, error: unknown): void {
    const endTime = Date.now()
    trace.completedAt = new Date(endTime).toISOString()
    trace.durationMs = endTime - startTime

    if (error instanceof Error) {
      trace.error = error.message
      trace.errorType = error.constructor.name
      trace.errorStack = error.stack
      if (error.cause) {
        trace.errorCause =
          error.cause instanceof Error
            ? `${error.cause.constructor.name}: ${error.cause.message}`
            : String(error.cause)
      }
    } else {
      trace.error = String(error)
    }
  }

  /**
   * Capture an SDK message as a raw event for full observability.
   */
  private captureRawEvent(message: Record<string, unknown>): AIRawEvent {
    const type = (message.type as string) ?? 'unknown'
    const subtype = message.subtype as string | undefined

    const data: Record<string, unknown> = {}
    for (const [key, value] of Object.entries(message)) {
      if (key === 'type' || key === 'subtype') continue
      data[key] = value
    }

    return { type, subtype, timestamp: new Date().toISOString(), data }
  }
}

/** Watchdog timer state for SDK query lifecycle. */
interface Watchdog {
  controller: AbortController
  resetIdle: () => void
  cleanup: () => void
}

/**
 * Create idle + hard watchdog timers that abort the controller on timeout.
 * Idle timer resets on every SDK message; hard timer is absolute max.
 */
function createWatchdog(request: AIQueryRequest): Watchdog {
  const controller = new AbortController()
  const idleMs = request.idleTimeout || SDK_IDLE_TIMEOUT_MS
  const hardMs = request.hardTimeout || request.timeout || SDK_HARD_TIMEOUT_MS

  let idleTimer: ReturnType<typeof setTimeout> | null = null

  const resetIdle = () => {
    if (idleTimer) clearTimeout(idleTimer)
    idleTimer = setTimeout(() => {
      controller.abort(new Error(`SDK idle timeout: no message for ${idleMs}ms`))
    }, idleMs)
  }

  const hardTimer = setTimeout(() => {
    controller.abort(new Error(`SDK hard timeout: exceeded ${hardMs}ms total`))
  }, hardMs)

  const cleanup = () => {
    if (idleTimer) clearTimeout(idleTimer)
    clearTimeout(hardTimer)
  }

  return { controller, resetIdle, cleanup }
}
