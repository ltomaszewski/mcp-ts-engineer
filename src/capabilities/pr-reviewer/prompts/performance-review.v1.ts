/**
 * Performance review prompt template (v1).
 */

import type { PromptRegistry } from "../../../core/prompt/prompt.types.js";
import type { PromptVersion } from "../../../core/prompt/prompt.types.js";

const PERFORMANCE_REVIEW_USER_PROMPT_TEMPLATE = (
  diff: string,
  files: string[],
  repoName: string
): string => {
  return `# Performance Review Task

You are conducting a performance review for repository ${repoName}.

## Files Changed
${files.map(f => `- ${f}`).join('\n')}

## Your Task
Analyze the following diff and identify performance issues:
1. **N+1 queries**: Database queries inside loops, missing batch loading
2. **Unnecessary re-renders**: Missing React.memo, useCallback, useMemo
3. **Large bundles**: Importing entire libraries when only one function needed
4. **Blocking operations**: Synchronous operations in async context, no pagination
5. **Memory leaks**: Event listeners not cleaned up, unclosed connections
6. **Inefficient algorithms**: O(n²) loops, redundant iterations

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
      "auto_fixable": false,
      "confidence": 80
    }
  ]
}
\`\`\`

Focus on actionable feedback with clear remediation steps.
`;
};

const v1: PromptVersion = {
  version: "v1",
  createdAt: "2026-02-14",
  description: "Performance review focused on N+1 queries, re-renders, and large bundles",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as {
      diff: string;
      files: string[];
      repoName: string;
    };
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
      },
      userPrompt: PERFORMANCE_REVIEW_USER_PROMPT_TEMPLATE(
        data.diff,
        data.files,
        data.repoName
      ),
    };
  },
};

export const PERFORMANCE_REVIEW_VERSIONS: PromptRegistry = {
  v1,
};

export const PERFORMANCE_REVIEW_CURRENT_VERSION = "v1";
