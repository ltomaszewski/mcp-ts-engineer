/**
 * Zod schemas for pr_fixer capability input/output.
 */

import { z } from "zod";

/** Input schema for pr_fixer tool. */
export const PrFixerInputSchema = z.object({
  pr: z.string().min(1, "PR number or URL is required"),
  cwd: z.string().optional(),
}) as z.ZodType<{ pr: string; cwd?: string }>;

export type PrFixerInput = z.infer<typeof PrFixerInputSchema>;

/** Output schema for pr_fixer tool. */
export const PrFixerOutputSchema = z.object({
  status: z.enum(["success", "partial", "failed", "nothing_to_fix"]),
  issues_input: z.number().min(0),
  issues_resolved: z.number().min(0),
  spec_path: z.string(),
  files_changed: z.array(z.string()),
  cost_usd: z.number().min(0),
});

export type PrFixerOutput = z.infer<typeof PrFixerOutputSchema>;

/** Fallback output for error cases. */
export const PR_FIXER_OUTPUT_FALLBACK: PrFixerOutput = {
  status: "failed",
  issues_input: 0,
  issues_resolved: 0,
  spec_path: "",
  files_changed: [],
  cost_usd: 0,
};

/** JSON Schema for structured output (SDK outputFormat). */
export const PR_FIXER_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["success", "partial", "failed", "nothing_to_fix"] },
      issues_input: { type: "number" },
      issues_resolved: { type: "number" },
      spec_path: { type: "string" },
      files_changed: { type: "array", items: { type: "string" } },
      cost_usd: { type: "number" },
    },
    required: ["status", "issues_input", "issues_resolved", "spec_path", "files_changed", "cost_usd"],
  },
};
