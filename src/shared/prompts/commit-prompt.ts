/**
 * Shared commit prompt builder.
 *
 * Provides common commit instructions (conventional commits, Session-Id trailer,
 * commit_result XML output) used by audit-fix, todo-code-writer, finalize, and
 * todo-reviewer capabilities.
 */

import { getCommitTag } from '../../config/constants.js'

/** Parameters for building a commit prompt. */
export interface CommitPromptParams {
  /** Session ID for the trailer */
  sessionId: string
  /** Working directory context (optional) */
  cwd?: string
  /** Scope for the commit message (e.g., project name, "docs", "capabilities") */
  scope: string
  /** Description of what changed — inserted into the user prompt body */
  changeContext: string
  /** List of files changed/affected */
  files: string[]
  /** XML tag name for the output block (default: "commit_result") */
  outputTag?: string
  /** Default commit message template (e.g., "chore(<scope>): tag auto-fix audit violations") */
  defaultMessage?: string
  /** Extra instructions appended after the standard ones */
  extraInstructions?: string
  /** Extra rules appended after the standard rules */
  extraRules?: string
}

/**
 * Builds the common commit rules block shared across all commit prompts.
 */
export function buildCommitRules(params: CommitPromptParams): string {
  const tag = getCommitTag()
  const outputTag = params.outputTag ?? 'commit_result'

  return `Commit message guidelines:
- Use conventional commits format: "type(${params.scope}): ${tag} description"
- Keep the subject line under 72 characters
- Include body with bullet points if multiple types of changes
${params.defaultMessage ? `- Example: "${params.defaultMessage}"` : ''}
- After the commit body, add a blank line followed by: Session-Id: ${params.sessionId}

Git trailer format:
- Add a blank line after the commit body
- Add the Session-Id trailer: Session-Id: ${params.sessionId}
- This trailer enables tracing commits back to their cost report session
${params.extraRules ?? ''}
Output your results in this format:

<${outputTag}>
{
  "committed": <boolean>,
  "commit_sha": "<sha or null>",
  "commit_message": "<message or null>",
  "files_changed": ["file1.ts", "file2.ts"]
}
</${outputTag}>`
}

/**
 * Builds a standard commit user prompt with common structure.
 *
 * Structure:
 * 1. Role declaration + cwd context
 * 2. Change context (caller-specific)
 * 3. Files list
 * 4. Standard git workflow (status, stage, commit, extract SHA)
 * 5. Commit rules + output format
 */
export function buildCommitPrompt(params: CommitPromptParams): string {
  const cwdContext = params.cwd ? `Working directory: ${params.cwd}\n\n` : ''
  const filesList = params.files.map((f) => `  - ${f}`).join('\n')
  const rules = buildCommitRules(params)

  return `You are the Commit Agent.

${cwdContext}${params.changeContext}

Files changed:
${filesList}

Your responsibilities:
1. Check git status to see what changes exist:
   - Run: git status
   - Identify modified, added, or deleted files

2. If changes exist, stage and commit them:
   - Stage relevant changes: git add <files>
   - Create a commit message following the guidelines below

3. If no changes exist:
   - Don't create an empty commit
   - Report that no commit was needed

4. Extract commit information:
   - Get commit SHA: git rev-parse HEAD
   - Record the commit message used
${params.extraInstructions ?? ''}

${rules}${params.cwd ? `\n\nIMPORTANT: Run all git commands from the working directory: ${params.cwd}\nUse \`cd ${params.cwd}\` before any git operations to ensure changes are committed in the correct repository.` : ''}`
}
