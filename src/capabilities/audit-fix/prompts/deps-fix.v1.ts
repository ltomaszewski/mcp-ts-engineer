/**
 * Deps fix prompt version v1.
 * Instructs agent to run npm audit fix and track modified files.
 * Supports npm workspaces (monorepos) by using --workspace flag.
 */

import type { PromptVersion } from '../../../core/prompt/prompt.types.js'

interface DepsFixPromptInput {
  projectPath: string
  vulnerabilitiesFound: number
  cwd?: string
}

/**
 * Deps fix prompt: run npm audit fix and track modified files using git status.
 *
 * Executes npm audit fix (with --workspace for monorepos), tracks file modifications,
 * and runs post-verification audit to calculate fixed vs remaining vulnerabilities.
 */
const depsFixPromptV1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-04',
  description: 'Deps fix step: npm audit fix with file tracking',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { projectPath, vulnerabilitiesFound, cwd } = input as DepsFixPromptInput
    const rootPath = cwd || '.'

    const userPrompt = `You are executing a dependency security fix for a code quality audit.

<project_path>${projectPath}</project_path>
<vulnerabilities_found>${vulnerabilitiesFound}</vulnerabilities_found>
${cwd ? `<cwd>${cwd}</cwd>` : ''}

<workflow>
1. Determine if this is a monorepo workspace or standalone project:
   - Check if package-lock.json exists at root: ${rootPath}/package-lock.json
   - If yes → Mode A (Monorepo/Workspace)
   - If no → Mode B (Standalone project)

2. Capture baseline file state using git status:
   \`\`\`bash
   git status --short package.json package-lock.json ${projectPath}/package.json 2>&1
   \`\`\`
   This shows the state before npm audit fix runs.

3. Run npm audit fix to remediate vulnerabilities:

   **Mode A - Monorepo/Workspace** (package-lock.json at root):
   \`\`\`bash
   npm audit fix --workspace=${projectPath} 2>&1
   \`\`\`

   **Mode B - Standalone project** (package-lock.json in project):
   \`\`\`bash
   cd ${projectPath} && npm audit fix 2>&1
   \`\`\`

4. Track modified files after npm audit fix:
   \`\`\`bash
   git status --short package.json package-lock.json ${projectPath}/package.json 2>&1
   \`\`\`
   Extract file paths that changed (look for " M " prefix or "??" for new files)

5. Run post-verification npm audit to count remaining vulnerabilities:

   **Mode A - Monorepo/Workspace**:
   \`\`\`bash
   npm audit --workspace=${projectPath} --json 2>&1
   \`\`\`

   **Mode B - Standalone project**:
   \`\`\`bash
   cd ${projectPath} && npm audit --json 2>&1
   \`\`\`
   Parse "metadata.vulnerabilities.total" from JSON output

6. Calculate vulnerabilities fixed:
   - Initial count: ${vulnerabilitiesFound} (from deps scan step)
   - Remaining count: (from post-verification audit)
   - Fixed count: ${vulnerabilitiesFound} - remaining count

7. Generate fix summary:
   - Format: "Fixed X/Y vulnerabilities, Z remain"
   - Example: "Fixed 8/10 vulnerabilities, 2 remain"

8. Return the structured result
</workflow>

<output_format>
Return your findings in this JSON format wrapped in XML tags:

<deps_fix_result>
{
  "fix_ran": true,
  "vulnerabilities_fixed": 8,
  "vulnerabilities_remaining": 2,
  "files_modified": [
    "package.json",
    "package-lock.json"
  ],
  "fix_summary": "Fixed 8/10 vulnerabilities, 2 remain"
}
</deps_fix_result>

If npm audit fix fails to run:
<deps_fix_result>
{
  "fix_ran": false,
  "vulnerabilities_fixed": 0,
  "vulnerabilities_remaining": ${vulnerabilitiesFound},
  "files_modified": [],
  "fix_summary": "npm audit fix failed"
}
</deps_fix_result>
</output_format>

<rules>
- FIRST check if package-lock.json exists at ROOT (for npm workspaces/monorepos)
- If root has package-lock.json, use --workspace flag: npm audit fix --workspace=${projectPath}
- Only use cd ${projectPath} for standalone projects with their own package-lock.json
- Use git status to track file modifications (before and after npm audit fix)
- Only include files in files_modified array if they actually changed
- Typical modified files: package.json, package-lock.json (at root for workspaces)
- If no files changed, set files_modified: []
- Run post-verification npm audit --json to get accurate remaining count
- Calculate vulnerabilities_fixed = initial (${vulnerabilitiesFound}) - remaining
- If npm audit fix fails to run, set fix_ran: false
- Include concise fix summary with counts (e.g., "Fixed 5/10 vulnerabilities, 5 remain")
- Extract file names from git status output (look for modified files)
</rules>`

    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
        append:
          'REMINDER: After completing the deps fix, you MUST output <deps_fix_result>{...}</deps_fix_result> with your findings.',
      },
      userPrompt,
    }
  },
}

export { depsFixPromptV1 }
