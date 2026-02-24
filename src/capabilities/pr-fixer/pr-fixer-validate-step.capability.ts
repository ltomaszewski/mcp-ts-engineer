/**
 * Validate step: Run tsc + tests after direct fixes.
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
  FixerValidateStepOutputSchema,
  FIXER_VALIDATE_OUTPUT_JSON_SCHEMA,
} from './pr-fixer.schema.js'
import type { FixerValidateStepOutput } from './pr-fixer.schema.js'

const ValidateStepInputSchema = z.object({
  worktree_path: z.string(),
  files_changed: z.array(z.string()),
})

type ValidateStepInput = z.infer<typeof ValidateStepInputSchema>

const VALIDATE_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-24',
  description: 'Validate fixes via tsc and tests',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as ValidateStepInput
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Validate Fixes

Worktree: ${data.worktree_path}

## Steps

1. **Run TypeScript type check**:
\`\`\`bash
cd ${data.worktree_path} && npx tsc --noEmit 2>&1 | tail -20
\`\`\`

2. **Run tests**:
\`\`\`bash
cd ${data.worktree_path} && npm test 2>&1 | tail -30
\`\`\`

## Output

Return JSON:
\`\`\`json
{
  "tsc_passed": true,
  "tests_passed": true
}
\`\`\`

Run validation now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: VALIDATE_V1 }
const CURRENT_VERSION = 'v1'

const FALLBACK: FixerValidateStepOutput = { tsc_passed: false, tests_passed: false }

export const prFixerValidateStepCapability: CapabilityDefinition<
  ValidateStepInput,
  FixerValidateStepOutput
> = {
  id: 'pr_fixer_validate_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Fixer Validate Step',
  description: 'Validate fixes by running tsc and tests',
  inputSchema: ValidateStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 15,
    maxBudgetUsd: 0.5,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: FIXER_VALIDATE_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: ValidateStepInput) => input,
  processResult: (
    _input: ValidateStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): FixerValidateStepOutput => {
    if (aiResult.structuredOutput) {
      const validated = FixerValidateStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }
    return parseJsonSafe(aiResult.content, FixerValidateStepOutputSchema, FALLBACK)
  },
}
