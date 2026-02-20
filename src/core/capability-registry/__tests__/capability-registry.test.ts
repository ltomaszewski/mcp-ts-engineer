/**
 * Tests for CapabilityRegistry - Phase 5a.
 * Tests capability registration, context injection, AIQueryRequest validation, and MCP binding.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import path from "path";
import { fileURLToPath } from "url";
import { CapabilityRegistry } from "../capability-registry.js";
import type { CapabilityDefinition } from "../capability-registry.types.js";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { SessionManager } from "../../session/session.manager.js";
import { CostTracker } from "../../cost/cost.tracker.js";
import { CostReportWriter } from "../../cost/cost-report.writer.js";
import { DiskWriter } from "../../logger/disk-writer.js";
import { PromptLoader } from "../../prompt/prompt.loader.js";
import { Logger } from "../../logger/logger.js";
import type { AIProvider, AIQueryResult } from "../../ai-provider/ai-provider.types.js";
import { ServerShuttingDownError } from "../../errors.js";

describe("CapabilityRegistry - Phase 5a", () => {
  let registry: CapabilityRegistry;
  let mockServer: McpServer;
  let sessionManager: SessionManager;
  let costTracker: CostTracker;
  let costReportWriter: CostReportWriter;
  let diskWriter: DiskWriter;
  let promptLoader: PromptLoader;
  let logger: Logger;
  let mockAIProvider: AIProvider;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const logsTestsDir = path.join(__dirname, "../../../../logs_tests/cap-registry");

  beforeEach(async () => {
    sessionManager = new SessionManager();
    costTracker = new CostTracker();
    costReportWriter = new CostReportWriter(path.join(logsTestsDir, "reports"));
    diskWriter = new DiskWriter(logsTestsDir);
    promptLoader = new PromptLoader();
    logger = new Logger({ diskWriter }); // Pass diskWriter for spy tests

    mockAIProvider = {
      query: jest.fn<AIProvider["query"]>().mockResolvedValue({
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

    registry = new CapabilityRegistry({
      sessionManager,
      costTracker,
      costReportWriter,
      diskWriter,
      promptLoader,
      logger,
      aiProvider: mockAIProvider,
    });

    mockServer = {
      registerTool: jest.fn(),
    } as unknown as McpServer;
  });

  afterEach(async () => {
    await diskWriter.closeAll();
  });

  describe("registerCapability", () => {
    it("stores capability definition and registers prompts", () => {
      const definition: CapabilityDefinition = {
        id: "test-tool",
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

      expect(() => registry.registerCapability(definition)).not.toThrow();
      expect(registry.getCapability("test-tool")).toEqual(definition);
    });

    it("throws error when current prompt version not in registry", () => {
      const definition: CapabilityDefinition = {
        id: "bad-tool",
        type: "tool",
        name: "Bad Tool",
        description: "Tool with missing prompt version",
        inputSchema: z.object({}),
        promptRegistry: {},
        currentPromptVersion: "v99", // Does not exist
        preparePromptInput: (input) => input,
        processResult: (input, result) => result.content,
      };

      expect(() => registry.registerCapability(definition)).toThrow(
        /Current version "v99" not found in registry/
      );
    });

    it("throws error when registering duplicate capability ID", () => {
      const definition: CapabilityDefinition = {
        id: "duplicate",
        type: "tool",
        name: "Duplicate",
        description: "Duplicate capability",
        inputSchema: z.object({}),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (input, result) => result.content,
      };

      registry.registerCapability(definition);

      expect(() => {
        registry.registerCapability(definition);
      }).toThrow("Capability duplicate already registered");
    });
  });

  describe("bindToMcpServer", () => {
    it("binds tools to MCP server with Zod-to-JSON-Schema conversion", () => {
      const definition: CapabilityDefinition = {
        id: "test-tool",
        type: "tool",
        name: "Test Tool",
        description: "A test tool",
        inputSchema: z.object({
          message: z.string().describe("Message to process"),
        }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: (input) => ({ userPrompt: JSON.stringify(input) }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (input, result) => ({ output: result.content }),
      };

      registry.registerCapability(definition);
      registry.bindToMcpServer(mockServer);

      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "test-tool",
        expect.objectContaining({
          title: "Test Tool",
          description: "A test tool",
          // MCP SDK accepts Zod schemas directly (not JSON Schema)
          inputSchema: expect.objectContaining({
            _def: expect.any(Object), // Zod schema has _def property
          }),
        }),
        expect.any(Function)
      );
    });
  });

  describe("handleCapabilityInvocation lifecycle", () => {
    let testCapability: CapabilityDefinition;

    beforeEach(() => {
      testCapability = {
        id: "echo-tool",
        type: "tool",
        name: "Echo Tool",
        description: "Echoes input",
        inputSchema: z.object({
          message: z.string().min(1).max(100),
        }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "Echo v1",
            deprecated: false,
            build: (input: unknown) => {
              const data = input as { message: string };
              return {
                systemPrompt: "You are an echo bot",
                userPrompt: `Echo this: ${data.message}`,
              };
            },
          },
        },
        currentPromptVersion: "v1",
        defaultRequestOptions: {
          model: "haiku",
          maxTurns: 10,
        },
        preparePromptInput: (input) => input,
        processResult: (input: unknown, result) => {
          const data = input as { message: string };
          return {
            echoed: data.message,
            aiResponse: result.content,
          };
        },
      };

      registry.registerCapability(testCapability);
    });

    it("validates input with Zod before creating session", async () => {
      const invalidInput = { message: "" }; // Too short

      const result = await registry.handleCapabilityInvocation("echo-tool", invalidInput);

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("ValidationError");
      expect(result.content[0]?.text).toContain("String must contain at least 1 character");
    });

    it("rejects invocation when server is shutting down", async () => {
      registry.setShuttingDown(true);

      const validInput = { message: "test" };

      const result = await registry.handleCapabilityInvocation("echo-tool", validInput);

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("ServerShuttingDown");
    });

    it("clamps AIQueryRequest values to server maximums", async () => {
      const badCapability: CapabilityDefinition = {
        id: "bad-request-tool",
        type: "tool",
        name: "Bad Request Tool",
        description: "Has excessive defaults",
        inputSchema: z.object({ input: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        defaultRequestOptions: {
          maxTurns: 500, // Exceeds MAX_TURNS (100), will be clamped
          maxBudgetUsd: 10.0, // Exceeds MAX_QUERY_BUDGET_USD (5.0), will be clamped
        },
        preparePromptInput: (_input) => ({}),
        processResult: (_input, result) => ({ output: result.content }),
      };

      registry.registerCapability(badCapability);

      // Should succeed - values are clamped, not rejected
      const result = await registry.handleCapabilityInvocation("bad-request-tool", { input: "test" });

      expect(result.isError).toBeUndefined(); // Success
      expect(result.content[0]?.text).toBeDefined();
    });

    it("creates CapabilityContext with all required fields", async () => {
      const preparePromptInputSpy = jest.fn(testCapability.preparePromptInput);
      testCapability.preparePromptInput = preparePromptInputSpy;

      // Don't re-register, testCapability is already registered in beforeEach

      await registry.handleCapabilityInvocation("echo-tool", { message: "test" });

      expect(preparePromptInputSpy).toHaveBeenCalledWith(
        { message: "test" },
        expect.objectContaining({
          session: expect.objectContaining({ id: expect.any(String) }),
          invocation: expect.objectContaining({ capability: "echo-tool" }),
          logger: expect.objectContaining({
            info: expect.any(Function),
            debug: expect.any(Function),
            error: expect.any(Function),
            warn: expect.any(Function),
          }),
          getSessionCost: expect.any(Function),
          promptVersion: "v1",
          providerName: expect.any(String),
          invokeCapability: expect.any(Function),
        })
      );
    });
  });

  describe("session_id in responses", () => {
    it("includes session_id in successful response JSON", async () => {
      const testCap: CapabilityDefinition = {
        id: "session-id-tool",
        type: "tool",
        name: "Session ID Tool",
        description: "Tests session_id injection",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      registry.registerCapability(testCap);

      const result = await registry.handleCapabilityInvocation("session-id-tool", { msg: "test" });

      expect(result.isError).toBeUndefined();
      const parsed = JSON.parse(result.content[0]?.text ?? "{}");
      expect(parsed.session_id).toBeDefined();
      expect(typeof parsed.session_id).toBe("string");
      expect(parsed.session_id.length).toBeGreaterThan(0);
    });

    it("includes session_id in error response JSON when session exists", async () => {
      const failingCap: CapabilityDefinition = {
        id: "session-id-error-tool",
        type: "tool",
        name: "Session ID Error Tool",
        description: "Tests session_id in error responses",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: () => {
          throw new Error("Intentional failure");
        },
      };

      registry.registerCapability(failingCap);

      const result = await registry.handleCapabilityInvocation("session-id-error-tool", { msg: "test" });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0]?.text ?? "{}");
      expect(parsed.session_id).toBeDefined();
      expect(typeof parsed.session_id).toBe("string");
    });

    it("includes session_id as null in error response when no session created", async () => {
      // Invoke a non-existent capability - error before session creation
      const result = await registry.handleCapabilityInvocation("non-existent-tool", { msg: "test" });

      expect(result.isError).toBe(true);
      const parsed = JSON.parse(result.content[0]?.text ?? "{}");
      expect(parsed.session_id).toBeNull();
    });

    it("includes session_id as null in shutdown error response", () => {
      const response = ServerShuttingDownError.toMcpResponse();
      const parsed = JSON.parse(response.content[0]?.text ?? "{}");
      expect(parsed.session_id).toBeNull();
    });
  });

  describe("preset systemPrompt and new request fields", () => {
    it("skips system prompt length validation for preset object", async () => {
      const presetCap: CapabilityDefinition = {
        id: "preset-prompt-tool",
        type: "tool",
        name: "Preset Prompt Tool",
        description: "Uses preset system prompt",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({
              systemPrompt: { type: "preset", preset: "claude_code" },
              userPrompt: "test prompt",
            }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      registry.registerCapability(presetCap);

      // Should succeed - preset systemPrompt should not be length-validated
      const result = await registry.handleCapabilityInvocation("preset-prompt-tool", { msg: "test" });

      expect(result.isError).toBeUndefined();

      // Verify preset was passed through to AI provider
      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          systemPrompt: { type: "preset", preset: "claude_code" },
        })
      );
    });

    it("passes tools, cwd, and allowDangerouslySkipPermissions from defaults to AI request", async () => {
      const toolsCap: CapabilityDefinition = {
        id: "tools-cap",
        type: "tool",
        name: "Tools Cap",
        description: "Capability with tools, cwd, and permissions",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        defaultRequestOptions: {
          model: "haiku",
          maxTurns: 10,
          tools: { type: "preset", preset: "claude_code" },
          cwd: "/some/directory",
          allowDangerouslySkipPermissions: true,
          permissionMode: "bypassPermissions",
        },
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      registry.registerCapability(toolsCap);

      await registry.handleCapabilityInvocation("tools-cap", { msg: "test" });

      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          tools: { type: "preset", preset: "claude_code" },
          cwd: "/some/directory",
          allowDangerouslySkipPermissions: true,
          permissionMode: "bypassPermissions",
        })
      );
    });

    it("extracts cwd from validated input to override defaults", async () => {
      const cwdCap: CapabilityDefinition = {
        id: "cwd-cap",
        type: "tool",
        name: "CWD Cap",
        description: "Capability that accepts cwd override",
        inputSchema: z.object({
          msg: z.string(),
          cwd: z.string().optional(),
        }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        defaultRequestOptions: {
          model: "haiku",
          cwd: "/default/path",
        },
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      registry.registerCapability(cwdCap);

      await registry.handleCapabilityInvocation("cwd-cap", {
        msg: "test",
        cwd: "/overridden/path",
      });

      // Input cwd should override default cwd
      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          cwd: "/overridden/path",
        })
      );
    });

    it("still validates string system prompt length", async () => {
      const longStringPromptCap: CapabilityDefinition = {
        id: "long-string-prompt",
        type: "tool",
        name: "Long String Prompt",
        description: "Cap with excessively long string system prompt",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({
              systemPrompt: "x".repeat(200_000), // Exceeds MAX_SYSTEM_PROMPT_LENGTH
              userPrompt: "test",
            }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      registry.registerCapability(longStringPromptCap);

      const result = await registry.handleCapabilityInvocation("long-string-prompt", { msg: "test" });

      expect(result.isError).toBe(true);
      expect(result.content[0]?.text).toContain("System prompt exceeds maximum length");
    });
  });

  describe("error boundaries", () => {
    it("continues operation when costReportWriter fails", async () => {
      const failingWriter = {
        writeSessionToReport: jest.fn<CostReportWriter["writeSessionToReport"]>().mockRejectedValue(new Error("Disk full")),
        getDailyTotalCost: jest.fn<CostReportWriter["getDailyTotalCost"]>().mockResolvedValue(0),
      } as unknown as CostReportWriter;

      const registryWithFailingWriter = new CapabilityRegistry({
        sessionManager,
        costTracker,
        costReportWriter: failingWriter,
        diskWriter,
        promptLoader,
        logger,
        aiProvider: mockAIProvider,
      });

      const testCap: CapabilityDefinition = {
        id: "test",
        type: "tool",
        name: "Test",
        description: "Test",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (input, result) => result.content,
      };

      registryWithFailingWriter.registerCapability(testCap);

      // Should not throw, should log error and continue
      const result = await registryWithFailingWriter.handleCapabilityInvocation("test", {
        msg: "test",
      });

      expect(result.isError).toBeUndefined(); // Successful despite writer failure
    });
  });

  describe("session log file lifecycle", () => {
    it("opens session log file when handling capability invocation", async () => {
      const openSessionSpy = jest.spyOn(diskWriter, "openSession");

      const testCap: CapabilityDefinition = {
        id: "test-session-log",
        type: "tool",
        name: "Test Session Log",
        description: "Test",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (input, result) => result.content,
      };

      registry.registerCapability(testCap);

      await registry.handleCapabilityInvocation("test-session-log", { msg: "test" });

      expect(openSessionSpy).toHaveBeenCalledWith(expect.any(String));
    });

    it("closes session log file after successful invocation", async () => {
      const closeSessionSpy = jest.spyOn(diskWriter, "closeSession");

      const testCap: CapabilityDefinition = {
        id: "test-session-close",
        type: "tool",
        name: "Test Session Close",
        description: "Test",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (input, result) => result.content,
      };

      registry.registerCapability(testCap);

      await registry.handleCapabilityInvocation("test-session-close", { msg: "test" });

      expect(closeSessionSpy).toHaveBeenCalledWith(expect.any(String));
    });

    it("closes session log file after failed invocation", async () => {
      const closeSessionSpy = jest.spyOn(diskWriter, "closeSession");

      // Create a capability that throws an error during processResult
      const failingCap: CapabilityDefinition = {
        id: "test-session-fail",
        type: "tool",
        name: "Test Session Fail",
        description: "Test",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: () => {
          throw new Error("Processing failed");
        },
      };

      registry.registerCapability(failingCap);

      const result = await registry.handleCapabilityInvocation("test-session-fail", { msg: "test" });

      expect(result.isError).toBe(true);
      expect(closeSessionSpy).toHaveBeenCalledWith(expect.any(String));
    });
  });

  describe("gracefulShutdown", () => {
    it("sets shuttingDown flag and closes all sessions", async () => {
      const session = sessionManager.createSession("test-cap");

      await registry.gracefulShutdown();

      expect(registry.isShuttingDown()).toBe(true);

      // Session should be closed
      const retrievedSession = sessionManager.getSession(session.id);
      expect(retrievedSession?.state).toBe("completed");
    });

    it("merges pending costs and writes reports", async () => {
      const writeSessionSpy = jest.spyOn(costReportWriter, "writeSessionToReport");

      const session = sessionManager.createSession("test-cap");
      const invocationId = sessionManager.startInvocation(session.id, "test-cap");

      // Record some cost (match CostTracker's recordCost signature - it doesn't require full CostEntry)
      // CostTracker.recordCost creates the internal CostRecord from the provided entry
      costTracker.recordCost(session.id, invocationId, "test-cap", {
        id: invocationId,
        sid: session.id,
        model: "haiku",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.001,
        timestamp: new Date().toISOString(),
      });

      await registry.gracefulShutdown();

      expect(writeSessionSpy).toHaveBeenCalled();
    });

    it("passes child cost entries when writing reports", async () => {
      const writeSessionSpy = jest.spyOn(costReportWriter, "writeSessionToReport");

      const session = sessionManager.createSession("parent-cap");
      const invocationId = sessionManager.startInvocation(session.id, "parent-cap");

      // Record child cost entry
      costTracker.recordChildCost(session.id, invocationId, "eng-executor", {
        id: "child-cost-1",
        sid: session.id,
        model: "sonnet",
        inputTokens: 600,
        outputTokens: 300,
        costUsd: 0.03,
        timestamp: new Date().toISOString(),
        childSessionId: "child123456789abcdef0123456789ab",
        turns: 3,
      });

      await registry.gracefulShutdown();

      expect(writeSessionSpy).toHaveBeenCalled();

      // Verify child entries were passed as third parameter
      const callArgs = writeSessionSpy.mock.calls[0];
      expect(callArgs).toBeDefined();
      const childEntries = callArgs?.[2];
      expect(childEntries).toBeDefined();
      expect(childEntries).toHaveLength(1);
      expect(childEntries?.[0]?.sid).toBe("child123456789abcdef0123456789ab");
      expect(childEntries?.[0]?.capability).toBe("eng-executor");
      expect(childEntries?.[0]?.costUsd).toBeCloseTo(0.03, 5);
      expect(childEntries?.[0]?.turns).toBe(3);
    });

    it("closes disk writer", async () => {
      const closeAllSpy = jest.spyOn(diskWriter, "closeAll");

      await registry.gracefulShutdown();

      expect(closeAllSpy).toHaveBeenCalled();
    });

    it("writes cost reports for completed sessions with costs", async () => {
      const writeSessionSpy = jest.spyOn(costReportWriter, "writeSessionToReport");

      // Create 1 active session with costs
      const activeSession = sessionManager.createSession("active-cap");
      const activeInvocationId = sessionManager.startInvocation(activeSession.id, "active-cap");
      costTracker.recordCost(activeSession.id, activeInvocationId, "active-cap", {
        id: activeInvocationId,
        sid: activeSession.id,
        model: "haiku",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.001,
        timestamp: new Date().toISOString(),
      });

      // Create 1 completed session with costs
      const completedSession = sessionManager.createSession("completed-cap");
      const completedInvocationId = sessionManager.startInvocation(completedSession.id, "completed-cap");
      costTracker.recordCost(completedSession.id, completedInvocationId, "completed-cap", {
        id: completedInvocationId,
        sid: completedSession.id,
        model: "sonnet",
        inputTokens: 200,
        outputTokens: 100,
        costUsd: 0.002,
        timestamp: new Date().toISOString(),
      });
      // Close the session manually to simulate completed state
      sessionManager.closeSession(completedSession.id);

      await registry.gracefulShutdown();

      // Should write reports for both sessions
      expect(writeSessionSpy).toHaveBeenCalledTimes(2);

      // Verify both sessions were written
      const sessionIds = writeSessionSpy.mock.calls.map(call => call[0]?.id);
      expect(sessionIds).toContain(activeSession.id);
      expect(sessionIds).toContain(completedSession.id);
    });

    it("skips sessions with zero costs", async () => {
      const writeSessionSpy = jest.spyOn(costReportWriter, "writeSessionToReport");

      // Create completed session with zero costs
      const sessionNoCosts = sessionManager.createSession("no-costs-cap");
      sessionManager.closeSession(sessionNoCosts.id);

      // Create another session with costs
      const sessionWithCosts = sessionManager.createSession("with-costs-cap");
      const invocationId = sessionManager.startInvocation(sessionWithCosts.id, "with-costs-cap");
      costTracker.recordCost(sessionWithCosts.id, invocationId, "with-costs-cap", {
        id: invocationId,
        sid: sessionWithCosts.id,
        model: "haiku",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.001,
        timestamp: new Date().toISOString(),
      });

      await registry.gracefulShutdown();

      // Should only write report for session with costs
      expect(writeSessionSpy).toHaveBeenCalledTimes(1);
      expect(writeSessionSpy.mock.calls[0]?.[0]?.id).toBe(sessionWithCosts.id);
    });
  });

  describe("invocation lifecycle logging", () => {
    let testCapability: CapabilityDefinition;
    let writeSpy: jest.SpiedFunction<DiskWriter["write"]>;

    beforeEach(() => {
      testCapability = {
        id: "echo-tool",
        type: "tool",
        name: "Echo Tool",
        description: "Echoes input",
        inputSchema: z.object({
          message: z.string().min(1).max(100),
        }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "Echo v1",
            deprecated: false,
            build: (input: unknown) => {
              const data = input as { message: string };
              return {
                systemPrompt: "You are an echo bot",
                userPrompt: `Echo this: ${data.message}`,
              };
            },
          },
        },
        currentPromptVersion: "v1",
        defaultRequestOptions: {
          model: "haiku",
          maxTurns: 10,
        },
        preparePromptInput: (input) => input,
        processResult: (input: unknown, result) => {
          const data = input as { message: string };
          return {
            echoed: data.message,
            aiResponse: result.content,
          };
        },
      };

      registry.registerCapability(testCapability);

      writeSpy = jest.spyOn(diskWriter, "write");
    });

    it("logs invocation start with sessionId and capability name", async () => {
      await registry.handleCapabilityInvocation("echo-tool", { message: "test" });

      // Wait for async writes
      await new Promise((resolve) => setTimeout(resolve, 50));

      const startCalls = writeSpy.mock.calls.filter((call) => {
        const entry = call[0];
        return entry?.message === "Capability invocation started" && entry?.level === "INFO";
      });

      expect(startCalls.length).toBeGreaterThanOrEqual(1);
      const startEntry = startCalls[0]?.[0];
      expect(startEntry?.context).toMatchObject({
        sid: expect.any(String),
        capability: "echo-tool",
        iid: expect.any(String),
        promptVersion: "v1",
      });
    });

    it("logs AI query completion with model, tokens, and cost", async () => {
      await registry.handleCapabilityInvocation("echo-tool", { message: "test" });

      // Wait for async writes
      await new Promise((resolve) => setTimeout(resolve, 50));

      const completedCalls = writeSpy.mock.calls.filter((call) => {
        const entry = call[0];
        return entry?.message === "AI query completed" && entry?.level === "INFO";
      });

      expect(completedCalls.length).toBeGreaterThanOrEqual(1);
      const completedEntry = completedCalls[0]?.[0];
      expect(completedEntry?.context).toMatchObject({
        sid: expect.any(String),
        iid: expect.any(String),
        model: expect.any(String),
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.001,
        turns: 1,
        terminationReason: "success",
        hasTrace: true,
      });
    });

    it("logs AI execution trace as separate debug entry", async () => {
      await registry.handleCapabilityInvocation("echo-tool", { message: "test" });

      // Wait for async writes
      await new Promise((resolve) => setTimeout(resolve, 50));

      const traceCalls = writeSpy.mock.calls.filter((call) => {
        const entry = call[0];
        return entry?.message === "ai.execution_trace" && entry?.level === "DEBUG";
      });

      expect(traceCalls.length).toBeGreaterThanOrEqual(1);
      const traceEntry = traceCalls[0]?.[0];
      expect(traceEntry?.context?.sid).toBeDefined();
      expect(traceEntry?.context?.iid).toBeDefined();
      expect(traceEntry?.context?.trace).toMatchObject({
        tid: expect.any(String),
        startedAt: expect.any(String),
      });
    });

    it("logs invocation completion with cost summary", async () => {
      await registry.handleCapabilityInvocation("echo-tool", { message: "test" });

      // Wait for async writes
      await new Promise((resolve) => setTimeout(resolve, 50));

      const completionCalls = writeSpy.mock.calls.filter((call) => {
        const entry = call[0];
        return entry?.message === "Capability invocation completed" && entry?.level === "INFO";
      });

      expect(completionCalls.length).toBeGreaterThanOrEqual(1);
      const completionEntry = completionCalls[0]?.[0];
      expect(completionEntry?.context).toMatchObject({
        sid: expect.any(String),
        iid: expect.any(String),
        status: "success",
        totalCostUsd: expect.any(Number),
        totalInputTokens: expect.any(Number),
        totalOutputTokens: expect.any(Number),
      });
    });

    it("includes sessionId in error log context", async () => {
      // Create a capability that throws an error
      const failingCap: CapabilityDefinition = {
        id: "failing-tool",
        type: "tool",
        name: "Failing Tool",
        description: "Fails",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: () => {
          throw new Error("Processing failed");
        },
      };

      registry.registerCapability(failingCap);

      await registry.handleCapabilityInvocation("failing-tool", { msg: "test" });

      // Wait for async writes
      await new Promise((resolve) => setTimeout(resolve, 50));

      const errorCalls = writeSpy.mock.calls.filter((call) => {
        const entry = call[0];
        return entry?.message === "Capability invocation failed" && entry?.level === "ERROR";
      });

      expect(errorCalls.length).toBeGreaterThanOrEqual(1);
      const errorEntry = errorCalls[0]?.[0];
      expect(errorEntry?.context).toMatchObject({
        capability: "failing-tool",
        sid: expect.any(String),
        iid: expect.any(String),
        error: "Processing failed",
        errorType: "Error",
      });
    });

    it("does not log execution trace when trace is missing", async () => {
      // Mock AI provider without trace
      mockAIProvider.query = jest.fn<AIProvider["query"]>().mockResolvedValue({
        content: "AI response",
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        costUsd: 0.001,
        turns: 1,
        terminationReason: "success",
        trace: undefined!,
      } as AIQueryResult);

      await registry.handleCapabilityInvocation("echo-tool", { message: "test" });

      // Wait for async writes
      await new Promise((resolve) => setTimeout(resolve, 50));

      // Should log AI query completed with hasTrace: false
      const completedCalls = writeSpy.mock.calls.filter((call) => {
        const entry = call[0];
        return entry?.message === "AI query completed" && entry?.level === "INFO";
      });

      expect(completedCalls.length).toBeGreaterThanOrEqual(1);
      const completedEntry = completedCalls[0]?.[0];
      expect(completedEntry?.context?.hasTrace).toBe(false);

      // Should NOT log ai.execution_trace
      const traceCalls = writeSpy.mock.calls.filter((call) => {
        const entry = call[0];
        return entry?.message === "ai.execution_trace";
      });

      expect(traceCalls.length).toBe(0);
    });
  });

  describe("capability visibility filtering", () => {
    it("binds public tools to MCP server by default", () => {
      const publicTool: CapabilityDefinition = {
        id: "public-tool",
        type: "tool",
        name: "Public Tool",
        description: "A public tool",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      registry.registerCapability(publicTool);
      registry.bindToMcpServer(mockServer);

      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "public-tool",
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("binds tools with explicit visibility: public to MCP server", () => {
      const explicitPublicTool: CapabilityDefinition = {
        id: "explicit-public-tool",
        type: "tool",
        name: "Explicit Public Tool",
        description: "Explicitly public tool",
        visibility: "public",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      registry.registerCapability(explicitPublicTool);
      registry.bindToMcpServer(mockServer);

      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "explicit-public-tool",
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("does NOT bind internal tools to MCP server", () => {
      const internalTool: CapabilityDefinition = {
        id: "internal-tool",
        type: "tool",
        name: "Internal Tool",
        description: "An internal tool",
        visibility: "internal",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      // Clear previous calls
      (mockServer.registerTool as jest.Mock).mockClear();

      registry.registerCapability(internalTool);
      registry.bindToMcpServer(mockServer);

      // Internal tool should NOT be registered
      expect(mockServer.registerTool).not.toHaveBeenCalledWith(
        "internal-tool",
        expect.any(Object),
        expect.any(Function)
      );
    });

    it("filters mixed public and internal tools correctly", () => {
      const publicTool: CapabilityDefinition = {
        id: "mixed-public",
        type: "tool",
        name: "Mixed Public",
        description: "Public tool in mixed scenario",
        visibility: "public",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      const internalTool: CapabilityDefinition = {
        id: "mixed-internal",
        type: "tool",
        name: "Mixed Internal",
        description: "Internal tool in mixed scenario",
        visibility: "internal",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      // Clear previous calls
      (mockServer.registerTool as jest.Mock).mockClear();

      registry.registerCapability(publicTool);
      registry.registerCapability(internalTool);
      registry.bindToMcpServer(mockServer);

      // Should register public tool
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "mixed-public",
        expect.any(Object),
        expect.any(Function)
      );

      // Should NOT register internal tool
      expect(mockServer.registerTool).not.toHaveBeenCalledWith(
        "mixed-internal",
        expect.any(Object),
        expect.any(Function)
      );

      // Should have been called exactly once (only for public tool)
      expect(mockServer.registerTool).toHaveBeenCalledTimes(1);
    });

    it("binds capabilities without visibility as public by default", () => {
      const defaultVisibilityTool: CapabilityDefinition = {
        id: "default-visibility-tool",
        type: "tool",
        name: "Default Visibility Tool",
        description: "Tool without explicit visibility field",
        // No visibility field specified
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: () => ({ userPrompt: "test" }),
          },
        },
        currentPromptVersion: "v1",
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      // Clear previous calls
      (mockServer.registerTool as jest.Mock).mockClear();

      registry.registerCapability(defaultVisibilityTool);
      registry.bindToMcpServer(mockServer);

      // Should register tool with default public visibility
      expect(mockServer.registerTool).toHaveBeenCalledWith(
        "default-visibility-tool",
        expect.any(Object),
        expect.any(Function)
      );
    });
  });

  describe("enhanced default request options pass-through", () => {
    it("should pass appendSystemPrompt from defaults to AIQueryRequest", async () => {
      const capWithAppendPrompt: CapabilityDefinition = {
        id: "append-prompt-tool",
        type: "tool",
        name: "Append Prompt Tool",
        description: "Tests appendSystemPrompt pass-through",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: (input: unknown) => ({ userPrompt: (input as { msg: string }).msg }),
          },
        },
        currentPromptVersion: "v1",
        defaultRequestOptions: {
          model: "haiku",
          appendSystemPrompt: "Always respond concisely.",
        },
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      registry.registerCapability(capWithAppendPrompt);
      await registry.handleCapabilityInvocation("append-prompt-tool", { msg: "test" });

      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          appendSystemPrompt: "Always respond concisely.",
        })
      );
    });

    it("should pass customAgentTools from defaults to AIQueryRequest", async () => {
      const customTool = {
        name: "custom_tool",
        description: "A custom tool",
        inputSchema: { type: "object", properties: { arg: { type: "string" } } },
      };

      const capWithCustomTools: CapabilityDefinition = {
        id: "custom-tools-cap",
        type: "tool",
        name: "Custom Tools Cap",
        description: "Tests customAgentTools pass-through",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: (input: unknown) => ({ userPrompt: (input as { msg: string }).msg }),
          },
        },
        currentPromptVersion: "v1",
        defaultRequestOptions: {
          model: "haiku",
          customAgentTools: [customTool],
        },
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      registry.registerCapability(capWithCustomTools);
      await registry.handleCapabilityInvocation("custom-tools-cap", { msg: "test" });

      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          customAgentTools: [customTool],
        })
      );
    });

    it("should pass allowedAgentTools and disallowedAgentTools from defaults to AIQueryRequest", async () => {
      const capWithToolFilters: CapabilityDefinition = {
        id: "tool-filters-cap",
        type: "tool",
        name: "Tool Filters Cap",
        description: "Tests allowedAgentTools and disallowedAgentTools pass-through",
        inputSchema: z.object({ msg: z.string() }),
        promptRegistry: {
          v1: {
            version: "v1",
            createdAt: new Date().toISOString(),
            description: "V1",
            deprecated: false,
            build: (input: unknown) => ({ userPrompt: (input as { msg: string }).msg }),
          },
        },
        currentPromptVersion: "v1",
        defaultRequestOptions: {
          model: "haiku",
          allowedAgentTools: ["Read", "Write"],
          disallowedAgentTools: ["Bash"],
        },
        preparePromptInput: (input) => input,
        processResult: (_input, result) => ({ output: result.content }),
      };

      registry.registerCapability(capWithToolFilters);
      await registry.handleCapabilityInvocation("tool-filters-cap", { msg: "test" });

      expect(mockAIProvider.query).toHaveBeenCalledWith(
        expect.objectContaining({
          allowedAgentTools: ["Read", "Write"],
          disallowedAgentTools: ["Bash"],
        })
      );
    });
  });
});
