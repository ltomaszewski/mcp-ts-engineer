import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseJsonSafe, parseXmlBlock, shellQuote } from '../../core/utils/index.js'
import type { RevertStepInput, RevertStepOutput } from './pr-reviewer.schema.js'
import {
  REVERT_OUTPUT_JSON_SCHEMA,
  RevertStepInputSchema,
  RevertStepOutputSchema,
} from './pr-reviewer.schema.js'

const REVERT_PROMPT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Clean up worktree and lock file after review',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as RevertStepInput
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Cleanup After Review

You are cleaning up resources after PR review.

${data.worktree_path ? `Worktree: ${data.worktree_path}` : 'No worktree to clean'}
${data.lock_file_path ? `Lock file: ${data.lock_file_path}` : 'No lock file to remove'}

## Tasks

1. **Remove worktree** (if exists):
   ${
     data.worktree_path
       ? `\`\`\`bash
   git worktree remove ${shellQuote(data.worktree_path)} --force
   \`\`\``
       : 'Skip - no worktree path provided'
   }

2. **Remove lock file** (if exists):
   ${
     data.lock_file_path
       ? `\`\`\`bash
   rm -f ${shellQuote(data.lock_file_path)}
   \`\`\``
       : 'Skip - no lock file path provided'
   }

3. **Verify cleanup**:
   - Check worktree directory is gone
   - Check lock file is gone

## Output Format

Respond with JSON:
\`\`\`json
{
  "worktree_removed": true,
  "lock_removed": true
}
\`\`\`

Begin cleanup now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: REVERT_PROMPT_V1 }
const CURRENT_VERSION = 'v1'

export const prRevertStepCapability: CapabilityDefinition<RevertStepInput, RevertStepOutput> = {
  id: 'pr_revert_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Revert Step',
  description: 'Clean up worktree and lock file after review completion or failure',
  inputSchema: RevertStepInputSchema,
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
    outputSchema: REVERT_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: RevertStepInput, _context: CapabilityContext) => input,
  processResult: (
    _input: RevertStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): RevertStepOutput => {
    const FALLBACK: RevertStepOutput = { worktree_removed: false, lock_removed: false }

    // Strategy 1: SDK structured output
    if (aiResult.structuredOutput) {
      const validated = RevertStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }

    // Strategy 2: XML block fallback
    const xmlContent = parseXmlBlock(aiResult.content, 'revert_result')
    if (xmlContent) return parseJsonSafe(xmlContent, RevertStepOutputSchema, FALLBACK)

    return FALLBACK
  },
}
