/**
 * PR reviewer main prompt template.
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const v2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-25',
  description:
    'PR reviewer orchestrator v2 — reflects v2 prompts in internal step capabilities ' +
    '(review-step, classify, direct-fix, fix-validation)',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    // Stub prompt — orchestration delegates to step sub-capabilities
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: 'This capability uses orchestration. No direct AI call needed.',
    }
  },
}

export const PR_REVIEWER_PROMPT_VERSIONS: PromptRegistry = {
  v2,
}

export const PR_REVIEWER_CURRENT_VERSION = 'v2'
