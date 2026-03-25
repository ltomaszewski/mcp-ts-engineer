/**
 * Fix validation step: Fix tsc/test/lint failures introduced by direct fixes.
 * Reuses DirectFixStepOutput schema since the output shape is identical.
 */

import { z } from 'zod'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { isValidPath, parseJsonSafe } from '../../core/utils/index.js'
import type { DirectFixStepOutput } from './pr-fixer.schema.js'
import { DIRECT_FIX_OUTPUT_JSON_SCHEMA, DirectFixStepOutputSchema } from './pr-fixer.schema.js'
import { buildFixValidationPromptV2 } from './prompts/fix-validation.v2.js'

const FixValidationStepInputSchema = z.object({
  worktree_path: z.string().refine(isValidPath, { message: 'Invalid path' }),
  error_summary: z.string(),
  files_changed: z.array(z.string()),
  project_context: z.string().optional(),
  cwd: z.string().optional(),
})

type FixValidationStepInput = z.infer<typeof FixValidationStepInputSchema>

const FIX_VALIDATION_V2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-24',
  description: 'Sonnet-optimized validation fix with XML tags and project context',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as FixValidationStepInput
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: buildFixValidationPromptV2(
        data.worktree_path,
        data.error_summary,
        data.files_changed,
        data.project_context,
      ),
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v2: FIX_VALIDATION_V2 }
const CURRENT_VERSION = 'v2'

const FALLBACK: DirectFixStepOutput = {
  fixes_applied: 0,
  fixes_failed: 0,
  issues_fixed: [],
  issues_failed_ids: [],
  files_changed: [],
}

export const prFixerFixValidationStepCapability: CapabilityDefinition<
  FixValidationStepInput,
  DirectFixStepOutput
> = {
  id: 'pr_fixer_fix_validation_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Fixer Fix Validation Step',
  description: 'Fix tsc/test/lint failures introduced by direct fixes',
  inputSchema: FixValidationStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet[1m]',
    maxTurns: 50,
    maxBudgetUsd: 2.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: DIRECT_FIX_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: FixValidationStepInput) => input,
  processResult: (
    _input: FixValidationStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): DirectFixStepOutput => {
    if (aiResult.structuredOutput) {
      const validated = DirectFixStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }
    return parseJsonSafe(aiResult.content, DirectFixStepOutputSchema, FALLBACK)
  },
}
