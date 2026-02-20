/**
 * Zod schemas for echo-agent capability input and output validation.
 */

import { z } from "zod";

/**
 * Input schema for echo_agent capability.
 * Validates prompt and model selection for Claude Agent SDK queries.
 */
export const EchoAgentInputSchema = z.object({
  prompt: z
    .string()
    .min(1, "Prompt is required")
    .max(10000, "Prompt exceeds maximum length of 10,000 characters")
    .describe("The prompt to send to Claude"),
  model: z
    .enum(["haiku", "sonnet"])
    .default("haiku")
    .describe("Model to use for the query (haiku is faster and cheaper)"),
  cwd: z
    .string()
    .optional()
    .describe("Working directory for tool execution (defaults to server cwd)"),
}) as z.ZodType<{ prompt: string; model: "haiku" | "sonnet"; cwd?: string }>;

/**
 * Output schema for echo_agent capability.
 * Defines the structure of successful echo agent responses.
 * @internal Available for runtime validation if needed
 */
export const EchoAgentOutputSchema = z.object({
  response: z.string().describe("Claude's text response to the prompt"),
  cost_usd: z.number().describe("Total cost of the query in USD"),
  turns: z.number().int().describe("Number of conversation turns taken"),
  session_id: z.string().optional().describe("Unique session identifier for this invocation (injected by framework)"),
});

/**
 * TypeScript types inferred from schemas.
 * Use these for type safety in capability implementations.
 */
export type EchoAgentInput = { prompt: string; model: "haiku" | "sonnet"; cwd?: string };
export type EchoAgentOutput = z.infer<typeof EchoAgentOutputSchema>;
