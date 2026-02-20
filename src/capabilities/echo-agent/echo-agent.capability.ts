/**
 * Echo agent capability definition.
 * Provides a simple MCP tool that sends prompts to Claude via Agent SDK.
 */

import type { CapabilityDefinition } from "../../core/capability-registry/capability-registry.types.js";
import type { EchoAgentInput, EchoAgentOutput } from "./echo-agent.schema.js";
import { EchoAgentInputSchema } from "./echo-agent.schema.js";
import { PROMPT_VERSIONS, CURRENT_VERSION } from "./prompts/index.js";

/**
 * Echo agent capability definition.
 *
 * This capability:
 * - Accepts a text prompt and optional model selection
 * - Sends the prompt to Claude via the AI provider
 * - Returns the response along with cost and turn metrics
 *
 * Designed as a proof-of-concept for testing the capability framework.
 *
 * ⚠️ SECURITY NOTE: This capability uses `bypassPermissions` for testing only.
 * Before adding production capabilities, change to `permissionMode: "acceptEdits"` or `"default"`.
 */
export const echoAgentCapability: CapabilityDefinition<EchoAgentInput, EchoAgentOutput> = {
  id: "echo_agent",
  type: "tool",
  name: "Echo Agent",
  description:
    "Simple proof-of-concept tool that uses Claude Agent SDK to process a prompt. " +
    "Returns Claude's response along with cost and turn metrics. " +
    "Useful for testing SDK integration.",
  inputSchema: EchoAgentInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: "haiku",
    maxTurns: 50,
    maxBudgetUsd: 3.00,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
  },

  /**
   * Prepare prompt input from validated raw input.
   * For echo agent, we simply extract the prompt field.
   *
   * @param input - Validated input from Zod schema
   * @param _context - Capability context (unused for echo agent)
   * @returns Data to pass to prompt's build() function
   */
  preparePromptInput: (input: EchoAgentInput, _context) => ({
    prompt: input.prompt,
    cwd: input.cwd,
  }),

  /**
   * Process AI result into final output.
   * Extracts response text and cost metrics from AI query result.
   *
   * @param _input - Original validated input (unused)
   * @param aiResult - Result from AI provider
   * @param _context - Capability context (unused)
   * @returns Final output matching EchoAgentOutput schema
   */
  processResult: (_input: EchoAgentInput, aiResult, _context) => ({
    response: aiResult.content,
    cost_usd: aiResult.costUsd,
    turns: aiResult.turns,
  }),
};
