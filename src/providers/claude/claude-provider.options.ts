/**
 * Options mapping for Claude Provider.
 * Extracted from claude.provider.ts to keep files under 300 lines.
 */

import type { AIQueryRequest } from '../../core/ai-provider/ai-provider.types.js'

/**
 * Map AIQueryRequest to SDK options Record.
 */
export function mapRequestToOptions(
  request: AIQueryRequest,
  cliPath: string,
): Record<string, unknown> {
  const options: Record<string, unknown> = {
    pathToClaudeCodeExecutable: cliPath,
  }

  if (request.systemPrompt) {
    options.systemPrompt = request.systemPrompt
  }

  // Compose appendSystemPrompt
  const appendParts: string[] = []
  if (
    request.systemPrompt &&
    typeof request.systemPrompt === 'object' &&
    'append' in request.systemPrompt &&
    request.systemPrompt.append
  ) {
    appendParts.push(request.systemPrompt.append)
  }
  if (request.appendSystemPrompt) {
    appendParts.push(request.appendSystemPrompt)
  }
  if (appendParts.length > 0) {
    options.appendSystemPrompt = appendParts.join('\n\n')
  }

  if (request.model) options.model = request.model
  if (request.fallbackModel) options.fallbackModel = request.fallbackModel
  if (request.maxThinkingTokens) options.maxThinkingTokens = request.maxThinkingTokens

  // Tool configuration
  if (request.tools) {
    if (!Array.isArray(request.tools) && request.tools.type === 'preset') {
      options.tools = { type: 'preset', preset: request.tools.preset }
      if (request.tools.customTools && request.tools.customTools.length > 0) {
        options.tools = request.tools.customTools
      }
      if (request.tools.allowedTools) options.allowedTools = request.tools.allowedTools
      if (request.tools.disallowedTools) options.disallowedTools = request.tools.disallowedTools
    } else {
      options.tools = request.tools
    }
  }
  if (request.allowedAgentTools) options.allowedTools = request.allowedAgentTools
  if (request.disallowedAgentTools) options.disallowedTools = request.disallowedAgentTools
  if (request.customAgentTools) options.tools = request.customAgentTools

  if (request.allowDangerouslySkipPermissions)
    options.allowDangerouslySkipPermissions = request.allowDangerouslySkipPermissions

  if (request.maxTurns) options.maxTurns = request.maxTurns
  if (request.maxBudgetUsd) options.maxBudgetUsd = request.maxBudgetUsd
  if (request.timeout) options.timeout = request.timeout
  if (request.permissionMode) options.permissionMode = request.permissionMode
  if (request.cwd) options.cwd = request.cwd
  if (request.additionalDirectories) options.additionalDirectories = request.additionalDirectories
  if (request.settingSources) options.settingSources = request.settingSources
  if (request.mcpServers) options.mcpServers = request.mcpServers
  if (request.hooks) options.hooks = request.hooks
  if (request.subagents) options.agents = request.subagents
  if (request.sandbox) options.sandbox = request.sandbox
  if (request.resumeSessionId) options.resume = request.resumeSessionId
  if (request.outputSchema) options.outputFormat = request.outputSchema

  if (request.signal) {
    const controller = new AbortController()
    request.signal.addEventListener('abort', () => controller.abort())
    options.abortController = controller
  }

  return options
}
