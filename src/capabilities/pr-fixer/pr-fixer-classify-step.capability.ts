/**
 * Classify step: Categorize review issues as direct/spec-required/skip.
 */

import { z } from 'zod'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseJsonSafe } from '../../core/utils/index.js'
import type { ClassifyStepOutput } from './pr-fixer.schema.js'
import { CLASSIFY_OUTPUT_JSON_SCHEMA, ClassifyStepOutputSchema } from './pr-fixer.schema.js'
import { CLASSIFY_PROMPT_V1 } from './prompts/classify.v1.js'

const ClassifyStepInputSchema = z.object({
  issues_summary: z.string(),
  issue_ids: z.array(z.string()),
})

type ClassifyStepInput = z.infer<typeof ClassifyStepInputSchema>

const CLASSIFY_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-24',
  description: 'Issue classification for direct vs spec-required fixes',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as ClassifyStepInput
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: CLASSIFY_PROMPT_V1.replace('{issues}', data.issues_summary),
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: CLASSIFY_V1 }
const CURRENT_VERSION = 'v1'

const FALLBACK: ClassifyStepOutput = { classifications: [] }

export const prFixerClassifyStepCapability: CapabilityDefinition<
  ClassifyStepInput,
  ClassifyStepOutput
> = {
  id: 'pr_fixer_classify_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Fixer Classify Step',
  description: 'Classify review issues as direct-fixable, spec-required, or skip',
  inputSchema: ClassifyStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 5,
    maxBudgetUsd: 0.2,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: CLASSIFY_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: ClassifyStepInput) => input,
  processResult: (
    _input: ClassifyStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): ClassifyStepOutput => {
    if (aiResult.structuredOutput) {
      const validated = ClassifyStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }
    return parseJsonSafe(aiResult.content, ClassifyStepOutputSchema, FALLBACK)
  },
}
