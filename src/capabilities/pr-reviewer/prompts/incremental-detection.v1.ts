/**
 * Incremental review detection prompt template (v1).
 */

import type { PromptRegistry } from "../../../core/prompt/prompt.types.js";
import type { PromptVersion } from "../../../core/prompt/prompt.types.js";

const INCREMENTAL_DETECTION_USER_PROMPT_TEMPLATE = (
  commits: string[],
  lastReviewedSha: string
): string => {
  return `# Incremental Review Detection Task

You are identifying new commits since the last review.

## Commits
${commits.map((c, i) => `${i + 1}. ${c}`).join('\n')}

## Last Reviewed SHA
${lastReviewedSha}

## Your Task
Identify which commits are new since the last review:
1. **Find last reviewed commit**: Locate commit with SHA ${lastReviewedSha}
2. **Extract new commits**: All commits after the last reviewed commit
3. **Determine scope**: Files changed in new commits only
4. **Review mode**: Incremental (only new changes) or full (entire PR)

## Output Format
Return a JSON object with this structure:
\`\`\`json
{
  "new_commits": [
    {
      "sha": "abc123",
      "message": "fix: resolve input validation",
      "files_changed": ["src/auth.service.ts", "src/auth.test.ts"]
    }
  ],
  "review_mode": "incremental | full",
  "reason": "Found 2 new commits since last review",
  "files_to_review": ["src/auth.service.ts", "src/auth.test.ts"]
}
\`\`\`

If last reviewed SHA not found, recommend full review.
`;
};

const v1: PromptVersion = {
  version: "v1",
  createdAt: "2026-02-14",
  description: "Incremental review detection to identify new commits since last review",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as {
      commits: string[];
      lastReviewedSha: string;
    };
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
      },
      userPrompt: INCREMENTAL_DETECTION_USER_PROMPT_TEMPLATE(
        data.commits,
        data.lastReviewedSha
      ),
    };
  },
};

export const INCREMENTAL_DETECTION_VERSIONS: PromptRegistry = {
  v1,
};

export const INCREMENTAL_DETECTION_CURRENT_VERSION = "v1";
