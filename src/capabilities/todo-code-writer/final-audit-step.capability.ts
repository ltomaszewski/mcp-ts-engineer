/**
 * Final audit step sub-capability definition.
 * Internal capability: repository-wide audit on all modified files across all phases.
 *
 * Uses SDK structured output (outputSchema) as primary extraction method.
 * Falls back to XML parsing from aiResult.content if structured output is unavailable.
 */

import type { CapabilityDefinition } from "../../core/capability-registry/capability-registry.types.js";
import {
  FinalAuditStepInputSchema,
  FinalAuditResultSchema,
} from "./todo-code-writer.schema.js";
import {
  parseXmlBlock,
  parseJsonSafe,
  FINAL_AUDIT_RESULT_FALLBACK,
} from "./todo-code-writer.helpers.js";
import type {
  FinalAuditStepInput,
  FinalAuditResult,
} from "./todo-code-writer.schema.js";
import {
  FINAL_AUDIT_PROMPT_VERSIONS,
  FINAL_AUDIT_CURRENT_VERSION,
} from "./prompts/index.js";

/**
 * JSON Schema for final audit structured output.
 * Matches FinalAuditResultSchema but in JSON Schema format for the SDK's outputFormat.
 */
const FINAL_AUDIT_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["pass", "warn", "fail"] },
      issues_found: { type: "number" },
      summary: { type: "string" },
    },
    required: ["status", "issues_found", "summary"],
  },
};

/**
 * Internal sub-capability for final repository-wide audit.
 * Not intended for direct external use — invoked by the todo_code_writer orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * read all files and run comprehensive verification. Input is validated via Zod schema
 * and this capability is only invoked through the orchestrator's authenticated channel.
 */
export const finalAuditStepCapability: CapabilityDefinition<
  FinalAuditStepInput,
  FinalAuditResult
> = {
  id: "todo_code_writer_final_audit_step",
  type: "tool",
  visibility: "internal",
  name: "Todo Code Writer Final Audit Step (Internal)",
  description:
    "Internal sub-capability: repository-wide audit on all modified files. Not intended for direct use.",
  inputSchema: FinalAuditStepInputSchema,
  promptRegistry: FINAL_AUDIT_PROMPT_VERSIONS,
  currentPromptVersion: FINAL_AUDIT_CURRENT_VERSION,
  defaultRequestOptions: {
    model: "sonnet",
    maxTurns: 50,
    maxBudgetUsd: 3.0,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
    outputSchema: FINAL_AUDIT_OUTPUT_JSON_SCHEMA,
  },

  preparePromptInput: (input: FinalAuditStepInput, _context) => ({
    specPath: input.spec_path,
    allModifiedFiles: input.all_modified_files,
    cwd: input.cwd,
  }),

  processResult: (_input: FinalAuditStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = FinalAuditResultSchema.safeParse(aiResult.structuredOutput);
      if (parsed.success) {
        return parsed.data;
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, "final_audit_result");
    const fallback = { ...FINAL_AUDIT_RESULT_FALLBACK, summary: aiResult.content.slice(0, 2000) };
    if (xmlContent) {
      return parseJsonSafe(xmlContent, FinalAuditResultSchema, fallback);
    }

    return fallback;
  },
};
