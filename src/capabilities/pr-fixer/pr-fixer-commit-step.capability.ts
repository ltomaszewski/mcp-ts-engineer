/**
 * Commit step: Commit and push direct fixes to PR branch.
 */

import type {
  CapabilityDefinition,
  CapabilityContext,
} from '../../core/capability-registry/capability-registry.types.js'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseJsonSafe } from '../../core/utils/index.js'
import { z } from 'zod'
import {
  FixerCommitStepOutputSchema,
  FIXER_COMMIT_OUTPUT_JSON_SCHEMA,
} from './pr-fixer.schema.js'
import type { FixerCommitStepOutput } from './pr-fixer.schema.js'

const CommitStepInputSchema = z.object({
  worktree_path: z.string(),
  pr_branch: z.string(),
  fixes_applied: z.number(),
})

type CommitStepInput = z.infer<typeof CommitStepInputSchema>

const COMMIT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-24',
  description: 'Commit and push fixer fixes',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as CommitStepInput
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Commit and Push Fixes

Worktree: ${data.worktree_path}
Branch: ${data.pr_branch}
Fixes: ${data.fixes_applied}

## Steps

1. Check for changes:
\`\`\`bash
cd ${data.worktree_path} && git status && git diff --stat
\`\`\`

2. Stage and commit:
\`\`\`bash
cd ${data.worktree_path} && git add -A && git commit -m "fix: apply ${data.fixes_applied} review fixes (pr-fixer)"
\`\`\`

3. Push:
\`\`\`bash
cd ${data.worktree_path} && git push origin ${data.pr_branch}
\`\`\`

4. Get SHA:
\`\`\`bash
cd ${data.worktree_path} && git rev-parse HEAD
\`\`\`

## Output

Return JSON:
\`\`\`json
{
  "committed": true,
  "pushed": true,
  "commit_sha": "abc123..."
}
\`\`\`

Begin now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: COMMIT_V1 }
const CURRENT_VERSION = 'v1'

const FALLBACK: FixerCommitStepOutput = { committed: false, pushed: false }

export const prFixerCommitStepCapability: CapabilityDefinition<
  CommitStepInput,
  FixerCommitStepOutput
> = {
  id: 'pr_fixer_commit_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Fixer Commit Step',
  description: 'Commit and push direct fixes to PR branch',
  inputSchema: CommitStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 20,
    maxBudgetUsd: 0.3,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: FIXER_COMMIT_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: CommitStepInput) => input,
  processResult: (
    _input: CommitStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): FixerCommitStepOutput => {
    if (aiResult.structuredOutput) {
      const validated = FixerCommitStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }
    return parseJsonSafe(aiResult.content, FixerCommitStepOutputSchema, FALLBACK)
  },
}
