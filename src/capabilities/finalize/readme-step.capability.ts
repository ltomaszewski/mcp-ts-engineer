/**
 * Readme step sub-capability definition.
 * Internal capability: updates project README.md files based on documented feature changes.
 *
 * Analyzes changed files for user-facing feature impact and updates
 * project-level READMEs (apps/*, packages/*) with Edit tool to preserve formatting.
 */

import type { CapabilityDefinition } from "../../core/capability-registry/capability-registry.types.js";
import {
  ReadmeStepInputSchema,
  ReadmeResultSchema,
} from "./finalize.schema.js";
import {
  parseXmlBlock,
  parseJsonSafe,
  README_RESULT_FALLBACK,
} from "./finalize.helpers.js";
import type {
  ReadmeStepInput,
  ReadmeResult,
} from "./finalize.schema.js";
import {
  readmePrompts,
  README_CURRENT_VERSION,
} from "./prompts/index.js";

/**
 * Internal sub-capability for updating project README files.
 * Not intended for direct external use — invoked by the finalize orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * analyze file structure and write to project README files. Input is validated
 * via Zod schema and this capability is only invoked through the orchestrator's
 * authenticated channel.
 */
export const finalizeReadmeStepCapability: CapabilityDefinition<
  ReadmeStepInput,
  ReadmeResult
> = {
  id: "finalize_readme_step",
  type: "tool",
  visibility: "internal",
  name: "Finalize README Step (Internal)",
  description:
    "Internal sub-capability: updates project README.md files based on documented feature changes. Not intended for direct use.",
  inputSchema: ReadmeStepInputSchema,
  promptRegistry: readmePrompts,
  currentPromptVersion: README_CURRENT_VERSION,
  defaultRequestOptions: {
    model: "haiku",
    maxTurns: 30,
    maxBudgetUsd: 1.0,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
  },

  preparePromptInput: (input: ReadmeStepInput, _context) => ({
    filesChanged: input.files_changed,
    cwd: input.cwd,
  }),

  processResult: (_input: ReadmeStepInput, aiResult, _context) => {
    // Parse <readme_result> XML block from AI response
    const xmlContent = parseXmlBlock(aiResult.content, "readme_result");
    const fallback = {
      ...README_RESULT_FALLBACK,
      summary: aiResult.content.slice(0, 2000),
    };

    if (xmlContent) {
      return parseJsonSafe(xmlContent, ReadmeResultSchema, fallback);
    }

    return fallback;
  },
};
