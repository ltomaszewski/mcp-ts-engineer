/**
 * Commit step sub-capability definition.
 * Internal capability: creates a commit with message derived from phase summaries.
 *
 * Uses SDK structured output (outputSchema) as primary extraction method.
 * Falls back to XML parsing from aiResult.content if structured output is unavailable.
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import { COMMIT_CURRENT_VERSION, COMMIT_PROMPT_VERSIONS } from './prompts/index.js'
import { COMMIT_RESULT_FALLBACK, parseJsonSafe, parseXmlBlock } from './todo-code-writer.helpers.js'
import type { CommitResult, CommitStepInput } from './todo-code-writer.schema.js'
import { CommitResultSchema, CommitStepInputSchema } from './todo-code-writer.schema.js'

/**
 * JSON Schema for commit structured output.
 * Matches CommitResultSchema but in JSON Schema format for the SDK's outputFormat.
 */
const COMMIT_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      committed: { type: 'boolean' },
      commit_sha: { type: ['string', 'null'] },
      commit_message: { type: ['string', 'null'] },
      files_changed: { type: 'array', items: { type: 'string' } },
    },
    required: ['committed', 'commit_sha', 'commit_message', 'files_changed'],
  },
}

/**
 * Internal sub-capability for commit step.
 * Not intended for direct external use — invoked by the todo_code_writer orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * run git commands. Input is validated via Zod schema and this capability is only
 * invoked through the orchestrator's authenticated channel.
 */
export const commitStepCapability: CapabilityDefinition<CommitStepInput, CommitResult> = {
  id: 'todo_code_writer_commit_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Todo Code Writer Commit Step (Internal)',
  description:
    'Internal sub-capability: creates a commit with derived message. Not intended for direct use.',
  inputSchema: CommitStepInputSchema,
  promptRegistry: COMMIT_PROMPT_VERSIONS,
  currentPromptVersion: COMMIT_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 40,
    maxBudgetUsd: 5.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: COMMIT_OUTPUT_JSON_SCHEMA,
  },

  preparePromptInput: (input: CommitStepInput, context) => ({
    specPath: input.spec_path,
    filesChanged: input.files_changed,
    phaseSummaries: input.phase_summaries,
    finalAuditSummary: input.final_audit_summary,
    sessionId: context.session.id,
    cwd: input.cwd,
    partialRun: input.partial_run,
    failureContext: input.failure_context,
  }),

  processResult: (_input: CommitStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = CommitResultSchema.safeParse(aiResult.structuredOutput)
      if (parsed.success) {
        return parsed.data
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, 'commit_result')
    if (xmlContent) {
      return parseJsonSafe(xmlContent, CommitResultSchema, COMMIT_RESULT_FALLBACK)
    }

    return COMMIT_RESULT_FALLBACK
  },
}
