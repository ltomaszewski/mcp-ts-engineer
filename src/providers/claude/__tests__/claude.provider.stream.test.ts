/**
 * Tests for ClaudeProvider.stream() method.
 */

import { describe, it, expect } from "@jest/globals";
import { ClaudeProvider } from "../claude.provider.js";
import {
  textBlock,
  thinkingBlock,
  toolUseBlock,
  assistantMsg,
  successResult,
  createMockQuery,
  type MockSDKMessage,
} from "./test-helpers.js";

describe("ClaudeProvider", () => {
  describe("stream", () => {
    it("should yield text_delta events", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Hello ")]),
        assistantMsg([textBlock("World")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const events = [];
      for await (const event of provider.stream!({ prompt: "Test" })) {
        events.push(event);
      }

      const textEvents = events.filter((e) => e.type === "text_delta");
      expect(textEvents).toHaveLength(2);
      expect(textEvents[0]).toEqual({ type: "text_delta", text: "Hello " });
      expect(textEvents[1]).toEqual({ type: "text_delta", text: "World" });
    });

    it("should yield thinking_delta events", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([thinkingBlock("Analyzing...")]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const events = [];
      for await (const event of provider.stream!({ prompt: "Test" })) {
        events.push(event);
      }

      const thinkingEvents = events.filter((e) => e.type === "thinking_delta");
      expect(thinkingEvents).toHaveLength(1);
      expect(thinkingEvents[0]).toEqual({
        type: "thinking_delta",
        text: "Analyzing...",
      });
    });

    it("should yield tool_use_start events", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([toolUseBlock("call_1", "search", {})]),
        successResult(),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const events = [];
      for await (const event of provider.stream!({ prompt: "Test" })) {
        events.push(event);
      }

      const toolEvents = events.filter((e) => e.type === "tool_use_start");
      expect(toolEvents).toHaveLength(1);
      expect(toolEvents[0]).toEqual({
        type: "tool_use_start",
        toolUseId: "call_1",
        name: "search",
      });
    });

    it("should yield turn_complete and result events", async () => {
      const messages: MockSDKMessage[] = [
        assistantMsg([textBlock("Done")]),
        successResult({ total_cost_usd: 0.005, num_turns: 1 }),
      ];

      const mockQuery = createMockQuery(messages);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const provider = new ClaudeProvider(mockQuery as any);

      const events = [];
      for await (const event of provider.stream!({ prompt: "Test" })) {
        events.push(event);
      }

      const turnCompleteEvents = events.filter(
        (e) => e.type === "turn_complete"
      );
      expect(turnCompleteEvents).toHaveLength(1);

      const resultEvents = events.filter((e) => e.type === "result");
      expect(resultEvents).toHaveLength(1);
    });
  });
});
