import { vi, type Mock } from "vitest";
/**
 * Integration tests for todo-reviewer capability.
 * Tests full invocation flow through CapabilityRegistry.
 */

import { CapabilityRegistry } from "../../../core/capability-registry/index.js";
import { SessionManager } from "../../../core/session/session.manager.js";
import { CostTracker } from "../../../core/cost/cost.tracker.js";
import { CostReportWriter } from "../../../core/cost/cost-report.writer.js";
import { DiskWriter } from "../../../core/logger/disk-writer.js";
import { PromptLoader } from "../../../core/prompt/prompt.loader.js";
import { Logger } from "../../../core/logger/logger.js";
import { registerAllCapabilities } from "../../index.js";
import type { AIProvider } from "../../../core/ai-provider/ai-provider.types.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_TESTS_DIR = path.join(__dirname, "../../../../logs_tests/todo-reviewer");

describe("todo-reviewer integration tests", () => {
  let registry: CapabilityRegistry;
  let sessionManager: SessionManager;
  let costTracker: CostTracker;
  let costReportWriter: CostReportWriter;
  let diskWriter: DiskWriter;
  let promptLoader: PromptLoader;
  let logger: Logger;
  let mockAIProvider: AIProvider;
  let tempDir: string;

  beforeEach(async () => {
    const fs = await import("fs");
    const os = await import("os");

    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "todo-reviewer-int-"));
    fs.mkdirSync(path.join(tempDir, "docs", "specs"), { recursive: true });
    fs.writeFileSync(
      path.join(tempDir, "docs", "specs", "feature.md"),
      "# Test Spec\n\nSimple spec for integration testing.\n",
      "utf-8",
    );

    sessionManager = new SessionManager();
    costTracker = new CostTracker();
    costReportWriter = new CostReportWriter(path.join(LOGS_TESTS_DIR, "reports"));
    diskWriter = new DiskWriter(LOGS_TESTS_DIR);
    promptLoader = new PromptLoader();
    logger = new Logger({ diskWriter });

    mockAIProvider = {
      query: vi.fn<AIProvider["query"]>().mockResolvedValue({
        content: "AI response text",
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        costUsd: 0.05,
        turns: 5,
        terminationReason: "success",
        trace: {
          tid: "testtraceidentif00000000000000",
          startedAt: new Date().toISOString(),
          request: { prompt: "test" },
          turns: [
            {
              turnNumber: 1,
              assistantBlocks: [{ type: "text", text: "AI response text" }],
            },
          ],
        },
      }),
    };

    registry = new CapabilityRegistry({
      sessionManager,
      costTracker,
      costReportWriter,
      diskWriter,
      promptLoader,
      logger,
      aiProvider: mockAIProvider,
    });

    registerAllCapabilities(registry);
  });

  afterEach(async () => {
    await diskWriter.closeAll();
    const fs = await import("fs");
    if (tempDir) fs.rmSync(tempDir, { recursive: true, force: true });
  });

  // ---------------------------------------------------------------------------
  // Registration tests (AC-10)
  // ---------------------------------------------------------------------------

  describe("registration (AC-10)", () => {
    it("should register todoReviewerCapability", async () => {
      const result = await registry.handleCapabilityInvocation("todo_reviewer", {
        spec_path: "docs/specs/feature.md",
        model: "opus",
        iterations: 1,
        cwd: tempDir,
      });

      // Should NOT return "not found" error
      const text = result.content[0]?.text ?? "";
      expect(text).not.toContain("not found");
    });

    it("should register tddValidateStepCapability", async () => {
      const validReviewSummary = {
        status: "READY",
        spec_path: "docs/specs/feature.md",
        target_app: "my-server",
        corrections_applied: 0,
        blockers_remaining: 0,
        warnings: 0,
        cross_app_status: "N/A",
        consistency_score: "14/14",
        key_findings: [],
        spec_modified: false,
      };

      const result = await registry.handleCapabilityInvocation("todo_tdd_validate_step", {
        spec_path: "docs/specs/feature.md",
        review_summary: validReviewSummary,
      });

      const text = result.content[0]?.text ?? "";
      expect(text).not.toContain("not found");
    });

    it("should register commitStepCapability", async () => {
      const validReviewSummary = {
        status: "READY",
        spec_path: "docs/specs/feature.md",
        target_app: "my-server",
        corrections_applied: 0,
        blockers_remaining: 0,
        warnings: 0,
        cross_app_status: "N/A",
        consistency_score: "14/14",
        key_findings: [],
        spec_modified: false,
      };

      const validTddSummary = {
        status: "PASS",
        details: "All tests pass",
        issues_found: 0,
        spec_modified: false,
      };

      const result = await registry.handleCapabilityInvocation("todo_commit_step", {
        spec_path: "docs/specs/feature.md",
        review_summary: validReviewSummary,
        tdd_summary: validTddSummary,
      });

      const text = result.content[0]?.text ?? "";
      expect(text).not.toContain("not found");
    });
  });

  // ---------------------------------------------------------------------------
  // Input validation
  // ---------------------------------------------------------------------------

  describe("input validation", () => {
    it("rejects empty spec_path", async () => {
      const result = await registry.handleCapabilityInvocation("todo_reviewer", {
        spec_path: "",
        model: "opus",
        iterations: 1,
      });

      expect(result.isError).toBe(true);
    });

    it("rejects non-.md path", async () => {
      const result = await registry.handleCapabilityInvocation("todo_reviewer", {
        spec_path: "file.txt",
        model: "opus",
        iterations: 1,
      });

      expect(result.isError).toBe(true);
    });
  });

  // ---------------------------------------------------------------------------
  // MCP tool visibility (Phase 4 - Integration verification)
  // ---------------------------------------------------------------------------

  describe("MCP tool visibility", () => {
    it("should only expose todo_reviewer as MCP tool, not internal sub-capabilities", () => {
      interface MockServer {
        registerTool: Mock;
      }

      const mockServer: MockServer = {
        registerTool: vi.fn(),
      };

      // Bind registered capabilities to mock MCP server
      registry.bindToMcpServer(mockServer as unknown as import("@modelcontextprotocol/sdk/server/mcp.js").McpServer);

      // Collect all tool names that were registered
      const registeredToolNames = mockServer.registerTool.mock.calls.map(
        (call) => call[0]
      );

      // Verify todo_reviewer is exposed
      expect(registeredToolNames).toContain("todo_reviewer");

      // Verify internal capabilities are NOT exposed
      expect(registeredToolNames).not.toContain("todo_tdd_validate_step");
      expect(registeredToolNames).not.toContain("todo_commit_step");

      // Should have echo_agent + todo_reviewer + todo_code_writer + finalize + audit_fix + pr_reviewer (6 public tools)
      expect(registeredToolNames).toEqual(
        expect.arrayContaining(["echo_agent", "todo_reviewer", "todo_code_writer", "finalize", "audit_fix", "pr_reviewer"])
      );
      expect(registeredToolNames.length).toBe(6);
    });

    it("should still allow todo_reviewer to invoke internal capabilities via context", async () => {
      // This test verifies the orchestration pattern remains functional
      // even though internal capabilities are not exposed as MCP tools

      const result = await registry.handleCapabilityInvocation("todo_reviewer", {
        spec_path: "docs/specs/feature.md",
        iterations: 1,
        model: "opus",
        cwd: tempDir,
      });

      // Verify orchestration succeeded (internal capabilities were invoked)
      expect(result).toBeDefined();
      expect(result.content).toBeDefined();
      expect(Array.isArray(result.content)).toBe(true);

      // Should NOT be an error (internal invocation works)
      expect(result.isError).toBeUndefined();

      // AI provider should have been called (orchestrator invoked AI)
      expect(mockAIProvider.query).toHaveBeenCalled();
    });
  });
});
