/**
 * Commit step sub-capability definition (Session 3).
 * Internal capability: conditionally commits spec changes.
 */

import type { CapabilityDefinition } from "../../core/capability-registry/capability-registry.types.js";
import {
  CommitStepInputSchema,
  CommitResultSchema,
} from "./todo-reviewer.schema.js";
import {
  parseXmlBlock,
  parseJsonSafe,
  COMMIT_RESULT_FALLBACK,
} from "./todo-reviewer.helpers.js";
import type {
  CommitStepInput,
  CommitResult,
} from "./todo-reviewer.schema.js";
import {
  COMMIT_PROMPT_VERSIONS,
  COMMIT_CURRENT_VERSION,
} from "./prompts/index.js";

/**
 * Internal sub-capability for conditional git commit (Session 3).
 * Not intended for direct external use — invoked by the todo_reviewer orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to run
 * git operations (diff, add, commit). Input is validated via Zod schema and this
 * capability is only invoked through the orchestrator's authenticated channel.
 */
export const commitStepCapability: CapabilityDefinition<
  CommitStepInput,
  CommitResult
> = {
  id: "todo_commit_step",
  type: "tool",
  visibility: "internal",
  name: "Todo Commit Step (Internal)",
  description:
    "Internal sub-capability: conditionally commits spec changes. Not intended for direct use.",
  inputSchema: CommitStepInputSchema,
  promptRegistry: COMMIT_PROMPT_VERSIONS,
  currentPromptVersion: COMMIT_CURRENT_VERSION,
  defaultRequestOptions: {
    model: "haiku",
    maxTurns: 20,
    maxBudgetUsd: 0.5,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
  },

  preparePromptInput: (input: CommitStepInput, context) => ({
    specPath: input.spec_path,
    reviewSummary: input.review_summary,
    tddSummary: input.tdd_summary,
    sessionId: context.session.id,
    cwd: input.cwd,
  }),

  processResult: (_input: CommitStepInput, aiResult, _context) => {
    const xmlContent = parseXmlBlock(aiResult.content, "commit_result");
    if (xmlContent) {
      return parseJsonSafe(xmlContent, CommitResultSchema, COMMIT_RESULT_FALLBACK);
    }
    return COMMIT_RESULT_FALLBACK;
  },
};
