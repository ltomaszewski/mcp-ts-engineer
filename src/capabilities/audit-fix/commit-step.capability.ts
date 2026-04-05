/**
 * Commit step sub-capability definition for audit-fix.
 * Internal capability: commits per-project changes using structured output + XML fallback.
 *
 * Follows the same pattern as todo-code-writer/commit-step.capability.ts
 * but with audit-fix-specific prompt input.
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import { COMMIT_RESULT_FALLBACK, parseJsonSafe, parseXmlBlock } from './audit-fix.helpers.js'
import type { CommitResult, CommitStepInput } from './audit-fix.schema.js'
import { CommitResultSchema, CommitStepInputSchema } from './audit-fix.schema.js'
import { AUDIT_FIX_COMMIT_CURRENT_VERSION, auditFixCommitPrompts } from './prompts/index.js'

// ---------------------------------------------------------------------------
// JSON Schema for commit structured output
// ---------------------------------------------------------------------------

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

// ---------------------------------------------------------------------------
// Capability Definition
// ---------------------------------------------------------------------------

/**
 * Internal sub-capability for commit step in audit-fix workflow.
 * Not intended for direct external use — invoked by the audit_fix orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * run git commands. Input is validated via Zod schema and this capability is only
 * invoked through the orchestrator's authenticated channel.
 */
export const auditFixCommitStepCapability: CapabilityDefinition<CommitStepInput, CommitResult> = {
  id: 'audit_fix_commit_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Audit Fix Commit Step (Internal)',
  description:
    'Internal sub-capability: commits per-project audit-fix changes with conventional commit message. Not intended for direct use.',
  inputSchema: CommitStepInputSchema,
  promptRegistry: auditFixCommitPrompts,
  currentPromptVersion: AUDIT_FIX_COMMIT_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 20,
    maxBudgetUsd: 0.5,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: COMMIT_OUTPUT_JSON_SCHEMA,
  },

  preparePromptInput: (input: CommitStepInput, context) => ({
    projectPath: input.project_path,
    filesChanged: input.files_changed,
    auditSummary: input.audit_summary,
    sessionId: context.session.id,
    cwd: input.cwd,
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
