/**
 * Security review prompt templates.
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const SECURITY_REVIEW_V1_TEMPLATE = (
  diff: string,
  files: string[],
  repoName: string,
): string => {
  return `# Security Review Task

You are conducting a security review for repository ${repoName}.

## Files Changed
${files.map((f) => `- ${f}`).join('\n')}

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
`
}

const SECURITY_REVIEW_V2_TEMPLATE = (
  diff: string,
  files: string[],
  repoName: string,
  projectContext?: string,
): string => {
  const contextSection = projectContext
    ? `<project_rules>\n${projectContext}\n</project_rules>\n`
    : ''

  return `<diff>
${diff}
</diff>

<context>
<repository>${repoName}</repository>
${contextSection}<files_changed>
${files.map((f) => `- ${f}`).join('\n')}
</files_changed>
</context>

<instructions>
Identify security issues:
1. **Input validation**: Missing validation, weak sanitization, type coercion risks
2. **Authentication bypass**: Missing guards, weak token checks, session issues
3. **Secret exposure**: Hardcoded credentials, API keys in code, leaked tokens
4. **Injection vulnerabilities**: SQL/NoSQL injection, command injection, XSS
5. **Authorization**: Missing ownership checks, privilege escalation
6. **Data protection**: Unencrypted sensitive data, logging PII/credentials
</instructions>

<output_format>
Return JSON:
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
</output_format>

Focus on actionable feedback with clear remediation steps.
`
}

const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Security review focused on input validation, auth, and secret exposure',
  deprecated: true,
  sunsetDate: '2026-03-15',
  build: (input: unknown) => {
    const data = input as { diff: string; files: string[]; repoName: string }
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: SECURITY_REVIEW_V1_TEMPLATE(data.diff, data.files, data.repoName),
    }
  },
}

const v2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-24',
  description: 'XML-structured security review with diff-first and project context',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as {
      diff: string
      files: string[]
      repoName: string
      projectContext?: string
    }
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: SECURITY_REVIEW_V2_TEMPLATE(
        data.diff,
        data.files,
        data.repoName,
        data.projectContext,
      ),
    }
  },
}

export const SECURITY_REVIEW_VERSIONS: PromptRegistry = { v1, v2 }

export const SECURITY_REVIEW_CURRENT_VERSION = 'v2'
