/**
 * Session management type definitions.
 * Sessions track multi-turn conversations and capability invocations.
 */

/** Session state */
export type SessionState = 'active' | 'completed' | 'error'

/** Capability invocation record within a session */
export interface CapabilityInvocation {
  /** Unique invocation ID */
  id: string
  /** Capability name (tool/resource/prompt) */
  capability: string
  /** Input parameters */
  input: Record<string, unknown>
  /** Output/result */
  output?: unknown
  /** Error if invocation failed */
  error?: string
  /** Timestamp of invocation */
  timestamp: string
  /** Duration in milliseconds */
  durationMs?: number
  /** Child session ID (when this invocation spawned a child session) */
  childSessionId?: string
  /** Child session cost in USD */
  childCostUsd?: number
  /** Child session turns (agentic iterations) */
  childTurns?: number
}

/** Session tracking user interactions and AI turns */
export interface Session {
  /** Unique session identifier */
  id: string
  /** Session state */
  state: SessionState
  /** When session started */
  startedAt: string
  /** When session ended */
  completedAt?: string
  /** User ID or identifier (optional) */
  userId?: string
  /** Arbitrary metadata */
  metadata?: Record<string, unknown>
  /** Capability invocations in this session */
  invocations: CapabilityInvocation[]
  /** Total input tokens across all invocations */
  totalInputTokens: number
  /** Total output tokens across all invocations */
  totalOutputTokens: number
  /** Total cost in USD */
  totalCost: number
}
