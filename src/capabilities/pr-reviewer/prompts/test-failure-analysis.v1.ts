/**
 * Test failure analysis prompt template (v1).
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const TEST_FAILURE_ANALYSIS_USER_PROMPT_TEMPLATE = (
  testOutput: string,
  recentChanges: string,
): string => {
  return `# Test Failure Analysis Task

You are analyzing test failures after applying automated fixes.

## Test Output
\`\`\`
${testOutput}
\`\`\`

## Recent Changes
\`\`\`diff
${recentChanges}
\`\`\`

## Your Task
Identify which fix caused the test failure:
1. **Parse test output**: Extract failing test names and error messages
2. **Correlate with changes**: Match failures to specific file changes
3. **Root cause**: Determine if fix broke existing behavior or tests are outdated
4. **Recommendation**: Revert fix, update test, or fix differently

## Output Format
Return a JSON object with this structure:
\`\`\`json
{
  "failures": [
    {
      "test_name": "UserService.findById should return user",
      "error_message": "Expected User but got null",
      "likely_cause": "Fix in user.service.ts changed return type",
      "file_path": "src/modules/user/user.service.ts",
      "recommendation": "REVERT_FIX | UPDATE_TEST | FIX_DIFFERENTLY",
      "confidence": 85
    }
  ],
  "summary": {
    "total_failures": 1,
    "high_confidence_causes": 1,
    "recommended_action": "Revert fix in user.service.ts and apply different solution"
  }
}
\`\`\`

Focus on actionable recommendations.
`
}

const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Test failure analysis to identify which fix caused test breakage',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as {
      testOutput: string
      recentChanges: string
    }
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: TEST_FAILURE_ANALYSIS_USER_PROMPT_TEMPLATE(data.testOutput, data.recentChanges),
    }
  },
}

export const TEST_FAILURE_ANALYSIS_VERSIONS: PromptRegistry = {
  v1,
}

export const TEST_FAILURE_ANALYSIS_CURRENT_VERSION = 'v1'
