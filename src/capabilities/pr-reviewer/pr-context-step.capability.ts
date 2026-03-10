import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseJsonSafe, parseXmlBlock, shellQuote } from '../../core/utils/index.js'
import { tryParseJson } from './pr-reviewer.helpers.js'
import type { ContextStepInput, ContextStepOutput } from './pr-reviewer.schema.js'
import {
  CONTEXT_OUTPUT_JSON_SCHEMA,
  ContextStepInputSchema,
  ContextStepOutputSchema,
} from './pr-reviewer.schema.js'

const CONTEXT_PROMPT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Setup review context - create worktree, fetch diff, and analyze files',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as ContextStepInput
    const ctx = data.pr_context
    const externalCwd = data.cwd

    // When cwd is provided, skip worktree creation and just fetch diff
    if (externalCwd) {
      return {
        systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
        userPrompt: `# PR Context Setup (External Worktree)

You are setting up the review context for PR #${ctx.pr_number} in ${ctx.repo_owner}/${ctx.repo_name}.

An existing worktree is provided at: ${externalCwd}

**DO NOT create a new worktree.** Use the provided path as the worktree.

## Tasks

1. **Use existing worktree at \`${externalCwd}\`** — do NOT run \`git worktree add\`

2. **Fetch Diff**
   ${
     ctx.last_reviewed_sha
       ? `- Get incremental diff: \`git diff ${shellQuote(ctx.last_reviewed_sha)}..HEAD\``
       : `- Get full diff: \`gh pr diff ${ctx.pr_number}\``
   }

3. **Catalog Files Changed**
   - Run: \`gh pr diff ${ctx.pr_number} --name-only\` to get the file list

## Output Format

Respond with JSON:
\`\`\`json
{
  "worktree_path": "${externalCwd}",
  "diff_content": "git diff output...",
  "files_changed": ["path/to/file.ts"]
}
\`\`\`

Proceed with context setup now.`,
      }
    }

    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# PR Context Setup

You are setting up the review context for PR #${ctx.pr_number} in ${ctx.repo_owner}/${ctx.repo_name}.

Branch: ${ctx.pr_branch} → ${ctx.base_branch}
${ctx.last_reviewed_sha ? `Incremental review from SHA: ${ctx.last_reviewed_sha}` : 'Full review (first run)'}

## Tasks

1. **Create Worktree**
   - Create worktree: \`git worktree add .worktrees/pr-${ctx.pr_number}-review ${shellQuote(ctx.pr_branch)}\`
   - Run: \`npm install\` in the worktree

2. **Fetch Diff**
   ${
     ctx.last_reviewed_sha
       ? `- Get incremental diff: \`git diff ${shellQuote(ctx.last_reviewed_sha)}..HEAD\``
       : `- Get full diff: \`gh pr diff ${ctx.pr_number}\``
   }

3. **Catalog Files Changed**
   - List: ${ctx.files_changed.length} files
   ${ctx.files_changed.map((f) => `- ${f}`).join('\n   ')}

## Output Format

Respond with JSON:
\`\`\`json
{
  "worktree_path": "/absolute/path/to/worktree",
  "diff_content": "git diff output...",
  "files_changed": ["path/to/file.ts"]
}
\`\`\`

Proceed with context setup now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: CONTEXT_PROMPT_V1 }
const CURRENT_VERSION = 'v1'

export const prContextStepCapability: CapabilityDefinition<ContextStepInput, ContextStepOutput> = {
  id: 'pr_context_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Context Step',
  description: 'Setup review context - create worktree, fetch diff, and analyze files',
  inputSchema: ContextStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 30,
    maxBudgetUsd: 1.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: CONTEXT_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: ContextStepInput, _context: CapabilityContext) => input,
  processResult: (
    _input: ContextStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): ContextStepOutput => {
    const FALLBACK: ContextStepOutput = { worktree_path: '', diff_content: '', files_changed: [] }

    // Strategy 1: SDK structured output
    if (aiResult.structuredOutput) {
      const validated = ContextStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }

    // Strategy 2: XML block fallback
    const xmlContent = parseXmlBlock(aiResult.content, 'context_result')
    if (xmlContent) return parseJsonSafe(xmlContent, ContextStepOutputSchema, FALLBACK)

    // Strategy 3: Regex JSON extraction fallback
    const parsed = tryParseJson<ContextStepOutput>(aiResult.content)
    return parsed ?? FALLBACK
  },
}
