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
import { resolveGitRoot } from '../utils/git-utils.js'
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
  // When cwd points to a worktree, resolve to the main repo root so git/gh
  // commands work correctly (worktrees have a .git file, not a directory).
  const config = getProjectConfig()
  const rawCwd = defaults.cwd ?? config.monorepoRoot
  const cwd = resolveGitRoot(rawCwd)
  const additionalDirectories =
    defaults.additionalDirectories ??
    buildAdditionalDirectories(config, rawCwd, cwd)

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
 * Build additionalDirectories list.
 * Includes both the submodule (if separate from monorepo root) and the
 * original worktree path (if cwd was resolved to a different git root).
 * @internal
 */
function buildAdditionalDirectories(
  config: { submodulePath: string; monorepoRoot: string },
  rawCwd: string,
  resolvedCwd: string,
): string[] | undefined {
  const dirs: string[] = []
  if (config.submodulePath !== config.monorepoRoot) {
    dirs.push(config.submodulePath)
  }
  // When cwd was a worktree that resolved to a different root,
  // grant access to the original worktree path too
  if (rawCwd !== resolvedCwd) {
    dirs.push(rawCwd)
  }
  return dirs.length > 0 ? dirs : undefined
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
