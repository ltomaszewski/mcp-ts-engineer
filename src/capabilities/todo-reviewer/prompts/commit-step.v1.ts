/**
 * Commit step prompt version 1 (Session 3 — Auto-Commit).
 * Conditional git commit of spec changes with both summaries as context.
 *
 * Agnostic — works for any spec file in the monorepo.
 *
 * Runs on Haiku — optimized for concise, action-oriented execution.
 * No custom system prompt (relies on claude_code preset for tools).
 * All instructions in user prompt.
 */

import { getCommitTag } from '../../../config/constants.js'
import type { PromptVersion } from '../../../core/prompt/prompt.types.js'
import type { ReviewSummary, TddSummary } from '../todo-reviewer.schema.js'

/** Input shape for the commit step prompt build function. */
interface CommitPromptInput {
  specPath: string
  reviewSummary: ReviewSummary
  tddSummary: TddSummary
  sessionId: string
  cwd?: string
}

const COMMIT_USER_PROMPT_TEMPLATE = (
  specPath: string,
  reviewSummary: ReviewSummary,
  tddSummary: TddSummary,
  sessionId: string,
): string => {
  return `You are a git operations assistant. Check if the spec file has uncommitted changes. If yes, stage and commit. If no changes, report no-op.

<spec_path>${specPath}</spec_path>

<context>
- Review status: ${reviewSummary.status}
- TDD status: ${tddSummary.status}
- Corrections applied: ${reviewSummary.corrections_applied}
- Blockers remaining: ${reviewSummary.blockers_remaining}
- Consistency score: ${reviewSummary.consistency_score}
</context>

<instructions>
1. Run \`git diff\` on the spec file at <spec_path>
2. If no changes exist → output no-op result
3. If changes exist:
   a. Stage the spec file: \`git add <spec_path>\`
   b. Check for other modified spec-related files and stage them too
   c. Commit with message format: \`chore(docs): ${getCommitTag()} {brief description}\`
   d. Get the commit SHA from git output
4. Output the <commit_result> XML block
</instructions>

<rules>
- Only commit the spec file and directly related files
- Use the exact commit message format specified
- After the commit message body, add a blank line followed by: Session-Id: ${sessionId}
- This trailer enables tracing commits back to their cost report session
- Do NOT commit unrelated changes
- Do NOT amend existing commits
- Do NOT push to remote
- Do NOT call AskUserQuestion, slash commands, or reference .claude/commands/ files
</rules>

<output_format>
Output a <commit_result> XML block with this JSON:

| Field | Type | Description |
|-------|------|-------------|
| committed | boolean | Whether a commit was created |
| commit_sha | string or null | Git SHA if committed |
| commit_message | string or null | Message if committed |
| files_changed | string[] | List of committed files (empty if no commit) |

<example>
<commit_result>
{"committed":true,"commit_sha":"abc1234","commit_message":"chore(docs): ${getCommitTag()} update feature spec after review\n\nSession-Id: a9ade0318c43c8803a91cf591782e0c6","files_changed":["docs/specs/app/feature.md"]}
</commit_result>
</example>
</output_format>`
}

/** Version 1: Agnostic conditional git commit with CommitResult output */
export const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-01-29',
  description: 'Agnostic conditional git commit of spec changes',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { specPath, reviewSummary, tddSummary, sessionId } = input as CommitPromptInput
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: COMMIT_USER_PROMPT_TEMPLATE(specPath, reviewSummary, tddSummary, sessionId),
    }
  },
}
