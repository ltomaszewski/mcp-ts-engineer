/**
 * Test step prompt v2 for finalize capability.
 * Uses --outputFile to write JSON results to /tmp, then reads with python3.
 * Eliminates stdout parsing issues (truncation, ANSI, Jest bugs).
 */

import type { PromptVersion } from '../../../core/prompt/prompt.types.js'
import { shellQuote } from '../../../core/utils/shell-safe.js'
import { cwdPath, resolveCwd } from '../../../core/utils/cwd.js'

interface TestPromptInput {
  workspaces: string[]
  cwd?: string
}

/**
 * Builds the exact test command for a workspace based on runner type.
 * Jest: npm test -- --forceExit --json --outputFile=...
 * Vitest: npx vitest run --reporter=json --outputFile=...
 */
function buildTestCommand(runner: 'jest' | 'vitest', outputFile: string): string {
  const pythonExtract = `python3 -c "import json; d=json.load(open('${outputFile}')); print(json.dumps({'numFailedTests':d['numFailedTests'],'numPassedTests':d['numPassedTests'],'numTotalTests':d['numTotalTests'],'numFailedTestSuites':d['numFailedTestSuites'],'numTotalTestSuites':d['numTotalTestSuites']}))"`;

  if (runner === 'jest') {
    return `npm test -- --forceExit --json --outputFile=${outputFile} 2>/dev/null; ${pythonExtract}`
  }
  return `npx vitest run --reporter=json --outputFile=${outputFile} 2>/dev/null; ${pythonExtract}`
}

const testPromptV2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-03-17',
  description:
    'Test step v2: --outputFile JSON approach, single-command per workspace, no stdout parsing',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { workspaces, cwd } = input as TestPromptInput
    const rootPath = resolveCwd(cwd)

    const workspacesList = workspaces
      .map((w) => `  - ${shellQuote(cwdPath(rootPath, w))}`)
      .join('\n')

    const jestCmd = buildTestCommand('jest', '/tmp/test-results.json')
    const vitestCmd = buildTestCommand('vitest', '/tmp/test-results.json')

    const userPrompt = `You are the Test Agent for running automated tests in affected workspaces.

${cwd ? `<cwd>${cwd}</cwd>` : ''}

<workspaces>
${workspacesList}
</workspaces>

<workflow>
For EACH workspace:

1. Read its package.json devDependencies to detect the runner:
   - "jest" or "jest-expo" → Jest
   - "vitest" → Vitest

2. Run the EXACT command for the detected runner (one Bash call per workspace):

   **Jest:**
   \`\`\`bash
   cd <workspace_path> && ${jestCmd}
   \`\`\`

   **Vitest:**
   \`\`\`bash
   cd <workspace_path> && ${vitestCmd}
   \`\`\`

3. The python3 one-liner prints a JSON summary like:
   {"numFailedTests": 0, "numPassedTests": 2459, "numTotalTests": 2459, "numFailedTestSuites": 0, "numTotalTestSuites": 187}

4. Determine pass/fail from \`numFailedTests === 0\`. NEVER use the \`success\` field.

5. If the JSON file is missing or python3 fails (fallback — use ONCE only):
   \`\`\`bash
   cd <workspace_path> && npm test -- --forceExit 2>&1 | tail -5
   \`\`\`
   Then manually extract "Tests: X passed, X total" from those last 5 lines.

6. After ALL workspaces are tested, output the aggregated result.
</workflow>

<output_format>
<test_result>
{
  "passed": <boolean — true only if numFailedTests === 0 in ALL workspaces>,
  "workspaces_tested": ["workspace-a", "workspace-b"],
  "summary": "<description of test results including counts, or failure details>"
}
</test_result>
</output_format>

<rules>
ALWAYS:
- Use the EXACT commands above — do not modify flags or piping
- Determine pass/fail from numFailedTests === 0, NEVER from the success field
- Use --forceExit for Jest projects (prevents hanging on open handles)
- Run as a single compound command (semicolon separator) in ONE Bash call per workspace
- Run tests sequentially (one workspace at a time)
- Include test count totals in the summary field

NEVER:
- Re-run the test suite — run the command ONCE per workspace
- Add --verbose, --silent, --reporters, --bail, or any extra flags
- Parse stdout text for test counts — always use the JSON file
- Use the success field from Jest output for pass/fail determination
- Wait, retry, or re-attempt if the command completes (even with failures)
</rules>`

    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
        append:
          'REMINDER: You MUST output <test_result>{...}</test_result>. Run tests ONCE per workspace using --outputFile. NEVER re-run tests.',
      },
      userPrompt,
    }
  },
}

export { testPromptV2, buildTestCommand }
