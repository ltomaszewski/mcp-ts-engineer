/**
 * Commit step sub-capability definition.
 * Internal capability: commits cleanup changes with descriptive message.
 *
 * Stages audit fixes and codemap updates, creates a commit with a message
 * following the format: chore(<scope>): finalize audit fixes and codemap updates
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import {
  FINALIZE_COMMIT_RESULT_FALLBACK,
  parseJsonSafe,
  parseXmlBlock,
} from './finalize.helpers.js'
import type { CommitStepInput, FinalizeCommitResult } from './finalize.schema.js'
import { CommitStepInputSchema, FinalizeCommitResultSchema } from './finalize.schema.js'
import { COMMIT_CURRENT_VERSION, commitPrompts } from './prompts/index.js'

/**
 * Internal sub-capability for committing finalization changes.
 * Not intended for direct external use — invoked by the finalize orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * stage files and create git commits. Input is validated via Zod schema and this
 * capability is only invoked through the orchestrator's authenticated channel.
 */
export const finalizeCommitStepCapability: CapabilityDefinition<
  CommitStepInput,
  FinalizeCommitResult
> = {
  id: 'finalize_commit_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Finalize Commit Step (Internal)',
  description:
    'Internal sub-capability: commits cleanup changes (audit fixes and codemap updates) with descriptive message. Not intended for direct use.',
  inputSchema: CommitStepInputSchema,
  promptRegistry: commitPrompts,
  currentPromptVersion: COMMIT_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 20,
    maxBudgetUsd: 0.5,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: {
      type: 'json_schema',
      schema: {
        type: 'object',
        properties: {
          committed: { type: 'boolean' },
          commit_sha: { type: ['string', 'null'] },
          commit_message: { type: ['string', 'null'] },
          files_committed: { type: 'array', items: { type: 'string' } },
        },
        required: ['committed', 'commit_sha', 'commit_message', 'files_committed'],
      },
    } as Record<string, unknown>,
  },

  preparePromptInput: (input: CommitStepInput, context) => ({
    auditSummary: input.audit_summary,
    codemapSummary: input.codemap_summary,
    readmeSummary: input.readme_summary ?? 'No README changes',
    filesAffected: input.files_affected,
    sessionId: context.session.id,
    cwd: input.cwd,
  }),

  processResult: (_input: CommitStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = FinalizeCommitResultSchema.safeParse(aiResult.structuredOutput)
      if (parsed.success) {
        return parsed.data
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, 'finalize_commit_result')
    const fallback = {
      ...FINALIZE_COMMIT_RESULT_FALLBACK,
    }

    if (xmlContent) {
      return parseJsonSafe(xmlContent, FinalizeCommitResultSchema, fallback)
    }

    return fallback
  },
}
