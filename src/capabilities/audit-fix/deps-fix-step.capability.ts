/**
 * Deps fix step sub-capability definition for audit-fix.
 * Internal capability: runs npm audit fix and tracks modified files.
 *
 * Executes npm audit fix, tracks file modifications via git status,
 * and runs post-verification audit to calculate fixed vs remaining vulnerabilities.
 */

import type { CapabilityDefinition } from "../../core/capability-registry/capability-registry.types.js";
import {
  DepsFixStepInputSchema,
  DepsFixStepResultSchema,
} from "./audit-fix.schema.js";
import {
  parseXmlBlock,
  parseJsonSafe,
  DEPS_FIX_STEP_RESULT_FALLBACK,
} from "./audit-fix.helpers.js";
import type {
  DepsFixStepInput,
  DepsFixStepResult,
} from "./audit-fix.schema.js";
import { depsFixPrompts, DEPS_FIX_CURRENT_VERSION } from "./prompts/index.js";
import { buildPathValidationHooks } from "../../shared/hooks/index.js";

/**
 * Internal sub-capability for dependency vulnerability remediation with npm audit fix.
 * Not intended for direct external use — invoked by the audit_fix orchestrator.
 */
export const auditFixDepsFixStepCapability: CapabilityDefinition<
  DepsFixStepInput,
  DepsFixStepResult
> = {
  id: "audit_fix_deps_fix_step",
  type: "tool",
  visibility: "internal",
  name: "Audit Fix Deps Fix Step (Internal)",
  description:
    "Internal sub-capability: run npm audit fix in project and track modified files. Returns fix status, vulnerabilities fixed/remaining counts, and list of modified files. Not intended for direct use.",
  inputSchema: DepsFixStepInputSchema,
  promptRegistry: depsFixPrompts,
  currentPromptVersion: DEPS_FIX_CURRENT_VERSION,
  defaultRequestOptions: {
    model: "sonnet",
    maxTurns: 30,
    maxBudgetUsd: 2.0,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
    hooks: buildPathValidationHooks() as unknown as import("../../core/ai-provider/ai-provider.types.js").AIHooksConfig,
  },

  preparePromptInput: (input: DepsFixStepInput, _context) => ({
    projectPath: input.project_path,
    vulnerabilitiesFound: input.vulnerabilities_found,
    cwd: input.cwd,
  }),

  processResult: (_input: DepsFixStepInput, aiResult, _context) => {
    // Parse <deps_fix_result> XML block from AI response
    const xmlContent = parseXmlBlock(aiResult.content, "deps_fix_result");

    if (xmlContent) {
      return parseJsonSafe(xmlContent, DepsFixStepResultSchema, DEPS_FIX_STEP_RESULT_FALLBACK);
    }

    // Fallback: return safe defaults
    return DEPS_FIX_STEP_RESULT_FALLBACK;
  },
};
