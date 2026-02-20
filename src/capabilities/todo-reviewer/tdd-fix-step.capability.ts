/**
 * TDD fix step sub-capability definition.
 * Internal capability: applies remediation templates from TDD scan to spec file.
 *
 * Uses Sonnet model (remediation is mechanical template application, not deep reasoning).
 * Uses SDK structured output (outputSchema) as primary extraction method.
 * Falls back to XML parsing from aiResult.content if structured output is unavailable.
 */

import type { CapabilityDefinition } from "../../core/capability-registry/capability-registry.types.js";
import {
  TddFixStepInputSchema,
  TddFixStepResultSchema,
} from "./todo-reviewer.schema.js";
import {
  parseXmlBlock,
  parseJsonSafe,
  TDD_FIX_STEP_RESULT_FALLBACK,
} from "./todo-reviewer.helpers.js";
import type {
  TddFixStepInput,
  TddFixStepResult,
} from "./todo-reviewer.schema.js";
import {
  TDD_FIX_PROMPT_VERSIONS,
  TDD_FIX_CURRENT_VERSION,
} from "./prompts/index.js";

/**
 * JSON Schema for TDD fix structured output.
 * Matches TddFixStepResultSchema but in JSON Schema format for the SDK's outputFormat.
 */
const TDD_FIX_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["success", "partial", "failed"] },
      issues_fixed: { type: "number" },
      issues_remaining: { type: "number" },
      spec_modified: { type: "boolean" },
      fix_summary: { type: "string" },
    },
    required: [
      "status",
      "issues_fixed",
      "issues_remaining",
      "spec_modified",
      "fix_summary",
    ],
  },
};

/**
 * Internal sub-capability for TDD fix.
 * Not intended for direct external use — invoked by the todo_reviewer orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to read
 * and write spec files. Input is validated via Zod schema and this capability is only
 * invoked through the orchestrator's authenticated channel.
 */
export const tddFixStepCapability: CapabilityDefinition<
  TddFixStepInput,
  TddFixStepResult
> = {
  id: "todo_tdd_fix_step",
  type: "tool",
  visibility: "internal",
  name: "Todo TDD Fix Step (Internal)",
  description:
    "Internal sub-capability: applies remediation templates from TDD scan to spec file. Not intended for direct use.",
  inputSchema: TddFixStepInputSchema,
  promptRegistry: TDD_FIX_PROMPT_VERSIONS,
  currentPromptVersion: TDD_FIX_CURRENT_VERSION,
  defaultRequestOptions: {
    model: "sonnet",
    maxTurns: 60,
    maxBudgetUsd: 2.0,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
    outputSchema: TDD_FIX_OUTPUT_JSON_SCHEMA,
  },

  preparePromptInput: (input: TddFixStepInput, _context) => ({
    specPath: input.spec_path,
    scanResult: input.scan_result,
    cwd: input.cwd,
  }),

  processResult: (_input: TddFixStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = TddFixStepResultSchema.safeParse(
        aiResult.structuredOutput,
      );
      if (parsed.success) {
        return parsed.data;
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, "tdd_fix_result");
    const fallback = {
      ...TDD_FIX_STEP_RESULT_FALLBACK,
      fix_summary: aiResult.content.slice(0, 2000),
    };
    if (xmlContent) {
      return parseJsonSafe(xmlContent, TddFixStepResultSchema, fallback);
    }

    return fallback;
  },
};
