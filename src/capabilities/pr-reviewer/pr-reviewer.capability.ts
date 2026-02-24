/**
 * PR reviewer main orchestrator capability definition.
 * Public MCP tool that coordinates PR review workflow.
 */

import { getProjectConfig } from '../../config/project-config.js'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import { runOrchestration } from './pr-reviewer.orchestration.js'
import {
  PR_REVIEWER_OUTPUT_FALLBACK,
  type PrReviewerInput,
  PrReviewerInputSchema,
  type PrReviewerOutput,
} from './pr-reviewer.schema.js'
import { PR_REVIEWER_CURRENT_VERSION, PR_REVIEWER_PROMPT_VERSIONS } from './prompts/index.js'

/**
 * Main pr_reviewer orchestrator capability.
 * Delegates to step sub-capabilities via orchestration state machine.
 *
 * @security Uses `bypassPermissions` for autonomous operation
 */
export const prReviewerCapability: CapabilityDefinition<PrReviewerInput, PrReviewerOutput> = {
  id: 'pr_reviewer',
  type: 'tool',
  visibility: 'public',
  name: 'PR Reviewer',
  description:
    'Conducts comprehensive PR code review with multi-agent analysis. ' +
    'Always runs in review-fix mode: reviews, auto-fixes, and reports. ' +
    'Returns structured report with issue counts, fixes applied, and GitHub comment URL.',
  inputSchema: PrReviewerInputSchema,
  promptRegistry: PR_REVIEWER_PROMPT_VERSIONS,
  currentPromptVersion: PR_REVIEWER_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 80,
    maxBudgetUsd: 10.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
  },

  preparePromptInput: (input: PrReviewerInput, _context: CapabilityContext) => {
    // Extract PR number from URL if needed
    let prNumber: number
    if (input.pr.includes('github.com')) {
      const match = input.pr.match(/\/pull\/(\d+)/)
      prNumber = match ? parseInt(match[1], 10) : parseInt(input.pr, 10)
    } else {
      prNumber = parseInt(input.pr, 10)
    }

    const config = getProjectConfig()
    return {
      prNumber,
      repoOwner: config.repoOwner || '',
      repoName: config.repoName || '',
      prBranch: 'feature/branch',
      baseBranch: 'main',
      filesChanged: 0,
      mode: input.mode || 'review-fix',
      diffContent: '',
    }
  },

  processResult: async (
    input: PrReviewerInput,
    _aiResult: AIQueryResult,
    context: CapabilityContext,
  ): Promise<PrReviewerOutput> => {
    context.logger.info('Starting PR review orchestration', {
      pr: input.pr,
      mode: input.mode,
    })

    try {
      // Delegate to orchestration state machine
      const output = await runOrchestration(input, context)

      context.logger.info('PR review completed', {
        issues_found: output.issues_found,
        issues_fixed: output.issues_fixed,
        cost_usd: output.cost_usd,
      })

      return output
    } catch (error) {
      context.logger.error('PR review orchestration failed', {
        error: error instanceof Error ? error.message : String(error),
        errorName: error instanceof Error ? error.name : 'Error',
      })

      // Return fallback with session cost
      const sessionCost = context.getSessionCost()
      return {
        ...PR_REVIEWER_OUTPUT_FALLBACK,
        cost_usd: sessionCost.totalCostUsd,
      }
    }
  },
}
