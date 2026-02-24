/**
 * AI Provider factory with registry pattern.
 * Allows registration and creation of different AI provider implementations.
 */

import { ConfigError } from '../errors.js'
import type { AIProvider } from './ai-provider.types.js'

/** Configuration for creating an AI provider */
export interface ProviderConfig {
  /** Provider name (e.g., "claude", "openai") */
  name: string
  /** Provider-specific options */
  options?: Record<string, unknown>
}

/** Factory function for creating provider instances */
export type ProviderFactory = (options?: Record<string, unknown>) => AIProvider

/** Global provider registry */
const providerRegistry = new Map<string, ProviderFactory>()

/** Valid provider name pattern */
const PROVIDER_NAME_PATTERN = /^[a-z0-9_-]+$/

/**
 * Register a provider factory.
 *
 * @param name - Provider name (lowercase, alphanumeric, hyphens, underscores)
 * @param factory - Factory function that creates provider instances
 * @throws {AgentFrameworkError} If name is invalid or already registered
 *
 * @example
 * ```typescript
 * registerProvider("claude", (options) => new ClaudeProvider(options));
 * ```
 */
export function registerProvider(name: string, factory: ProviderFactory): void {
  if (!PROVIDER_NAME_PATTERN.test(name)) {
    throw new ConfigError(`Invalid provider name: ${name}. Must match ${PROVIDER_NAME_PATTERN}`)
  }

  if (providerRegistry.has(name)) {
    throw new ConfigError(`Provider "${name}" is already registered`)
  }

  providerRegistry.set(name, factory)
}

/**
 * Create an AI provider instance.
 *
 * @param config - Provider configuration
 * @returns Configured AI provider instance
 * @throws {AgentFrameworkError} If provider is not registered
 *
 * @example
 * ```typescript
 * const provider = createAIProvider({
 *   name: "claude",
 *   options: { apiKey: "sk-..." }
 * });
 * ```
 */
export function createAIProvider(config: ProviderConfig): AIProvider {
  const factory = providerRegistry.get(config.name)

  if (!factory) {
    throw new ConfigError(
      `Provider "${config.name}" not found. Available: ${Array.from(providerRegistry.keys()).join(', ')}`,
    )
  }

  return factory(config.options)
}

/**
 * Get list of registered provider names.
 *
 * @returns Array of registered provider names
 * @internal Test utility
 */
export function getRegisteredProviders(): string[] {
  return Array.from(providerRegistry.keys())
}

/**
 * Clear all registered providers.
 *
 * @internal Test utility only
 */
export function clearProviderRegistry(): void {
  providerRegistry.clear()
}
