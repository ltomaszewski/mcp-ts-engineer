/**
 * Direct fix prompt v2 for pr_fixer.
 * Sonnet-optimized: full project context, XML-structured, architecture-aware.
 */

export function buildDirectFixPromptV2(
  issues: string,
  worktreePath: string,
  projectContext?: string,
): string {
  const contextSection = projectContext
    ? `<project_rules>
${projectContext}
</project_rules>
`
    : ''

  return `<context>
<worktree>${worktreePath}</worktree>
${contextSection}</context>

<issues>
${issues}
</issues>

<instructions>
For each issue:
1. Read the target file using its absolute path (prefixed with ${worktreePath})
2. Consult architecture patterns in <project_rules> for informed decisions
3. Apply the fix following established project conventions
4. Verify syntax correctness after each change
</instructions>

<constraints>
ALWAYS:
- Use absolute paths for all file operations
- Stay in the worktree (${worktreePath})
- Follow project architecture patterns from <project_rules>
- Track which issues were fixed and which failed

NEVER:
- Create new files unless absolutely necessary
- Refactor beyond what the issue requires
- Change working directory

STOP: After 3 consecutive failures, stop and report results.
</constraints>

<output_format>
Return JSON:
\`\`\`json
{{
  "fixes_applied": 3,
  "fixes_failed": 1,
  "issues_fixed": ["issue_id_1", "issue_id_2"],
  "issues_failed_ids": ["issue_id_3"],
  "files_changed": ["src/path/to/file.ts"]
}}
\`\`\`
</output_format>

Begin fixing now.`
}
