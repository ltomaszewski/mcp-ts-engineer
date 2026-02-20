/**
 * Prompt version loader.
 * Manages versioned prompts for capabilities with current version tracking.
 */

import type { PromptVersion, PromptRegistry } from "./prompt.types.js";
import {
  PromptVersionNotFoundError,
  PromptSunsetError,
} from "../errors.js";

/** Registry entry with version metadata */
interface CapabilityPromptRegistry {
  registry: PromptRegistry;
  currentVersion: string;
}

/**
 * Loads and manages versioned prompts for capabilities.
 */
export class PromptLoader {
  private capabilities: Map<string, CapabilityPromptRegistry> = new Map();

  /**
   * Register prompts for a capability.
   * Validates that current version exists in registry.
   *
   * @param capabilityName - Name of the capability
   * @param registry - Map of version IDs to PromptVersion instances
   * @param currentVersion - Current active version (must exist in registry)
   * @throws {PromptVersionNotFoundError} If current version not in registry
   */
  registerCapabilityPrompts(
    capabilityName: string,
    registry: PromptRegistry,
    currentVersion: string
  ): void {
    // Validate current version exists
    if (!registry[currentVersion]) {
      throw new PromptVersionNotFoundError(
        `Current version "${currentVersion}" not found in registry for capability "${capabilityName}"`
      );
    }

    this.capabilities.set(capabilityName, {
      registry,
      currentVersion,
    });
  }

  /**
   * Get a prompt version for a capability.
   * Defaults to current version if not specified.
   *
   * @param capabilityName - Name of the capability
   * @param version - Optional version (defaults to current)
   * @returns The prompt version
   * @throws {PromptVersionNotFoundError} If capability or version not found
   * @throws {PromptSunsetError} If version is past sunset date
   */
  getPrompt(capabilityName: string, version?: string): PromptVersion {
    const capability = this.capabilities.get(capabilityName);
    if (!capability) {
      throw new PromptVersionNotFoundError(
        `Capability "${capabilityName}" not registered`
      );
    }

    const targetVersion = version ?? capability.currentVersion;
    const prompt = capability.registry[targetVersion];

    if (!prompt) {
      throw new PromptVersionNotFoundError(
        `Version "${targetVersion}" not found for capability "${capabilityName}"`
      );
    }

    // Check sunset date
    if (prompt.sunsetDate) {
      const sunsetDate = new Date(prompt.sunsetDate);
      const now = new Date();
      if (now > sunsetDate) {
        throw new PromptSunsetError(
          `Version "${targetVersion}" has been sunset as of ${prompt.sunsetDate}`
        );
      }
    }

    // Note: Deprecation warnings should be logged at runtime by the capability registry
    // using the logger instance. This loader is stateless and doesn't have logger access.
    // The warning is intentionally not logged here to avoid direct console usage.

    return prompt;
  }

  /**
   * Get current version string for a capability.
   *
   * @param capabilityName - Name of the capability
   * @returns Current version string
   * @throws {PromptVersionNotFoundError} If capability not registered
   */
  getCurrentVersion(capabilityName: string): string {
    const capability = this.capabilities.get(capabilityName);
    if (!capability) {
      throw new PromptVersionNotFoundError(
        `Capability "${capabilityName}" not registered`
      );
    }
    return capability.currentVersion;
  }

  /**
   * List all available versions for a capability.
   *
   * @param capabilityName - Name of the capability
   * @returns Array of version strings
   * @throws {PromptVersionNotFoundError} If capability not registered
   */
  listVersions(capabilityName: string): string[] {
    const capability = this.capabilities.get(capabilityName);
    if (!capability) {
      throw new PromptVersionNotFoundError(
        `Capability "${capabilityName}" not registered`
      );
    }
    return Object.keys(capability.registry);
  }
}
