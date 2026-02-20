/**
 * Integration tests for cost propagation through invokeCapability().
 * Tests child-to-parent cost propagation across nested capability invocations.
 */

import { describe, it, expect, jest, beforeEach, afterEach } from "@jest/globals";
import path from "path";
import { fileURLToPath } from "url";
import { CapabilityRegistry } from "../capability-registry.js";
import type { CapabilityDefinition } from "../capability-registry.types.js";
import { z } from "zod";
import { SessionManager } from "../../session/session.manager.js";
import { CostTracker } from "../../cost/cost.tracker.js";
import { CostReportWriter } from "../../cost/cost-report.writer.js";
import { DiskWriter } from "../../logger/disk-writer.js";
import { PromptLoader } from "../../prompt/prompt.loader.js";
import { Logger } from "../../logger/logger.js";
import type { AIProvider, AIQueryResult } from "../../ai-provider/ai-provider.types.js";

describe("Cost Propagation Integration", () => {
  let registry: CapabilityRegistry;
  let sessionManager: SessionManager;
  let costTracker: CostTracker;
  let costReportWriter: CostReportWriter;
  let diskWriter: DiskWriter;
  let promptLoader: PromptLoader;
  let logger: Logger;
  let mockAIProvider: AIProvider;

  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const logsTestsDir = path.join(__dirname, "../../../../logs_tests/cost-propagation");

  beforeEach(async () => {
    sessionManager = new SessionManager();
    costTracker = new CostTracker();
    costReportWriter = new CostReportWriter(path.join(logsTestsDir, "reports"));
    diskWriter = new DiskWriter(logsTestsDir);
    promptLoader = new PromptLoader();
    logger = new Logger({ diskWriter });

    mockAIProvider = {
      query: jest.fn<AIProvider["query"]>().mockResolvedValue({
        content: "AI response",
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        costUsd: 0.01,
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
  });

  afterEach(async () => {
    await diskWriter.closeAll();
  });

  /**
   * Scenario 3: Nested children (A invokes B which invokes C).
   * A's cost includes B's cost (which itself includes C's cost).
   */
  describe("Nested capability invocations", () => {
    it("propagates cost from C → B → A across three levels", async () => {
      // Define capability C (leaf - no children)
      const capabilityC: CapabilityDefinition = {
        id: "capability-c",
        type: "tool",
        name: "Capability C",
        description: "Leaf capability",
        inputSchema: z.object({ task: z.string() }),
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
        processResult: (input, _result, ctx) => ({
          result: `C completed: ${(input as { task: string }).task}`,
          session_id: ctx.session.id,
          cost_usd: ctx.getSessionCost().totalCostUsd,
          turns: ctx.getSessionCost().totalTurns,
          _input_tokens: ctx.getSessionCost().totalInputTokens,
          _output_tokens: ctx.getSessionCost().totalOutputTokens,
        }),
      };

      // Define capability B (invokes C)
      const capabilityB: CapabilityDefinition = {
        id: "capability-b",
        type: "tool",
        name: "Capability B",
        description: "Middle capability",
        inputSchema: z.object({ task: z.string() }),
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
        processResult: async (input, _result, ctx) => {
          // B invokes C
          const childResult = await ctx.invokeCapability("capability-c", { task: "subtask-from-B" });
          return {
            result: `B completed: ${(input as { task: string }).task}, child: ${JSON.stringify(childResult)}`,
            session_id: ctx.session.id,
            cost_usd: ctx.getSessionCost().totalCostUsd,
            turns: ctx.getSessionCost().totalTurns,
            _input_tokens: ctx.getSessionCost().totalInputTokens,
            _output_tokens: ctx.getSessionCost().totalOutputTokens,
          };
        },
      };

      // Define capability A (invokes B)
      const capabilityA: CapabilityDefinition = {
        id: "capability-a",
        type: "tool",
        name: "Capability A",
        description: "Root capability",
        inputSchema: z.object({ task: z.string() }),
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
        processResult: async (input, _result, ctx) => {
          // A invokes B (which invokes C)
          const childResult = await ctx.invokeCapability("capability-b", { task: "subtask-from-A" });
          return {
            result: `A completed: ${(input as { task: string }).task}, child: ${JSON.stringify(childResult)}`,
            session_id: ctx.session.id,
            cost_usd: ctx.getSessionCost().totalCostUsd,
            turns: ctx.getSessionCost().totalTurns,
            _input_tokens: ctx.getSessionCost().totalInputTokens,
            _output_tokens: ctx.getSessionCost().totalOutputTokens,
          };
        },
      };

      // Register all capabilities
      registry.registerCapability(capabilityC);
      registry.registerCapability(capabilityB);
      registry.registerCapability(capabilityA);

      // Invoke A (which triggers B → C chain)
      const result = await registry.handleCapabilityInvocation("capability-a", { task: "root-task" });

      expect(result.isError).toBeUndefined(); // isError is undefined for success
      const resultData = JSON.parse(result.content[0]?.text || "{}");

      // A's session should include:
      // - A's direct cost (0.01 from mockAIProvider)
      // - B's total cost (B's direct + C's direct)
      // - C's direct cost
      // Total = 0.01 (A) + 0.01 (B) + 0.01 (C) = 0.03

      const sessionA = sessionManager.getSession(resultData.session_id as string);
      expect(sessionA).toBeDefined();
      expect(sessionA?.totalCost).toBeCloseTo(0.03, 5);

      // Verify cost summary includes all three invocations
      const costSummaryA = costTracker.getSessionSummary(resultData.session_id as string);
      expect(costSummaryA.totalCostUsd).toBeCloseTo(0.03, 5);
      expect(costSummaryA.operationCount).toBe(2); // A's direct entry + B's child entry (which includes C)
    });

    it("includes nested child costs in parent session totalInputTokens and totalOutputTokens", async () => {
      // Define simple leaf capability
      const leaf: CapabilityDefinition = {
        id: "leaf",
        type: "tool",
        name: "Leaf",
        description: "Leaf capability",
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
        processResult: (_input, _result, ctx) => ({
          session_id: ctx.session.id,
          cost_usd: ctx.getSessionCost().totalCostUsd,
          turns: ctx.getSessionCost().totalTurns,
          _input_tokens: ctx.getSessionCost().totalInputTokens,
          _output_tokens: ctx.getSessionCost().totalOutputTokens,
        }),
      };

      // Middle invokes leaf
      const middle: CapabilityDefinition = {
        id: "middle",
        type: "tool",
        name: "Middle",
        description: "Middle capability",
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
        processResult: async (_input, _result, ctx) => {
          await ctx.invokeCapability("leaf", {});
          return {
            session_id: ctx.session.id,
            cost_usd: ctx.getSessionCost().totalCostUsd,
            turns: ctx.getSessionCost().totalTurns,
            _input_tokens: ctx.getSessionCost().totalInputTokens,
            _output_tokens: ctx.getSessionCost().totalOutputTokens,
          };
        },
      };

      // Root invokes middle
      const root: CapabilityDefinition = {
        id: "root",
        type: "tool",
        name: "Root",
        description: "Root capability",
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
        processResult: async (_input, _result, ctx) => {
          await ctx.invokeCapability("middle", {});
          return {
            session_id: ctx.session.id,
            cost_usd: ctx.getSessionCost().totalCostUsd,
            turns: ctx.getSessionCost().totalTurns,
            _input_tokens: ctx.getSessionCost().totalInputTokens,
            _output_tokens: ctx.getSessionCost().totalOutputTokens,
          };
        },
      };

      registry.registerCapability(leaf);
      registry.registerCapability(middle);
      registry.registerCapability(root);

      const result = await registry.handleCapabilityInvocation("root", {});
      expect(result.isError).toBeUndefined(); // isError is undefined for success

      const resultData = JSON.parse(result.content[0]?.text || "{}");
      const sessionRoot = sessionManager.getSession(resultData.session_id as string);

      // Each invocation adds 100 input + 50 output tokens
      expect(sessionRoot?.totalInputTokens).toBe(300); // 3 * 100
      expect(sessionRoot?.totalOutputTokens).toBe(150); // 3 * 50
    });
  });

  /**
   * Scenario 1: Single child.
   * Parent invokes 1 child. getSessionSummary() returns parent_direct_cost + child_cost.
   */
  describe("Single child invocation", () => {
    it("propagates cost from single child to parent session", async () => {
      // Define child capability
      const child: CapabilityDefinition = {
        id: "single-child",
        type: "tool",
        name: "Single Child",
        description: "Single child capability",
        inputSchema: z.object({ task: z.string() }),
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
        processResult: (_input, _result, ctx) => ({
          result: "Child completed",
          session_id: ctx.session.id,
          cost_usd: ctx.getSessionCost().totalCostUsd,
          turns: ctx.getSessionCost().totalTurns,
        }),
      };

      // Define parent capability
      const parent: CapabilityDefinition = {
        id: "single-parent",
        type: "tool",
        name: "Single Parent",
        description: "Parent with single child",
        inputSchema: z.object({ task: z.string() }),
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
        processResult: async (_input, _result, ctx) => {
          const childResult = await ctx.invokeCapability("single-child", { task: "child-task" });
          return {
            result: "Parent completed",
            child_result: childResult,
            session_id: ctx.session.id,
            cost_usd: ctx.getSessionCost().totalCostUsd,
            turns: ctx.getSessionCost().totalTurns,
          };
        },
      };

      registry.registerCapability(child);
      registry.registerCapability(parent);

      const result = await registry.handleCapabilityInvocation("single-parent", { task: "root-task" });

      expect(result.isError).toBeUndefined();
      const resultData = JSON.parse(result.content[0]?.text || "{}");

      // Parent's session should include:
      // - Parent's direct cost (0.01)
      // - Child's cost (0.01)
      // Total = 0.02
      const sessionParent = sessionManager.getSession(resultData.session_id as string);
      expect(sessionParent).toBeDefined();
      expect(sessionParent?.totalCost).toBeCloseTo(0.02, 5);
      expect(sessionParent?.totalInputTokens).toBe(200); // 2 * 100
      expect(sessionParent?.totalOutputTokens).toBe(100); // 2 * 50

      const costSummary = costTracker.getSessionSummary(resultData.session_id as string);
      expect(costSummary.totalCostUsd).toBeCloseTo(0.02, 5);
      expect(costSummary.totalTurns).toBe(2); // 1 from parent + 1 from child
    });
  });

  /**
   * Scenario 2: Multiple sequential children.
   * Parent invokes 3 children. getSessionSummary() returns sum of all 4.
   */
  describe("Multiple sequential children", () => {
    it("propagates cost from 3 sequential children to parent session", async () => {
      // Define 3 child capabilities
      const child1: CapabilityDefinition = {
        id: "seq-child-1",
        type: "tool",
        name: "Sequential Child 1",
        description: "First child",
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
        processResult: (_input, _result, ctx) => ({
          result: "Child 1 done",
          cost: ctx.getSessionCost().totalCostUsd,
        }),
      };

      const child2: CapabilityDefinition = {
        id: "seq-child-2",
        type: "tool",
        name: "Sequential Child 2",
        description: "Second child",
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
        processResult: (_input, _result, ctx) => ({
          result: "Child 2 done",
          cost: ctx.getSessionCost().totalCostUsd,
        }),
      };

      const child3: CapabilityDefinition = {
        id: "seq-child-3",
        type: "tool",
        name: "Sequential Child 3",
        description: "Third child",
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
        processResult: (_input, _result, ctx) => ({
          result: "Child 3 done",
          cost: ctx.getSessionCost().totalCostUsd,
        }),
      };

      // Define parent that invokes all 3 sequentially
      const parent: CapabilityDefinition = {
        id: "seq-parent",
        type: "tool",
        name: "Sequential Parent",
        description: "Parent that invokes 3 children",
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
        processResult: async (_input, _result, ctx) => {
          const result1 = await ctx.invokeCapability("seq-child-1", {});
          const result2 = await ctx.invokeCapability("seq-child-2", {});
          const result3 = await ctx.invokeCapability("seq-child-3", {});
          return {
            result: "Parent completed with 3 children",
            children: [result1, result2, result3],
            session_id: ctx.session.id,
            cost_usd: ctx.getSessionCost().totalCostUsd,
            turns: ctx.getSessionCost().totalTurns,
          };
        },
      };

      registry.registerCapability(child1);
      registry.registerCapability(child2);
      registry.registerCapability(child3);
      registry.registerCapability(parent);

      const result = await registry.handleCapabilityInvocation("seq-parent", {});

      expect(result.isError).toBeUndefined();
      const resultData = JSON.parse(result.content[0]?.text || "{}");

      // Parent's session should include:
      // - Parent's direct cost (0.01)
      // - Child 1's cost (0.01)
      // - Child 2's cost (0.01)
      // - Child 3's cost (0.01)
      // Total = 0.04
      const sessionParent = sessionManager.getSession(resultData.session_id as string);
      expect(sessionParent).toBeDefined();
      expect(sessionParent?.totalCost).toBeCloseTo(0.04, 5);
      expect(sessionParent?.totalInputTokens).toBe(400); // 4 * 100
      expect(sessionParent?.totalOutputTokens).toBe(200); // 4 * 50

      const costSummary = costTracker.getSessionSummary(resultData.session_id as string);
      expect(costSummary.totalCostUsd).toBeCloseTo(0.04, 5);
      expect(costSummary.totalTurns).toBe(4); // 1 parent + 3 children
      expect(costSummary.operationCount).toBe(4); // 1 parent + 3 child entries
    });
  });

  /**
   * Scenario 4: Model propagation through child responses.
   * Child's model field propagates to parent's byModel cost summary.
   */
  describe("Model propagation from child responses", () => {
    it("propagates child model through MCP response", async () => {
      // Configure mockAIProvider to return haiku model
      mockAIProvider.query = jest.fn<AIProvider["query"]>().mockResolvedValue({
        content: "AI response",
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        costUsd: 0.01,
        turns: 1,
        terminationReason: "success",
        model: "claude-3-5-haiku-20241022",
        trace: {
          tid: "00000000000000000000000000000001",
          startedAt: new Date().toISOString(),
          request: { prompt: "test" },
          turns: [],
        },
      } as AIQueryResult);

      // Define child capability that uses haiku
      const childHaiku: CapabilityDefinition = {
        id: "child-haiku",
        type: "tool",
        name: "Child Haiku",
        description: "Child using haiku model",
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
        processResult: (_input, _result, ctx) => ({
          result: "Child completed",
          session_id: ctx.session.id,
          cost_usd: ctx.getSessionCost().totalCostUsd,
          turns: ctx.getSessionCost().totalTurns,
          _input_tokens: ctx.getSessionCost().totalInputTokens,
          _output_tokens: ctx.getSessionCost().totalOutputTokens,
        }),
      };

      // Define parent capability
      const parent: CapabilityDefinition = {
        id: "parent-model-test",
        type: "tool",
        name: "Parent Model Test",
        description: "Parent testing model propagation",
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
        processResult: async (_input, _result, ctx) => {
          await ctx.invokeCapability("child-haiku", {});
          return {
            result: "Parent completed",
            session_id: ctx.session.id,
            cost_usd: ctx.getSessionCost().totalCostUsd,
            turns: ctx.getSessionCost().totalTurns,
            _input_tokens: ctx.getSessionCost().totalInputTokens,
            _output_tokens: ctx.getSessionCost().totalOutputTokens,
          };
        },
      };

      registry.registerCapability(childHaiku);
      registry.registerCapability(parent);

      const result = await registry.handleCapabilityInvocation("parent-model-test", {});
      expect(result.isError).toBeUndefined();

      const resultData = JSON.parse(result.content[0]?.text || "{}");
      const costSummary = costTracker.getSessionSummary(resultData.session_id as string);

      // Verify child's haiku model is in byModel breakdown
      expect(costSummary.byModel["claude-3-5-haiku-20241022"]).toBeDefined();
      expect(costSummary.byModel["claude-3-5-haiku-20241022"]?.count).toBe(2); // Parent + child both use haiku
    });

    it("falls back to default model when child response omits _model", async () => {
      // Configure mockAIProvider to NOT return model field
      mockAIProvider.query = jest.fn<AIProvider["query"]>().mockResolvedValue({
        content: "AI response",
        usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
        costUsd: 0.01,
        turns: 1,
        terminationReason: "success",
        // model field intentionally omitted
        trace: {
          tid: "00000000000000000000000000000001",
          startedAt: new Date().toISOString(),
          request: { prompt: "test" },
          turns: [],
        },
      } as AIQueryResult);

      // Define child capability that doesn't include _model in output
      const childNoModel: CapabilityDefinition = {
        id: "child-no-model",
        type: "tool",
        name: "Child No Model",
        description: "Child without model field",
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
        processResult: (_input, _result, ctx) => ({
          result: "Child completed",
          session_id: ctx.session.id,
          cost_usd: ctx.getSessionCost().totalCostUsd,
          turns: ctx.getSessionCost().totalTurns,
          _input_tokens: ctx.getSessionCost().totalInputTokens,
          _output_tokens: ctx.getSessionCost().totalOutputTokens,
          // _model intentionally omitted
        }),
      };

      // Define parent capability
      const parent: CapabilityDefinition = {
        id: "parent-fallback-test",
        type: "tool",
        name: "Parent Fallback Test",
        description: "Parent testing model fallback",
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
        processResult: async (_input, _result, ctx) => {
          await ctx.invokeCapability("child-no-model", {});
          return {
            result: "Parent completed",
            session_id: ctx.session.id,
            cost_usd: ctx.getSessionCost().totalCostUsd,
            turns: ctx.getSessionCost().totalTurns,
            _input_tokens: ctx.getSessionCost().totalInputTokens,
            _output_tokens: ctx.getSessionCost().totalOutputTokens,
          };
        },
      };

      registry.registerCapability(childNoModel);
      registry.registerCapability(parent);

      const result = await registry.handleCapabilityInvocation("parent-fallback-test", {});
      expect(result.isError).toBeUndefined();

      const resultData = JSON.parse(result.content[0]?.text || "{}");

      // Verify child cost entry uses default model (since _model was omitted)
      const childEntries = costTracker.getChildCostEntries(resultData.session_id as string);
      expect(childEntries.length).toBe(1);
      expect(childEntries[0]?.model).toBe("claude-3-5-sonnet-20241022"); // Fallback model
    });
  });

  /**
   * Scenario 5: Unique cost entry IDs for multiple children.
   * Each child invocation gets a unique cost entry ID.
   */
  describe("Unique cost entry IDs", () => {
    it("generates unique cost entry IDs for multiple children", async () => {
      // Define 3 simple child capabilities
      const child1: CapabilityDefinition = {
        id: "unique-child-1",
        type: "tool",
        name: "Unique Child 1",
        description: "First child",
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
        processResult: (_input, _result, ctx) => ({
          result: "Child 1 done",
          session_id: ctx.session.id,
          cost_usd: ctx.getSessionCost().totalCostUsd,
          turns: ctx.getSessionCost().totalTurns,
          _input_tokens: ctx.getSessionCost().totalInputTokens,
          _output_tokens: ctx.getSessionCost().totalOutputTokens,
        }),
      };

      const child2: CapabilityDefinition = {
        id: "unique-child-2",
        type: "tool",
        name: "Unique Child 2",
        description: "Second child",
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
        processResult: (_input, _result, ctx) => ({
          result: "Child 2 done",
          session_id: ctx.session.id,
          cost_usd: ctx.getSessionCost().totalCostUsd,
          turns: ctx.getSessionCost().totalTurns,
          _input_tokens: ctx.getSessionCost().totalInputTokens,
          _output_tokens: ctx.getSessionCost().totalOutputTokens,
        }),
      };

      const child3: CapabilityDefinition = {
        id: "unique-child-3",
        type: "tool",
        name: "Unique Child 3",
        description: "Third child",
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
        processResult: (_input, _result, ctx) => ({
          result: "Child 3 done",
          session_id: ctx.session.id,
          cost_usd: ctx.getSessionCost().totalCostUsd,
          turns: ctx.getSessionCost().totalTurns,
          _input_tokens: ctx.getSessionCost().totalInputTokens,
          _output_tokens: ctx.getSessionCost().totalOutputTokens,
        }),
      };

      // Define parent that invokes all 3 sequentially
      const parent: CapabilityDefinition = {
        id: "unique-parent",
        type: "tool",
        name: "Unique Parent",
        description: "Parent that invokes 3 children",
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
        processResult: async (_input, _result, ctx) => {
          await ctx.invokeCapability("unique-child-1", {});
          await ctx.invokeCapability("unique-child-2", {});
          await ctx.invokeCapability("unique-child-3", {});
          return {
            result: "Parent completed",
            session_id: ctx.session.id,
            cost_usd: ctx.getSessionCost().totalCostUsd,
            turns: ctx.getSessionCost().totalTurns,
            _input_tokens: ctx.getSessionCost().totalInputTokens,
            _output_tokens: ctx.getSessionCost().totalOutputTokens,
          };
        },
      };

      registry.registerCapability(child1);
      registry.registerCapability(child2);
      registry.registerCapability(child3);
      registry.registerCapability(parent);

      const result = await registry.handleCapabilityInvocation("unique-parent", {});
      expect(result.isError).toBeUndefined();

      const resultData = JSON.parse(result.content[0]?.text || "{}");

      // Get all child cost entries
      const childEntries = costTracker.getChildCostEntries(resultData.session_id as string);
      expect(childEntries.length).toBe(3);

      // Verify all 3 entries have unique IDs
      const entryIds = childEntries.map((entry) => entry.id);
      const uniqueIds = new Set(entryIds);
      expect(uniqueIds.size).toBe(3); // All IDs should be distinct
    });
  });

  /**
   * Scenario 6: Error responses include _model field.
   * When a child capability fails, the error response includes _model.
   */
  describe("Error responses with model field", () => {
    it("includes _model in error responses", async () => {
      // Define a failing child capability
      const failingChild: CapabilityDefinition = {
        id: "failing-child-model",
        type: "tool",
        name: "Failing Child Model",
        description: "Child that fails",
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
        processResult: (_input, _result, _ctx) => {
          throw new Error("Child failed intentionally");
        },
      };

      // Define parent that catches child failure
      const parent: CapabilityDefinition = {
        id: "parent-error-test",
        type: "tool",
        name: "Parent Error Test",
        description: "Parent testing error propagation",
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
        processResult: async (_input, _result, ctx) => {
          try {
            await ctx.invokeCapability("failing-child-model", {});
          } catch (error) {
            // Capture the error response from child
            return {
              result: "Parent caught error",
              error_details: error instanceof Error ? error.message : String(error),
              session_id: ctx.session.id,
              cost_usd: ctx.getSessionCost().totalCostUsd,
              turns: ctx.getSessionCost().totalTurns,
              _input_tokens: ctx.getSessionCost().totalInputTokens,
              _output_tokens: ctx.getSessionCost().totalOutputTokens,
            };
          }
          return { result: "Should not reach here" };
        },
      };

      registry.registerCapability(failingChild);
      registry.registerCapability(parent);

      // Invoke the failing child directly (not through parent)
      const result = await registry.handleCapabilityInvocation("failing-child-model", {});

      // Verify it's an error response
      expect(result.isError).toBe(true);

      // Parse the error response
      const errorData = JSON.parse(result.content[0]?.text || "{}");

      // Verify _model field exists in error response
      expect(errorData._model).toBeDefined();
      expect(typeof errorData._model).toBe("string");
    });
  });

  /**
   * Scenario 8: Failed child invocation.
   * Cost propagated up to point of failure (child threw error after partial work).
   */
  describe("Failed child invocations", () => {
    it("propagates cost before failure when child throws error after partial work", async () => {
      // Mock AI provider to track call count
      let callCount = 0;
      mockAIProvider.query = jest.fn<AIProvider["query"]>().mockImplementation(async () => {
        callCount++;
        return {
          content: "AI response",
          usage: { inputTokens: 100, outputTokens: 50, totalTokens: 150 },
          costUsd: 0.01,
          turns: 1,
          terminationReason: "success",
          trace: {
            tid: `0000000000000000000000000000000${callCount}`,
            startedAt: new Date().toISOString(),
            request: { prompt: "test" },
            turns: [],
          },
        } as AIQueryResult;
      });

      // Failing child capability
      const failingChild: CapabilityDefinition = {
        id: "failing-child",
        type: "tool",
        name: "Failing Child",
        description: "Child that fails after partial work",
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
        processResult: (_input, _result, _ctx) => {
          // AI query was called (cost incurred), but we throw before returning
          throw new Error("Child failed after doing some work");
        },
      };

      // Parent capability
      const parent: CapabilityDefinition = {
        id: "parent",
        type: "tool",
        name: "Parent",
        description: "Parent capability",
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
        processResult: async (_input, _result, ctx) => {
          try {
            await ctx.invokeCapability("failing-child", {});
          } catch (error) {
            // Child failed, but parent continues
            return {
              result: "Parent handled child failure",
              session_id: ctx.session.id,
              cost_usd: ctx.getSessionCost().totalCostUsd,
              turns: ctx.getSessionCost().totalTurns,
              _input_tokens: ctx.getSessionCost().totalInputTokens,
              _output_tokens: ctx.getSessionCost().totalOutputTokens,
            };
          }
          return { result: "Should not reach here" };
        },
      };

      registry.registerCapability(failingChild);
      registry.registerCapability(parent);

      const result = await registry.handleCapabilityInvocation("parent", {});
      expect(result.isError).toBeUndefined(); // isError is undefined for success

      const resultData = JSON.parse(result.content[0]?.text || "{}");
      const sessionParent = sessionManager.getSession(resultData.session_id as string);

      // Parent's cost should include:
      // - Parent's direct cost (0.01)
      // - Child's cost BEFORE failure (0.01, since AI was called)
      // Even though child threw error, the cost was incurred
      expect(sessionParent?.totalCost).toBeCloseTo(0.02, 5);
      expect(sessionParent?.totalInputTokens).toBe(200); // 2 * 100
      expect(sessionParent?.totalOutputTokens).toBe(100); // 2 * 50
    });

    it("does not propagate cost when child fails before any AI work", async () => {
      // Child that fails immediately (no AI query)
      const immediateFailChild: CapabilityDefinition = {
        id: "immediate-fail-child",
        type: "tool",
        name: "Immediate Fail Child",
        description: "Child that fails before AI query",
        inputSchema: z.object({ failNow: z.boolean() }),
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
        preparePromptInput: (input) => {
          if ((input as { failNow: boolean }).failNow) {
            throw new Error("Validation failed before AI query");
          }
          return input;
        },
        processResult: (_input, _result, _ctx) => ({ result: "done" }),
      };

      const parent: CapabilityDefinition = {
        id: "parent-safe",
        type: "tool",
        name: "Parent Safe",
        description: "Parent capability",
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
        processResult: async (_input, _result, ctx) => {
          try {
            await ctx.invokeCapability("immediate-fail-child", { failNow: true });
          } catch (error) {
            // Child failed before AI work
            return {
              result: "Handled early failure",
              session_id: ctx.session.id,
              cost_usd: ctx.getSessionCost().totalCostUsd,
              turns: ctx.getSessionCost().totalTurns,
              _input_tokens: ctx.getSessionCost().totalInputTokens,
              _output_tokens: ctx.getSessionCost().totalOutputTokens,
            };
          }
          return { result: "Should not reach here" };
        },
      };

      registry.registerCapability(immediateFailChild);
      registry.registerCapability(parent);

      const result = await registry.handleCapabilityInvocation("parent-safe", {});
      expect(result.isError).toBeUndefined(); // isError is undefined for success

      const resultData = JSON.parse(result.content[0]?.text || "{}");
      const sessionParent = sessionManager.getSession(resultData.session_id as string);

      // Only parent's cost (child never reached AI query)
      expect(sessionParent?.totalCost).toBeCloseTo(0.01, 5);
      expect(sessionParent?.totalInputTokens).toBe(100);
      expect(sessionParent?.totalOutputTokens).toBe(50);
    });
  });

  /**
   * Scenario 9: End-to-end test for child cost with cache metrics and prompt version (AC-14).
   * Verifies cache metrics and prompt version propagate from child outputs to cost reports.
   */
  describe("Child cost with cache metrics and prompt version", () => {
    it("end-to-end child cost propagation with cache metrics and prompt version (AC-14)", async () => {
      // Configure mockAIProvider to return cache metrics
      mockAIProvider.query = jest.fn<AIProvider["query"]>().mockResolvedValue({
        content: "AI response with cache",
        usage: {
          inputTokens: 1500,
          outputTokens: 800,
          totalTokens: 10300,
          promptCacheWrite: 12000,
          promptCacheRead: 7000,
        },
        costUsd: 0.045,
        turns: 3,
        terminationReason: "success",
        model: "claude-3-5-sonnet-20241022",
        trace: {
          tid: "00000000000000000000000000000001",
          startedAt: new Date().toISOString(),
          request: { prompt: "test" },
          turns: [],
        },
      } as AIQueryResult);

      // Define child capability that returns cache metrics and prompt version
      const childWithCache: CapabilityDefinition = {
        id: "child-with-cache",
        type: "tool",
        name: "Child With Cache",
        description: "Child that returns cache metrics",
        inputSchema: z.object({}),
        promptRegistry: {
          v2: {
            version: "v2",
            createdAt: new Date().toISOString(),
            description: "V2 with caching",
            deprecated: false,
            build: () => ({ userPrompt: "test with cache" }),
          },
        },
        currentPromptVersion: "v2",
        preparePromptInput: (input) => input,
        processResult: (_input, _result, ctx) => ({
          result: "Child completed with cache",
          session_id: ctx.session.id,
          cost_usd: ctx.getSessionCost().totalCostUsd,
          turns: ctx.getSessionCost().totalTurns,
          _input_tokens: ctx.getSessionCost().totalInputTokens,
          _output_tokens: ctx.getSessionCost().totalOutputTokens,
          _cache_creation_input_tokens: 12000,
          _cache_read_input_tokens: 7000,
          _prompt_version: "v2",
          _model: "claude-3-5-sonnet-20241022",
        }),
      };

      // Define parent capability
      const parentWithChild: CapabilityDefinition = {
        id: "parent-cache-test",
        type: "tool",
        name: "Parent Cache Test",
        description: "Parent testing cache propagation",
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
        processResult: async (_input, _result, ctx) => {
          await ctx.invokeCapability("child-with-cache", {});
          return {
            result: "Parent completed",
            session_id: ctx.session.id,
            cost_usd: ctx.getSessionCost().totalCostUsd,
            turns: ctx.getSessionCost().totalTurns,
            _input_tokens: ctx.getSessionCost().totalInputTokens,
            _output_tokens: ctx.getSessionCost().totalOutputTokens,
          };
        },
      };

      registry.registerCapability(childWithCache);
      registry.registerCapability(parentWithChild);

      const result = await registry.handleCapabilityInvocation("parent-cache-test", {});
      expect(result.isError).toBeUndefined();

      const resultData = JSON.parse(result.content[0]?.text || "{}");
      const sessionId = resultData.session_id as string;

      // Verify child cost entry in cost tracker includes all fields
      const childEntries = costTracker.getChildCostEntries(sessionId);
      expect(childEntries).toHaveLength(1);

      const childEntry = childEntries[0];
      expect(childEntry).toBeDefined();
      if (!childEntry) throw new Error("Child entry not found");

      expect(childEntry.promptCacheWrite).toBe(12000);
      expect(childEntry.promptCacheRead).toBe(7000);
      expect(childEntry.promptVersion).toBe("v2");
      expect(childEntry.totalTokensIn).toBe(8500); // 1500 + 7000
      expect(childEntry.totalTokensOut).toBe(800);
      expect(childEntry.model).toBe("claude-3-5-sonnet-20241022");

      // Verify session summary includes aggregated cache metrics
      const costSummary = costTracker.getSessionSummary(sessionId);
      expect(costSummary.totalPromptCacheWrite).toBe(24000); // 2 * 12000 (parent + child)
      expect(costSummary.totalPromptCacheRead).toBe(14000); // 2 * 7000 (parent + child)
      expect(costSummary.cacheHitRate).toBeCloseTo(14000 / (3000 + 14000), 4); // 14000 / (2*1500 + 14000)

      // Verify daily cost report includes child session entry with all fields
      const session = sessionManager.getSession(sessionId);
      expect(session).toBeDefined();
      if (!session) throw new Error("Session not found");

      // Write to daily report
      await costReportWriter.writeSessionToReport(
        session,
        costSummary,
        childEntries
          .filter((entry) => entry.childSessionId) // Filter out entries without childSessionId
          .map((entry) => ({
            sid: entry.childSessionId!,
            capability: entry.capabilityName,
            costUsd: entry.costUsd,
            turns: entry.turns || 0,
            inputTokens: entry.inputTokens,
            outputTokens: entry.outputTokens,
            model: entry.model,
            status: entry.status || "success",
            promptCacheWrite: entry.promptCacheWrite,
            promptCacheRead: entry.promptCacheRead,
            promptVersion: entry.promptVersion,
            totalTokensIn: entry.totalTokensIn,
            totalTokensOut: entry.totalTokensOut,
          }))
      );

      // Read back from daily report
      const reportDate = session.startedAt.split("T")[0];
      if (!reportDate) throw new Error("Invalid report date");
      const dailyReport = await costReportWriter.readDailyReport(reportDate);

      expect(dailyReport).not.toBeNull();
      const reportSession = dailyReport?.sessions.find((s) => s.sid === sessionId);
      expect(reportSession).toBeDefined();

      const reportChildSession = reportSession?.childSessions?.[0];
      expect(reportChildSession).toBeDefined();
      if (!reportChildSession) throw new Error("Child session not in report");

      expect(reportChildSession.promptCacheWrite).toBe(12000);
      expect(reportChildSession.promptCacheRead).toBe(7000);
      expect(reportChildSession.promptVersion).toBe("v2");
      expect(reportChildSession.totalTokensIn).toBe(8500);
      expect(reportChildSession.totalTokensOut).toBe(800);
    });

    it("automatic cache propagation without manual injection in processResult (regression)", async () => {
      // This test verifies the production path: processResult returns ONLY business output,
      // and finalizeInvocation() automatically appends cache metrics from costSummary.
      // Before fix 0e912cf, finalizeInvocation did NOT include cache metrics,
      // causing parent to see undefined _cache_read_input_tokens → totalTokensIn = inputTokens only.

      // Configure mockAIProvider to return cache metrics
      mockAIProvider.query = jest.fn<AIProvider["query"]>().mockResolvedValue({
        content: "AI response with cache",
        usage: {
          inputTokens: 2000,
          outputTokens: 600,
          totalTokens: 12600,
          promptCacheWrite: 8000,
          promptCacheRead: 10000,
        },
        costUsd: 0.05,
        turns: 2,
        terminationReason: "success",
        model: "claude-3-5-sonnet-20241022",
        trace: {
          tid: "00000000000000000000000000000001",
          startedAt: new Date().toISOString(),
          request: { prompt: "test" },
          turns: [],
        },
      } as AIQueryResult);

      // Define child capability that returns ONLY business output (no manual cache metadata)
      const childRealistic: CapabilityDefinition = {
        id: "child-realistic",
        type: "tool",
        name: "Child Realistic",
        description: "Child that returns only business output",
        inputSchema: z.object({}),
        promptRegistry: {
          v3: {
            version: "v3",
            createdAt: new Date().toISOString(),
            description: "V3",
            deprecated: false,
            build: () => ({ userPrompt: "test realistic" }),
          },
        },
        currentPromptVersion: "v3",
        preparePromptInput: (input) => input,
        // NOTE: processResult does NOT manually inject _cache_* or _prompt_version
        processResult: () => ({
          result: "Child business output only",
          status: "success",
        }),
      };

      // Define parent capability
      const parentRealistic: CapabilityDefinition = {
        id: "parent-realistic-test",
        type: "tool",
        name: "Parent Realistic Test",
        description: "Parent testing automatic cache propagation",
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
        processResult: async (_input, _result, ctx) => {
          await ctx.invokeCapability("child-realistic", {});
          return { result: "Parent completed" };
        },
      };

      registry.registerCapability(childRealistic);
      registry.registerCapability(parentRealistic);

      const result = await registry.handleCapabilityInvocation("parent-realistic-test", {});
      expect(result.isError).toBeUndefined();

      const resultData = JSON.parse(result.content[0]?.text || "{}");
      const sessionId = resultData.session_id as string;

      // Verify child cost entry has cache metrics from AUTOMATIC propagation
      const childEntries = costTracker.getChildCostEntries(sessionId);
      expect(childEntries).toHaveLength(1);

      const childEntry = childEntries[0];
      expect(childEntry).toBeDefined();
      if (!childEntry) throw new Error("Child entry not found");

      // Cache metrics should be present (from finalizeInvocation's automatic addition)
      expect(childEntry.promptCacheWrite).toBe(8000);
      expect(childEntry.promptCacheRead).toBe(10000);
      expect(childEntry.promptVersion).toBe("v3");

      // totalTokensIn = inputTokens(2000) + cacheRead(10000) = 12000
      expect(childEntry.totalTokensIn).toBe(12000);
      // totalTokensOut = outputTokens(600)
      expect(childEntry.totalTokensOut).toBe(600);

      // Verify parent session summary includes child's cache metrics
      const costSummary = costTracker.getSessionSummary(sessionId);
      // Parent's own query: promptCacheWrite=8000, promptCacheRead=10000
      // Child's propagated: promptCacheWrite=8000, promptCacheRead=10000
      expect(costSummary.totalPromptCacheWrite).toBe(16000); // 8000 * 2
      expect(costSummary.totalPromptCacheRead).toBe(20000); // 10000 * 2
    });

    it("omits cache metrics in child session when zero or undefined (AC-10, AC-14)", async () => {
      // Configure mockAIProvider to return NO cache metrics
      mockAIProvider.query = jest.fn<AIProvider["query"]>().mockResolvedValue({
        content: "AI response without cache",
        usage: {
          inputTokens: 1000,
          outputTokens: 500,
          totalTokens: 1500,
        },
        costUsd: 0.02,
        turns: 1,
        terminationReason: "success",
        model: "claude-3-5-sonnet-20241022",
        trace: {
          tid: "00000000000000000000000000000001",
          startedAt: new Date().toISOString(),
          request: { prompt: "test" },
          turns: [],
        },
      } as AIQueryResult);

      // Define child capability without cache metrics
      const childWithoutCache: CapabilityDefinition = {
        id: "child-without-cache",
        type: "tool",
        name: "Child Without Cache",
        description: "Child without cache metrics",
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
        processResult: (_input, _result, ctx) => ({
          result: "Child completed without cache",
          session_id: ctx.session.id,
          cost_usd: ctx.getSessionCost().totalCostUsd,
          turns: ctx.getSessionCost().totalTurns,
          _input_tokens: ctx.getSessionCost().totalInputTokens,
          _output_tokens: ctx.getSessionCost().totalOutputTokens,
          _model: "claude-3-5-sonnet-20241022",
          // No cache fields, no prompt version
        }),
      };

      // Define parent capability
      const parent: CapabilityDefinition = {
        id: "parent-no-cache-test",
        type: "tool",
        name: "Parent No Cache Test",
        description: "Parent testing no cache",
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
        processResult: async (_input, _result, ctx) => {
          await ctx.invokeCapability("child-without-cache", {});
          return {
            result: "Parent completed",
            session_id: ctx.session.id,
            cost_usd: ctx.getSessionCost().totalCostUsd,
            turns: ctx.getSessionCost().totalTurns,
          };
        },
      };

      registry.registerCapability(childWithoutCache);
      registry.registerCapability(parent);

      const result = await registry.handleCapabilityInvocation("parent-no-cache-test", {});
      expect(result.isError).toBeUndefined();

      const resultData = JSON.parse(result.content[0]?.text || "{}");
      const sessionId = resultData.session_id as string;

      // Verify child cost entry does NOT include cache fields
      const childEntries = costTracker.getChildCostEntries(sessionId);
      expect(childEntries).toHaveLength(1);

      const childEntry = childEntries[0];
      expect(childEntry).toBeDefined();
      if (!childEntry) throw new Error("Child entry not found");

      expect(childEntry.promptCacheWrite).toBeUndefined();
      expect(childEntry.promptCacheRead).toBeUndefined();
      // promptVersion IS propagated via _prompt_version in MCP response
      // (from capability.currentPromptVersion), even when cache metrics are absent
      expect(childEntry.promptVersion).toBe("v1");
    });
  });
});
