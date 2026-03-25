/**
 * PR fixer main capability definition.
 * Public MCP tool that resolves pr_reviewer findings via two-tier fix strategy:
 * - Tier 1: Direct mechanical fixes (default path)
 * - Tier 2: Spec pipeline for complex architectural changes (future)
 */

import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { runFixerOrchestration } from './pr-fixer.orchestration.js'
import type { PrFixerInput, PrFixerOutput } from './pr-fixer.schema.js'
import { PR_FIXER_OUTPUT_FALLBACK, PrFixerInputSchema } from './pr-fixer.schema.js'

/**
 * Stub prompt — the real work is done by sub-capabilities via the orchestration loop.
 * This prompt exists only to satisfy the CapabilityDefinition interface.
 */
const STUB_PROMPT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-24',
  description: 'PR fixer orchestration (stub — delegates to sub-capabilities)',
  deprecated: true,
  sunsetDate: '2026-03-15',
  build: () => ({
    systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
    userPrompt: 'This capability uses orchestration. No direct AI call needed.',
  }),
}

const STUB_PROMPT_V2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-25',
  description:
    'PR fixer orchestrator v2 — reflects v2 prompts in internal step capabilities ' +
    '(classify, direct-fix, fix-validation)',
  deprecated: false,
  sunsetDate: undefined,
  build: () => ({
    systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
    userPrompt: 'This capability uses orchestration. No direct AI call needed.',
  }),
}

const PROMPT_VERSIONS: PromptRegistry = { v1: STUB_PROMPT_V1, v2: STUB_PROMPT_V2 }
const CURRENT_VERSION = 'v2'

export const prFixerCapability: CapabilityDefinition<PrFixerInput, PrFixerOutput> = {
  id: 'pr_fixer',
  type: 'tool',
  visibility: 'public',
  name: 'PR Fixer',
  description:
    'Resolves pr_reviewer findings via two-tier fix strategy. ' +
    'Tier 1: Direct mechanical fixes for simple issues. ' +
    'Tier 2: Spec pipeline for complex architectural changes. ' +
    'Posts per-issue status to PR comment.',
  inputSchema: PrFixerInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,

  defaultRequestOptions: {
    model: 'sonnet-1m',
    maxTurns: 1,
    maxBudgetUsd: 5.0,
  },

  preparePromptInput: (input: PrFixerInput, _context: CapabilityContext) => input,

  processResult: async (
    input: PrFixerInput,
    _aiResult: AIQueryResult,
    context: CapabilityContext,
  ): Promise<PrFixerOutput> => {
    try {
      return await runFixerOrchestration(input, context)
    } catch (error) {
      context.logger.error('PR fixer orchestration failed', {
        error: error instanceof Error ? error.message : String(error),
      })
      return {
        ...PR_FIXER_OUTPUT_FALLBACK,
        cost_usd: context.getSessionCost().totalCostUsd,
      }
    }
  },
}
