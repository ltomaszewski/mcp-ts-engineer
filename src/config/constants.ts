/**
 * Configuration constants for mcp-ts-engineer.
 *
 * Three values are runtime-configurable via ProjectConfig:
 * - Server info (name, version) → getServerInfo()
 * - Log directory → getDefaultLogDir()
 * - Commit tag → getCommitTag()
 *
 * All other constants are framework-level and stay fixed.
 */

import { getProjectConfig } from './project-config.js'

/**
 * MCP tools to block (prevents recursive calls).
 * @internal Reserved for future use when agent orchestration is implemented
 */
export const BLOCKED_TOOLS = [
  'mcp__ts-engineer__*', // Prevent recursive calls
] as const

/** Runtime-configurable server metadata. */
export function getServerInfo(): { name: string; version: string } {
  const config = getProjectConfig()
  return { name: config.serverName, version: config.serverVersion }
}

/**
 * Runtime-configurable log directory.
 * Override via LOG_DIR environment variable or ProjectConfig.logDir.
 * Supports tilde expansion (~/) and absolute/relative paths.
 */
export function getDefaultLogDir(): string {
  return getProjectConfig().logDir
}

/** Logging configuration constants */
export const REDACT_MAX_INPUT_MB = 50
export const SESSION_ID_ENTROPY_BYTES = 16

/** AI Provider trace configuration */
export const MAX_TRACE_ENTRY_SIZE_BYTES = 1048576 // 1MB - for trace truncation

/** Session management constants */
export const SESSION_MAX_DEPTH = 5
export const MAX_INVOCATIONS_PER_SESSION = 50
export const MAX_SESSION_BUDGET_USD = 10.0
export const MAX_DAILY_BUDGET_USD = 500.0
export const MAX_SESSIONS_PER_DAY = 1000
export const MAX_SESSION_DURATION_MS = 2_700_000 // 45 min — P99+20% of todo_reviewer E2E

/** File locking constants */
export const LOCK_TIMEOUT_MS = 5000
export const STALE_LOCK_AGE_MS = 60000
export const LOCK_POLL_MS = 50
export const LOCK_JITTER_MS = 25

/** Phase 5a: AIQueryRequest security validation constants */
export const MAX_TURNS = 100
export const MAX_QUERY_BUDGET_USD = 5.0
export const MAX_TIMEOUT_MS = 600000 // 10 minutes
export const MAX_PROMPT_LENGTH = 100000
export const MAX_SYSTEM_PROMPT_LENGTH = 50000

/** Shutdown cost aggregation waits */
export const SHUTDOWN_COST_WAIT_MS = 100
export const SHUTDOWN_COST_WAIT_MAX_MS = 4000

/** Timeout constants for async operations */
export const HOOK_TIMEOUT_MS = 5000
export const VALIDATION_TIMEOUT_MS = 2000
export const OUTPUT_SCHEMA_TIMEOUT_MS = 5000
export const CUSTOM_TOOL_TIMEOUT_MS = 10000

/** Watchdog timeouts for SDK query lifecycle */
export const SDK_IDLE_TIMEOUT_MS = 900_000 // 15 min — no SDK message = assume dead (max query 7.6m + API stall buffer)
export const SDK_HARD_TIMEOUT_MS = 1_800_000 // 30 min — absolute max per query
export const INVOCATION_HARD_TIMEOUT_MS = 2_700_000 // 45 min — max per capability invocation (P99=37.8m + 20%)
export const PROCESS_RESULT_TIMEOUT_MS = 3_600_000 // 60 min — max for processResult orchestration (covers multi-project loops)

/** Per-project wall-clock timeout for audit-fix loop */
export const AUDIT_FIX_PROJECT_TIMEOUT_MS = 1_200_000 // 20 min — max elapsed time per project in audit-fix loop

/** Worker pool configuration */
export const WORKER_POOL_SIZE = 4
export const WORKER_MEMORY_LIMIT_HOOKS_MB = 25
export const WORKER_MEMORY_LIMIT_TOOLS_MB = 50

/** Audit and rate limiting */
export const AUDIT_BUFFER_MAX_ENTRIES = 100
export const BYPASS_RATE_LIMIT_PER_MIN = 10

/** MCP server security (env-driven with safe defaults) */
export const ALLOW_HTTP_MCP_SERVERS = process.env.ALLOW_HTTP_MCP_SERVERS === 'true'

/** HTTP MCP server URL whitelist (empty default = none allowed) */
export const HTTP_MCP_URL_WHITELIST: readonly string[] = []

/** MCP server whitelist (empty default = all allowed) */
export const MCP_SERVER_WHITELIST: Readonly<Record<string, never>> = {}

/** Allowed permission modes for capabilities (env-driven with safe default) */
export const ALLOWED_PERMISSION_MODES: readonly ('ask' | 'allow' | 'deny')[] = (() => {
  const mode = process.env.PERMISSION_MODE
  if (mode === 'allow') return ['allow']
  if (mode === 'deny') return ['deny']
  return ['ask'] // Default to most restrictive
})()

/** AI Provider configuration */
export const PROVIDER_CONFIG = {
  /** Default provider for AI queries */
  defaultProvider: 'claude' as const,
  /** Available AI providers */
  availableProviders: ['claude'] as const,
} as const

/** Runtime-configurable commit tag for identifying auto-generated commits. */
export function getCommitTag(): string {
  return getProjectConfig().commitTag
}
