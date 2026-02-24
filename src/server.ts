/**
 * MCP server factory.
 * Initializes all framework dependencies.
 */

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { getServerInfo, initProjectConfig, type ProjectConfig } from './config/index.js'
import {
  createAIProvider,
  getRegisteredProviders,
  registerProvider,
} from './core/ai-provider/ai-provider.factory.js'
import { CapabilityRegistry } from './core/capability-registry/index.js'
import { CostTracker } from './core/cost/cost.tracker.js'
import { CostReportWriter } from './core/cost/cost-report.writer.js'
import { DiskWriter } from './core/logger/disk-writer.js'
import { Logger } from './core/logger/logger.js'
import { PromptLoader } from './core/prompt/prompt.loader.js'
import { SessionManager } from './core/session/session.manager.js'
import { ClaudeProvider } from './providers/claude/claude.provider.js'

/** Server and framework dependencies */
export interface ServerContext {
  /** MCP server instance */
  server: McpServer
  /** Capability registry */
  registry: CapabilityRegistry
  /** Session manager */
  sessionManager: SessionManager
  /** Cost tracker */
  costTracker: CostTracker
  /** Cost report writer */
  costReportWriter: CostReportWriter
  /** Disk writer */
  diskWriter: DiskWriter
  /** Prompt loader */
  promptLoader: PromptLoader
  /** Logger */
  logger: Logger
}

/**
 * Create and configure the MCP server instance with framework dependencies.
 *
 * @param config - Optional ProjectConfig. If provided, initializes the global config
 *                 before creating the server. Required for submodule usage.
 * @returns Server context with initialized dependencies
 */
export function createServer(config?: ProjectConfig): ServerContext {
  if (config) {
    initProjectConfig(config)
  }
  const serverInfo = getServerInfo()
  const server = new McpServer({
    name: serverInfo.name,
    version: serverInfo.version,
  })

  // Register AI providers (only if not already registered)
  if (!getRegisteredProviders().includes('claude')) {
    registerProvider('claude', () => new ClaudeProvider())
  }

  // Initialize framework dependencies
  const sessionManager = new SessionManager()
  const costTracker = new CostTracker()
  const costReportWriter = new CostReportWriter()
  const diskWriter = new DiskWriter()
  const promptLoader = new PromptLoader()
  const logger = new Logger({ diskWriter })
  const aiProvider = createAIProvider({ name: 'claude' })

  // Create capability registry with all dependencies
  const registry = new CapabilityRegistry({
    sessionManager,
    costTracker,
    costReportWriter,
    diskWriter,
    promptLoader,
    logger,
    aiProvider,
  })

  return {
    server,
    registry,
    sessionManager,
    costTracker,
    costReportWriter,
    diskWriter,
    promptLoader,
    logger,
  }
}
