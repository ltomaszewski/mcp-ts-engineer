/**
 * Entry point for running the MCP server directly.
 * Uses default ProjectConfig (backward-compatible with mcp-ts-engineer).
 *
 * For submodule usage, consuming apps should import { bootstrap } from the library
 * and call it with their own ProjectConfig.
 */

import { bootstrap } from './bootstrap.js'

bootstrap()
