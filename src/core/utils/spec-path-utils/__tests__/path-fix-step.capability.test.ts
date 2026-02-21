import { vi } from "vitest";
/**
 * Unit tests for path fix step capability.
 * Tests capability metadata, prompt preparation, and result processing.
 */

import { pathFixStepCapability } from "../path-fix-step.capability.js";
import type {
  PathFixStepInput,
  PathFixStepOutput,
} from "../spec-path.schema.js";
import type { AIQueryResult } from "../../../ai-provider/ai-provider.types.js";
import type { CapabilityContext } from "../../../capability-registry/capability-registry.types.js";

// Helper to create mock context
function createMockContext(): CapabilityContext {
  return {
    session: {
      id: "test-session",
      state: "active",
      startedAt: "2026-02-05T00:00:00Z",
      invocations: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    },
    invocation: {
      id: "test-invocation",
      capability: "todo_path_fix_step",
      input: {},
      timestamp: "2026-02-05T00:00:00Z",
    },
    logger: {
      info: () => {},
      debug: () => {},
      error: () => {},
      warn: () => {},
    },
    getSessionCost: () => ({ totalCostUsd: 0, totalInputTokens: 0, totalOutputTokens: 0, totalTurns: 0 }),
    promptVersion: "v1",
    providerName: "ClaudeProvider",
    invokeCapability: vi.fn<(capabilityName: string, input: unknown) => Promise<unknown>>().mockResolvedValue({}),
  };
}

// Helper to create mock AI result
function createMockAiResult(
  content: string,
  structuredOutput?: PathFixStepOutput
): AIQueryResult {
  return {
    content,
    usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
    costUsd: 0.02,
    turns: 5,
    model: "haiku",
    terminationReason: "success",
    structuredOutput,
    trace: {
      tid: "testtrace00000000000000000000000",
      startedAt: "2026-02-05T00:00:00Z",
      request: { prompt: "test" },
      turns: [],
    },
  };
}

describe("pathFixStepCapability", () => {
  describe("metadata", () => {
    it("has correct id", () => {
      expect(pathFixStepCapability.id).toBe("todo_path_fix_step");
    });

    it("has type 'tool'", () => {
      expect(pathFixStepCapability.type).toBe("tool");
    });

    it("has visibility 'internal'", () => {
      expect(pathFixStepCapability.visibility).toBe("internal");
    });

    it("has descriptive name", () => {
      expect(pathFixStepCapability.name).toBe("Todo Path Fix Step (Internal)");
    });

    it("has non-empty description", () => {
      expect(pathFixStepCapability.description).toBeTruthy();
      expect(pathFixStepCapability.description.toLowerCase()).toContain("internal");
    });
  });

  describe("defaultRequestOptions", () => {
    it("uses haiku model for cost efficiency", () => {
      expect(pathFixStepCapability.defaultRequestOptions?.model).toBe("haiku");
    });

    it("sets maxTurns to 20", () => {
      expect(pathFixStepCapability.defaultRequestOptions?.maxTurns).toBe(20);
    });

    it("sets maxBudgetUsd to $0.50", () => {
      expect(pathFixStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(
        0.5
      );
    });

    it("uses claude_code preset for tools", () => {
      expect(pathFixStepCapability.defaultRequestOptions?.tools).toEqual({
        type: "preset",
        preset: "claude_code",
      });
    });

    it("uses bypassPermissions for autonomous operation", () => {
      expect(
        pathFixStepCapability.defaultRequestOptions?.permissionMode
      ).toBe("bypassPermissions");
      expect(
        pathFixStepCapability.defaultRequestOptions
          ?.allowDangerouslySkipPermissions
      ).toBe(true);
    });

    it("includes outputSchema for structured output", () => {
      expect(
        pathFixStepCapability.defaultRequestOptions?.outputSchema
      ).toBeDefined();
      expect(
        pathFixStepCapability.defaultRequestOptions?.outputSchema
      ).toHaveProperty("type", "json_schema");
    });
  });

  describe("preparePromptInput", () => {
    it("extracts correct fields from PathFixStepInput", () => {
      const input: PathFixStepInput = {
        spec_path: "docs/specs/test/feature.md",
        spec_content: "# Test\nSome content with paths",
        target_app: "mcp-ts-engineer",
        uncorrectable_paths: ["core/utils/index.ts", "lib/helpers.ts"],
        cwd: "/Users/dev/project",
      };

      const mockContext = createMockContext();
      const result = pathFixStepCapability.preparePromptInput(
        input,
        mockContext
      );

      expect(result).toEqual({
        specPath: "docs/specs/test/feature.md",
        specContent: "# Test\nSome content with paths",
        targetApp: "mcp-ts-engineer",
        uncorrectablePaths: ["core/utils/index.ts", "lib/helpers.ts"],
        cwd: "/Users/dev/project",
      });
    });

    it("handles optional cwd field", () => {
      const input: PathFixStepInput = {
        spec_path: "docs/specs/test/feature.md",
        spec_content: "# Test",
        target_app: "mcp-ts-engineer",
        uncorrectable_paths: ["core/utils/index.ts"],
      };

      const mockContext = createMockContext();
      const result = pathFixStepCapability.preparePromptInput(
        input,
        mockContext
      ) as { specPath: string; specContent: string; targetApp: string; uncorrectablePaths: string[]; cwd?: string };

      expect(result.cwd).toBeUndefined();
    });
  });

  describe("processResult", () => {
    const mockInput: PathFixStepInput = {
      spec_path: "docs/specs/test/feature.md",
      spec_content: "# Test",
      target_app: "mcp-ts-engineer",
      uncorrectable_paths: ["core/utils/index.ts"],
    };

    const mockContext = createMockContext();

    it("parses structured output successfully", () => {
      const validOutput: PathFixStepOutput = {
        status: "SUCCESS",
        corrections: [
          {
            original: "core/utils/index.ts",
            corrected: "apps/mcp-ts-engineer/src/core/utils/index.ts",
            confidence: "high",
          },
        ],
        remaining_uncorrectable: [],
        corrected_content: "# Test\nCorrected content",
      };

      const mockAiResult = createMockAiResult(
        "Some text response",
        validOutput
      );

      const result = pathFixStepCapability.processResult(
        mockInput,
        mockAiResult,
        mockContext
      ) as PathFixStepOutput;

      expect(result).toEqual(validOutput);
    });

    it("returns fallback on parse failure", () => {
      const invalidStructuredOutput = {
        status: "INVALID_STATUS", // Not SUCCESS/PARTIAL/FAILED
        corrections: [],
        remaining_uncorrectable: [],
        corrected_content: "",
      };

      const mockAiResult = createMockAiResult(
        "Some text response",
        invalidStructuredOutput as any
      );

      const result = pathFixStepCapability.processResult(
        mockInput,
        mockAiResult,
        mockContext
      ) as PathFixStepOutput;

      expect(result.status).toBe("FAILED");
      expect(result.corrections).toEqual([]);
      expect(result.remaining_uncorrectable).toEqual([]);
    });

    it("returns fallback when no structured output or XML", () => {
      const mockAiResult = createMockAiResult(
        "Plain text response without XML tags"
      );

      const result = pathFixStepCapability.processResult(
        mockInput,
        mockAiResult,
        mockContext
      ) as PathFixStepOutput;

      expect(result.status).toBe("FAILED");
      expect(result.corrections).toEqual([]);
      expect(result.remaining_uncorrectable).toEqual([]);
      expect(result.corrected_content).toBe(
        mockAiResult.content.slice(0, 500)
      );
    });

    it("accepts PARTIAL status", () => {
      const partialOutput: PathFixStepOutput = {
        status: "PARTIAL",
        corrections: [
          {
            original: "core/utils/index.ts",
            corrected: "apps/mcp-ts-engineer/src/core/utils/index.ts",
            confidence: "medium",
          },
        ],
        remaining_uncorrectable: ["unknown/file.ts"],
        corrected_content: "# Test\nPartially corrected",
      };

      const mockAiResult = createMockAiResult("Response text", partialOutput);

      const result = pathFixStepCapability.processResult(
        mockInput,
        mockAiResult,
        mockContext
      ) as PathFixStepOutput;

      expect(result.status).toBe("PARTIAL");
      expect(result.corrections).toHaveLength(1);
      expect(result.remaining_uncorrectable).toEqual(["unknown/file.ts"]);
    });

    it("validates confidence levels", () => {
      const outputWithConfidence: PathFixStepOutput = {
        status: "SUCCESS",
        corrections: [
          {
            original: "core/utils/index.ts",
            corrected: "apps/mcp-ts-engineer/src/core/utils/index.ts",
            confidence: "high",
          },
          {
            original: "lib/helpers.ts",
            corrected: "apps/mcp-ts-engineer/src/lib/helpers.ts",
            confidence: "medium",
          },
          {
            original: "utils/unknown.ts",
            corrected: "apps/mcp-ts-engineer/src/utils/unknown.ts",
            confidence: "low",
          },
        ],
        remaining_uncorrectable: [],
        corrected_content: "Corrected content",
      };

      const mockAiResult = createMockAiResult("Response", outputWithConfidence);

      const result = pathFixStepCapability.processResult(
        mockInput,
        mockAiResult,
        mockContext
      ) as PathFixStepOutput;

      expect(result.corrections).toHaveLength(3);
      expect(result.corrections[0].confidence).toBe("high");
      expect(result.corrections[1].confidence).toBe("medium");
      expect(result.corrections[2].confidence).toBe("low");
    });
  });

  describe("inputSchema validation", () => {
    it("accepts valid input", () => {
      const validInput = {
        spec_path: "docs/specs/test/feature.md",
        spec_content: "# Test content",
        target_app: "mcp-ts-engineer",
        uncorrectable_paths: ["core/utils/index.ts"],
        cwd: "/Users/dev/project",
      };

      const result =
        pathFixStepCapability.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });

    it("rejects empty spec_path", () => {
      const invalidInput = {
        spec_path: "",
        spec_content: "# Test",
        target_app: "mcp-ts-engineer",
        uncorrectable_paths: ["core/utils/index.ts"],
      };

      const result =
        pathFixStepCapability.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("rejects empty uncorrectable_paths array", () => {
      const invalidInput = {
        spec_path: "docs/specs/test/feature.md",
        spec_content: "# Test",
        target_app: "mcp-ts-engineer",
        uncorrectable_paths: [],
      };

      const result =
        pathFixStepCapability.inputSchema.safeParse(invalidInput);
      expect(result.success).toBe(false);
    });

    it("accepts missing cwd field", () => {
      const validInput = {
        spec_path: "docs/specs/test/feature.md",
        spec_content: "# Test",
        target_app: "mcp-ts-engineer",
        uncorrectable_paths: ["core/utils/index.ts"],
      };

      const result =
        pathFixStepCapability.inputSchema.safeParse(validInput);
      expect(result.success).toBe(true);
    });
  });
});
