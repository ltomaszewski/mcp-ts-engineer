/**
 * Typed interfaces for Claude Agent SDK streaming messages.
 * Replaces untyped Record<string, unknown> casts in the provider.
 */

/** SDK assistant message containing content blocks. */
export interface SDKAssistantMessage {
  type: "assistant";
  message: { content: readonly unknown[] };
  session_id?: string;
}

/** SDK user message carrying tool results. */
export interface SDKUserMessage {
  type: "user";
  tool_use_result?: unknown;
  parent_tool_use_id?: string;
}

/** SDK result message with final metrics. */
export interface SDKResultMessage {
  type: "result";
  result?: string;
  is_error: boolean;
  subtype: string;
  total_cost_usd?: number;
  num_turns?: number;
  session_id?: string;
  duration_api_ms?: number;
  usage?: Record<string, unknown>;
  structured_output?: Record<string, unknown>;
  errors?: string[];
}

/** Union of all SDK message types. */
export type SDKMessage = SDKAssistantMessage | SDKUserMessage | SDKResultMessage;

/** Type guard for assistant messages. */
export function isAssistantMessage(msg: SDKMessage): msg is SDKAssistantMessage {
  return msg.type === "assistant";
}

/** Type guard for user messages. */
export function isUserMessage(msg: SDKMessage): msg is SDKUserMessage {
  return msg.type === "user";
}

/** Type guard for result messages. */
export function isResultMessage(msg: SDKMessage): msg is SDKResultMessage {
  return msg.type === "result";
}
