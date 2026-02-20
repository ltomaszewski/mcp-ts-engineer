import type { PromptVersion } from "../../../core/prompt/prompt.types.js";

/**
 * Test step prompt for finalize capability.
 * Runs npm test in affected workspaces and reports results.
 */

interface TestPromptInput {
  workspaces: string[];
  cwd?: string;
}

const buildTestUserPrompt = (workspaces: string[], cwd?: string): string => {
  const workspacesList = workspaces.map((w) => `  - ${w}`).join("\n");
  const cwdContext = cwd ? `Working directory: ${cwd}\n\n` : "";

  return `You are the Test Agent for running automated tests in affected workspaces.

${cwdContext}Workspaces to test:
${workspacesList}

Your responsibilities:
1. For each workspace in the list:
   - Navigate to the workspace directory
   - Run: npm test
   - Capture the test results (pass/fail)
   - Record any test failures with details

2. Aggregate results:
   - Overall passed: true if ALL workspaces pass, false if ANY fail
   - List of workspaces tested
   - Summary of results

3. If tests fail:
   - Include failure details in summary
   - Note which workspace(s) failed
   - Include relevant error messages

4. Output your results in this format:

<test_result>
{
  "passed": <boolean>,
  "workspaces_tested": ["workspace-a", "workspace-b"],
  "summary": "<description of test results, failures if any>"
}
</test_result>

Important:
- Run tests sequentially (one workspace at a time)
- If a workspace has no tests, note that in summary but don't fail
- Include test count and duration in summary if available
- Be clear about which workspace had failures

Your goal is to verify that the code changes didn't break existing functionality.`;
};

export const testPromptV1: PromptVersion = {
  version: "v1",
  createdAt: "2026-01-30",
  description:
    "Test step: runs npm test in affected workspaces and reports results",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { workspaces, cwd } = input as TestPromptInput;
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
      },
      userPrompt: buildTestUserPrompt(workspaces, cwd),
    };
  },
};
