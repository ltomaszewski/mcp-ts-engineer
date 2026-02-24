import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseJsonSafe, parseXmlBlock } from '../../core/utils/index.js'
import type { CommitStepInput, CommitStepOutput } from './pr-reviewer.schema.js'
import {
  COMMIT_OUTPUT_JSON_SCHEMA,
  CommitStepInputSchema,
  CommitStepOutputSchema,
} from './pr-reviewer.schema.js'

const COMMIT_PROMPT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Commit and push fixes to PR branch',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as CommitStepInput
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Commit and Push Fixes

You are committing ${data.fixes_applied} fixes to the PR branch.

Worktree: ${data.worktree_path}
Branch: ${data.pr_branch}

## Tasks

1. **Check for changes**:
   \`\`\`bash
   cd ${data.worktree_path}
   git status
   git diff --stat
   \`\`\`

2. **Stage and commit** (if changes exist):
   \`\`\`bash
   git add -A
   git commit -m "fix: apply ${data.fixes_applied} auto-fixes from PR review"
   \`\`\`

3. **Push to remote**:
   \`\`\`bash
   git push origin ${data.pr_branch}
   \`\`\`

4. **Get commit SHA**:
   \`\`\`bash
   git rev-parse HEAD
   \`\`\`

## Output Format

Respond with JSON:
\`\`\`json
{
  "committed": true,
  "pushed": true,
  "commit_sha": "abc123..."
}
\`\`\`

Begin commit now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: COMMIT_PROMPT_V1 }
const CURRENT_VERSION = 'v1'

export const prCommitStepCapability: CapabilityDefinition<CommitStepInput, CommitStepOutput> = {
  id: 'pr_commit_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Commit Step',
  description: 'Commit and push fixes to PR branch',
  inputSchema: CommitStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
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
  preparePromptInput: (input: CommitStepInput, _context: CapabilityContext) => input,
  processResult: (
    _input: CommitStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): CommitStepOutput => {
    const FALLBACK: CommitStepOutput = { committed: false, pushed: false }

    // Strategy 1: SDK structured output
    if (aiResult.structuredOutput) {
      const validated = CommitStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }

    // Strategy 2: XML block fallback
    const xmlContent = parseXmlBlock(aiResult.content, 'commit_result')
    if (xmlContent) return parseJsonSafe(xmlContent, CommitStepOutputSchema, FALLBACK)

    return FALLBACK
  },
}
