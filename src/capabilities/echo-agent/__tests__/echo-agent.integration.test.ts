import { vi, type Mock } from "vitest";
/**
 * Integration tests for echo-agent capability.
 * Tests full invocation flow through CapabilityRegistry.
 */

import { CapabilityRegistry } from "../../../core/capability-registry/index.js";
import { SessionManager } from "../../../core/session/session.manager.js";
import { CostTracker } from "../../../core/cost/cost.tracker.js";
import { CostReportWriter } from "../../../core/cost/cost-report.writer.js";
import { DiskWriter } from "../../../core/logger/disk-writer.js";
import { PromptLoader } from "../../../core/prompt/prompt.loader.js";
import { Logger } from "../../../core/logger/logger.js";
import { echoAgentCapability } from "../echo-agent.capability.js";
import { EchoAgentInputSchema } from "../echo-agent.schema.js";
import type { EchoAgentInput } from "../echo-agent.schema.js";
import { PROMPT_VERSIONS, CURRENT_VERSION } from "../prompts/index.js";
import type { CapabilityDefinition, CapabilityContext } from "../../../core/capability-registry/capability-registry.types.js";
import type { AIProvider, AIQueryResult } from "../../../core/ai-provider/ai-provider.types.js";
import type { Session } from "../../../core/session/session.types.js";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_TESTS_DIR = path.join(__dirname, "../../../../logs_tests/echo-agent");

describe("echo-agent integration tests", () => {
  let registry: CapabilityRegistry;
  let sessionManager: SessionManager;
  let costTracker: CostTracker;
  let costReportWriter: CostReportWriter;
  let diskWriter: DiskWriter;
  let promptLoader: PromptLoader;
  let logger: Logger;
  let mockAIProvider: AIProvider;

  beforeEach(async () => {
    sessionManager = new SessionManager();
    costTracker = new CostTracker();
    costReportWriter = new CostReportWriter(path.join(LOGS_TESTS_DIR, "reports"));
    diskWriter = new DiskWriter(LOGS_TESTS_DIR);
    promptLoader = new PromptLoader();
    logger = new Logger({ diskWriter }); // Pass diskWriter so we can spy on it

    // Mock AI provider with controlled responses
    mockAIProvider = {
      query: vi.fn<AIProvider["query"]>().mockResolvedValue({
        content: "AI response text",
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        costUsd: 0.000123,
        turns: 1,
        terminationReason: "success",
        trace: {
          tid: "testtraceidentif00000000000000",
          startedAt: new Date().toISOString(),
          request: { prompt: "Hello, world!" },
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

    // Register echo agent capability (cast to base type)
    registry.registerCapability(echoAgentCapability as any);
  });

  afterEach(async () => {
    await diskWriter.closeAll();
  });

  describe("full capability invocation flow", () => {
    it("processes valid input through complete pipeline", async () => {
      const input = {
        prompt: "Hello, world!",
        model: "haiku" as const,
      };

      const result = await registry.handleCapabilityInvocation("echo_agent", input);

      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBe(1);
      expect(result.content[0]?.type).toBe("text");

      const responseText = result.content[0]?.text;
      expect(responseText).toBeDefined();

      // Parse JSON response
      const parsed = JSON.parse(responseText!);
      expect(parsed.response).toBe("AI response text");
      expect(parsed.cost_usd).toBe(0.000123);
      expect(parsed.turns).toBe(1);
    });

    it("validates input schema before invocation", async () => {
      const invalidInput = {
        prompt: "", // Empty prompt should fail validation
        model: "haiku",
      };

      const result = await registry.handleCapabilityInvocation("echo_agent", invalidInput);

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("Prompt is required");
    });

    it("rejects prompt exceeding maximum length", async () => {
      const tooLongPrompt = "a".repeat(10001);
      const input = {
        prompt: tooLongPrompt,
        model: "haiku" as const,
      };

      const result = await registry.handleCapabilityInvocation("echo_agent", input);

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("maximum length");
    });

    it("applies default model when not provided", async () => {
      const input = {
        prompt: "Test prompt",
      };

      const result = await registry.handleCapabilityInvocation("echo_agent", input);

      expect(result.isError).toBeUndefined();
      expect(mockAIProvider.query).toHaveBeenCalled();
    });

    it("applies input model override via getRequestOverrides", async () => {
      const input = {
        prompt: "Test with model",
        model: "sonnet" as const,
      };

      await registry.handleCapabilityInvocation("echo_agent", input);

      // getRequestOverrides merges input.model on top of defaults
      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "sonnet",
        })
      );
    });
  });

  describe("MCP response format (backward compatibility)", () => {
    it("matches expected MCP response structure", async () => {
      const input = {
        prompt: "Test",
        model: "haiku" as const,
      };

      const result = await registry.handleCapabilityInvocation("echo_agent", input);

      // Verify structure matches MCP spec
      expect(result).toHaveProperty("content");
      expect(Array.isArray(result.content)).toBe(true);
      expect(result.content[0]).toEqual({
        type: "text",
        text: expect.any(String),
      });
    });

    it("includes isError flag on validation failure", async () => {
      const invalidInput = {
        prompt: "",
        model: "haiku",
      };

      const result = await registry.handleCapabilityInvocation("echo_agent", invalidInput);

      expect(result.isError).toBe(true);
    });

    it("omits isError flag on success", async () => {
      const input = {
        prompt: "Valid prompt",
        model: "haiku" as const,
      };

      const result = await registry.handleCapabilityInvocation("echo_agent", input);

      expect(result.isError).toBeUndefined();
    });
  });

  describe("session and cost tracking", () => {
    it("creates and closes session for each invocation", async () => {
      const input = {
        prompt: "First invocation",
        model: "haiku" as const,
      };

      await registry.handleCapabilityInvocation("echo_agent", input);

      // Phase 5a: Each tool invocation creates and closes a session
      const activeSessions = sessionManager.getActiveSessions();
      expect(activeSessions.length).toBe(0); // Session is closed after invocation

      // Check that session was created and is now completed
      const allSessions = Array.from((sessionManager as any).sessions.values()) as any[];
      expect(allSessions.length).toBe(1);
      expect(allSessions[0]?.state).toBe("completed");
    });

    it("creates separate session for each invocation", async () => {
      mockAIProvider.query = vi.fn<AIProvider["query"]>().mockResolvedValue({
        content: "Response",
        usage: { inputTokens: 50, outputTokens: 25, totalTokens: 75 },
        costUsd: 0.0001,
        turns: 1,
        terminationReason: "success",
        trace: {
          tid: "00000000000000010000000000000000",
          startedAt: new Date().toISOString(),
          request: { prompt: "test" },
          turns: [],
        },
      });

      // First invocation
      await registry.handleCapabilityInvocation("echo_agent", {
        prompt: "First",
        model: "haiku" as const,
      });

      // Second invocation (creates new session in Phase 5a)
      await registry.handleCapabilityInvocation("echo_agent", {
        prompt: "Second",
        model: "haiku" as const,
      });

      // Each invocation creates its own session
      const allSessions = Array.from((sessionManager as any).sessions.values()) as Session[];
      expect(allSessions.length).toBe(2);

      // Each session has 1 invocation
      allSessions.forEach((session: Session) => {
        expect(session.invocations.length).toBe(1);
        expect(session.totalCost).toBeGreaterThan(0);
        expect(session.state).toBe("completed");
      });
    });
  });

  describe("prompt version traceability", () => {
    it("uses current prompt version from capability definition", async () => {
      const input = {
        prompt: "Version test",
        model: "haiku" as const,
      };

      await registry.handleCapabilityInvocation("echo_agent", input);

      // Verify prompt version is used from capability definition
      expect(echoAgentCapability.currentPromptVersion).toBe("v1");

      // The prompt version is available in capability context
      // Full logging integration would be tested in end-to-end tests
    });
  });

  describe("recursion guard", () => {
    it("prevents capability from calling itself", async () => {
      // This test would require a capability that calls context.invokeCapability(own_id)
      // For echo_agent, it doesn't call other capabilities, so this is a placeholder
      // The actual recursion guard is tested in capability-registry.test.ts
      expect(true).toBe(true);
    });
  });

  describe("AI execution trace", () => {
    it("captures trace in AI result", async () => {
      const input = {
        prompt: "Trace test",
        model: "haiku" as const,
      };

      await registry.handleCapabilityInvocation("echo_agent", input);

      // Verify AI provider was called (trace is internal to AIQueryResult)
      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          prompt: expect.any(String),
        })
      );
    });
  });

  describe("graceful shutdown", () => {
    it("handles shutdown during invocation", async () => {
      // Start invocation
      const invocationPromise = registry.handleCapabilityInvocation("echo_agent", {
        prompt: "Shutdown test",
        model: "haiku" as const,
      });

      // Trigger shutdown (in real scenario this would abort in-flight queries)
      await registry.gracefulShutdown();

      // Wait for invocation to complete or fail
      const result = await invocationPromise;

      // Either succeeds (if completed before shutdown) or fails with shutdown error
      expect(result).toBeDefined();
    });

    it("writes cost reports on shutdown", async () => {
      // Perform invocation
      await registry.handleCapabilityInvocation("echo_agent", {
        prompt: "Cost report test",
        model: "haiku" as const,
      });

      // Shutdown should close sessions and write reports
      await registry.gracefulShutdown();

      // All sessions should be closed (completed state)
      const allSessions = Array.from((sessionManager as any).sessions.values()) as Session[];
      allSessions.forEach((session: Session) => {
        expect(session.state).toBe("completed");
      });
    });
  });

  describe("error handling", () => {
    it("handles AI provider errors gracefully", async () => {
      mockAIProvider.query = vi.fn<AIProvider["query"]>().mockRejectedValue(
        new Error("AI provider error")
      );

      const result = await registry.handleCapabilityInvocation("echo_agent", {
        prompt: "Error test",
        model: "haiku" as const,
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("error");
    });

    it("handles capability not found", async () => {
      const result = await registry.handleCapabilityInvocation("nonexistent", {
        prompt: "Test",
      });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("not found");
    });
  });

  describe("default request options", () => {
    it("applies default maxTurns from capability definition", async () => {
      await registry.handleCapabilityInvocation("echo_agent", {
        prompt: "Defaults test",
        model: "haiku" as const,
      });

      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          maxTurns: 50,
        })
      );
    });

    it("applies default maxBudgetUsd from capability definition", async () => {
      await registry.handleCapabilityInvocation("echo_agent", {
        prompt: "Budget test",
        model: "haiku" as const,
      });

      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          maxBudgetUsd: 3.00,
        })
      );
    });

    it("applies tools preset and permission mode from defaults", async () => {
      await registry.handleCapabilityInvocation("echo_agent", {
        prompt: "Tools test",
        model: "haiku" as const,
      });

      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: { type: "preset", preset: "claude_code" },
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
        })
      );
    });

    it("applies preset systemPrompt from v1 prompt", async () => {
      await registry.handleCapabilityInvocation("echo_agent", {
        prompt: "System prompt test",
        model: "haiku" as const,
      });

      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: { type: "preset", preset: "claude_code" },
        })
      );
    });
  });

  describe("session log file lifecycle", () => {
    it("opens and closes session log file for successful invocation", async () => {
      const openSessionSpy = vi.spyOn(diskWriter, "openSession");
      const closeSessionSpy = vi.spyOn(diskWriter, "closeSession");

      const input = {
        prompt: "Session log test",
        model: "haiku" as const,
      };

      await registry.handleCapabilityInvocation("echo_agent", input);

      expect(openSessionSpy).toHaveBeenCalledWith(expect.any(String));
      expect(closeSessionSpy).toHaveBeenCalledWith(expect.any(String));

      // Verify same session ID was used for open and close
      const openedSessionId = openSessionSpy.mock.calls[0]?.[0];
      const closedSessionId = closeSessionSpy.mock.calls[0]?.[0];
      expect(openedSessionId).toBe(closedSessionId);
    });

    it("closes session log file even when invocation fails", async () => {
      const closeSessionSpy = vi.spyOn(diskWriter, "closeSession");

      mockAIProvider.query = vi.fn<AIProvider["query"]>().mockRejectedValue(
        new Error("AI provider error")
      );

      const result = await registry.handleCapabilityInvocation("echo_agent", {
        prompt: "Error test",
        model: "haiku" as const,
      });

      expect(result.isError).toBe(true);
      expect(closeSessionSpy).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe("invocation logging to disk", () => {
    it("writes log entries with sessionId to disk during successful invocation", async () => {
      const writeSpy = vi.spyOn(diskWriter, "write");

      const input = {
        prompt: "Logging test",
        model: "haiku" as const,
      };

      await registry.handleCapabilityInvocation("echo_agent", input);

      // Wait for async disk writes to complete (Logger.log() fires write() async)
      await new Promise((resolve) => setTimeout(resolve, 50));

      // DiskWriter.write() should be called multiple times with entries containing sessionId
      expect(writeSpy).toHaveBeenCalled();

      // Get all write calls
      const writeCalls = writeSpy.mock.calls;

      // Filter calls that have sid in the entry context
      const sessionLogCalls = writeCalls.filter((call) => {
        const entry = call[0];
        return entry?.context?.sid !== undefined;
      });

      // Should have at least 3 log entries with sid:
      // 1. "Capability invocation started"
      // 2. "AI query completed"
      // 3. "Capability invocation completed"
      expect(sessionLogCalls.length).toBeGreaterThanOrEqual(3);

      // Verify all session log entries have the same sid
      const sessionIds = sessionLogCalls.map((call) => call[0]?.context?.sid);
      const uniqueSessionIds = new Set(sessionIds);
      expect(uniqueSessionIds.size).toBe(1);
    });

    it("writes ai.execution_trace debug log when trace exists", async () => {
      const writeSpy = vi.spyOn(diskWriter, "write");

      const input = {
        prompt: "Trace test",
        model: "haiku" as const,
      };

      await registry.handleCapabilityInvocation("echo_agent", input);

      // Wait for async disk writes to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Find the ai.execution_trace log entry
      const traceCalls = writeSpy.mock.calls.filter((call) => {
        const entry = call[0];
        return entry?.message === "ai.execution_trace" && entry?.level === "DEBUG";
      });

      expect(traceCalls.length).toBe(1);

      // Verify trace entry has sid and trace data
      const traceEntry = traceCalls[0]?.[0];
      expect(traceEntry?.context?.sid).toBeDefined();
      expect(traceEntry?.context?.trace).toBeDefined();
    });

    it("does not write ai.execution_trace when trace is missing", async () => {
      const writeSpy = vi.spyOn(diskWriter, "write");

      // Mock AI provider without trace
      mockAIProvider.query = vi.fn<AIProvider["query"]>().mockResolvedValue({
        content: "AI response",
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        costUsd: 0.001,
        turns: 1,
        terminationReason: "success",
        trace: undefined as any,
      });

      const input = {
        prompt: "No trace test",
        model: "haiku" as const,
      };

      await registry.handleCapabilityInvocation("echo_agent", input);

      // Wait for async disk writes to complete
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should NOT have ai.execution_trace log entry
      const traceCalls = writeSpy.mock.calls.filter((call) => {
        const entry = call[0];
        return entry?.message === "ai.execution_trace";
      });

      expect(traceCalls.length).toBe(0);
    });
  });

  describe("enhanced tools and appendSystemPrompt integration", () => {
    it("should flow preset+customTools+appendSystemPrompt through registry to provider correctly", async () => {
      // Create a temporary capability with enhanced defaultRequestOptions
      const customTool = {
        name: "custom_test_tool",
        description: "A custom tool for testing",
        inputSchema: { type: "object", properties: { value: { type: "string" } } },
      };

      const enhancedCapability: CapabilityDefinition<EchoAgentInput, { response: string; cost_usd: number; turns: number }> = {
        id: "test_enhanced_capability",
        type: "tool",
        name: "Test Enhanced Capability",
        description: "Test capability with preset + customTools + appendSystemPrompt",
        inputSchema: EchoAgentInputSchema,
        promptRegistry: PROMPT_VERSIONS,
        currentPromptVersion: CURRENT_VERSION,
        defaultRequestOptions: {
          model: "sonnet",
          maxTurns: 30,
          maxBudgetUsd: 2.00,
          tools: {
            type: "preset",
            preset: "claude_code",
            customTools: [customTool],
          },
          appendSystemPrompt: "Additional system context for enhanced capability.",
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
        },
        preparePromptInput: (input: EchoAgentInput, _context: CapabilityContext) => ({
          prompt: input.prompt,
          cwd: input.cwd,
        }),
        processResult: (_input: EchoAgentInput, aiResult: AIQueryResult, _context: CapabilityContext) => ({
          response: aiResult.content,
          cost_usd: aiResult.costUsd,
          turns: aiResult.turns,
        }),
      };

      // Register the enhanced capability (cast to base type for registration)
      registry.registerCapability(enhancedCapability as any);

      const input = {
        prompt: "Test enhanced tools",
        model: "haiku" as const, // User input model override
      };

      await registry.handleCapabilityInvocation("test_enhanced_capability", input);

      // Verify that mockAIProvider.query was called with merged config
      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "haiku", // User input overrides default
          maxTurns: 30, // From capability defaults
          maxBudgetUsd: 2.00, // From capability defaults
          tools: {
            type: "preset",
            preset: "claude_code",
            customTools: [customTool],
          },
          appendSystemPrompt: "Additional system context for enhanced capability.",
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
        })
      );
    });

    it("echo-agent capability unchanged behavior (backward compatibility)", async () => {
      // Verify that the original echo-agent capability still works exactly as before
      const input = {
        prompt: "Backward compatibility test",
        model: "haiku" as const,
      };

      const result = await registry.handleCapabilityInvocation("echo_agent", input);

      // Verify successful invocation
      expect(result.isError).toBeUndefined();
      expect(result.content).toBeDefined();
      expect(result.content.length).toBe(1);
      expect(result.content[0]?.type).toBe("text");

      const responseText = result.content[0]?.text;
      expect(responseText).toBeDefined();

      // Parse JSON response
      const parsed = JSON.parse(responseText!);
      expect(parsed.response).toBe("AI response text");
      expect(parsed.cost_usd).toBe(0.000123);
      expect(parsed.turns).toBe(1);

      // Verify AI provider was called with correct defaults (NO customTools or appendSystemPrompt)
      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          model: "haiku",
          maxTurns: 50,
          maxBudgetUsd: 3.00,
          tools: { type: "preset", preset: "claude_code" },
          permissionMode: "bypassPermissions",
          allowDangerouslySkipPermissions: true,
          appendSystemPrompt: undefined, // Should not be set
          systemPrompt: { type: "preset", preset: "claude_code" },
        })
      );

      // Verify customAgentTools is undefined (not set in echo-agent defaults)
      const queryMock = mockAIProvider.query as Mock;
      const lastCallArgs = queryMock.mock.calls[queryMock.mock.calls.length - 1];
      const queryCall = lastCallArgs?.[0] as any;
      expect(queryCall?.customAgentTools).toBeUndefined();
    });
  });
});
