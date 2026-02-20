/**
 * Phase engineering step sub-capability definition.
 * Internal capability: implements a single phase with embedded spec instructions.
 *
 * Uses SDK structured output (outputSchema) as primary extraction method.
 * Falls back to XML parsing from aiResult.content if structured output is unavailable.
 *
 * v2 enhancements:
 * - Detects workspace technologies and dependencies from package.json
 * - Passes detectedTechnologies and detectedDependencies to prompt builder
 * - Prompt instructs sub-agent to load relevant skills via the Skill tool
 */

import type { CapabilityDefinition } from "../../core/capability-registry/capability-registry.types.js";
import {
  PhaseEngStepInputSchema,
  PhaseEngResultSchema,
} from "./todo-code-writer.schema.js";
import {
  parseXmlBlock,
  parseJsonSafe,
  PHASE_ENG_RESULT_FALLBACK,
} from "./todo-code-writer.helpers.js";
import type {
  PhaseEngStepInput,
  PhaseEngResult,
} from "./todo-code-writer.schema.js";
import {
  PHASE_ENG_PROMPT_VERSIONS,
  PHASE_ENG_CURRENT_VERSION,
} from "./prompts/index.js";
import { buildDevContext } from "./prompts/dev-context.js";
import { detectWorkspace } from "./workspace-detector.js";
import { buildPathValidationHooks } from "../../shared/hooks/index.js";

/**
 * JSON Schema for phase engineering structured output.
 * Matches PhaseEngResultSchema but in JSON Schema format for the SDK's outputFormat.
 */
const PHASE_ENG_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: "json_schema",
  schema: {
    type: "object",
    properties: {
      status: { type: "string", enum: ["success", "failed"] },
      files_modified: { type: "array", items: { type: "string" } },
      summary: { type: "string" },
    },
    required: ["status", "files_modified", "summary"],
  },
};

/**
 * Internal sub-capability for phase engineering implementation.
 * Not intended for direct external use — invoked by the todo_code_writer orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * implement code, write tests, and run builds. Input is validated via Zod schema and
 * this capability is only invoked through the orchestrator's authenticated channel.
 */
export const phaseEngStepCapability: CapabilityDefinition<
  PhaseEngStepInput,
  PhaseEngResult
> = {
  id: "todo_code_writer_phase_eng_step",
  type: "tool",
  visibility: "internal",
  name: "Todo Code Writer Phase Engineering Step (Internal)",
  description:
    "Internal sub-capability: implements a single phase with embedded spec instructions. Not intended for direct use.",
  inputSchema: PhaseEngStepInputSchema,
  promptRegistry: PHASE_ENG_PROMPT_VERSIONS,
  currentPromptVersion: PHASE_ENG_CURRENT_VERSION,
  defaultRequestOptions: {
    model: "sonnet", // Default, can be overridden with opus/haiku from orchestrator
    maxTurns: 100,
    maxBudgetUsd: 5.0,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
    outputSchema: PHASE_ENG_OUTPUT_JSON_SCHEMA,
    appendSystemPrompt: undefined, // Set lazily at merge time via buildDevContext()
    hooks: buildPathValidationHooks() as unknown as import("../../core/ai-provider/ai-provider.types.js").AIHooksConfig,
  },

  preparePromptInput: (input: PhaseEngStepInput, _context) => {
    const detection = detectWorkspace(input.cwd);
    return {
      specPath: input.spec_path,
      phasePlan: input.phase_plan,
      currentPhaseNumber: input.current_phase_number,
      cwd: input.cwd,
      detectedTechnologies: detection.technologies,
      detectedDependencies: detection.dependencies,
    };
  },

  processResult: (_input: PhaseEngStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = PhaseEngResultSchema.safeParse(aiResult.structuredOutput);
      if (parsed.success) {
        return parsed.data;
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, "phase_eng_result");
    const fallback = { ...PHASE_ENG_RESULT_FALLBACK, summary: aiResult.content.slice(0, 2000) };
    if (xmlContent) {
      return parseJsonSafe(xmlContent, PhaseEngResultSchema, fallback);
    }

    return fallback;
  },
};
