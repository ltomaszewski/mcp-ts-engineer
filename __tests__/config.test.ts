/**
 * Tests for configuration constants.
 */

import {
  ALLOW_HTTP_MCP_SERVERS,
  AUDIT_BUFFER_MAX_ENTRIES,
  BLOCKED_TOOLS,
  BYPASS_RATE_LIMIT_PER_MIN,
  CUSTOM_TOOL_TIMEOUT_MS,
  getCommitTag,
  getDefaultLogDir,
  getMaxPromptLength,
  getServerInfo,
  HOOK_TIMEOUT_MS,
  LOCK_JITTER_MS,
  LOCK_POLL_MS,
  LOCK_TIMEOUT_MS,
  MAX_DAILY_BUDGET_USD,
  MAX_INVOCATIONS_PER_SESSION,
  MAX_PROMPT_LENGTH,
  MAX_QUERY_BUDGET_USD,
  MAX_SESSION_BUDGET_USD,
  MAX_SESSION_DURATION_MS,
  MAX_SESSIONS_PER_DAY,
  MAX_SYSTEM_PROMPT_LENGTH,
  MAX_TIMEOUT_MS,
  MAX_TRACE_ENTRY_SIZE_BYTES,
  MAX_TURNS,
  OUTPUT_SCHEMA_TIMEOUT_MS,
  PROVIDER_CONFIG,
  REDACT_MAX_INPUT_MB,
  SESSION_ID_ENTROPY_BYTES,
  SESSION_MAX_DEPTH,
  SHUTDOWN_COST_WAIT_MAX_MS,
  SHUTDOWN_COST_WAIT_MS,
  STALE_LOCK_AGE_MS,
  VALIDATION_TIMEOUT_MS,
  WORKER_MEMORY_LIMIT_HOOKS_MB,
  WORKER_MEMORY_LIMIT_TOOLS_MB,
  WORKER_POOL_SIZE,
} from '../src/config/constants.js'
import { deriveLogDir, getProjectConfig } from '../src/config/project-config.js'

describe('CONFIG', () => {
  describe('getServerInfo()', () => {
    it('has name property defined', () => {
      const info = getServerInfo()
      expect(info.name).toBeDefined()
      expect(typeof info.name).toBe('string')
      expect(info.name.length).toBeGreaterThan(0)
    })

    it('has version property defined', () => {
      const info = getServerInfo()
      expect(info.version).toBeDefined()
      expect(typeof info.version).toBe('string')
      expect(info.version).toMatch(/^\d+\.\d+\.\d+$/)
    })

    it('has correct default server name', () => {
      expect(getServerInfo().name).toBe('McpTsEngineer')
    })

    it('has valid default version format', () => {
      expect(getServerInfo().version).toBe('1.0.0')
    })

    it('returns object with name and version', () => {
      const info = getServerInfo()
      expect(Object.keys(info)).toContain('name')
      expect(Object.keys(info)).toContain('version')
    })
  })

  describe('BLOCKED_TOOLS', () => {
    it('is defined as an array', () => {
      expect(Array.isArray(BLOCKED_TOOLS)).toBe(true)
    })

    it('contains ts-engineer pattern to prevent recursion', () => {
      expect(BLOCKED_TOOLS).toContain('mcp__ts-engineer__*')
    })

    it('has at least one blocked tool pattern', () => {
      expect(BLOCKED_TOOLS.length).toBeGreaterThan(0)
    })

    it('all entries are strings', () => {
      BLOCKED_TOOLS.forEach((tool) => {
        expect(typeof tool).toBe('string')
      })
    })
  })

  describe('Phase 1: Logging Constants', () => {
    it('REDACT_MAX_INPUT_MB is defined and positive', () => {
      expect(REDACT_MAX_INPUT_MB).toBeDefined()
      expect(typeof REDACT_MAX_INPUT_MB).toBe('number')
      expect(REDACT_MAX_INPUT_MB).toBeGreaterThan(0)
      expect(REDACT_MAX_INPUT_MB).toBe(50)
    })

    it('SESSION_ID_ENTROPY_BYTES is defined and positive', () => {
      expect(SESSION_ID_ENTROPY_BYTES).toBeDefined()
      expect(typeof SESSION_ID_ENTROPY_BYTES).toBe('number')
      expect(SESSION_ID_ENTROPY_BYTES).toBeGreaterThan(0)
      expect(SESSION_ID_ENTROPY_BYTES).toBe(16)
    })
  })

  describe('Phase 2: AI Provider Constants', () => {
    it('MAX_TRACE_ENTRY_SIZE_BYTES is defined and equals 1MB', () => {
      expect(MAX_TRACE_ENTRY_SIZE_BYTES).toBeDefined()
      expect(typeof MAX_TRACE_ENTRY_SIZE_BYTES).toBe('number')
      expect(MAX_TRACE_ENTRY_SIZE_BYTES).toBe(1048576) // 1MB in bytes
    })
  })

  describe('Phase 3: Session Management Constants', () => {
    it('SESSION_MAX_DEPTH is defined and equals 5', () => {
      expect(SESSION_MAX_DEPTH).toBeDefined()
      expect(typeof SESSION_MAX_DEPTH).toBe('number')
      expect(SESSION_MAX_DEPTH).toBe(5)
    })

    it('MAX_INVOCATIONS_PER_SESSION is defined and equals 50', () => {
      expect(MAX_INVOCATIONS_PER_SESSION).toBeDefined()
      expect(typeof MAX_INVOCATIONS_PER_SESSION).toBe('number')
      expect(MAX_INVOCATIONS_PER_SESSION).toBe(50)
    })

    it('MAX_SESSION_BUDGET_USD is defined and equals 10.0', () => {
      expect(MAX_SESSION_BUDGET_USD).toBeDefined()
      expect(typeof MAX_SESSION_BUDGET_USD).toBe('number')
      expect(MAX_SESSION_BUDGET_USD).toBe(10.0)
    })

    it('MAX_DAILY_BUDGET_USD is defined and equals 500.0', () => {
      expect(MAX_DAILY_BUDGET_USD).toBeDefined()
      expect(typeof MAX_DAILY_BUDGET_USD).toBe('number')
      expect(MAX_DAILY_BUDGET_USD).toBe(500.0)
    })

    it('MAX_SESSIONS_PER_DAY is defined and equals 1000', () => {
      expect(MAX_SESSIONS_PER_DAY).toBeDefined()
      expect(typeof MAX_SESSIONS_PER_DAY).toBe('number')
      expect(MAX_SESSIONS_PER_DAY).toBe(1000)
    })

    it('MAX_SESSION_DURATION_MS is defined and equals 45 minutes', () => {
      expect(MAX_SESSION_DURATION_MS).toBeDefined()
      expect(typeof MAX_SESSION_DURATION_MS).toBe('number')
      expect(MAX_SESSION_DURATION_MS).toBe(2700000) // 45 minutes
    })
  })

  describe('Phase 3: File Locking Constants', () => {
    it('LOCK_TIMEOUT_MS is defined and equals 5000', () => {
      expect(LOCK_TIMEOUT_MS).toBeDefined()
      expect(typeof LOCK_TIMEOUT_MS).toBe('number')
      expect(LOCK_TIMEOUT_MS).toBe(5000)
    })

    it('STALE_LOCK_AGE_MS is defined and equals 60000', () => {
      expect(STALE_LOCK_AGE_MS).toBeDefined()
      expect(typeof STALE_LOCK_AGE_MS).toBe('number')
      expect(STALE_LOCK_AGE_MS).toBe(60000)
    })

    it('LOCK_POLL_MS is defined and equals 50', () => {
      expect(LOCK_POLL_MS).toBeDefined()
      expect(typeof LOCK_POLL_MS).toBe('number')
      expect(LOCK_POLL_MS).toBe(50)
    })

    it('LOCK_JITTER_MS is defined and equals 25', () => {
      expect(LOCK_JITTER_MS).toBeDefined()
      expect(typeof LOCK_JITTER_MS).toBe('number')
      expect(LOCK_JITTER_MS).toBe(25)
    })
  })

  describe('Phase 5a: AIQueryRequest Security Constants', () => {
    it('MAX_TURNS is defined and equals 100', () => {
      expect(MAX_TURNS).toBeDefined()
      expect(typeof MAX_TURNS).toBe('number')
      expect(MAX_TURNS).toBe(100)
    })

    it('MAX_QUERY_BUDGET_USD is defined and equals 8.0', () => {
      expect(MAX_QUERY_BUDGET_USD).toBeDefined()
      expect(typeof MAX_QUERY_BUDGET_USD).toBe('number')
      expect(MAX_QUERY_BUDGET_USD).toBe(8.0)
    })

    it('MAX_TIMEOUT_MS is defined and equals 600000', () => {
      expect(MAX_TIMEOUT_MS).toBeDefined()
      expect(typeof MAX_TIMEOUT_MS).toBe('number')
      expect(MAX_TIMEOUT_MS).toBe(600000)
    })

    it('MAX_PROMPT_LENGTH is defined and equals 200000', () => {
      expect(MAX_PROMPT_LENGTH).toBeDefined()
      expect(typeof MAX_PROMPT_LENGTH).toBe('number')
      expect(MAX_PROMPT_LENGTH).toBe(200000)
    })

    it('MAX_SYSTEM_PROMPT_LENGTH is defined and equals 50000', () => {
      expect(MAX_SYSTEM_PROMPT_LENGTH).toBeDefined()
      expect(typeof MAX_SYSTEM_PROMPT_LENGTH).toBe('number')
      expect(MAX_SYSTEM_PROMPT_LENGTH).toBe(50000)
    })

    it('SHUTDOWN_COST_WAIT_MS is defined and equals 100', () => {
      expect(SHUTDOWN_COST_WAIT_MS).toBeDefined()
      expect(typeof SHUTDOWN_COST_WAIT_MS).toBe('number')
      expect(SHUTDOWN_COST_WAIT_MS).toBe(100)
    })

    it('SHUTDOWN_COST_WAIT_MAX_MS is defined and equals 4000', () => {
      expect(SHUTDOWN_COST_WAIT_MAX_MS).toBeDefined()
      expect(typeof SHUTDOWN_COST_WAIT_MAX_MS).toBe('number')
      expect(SHUTDOWN_COST_WAIT_MAX_MS).toBe(4000)
    })

    it('HOOK_TIMEOUT_MS is defined and equals 5000', () => {
      expect(HOOK_TIMEOUT_MS).toBeDefined()
      expect(typeof HOOK_TIMEOUT_MS).toBe('number')
      expect(HOOK_TIMEOUT_MS).toBe(5000)
    })

    it('VALIDATION_TIMEOUT_MS is defined and equals 2000', () => {
      expect(VALIDATION_TIMEOUT_MS).toBeDefined()
      expect(typeof VALIDATION_TIMEOUT_MS).toBe('number')
      expect(VALIDATION_TIMEOUT_MS).toBe(2000)
    })

    it('OUTPUT_SCHEMA_TIMEOUT_MS is defined and equals 5000', () => {
      expect(OUTPUT_SCHEMA_TIMEOUT_MS).toBeDefined()
      expect(typeof OUTPUT_SCHEMA_TIMEOUT_MS).toBe('number')
      expect(OUTPUT_SCHEMA_TIMEOUT_MS).toBe(5000)
    })

    it('AUDIT_BUFFER_MAX_ENTRIES is defined and equals 100', () => {
      expect(AUDIT_BUFFER_MAX_ENTRIES).toBeDefined()
      expect(typeof AUDIT_BUFFER_MAX_ENTRIES).toBe('number')
      expect(AUDIT_BUFFER_MAX_ENTRIES).toBe(100)
    })

    it('BYPASS_RATE_LIMIT_PER_MIN is defined and equals 10', () => {
      expect(BYPASS_RATE_LIMIT_PER_MIN).toBeDefined()
      expect(typeof BYPASS_RATE_LIMIT_PER_MIN).toBe('number')
      expect(BYPASS_RATE_LIMIT_PER_MIN).toBe(10)
    })

    it('CUSTOM_TOOL_TIMEOUT_MS is defined and equals 10000', () => {
      expect(CUSTOM_TOOL_TIMEOUT_MS).toBeDefined()
      expect(typeof CUSTOM_TOOL_TIMEOUT_MS).toBe('number')
      expect(CUSTOM_TOOL_TIMEOUT_MS).toBe(10000)
    })

    it('WORKER_POOL_SIZE is defined and equals 4', () => {
      expect(WORKER_POOL_SIZE).toBeDefined()
      expect(typeof WORKER_POOL_SIZE).toBe('number')
      expect(WORKER_POOL_SIZE).toBe(4)
    })

    it('WORKER_MEMORY_LIMIT_HOOKS_MB is defined and equals 25', () => {
      expect(WORKER_MEMORY_LIMIT_HOOKS_MB).toBeDefined()
      expect(typeof WORKER_MEMORY_LIMIT_HOOKS_MB).toBe('number')
      expect(WORKER_MEMORY_LIMIT_HOOKS_MB).toBe(25)
    })

    it('WORKER_MEMORY_LIMIT_TOOLS_MB is defined and equals 50', () => {
      expect(WORKER_MEMORY_LIMIT_TOOLS_MB).toBeDefined()
      expect(typeof WORKER_MEMORY_LIMIT_TOOLS_MB).toBe('number')
      expect(WORKER_MEMORY_LIMIT_TOOLS_MB).toBe(50)
    })

    it('ALLOW_HTTP_MCP_SERVERS is defined and equals false by default', () => {
      expect(ALLOW_HTTP_MCP_SERVERS).toBeDefined()
      expect(typeof ALLOW_HTTP_MCP_SERVERS).toBe('boolean')
      expect(ALLOW_HTTP_MCP_SERVERS).toBe(false)
    })
  })

  describe('Phase 6: AI Provider Configuration', () => {
    it('PROVIDER_CONFIG is defined', () => {
      expect(PROVIDER_CONFIG).toBeDefined()
      expect(typeof PROVIDER_CONFIG).toBe('object')
    })

    it("PROVIDER_CONFIG has defaultProvider set to 'claude'", () => {
      expect(PROVIDER_CONFIG.defaultProvider).toBeDefined()
      expect(PROVIDER_CONFIG.defaultProvider).toBe('claude')
    })

    it('PROVIDER_CONFIG has availableProviders array', () => {
      expect(PROVIDER_CONFIG.availableProviders).toBeDefined()
      expect(Array.isArray(PROVIDER_CONFIG.availableProviders)).toBe(true)
    })

    it("PROVIDER_CONFIG availableProviders includes 'claude'", () => {
      expect(PROVIDER_CONFIG.availableProviders).toContain('claude')
    })

    it('PROVIDER_CONFIG availableProviders has at least one provider', () => {
      expect(PROVIDER_CONFIG.availableProviders.length).toBeGreaterThan(0)
    })

    it('PROVIDER_CONFIG is readonly (as const)', () => {
      // TypeScript ensures this at compile time via 'as const'
      // Runtime verification that properties exist
      expect(Object.keys(PROVIDER_CONFIG)).toContain('defaultProvider')
      expect(Object.keys(PROVIDER_CONFIG)).toContain('availableProviders')
    })
  })

  describe('getMaxPromptLength', () => {
    it('returns default for standard models', () => {
      expect(getMaxPromptLength('sonnet')).toBe(200000)
      expect(getMaxPromptLength('sonnet[1m]')).toBe(800000)
      expect(getMaxPromptLength(undefined)).toBe(200000)
    })

    it('returns 800K for 1M full model IDs', () => {
      expect(getMaxPromptLength('claude-sonnet-4-6-20250415[1m]')).toBe(800000)
      expect(getMaxPromptLength('claude-opus-4-6-20250415[1m]')).toBe(800000)
    })

    it('returns default for non-1M models', () => {
      expect(getMaxPromptLength('haiku')).toBe(200000)
      expect(getMaxPromptLength('opus')).toBe(200000)
    })
  })

  describe('getCommitTag()', () => {
    it("returns default value '[ts-engineer]'", () => {
      const tag = getCommitTag()
      expect(tag).toBeDefined()
      expect(typeof tag).toBe('string')
      expect(tag).toBe('[ts-engineer]')
    })

    it('returns bracket format for git grep', () => {
      expect(getCommitTag()).toMatch(/^\[.+\]$/)
    })
  })

  describe('deriveLogDir()', () => {
    it('converts PascalCase to kebab-case log path', () => {
      expect(deriveLogDir('MyProjectServer')).toBe('~/.claude/my-project-server/logs/')
    })

    it('converts default McpTsEngineer correctly', () => {
      expect(deriveLogDir('McpTsEngineer')).toBe('~/.claude/mcp-ts-engineer/logs/')
    })

    it('converts another PascalCase name correctly', () => {
      expect(deriveLogDir('AcmeTsEngineer')).toBe('~/.claude/acme-ts-engineer/logs/')
    })

    it('produces different paths for different server names', () => {
      const acmeDir = deriveLogDir('AcmeTsEngineer')
      const fooDir = deriveLogDir('FooBarServer')
      const defaultDir = deriveLogDir('McpTsEngineer')

      expect(acmeDir).not.toBe(fooDir)
      expect(acmeDir).not.toBe(defaultDir)
      expect(fooDir).not.toBe(defaultDir)
    })

    it('handles single word name', () => {
      expect(deriveLogDir('Engineer')).toBe('~/.claude/engineer/logs/')
    })

    it('handles already lowercase name', () => {
      expect(deriveLogDir('myserver')).toBe('~/.claude/myserver/logs/')
    })
  })

  describe('Log directory isolation', () => {
    it('default config logDir matches deriveLogDir output', () => {
      const config = getProjectConfig()
      expect(config.logDir).toBe(deriveLogDir(config.serverName))
    })

    it('getDefaultLogDir() returns project-config derived path', () => {
      expect(getDefaultLogDir()).toBe(deriveLogDir('McpTsEngineer'))
    })
  })
})
