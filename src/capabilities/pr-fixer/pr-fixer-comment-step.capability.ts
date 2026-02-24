/**
 * Comment step: Post/update fixer comment on PR with per-issue results.
 */

import type {
  CapabilityDefinition,
  CapabilityContext,
} from '../../core/capability-registry/capability-registry.types.js'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseJsonSafe } from '../../core/utils/index.js'
import {
  serializeState,
  FIXER_STATE_MARKER,
  type PrCommentState,
  type IssueStatus,
} from '../../core/utils/pr-comment-state.js'
import { z } from 'zod'
import {
  FixerCommentStepOutputSchema,
  FIXER_COMMENT_OUTPUT_JSON_SCHEMA,
} from './pr-fixer.schema.js'
import type { FixerCommentStepOutput, PrFixerOutput } from './pr-fixer.schema.js'
import { tryExtractCommentUrl } from '../pr-reviewer/pr-reviewer.helpers.js'

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
  const lines: string[] = [
    `## PR Fixer — Round ${data.round}`,
    '',
  ]

  if (output.per_issue.length > 0) {
    lines.push('| Issue | Status | Method |')
    lines.push('|-------|--------|--------|')
    for (const item of output.per_issue) {
      const statusEmoji =
        item.status === 'fixed' ? '✅' : item.status === 'skipped' ? '⏭️' : '❌'
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

const COMMENT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-24',
  description: 'Post/update fixer comment on PR',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as CommentStepInput
    const commentBody = buildFixerCommentBody(data)

    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Post PR Fixer Comment

Post or update a fixer comment on PR #${data.pr_number} in ${data.repo_owner}/${data.repo_name}.

## Comment Body

\`\`\`
${commentBody}
\`\`\`

## Steps

1. Check for existing fixer comment:
\`\`\`bash
gh api repos/${data.repo_owner}/${data.repo_name}/issues/${data.pr_number}/comments --jq '[.[] | select(.body | contains("<!-- pr-fixer-state:")) | {id: .id}] | last'
\`\`\`

2. If found, UPDATE:
\`\`\`bash
gh api repos/${data.repo_owner}/${data.repo_name}/issues/comments/<ID> -X PATCH -f body="$(cat <<'COMMENT_EOF'
${commentBody}
COMMENT_EOF
)"
\`\`\`

3. If not found, CREATE:
\`\`\`bash
gh pr comment ${data.pr_number} --repo ${data.repo_owner}/${data.repo_name} --body "$(cat <<'COMMENT_EOF'
${commentBody}
COMMENT_EOF
)"
\`\`\`

4. Return JSON:
\`\`\`json
{
  "comment_url": "<URL>",
  "comment_posted": true
}
\`\`\`

Begin now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: COMMENT_V1 }
const CURRENT_VERSION = 'v1'

const FALLBACK: FixerCommentStepOutput = { comment_url: '', comment_posted: false }

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
    maxTurns: 15,
    maxBudgetUsd: 0.3,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: FIXER_COMMENT_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: CommentStepInput) => input,
  processResult: (
    _input: CommentStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): FixerCommentStepOutput => {
    if (aiResult.structuredOutput) {
      const validated = FixerCommentStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }

    // Try extracting URL from content
    const extractedUrl = tryExtractCommentUrl(aiResult.content)
    if (extractedUrl) {
      return { comment_url: extractedUrl, comment_posted: true }
    }

    return parseJsonSafe(aiResult.content, FixerCommentStepOutputSchema, FALLBACK)
  },
}
