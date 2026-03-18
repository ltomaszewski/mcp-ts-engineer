/**
 * Fix validation prompt v2 for pr_fixer.
 * Sonnet-optimized: XML-structured, project-context-aware.
 */

import { buildTestCommand } from '../../../shared/test-command.js'

export function buildFixValidationPromptV2(
  worktreePath: string,
  errorSummary: string,
  filesChanged: string[],
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

<validation_errors>
${errorSummary}
</validation_errors>

<files_changed>
${filesChanged.map((f) => `- ${f}`).join('\n')}
</files_changed>

<instructions>
Your previous code fixes introduced validation failures (tsc errors, test failures, or lint issues).
Fix these errors while preserving the intent of the original fixes.

1. Work in the worktree (${worktreePath})
2. Analyze the errors to understand what broke
3. Fix each error:
   - tsc errors: fix type mismatches, missing imports, incorrect signatures
   - Test failures: update tests to match new behavior, OR fix code if the test was correct
   - Lint errors: run the project linter with auto-fix (e.g. \`npx biome check --write\`)
4. Verify fixes:
   - Run tests ONCE per workspace (NEVER re-run, NEVER parse stdout text): detect runner from devDependencies ("jest"/"jest-expo" → Jest, "vitest" → Vitest), then:
     Jest: \`cd <workspace> && ${buildTestCommand('jest')}\`
     Vitest: \`cd <workspace> && ${buildTestCommand('vitest')}\`
   - Run \`npx tsc --noEmit -p <workspace>/tsconfig.json\` to confirm types pass
5. Track all files you modified
</instructions>

<constraints>
ALWAYS:
- Use absolute paths for all file operations
- Stay in the worktree (${worktreePath})
- Preserve the intent of the original fixes

NEVER:
- Revert the original fixes — fix the validation errors instead
- Create new files unless absolutely necessary
- Refactor beyond what is needed to fix errors

If a test expectation conflicts with the new code behavior, update the TEST (the code fix was intentional).
</constraints>

<output_format>
Return JSON:
\`\`\`json
{{
  "fixes_applied": 2,
  "fixes_failed": 0,
  "issues_fixed": [],
  "issues_failed_ids": [],
  "files_changed": ["src/path/to/file.ts", "src/path/to/test.ts"]
}}
\`\`\`
</output_format>

Begin fixing validation errors now.`
}
