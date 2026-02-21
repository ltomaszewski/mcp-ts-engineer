/**
 * Tests for todo-reviewer orchestrator CapabilityDefinition.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import { todoReviewerCapability, ValidationError } from "../todo-reviewer.capability.js";
import type { TodoReviewerInput } from "../todo-reviewer.schema.js";
import type { CapabilityContext } from "../../../core/capability-registry/capability-registry.types.js";
import {
  createMockContext,
  createMockAiResult,
  VALID_REVIEW_SUMMARY,
  BLOCKED_REVIEW_SUMMARY,
  VALID_TDD_SUMMARY,
  FAIL_TDD_SUMMARY,
  WARN_TDD_SUMMARY,
  VALID_COMMIT_RESULT,
  VALID_SCAN_RESULT,
  WARN_SCAN_RESULT,
  FAIL_SCAN_RESULT,
  VALID_FIX_RESULT,
} from "./test-helpers.js";

// No mocking - path validation tests will use real test files

// ---------------------------------------------------------------------------
// Definition metadata
// ---------------------------------------------------------------------------

describe("todoReviewerCapability", () => {
  describe("definition metadata", () => {
    it("has correct id", () => {
      expect(todoReviewerCapability.id).toBe("todo_reviewer");
    });

    it("has correct type", () => {
      expect(todoReviewerCapability.type).toBe("tool");
    });

    it("has correct name", () => {
      expect(todoReviewerCapability.name).toBe("Todo Reviewer");
    });

    it("has non-empty description", () => {
      expect(todoReviewerCapability.description).toBeTruthy();
      expect(todoReviewerCapability.description.length).toBeGreaterThan(0);
    });

    it("has input schema", () => {
      expect(todoReviewerCapability.inputSchema).toBeDefined();
    });

    it("has prompt registry with v1", () => {
      expect(todoReviewerCapability.promptRegistry).toBeDefined();
      expect(todoReviewerCapability.promptRegistry.v1).toBeDefined();
    });

    it("has current prompt version v1", () => {
      expect(todoReviewerCapability.currentPromptVersion).toBe("v1");
    });

    it("defaults to public visibility when not specified", () => {
      expect(todoReviewerCapability.visibility).toBeUndefined();
    });
  });

  // ---------------------------------------------------------------------------
  // Default request options
  // ---------------------------------------------------------------------------

  describe("default request options", () => {
    it("has default request options", () => {
      expect(todoReviewerCapability.defaultRequestOptions).toBeDefined();
    });

    it("defaults to sonnet model", () => {
      expect(todoReviewerCapability.defaultRequestOptions?.model).toBe("sonnet");
    });

    it("defaults to 80 maxTurns", () => {
      expect(todoReviewerCapability.defaultRequestOptions?.maxTurns).toBe(80);
    });

    it("defaults to $5.00 budget", () => {
      expect(todoReviewerCapability.defaultRequestOptions?.maxBudgetUsd).toBe(5.0);
    });

    it("uses claude_code tools preset", () => {
      expect(todoReviewerCapability.defaultRequestOptions?.tools).toEqual({
        type: "preset",
        preset: "claude_code",
      });
    });

    it("uses bypassPermissions mode", () => {
      expect(todoReviewerCapability.defaultRequestOptions?.permissionMode).toBe("bypassPermissions");
    });

    it("allows dangerously skip permissions", () => {
      expect(todoReviewerCapability.defaultRequestOptions?.allowDangerouslySkipPermissions).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // preparePromptInput
  // ---------------------------------------------------------------------------

  describe("preparePromptInput", () => {
    it("extracts specPath from spec_path", () => {
      const input: TodoReviewerInput = {
        spec_path: "docs/specs/feature.md",
        model: "opus",
        iterations: 1,
      };
      const context = createMockContext();

      const result = todoReviewerCapability.preparePromptInput(input, context);

      expect(result).toEqual({ specPath: "docs/specs/feature.md", cwd: undefined });
    });

    it("passes cwd from input", () => {
      const input: TodoReviewerInput = {
        spec_path: "docs/specs/feature.md",
        model: "opus",
        iterations: 1,
        cwd: "/some/path",
      };
      const context = createMockContext();

      const result = todoReviewerCapability.preparePromptInput(input, context);

      expect(result).toEqual({ specPath: "docs/specs/feature.md", cwd: "/some/path" });
    });
  });

  // ---------------------------------------------------------------------------
  // processResult orchestration (single iteration, iterations=1)
  // ---------------------------------------------------------------------------

  describe("processResult (single iteration)", () => {
    let context: CapabilityContext;
    let mockInvoke: jest.Mock<CapabilityContext["invokeCapability"]>;
    let tempDir: string;

    beforeEach(async () => {
      const { mkdtempSync, mkdirSync, writeFileSync } = await import("fs");
      const { tmpdir } = await import("os");
      const { join } = await import("path");

      tempDir = mkdtempSync(join(tmpdir(), "todo-reviewer-unit-"));
      mkdirSync(join(tempDir, "docs", "specs"), { recursive: true });
      writeFileSync(
        join(tempDir, "docs", "specs", "feature.md"),
        "# Test Spec\n\nSimple spec for unit testing.\n",
        "utf-8",
      );

      context = createMockContext();
      mockInvoke = jest.fn<CapabilityContext["invokeCapability"]>();
      context.invokeCapability = mockInvoke;
    });

    afterEach(async () => {
      const { rmSync } = await import("fs");
      if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    });

    it("calls invokeCapability for tdd_validate and commit steps", async () => {
      const reviewJson = JSON.stringify(VALID_REVIEW_SUMMARY);
      const aiContent = `Review done.\n<review_summary>${reviewJson}</review_summary>`;
      const aiResult = createMockAiResult(aiContent);

      mockInvoke
        .mockResolvedValueOnce(VALID_SCAN_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT);

      const input: TodoReviewerInput = {
        spec_path: "docs/specs/feature.md",
        model: "opus",
        iterations: 1,
        cwd: tempDir,
      };

      const result = await todoReviewerCapability.processResult(input, aiResult, context);

      expect(mockInvoke).toHaveBeenCalledTimes(2);

      expect(mockInvoke).toHaveBeenNthCalledWith(1, "todo_tdd_scan_step", expect.objectContaining({
        spec_path: "docs/specs/feature.md",
        review_summary: expect.objectContaining({ status: "IN_REVIEW" }),
      }));

      expect(mockInvoke).toHaveBeenNthCalledWith(2, "todo_commit_step", expect.objectContaining({
        spec_path: "docs/specs/feature.md",
        review_summary: expect.objectContaining({ status: "IN_REVIEW" }),
        tdd_summary: expect.objectContaining({ status: "PASS" }),
      }));

      expect(result.iterations_completed).toBe(1);
    });

    it("returns status=success when review=READY and tdd=PASS", async () => {
      const reviewJson = JSON.stringify(VALID_REVIEW_SUMMARY);
      const aiContent = `<review_summary>${reviewJson}</review_summary>`;
      const aiResult = createMockAiResult(aiContent);

      mockInvoke
        .mockResolvedValueOnce(VALID_SCAN_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT);

      const input: TodoReviewerInput = {
        spec_path: "docs/specs/feature.md",
        model: "opus",
        iterations: 1,
        cwd: tempDir,
      };

      const result = await todoReviewerCapability.processResult(input, aiResult, context);

      expect(result.status).toBe("success");
    });

    it("returns status=failed when review=BLOCKED", async () => {
      const reviewJson = JSON.stringify(BLOCKED_REVIEW_SUMMARY);
      const aiContent = `<review_summary>${reviewJson}</review_summary>`;
      const aiResult = createMockAiResult(aiContent);

      mockInvoke
        .mockResolvedValueOnce(VALID_SCAN_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT);

      const input: TodoReviewerInput = {
        spec_path: "docs/specs/feature.md",
        model: "opus",
        iterations: 1,
        cwd: tempDir,
      };

      const result = await todoReviewerCapability.processResult(input, aiResult, context);

      expect(result.status).toBe("failed");
    });

    it("returns status=failed when tdd=FAIL", async () => {
      const reviewJson = JSON.stringify(VALID_REVIEW_SUMMARY);
      const aiContent = `<review_summary>${reviewJson}</review_summary>`;
      const aiResult = createMockAiResult(aiContent);

      mockInvoke
        .mockResolvedValueOnce(FAIL_SCAN_RESULT)
        .mockResolvedValueOnce(VALID_FIX_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT);

      const input: TodoReviewerInput = {
        spec_path: "docs/specs/feature.md",
        model: "opus",
        iterations: 1,
        cwd: tempDir,
      };

      const result = await todoReviewerCapability.processResult(input, aiResult, context);

      expect(result.status).toBe("failed");
    });

    it("uses fallback defaults when no parseable review_summary, still calls sub-capabilities", async () => {
      const aiContent = "No XML block here, just plain text review.";
      const aiResult = createMockAiResult(aiContent);

      mockInvoke
        .mockResolvedValueOnce(VALID_SCAN_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT);

      const input: TodoReviewerInput = {
        spec_path: "docs/specs/feature.md",
        model: "opus",
        iterations: 1,
        cwd: tempDir,
      };

      const result = await todoReviewerCapability.processResult(input, aiResult, context);

      expect(mockInvoke).toHaveBeenCalledTimes(2);
      expect(result.status).toBe("failed");
      expect(result.iterations_completed).toBe(1);
    });

    it("returns aggregated output with correct fields", async () => {
      const reviewJson = JSON.stringify(VALID_REVIEW_SUMMARY);
      const aiContent = `<review_summary>${reviewJson}</review_summary>`;
      const aiResult = createMockAiResult(aiContent);

      mockInvoke
        .mockResolvedValueOnce(VALID_SCAN_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT);

      const input: TodoReviewerInput = {
        spec_path: "docs/specs/feature.md",
        model: "opus",
        iterations: 1,
        cwd: tempDir,
      };

      const result = await todoReviewerCapability.processResult(input, aiResult, context);

      expect(result.commit_sha).toBe("abc1234");
      expect(result.commit_message).toBe("chore(spec): update");
      expect(result.files_changed).toEqual(["docs/specs/feature.md"]);
      expect(result.review_report).toBeTruthy();
      expect(result.tdd_report).toBeTruthy();
    });
  });

  // ---------------------------------------------------------------------------
  // processResult orchestration (multiple iterations)
  // ---------------------------------------------------------------------------

  describe("processResult (multiple iterations)", () => {
    let context: CapabilityContext;
    let mockInvoke: jest.Mock<CapabilityContext["invokeCapability"]>;
    let tempDir: string;

    beforeEach(async () => {
      const { mkdtempSync, mkdirSync, writeFileSync } = await import("fs");
      const { execSync } = await import("child_process");
      const { tmpdir } = await import("os");
      const { join } = await import("path");

      tempDir = mkdtempSync(join(tmpdir(), "todo-reviewer-multi-"));
      mkdirSync(join(tempDir, "docs", "specs"), { recursive: true });
      writeFileSync(
        join(tempDir, "docs", "specs", "feature.md"),
        "# Test Spec\n\nSimple spec for unit testing.\n",
        "utf-8",
      );

      // Init as git repo and commit the spec so fileNeedsCommit() returns false
      execSync("git init && git add -A && git commit -m 'init'", {
        cwd: tempDir,
        stdio: "pipe",
      });

      context = createMockContext();
      mockInvoke = jest.fn<CapabilityContext["invokeCapability"]>();
      context.invokeCapability = mockInvoke;
    });

    afterEach(async () => {
      const { rmSync } = await import("fs");
      if (tempDir) rmSync(tempDir, { recursive: true, force: true });
    });

    it("exits early when no changes detected after iteration 1", async () => {
      // Note: The capability exits early if fileNeedsCommit() returns false after iteration 1
      // This is intentional behavior to avoid redundant iterations when spec is stable
      const reviewJson = JSON.stringify(BLOCKED_REVIEW_SUMMARY);
      const aiContent = `<review_summary>${reviewJson}</review_summary>`;
      const aiResult = createMockAiResult(aiContent);

      mockInvoke.mockImplementation(async (capabilityName: string, _input: unknown) => {
        if (capabilityName === "todo_tdd_scan_step") {
          return FAIL_SCAN_RESULT;
        }
        if (capabilityName === "todo_tdd_fix_step") {
          return VALID_FIX_RESULT;
        }
        if (capabilityName === "todo_reviewer") {
          return {
            status: "failed",
            review_report: `<review_summary>${JSON.stringify(BLOCKED_REVIEW_SUMMARY)}</review_summary>`,
            tdd_report: "TDD failed",
            iterations_completed: 1,
            commit_sha: null,
            commit_message: null,
            files_changed: [],
          };
        }
        if (capabilityName === "todo_commit_step") {
          return VALID_COMMIT_RESULT;
        }
        return {};
      });

      const input: TodoReviewerInput = {
        spec_path: "docs/specs/feature.md",
        model: "opus",
        iterations: 3,
        cwd: tempDir,
      };

      const result = await todoReviewerCapability.processResult(input, aiResult, context);

      // With early exit (no file changes detected):
      // Iteration 1: tdd_scan (1) + tdd_fix (1) = 2
      // Iterations 2-3: skipped (no changes detected)
      // Final: commit (1) = 3 total
      expect(mockInvoke).toHaveBeenCalledTimes(3);
      expect(result.iterations_completed).toBe(1);
      expect(result.status).toBe("failed");
    });

    it("exits early with success when no changes and IN_REVIEW+PASS", async () => {
      // Note: The capability exits early if fileNeedsCommit() returns false after iteration 1
      // This is intentional behavior - spec is stable, no need for more iterations
      const reviewJson = JSON.stringify(VALID_REVIEW_SUMMARY);
      const aiContent = `<review_summary>${reviewJson}</review_summary>`;
      const aiResult = createMockAiResult(aiContent);

      mockInvoke.mockImplementation(async (capabilityName: string, _input: unknown) => {
        if (capabilityName === "todo_tdd_scan_step") {
          return VALID_SCAN_RESULT;
        }
        if (capabilityName === "todo_reviewer") {
          return {
            status: "success",
            review_report: `<review_summary>${JSON.stringify(VALID_REVIEW_SUMMARY)}</review_summary>`,
            tdd_report: "TDD pass",
            iterations_completed: 1,
            commit_sha: null,
            commit_message: null,
            files_changed: [],
          };
        }
        if (capabilityName === "todo_commit_step") {
          return VALID_COMMIT_RESULT;
        }
        return {};
      });

      const input: TodoReviewerInput = {
        spec_path: "docs/specs/feature.md",
        model: "opus",
        iterations: 3,
        cwd: tempDir,
      };

      const result = await todoReviewerCapability.processResult(input, aiResult, context);

      // With early exit (no file changes detected):
      // Iteration 1: tdd_validate (1)
      // Iterations 2-3: skipped (no changes detected)
      // Final: commit (1) = 2 total
      expect(mockInvoke).toHaveBeenCalledTimes(2);
      expect(result.iterations_completed).toBe(1);
      expect(result.status).toBe("success");
    });

    it("exits early with WARN status when no file changes detected", async () => {
      // Note: The capability exits early if fileNeedsCommit() returns false after iteration 1
      // WARN status doesn't prevent early exit - only actual file changes continue iterations
      const reviewJson = JSON.stringify(VALID_REVIEW_SUMMARY);
      const aiContent = `<review_summary>${reviewJson}</review_summary>`;
      const aiResult = createMockAiResult(aiContent);

      let callCount = 0;
      mockInvoke.mockImplementation(async (capabilityName: string, _input: unknown) => {
        callCount++;
        if (capabilityName === "todo_tdd_scan_step") {
          if (callCount === 1) return WARN_SCAN_RESULT;
          return VALID_SCAN_RESULT;
        }
        if (capabilityName === "todo_reviewer") {
          return {
            status: "success",
            review_report: `<review_summary>${JSON.stringify(VALID_REVIEW_SUMMARY)}</review_summary>`,
            tdd_report: "TDD pass",
            iterations_completed: 1,
            commit_sha: null,
            commit_message: null,
            files_changed: [],
          };
        }
        if (capabilityName === "todo_commit_step") {
          return VALID_COMMIT_RESULT;
        }
        return {};
      });

      const input: TodoReviewerInput = {
        spec_path: "docs/specs/feature.md",
        model: "opus",
        iterations: 2,
        cwd: tempDir,
      };

      const result = await todoReviewerCapability.processResult(input, aiResult, context);

      // With early exit (no file changes detected):
      // Iteration 1: tdd_validate(WARN) (1)
      // Iteration 2: skipped (no changes detected)
      // Final: commit (1) = 2 total
      expect(mockInvoke).toHaveBeenCalledTimes(2);
      expect(result.iterations_completed).toBe(1);
      expect(result.status).toBe("success");
    });
  });

  // ---------------------------------------------------------------------------
  // Path validation integration
  // ---------------------------------------------------------------------------

  describe("processResult (path validation integration)", () => {
    let context: CapabilityContext;
    let mockInvoke: jest.Mock<CapabilityContext["invokeCapability"]>;
    let tempDir: string;
    let warnSpy: jest.Mock;

    beforeEach(async () => {
      const { mkdtempSync } = await import("fs");
      const { tmpdir } = await import("os");
      const { join } = await import("path");

      // Create temp directory for test files
      tempDir = mkdtempSync(join(tmpdir(), "todo-reviewer-test-"));

      // Setup mock context with spy on logger.warn
      context = createMockContext();
      mockInvoke = jest.fn<CapabilityContext["invokeCapability"]>();
      context.invokeCapability = mockInvoke;
      warnSpy = jest.fn();
      context.logger.warn = warnSpy;
    });

    afterEach(async () => {
      const { rmSync } = await import("fs");
      // Clean up temp directory
      if (tempDir) {
        rmSync(tempDir, { recursive: true, force: true });
      }
    });

    it("passes validation when spec has all valid monorepo-rooted paths", async () => {
      const { writeFileSync } = await import("fs");
      const { join } = await import("path");

      const specFilename = "valid-spec.md";
      const specPath = join(tempDir, specFilename);
      const specContent = `
# Test Spec

## Files

| Path | Action |
|------|--------|
| apps/my-server/src/modules/user/user.service.ts | MODIFY |
| packages/types/src/api/user.types.ts | CREATE |

\`\`\`typescript
// apps/my-server/src/modules/user/user.resolver.ts
export class UserResolver {}
\`\`\`
      `;

      writeFileSync(specPath, specContent, "utf-8");

      const reviewJson = JSON.stringify({
        ...VALID_REVIEW_SUMMARY,
        target_app: "my-server",
      });
      const aiContent = `<review_summary>${reviewJson}</review_summary>`;
      const aiResult = createMockAiResult(aiContent);

      mockInvoke
        .mockResolvedValueOnce(VALID_SCAN_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT);

      const input: TodoReviewerInput = {
        spec_path: specFilename,
        model: "opus",
        iterations: 1,
        cwd: tempDir,
      };

      // Should not throw
      const result = await todoReviewerCapability.processResult(input, aiResult, context);

      // Verify no warnings logged (all paths valid)
      expect(warnSpy).not.toHaveBeenCalled();
      expect(result.status).toBe("success");
    });

    it("logs warnings and corrects spec with correctable src/ paths", async () => {
      const { writeFileSync, readFileSync } = await import("fs");
      const { join } = await import("path");

      const specFilename = "correctable-spec.md";
      const specPath = join(tempDir, specFilename);
      const specContent = `
# Test Spec

## Files

| Path | Action |
|------|--------|
| src/modules/user/user.service.ts | MODIFY |
| src/modules/auth/auth.service.ts | CREATE |

\`\`\`typescript
// src/hooks/useAuth.ts
export const useAuth = () => {}
\`\`\`
      `;

      writeFileSync(specPath, specContent, "utf-8");

      const reviewJson = JSON.stringify({
        ...VALID_REVIEW_SUMMARY,
        target_app: "my-app",
      });
      const aiContent = `<review_summary>${reviewJson}</review_summary>`;
      const aiResult = createMockAiResult(aiContent);

      mockInvoke
        .mockResolvedValueOnce(VALID_SCAN_RESULT)
        .mockResolvedValueOnce(VALID_COMMIT_RESULT);

      const input: TodoReviewerInput = {
        spec_path: specFilename,
        model: "opus",
        iterations: 1,
        cwd: tempDir,
      };

      const result = await todoReviewerCapability.processResult(input, aiResult, context);

      // Verify spec file was updated with corrected paths (deterministic correction)
      const updatedContent = readFileSync(specPath, "utf-8");
      expect(updatedContent).toContain("apps/my-app/src/modules/user/user.service.ts");
      expect(updatedContent).toContain("apps/my-app/src/modules/auth/auth.service.ts");
      expect(updatedContent).toContain("apps/my-app/src/hooks/useAuth.ts");

      // Verify original patterns were replaced (check table row format)
      expect(updatedContent).toMatch(/\|\s+apps\/my-app\/src\/modules\/user\/user\.service\.ts\s+\|/);
      expect(updatedContent).not.toMatch(/\|\s+src\/modules\/user\/user\.service\.ts\s+\|/);

      expect(result.status).toBe("success");
    });

    it("throws ValidationError when spec has uncorrectable paths", async () => {
      const { writeFileSync } = await import("fs");
      const { join } = await import("path");

      const specFilename = "uncorrectable-spec.md";
      const specPath = join(tempDir, specFilename);
      const specContent = `
# Test Spec

## Files

| Path | Action |
|------|--------|
| ../../../../../../etc/passwd | MODIFY |
| file:///absolute/path/to/file.ts | CREATE |

\`\`\`typescript
// ../../../parent/dir/file.ts
export const App = () => {}
\`\`\`
      `;

      writeFileSync(specPath, specContent, "utf-8");

      const reviewJson = JSON.stringify({
        ...VALID_REVIEW_SUMMARY,
        target_app: "my-server",
      });
      const aiContent = `<review_summary>${reviewJson}</review_summary>`;
      const aiResult = createMockAiResult(aiContent);

      // Mock AI fix capability to return FAILED status
      mockInvoke.mockImplementation((capabilityId: string) => {
        if (capabilityId === "todo_path_fix_step") {
          return Promise.resolve({
            status: "FAILED",
            remaining_uncorrectable: ["../../../../../../etc/passwd", "file:///absolute/path/to/file.ts"],
          });
        }
        // Should not reach other capabilities
        return Promise.resolve({});
      });

      const input: TodoReviewerInput = {
        spec_path: specFilename,
        model: "opus",
        iterations: 1,
        cwd: tempDir,
      };

      // Should throw ValidationError with new error message format
      await expect(
        todoReviewerCapability.processResult(input, aiResult, context)
      ).rejects.toThrow(/Invalid paths in spec:/);

      // Verify AI fix was attempted (Tier 3 fallback)
      expect(context.invokeCapability).toHaveBeenCalledWith(
        "todo_path_fix_step",
        expect.objectContaining({
          spec_path: expect.any(String),
        })
      );
    });
  });
});
