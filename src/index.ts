/**
 * mcp-ts-engineer — Library exports.
 *
 * Standalone usage: just run bin.ts (auto-detects config).
 * Programmatic usage: import and call bootstrap() or createServer().
 */

// Bootstrap (auto-detect + init + register + transport + shutdown)
export { bootstrap } from './bootstrap.js'
// Capability registration
export { registerAllCapabilities } from './capabilities/index.js'
export { loadProjectConfig } from './config/load-config.js'
// Config
export {
  type CodemapEntry,
  getProjectConfig,
  initProjectConfig,
  type ProjectConfig,
} from './config/project-config.js'
// Core types for advanced usage
export type { CapabilityDefinition } from './core/capability-registry/capability-registry.types.js'
export { CapabilityRegistry } from './core/capability-registry/index.js'
// Server factory
export { createServer, type ServerContext } from './server.js'
