/**
 * Integration tests for audit-fix capability test step orchestration.
 * Tests capability registration, test step invocation flow, and skip_tests behavior.
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { CapabilityRegistry } from "../../../core/capability-registry/capability-registry.js";
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
const LOGS_TESTS_DIR = path.join(__dirname, "../../../../logs_tests/audit-fix");

describe("Audit-Fix Integration", () => {
  let registry: CapabilityRegistry;

  beforeEach(() => {
    const sessionManager = new SessionManager();
    const costTracker = new CostTracker();
    const costReportWriter = new CostReportWriter(path.join(LOGS_TESTS_DIR, "reports"));
    const diskWriter = new DiskWriter(LOGS_TESTS_DIR);
    const promptLoader = new PromptLoader();
    const logger = new Logger({ diskWriter });

    const mockAIProvider: AIProvider = {
      query: () => Promise.resolve({
        content: "AI response",
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        costUsd: 0.05,
        turns: 5,
        terminationReason: "success" as const,
        trace: {
          tid: "test000000000000000000000000000",
          startedAt: new Date().toISOString(),
          request: { prompt: "test" },
          summary: { inputTokens: 100, outputTokens: 50, costUsd: 0.05 },
          turns: [],
        },
      }),
    } as unknown as AIProvider;

    registry = new CapabilityRegistry({
      aiProvider: mockAIProvider,
      sessionManager,
      costTracker,
      costReportWriter,
      promptLoader,
      logger,
      diskWriter,
    });

    registerAllCapabilities(registry);
  });

  describe("capability registration", () => {
    it("registers audit_fix orchestrator capability", () => {
      const capability = registry.getCapability("audit_fix");
      expect(capability).toBeDefined();
      expect(capability?.id).toBe("audit_fix");
      expect(capability?.type).toBe("tool");
      expect(capability?.visibility).toBe("public");
    });

    it("registers all audit-fix capabilities", () => {
      expect(registry.getCapability("audit_fix")).toBeDefined();
      expect(registry.getCapability("audit_fix_audit_step")).toBeDefined();
      expect(registry.getCapability("audit_fix_test_step")).toBeDefined();
      expect(registry.getCapability("audit_fix_eng_step")).toBeDefined();
      expect(registry.getCapability("audit_fix_commit_step")).toBeDefined();
    });

    it("all internal sub-capabilities have internal visibility", () => {
      expect(registry.getCapability("audit_fix_audit_step")?.visibility).toBe("internal");
      expect(registry.getCapability("audit_fix_test_step")?.visibility).toBe("internal");
      expect(registry.getCapability("audit_fix_eng_step")?.visibility).toBe("internal");
      expect(registry.getCapability("audit_fix_commit_step")?.visibility).toBe("internal");
    });

    it("audit_fix_test_step is registered with correct metadata", () => {
      const capability = registry.getCapability("audit_fix_test_step");
      expect(capability).toBeDefined();
      expect(capability?.id).toBe("audit_fix_test_step");
      expect(capability?.type).toBe("tool");
      expect(capability?.visibility).toBe("internal");
      expect(capability?.name).toContain("Internal");
    });
  });

  describe("test step input validation", () => {
    it("accepts valid test step input", () => {
      const capability = registry.getCapability("audit_fix_test_step");
      const result = capability!.inputSchema.safeParse({
        project_path: "apps/bastion-server",
        workspaces: ["apps/bastion-server"],
        cwd: "/path",
      });
      expect(result.success).toBe(true);
    });

    it("rejects empty project_path", () => {
      const capability = registry.getCapability("audit_fix_test_step");
      const result = capability!.inputSchema.safeParse({
        project_path: "",
        workspaces: ["apps/bastion-server"],
      });
      expect(result.success).toBe(false);
    });

    it("rejects empty workspaces array", () => {
      const capability = registry.getCapability("audit_fix_test_step");
      const result = capability!.inputSchema.safeParse({
        project_path: "apps/bastion-server",
        workspaces: [],
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const capability = registry.getCapability("audit_fix_test_step");
      const result = capability!.inputSchema.safeParse({});
      expect(result.success).toBe(false);
    });
  });

  describe("orchestrator input validation - extended fields", () => {
    it("accepts skip_tests field", () => {
      const capability = registry.getCapability("audit_fix");
      const result = capability!.inputSchema.safeParse({
        skip_tests: true,
        cwd: "/path",
      });
      expect(result.success).toBe(true);
    });

    it("accepts spec_path field", () => {
      const capability = registry.getCapability("audit_fix");
      const result = capability!.inputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
        cwd: "/path",
      });
      expect(result.success).toBe(true);
    });

    it("accepts both skip_tests and spec_path", () => {
      const capability = registry.getCapability("audit_fix");
      const result = capability!.inputSchema.safeParse({
        skip_tests: false,
        spec_path: "docs/specs/feature.md",
        project: "apps/bastion-server",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("eng step input validation - extended fields", () => {
    it("accepts test_failure_summary field", () => {
      const capability = registry.getCapability("audit_fix_eng_step");
      const result = capability!.inputSchema.safeParse({
        project_path: "apps/test",
        audit_summary: "5 violations",
        files_with_issues: ["file.ts"],
        iteration_number: 1,
        test_failure_summary: "3 tests failed",
      });
      expect(result.success).toBe(true);
    });

    it("accepts spec_path field", () => {
      const capability = registry.getCapability("audit_fix_eng_step");
      const result = capability!.inputSchema.safeParse({
        project_path: "apps/test",
        audit_summary: "5 violations",
        files_with_issues: ["file.ts"],
        iteration_number: 1,
        spec_path: "docs/specs/feature.md",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("lint step capabilities registration", () => {
    it("registers lint_scan_step capability", () => {
      const capability = registry.getCapability("audit_fix_lint_scan_step");
      expect(capability).toBeDefined();
      expect(capability?.id).toBe("audit_fix_lint_scan_step");
      expect(capability?.type).toBe("tool");
      expect(capability?.visibility).toBe("internal");
    });

    it("registers lint_fix_step capability", () => {
      const capability = registry.getCapability("audit_fix_lint_fix_step");
      expect(capability).toBeDefined();
      expect(capability?.id).toBe("audit_fix_lint_fix_step");
      expect(capability?.type).toBe("tool");
      expect(capability?.visibility).toBe("internal");
    });
  });
});
