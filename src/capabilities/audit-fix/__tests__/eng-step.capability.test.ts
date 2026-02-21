/**
 * Tests for eng-step sub-capability definition (AC-6).
 * Tests preparePromptInput calls detectWorkspace() and builds fix-mode input,
 * processResult parses XML and structured output, fallback on parse failure.
 */

import { describe, it, expect } from "@jest/globals";
import { jest } from "@jest/globals";
import { auditFixEngStepCapability } from "../eng-step.capability.js";
import type { EngStepInput } from "../audit-fix.schema.js";
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
      startedAt: "2026-02-01T00:00:00Z",
      invocations: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    },
    invocation: {
      id: "test-invocation",
      capability: "audit_fix_eng_step",
      input: {},
      timestamp: "2026-02-01T00:00:00Z",
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

function createMockAiResult(
  content: string,
  structuredOutput?: Record<string, unknown>,
): AIQueryResult {
  return {
    content,
    usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    costUsd: 0.1,
    turns: 5,
    terminationReason: "success",
    trace: {
      tid: "testtrace00000000000000000000000",
      startedAt: "2026-02-01T00:00:00Z",
      request: { prompt: "test" },
      turns: [],
    },
    structuredOutput,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("auditFixEngStepCapability", () => {
  describe("definition metadata", () => {
    it("has correct id", () => {
      expect(auditFixEngStepCapability.id).toBe("audit_fix_eng_step");
    });

    it("has visibility set to internal", () => {
      expect(auditFixEngStepCapability.visibility).toBe("internal");
    });
  });

  describe("preparePromptInput", () => {
    it("builds fix-mode input with audit summary and files with issues", () => {
      const input: EngStepInput = {
        project_path: "apps/my-server",
        audit_summary: "Found 3 race conditions",
        files_with_issues: ["src/service.ts", "src/hook.ts"],
        iteration_number: 1,
        cwd: "/path/to/monorepo",
      };
      const context = createMockContext();

      const result = auditFixEngStepCapability.preparePromptInput(
        input,
        context,
      ) as Record<string, unknown>;

      expect(result.projectPath).toBe("apps/my-server");
      expect(result.auditSummary).toBe("Found 3 race conditions");
      expect(result.filesWithIssues).toEqual(["src/service.ts", "src/hook.ts"]);
      expect(result.iterationNumber).toBe(1);
      expect(result.cwd).toBe("/path/to/monorepo");
      // detectWorkspace returns arrays (may be empty in test env)
      expect(Array.isArray(result.detectedTechnologies)).toBe(true);
      expect(Array.isArray(result.detectedDependencies)).toBe(true);
    });
  });

  describe("processResult", () => {
    it("uses structured output when available", async () => {
      const structured = {
        status: "success",
        files_modified: ["src/service.ts"],
        summary: "Fixed race condition",
      };
      const aiResult = createMockAiResult("text content", structured);
      const input: EngStepInput = {
        project_path: "apps/server",
        audit_summary: "Issues found",
        files_with_issues: ["src/service.ts"],
        iteration_number: 1,
      };
      const context = createMockContext();

      const result = await auditFixEngStepCapability.processResult(input, aiResult, context);

      expect(result).toEqual(structured);
    });

    it("parses eng_fix_result XML when no structured output", async () => {
      const fixResult = {
        status: "success",
        files_modified: ["src/file.ts"],
        summary: "Applied 2 fixes",
      };
      const content = `Done.\n<eng_fix_result>${JSON.stringify(fixResult)}</eng_fix_result>`;
      const aiResult = createMockAiResult(content);
      const input: EngStepInput = {
        project_path: "apps/server",
        audit_summary: "Issues found",
        files_with_issues: ["src/file.ts"],
        iteration_number: 1,
      };
      const context = createMockContext();

      const result = await auditFixEngStepCapability.processResult(input, aiResult, context);

      expect(result).toEqual(fixResult);
    });

    it("returns fallback on parse failure", async () => {
      const content = "No result block here.";
      const aiResult = createMockAiResult(content);
      const input: EngStepInput = {
        project_path: "apps/server",
        audit_summary: "Issues found",
        files_with_issues: [],
        iteration_number: 1,
      };
      const context = createMockContext();

      const result = await auditFixEngStepCapability.processResult(input, aiResult, context);

      expect(result.status).toBe("failed");
      expect(result.files_modified).toEqual([]);
      expect(result.summary).toContain(content);
    });
  });
});
