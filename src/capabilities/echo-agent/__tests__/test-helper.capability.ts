/**
 * Test-only capability stub for multi-capability integration testing.
 * NOT registered in production - only used in tests.
 *
 * @internal Test utility only
 */

import { z } from "zod";
import type { CapabilityDefinition, CapabilityContext } from "../../../core/capability-registry/capability-registry.types.js";
import type { AIQueryResult } from "../../../core/ai-provider/ai-provider.types.js";

/** Input schema for test-helper capability */
export const TestHelperInputSchema = z.object({
  targetCapability: z.string().describe("Capability to invoke"),
  prompt: z.string().describe("Prompt to pass through"),
});

export type TestHelperInput = z.infer<typeof TestHelperInputSchema>;

/** Output schema for test-helper capability */
export const TestHelperOutputSchema = z.object({
  invokedCapability: z.string().describe("Capability that was invoked"),
  result: z.unknown().describe("Result from the invoked capability"),
});

export type TestHelperOutput = z.infer<typeof TestHelperOutputSchema>;

/**
 * Test-only capability that invokes another capability.
 * Used to test multi-capability session flows and recursion guards.
 *
 * @internal Test utility only
 */
export const testHelperCapability: CapabilityDefinition<TestHelperInput, TestHelperOutput> = {
  id: "test_helper",
  type: "tool",
  name: "Test Helper",
  description: "Test-only capability for multi-capability testing",
  inputSchema: TestHelperInputSchema,
  promptRegistry: {
    v1: {
      version: "v1",
      createdAt: new Date().toISOString(),
      description: "Test helper prompt v1",
      deprecated: false,
      build: (input: unknown) => ({
        userPrompt: typeof input === "object" && input !== null && "prompt" in input
          ? String((input as any).prompt)
          : "test prompt",
      }),
    },
  },
  currentPromptVersion: "v1",
  defaultRequestOptions: {
    model: "haiku",
    maxTurns: 1,
    maxBudgetUsd: 0.10,
  },

  preparePromptInput: (input: TestHelperInput, _context: CapabilityContext) => ({
    prompt: input.prompt,
  }),

  processResult: async (
    input: TestHelperInput,
    _aiResult: AIQueryResult,
    context: CapabilityContext
  ): Promise<TestHelperOutput> => {
    // Invoke the target capability via context.invokeCapability()
    const targetInput = { prompt: input.prompt, model: "haiku" as const };
    const result = await context.invokeCapability(input.targetCapability, targetInput);

    return {
      invokedCapability: input.targetCapability,
      result,
    };
  },
};
