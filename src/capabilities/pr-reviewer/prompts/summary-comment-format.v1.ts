/**
 * Summary PR comment formatting prompt template (v1).
 */

import type { PromptRegistry } from "../../../core/prompt/prompt.types.js";
import type { PromptVersion } from "../../../core/prompt/prompt.types.js";

const SUMMARY_COMMENT_FORMAT_USER_PROMPT_TEMPLATE = (
  issues: string[],
  fixCount: number,
  costUsd: number,
  confidence: number
): string => {
  return `# Summary PR Comment Formatting Task

You are formatting a code review summary as a GitHub PR comment.

## Issues Found
\`\`\`json
${JSON.stringify(issues, null, 2)}
\`\`\`

## Metadata
- **Fixes Applied**: ${fixCount}
- **Cost**: $${costUsd.toFixed(4)}
- **Confidence**: ${confidence}%

## Your Task
Format a concise summary comment:
1. **Header**: Review status (✅ Approved, ⚠️ Changes Requested, 🔴 Critical Issues)
2. **Stats**: Issue counts by severity
3. **Top Issues**: 3-5 most critical issues with file paths
4. **Fixes Applied**: Number of auto-fixes applied
5. **Next Steps**: What the author should do

## Output Format
Return a JSON object with this structure:
\`\`\`json
{
  "comment": "## ⚠️ Code Review: Changes Requested\\n\\n**Issues Found:**\\n- 🔴 1 Critical\\n- 🟠 2 High\\n- 🟡 3 Medium\\n- ⚪ 1 Low\\n\\n**Top Issues:**\\n1. Missing input validation in \`auth.service.ts:42\`\\n2. N+1 query in \`user.resolver.ts:78\`\\n3. Unused variable in \`helpers.ts:15\`\\n\\n**Auto-Fixes Applied:** 5\\n**Cost:** $0.0123\\n\\n**Next Steps:**\\n1. Address critical input validation issue\\n2. Optimize N+1 query with batch loader\\n3. Review auto-fixes and commit"
}
\`\`\`

Keep the summary concise and actionable.
`;
};

const v1: PromptVersion = {
  version: "v1",
  createdAt: "2026-02-14",
  description: "Format code review summary as GitHub PR comment",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as {
      issues: string[];
      fixCount: number;
      costUsd: number;
      confidence: number;
    };
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
      },
      userPrompt: SUMMARY_COMMENT_FORMAT_USER_PROMPT_TEMPLATE(
        data.issues,
        data.fixCount,
        data.costUsd,
        data.confidence
      ),
    };
  },
};

export const SUMMARY_COMMENT_FORMAT_VERSIONS: PromptRegistry = {
  v1,
};

export const SUMMARY_COMMENT_FORMAT_CURRENT_VERSION = "v1";
