/**
 * Tests for commit-step sub-capability definition (Session 3).
 */

import { commitStepCapability } from "../commit-step.capability.js";
import type { CommitStepInput } from "../todo-reviewer.schema.js";
import {
  createMockContext,
  createMockAiResult,
  VALID_REVIEW_SUMMARY,
  VALID_TDD_SUMMARY,
} from "./test-helpers.js";

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("commitStepCapability", () => {
  describe("definition metadata", () => {
    it("has correct id", () => {
      expect(commitStepCapability.id).toBe("todo_commit_step");
    });

    it("has correct type", () => {
      expect(commitStepCapability.type).toBe("tool");
    });

    it("has correct name", () => {
      expect(commitStepCapability.name).toBe("Todo Commit Step (Internal)");
    });

    it("has non-empty description", () => {
      expect(commitStepCapability.description).toBeTruthy();
      expect(commitStepCapability.description.length).toBeGreaterThan(0);
    });

    it("defaults to haiku model", () => {
      expect(commitStepCapability.defaultRequestOptions?.model).toBe("haiku");
    });

    it("defaults to 20 maxTurns", () => {
      expect(commitStepCapability.defaultRequestOptions?.maxTurns).toBe(20);
    });

    it("defaults to $0.50 budget", () => {
      expect(commitStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(0.5);
    });

    it("has prompt registry with v1", () => {
      expect(commitStepCapability.promptRegistry).toBeDefined();
      expect(commitStepCapability.promptRegistry.v1).toBeDefined();
    });

    it("has current prompt version v1", () => {
      expect(commitStepCapability.currentPromptVersion).toBe("v1");
    });

    it("has internal visibility", () => {
      expect(commitStepCapability.visibility).toBe("internal");
    });
  });

  describe("preparePromptInput", () => {
    it("extracts specPath, reviewSummary, tddSummary, and cwd", () => {
      const input: CommitStepInput = {
        spec_path: "docs/specs/feature.md",
        review_summary: VALID_REVIEW_SUMMARY,
        tdd_summary: VALID_TDD_SUMMARY,
        cwd: "/some/path",
      };
      const context = createMockContext();

      const result = commitStepCapability.preparePromptInput(input, context);

      expect(result).toEqual({
        specPath: "docs/specs/feature.md",
        reviewSummary: VALID_REVIEW_SUMMARY,
        tddSummary: VALID_TDD_SUMMARY,
        sessionId: "test-session",
        cwd: "/some/path",
      });
    });

    it("handles missing cwd", () => {
      const input: CommitStepInput = {
        spec_path: "docs/specs/feature.md",
        review_summary: VALID_REVIEW_SUMMARY,
        tdd_summary: VALID_TDD_SUMMARY,
      };
      const context = createMockContext();

      const result = commitStepCapability.preparePromptInput(input, context);

      expect(result).toEqual({
        specPath: "docs/specs/feature.md",
        reviewSummary: VALID_REVIEW_SUMMARY,
        tddSummary: VALID_TDD_SUMMARY,
        sessionId: "test-session",
        cwd: undefined,
      });
    });

    it("includes sessionId from context.session.id", () => {
      const input: CommitStepInput = {
        spec_path: "docs/specs/feature.md",
        review_summary: VALID_REVIEW_SUMMARY,
        tdd_summary: VALID_TDD_SUMMARY,
      };
      const context = createMockContext();
      context.session.id = "reviewer-session-456";

      const result = commitStepCapability.preparePromptInput(input, context) as Record<string, unknown>;

      expect(result.sessionId).toBe("reviewer-session-456");
    });
  });

  describe("processResult", () => {
    it("parses valid <commit_result> XML block", async () => {
      const commitResult = {
        committed: true,
        commit_sha: "abc1234",
        commit_message: "chore(spec): update",
        files_changed: ["docs/specs/feature.md"],
      };
      const content = `Commit done.\n<commit_result>${JSON.stringify(commitResult)}</commit_result>`;
      const aiResult = createMockAiResult(content);
      const input: CommitStepInput = {
        spec_path: "docs/specs/feature.md",
        review_summary: VALID_REVIEW_SUMMARY,
        tdd_summary: VALID_TDD_SUMMARY,
      };
      const context = createMockContext();

      const result = await commitStepCapability.processResult(input, aiResult, context);

      expect(result).toEqual(commitResult);
    });

    it("returns fallback on parse failure (no XML block)", async () => {
      const content = "No commit result block here.";
      const aiResult = createMockAiResult(content);
      const input: CommitStepInput = {
        spec_path: "docs/specs/feature.md",
        review_summary: VALID_REVIEW_SUMMARY,
        tdd_summary: VALID_TDD_SUMMARY,
      };
      const context = createMockContext();

      const result = await commitStepCapability.processResult(input, aiResult, context);

      expect(result.committed).toBe(false);
      expect(result.commit_sha).toBeNull();
      expect(result.commit_message).toBeNull();
      expect(result.files_changed).toEqual([]);
    });

    it("returns fallback on invalid JSON in XML block", async () => {
      const content = `<commit_result>not valid json</commit_result>`;
      const aiResult = createMockAiResult(content);
      const input: CommitStepInput = {
        spec_path: "docs/specs/feature.md",
        review_summary: VALID_REVIEW_SUMMARY,
        tdd_summary: VALID_TDD_SUMMARY,
      };
      const context = createMockContext();

      const result = await commitStepCapability.processResult(input, aiResult, context);

      expect(result.committed).toBe(false);
      expect(result.commit_sha).toBeNull();
    });
  });
});
