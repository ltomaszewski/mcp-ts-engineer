/**
 * Architecture review prompt templates.
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const ARCHITECTURE_REVIEW_V1_TEMPLATE = (
  diff: string,
  files: string[],
  repoName: string,
): string => {
  return `# Architecture Review Task

You are conducting an architecture review for repository ${repoName}.

## Files Changed
${files.map((f) => `- ${f}`).join('\n')}

## Your Task
Analyze the following diff and identify architectural issues:
1. **SOLID violations**: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
2. **Circular dependencies**: Modules importing each other, causing initialization issues
3. **Facade leaks**: Internal services exported from modules, breaking encapsulation
4. **Tight coupling**: Direct dependencies on concrete implementations vs interfaces
5. **Feature organization**: Mixed concerns, non-colocated related code
6. **Abstraction levels**: Mixed high-level and low-level code in same module

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
      "confidence": 75
    }
  ]
}
\`\`\`

Focus on actionable feedback with clear remediation steps.
`
}

const ARCHITECTURE_REVIEW_V2_TEMPLATE = (
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
Analyze the diff for architectural issues:
1. **SOLID violations**: Single Responsibility, Open/Closed, Liskov, Interface Segregation, Dependency Inversion
2. **Circular dependencies**: Modules importing each other, causing initialization issues
3. **Facade leaks**: Internal services exported from modules, breaking encapsulation
4. **Tight coupling**: Direct dependencies on concrete implementations vs interfaces
5. **Feature organization**: Mixed concerns, non-colocated related code
6. **Abstraction levels**: Mixed high-level and low-level code in same module
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
      "confidence": 75
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
  description: 'Architecture review focused on SOLID, circular deps, and facade leaks',
  deprecated: true,
  sunsetDate: '2026-03-15',
  build: (input: unknown) => {
    const data = input as { diff: string; files: string[]; repoName: string }
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: ARCHITECTURE_REVIEW_V1_TEMPLATE(data.diff, data.files, data.repoName),
    }
  },
}

const v2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-24',
  description: 'XML-structured architecture review with diff-first and project context',
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
      userPrompt: ARCHITECTURE_REVIEW_V2_TEMPLATE(
        data.diff,
        data.files,
        data.repoName,
        data.projectContext,
      ),
    }
  },
}

export const ARCHITECTURE_REVIEW_VERSIONS: PromptRegistry = { v1, v2 }

export const ARCHITECTURE_REVIEW_CURRENT_VERSION = 'v2'
