/**
 * AI Provider type definitions mirroring Claude Agent SDK surface.
 * These types define the interface for AI query requests, responses, and tool definitions.
 */

import type { SystemPromptValue } from '../prompt/prompt.types.js'

/** Preset tools configuration for Claude Code built-in tools */
export interface PresetTools {
  type: 'preset'
  preset: 'claude_code'
  /** Additional custom tool definitions alongside the preset (ADDITIONAL, not replacements) */
  customTools?: AIToolDefinition[]
  /** Restrict preset to only these tools (allowlist) */
  allowedTools?: string[]
  /** Block these tools from the preset (blocklist) */
  disallowedTools?: string[]
}

/** Tools configuration — either explicit tool names or a preset */
export type ToolsConfig = string[] | PresetTools

/** Token usage statistics for an AI operation */
export interface TokenUsage {
  /** Input tokens consumed */
  inputTokens: number
  /** Output tokens generated */
  outputTokens: number
  /** Total tokens (input + output) */
  totalTokens: number
  /** Cache creation input tokens (prompt cache write) */
  promptCacheWrite?: number
  /** Cache read input tokens (prompt cache read) */
  promptCacheRead?: number
}

/** Tool definition for AI function calling */
export interface AIToolDefinition {
  /** Tool identifier */
  name: string
  /** Human-readable description */
  description: string
  /** JSON Schema for tool parameters */
  inputSchema: Record<string, unknown>
}

/** AI model identifier */
export type AIModel =
  | 'claude-sonnet-4-6-20250415'
  | 'claude-opus-4-6-20250415'
  | 'claude-3-5-sonnet-20241022'
  | 'claude-3-5-haiku-20241022'
  | 'claude-opus-4-20250514'
  | 'haiku'
  | 'sonnet'
  | 'opus'

/** Permission mode for agent execution (mirrors Claude Agent SDK values) */
export type PermissionMode =
  | 'default'
  | 'acceptEdits'
  | 'bypassPermissions'
  | 'plan'
  | 'delegate'
  | 'dontAsk'

/** Request to AI provider (mirrors Claude Agent SDK query options) */
export interface AIQueryRequest {
  /** User prompt */
  prompt: string
  /** System prompt to prepend (string or preset reference) */
  systemPrompt?: SystemPromptValue
  /** Additional system prompt to append */
  appendSystemPrompt?: string
  /** Tool configuration — explicit tool names or a preset like claude_code */
  tools?: ToolsConfig
  /** Skip all permission prompts (requires bypassPermissions mode) */
  allowDangerouslySkipPermissions?: boolean
  /** Model to use */
  model?: AIModel
  /** Fallback model if primary fails */
  fallbackModel?: AIModel
  /** Maximum thinking tokens */
  maxThinkingTokens?: number
  /** Allowed agent tools */
  allowedAgentTools?: string[]
  /** Disallowed agent tools */
  disallowedAgentTools?: string[]
  /** Custom tool definitions */
  customAgentTools?: AIToolDefinition[]
  /** Maximum conversation turns */
  maxTurns?: number
  /** Maximum budget in USD */
  maxBudgetUsd?: number
  /** Timeout in milliseconds */
  timeout?: number
  /** Permission mode for tool execution */
  permissionMode?: PermissionMode
  /** Working directory */
  cwd?: string
  /** Additional directories the agent can access beyond cwd */
  additionalDirectories?: string[]
  /** MCP server configurations */
  mcpServers?: MCPServerConfig[]
  /** Lifecycle hooks */
  hooks?: AIHooksConfig
  /** Subagent definitions */
  subagents?: AISubagentDefinition[]
  /** Sandbox configuration */
  sandbox?: AISandboxConfig
  /** Session ID to resume */
  resumeSessionId?: string
  /** Output schema for structured responses */
  outputSchema?: Record<string, unknown>
  /** Setting sources for Claude Code skills/commands discovery */
  settingSources?: ('user' | 'project')[]
  /** Abort signal for cancellation */
  signal?: AbortSignal
}

/** Termination reason for AI execution */
export type TerminationReason =
  | 'success'
  | 'max_turns'
  | 'max_budget'
  | 'error'
  | 'user_cancelled'
  | 'timeout'

/** Complete result from AI query */
export interface AIQueryResult {
  /** AI-generated text response */
  content: string
  /** Token usage for this operation */
  usage: TokenUsage
  /** Cost in USD */
  costUsd: number
  /** Number of turns executed */
  turns: number
  /** Model that generated the response */
  model?: AIModel
  /** Termination reason */
  terminationReason: TerminationReason
  /** Session ID for resumption */
  sessionId?: string
  /** Structured output (if outputSchema was provided) */
  structuredOutput?: Record<string, unknown>
  /** Full execution trace (redacted) */
  trace: AIExecutionTrace
}

/** MCP Server configuration for AI provider */
export interface MCPServerConfig {
  /** MCP server name */
  name: string
  /** Command to start server */
  command: string
  /** Command arguments */
  args?: string[]
  /** Environment variables */
  env?: Record<string, string>
}

/**
 * Hook callback for PreToolUse/PostToolUse events.
 * Receives tool input and returns a decision (continue/block).
 */
export type AIHookCallback = (toolInput: Record<string, unknown>) => AIHookResult

/** Result of a hook callback. */
export interface AIHookResult {
  decision: 'continue' | 'block'
  reason?: string
}

/** Hook matcher — binds callbacks to a tool name pattern. */
export interface AIHookMatcher {
  matcher: string
  hooks: AIHookCallback[]
}

/**
 * Hooks configuration for AI execution.
 * Matches the Claude Agent SDK hook structure (PreToolUse, PostToolUse, etc.).
 */
export interface AIHooksConfig {
  PreToolUse?: AIHookMatcher[]
}

/** Subagent definition for orchestration */
export interface AISubagentDefinition {
  /** Subagent identifier */
  id: string
  /** System prompt for this subagent */
  systemPrompt: string
  /** Available tools */
  tools?: AIToolDefinition[]
  /** Default model */
  model?: AIModel
}

/** Sandbox configuration for execution isolation */
export interface AISandboxConfig {
  /** Allowed filesystem paths */
  allowedPaths?: string[]
  /** Allowed network hosts */
  allowedHosts?: string[]
  /** Maximum execution time (ms) */
  timeout?: number
  /** Maximum memory (MB) */
  maxMemory?: number
}

/** Content block in a turn */
export interface AIContentBlock {
  /** Block type */
  type: 'text' | 'thinking' | 'tool_use'
  /** Text content (for text/thinking blocks) */
  text?: string
  /** Tool use details (for tool_use blocks) */
  toolUse?: {
    id: string
    name: string
    input: Record<string, unknown>
  }
}

/** Tool result in a turn */
export interface AIToolResult {
  /** Tool call ID this result corresponds to */
  toolUseId: string
  /** Result content */
  content: string | Record<string, unknown>
  /** Whether the tool execution errored */
  isError?: boolean
}

/** A single conversation turn */
export interface AITurn {
  /** Turn number (1-indexed) */
  turnNumber: number
  /** Assistant content blocks */
  assistantBlocks: AIContentBlock[]
  /** Tool results (if any) */
  toolResults?: AIToolResult[]
}

/** Raw SDK event captured for full observability */
export interface AIRawEvent {
  /** SDK message type (assistant, user, result, system, tool_progress, etc.) */
  type: string
  /** SDK message subtype if present */
  subtype?: string
  /** Timestamp when event was received */
  timestamp: string
  /** Full event payload (redacted) */
  data: Record<string, unknown>
}

/** Execution trace for debugging and auditing */
export interface AIExecutionTrace {
  /** Unique trace ID */
  tid: string
  /** Session ID this trace belongs to */
  sessionId?: string
  /** Timestamp when execution started */
  startedAt: string
  /** Timestamp when execution completed */
  completedAt?: string
  /** Wall-clock duration in milliseconds */
  durationMs?: number
  /** API-only duration in milliseconds */
  durationApiMs?: number
  /** Request that initiated this trace */
  request: AIQueryRequest
  /** Turn-by-turn conversation history */
  turns: AITurn[]
  /** All raw SDK events in order of receipt */
  rawEvents?: AIRawEvent[]
  /** Final result of the execution */
  result?: AIQueryResult
  /** Error message if execution failed */
  error?: string
  /** Error type/class name if execution failed */
  errorType?: string
  /** Error stack trace if available */
  errorStack?: string
  /** Error cause message (from error.cause) */
  errorCause?: string
  /** Nested subagent traces */
  subtraces?: AIExecutionTrace[]
}

/** Streaming event from AI provider */
export type AIStreamEvent =
  | { type: 'text_delta'; text: string }
  | { type: 'thinking_delta'; text: string }
  | { type: 'tool_use_start'; toolUseId: string; name: string }
  | { type: 'tool_use_delta'; toolUseId: string; input: string }
  | { type: 'tool_result'; toolUseId: string; content: string | Record<string, unknown> }
  | { type: 'turn_complete'; turnNumber: number }
  | { type: 'result'; result: AIQueryResult }

/** AI Provider interface - main abstraction for querying AI */
export interface AIProvider {
  /**
   * Query the AI with a prompt and optional configuration.
   * @param request - The AI query request
   * @returns Promise resolving to the AI result with full trace
   */
  query(request: AIQueryRequest): Promise<AIQueryResult>

  /**
   * Stream AI responses for real-time feedback (optional).
   * @param request - The AI query request
   * @returns Async generator of streaming events
   */
  stream?(request: AIQueryRequest): AsyncGenerator<AIStreamEvent>
}
