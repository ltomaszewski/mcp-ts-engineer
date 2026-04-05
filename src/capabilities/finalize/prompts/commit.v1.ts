import { getCommitTag } from '../../../config/constants.js'
import type { PromptVersion } from '../../../core/prompt/prompt.types.js'
import { buildCommitPrompt } from '../../../shared/prompts/commit-prompt.js'

/**
 * Commit step prompt for finalize capability.
 * Commits all cleanup changes (audit fixes and codemap updates) with a descriptive message.
 */

interface CommitPromptInput {
  auditSummary: string
  codemapSummary: string
  filesAffected: string[]
  sessionId: string
  cwd?: string
}

export const commitPromptV1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-01-30',
  description: 'Commit step: commits cleanup changes with descriptive conventional commit message',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { auditSummary, codemapSummary, filesAffected, sessionId, cwd } =
      input as CommitPromptInput
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: buildCommitPrompt({
        sessionId,
        cwd,
        scope: '<scope>',
        files: filesAffected,
        outputTag: 'finalize_commit_result',
        defaultMessage: `chore(capabilities): ${getCommitTag()} finalize audit fixes and codemap updates`,
        changeContext: `Audit Summary:\n${auditSummary}\n\nCodemap Summary:\n${codemapSummary}`,
        extraRules:
          '\n- Scope should be derived from the files affected (e.g., "capabilities", "core", "docs")\n- Include a commit body with details if fixes were significant',
      }),
    }
  },
}
