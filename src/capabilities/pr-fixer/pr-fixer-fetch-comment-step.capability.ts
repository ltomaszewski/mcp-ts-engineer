/**
 * Fetch comment step: Retrieve the latest pr_reviewer comment from a PR.
 */

import type {
  CapabilityDefinition,
  CapabilityContext,
} from '../../core/capability-registry/capability-registry.types.js'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseJsonSafe } from '../../core/utils/index.js'
import { z } from 'zod'

const FetchCommentStepInputSchema = z.object({
  pr_number: z.number(),
  repo_owner: z.string(),
  repo_name: z.string(),
})

type FetchCommentStepInput = z.infer<typeof FetchCommentStepInputSchema>

const FetchCommentStepOutputSchema = z.object({
  comment_body: z.string(),
})

type FetchCommentStepOutput = z.infer<typeof FetchCommentStepOutputSchema>

const FETCH_COMMENT_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      comment_body: { type: 'string' },
    },
    required: ['comment_body'],
  },
}

const FETCH_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-24',
  description: 'Fetch latest reviewer comment from PR',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as FetchCommentStepInput
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Fetch PR Reviewer Comment

Fetch the latest pr_reviewer comment from PR #${data.pr_number} in ${data.repo_owner}/${data.repo_name}.

## Steps

1. Fetch the comment that contains "Issues Data":
\`\`\`bash
gh pr view ${data.pr_number} --repo ${data.repo_owner}/${data.repo_name} --json comments --jq '.comments | map(select(.body | contains("Issues Data"))) | last | .body'
\`\`\`

2. If no comment found, return:
\`\`\`json
{"comment_body": ""}
\`\`\`

3. If found, return the full comment body:
\`\`\`json
{"comment_body": "<full comment body>"}
\`\`\`

Begin now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: FETCH_V1 }
const CURRENT_VERSION = 'v1'

const FALLBACK: FetchCommentStepOutput = { comment_body: '' }

export const prFixerFetchCommentStepCapability: CapabilityDefinition<
  FetchCommentStepInput,
  FetchCommentStepOutput
> = {
  id: 'pr_fixer_fetch_comment_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Fixer Fetch Comment Step',
  description: 'Fetch the latest reviewer comment from a PR',
  inputSchema: FetchCommentStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 10,
    maxBudgetUsd: 0.2,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: FETCH_COMMENT_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: FetchCommentStepInput) => input,
  processResult: (
    _input: FetchCommentStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): FetchCommentStepOutput => {
    if (aiResult.structuredOutput) {
      const validated = FetchCommentStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }
    return parseJsonSafe(aiResult.content, FetchCommentStepOutputSchema, FALLBACK)
  },
}
