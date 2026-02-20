/**
 * Integration tests for todo-code-writer capability.
 * Tests capability registration and basic orchestration flow.
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
const LOGS_TESTS_DIR = path.join(__dirname, "../../../../logs_tests/todo-code-writer");

describe("Todo Code Writer Integration", () => {
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
    it("registers todo_code_writer orchestrator capability", () => {

      const capability = registry.getCapability("todo_code_writer");
      expect(capability).toBeDefined();
      expect(capability?.id).toBe("todo_code_writer");
      expect(capability?.type).toBe("tool");
    });

    it("registers all sub-capabilities", () => {
      expect(registry.getCapability("todo_code_writer_phase_eng_step")).toBeDefined();
      expect(registry.getCapability("todo_code_writer_phase_audit_step")).toBeDefined();
      expect(registry.getCapability("todo_code_writer_final_audit_step")).toBeDefined();
      expect(registry.getCapability("todo_code_writer_commit_step")).toBeDefined();
    });
  });

  describe("input validation", () => {
    it("rejects empty spec_path", () => {
      const capability = registry.getCapability("todo_code_writer");
      const result = capability!.inputSchema.safeParse({ spec_path: "" });
      expect(result.success).toBe(false);
    });

    it("rejects non-.md spec_path", () => {
      const capability = registry.getCapability("todo_code_writer");
      const result = capability!.inputSchema.safeParse({ spec_path: "file.txt" });
      expect(result.success).toBe(false);
    });

    it("rejects max_phases out of range", () => {
      const capability = registry.getCapability("todo_code_writer");
      const result = capability!.inputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
        max_phases: 11,
      });
      expect(result.success).toBe(false);
    });

    it("accepts valid input with defaults", () => {
      const capability = registry.getCapability("todo_code_writer");
      const result = capability!.inputSchema.safeParse({
        spec_path: "docs/specs/feature.md",
      });
      expect(result.success).toBe(true);
    });
  });

  describe("capability metadata", () => {
    it("all capabilities have correct budgets", () => {
      const orchestrator = registry.getCapability("todo_code_writer");
      expect(orchestrator!.defaultRequestOptions?.maxBudgetUsd).toBe(5.0);

      const phaseEng = registry.getCapability("todo_code_writer_phase_eng_step");
      expect(phaseEng!.defaultRequestOptions?.maxBudgetUsd).toBe(5.0);

      const phaseAudit = registry.getCapability("todo_code_writer_phase_audit_step");
      expect(phaseAudit!.defaultRequestOptions?.maxBudgetUsd).toBe(2.0);

      const finalAudit = registry.getCapability("todo_code_writer_final_audit_step");
      expect(finalAudit!.defaultRequestOptions?.maxBudgetUsd).toBe(3.0);

      const commit = registry.getCapability("todo_code_writer_commit_step");
      expect(commit!.defaultRequestOptions?.maxBudgetUsd).toBe(5.0);
    });
  });
});
