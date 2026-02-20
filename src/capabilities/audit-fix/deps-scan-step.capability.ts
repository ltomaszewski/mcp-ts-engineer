/**
 * Deps scan step sub-capability definition for audit-fix.
 * Internal capability: runs npm audit --json and reports vulnerability counts.
 *
 * Checks for package-lock.json, executes npm audit,
 * parses severity breakdown (critical/high/moderate/low).
 */

import type { CapabilityDefinition } from "../../core/capability-registry/capability-registry.types.js";
import {
  DepsScanStepInputSchema,
  DepsScanStepResultSchema,
} from "./audit-fix.schema.js";
import {
  parseXmlBlock,
  parseJsonSafe,
  DEPS_SCAN_STEP_RESULT_FALLBACK,
} from "./audit-fix.helpers.js";
import type {
  DepsScanStepInput,
  DepsScanStepResult,
} from "./audit-fix.schema.js";
import { depsScanPrompts, DEPS_SCAN_CURRENT_VERSION } from "./prompts/index.js";
import { buildPathValidationHooks } from "../../shared/hooks/index.js";

/**
 * Internal sub-capability for dependency vulnerability scanning with npm audit.
 * Not intended for direct external use — invoked by the audit_fix orchestrator.
 */
export const auditFixDepsScanStepCapability: CapabilityDefinition<
  DepsScanStepInput,
  DepsScanStepResult
> = {
  id: "audit_fix_deps_scan_step",
  type: "tool",
  visibility: "internal",
  name: "Audit Fix Deps Scan Step (Internal)",
  description:
    "Internal sub-capability: run npm audit --json in project and parse vulnerability severity breakdown. Returns audit status, vulnerability counts, and severity details. Not intended for direct use.",
  inputSchema: DepsScanStepInputSchema,
  promptRegistry: depsScanPrompts,
  currentPromptVersion: DEPS_SCAN_CURRENT_VERSION,
  defaultRequestOptions: {
    model: "haiku",
    maxTurns: 40,
    maxBudgetUsd: 2.0,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
    hooks: buildPathValidationHooks() as unknown as import("../../core/ai-provider/ai-provider.types.js").AIHooksConfig,
  },

  preparePromptInput: (input: DepsScanStepInput, _context) => ({
    projectPath: input.project_path,
    cwd: input.cwd,
  }),

  processResult: (_input: DepsScanStepInput, aiResult, _context) => {
    // Parse <deps_scan_result> XML block from AI response
    const xmlContent = parseXmlBlock(aiResult.content, "deps_scan_result");

    if (xmlContent) {
      return parseJsonSafe(xmlContent, DepsScanStepResultSchema, DEPS_SCAN_STEP_RESULT_FALLBACK);
    }

    // Fallback: return safe defaults
    return DEPS_SCAN_STEP_RESULT_FALLBACK;
  },
};
