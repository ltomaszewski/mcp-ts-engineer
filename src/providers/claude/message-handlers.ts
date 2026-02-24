/**
 * Message processing handlers for Claude Agent SDK streaming messages.
 * Extracted from ClaudeProvider.query() for decomposition.
 */

import type {
  AIContentBlock,
  AIExecutionTrace,
  AITurn,
  TerminationReason,
  TokenUsage,
} from '../../core/ai-provider/ai-provider.types.js'
import { AIProviderError } from '../../core/errors.js'
import type { SDKAssistantMessage, SDKResultMessage, SDKUserMessage } from './sdk-message.types.js'

/** Accumulator for query state across streamed messages. */
export interface QueryAccumulator {
  textResponse: string
  totalCostUsd: number
  numTurns: number
  sessionId?: string
  terminationReason: TerminationReason
  structuredOutput?: Record<string, unknown>
  durationApiMs: number
  usage: TokenUsage
  currentTurn: AITurn | null
}

/** Create initial accumulator state. */
export function createInitialAccumulator(): QueryAccumulator {
  return {
    textResponse: '',
    totalCostUsd: 0,
    numTurns: 0,
    sessionId: undefined,
    terminationReason: 'success',
    structuredOutput: undefined,
    durationApiMs: 0,
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    currentTurn: null,
  }
}

/**
 * Extract content blocks from SDK assistant message content.
 */
export function extractContentBlocks(content: readonly unknown[]): {
  blocks: AIContentBlock[]
  textChunks: string[]
} {
  const blocks: AIContentBlock[] = []
  const textChunks: string[] = []

  for (const raw of content) {
    const block = raw as Record<string, unknown>
    const blockType = block.type as string

    if (blockType === 'text') {
      const text = block.text as string
      blocks.push({ type: 'text', text })
      textChunks.push(text)
    } else if (blockType === 'thinking') {
      blocks.push({ type: 'thinking', text: block.thinking as string })
    } else if (blockType === 'tool_use') {
      blocks.push({
        type: 'tool_use',
        toolUse: {
          id: block.id as string,
          name: block.name as string,
          input: (block.input ?? {}) as Record<string, unknown>,
        },
      })
    }
  }

  return { blocks, textChunks }
}

/**
 * Map SDK result subtype to our TerminationReason.
 */
export function mapTerminationReason(isError: boolean, subtype: string): TerminationReason {
  if (subtype === 'error_max_turns') return 'max_turns'
  if (subtype === 'error_max_budget_usd') return 'max_budget'
  if (isError) return 'error'
  return 'success'
}

/** Process an assistant message — starts a new turn, extracts content. */
export function processAssistantMessage(
  msg: SDKAssistantMessage,
  acc: QueryAccumulator,
  trace: AIExecutionTrace,
): void {
  if (acc.currentTurn) {
    trace.turns.push(acc.currentTurn)
  }
  acc.currentTurn = {
    turnNumber: trace.turns.length + 1,
    assistantBlocks: [],
  }

  const { blocks, textChunks } = extractContentBlocks(msg.message.content)
  acc.currentTurn.assistantBlocks = blocks
  acc.textResponse += textChunks.join('')

  if (msg.session_id) {
    acc.sessionId = msg.session_id
  }
}

/** Process a user message — attaches tool results to current turn. */
export function processUserMessage(msg: SDKUserMessage, acc: QueryAccumulator): void {
  if (!acc.currentTurn || msg.tool_use_result == null) return

  let toolUseId = msg.parent_tool_use_id
  if (!toolUseId) {
    const lastToolBlock = [...acc.currentTurn.assistantBlocks]
      .reverse()
      .find((b) => b.type === 'tool_use')
    toolUseId = lastToolBlock?.toolUse?.id
  }

  if (!acc.currentTurn.toolResults) {
    acc.currentTurn.toolResults = []
  }

  acc.currentTurn.toolResults.push({
    toolUseId: toolUseId ?? 'unknown',
    content:
      typeof msg.tool_use_result === 'string'
        ? msg.tool_use_result
        : (msg.tool_use_result as Record<string, unknown>),
  })
}

/** Process a result message — finalizes metrics, extracts usage. */
export function processResultMessage(
  msg: SDKResultMessage,
  acc: QueryAccumulator,
  trace: AIExecutionTrace,
): void {
  // Push final turn
  if (acc.currentTurn) {
    trace.turns.push(acc.currentTurn)
    acc.currentTurn = null
  }

  // Use SDK's final result text when available
  if (typeof msg.result === 'string' && msg.result) {
    acc.textResponse = msg.result
  }

  acc.totalCostUsd = msg.total_cost_usd ?? 0
  acc.numTurns = msg.num_turns ?? 0
  acc.terminationReason = mapTerminationReason(msg.is_error, msg.subtype)

  if (msg.session_id) {
    acc.sessionId = msg.session_id
  }

  if (msg.duration_api_ms !== undefined) {
    acc.durationApiMs = msg.duration_api_ms
  }

  if (msg.usage) {
    const sdkUsage = msg.usage
    const newInputTokens = Number(sdkUsage.input_tokens ?? 0)
    const newOutputTokens = Number(sdkUsage.output_tokens ?? 0)

    acc.usage = {
      inputTokens: acc.usage.inputTokens + newInputTokens,
      outputTokens: acc.usage.outputTokens + newOutputTokens,
      totalTokens:
        acc.usage.inputTokens + newInputTokens + acc.usage.outputTokens + newOutputTokens,
      promptCacheWrite:
        sdkUsage.cache_creation_input_tokens != null
          ? (acc.usage.promptCacheWrite ?? 0) + Number(sdkUsage.cache_creation_input_tokens)
          : acc.usage.promptCacheWrite,
      promptCacheRead:
        sdkUsage.cache_read_input_tokens != null
          ? (acc.usage.promptCacheRead ?? 0) + Number(sdkUsage.cache_read_input_tokens)
          : acc.usage.promptCacheRead,
    }
  }

  if (msg.structured_output) {
    acc.structuredOutput = msg.structured_output
  }

  // Handle errors
  if (msg.is_error && msg.subtype !== 'success' && msg.errors) {
    throw new AIProviderError(msg.errors.join(', '))
  }
}
