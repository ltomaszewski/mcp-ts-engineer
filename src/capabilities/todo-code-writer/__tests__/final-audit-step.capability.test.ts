/**
 * Tests for final-audit-step sub-capability definition.
 */

import { describe, it, expect } from "@jest/globals";
import { jest } from "@jest/globals";
import { finalAuditStepCapability } from "../final-audit-step.capability.js";
import type { FinalAuditStepInput } from "../todo-code-writer.schema.js";
import type { AIQueryResult } from "../../../core/ai-provider/ai-provider.types.js";
import type { CapabilityContext } from "../../../core/capability-registry/capability-registry.types.js";

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function createMockContext(): CapabilityContext {
  return {
    session: {
      id: "test-session",
      state: "active",
      startedAt: "2026-01-30T00:00:00Z",
      invocations: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    },
    invocation: {
      id: "test-invocation",
      capability: "test_capability",
      input: {},
      timestamp: "2026-01-30T00:00:00Z",
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
    invokeCapability: jest.fn<CapabilityContext["invokeCapability"]>(),
  };
}

function createMockAiResult(content: string, structuredOutput?: Record<string, unknown>): AIQueryResult {
  return {
    content,
    structuredOutput,
    usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    costUsd: 0.1,
    turns: 5,
    terminationReason: "success",
    trace: {
      tid: "testtrace00000000000000000000000",
      startedAt: "2026-01-30T00:00:00Z",
      request: { prompt: "test" },
      turns: [],
    },
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("finalAuditStepCapability", () => {
  describe("definition metadata", () => {
    it("has correct id", () => {
      expect(finalAuditStepCapability.id).toBe("todo_code_writer_final_audit_step");
    });

    it("has correct type", () => {
      expect(finalAuditStepCapability.type).toBe("tool");
    });

    it("has correct visibility", () => {
      expect(finalAuditStepCapability.visibility).toBe("internal");
    });

    it("has non-empty name", () => {
      expect(finalAuditStepCapability.name).toBeTruthy();
      expect(finalAuditStepCapability.name.length).toBeGreaterThan(0);
    });

    it("has non-empty description", () => {
      expect(finalAuditStepCapability.description).toBeTruthy();
      expect(finalAuditStepCapability.description.length).toBeGreaterThan(0);
    });

    it("defaults to sonnet model", () => {
      expect(finalAuditStepCapability.defaultRequestOptions?.model).toBe("sonnet");
    });

    it("defaults to 50 maxTurns", () => {
      expect(finalAuditStepCapability.defaultRequestOptions?.maxTurns).toBe(50);
    });

    it("defaults to $3.0 budget", () => {
      expect(finalAuditStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(3.0);
    });

    it("has prompt registry with v1", () => {
      expect(finalAuditStepCapability.promptRegistry).toBeDefined();
      expect(finalAuditStepCapability.promptRegistry.v1).toBeDefined();
    });

    it("has current prompt version v1", () => {
      expect(finalAuditStepCapability.currentPromptVersion).toBe("v1");
    });

    it("has outputSchema configured", () => {
      expect(finalAuditStepCapability.defaultRequestOptions?.outputSchema).toBeDefined();
    });
  });

  describe("preparePromptInput", () => {
    it("extracts specPath, allModifiedFiles, and cwd", () => {
      const input: FinalAuditStepInput = {
        spec_path: "docs/specs/feature.md",
        all_modified_files: ["src/test1.ts", "src/test2.ts", "src/test3.ts"],
        cwd: "/some/path",
      };
      const context = createMockContext();

      const result = finalAuditStepCapability.preparePromptInput(input, context);

      expect(result).toEqual({
        specPath: "docs/specs/feature.md",
        allModifiedFiles: ["src/test1.ts", "src/test2.ts", "src/test3.ts"],
        cwd: "/some/path",
      });
    });

    it("handles missing cwd", () => {
      const input: FinalAuditStepInput = {
        spec_path: "docs/specs/feature.md",
        all_modified_files: ["src/test.ts"],
      };
      const context = createMockContext();

      const result = finalAuditStepCapability.preparePromptInput(input, context);

      expect(result).toEqual({
        specPath: "docs/specs/feature.md",
        allModifiedFiles: ["src/test.ts"],
        cwd: undefined,
      });
    });
  });

  describe("processResult", () => {
    it("uses structured output when available", async () => {
      const structuredOutput = {
        status: "pass" as const,
        issues_found: 0,
        summary: "Repository-wide audit passed",
      };
      const aiResult = createMockAiResult("Some content", structuredOutput);
      const input: FinalAuditStepInput = {
        spec_path: "docs/specs/feature.md",
        all_modified_files: ["src/test.ts"],
      };
      const context = createMockContext();

      const result = await finalAuditStepCapability.processResult(input, aiResult, context);

      expect(result).toEqual(structuredOutput);
    });

    it("falls back to XML parsing when structured output unavailable", async () => {
      const auditResult = {
        status: "warn",
        issues_found: 1,
        summary: "One integration issue detected",
      };
      const content = `Final audit complete.\n<final_audit_result>${JSON.stringify(auditResult)}</final_audit_result>`;
      const aiResult = createMockAiResult(content);
      const input: FinalAuditStepInput = {
        spec_path: "docs/specs/feature.md",
        all_modified_files: ["src/test.ts"],
      };
      const context = createMockContext();

      const result = await finalAuditStepCapability.processResult(input, aiResult, context);

      expect(result).toEqual(auditResult);
    });

    it("returns fallback on parse failure (no XML block)", async () => {
      const content = "No final audit result block here.";
      const aiResult = createMockAiResult(content);
      const input: FinalAuditStepInput = {
        spec_path: "docs/specs/feature.md",
        all_modified_files: ["src/test.ts"],
      };
      const context = createMockContext();

      const result = await finalAuditStepCapability.processResult(input, aiResult, context);

      expect(result.status).toBe("fail");
      expect(result.issues_found).toBe(0);
    });

    it("returns fallback on invalid JSON in XML block", async () => {
      const content = `<final_audit_result>not valid json</final_audit_result>`;
      const aiResult = createMockAiResult(content);
      const input: FinalAuditStepInput = {
        spec_path: "docs/specs/feature.md",
        all_modified_files: ["src/test.ts"],
      };
      const context = createMockContext();

      const result = await finalAuditStepCapability.processResult(input, aiResult, context);

      expect(result.status).toBe("fail");
    });

    it("returns fallback on invalid structured output schema", async () => {
      const invalidStructuredOutput = {
        status: "invalid_status", // Wrong enum value
        issues_found: "not_a_number", // Wrong type
        summary: "Test",
      };
      const aiResult = createMockAiResult("Content", invalidStructuredOutput);
      const input: FinalAuditStepInput = {
        spec_path: "docs/specs/feature.md",
        all_modified_files: ["src/test.ts"],
      };
      const context = createMockContext();

      const result = await finalAuditStepCapability.processResult(input, aiResult, context);

      expect(result.status).toBe("fail");
    });
  });
});
