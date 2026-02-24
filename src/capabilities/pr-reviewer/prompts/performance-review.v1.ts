/**
 * Performance review prompt templates.
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const PERFORMANCE_REVIEW_V1_TEMPLATE = (
  diff: string,
  files: string[],
  repoName: string,
): string => {
  return `# Performance Review Task

You are conducting a performance review for repository ${repoName}.

## Files Changed
${files.map((f) => `- ${f}`).join('\n')}

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
`
}

const PERFORMANCE_REVIEW_V2_TEMPLATE = (
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
Identify performance issues:
1. **N+1 queries**: Database queries inside loops, missing batch loading
2. **Unnecessary re-renders**: Missing React.memo, useCallback, useMemo
3. **Large bundles**: Importing entire libraries when only one function needed
4. **Blocking operations**: Synchronous operations in async context, no pagination
5. **Memory leaks**: Event listeners not cleaned up, unclosed connections
6. **Inefficient algorithms**: O(n²) loops, redundant iterations
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
      "confidence": 80
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
  description: 'Performance review focused on N+1 queries, re-renders, and large bundles',
  deprecated: true,
  sunsetDate: '2026-03-15',
  build: (input: unknown) => {
    const data = input as { diff: string; files: string[]; repoName: string }
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: PERFORMANCE_REVIEW_V1_TEMPLATE(data.diff, data.files, data.repoName),
    }
  },
}

const v2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-24',
  description: 'XML-structured performance review with diff-first and project context',
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
      userPrompt: PERFORMANCE_REVIEW_V2_TEMPLATE(
        data.diff,
        data.files,
        data.repoName,
        data.projectContext,
      ),
    }
  },
}

export const PERFORMANCE_REVIEW_VERSIONS: PromptRegistry = { v1, v2 }

export const PERFORMANCE_REVIEW_CURRENT_VERSION = 'v2'
