/**
 * Inline PR comment formatting prompt template (v1).
 */

import type { PromptRegistry } from "../../../core/prompt/prompt.types.js";
import type { PromptVersion } from "../../../core/prompt/prompt.types.js";

const INLINE_COMMENT_FORMAT_USER_PROMPT_TEMPLATE = (
  issue: string
): string => {
  return `# Inline PR Comment Formatting Task

You are formatting a code review issue as a GitHub inline review comment.

## Issue
\`\`\`json
${issue}
\`\`\`

## Your Task
Format the issue as a concise inline comment:
1. **Severity emoji**: 🔴 CRITICAL, 🟠 HIGH, 🟡 MEDIUM, ⚪ LOW
2. **Title**: Short, actionable title
3. **Details**: 1-2 sentences explaining the issue
4. **Suggestion**: Code snippet showing the fix (if applicable)
5. **Confidence**: Include only if < 80

## Output Format
Return a JSON object with this structure:
\`\`\`json
{
  "file_path": "path/to/file.ts",
  "line": 42,
  "comment": "🟠 **Missing input validation**\\n\\nUser input is passed directly to database query without validation.\\n\\n**Suggestion:**\\n\`\`\`typescript\\nconst email = validateEmail(userInput);\\nconst user = await findByEmail(email);\\n\`\`\`"
}
\`\`\`

Keep comments concise and actionable.
`;
};

const v1: PromptVersion = {
  version: "v1",
  createdAt: "2026-02-14",
  description: "Format code review issues as GitHub inline PR comments",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as {
      issue: string;
    };
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
      },
      userPrompt: INLINE_COMMENT_FORMAT_USER_PROMPT_TEMPLATE(
        data.issue
      ),
    };
  },
};

export const INLINE_COMMENT_FORMAT_VERSIONS: PromptRegistry = {
  v1,
};

export const INLINE_COMMENT_FORMAT_CURRENT_VERSION = "v1";
