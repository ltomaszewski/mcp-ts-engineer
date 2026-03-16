/**
 * Lint fix prompt v1 - dedicated eng session to fix ONLY lint issues.
 * Receives lint report and files with errors, applies minimal fixes.
 * Created: 2026-02-04
 */

import type { PromptVersion } from '../../../core/prompt/prompt.types.js'
import { buildReviewContext } from '../../../shared/prompts/review-context.js'

interface LintFixPromptInput {
  projectPath: string
  lintReport: string
  filesWithLintErrors: string[]
  cwd?: string
}

const lintFixPromptV1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-04',
  description: 'Lint fix: dedicated eng session to fix ONLY lint issues',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { projectPath, lintReport, filesWithLintErrors, cwd } = input as LintFixPromptInput

    const userPrompt = `You are fixing lint errors in a code quality audit.

<project_path>${projectPath}</project_path>
${cwd ? `<cwd>${cwd}</cwd>` : ''}

<lint_report>
${lintReport}
</lint_report>

<files_with_lint_errors>
${filesWithLintErrors.join('\n')}
</files_with_lint_errors>

<task>
Fix ONLY the lint errors shown in the lint report above.

CRITICAL CONSTRAINTS:
- Do NOT fix TypeScript errors (unless they are also lint errors)
- Do NOT refactor code beyond what is needed to fix lint issues
- Do NOT add new features or change behavior
- Focus ONLY on the files listed in files_with_lint_errors

Common lint fixes:
- Remove unused imports
- Fix formatting issues (spacing, indentation)
- Add missing semicolons or remove extra ones
- Fix variable naming conventions
- Remove console.log statements
- Fix accessibility issues (aria labels, alt text)
</task>

<workflow>
1. Read each file in files_with_lint_errors
2. Identify the specific lint violations from the lint report
3. Apply minimal fixes to resolve lint errors
4. Verify fixes by running \`npm run lint\` again (optional)
5. Return the list of files you modified
</workflow>

<output_format>
Return your findings in this JSON format wrapped in XML tags:

<lint_fix_result>
{
  "status": "success",
  "files_modified": [
    "src/file1.ts",
    "src/file2.ts"
  ],
  "summary": "Fixed 5 lint errors: removed unused imports, fixed formatting"
}
</lint_fix_result>

If you could not fix the issues:
<lint_fix_result>
{
  "status": "failed",
  "files_modified": [],
  "summary": "Unable to fix lint errors: <reason>"
}
</lint_fix_result>
</output_format>

<rules>
- ONLY modify files listed in files_with_lint_errors
- Keep changes minimal — fix lint issues, nothing more
- Do NOT introduce new lint violations
- If unsure about a fix, skip it and note it in the summary${cwd ? `\n- WORKING DIRECTORY: All file operations must use absolute paths rooted at \`${cwd}\`` : ''}
</rules>`

    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
        append:
          'REMINDER: After fixing lint errors, you MUST output <lint_fix_result>{...}</lint_fix_result> with your findings.\n\n' +
          buildReviewContext(),
      },
      userPrompt,
    }
  },
}

export { lintFixPromptV1 }
