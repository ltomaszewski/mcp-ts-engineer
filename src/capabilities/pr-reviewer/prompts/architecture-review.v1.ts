/**
 * Architecture review prompt template (v1).
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const ARCHITECTURE_REVIEW_USER_PROMPT_TEMPLATE = (
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

const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Architecture review focused on SOLID, circular deps, and facade leaks',
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
      userPrompt: ARCHITECTURE_REVIEW_USER_PROMPT_TEMPLATE(data.diff, data.files, data.repoName),
    }
  },
}

export const ARCHITECTURE_REVIEW_VERSIONS: PromptRegistry = {
  v1,
}

export const ARCHITECTURE_REVIEW_CURRENT_VERSION = 'v1'
