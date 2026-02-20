/**
 * TDD validate step sub-capability definition (Session 2).
 * Internal capability: validates TDD coverage of a spec file with review context.
 *
 * Uses SDK structured output (outputSchema) as primary extraction method.
 * Falls back to XML parsing from aiResult.content if structured output is unavailable.
 *
 * Research finding: Claude 4.5 "tends toward efficiency and may skip verbal summaries
 * after tool calls" — structured output guarantees data even when text is empty.
 */

import type { CapabilityDefinition } from "../../core/capability-registry/capability-registry.types.js";
import {
  TddValidateStepInputSchema,
  TddSummarySchema,
} from "./todo-reviewer.schema.js";
import {
  parseXmlBlock,
  parseJsonSafe,
  TDD_SUMMARY_FALLBACK,
} from "./todo-reviewer.helpers.js";
import type {
  TddValidateStepInput,
  TddSummary,
} from "./todo-reviewer.schema.js";
import {
  TDD_VALIDATE_PROMPT_VERSIONS,
  TDD_VALIDATE_CURRENT_VERSION,
} from "./prompts/index.js";

/**
 * JSON Schema for TDD structured output.
 * Matches TddSummarySchema but in JSON Schema format for the SDK's outputFormat.
 */
const TDD_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["PASS", "FAIL", "WARN"] },
      details: { type: "string" },
      issues_found: { type: "number" },
      spec_modified: { type: "boolean" },
    },
    required: ["status", "details", "issues_found", "spec_modified"],
  },
};

/**
 * Internal sub-capability for TDD validation (Session 2).
 * Not intended for direct external use — invoked by the todo_reviewer orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to read
 * spec files and validate TDD coverage. Input is validated via Zod schema and this
 * capability is only invoked through the orchestrator's authenticated channel.
 */
export const tddValidateStepCapability: CapabilityDefinition<
  TddValidateStepInput,
  TddSummary
> = {
  id: "todo_tdd_validate_step",
  type: "tool",
  visibility: "internal",
  name: "Todo TDD Validate Step (Internal)",
  description:
    "Internal sub-capability: validates TDD coverage of a spec file with review context. Not intended for direct use.",
  inputSchema: TddValidateStepInputSchema,
  promptRegistry: TDD_VALIDATE_PROMPT_VERSIONS,
  currentPromptVersion: TDD_VALIDATE_CURRENT_VERSION,
  defaultRequestOptions: {
    model: "sonnet",
    maxTurns: 40,
    maxBudgetUsd: 2.0,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
    outputSchema: TDD_OUTPUT_JSON_SCHEMA,
  },

  preparePromptInput: (input: TddValidateStepInput, _context) => ({
    specPath: input.spec_path,
    reviewSummary: input.review_summary,
    cwd: input.cwd,
  }),

  processResult: (_input: TddValidateStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = TddSummarySchema.safeParse(aiResult.structuredOutput);
      if (parsed.success) {
        return parsed.data;
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, "tdd_summary");
    const fallback = { ...TDD_SUMMARY_FALLBACK, details: aiResult.content.slice(0, 2000) };
    if (xmlContent) {
      return parseJsonSafe(xmlContent, TddSummarySchema, fallback);
    }

    return fallback;
  },
};
