/**
 * Echo agent prompt version 1.
 * Claude Code agent with full tool access and system prompt.
 */

import type { PromptVersion } from '../../../core/prompt/prompt.types.js'

/** Version 1: Claude Code agent - full tools and system prompt */
export const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-01-27',
  description: 'Claude Code agent with full tool access',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { prompt } = input as { prompt: string }
    return {
      systemPrompt: { type: 'preset', preset: 'claude_code' },
      userPrompt: prompt,
    }
  },
}
