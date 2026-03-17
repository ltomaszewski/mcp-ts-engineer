import type { PromptVersion } from '../../../core/prompt/prompt.types.js'

/**
 * Test step prompt for audit-fix capability.
 * Runs npm test in project workspaces and reports results.
 */

interface TestPromptInput {
  project_path: string
  workspaces: string[]
  cwd?: string
}

/**
 * Builds the user prompt for test execution.
 * Instructs the AI agent to run npm test in each workspace and report results.
 *
 * @param projectPath - Path to the project being tested
 * @param workspaces - List of workspace paths to test
 * @param cwd - Optional working directory
 * @returns Formatted user prompt string
 */
const buildTestUserPrompt = (projectPath: string, workspaces: string[], cwd?: string): string => {
  const workspacesList = workspaces.map((w) => `  - ${w}`).join('\n')
  const cwdContext = cwd ? `Working directory: ${cwd}\n\n` : ''

  return `You are the Test Agent for the audit-fix capability, responsible for running automated tests in project workspaces.

${cwdContext}Project: ${projectPath}

Workspaces to test:
${workspacesList}

Your responsibilities:
1. For each workspace in the list:
   - Navigate to the workspace directory
   - Run: npm test -- --forceExit
   - If the test runner is vitest, use: npx vitest run instead (vitest exits cleanly by default)
   - IMPORTANT: Always use --forceExit with jest to prevent hanging on open handles
   - Capture the test results (pass/fail counts)
   - Record any test failures with details

2. Aggregate results:
   - Overall passed: true if ALL tests pass across ALL workspaces, false if ANY tests fail
   - Total test count across all workspaces
   - Failed test count
   - List of workspaces tested
   - Summary of results including failure details if any

3. If tests fail:
   - Include failure details in failure_summary
   - Note which workspace(s) failed
   - Include relevant error messages and test names

4. Output your results in this exact format:

<test_result>
{
  "passed": <boolean>,
  "tests_total": <number>,
  "tests_failed": <number>,
  "failure_summary": "<detailed description of failures, or empty string if all pass>",
  "workspaces_tested": ["workspace-a", "workspace-b"]
}
</test_result>

Important guidelines:
- Run tests sequentially (one workspace at a time)
- ALWAYS use --forceExit flag with jest to prevent processes from hanging on open handles
- If a test command does not return within 5 minutes, consider it hung — kill it and report as failed
- If a workspace has no tests, note that in failure_summary but count tests_total as 0 for that workspace
- Extract test counts from npm test output (e.g., "Tests: 5 passed, 5 total")
- Include test duration in failure_summary if available
- Be specific about which workspace had which failures
- If npm test command fails completely, set passed=false and explain in failure_summary

Your goal is to verify that the audit fixes didn't break existing functionality by ensuring all tests pass.${cwd ? `\n\nIMPORTANT: Run all commands from the working directory: ${cwd}\nUse \`cd ${cwd}/<workspace>\` when navigating to workspaces for test execution.` : ''}`
}

export const testPromptV1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-03',
  description: 'Test step: runs npm test in project workspaces and reports aggregated results',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { project_path, workspaces, cwd } = input as TestPromptInput
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: buildTestUserPrompt(project_path, workspaces, cwd),
    }
  },
}
