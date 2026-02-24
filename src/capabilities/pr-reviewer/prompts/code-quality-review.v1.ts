/**
 * Code quality review prompt template (v1).
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const CODE_QUALITY_REVIEW_USER_PROMPT_TEMPLATE = (
  diff: string,
  files: string[],
  repoName: string,
): string => {
  return `# Code Quality Review Task

You are conducting a code quality review for repository ${repoName}.

## Files Changed
${files.map((f) => `- ${f}`).join('\n')}

## Your Task
Analyze the following diff and identify code quality issues that automated linting CANNOT catch.
DO NOT report: Biome/lint violations, formatting, import ordering, unused imports — these are handled by the daily audit tool.

Focus on:
1. **Logic errors**: Incorrect conditionals, off-by-one, wrong comparisons
2. **TypeScript anti-patterns**: Unsafe \`any\` usage, incorrect type assertions, missing type guards
3. **Code duplication**: Repeated logic that should be extracted
4. **Complexity**: Functions >50 lines, nesting >3 levels, hard-to-follow control flow
5. **Missing error handling**: Unhandled promise rejections, missing try/catch in critical paths
6. **API contract violations**: Wrong return types, missing required fields

## Diff
\`\`\`diff
${diff}
\`\`\`

## Output Format
Return a JSON object with this structure:
\`\`\`json
{
  "issues": [
    {
      "severity": "CRITICAL | HIGH | MEDIUM | LOW",
      "title": "Short issue title",
      "file_path": "path/to/file.ts",
      "line": 42,
      "details": "Detailed explanation",
      "suggestion": "How to fix",
      "auto_fixable": true,
      "confidence": 85
    }
  ]
}
\`\`\`

Focus on actionable feedback with clear remediation steps.
`
}

const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Code quality review focused on Biome violations and TypeScript patterns',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as {
      diff: string
      files: string[]
      repoName: string
    }
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: CODE_QUALITY_REVIEW_USER_PROMPT_TEMPLATE(data.diff, data.files, data.repoName),
    }
  },
}

export const CODE_QUALITY_REVIEW_VERSIONS: PromptRegistry = {
  v1,
}

export const CODE_QUALITY_REVIEW_CURRENT_VERSION = 'v1'
