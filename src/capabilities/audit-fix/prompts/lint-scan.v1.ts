/**
 * Lint scan prompt version v1.
 * Instructs agent to detect and run npm run lint in project.
 */

import type { PromptVersion } from '../../../core/prompt/prompt.types.js'
import { shellQuote } from '../../../core/utils/shell-safe.js'
import { cwdPath, resolveCwd } from '../../../core/utils/cwd.js'

interface LintScanPromptInput {
  projectPath: string
  cwd?: string
}

/**
 * Lint scan prompt: detect and run npm run lint in project.
 *
 * Checks package.json for lint scripts (lint, check, eslint),
 * executes the script if available, and parses output to extract
 * error/warning counts and file paths with errors.
 */
const lintScanPromptV1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-04',
  description: 'Lint scan: detect and run npm run lint in project',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { projectPath, cwd } = input as LintScanPromptInput
    const rootPath = resolveCwd(cwd)

    const userPrompt = `You are executing a lint scan for a code quality audit.

<project_path>${projectPath}</project_path>
${cwd ? `<cwd>${cwd}</cwd>` : ''}

<workflow>
1. Read the project's package.json file (located in project root)

2. Check if any of these lint scripts exist in \`scripts\`:
   - \`lint\` (most common)
   - \`check\` (biome projects)
   - \`eslint\` (explicit eslint)

3. If NO lint script exists:
   - Return \`lint_available: false\` immediately
   - Skip steps 4-6

4. If a lint script exists, execute:
   \`\`\`bash
   cd ${shellQuote(cwdPath(rootPath, projectPath))} && npm run lint 2>&1
   \`\`\`

5. Parse the lint output to identify:
   - Error count (lines with "error" or severity markers)
   - Warning count (lines with "warning" or severity markers)
   - Files with errors (extract file paths from output)

6. Return the structured result
</workflow>

<output_format>
Return your findings in this JSON format wrapped in XML tags:

<lint_scan_result>
{
  "lint_available": true,
  "lint_passed": false,
  "error_count": 5,
  "warning_count": 3,
  "lint_report": "Full lint output here...",
  "files_with_lint_errors": [
    "src/file1.ts",
    "src/file2.ts"
  ]
}
</lint_scan_result>

If no lint script is available:
<lint_scan_result>
{
  "lint_available": false,
  "lint_passed": true,
  "error_count": 0,
  "warning_count": 0,
  "lint_report": "",
  "files_with_lint_errors": []
}
</lint_scan_result>
</output_format>

<rules>
- ALWAYS check package.json before running any commands
- Capture BOTH stdout and stderr from lint command
- Extract file paths from lint output (they usually appear at the start of error lines)
- If lint command fails to run (not found, etc.), set lint_available: false
- Include the FULL lint output in lint_report for debugging
- Set lint_passed: true only when error_count is 0
</rules>`

    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
        append:
          'REMINDER: After completing the lint scan, you MUST output <lint_scan_result>{...}</lint_scan_result> with your findings.',
      },
      userPrompt,
    }
  },
}

export { lintScanPromptV1 }
