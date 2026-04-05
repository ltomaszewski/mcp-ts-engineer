/**
 * Commit prompt for audit-fix capability.
 * Instructs agent to stage and commit files changed during audit-fix
 * for a specific project with conventional commit format.
 */

import { getCommitTag } from '../../../config/constants.js'
import type { PromptVersion } from '../../../core/prompt/prompt.types.js'
import { buildCommitPrompt } from '../../../shared/prompts/commit-prompt.js'

interface CommitPromptInput {
  projectPath: string
  filesChanged: string[]
  auditSummary: string
  sessionId: string
  cwd?: string
}

export const commitPromptV1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-01',
  description: 'Commit step: commits audit-fix changes with conventional commit message',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { projectPath, filesChanged, auditSummary, sessionId, cwd } = input as CommitPromptInput
    const scope = projectPath.split('/').pop() || projectPath

    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: buildCommitPrompt({
        sessionId,
        cwd,
        scope,
        files: filesChanged,
        defaultMessage: `chore(${scope}): ${getCommitTag()} auto-fix audit violations`,
        changeContext: `Project: ${projectPath}\n\nAudit Summary:\n${auditSummary}`,
        extraRules:
          '\n- Only commit files related to audit fixes, not unrelated changes',
      }),
    }
  },
}
