/**
 * Commit prompt version 1.
 * Creates a commit with a message derived from phase summaries and spec context.
 *
 * Uses claude_code preset for full tool access to run git commands.
 */

import { getCommitTag } from '../../../config/constants.js'
import type { PromptVersion } from '../../../core/prompt/prompt.types.js'

/** Input shape for the commit prompt build function. */
interface CommitPromptInput {
  specPath: string
  filesChanged: string[]
  phaseSummaries: string[]
  finalAuditSummary: string
  sessionId: string
  cwd?: string
  partialRun?: boolean
  failureContext?: string
}

/**
 * System prompt append with committer identity and task.
 */
const COMMIT_SYSTEM_APPEND = `<committer_instructions>
You are responsible for committing implementation changes. Your task is to:

1. Analyze the changes made across all phases
2. Create a descriptive commit message following project conventions
3. Commit all changes in a single atomic commit

Output your result in a <commit_result> XML block containing JSON:
{
  "committed": true or false,
  "commit_sha": "git SHA" or null,
  "commit_message": "the message" or null,
  "files_changed": ["array", "of", "paths"]
}

Commit message format:
- First line: Short summary (50-70 chars) in imperative mood
- Blank line
- Body: Explain what was implemented and why (wrap at 72 chars)
- Reference spec if helpful
- Blank line
- Trailer: Session-Id: {sessionId}

Git trailer format:
- After the commit body, add a blank line followed by: Session-Id: {sessionId}
- This trailer enables tracing commits back to their cost report session

If the input indicates a partial/incomplete run, the commit message MUST start with '[INCOMPLETE]' prefix and include 'Needs investigation' in the body.

Example (normal):
feat(mcp): ${getCommitTag()} add todo code writer capability

Implements autonomous spec implementation through phased execution.
Each phase gets dedicated engineering and audit sessions with a final
repository-wide audit before committing all changes atomically.

Session-Id: a9ade0318c43c8803a91cf591782e0c6

Example (incomplete):
[INCOMPLETE] feat(mcp): ${getCommitTag()} add todo code writer capability

Implements autonomous spec implementation through phased execution.
Execution stopped at phase 2 due to build errors.
Needs investigation before proceeding.

Session-Id: a9ade0318c43c8803a91cf591782e0c6
</committer_instructions>`

const COMMIT_USER_PROMPT_TEMPLATE = (
  specPath: string,
  filesChanged: string[],
  phaseSummaries: string[],
  finalAuditSummary: string,
  sessionId: string,
  partialRun?: boolean,
  failureContext?: string,
): string => {
  const partialRunBlock = partialRun
    ? `\n<partial_run>
IMPORTANT: This is an INCOMPLETE run. Not all phases completed successfully.
Failure: ${failureContext ?? 'Unknown'}
The commit message MUST start with "[INCOMPLETE]" prefix.
</partial_run>\n`
    : ''

  return `Create a commit for all implementation changes.

<spec_path>${specPath}</spec_path>
<files_changed>${JSON.stringify(filesChanged, null, 2)}</files_changed>
<phase_summaries>${JSON.stringify(phaseSummaries, null, 2)}</phase_summaries>
<final_audit_summary>${finalAuditSummary}</final_audit_summary>
<session_id>${sessionId}</session_id>${partialRunBlock}

<instructions>
Execute these steps:

1. Read the spec at <spec_path> to understand what was implemented

2. Review the phase summaries to understand the work done:
${phaseSummaries.map((s, i) => `   Phase ${i + 1}: ${s}`).join('\n')}

3. Create a commit message:
   - First line: Short summary following conventional commits format
   - Body: Explain what was implemented based on spec and phase summaries
   - Keep it concise but descriptive

4. Commit all changes:
   - Stage all files in <files_changed>
   - Create commit with the crafted message
   - Output the commit SHA and details

5. Output the commit result in <commit_result>JSON</commit_result> format:

<commit_result>
{
  "committed": true,
  "commit_sha": "abc123...",
  "commit_message": "The commit message you created",
  "files_changed": ["array", "of", "committed", "files"]
}
</commit_result>
</instructions>

<rules>
- Follow conventional commits format: type(scope): ${getCommitTag()} description
- Common types: feat, fix, refactor, test, docs, chore
- Include ${getCommitTag()} tag after the scope in subject line
- Keep first line under 70 characters
- Include context in body based on phase summaries
- Commit ALL files in <files_changed> in a single atomic commit
- Only mark committed=true if git commit succeeds
</rules>`
}

/**
 * Commit prompt v1.
 */
export const commitPromptV1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-01-30',
  description: 'Initial commit prompt for todo-code-writer capability',
  deprecated: false,
  build: (
    input: unknown,
  ): {
    systemPrompt: { type: 'preset'; preset: 'claude_code'; append: string }
    userPrompt: string
  } => {
    const typedInput = input as CommitPromptInput
    return {
      systemPrompt: {
        type: 'preset',
        preset: 'claude_code',
        append: COMMIT_SYSTEM_APPEND,
      },
      userPrompt: COMMIT_USER_PROMPT_TEMPLATE(
        typedInput.specPath,
        typedInput.filesChanged,
        typedInput.phaseSummaries,
        typedInput.finalAuditSummary,
        typedInput.sessionId,
        typedInput.partialRun,
        typedInput.failureContext,
      ),
    }
  },
}
