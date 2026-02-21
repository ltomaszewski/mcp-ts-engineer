/**
 * Tests for commit-step sub-capability definition (AC-7).
 * Tests preparePromptInput builds commit input, processResult handles
 * structured output and XML fallback, returns fallback on failure.
 */

import { describe, it, expect } from "@jest/globals";
import { jest } from "@jest/globals";
import { auditFixCommitStepCapability } from "../commit-step.capability.js";
import type { CommitStepInput } from "../audit-fix.schema.js";
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
      capability: "audit_fix_commit_step",
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
    turns: 3,
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

describe("auditFixCommitStepCapability", () => {
  describe("definition metadata", () => {
    it("has budget of $5.0 and 40 turns (Haiku)", () => {
      expect(auditFixCommitStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(5.0);
      expect(auditFixCommitStepCapability.defaultRequestOptions?.maxTurns).toBe(40);
    });
  });

  describe("preparePromptInput", () => {
    it("builds commit input with project_path and files_changed", () => {
      const input: CommitStepInput = {
        project_path: "apps/my-server",
        files_changed: ["src/service.ts", "src/utils.ts"],
        audit_summary: "Fixed 3 race conditions",
        cwd: "/path/to/monorepo",
      };
      const context = createMockContext();

      const result = auditFixCommitStepCapability.preparePromptInput(input, context);

      expect(result).toEqual({
        projectPath: "apps/my-server",
        filesChanged: ["src/service.ts", "src/utils.ts"],
        auditSummary: "Fixed 3 race conditions",
        sessionId: "test-session",
        cwd: "/path/to/monorepo",
      });
    });

    it("includes sessionId from context.session.id", () => {
      const input: CommitStepInput = {
        project_path: "apps/my-server",
        files_changed: ["src/service.ts"],
        audit_summary: "Fixed 2 issues",
      };
      const context = createMockContext();
      context.session.id = "audit-fix-session-789";

      const result = auditFixCommitStepCapability.preparePromptInput(input, context) as Record<string, unknown>;

      expect(result.sessionId).toBe("audit-fix-session-789");
    });
  });

  describe("processResult", () => {
    it("parses structured output when available", async () => {
      const structured = {
        committed: true,
        commit_sha: "abc123",
        commit_message: "chore(server): auto-fix audit violations",
        files_changed: ["src/service.ts"],
      };
      const aiResult = createMockAiResult("text", structured);
      const input: CommitStepInput = {
        project_path: "apps/server",
        files_changed: ["src/service.ts"],
        audit_summary: "Fixed issues",
      };
      const context = createMockContext();

      const result = await auditFixCommitStepCapability.processResult(input, aiResult, context);

      expect(result).toEqual(structured);
    });

    it("falls back to commit_result XML", async () => {
      const commitResult = {
        committed: true,
        commit_sha: "def456",
        commit_message: "chore(utils): auto-fix audit violations",
        files_changed: ["src/util.ts"],
      };
      const content = `<commit_result>${JSON.stringify(commitResult)}</commit_result>`;
      const aiResult = createMockAiResult(content);
      const input: CommitStepInput = {
        project_path: "packages/utils",
        files_changed: ["src/util.ts"],
        audit_summary: "Fixed issues",
      };
      const context = createMockContext();

      const result = await auditFixCommitStepCapability.processResult(input, aiResult, context);

      expect(result).toEqual(commitResult);
    });

    it("returns fallback on failure", async () => {
      const content = "No commit result here.";
      const aiResult = createMockAiResult(content);
      const input: CommitStepInput = {
        project_path: "apps/server",
        files_changed: [],
        audit_summary: "Failed",
      };
      const context = createMockContext();

      const result = await auditFixCommitStepCapability.processResult(input, aiResult, context);

      expect(result.committed).toBe(false);
      expect(result.commit_sha).toBeNull();
      expect(result.commit_message).toBeNull();
      expect(result.files_changed).toEqual([]);
    });
  });
});
