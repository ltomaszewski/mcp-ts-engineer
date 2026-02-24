/**
 * AI Request validation and merging — extracted from invocation-handler.
 * Validates and merges capability options with server constraints.
 *
 * Applies ProjectConfig-based defaults for cwd and additionalDirectories,
 * so agents spawn with the monorepo root as cwd (where .claude/codemaps/,
 * workspaces, and git live) and the submodule as an additional directory.
 */

import {
  MAX_PROMPT_LENGTH,
  MAX_QUERY_BUDGET_USD,
  MAX_SYSTEM_PROMPT_LENGTH,
  MAX_TIMEOUT_MS,
  MAX_TURNS,
} from '../../config/constants.js'
import { getProjectConfig } from '../../config/project-config.js'
import type { AIQueryRequest } from '../ai-provider/ai-provider.types.js'
import { ValidationError } from '../errors.js'
import type { SystemPromptValue } from '../prompt/prompt.types.js'
import type { CapabilityDefinition } from './capability-registry.types.js'

/**
 * Merge capability default options with server-level validation.
 * Applies ProjectConfig defaults for cwd (monorepo root) and additionalDirectories.
 */
export function mergeAndValidateAIQueryRequest(
  capability: CapabilityDefinition,
  builtPrompt: { systemPrompt?: SystemPromptValue; userPrompt: string },
  validatedInput?: unknown,
): AIQueryRequest {
  const inputOverrides = extractRequestFields(validatedInput)
  const defaults = { ...capability.defaultRequestOptions, ...inputOverrides }

  const maxTurns = Math.min(defaults.maxTurns || MAX_TURNS, MAX_TURNS)
  const maxBudgetUsd = Math.min(defaults.maxBudgetUsd || MAX_QUERY_BUDGET_USD, MAX_QUERY_BUDGET_USD)
  const timeout = Math.min(defaults.timeout || MAX_TIMEOUT_MS, MAX_TIMEOUT_MS)

  if (builtPrompt.userPrompt.length > MAX_PROMPT_LENGTH) {
    throw new ValidationError(
      `User prompt exceeds maximum length: ${builtPrompt.userPrompt.length} > ${MAX_PROMPT_LENGTH}`,
    )
  }

  if (
    builtPrompt.systemPrompt &&
    typeof builtPrompt.systemPrompt === 'string' &&
    builtPrompt.systemPrompt.length > MAX_SYSTEM_PROMPT_LENGTH
  ) {
    throw new ValidationError(
      `System prompt exceeds maximum length: ${builtPrompt.systemPrompt.length} > ${MAX_SYSTEM_PROMPT_LENGTH}`,
    )
  }

  // Apply ProjectConfig defaults for cwd and additionalDirectories.
  // Default cwd to monorepoRoot so agents operate where .claude/codemaps/,
  // workspaces, and git live. When the submodule is separate, grant access to it.
  const config = getProjectConfig()
  const cwd = defaults.cwd ?? config.monorepoRoot
  const additionalDirectories =
    defaults.additionalDirectories ??
    (config.submodulePath !== config.monorepoRoot ? [config.submodulePath] : undefined)

  return {
    prompt: builtPrompt.userPrompt,
    systemPrompt: builtPrompt.systemPrompt,
    appendSystemPrompt: defaults.appendSystemPrompt,
    model: defaults.model,
    maxTurns,
    maxBudgetUsd,
    timeout,
    permissionMode: defaults.permissionMode,
    mcpServers: defaults.mcpServers,
    tools: defaults.tools,
    allowedAgentTools: defaults.allowedAgentTools,
    disallowedAgentTools: defaults.disallowedAgentTools,
    customAgentTools: defaults.customAgentTools,
    cwd,
    additionalDirectories,
    allowDangerouslySkipPermissions: defaults.allowDangerouslySkipPermissions,
    outputSchema: defaults.outputSchema,
    settingSources: defaults.settingSources,
  }
}

/**
 * Extract AI request fields from validated input.
 * @internal
 */
export function extractRequestFields(input: unknown): Partial<AIQueryRequest> {
  if (!input || typeof input !== 'object') return {}
  const obj = input as Record<string, unknown>
  const overrides: Partial<AIQueryRequest> = {}
  if (obj.model !== undefined) overrides.model = obj.model as AIQueryRequest['model']
  if (typeof obj.cwd === 'string') overrides.cwd = obj.cwd
  return overrides
}
