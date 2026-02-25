/**
 * Comment step: Post/update fixer comment on PR with per-issue results.
 *
 * Posting is done programmatically via execSync('gh ...') in processResult()
 * to guarantee the hidden state marker is preserved exactly as built.
 */

import { z } from 'zod'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { postOrUpdateComment } from '../../core/utils/github-comment.js'
import {
  FIXER_STATE_MARKER,
  type IssueStatus,
  type PrCommentState,
  serializeState,
} from '../../core/utils/pr-comment-state.js'
import type { FixerCommentStepOutput, PrFixerOutput } from './pr-fixer.schema.js'

const CommentStepInputSchema = z.object({
  pr_number: z.number(),
  repo_owner: z.string(),
  repo_name: z.string(),
  round: z.number(),
  output: z.record(z.string(), z.unknown()),
})

type CommentStepInput = z.infer<typeof CommentStepInputSchema>

/**
 * Build fixer comment body with per-issue results and hidden state.
 */
function buildFixerCommentBody(data: CommentStepInput): string {
  const output = data.output as unknown as PrFixerOutput
  const lines: string[] = [`## PR Fixer — Round ${data.round}`, '']

  if (output.per_issue.length > 0) {
    lines.push('| Issue | Status | Method |')
    lines.push('|-------|--------|--------|')
    for (const item of output.per_issue) {
      const statusEmoji = item.status === 'fixed' ? '✅' : item.status === 'skipped' ? '⏭️' : '❌'
      lines.push(`| ${item.title} | ${statusEmoji} ${item.status} | ${item.method} |`)
    }
    lines.push('')
  }

  lines.push(
    `**Total**: ${output.issues_resolved} fixed, ${output.issues_failed} failed, ${output.issues_skipped} skipped | **Cost**: $${output.cost_usd.toFixed(2)}`,
    '',
  )

  // Hidden state for cross-round tracking
  const issueStates: Record<string, IssueStatus> = {}
  for (const item of output.per_issue) {
    issueStates[item.issue_id] = item.status === 'fixed' ? 'fixed' : 'open'
  }
  const state: PrCommentState = {
    v: 1,
    round: data.round,
    sha: '',
    issues: issueStates,
  }
  lines.push(serializeState(FIXER_STATE_MARKER, state))

  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Capability definition (programmatic — no AI agent needed)
// ---------------------------------------------------------------------------

const COMMENT_V2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-24',
  description: 'Programmatic fixer comment posting — no AI agent needed',
  deprecated: false,
  sunsetDate: undefined,
  build: (_input: unknown) => ({
    systemPrompt: 'You are a no-op assistant. Return the JSON exactly as shown.',
    userPrompt: 'Return this JSON: {"status":"ready"}',
  }),
}

const PROMPT_VERSIONS: PromptRegistry = { v2: COMMENT_V2 }
const CURRENT_VERSION = 'v2'

export const prFixerCommentStepCapability: CapabilityDefinition<
  CommentStepInput,
  FixerCommentStepOutput
> = {
  id: 'pr_fixer_comment_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Fixer Comment Step',
  description: 'Post or update fixer comment on PR',
  inputSchema: CommentStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 1,
    maxBudgetUsd: 0.01,
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
  },
  preparePromptInput: (input: CommentStepInput) => input,
  processResult: (
    input: CommentStepInput,
    _aiResult: AIQueryResult,
    context: CapabilityContext,
  ): FixerCommentStepOutput => {
    const commentBody = buildFixerCommentBody(input)

    try {
      const commentUrl = postOrUpdateComment(
        input.repo_owner,
        input.repo_name,
        input.pr_number,
        commentBody,
        '<!-- pr-fixer-state:',
      )
      context.logger.info('Fixer comment posted programmatically', { commentUrl })
      return { comment_url: commentUrl, comment_posted: true }
    } catch (error) {
      context.logger.error('Failed to post fixer comment', {
        error: error instanceof Error ? error.message : String(error),
      })
      return { comment_url: '', comment_posted: false }
    }
  },
}
