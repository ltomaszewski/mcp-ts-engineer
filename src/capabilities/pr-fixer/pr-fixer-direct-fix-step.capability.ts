/**
 * Direct fix step: Apply mechanical fixes per-issue in the worktree.
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
  DirectFixStepOutputSchema,
  DIRECT_FIX_OUTPUT_JSON_SCHEMA,
} from './pr-fixer.schema.js'
import type { DirectFixStepOutput } from './pr-fixer.schema.js'
import { DIRECT_FIX_PROMPT_V1 } from './prompts/direct-fix.v1.js'

const DirectFixStepInputSchema = z.object({
  issues_summary: z.string(),
  worktree_path: z.string(),
})

type DirectFixStepInput = z.infer<typeof DirectFixStepInputSchema>

const DIRECT_FIX_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-24',
  description: 'Apply direct mechanical fixes',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as DirectFixStepInput
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: DIRECT_FIX_PROMPT_V1
        .replace(/{worktree_path}/g, data.worktree_path)
        .replace('{issues}', data.issues_summary),
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: DIRECT_FIX_V1 }
const CURRENT_VERSION = 'v1'

const FALLBACK: DirectFixStepOutput = {
  fixes_applied: 0,
  fixes_failed: 0,
  issues_fixed: [],
  issues_failed_ids: [],
  files_changed: [],
}

export const prFixerDirectFixStepCapability: CapabilityDefinition<
  DirectFixStepInput,
  DirectFixStepOutput
> = {
  id: 'pr_fixer_direct_fix_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Fixer Direct Fix Step',
  description: 'Apply direct mechanical fixes to review issues',
  inputSchema: DirectFixStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 50,
    maxBudgetUsd: 2.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: DIRECT_FIX_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: DirectFixStepInput) => input,
  processResult: (
    _input: DirectFixStepInput,
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
