/**
 * Integration tests for finalize capability.
 * Tests capability registration and input validation.
 */

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
const LOGS_TESTS_DIR = path.join(__dirname, "../../../../logs_tests/finalize");

describe("Finalize Integration", () => {
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
    it("registers finalize orchestrator capability", () => {
      const capability = registry.getCapability("finalize");
      expect(capability).toBeDefined();
      expect(capability?.id).toBe("finalize");
      expect(capability?.type).toBe("tool");
      expect(capability?.visibility).toBe("public");
    });

    it("registers all 6 finalize capabilities", () => {
      expect(registry.getCapability("finalize")).toBeDefined();
      expect(registry.getCapability("finalize_audit_step")).toBeDefined();
      expect(registry.getCapability("finalize_test_step")).toBeDefined();
      expect(registry.getCapability("finalize_codemap_step")).toBeDefined();
      expect(registry.getCapability("finalize_readme_step")).toBeDefined();
      expect(registry.getCapability("finalize_commit_step")).toBeDefined();
    });

    it("all internal sub-capabilities have internal visibility", () => {
      expect(registry.getCapability("finalize_audit_step")?.visibility).toBe("internal");
      expect(registry.getCapability("finalize_test_step")?.visibility).toBe("internal");
      expect(registry.getCapability("finalize_codemap_step")?.visibility).toBe("internal");
      expect(registry.getCapability("finalize_readme_step")?.visibility).toBe("internal");
      expect(registry.getCapability("finalize_commit_step")?.visibility).toBe("internal");
    });
  });

  describe("input validation", () => {
    it("rejects empty files_changed array", () => {
      const capability = registry.getCapability("finalize");
      const result = capability!.inputSchema.safeParse({ files_changed: [] });
      expect(result.success).toBe(false);
    });

    it("rejects missing files_changed", () => {
      const capability = registry.getCapability("finalize");
      const result = capability!.inputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects non-string array items in files_changed", () => {
      const capability = registry.getCapability("finalize");
      const result = capability!.inputSchema.safeParse({
        files_changed: ["src/file.ts", 123],
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-boolean skip_tests", () => {
      const capability = registry.getCapability("finalize");
      const result = capability!.inputSchema.safeParse({
        files_changed: ["src/file.ts"],
        skip_tests: "true",
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid input with defaults", () => {
      const capability = registry.getCapability("finalize");
      const result = capability!.inputSchema.safeParse({
        files_changed: ["src/file.ts"],
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect((result.data as { skip_tests: boolean }).skip_tests).toBe(false);
        expect((result.data as { skip_codemaps: boolean }).skip_codemaps).toBe(false);
      }
    });

    it("accepts valid input with all fields", () => {
      const capability = registry.getCapability("finalize");
      const result = capability!.inputSchema.safeParse({
        files_changed: ["src/file1.ts", "src/file2.ts"],
        cwd: "/some/path",
        skip_tests: true,
        skip_codemaps: true,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("capability metadata", () => {
    it("all capabilities have correct budgets", () => {
      const orchestrator = registry.getCapability("finalize");
      expect(orchestrator!.defaultRequestOptions?.maxBudgetUsd).toBe(3.0);

      const audit = registry.getCapability("finalize_audit_step");
      expect(audit!.defaultRequestOptions?.maxBudgetUsd).toBe(6.0);

      const test = registry.getCapability("finalize_test_step");
      expect(test!.defaultRequestOptions?.maxBudgetUsd).toBe(2.0);

      const codemap = registry.getCapability("finalize_codemap_step");
      expect(codemap!.defaultRequestOptions?.maxBudgetUsd).toBe(3.0);

      const readme = registry.getCapability("finalize_readme_step");
      expect(readme!.defaultRequestOptions?.maxBudgetUsd).toBe(1.0);

      const commit = registry.getCapability("finalize_commit_step");
      expect(commit!.defaultRequestOptions?.maxBudgetUsd).toBe(5.0);
    });

    it("all capabilities use correct models", () => {
      expect(registry.getCapability("finalize")!.defaultRequestOptions?.model).toBe("sonnet");
      expect(registry.getCapability("finalize_audit_step")!.defaultRequestOptions?.model).toBe("sonnet");
      expect(registry.getCapability("finalize_test_step")!.defaultRequestOptions?.model).toBe("sonnet");
      expect(registry.getCapability("finalize_codemap_step")!.defaultRequestOptions?.model).toBe("sonnet");
      expect(registry.getCapability("finalize_readme_step")!.defaultRequestOptions?.model).toBe("haiku");
      expect(registry.getCapability("finalize_commit_step")!.defaultRequestOptions?.model).toBe("haiku");
    });

    it("all capabilities have claude_code preset", () => {
      const capabilities = [
        "finalize",
        "finalize_audit_step",
        "finalize_test_step",
        "finalize_codemap_step",
        "finalize_readme_step",
        "finalize_commit_step",
      ];

      capabilities.forEach((capId) => {
        const cap = registry.getCapability(capId);
        const tools = cap!.defaultRequestOptions?.tools;
        expect(tools).toBeDefined();
        expect(tools).toHaveProperty("type", "preset");
        if (tools && "preset" in tools) {
          expect(tools.preset).toBe("claude_code");
        }
      });
    });

    it("all capabilities have bypassPermissions enabled", () => {
      const capabilities = [
        "finalize",
        "finalize_audit_step",
        "finalize_test_step",
        "finalize_codemap_step",
        "finalize_readme_step",
        "finalize_commit_step",
      ];

      capabilities.forEach((capId) => {
        const cap = registry.getCapability(capId);
        expect(cap!.defaultRequestOptions?.permissionMode).toBe("bypassPermissions");
        expect(cap!.defaultRequestOptions?.allowDangerouslySkipPermissions).toBe(true);
      });
    });
  });
});
