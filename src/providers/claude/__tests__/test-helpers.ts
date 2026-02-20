/**
 * Shared test helpers for Claude Provider tests.
 *
 * Mock messages follow the actual SDK types:
 * - SDKAssistantMessage: { type: 'assistant', message: { content: BetaContentBlock[] }, ... }
 * - SDKResultMessage: { type: 'result', subtype: 'success' | 'error_*', ... }
 *
 * Content blocks use discriminated union by `type` field:
 * - BetaTextBlock: { type: 'text', text: string }
 * - BetaThinkingBlock: { type: 'thinking', thinking: string, signature: string }
 * - BetaToolUseBlock: { type: 'tool_use', id: string, name: string, input: unknown }
 */

import { jest } from "@jest/globals";

/**
 * SDK message types matching the real Claude Agent SDK.
 * Uses discriminated unions by `type` field, with content blocks using `type` discriminator.
 */
export type MockContentBlock =
  | { type: "text"; text: string; citations: null }
  | { type: "thinking"; thinking: string; signature: string }
  | { type: "tool_use"; id: string; name: string; input: unknown };

export type MockAssistantMessage = {
  type: "assistant";
  message: { content: MockContentBlock[] };
  parent_tool_use_id: string | null;
  uuid: string;
  session_id: string;
};

export type MockResultSuccess = {
  type: "result";
  subtype: "success";
  is_error: false;
  total_cost_usd: number;
  num_turns: number;
  duration_ms: number;
  duration_api_ms: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
  modelUsage: Record<string, unknown>;
  permission_denials: unknown[];
  result: string;
  uuid: string;
  session_id: string;
  structured_output?: unknown;
};

export type MockResultError = {
  type: "result";
  subtype:
    | "error_during_execution"
    | "error_max_turns"
    | "error_max_budget_usd"
    | "error_max_structured_output_retries";
  is_error: true;
  total_cost_usd: number;
  num_turns: number;
  duration_ms: number;
  duration_api_ms: number;
  usage: {
    input_tokens: number;
    output_tokens: number;
    cache_creation_input_tokens: number;
    cache_read_input_tokens: number;
  };
  modelUsage: Record<string, unknown>;
  permission_denials: unknown[];
  errors: string[];
  uuid: string;
  session_id: string;
};

export type MockUserMessage = {
  type: "user";
  tool_use_result: string | Record<string, unknown> | null;
  parent_tool_use_id: string | null;
  uuid: string;
  session_id: string;
};

export type MockSDKMessage = MockAssistantMessage | MockResultSuccess | MockResultError | MockUserMessage;

/** Helper: Create a text content block */
export function textBlock(text: string): MockContentBlock {
  return { type: "text", text, citations: null };
}

/** Helper: Create a thinking content block */
export function thinkingBlock(thinking: string): MockContentBlock {
  return { type: "thinking", thinking, signature: "sig-mock" };
}

/** Helper: Create a tool_use content block */
export function toolUseBlock(
  id: string,
  name: string,
  input: unknown
): MockContentBlock {
  return { type: "tool_use", id, name, input };
}

/** Helper: Create an assistant message */
export function assistantMsg(
  content: MockContentBlock[],
  sessionId = "test-session"
): MockAssistantMessage {
  return {
    type: "assistant",
    message: { content },
    parent_tool_use_id: null,
    uuid: "uuid-" + Math.random().toString(36).slice(2, 8),
    session_id: sessionId,
  };
}

/** Helper: Create a success result message */
export function successResult(overrides: Partial<MockResultSuccess> = {}): MockResultSuccess {
  return {
    type: "result",
    subtype: "success",
    is_error: false,
    total_cost_usd: 0.001,
    num_turns: 1,
    duration_ms: 100,
    duration_api_ms: 80,
    usage: {
      input_tokens: 10,
      output_tokens: 20,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 5,
    },
    modelUsage: {},
    permission_denials: [],
    result: "",
    uuid: "result-uuid",
    session_id: "test-session",
    ...overrides,
  };
}

/** Helper: Create an error result message */
export function errorResult(
  subtype: MockResultError["subtype"],
  errors: string[],
  overrides: Partial<MockResultError> = {}
): MockResultError {
  return {
    type: "result",
    subtype,
    is_error: true,
    total_cost_usd: 0.001,
    num_turns: 1,
    duration_ms: 100,
    duration_api_ms: 80,
    usage: {
      input_tokens: 10,
      output_tokens: 0,
      cache_creation_input_tokens: 0,
      cache_read_input_tokens: 0,
    },
    modelUsage: {},
    permission_denials: [],
    errors,
    uuid: "error-uuid",
    session_id: "test-session",
    ...overrides,
  };
}

/** Helper: Create a user message (tool result) */
export function userMsg(
  toolResult: string | Record<string, unknown>,
  parentToolUseId: string | null = null,
  sessionId = "test-session"
): MockUserMessage {
  return {
    type: "user",
    tool_use_result: toolResult,
    parent_tool_use_id: parentToolUseId,
    uuid: "uuid-" + Math.random().toString(36).slice(2, 8),
    session_id: sessionId,
  };
}

/** Create a mock query function that yields the given messages */
export function createMockQuery(messages: MockSDKMessage[]) {
  return jest.fn(async function* () {
    for (const message of messages) {
      yield message;
    }
  });
}
