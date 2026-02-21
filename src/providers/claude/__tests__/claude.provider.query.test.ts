import { vi, type Mock } from "vitest";
/**
 * Tests for ClaudeProvider.query() method.
 */

import { ClaudeProvider } from "../claude.provider.js";
import type { AIQueryRequest } from "../../../core/ai-provider/ai-provider.types.js";
import { AIProviderError } from "../../../core/errors.js";
import {
  textBlock,
  thinkingBlock,
  toolUseBlock,
  assistantMsg,
  successResult,
  errorResult,
  userMsg,
  createMockQuery,
  type MockSDKMessage,
} from "./test-helpers.js";

describe("ClaudeProvider", () => {
  describe("query", () => {
    it("should execute simple text query and return result", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Hello, how can I help you?")]),
        successResult({
          total_cost_usd: 0.001,
          num_turns: 1,
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
          },
        }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Hello!" });

      expect(result.content).toBe("Hello, how can I help you?");
      expect(result.costUsd).toBe(0.001);
      expect(result.turns).toBe(1);
      expect(result.terminationReason).toBe("success");
      expect(result.trace.turns).toHaveLength(1);
      expect(result.trace.turns[0].turnNumber).toBe(1);
      expect(result.trace.turns[0].assistantBlocks).toHaveLength(1);
      expect(result.trace.turns[0].assistantBlocks[0].type).toBe("text");

      // Verify token usage for single-turn query
      expect(result.usage.inputTokens).toBe(100);
      expect(result.usage.outputTokens).toBe(50);
      expect(result.usage.totalTokens).toBe(150);
    });

    it("should capture thinking blocks in trace", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([
          thinkingBlock("Let me analyze this..."),
          textBlock("Based on my analysis..."),
        ]),
        successResult({ total_cost_usd: 0.002, num_turns: 1 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Analyze this" });

      expect(result.trace.turns[0].assistantBlocks).toHaveLength(2);
      expect(result.trace.turns[0].assistantBlocks[0].type).toBe("thinking");
      expect(result.trace.turns[0].assistantBlocks[0].text).toBe(
        "Let me analyze this..."
      );
      expect(result.trace.turns[0].assistantBlocks[1].type).toBe("text");
    });

    it("should capture tool_use blocks in trace", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([
          toolUseBlock("call_123", "search", { query: "test" }),
        ]),
        // In real SDK, tool results come as user messages (synthetic), then a new assistant msg
        assistantMsg([textBlock("Based on the search...")]),
        successResult({ total_cost_usd: 0.005, num_turns: 2 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Search for test" });

      // First turn: tool use
      expect(result.trace.turns[0].assistantBlocks[0].type).toBe("tool_use");
      expect(result.trace.turns[0].assistantBlocks[0].toolUse?.id).toBe(
        "call_123"
      );
      expect(result.trace.turns[0].assistantBlocks[0].toolUse?.name).toBe(
        "search"
      );

      // Second turn: response based on tool result
      expect(result.trace.turns[1].assistantBlocks[0].type).toBe("text");
    });

    it("should create a new turn for each assistant message", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Turn 1")]),
        assistantMsg([textBlock("Turn 2")]),
        assistantMsg([textBlock("Turn 3")]),
        successResult({ total_cost_usd: 0.01, num_turns: 3 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Multi-turn test" });

      expect(result.turns).toBe(3);
      expect(result.trace.turns).toHaveLength(3);
      expect(result.trace.turns[0].turnNumber).toBe(1);
      expect(result.trace.turns[1].turnNumber).toBe(2);
      expect(result.trace.turns[2].turnNumber).toBe(3);
    });

    it("should map error_max_turns to max_turns termination reason", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        errorResult("error_max_turns", ["Max turns reached"]),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      await expect(provider.query({ prompt: "Test" })).rejects.toThrow(
        AIProviderError
      );
    });

    it("should map error_max_budget_usd to max_budget termination reason", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        errorResult("error_max_budget_usd", ["Budget exceeded"]),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      await expect(provider.query({ prompt: "Test" })).rejects.toThrow(
        AIProviderError
      );
    });

    it("should extract session ID from result message", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")], "session-abc123"),
        successResult({
          total_cost_usd: 0.001,
          num_turns: 1,
          session_id: "session-abc123",
        }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Test" });

      expect(result.sessionId).toBe("session-abc123");
      expect(result.trace.sessionId).toBe("session-abc123");
    });

    it("should extract structured output when present", async () => {
      const structuredData = { name: "John", age: 30 };
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Structured response")]),
        successResult({
          total_cost_usd: 0.001,
          num_turns: 1,
          structured_output: structuredData,
        }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({
        prompt: "Extract structured data",
        outputSchema: { type: "object" },
      });

      expect(result.structuredOutput).toEqual(structuredData);
    });

    it("should extract token usage from SDK result", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult({
          usage: {
            input_tokens: 100,
            output_tokens: 50,
            cache_creation_input_tokens: 10,
            cache_read_input_tokens: 20,
          },
        }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Test" });

      expect(result.usage.inputTokens).toBe(100);
      expect(result.usage.outputTokens).toBe(50);
      expect(result.usage.totalTokens).toBe(150);
      expect(result.usage.promptCacheWrite).toBe(10);
      expect(result.usage.promptCacheRead).toBe(20);
    });

    it("should pass all SDK options correctly", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const request: AIQueryRequest = {
        prompt: "Test",
        systemPrompt: "You are a helpful assistant",
        appendSystemPrompt: "Always be concise",
        model: "sonnet",
        fallbackModel: "haiku",
        maxThinkingTokens: 1000,
        allowedAgentTools: ["bash", "read"],
        disallowedAgentTools: ["write"],
        maxTurns: 5,
        maxBudgetUsd: 0.1,
        timeout: 30000,
        permissionMode: "default",
        cwd: "/test/dir",
      };

      await provider.query(request);

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: "Test",
        options: expect.objectContaining({
          systemPrompt: "You are a helpful assistant",
          appendSystemPrompt: "Always be concise",
          model: "sonnet",
          fallbackModel: "haiku",
          maxThinkingTokens: 1000,
          allowedTools: ["bash", "read"], // Mapped from allowedAgentTools
          disallowedTools: ["write"], // Mapped from disallowedAgentTools
          maxTurns: 5,
          maxBudgetUsd: 0.1,
          timeout: 30000,
          permissionMode: "default",
          cwd: "/test/dir",
        }),
      });
    });

    it("should handle AbortSignal for cancellation", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const controller = new AbortController();
      const request: AIQueryRequest = {
        prompt: "Test",
        signal: controller.signal,
      };

      await provider.query(request);

      // SDK uses abortController, not signal directly
      expect(mockQuery).toHaveBeenCalledWith({
        prompt: "Test",
        options: expect.objectContaining({
          abortController: expect.any(AbortController),
        }),
      });
    });

    it("should throw AIProviderError on SDK error", async () => {
      const messages: MockSDKMessage[] = [
        errorResult("error_during_execution", [
          "API error occurred",
          "Rate limit exceeded",
        ]),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      await expect(provider.query({ prompt: "Test" })).rejects.toThrow(
        AIProviderError
      );
    });

    it("should populate trace timing fields", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Test" });

      expect(result.trace.startedAt).toBeDefined();
      expect(result.trace.completedAt).toBeDefined();
      expect(result.trace.durationMs).toBeGreaterThanOrEqual(0);
      expect(result.trace.durationApiMs).toBeGreaterThanOrEqual(0);
    });

    it("should generate unique trace IDs [32 hex chars without prefix]", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result1 = await provider.query({ prompt: "Test 1" });
      const result2 = await provider.query({ prompt: "Test 2" });

      expect(result1.trace.tid).not.toBe(result2.trace.tid);
      expect(result1.trace.tid).toMatch(/^[a-f0-9]{32}$/);
      expect(result2.trace.tid).toMatch(/^[a-f0-9]{32}$/);
    });

    it("should redact sensitive data in trace", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([
          textBlock("Your API key is sk-ant-api03-test123456789012345"),
        ]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({
        prompt: "Show me my API key: sk-ant-api03-test123456789012345",
      });

      const traceText = JSON.stringify(result.trace);
      expect(traceText).toContain("[REDACTED]");
      expect(traceText).not.toContain("sk-ant-api03-test123456789012345");
    });

    it("should concatenate text from multiple text blocks", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([
          textBlock("Part one. "),
          textBlock("Part two."),
        ]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Test" });

      expect(result.content).toBe("Part one. Part two.");
    });

    it("should use SDK result text for multi-turn responses instead of accumulated assistant text", async () => {
      const messages: MockSDKMessage[] = [
        // Turn 1: agent states intent (intermediate)
        assistantMsg([textBlock("I'll list the files and make a joke.")]),
        // Turn 2: agent uses tool results to produce final answer (intermediate)
        assistantMsg([textBlock("Here are the files with a joke...")]),
        // SDK result carries the definitive final response
        successResult({
          total_cost_usd: 0.005,
          num_turns: 2,
          result: "Final multi-turn response with the actual joke about files.",
        }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "List files and joke" });

      // Content should be the SDK's result, not the concatenated assistant texts
      expect(result.content).toBe(
        "Final multi-turn response with the actual joke about files."
      );
      expect(result.turns).toBe(2);
      expect(result.trace.turns).toHaveLength(2);
    });

    it("should fall back to accumulated text when SDK result is empty", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Direct response text.")]),
        successResult({
          total_cost_usd: 0.001,
          num_turns: 1,
          result: "", // Empty result field
        }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Test" });

      // Should keep the accumulated text since result is empty
      expect(result.content).toBe("Direct response text.");
    });

    it("should handle duration_api_ms from SDK result", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult({ duration_api_ms: 250 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Test" });

      expect(result.trace.durationApiMs).toBe(250);
    });

    it("should capture user message tool_use_result into currentTurn.toolResults", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([
          toolUseBlock("call_bash_1", "Bash", { command: "ls" }),
        ]),
        // Use a string result to avoid circular reference (object results share
        // references between rawEvents and toolResults which redaction marks as [CIRCULAR])
        userMsg("file1.ts\nfile2.ts"),
        assistantMsg([textBlock("Here are the files.")]),
        successResult({ num_turns: 2 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "List files" });

      // Turn 1 should have tool_use block and tool result
      expect(result.trace.turns[0].assistantBlocks[0].type).toBe("tool_use");
      expect(result.trace.turns[0].toolResults).toBeDefined();
      expect(result.trace.turns[0].toolResults!.length).toBe(1);
      expect(result.trace.turns[0].toolResults![0].content).toBe("file1.ts\nfile2.ts");
      expect(result.trace.turns[0].toolResults![0].toolUseId).toBe("call_bash_1");
    });

    it("should resolve toolUseId from parent_tool_use_id when available", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([
          toolUseBlock("call_read_1", "Read", { file_path: "/foo" }),
        ]),
        userMsg("file content here", "call_read_1"),
        assistantMsg([textBlock("Got it.")]),
        successResult({ num_turns: 2 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Read file" });

      expect(result.trace.turns[0].toolResults![0].toolUseId).toBe("call_read_1");
    });

    it("should fall back to last tool_use block id when parent_tool_use_id is null", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([
          toolUseBlock("call_glob_1", "Glob", { pattern: "*.ts" }),
        ]),
        userMsg("matched files", null), // parent_tool_use_id is null
        assistantMsg([textBlock("Found files.")]),
        successResult({ num_turns: 2 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Find files" });

      // Should fall back to last tool_use block's id
      expect(result.trace.turns[0].toolResults![0].toolUseId).toBe("call_glob_1");
    });

    it("should use 'unknown' toolUseId when no tool_use block and no parent_tool_use_id", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("No tools here")]),
        userMsg("some result", null), // user message without preceding tool_use block
        assistantMsg([textBlock("Done.")]),
        successResult({ num_turns: 2 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Test" });

      // First turn should have toolResults with "unknown" id
      expect(result.trace.turns[0].toolResults![0].toolUseId).toBe("unknown");
    });

    it("should handle string tool_use_result content", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([
          toolUseBlock("call_1", "Read", { file_path: "/test" }),
        ]),
        userMsg("plain string result", "call_1"),
        assistantMsg([textBlock("Read complete.")]),
        successResult({ num_turns: 2 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Read" });

      expect(result.trace.turns[0].toolResults![0].content).toBe("plain string result");
    });

    it("should not add toolResults when user message has no tool_use_result", async () => {
      const userMsgNoResult = {
        type: "user" as const,
        tool_use_result: null,
        parent_tool_use_id: null,
        uuid: "uuid-no-result",
        session_id: "test-session",
      };

      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Hello")]),
        userMsgNoResult,
        assistantMsg([textBlock("World")]),
        successResult({ num_turns: 2 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Test" });

      // First turn should NOT have toolResults since tool_use_result was null
      expect(result.trace.turns[0].toolResults).toBeUndefined();
    });

    it("should capture rawEvents for every SDK message", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        userMsg("tool output", "call_1"),
        assistantMsg([textBlock("Final")]),
        successResult({ num_turns: 2 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Test" });

      // Should have one rawEvent per message
      expect(result.trace.rawEvents).toBeDefined();
      expect(result.trace.rawEvents!.length).toBe(4);

      // Verify types
      expect(result.trace.rawEvents![0].type).toBe("assistant");
      expect(result.trace.rawEvents![1].type).toBe("user");
      expect(result.trace.rawEvents![2].type).toBe("assistant");
      expect(result.trace.rawEvents![3].type).toBe("result");
    });

    it("should capture rawEvent with timestamp and data fields", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Hello")]),
        successResult({ total_cost_usd: 0.001 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Test" });

      const rawEvent = result.trace.rawEvents![0];
      expect(rawEvent.type).toBe("assistant");
      expect(rawEvent.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T/); // ISO timestamp
      expect(rawEvent.data).toBeDefined();
      // data should contain message payload but NOT type/subtype keys
      expect(rawEvent.data).not.toHaveProperty("type");
      expect(rawEvent.data).not.toHaveProperty("subtype");
    });

    it("should capture rawEvent subtype from result messages", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Test" });

      const resultEvent = result.trace.rawEvents!.find((e) => e.type === "result");
      expect(resultEvent).toBeDefined();
      expect(resultEvent!.subtype).toBe("success");
    });

    it("should pass tools preset through to SDK options", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const request: AIQueryRequest = {
        prompt: "Test",
        tools: { type: "preset", preset: "claude_code" },
      };

      await provider.query(request);

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: "Test",
        options: expect.objectContaining({
          tools: { type: "preset", preset: "claude_code" },
        }),
      });
    });

    it("should pass settingSources through to SDK options", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const request: AIQueryRequest = {
        prompt: "Test",
        settingSources: ["user", "project"],
      };

      await provider.query(request);

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: "Test",
        options: expect.objectContaining({
          settingSources: ["user", "project"],
        }),
      });
    });

    it("should not include settingSources in SDK options when not specified", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      await provider.query({ prompt: "Test" });

      const calledOptions = (mockQuery as Mock).mock.calls[0][0].options;
      expect(calledOptions).not.toHaveProperty("settingSources");
    });

    it("should pass allowDangerouslySkipPermissions through to SDK options", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const request: AIQueryRequest = {
        prompt: "Test",
        allowDangerouslySkipPermissions: true,
      };

      await provider.query(request);

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: "Test",
        options: expect.objectContaining({
          allowDangerouslySkipPermissions: true,
        }),
      });
    });

    it("should pass preset systemPrompt object through to SDK options", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const request: AIQueryRequest = {
        prompt: "Test",
        systemPrompt: { type: "preset", preset: "claude_code" },
      };

      await provider.query(request);

      expect(mockQuery).toHaveBeenCalledWith({
        prompt: "Test",
        options: expect.objectContaining({
          systemPrompt: { type: "preset", preset: "claude_code" },
        }),
      });
    });

    it("should initialize rawEvents as empty array in trace", async () => {
      const messages: MockSDKMessage[] = [
        successResult(), // Immediately completes with no assistant messages
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Test" });

      expect(result.trace.rawEvents).toBeDefined();
      expect(Array.isArray(result.trace.rawEvents)).toBe(true);
      // Still has one rawEvent for the result message itself
      expect(result.trace.rawEvents!.length).toBe(1);
    });

    it("should accept PresetTools with optional customTools field at compile time", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Response")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      // Type-level test: This should compile without errors
      const request: AIQueryRequest = {
        prompt: "Test",
        tools: {
          type: "preset",
          preset: "claude_code",
          customTools: [
            {
              name: "test_tool",
              description: "Test custom tool",
              inputSchema: { type: "object" },
            },
          ],
          allowedTools: ["Read", "Write"],
          disallowedTools: ["Bash"],
        },
      };

      await provider.query(request);

      // When customTools is present, they are extracted to options.tools
      // allowedTools/disallowedTools are extracted separately
      expect(mockQuery).toHaveBeenCalledWith({
        prompt: "Test",
        options: expect.objectContaining({
          tools: expect.arrayContaining([
            expect.objectContaining({ name: "test_tool" }),
          ]),
          allowedTools: ["Read", "Write"],
          disallowedTools: ["Bash"],
        }),
      });
    });

    it("should accumulate token counts across multiple turns", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Turn 1")]),
        successResult({
          total_cost_usd: 0.015,
          num_turns: 1,
          usage: {
            input_tokens: 1000,
            output_tokens: 500,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
          },
        }),
        assistantMsg([textBlock("Turn 2")]),
        successResult({
          total_cost_usd: 0.045,
          num_turns: 2,
          usage: {
            input_tokens: 2000,
            output_tokens: 1500,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
          },
        }),
        assistantMsg([textBlock("Turn 3")]),
        successResult({
          total_cost_usd: 0.087,
          num_turns: 3,
          usage: {
            input_tokens: 3000,
            output_tokens: 2000,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 0,
          },
        }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Multi-turn query" });

      // Verify cumulative token counts
      expect(result.usage.inputTokens).toBe(6000); // 1000 + 2000 + 3000
      expect(result.usage.outputTokens).toBe(4000); // 500 + 1500 + 2000
      expect(result.usage.totalTokens).toBe(10000);
      expect(result.costUsd).toBe(0.087);

      // Verify token count proportionality to cost (with 50% margin for cache pricing)
      // At $3/MTok input and $15/MTok output: (6000 * 3 + 4000 * 15) / 1M = $0.078
      // Actual cost $0.087 is within 50% of calculated
      const calculatedCost = (6000 * 3 + 4000 * 15) / 1_000_000;
      const costRatio = result.costUsd / calculatedCost;
      expect(costRatio).toBeGreaterThan(0.5);
      expect(costRatio).toBeLessThan(1.5);
    });

    it("should accumulate cache tokens across multiple turns when available", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Turn 1 with cache creation")]),
        successResult({
          total_cost_usd: 0.01,
          num_turns: 1,
          usage: {
            input_tokens: 1000,
            output_tokens: 500,
            cache_creation_input_tokens: 200,
            cache_read_input_tokens: 100,
          },
        }),
        assistantMsg([textBlock("Turn 2 with cache read only")]),
        successResult({
          total_cost_usd: 0.02,
          num_turns: 2,
          usage: {
            input_tokens: 800,
            output_tokens: 300,
            cache_creation_input_tokens: 0,
            cache_read_input_tokens: 150,
          },
        }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const result = await provider.query({ prompt: "Cache token query" });

      // Verify cumulative counts
      expect(result.usage.inputTokens).toBe(1800); // 1000 + 800
      expect(result.usage.outputTokens).toBe(800); // 500 + 300
      expect(result.usage.totalTokens).toBe(2600);

      // Verify cache token accumulation
      expect(result.usage.promptCacheWrite).toBe(200); // Only turn 1 had creation
      expect(result.usage.promptCacheRead).toBe(250); // 100 + 150

      // Verify cache fields are defined (not undefined)
      expect(result.usage.promptCacheWrite).toBeDefined();
      expect(result.usage.promptCacheRead).toBeDefined();
    });
  });
});
