import { vi } from "vitest";
/**
 * Shared test helpers for CapabilityRegistry tests.
 */

import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";
import { SessionManager } from "../../session/session.manager.js";
import { CostTracker } from "../../cost/cost.tracker.js";
import { CostReportWriter } from "../../cost/cost-report.writer.js";
import { DiskWriter } from "../../logger/disk-writer.js";
import { PromptLoader } from "../../prompt/prompt.loader.js";
import { Logger } from "../../logger/logger.js";
import { CapabilityRegistry } from "../capability-registry.js";
import type { CapabilityDefinition } from "../capability-registry.types.js";
import type { AIProvider, AIQueryResult } from "../../ai-provider/ai-provider.types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const logsTestsDir = path.join(__dirname, "../../../../logs_tests/cap-registry");

export interface TestContext {
  registry: CapabilityRegistry;
  mockServer: McpServer;
  sessionManager: SessionManager;
  costTracker: CostTracker;
  costReportWriter: CostReportWriter;
  diskWriter: DiskWriter;
  promptLoader: PromptLoader;
  logger: Logger;
  mockAIProvider: AIProvider;
}

/** Create test context with all dependencies */
export async function createTestContext(): Promise<TestContext> {
  const sessionManager = new SessionManager();
  const costTracker = new CostTracker();
  const costReportWriter = new CostReportWriter(path.join(logsTestsDir, "reports"));
  const diskWriter = new DiskWriter(logsTestsDir);
  const promptLoader = new PromptLoader();
  const logger = new Logger({ diskWriter });

  const mockAIProvider: AIProvider = {
    query: vi.fn<AIProvider["query"]>().mockResolvedValue({
      content: "AI response",
      usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
      costUsd: 0.001,
      turns: 1,
      terminationReason: "success",
      trace: {
        tid: "00000000000000000000000000000001",
        startedAt: new Date().toISOString(),
        request: { prompt: "test" },
        turns: [],
      },
    } as AIQueryResult),
  };

  const registry = new CapabilityRegistry({
    sessionManager,
    costTracker,
    costReportWriter,
    diskWriter,
    promptLoader,
    logger,
    aiProvider: mockAIProvider,
  });

  const mockServer = {
    registerTool: vi.fn(),
  } as unknown as McpServer;

  return {
    registry,
    mockServer,
    sessionManager,
    costTracker,
    costReportWriter,
    diskWriter,
    promptLoader,
    logger,
    mockAIProvider,
  };
}

/** Create a simple test capability definition */
export function createTestCapability(id: string = "test-tool"): CapabilityDefinition {
  return {
    id,
    type: "tool",
    name: "Test Tool",
    description: "A test tool",
    inputSchema: z.object({ input: z.string() }),
    promptRegistry: {
      v1: {
        version: "v1",
        createdAt: new Date().toISOString(),
        description: "Version 1",
        deprecated: false,
        build: (input) => ({ userPrompt: JSON.stringify(input) }),
      },
    },
    currentPromptVersion: "v1",
    preparePromptInput: (input) => input,
    processResult: (input, result) => ({ output: result.content }),
  };
}
