/**
 * Security review prompt template (v1).
 */

import type { PromptRegistry } from "../../../core/prompt/prompt.types.js";
import type { PromptVersion } from "../../../core/prompt/prompt.types.js";

const SECURITY_REVIEW_USER_PROMPT_TEMPLATE = (
  diff: string,
  files: string[],
  repoName: string
): string => {
  return `# Security Review Task

You are conducting a security review for repository ${repoName}.

## Files Changed
${files.map(f => `- ${f}`).join('\n')}

## Your Task
Analyze the following diff and identify security issues:
1. **Input validation**: Missing validation, weak sanitization, type coercion risks
2. **Authentication bypass**: Missing guards, weak token checks, session issues
3. **Secret exposure**: Hardcoded credentials, API keys in code, leaked tokens
4. **Injection vulnerabilities**: SQL/NoSQL injection, command injection, XSS
5. **Authorization**: Missing ownership checks, privilege escalation
6. **Data protection**: Unencrypted sensitive data, logging PII/credentials

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
      "confidence": 90
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
  description: "Security review focused on input validation, auth, and secret exposure",
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
      userPrompt: SECURITY_REVIEW_USER_PROMPT_TEMPLATE(
        data.diff,
        data.files,
        data.repoName
      ),
    };
  },
};

export const SECURITY_REVIEW_VERSIONS: PromptRegistry = {
  v1,
};

export const SECURITY_REVIEW_CURRENT_VERSION = "v1";
