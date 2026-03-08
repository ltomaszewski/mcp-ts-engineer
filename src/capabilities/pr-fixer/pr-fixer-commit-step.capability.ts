/**
 * Commit step: Commit and push direct fixes to PR branch.
 */

import { z } from 'zod'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { isValidGitRef, isValidPath, parseJsonSafe, shellQuote } from '../../core/utils/index.js'
import type { FixerCommitStepOutput } from './pr-fixer.schema.js'
import { FIXER_COMMIT_OUTPUT_JSON_SCHEMA, FixerCommitStepOutputSchema } from './pr-fixer.schema.js'

const CommitStepInputSchema = z.object({
  worktree_path: z.string().refine(isValidPath, { message: 'Invalid path' }),
  pr_branch: z.string().refine(isValidGitRef, { message: 'Invalid git ref' }),
  fixes_applied: z.number(),
  issue_titles: z.array(z.string()).default([]),
})

type CommitStepInput = z.infer<typeof CommitStepInputSchema>

const COMMIT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-24',
  description: 'Commit and push fixer fixes',
  deprecated: true,
  sunsetDate: '2026-04-01',
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
cd ${shellQuote(data.worktree_path)} && git status && git diff --stat
\`\`\`

2. Stage and commit:
\`\`\`bash
cd ${shellQuote(data.worktree_path)} && git add -A && git commit -m "fix: apply ${data.fixes_applied} review fixes (pr-fixer)"
\`\`\`

3. Push:
\`\`\`bash
cd ${shellQuote(data.worktree_path)} && git push origin ${shellQuote(data.pr_branch)}
\`\`\`

4. Get SHA:
\`\`\`bash
cd ${shellQuote(data.worktree_path)} && git rev-parse HEAD
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

/**
 * Build a descriptive multi-line commit message from fixed issue titles.
 * Truncates each title to 72 chars and lists up to 10.
 */
function buildCommitMessage(fixesApplied: number, issueTitles: string[]): string {
  const subject = `fix(pr-review): resolve ${fixesApplied} review finding${fixesApplied === 1 ? '' : 's'}`

  if (issueTitles.length === 0) return subject

  const maxListed = 10
  const listed = issueTitles.slice(0, maxListed)
  const lines = listed.map((t) => `- ${t.length > 72 ? `${t.slice(0, 69)}...` : t}`)

  if (issueTitles.length > maxListed) {
    lines.push(`- ...and ${issueTitles.length - maxListed} more`)
  }

  return `${subject}\n\n${lines.join('\n')}`
}

const COMMIT_V2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-25',
  description: 'Commit with descriptive multi-line message listing fixed issues',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as CommitStepInput
    const commitMsg = buildCommitMessage(data.fixes_applied, data.issue_titles)

    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Commit and Push Fixes

Worktree: ${data.worktree_path}
Branch: ${data.pr_branch}
Fixes: ${data.fixes_applied}

## Steps

1. Check for changes:
\`\`\`bash
cd ${shellQuote(data.worktree_path)} && git status && git diff --stat
\`\`\`

2. Stage and commit with descriptive message:
\`\`\`bash
cd ${shellQuote(data.worktree_path)} && git add -A && git commit -m "$(cat <<'COMMITMSG'
${commitMsg}
COMMITMSG
)"
\`\`\`

3. Push:
\`\`\`bash
cd ${shellQuote(data.worktree_path)} && git push origin ${shellQuote(data.pr_branch)}
\`\`\`

4. Get SHA:
\`\`\`bash
cd ${shellQuote(data.worktree_path)} && git rev-parse HEAD
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

const PROMPT_VERSIONS: PromptRegistry = { v1: COMMIT_V1, v2: COMMIT_V2 }
const CURRENT_VERSION = 'v2'

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
