/**
 * Tests for PromptLoader.
 * Validates version loading, current version resolution, and error handling.
 */

import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import { PromptLoader } from "../prompt.loader.js";
import type { PromptVersion, PromptRegistry } from "../prompt.types.js";
import {
  PromptVersionNotFoundError,
  PromptSunsetError,
} from "../../errors.js";

describe("PromptLoader", () => {
  let loader: PromptLoader;

  beforeEach(() => {
    loader = new PromptLoader();
  });

  describe("registerCapabilityPrompts", () => {
    it("registers prompts for a capability", () => {
      const registry: PromptRegistry = {
        v1: createMockPromptVersion("v1"),
      };

      expect(() => {
        loader.registerCapabilityPrompts("test-capability", registry, "v1");
      }).not.toThrow();
    });

    it("throws PromptVersionNotFoundError if current version not in registry", () => {
      const registry: PromptRegistry = {
        v1: createMockPromptVersion("v1"),
      };

      expect(() => {
        loader.registerCapabilityPrompts("test-capability", registry, "v2");
      }).toThrow(PromptVersionNotFoundError);
    });

    it("validates current version exists during registration", () => {
      const registry: PromptRegistry = {
        v1: createMockPromptVersion("v1"),
        v2: createMockPromptVersion("v2"),
      };

      expect(() => {
        loader.registerCapabilityPrompts(
          "test-capability",
          registry,
          "nonexistent"
        );
      }).toThrow(PromptVersionNotFoundError);
      expect(() => {
        loader.registerCapabilityPrompts(
          "test-capability",
          registry,
          "nonexistent"
        );
      }).toThrow(/Current version "nonexistent" not found in registry/);
    });
  });

  describe("getPrompt", () => {
    beforeEach(() => {
      const registry: PromptRegistry = {
        v1: createMockPromptVersion("v1"),
        v2: createMockPromptVersion("v2", { deprecated: true }),
        v3: createMockPromptVersion("v3", {
          sunsetDate: "2020-01-01",
        }),
      };
      loader.registerCapabilityPrompts("test-capability", registry, "v2");
    });

    it("returns prompt for specified version", () => {
      const prompt = loader.getPrompt("test-capability", "v1");
      expect(prompt.version).toBe("v1");
    });

    it("returns current version when version not specified", () => {
      const prompt = loader.getPrompt("test-capability");
      expect(prompt.version).toBe("v2");
    });

    it("throws PromptVersionNotFoundError for unknown capability", () => {
      expect(() => {
        loader.getPrompt("unknown-capability");
      }).toThrow(PromptVersionNotFoundError);
      expect(() => {
        loader.getPrompt("unknown-capability");
      }).toThrow(/Capability "unknown-capability" not registered/);
    });

    it("throws PromptVersionNotFoundError for unknown version", () => {
      expect(() => {
        loader.getPrompt("test-capability", "v99");
      }).toThrow(PromptVersionNotFoundError);
      expect(() => {
        loader.getPrompt("test-capability", "v99");
      }).toThrow(/Version "v99" not found for capability "test-capability"/);
    });

    it("throws PromptSunsetError if past sunset date", () => {
      expect(() => {
        loader.getPrompt("test-capability", "v3");
      }).toThrow(PromptSunsetError);
      expect(() => {
        loader.getPrompt("test-capability", "v3");
      }).toThrow(/Version "v3" has been sunset/);
    });

    it("returns deprecated version without logging (logging handled by registry)", () => {
      const prompt = loader.getPrompt("test-capability", "v2");

      // Should return the prompt even if deprecated
      expect(prompt.version).toBe("v2");
      expect(prompt.deprecated).toBe(true);

      // Note: Deprecation warnings are now handled by CapabilityRegistry with proper logger,
      // not by PromptLoader with console.warn
    });
  });

  describe("getCurrentVersion", () => {
    it("returns current version string for capability", () => {
      const registry: PromptRegistry = {
        v1: createMockPromptVersion("v1"),
        v2: createMockPromptVersion("v2"),
      };
      loader.registerCapabilityPrompts("test-capability", registry, "v2");

      const currentVersion = loader.getCurrentVersion("test-capability");
      expect(currentVersion).toBe("v2");
    });

    it("throws PromptVersionNotFoundError for unknown capability", () => {
      expect(() => {
        loader.getCurrentVersion("unknown-capability");
      }).toThrow(PromptVersionNotFoundError);
    });
  });

  describe("listVersions", () => {
    it("returns all version strings for capability", () => {
      const registry: PromptRegistry = {
        v1: createMockPromptVersion("v1"),
        v2: createMockPromptVersion("v2"),
        v3: createMockPromptVersion("v3"),
      };
      loader.registerCapabilityPrompts("test-capability", registry, "v3");

      const versions = loader.listVersions("test-capability");
      expect(versions).toEqual(["v1", "v2", "v3"]);
    });

    it("throws PromptVersionNotFoundError for unknown capability", () => {
      expect(() => {
        loader.listVersions("unknown-capability");
      }).toThrow(PromptVersionNotFoundError);
    });
  });

  describe("echo-agent v1 integration", () => {
    it("builds correct prompt structure from v1", () => {
      const registry: PromptRegistry = {
        v1: createMockPromptVersion("v1", {
          buildFn: (input: unknown) => {
            const { prompt } = input as { prompt: string };
            return {
              systemPrompt: undefined,
              userPrompt: prompt,
            };
          },
        }),
      };
      loader.registerCapabilityPrompts("echo-agent", registry, "v1");

      const promptVersion = loader.getPrompt("echo-agent", "v1");
      const built = promptVersion.build({ prompt: "Hello, world!" });

      expect(built).toEqual({
        systemPrompt: undefined,
        userPrompt: "Hello, world!",
      });
    });
  });
});

// Helper function to create mock PromptVersion
function createMockPromptVersion(
  version: string,
  options?: {
    deprecated?: boolean;
    sunsetDate?: string;
    buildFn?: (input: unknown) => { systemPrompt?: string; userPrompt: string };
  }
): PromptVersion {
  return {
    version,
    createdAt: "2026-01-27",
    description: `Test prompt ${version}`,
    deprecated: options?.deprecated ?? false,
    sunsetDate: options?.sunsetDate,
    build:
      options?.buildFn ??
      ((input: unknown) => ({
        systemPrompt: undefined,
        userPrompt: `Test prompt ${version}`,
      })),
  };
}
