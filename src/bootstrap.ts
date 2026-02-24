/**
 * Bootstrap helper for starting the MCP server.
 *
 * Auto-detects monorepo root and submodule path, then loads
 * ts-engineer.config.json from the monorepo root if it exists.
 *
 * Usage (zero config — just run it):
 *   node packages/mcp-ts-engineer/build/bin.js
 *
 * Or with explicit config:
 *   import { bootstrap } from "@shared/mcp-ts-engineer";
 *   bootstrap({ serverName: "MyServer", ... });
 */

import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { registerAllCapabilities } from './capabilities/index.js'
import type { ProjectConfig } from './config/index.js'
import { loadProjectConfig } from './config/load-config.js'
import { Logger } from './core/logger/logger.js'
import { createServer, type ServerContext } from './server.js'

/**
 * Bootstrap the MCP server: auto-load config, register capabilities,
 * connect transport, and set up graceful shutdown handlers.
 *
 * @param config - Optional explicit ProjectConfig. If omitted, auto-detects
 *                 paths and loads ts-engineer.config.json from monorepo root.
 */
export async function bootstrap(config?: ProjectConfig): Promise<void> {
  const resolvedConfig = config ?? loadProjectConfig()
  const logger = new Logger()
  let serverContext: ServerContext | null = null

  async function gracefulShutdown(signal: string): Promise<void> {
    logger.info(`Received ${signal}, shutting down gracefully...`)

    if (serverContext) {
      try {
        await serverContext.registry.gracefulShutdown()
      } catch (error) {
        logger.error(`Shutdown error: ${error instanceof Error ? error.message : String(error)}`)
      }
    }

    logger.info('Shutdown complete')
    process.exit(0)
  }

  // Setup graceful shutdown handlers
  let shutdownInProgress = false
  let forceExitTimer: NodeJS.Timeout | null = null

  const handleShutdown = (signal: string): void => {
    if (shutdownInProgress) {
      logger.warn('Forced shutdown - double signal received')
      process.exit(1)
    }

    shutdownInProgress = true

    if (!forceExitTimer) {
      forceExitTimer = setTimeout(() => {
        logger.error('Forced exit - shutdown took too long')
        process.exit(1)
      }, 5000)
      forceExitTimer.unref()
    }

    gracefulShutdown(signal).catch((err) => {
      logger.error(`Shutdown failed: ${err}`)
      process.exit(1)
    })
  }

  process.on('SIGINT', () => handleShutdown('SIGINT'))
  process.on('SIGTERM', () => handleShutdown('SIGTERM'))

  try {
    logger.info('MCP server initializing...')
    logger.info('Authentication: Using Claude Code CLI subscription')

    serverContext = createServer(resolvedConfig)
    const { server, registry } = serverContext

    registerAllCapabilities(registry)
    registry.bindToMcpServer(server)

    const transport = new StdioServerTransport()
    await server.connect(transport)

    logger.info('MCP server running on stdio')
    logger.debug(
      `Capability registry initialized with ${registry.listCapabilities().length} capabilities`,
    )
  } catch (err) {
    logger.error(`Fatal error: ${err instanceof Error ? err.message : String(err)}`, {
      error:
        err instanceof Error ? { name: err.name, message: err.message, stack: err.stack } : err,
    })
    process.exit(1)
  }
}
