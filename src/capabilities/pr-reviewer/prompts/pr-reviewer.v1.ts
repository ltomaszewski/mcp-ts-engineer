/**
 * PR reviewer main prompt template (v1).
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const PR_REVIEWER_USER_PROMPT_TEMPLATE = (
  prNumber: number,
  repoOwner: string,
  repoName: string,
  prBranch: string,
  baseBranch: string,
  filesChanged: number,
  mode: string,
  diffContent: string,
): string => {
  return `# PR Review Task

You are conducting a comprehensive code review for PR #${prNumber} in repository ${repoOwner}/${repoName}.

## PR Context
- **Branch**: ${prBranch} -> ${baseBranch}
- **Files Changed**: ${filesChanged} files
- **Review Mode**: ${mode}

## Your Task
Analyze the following diff and identify issues in these categories:
1. **Code Quality**: Biome violations, TypeScript anti-patterns, unused variables
2. **Security**: Input validation, auth bypass, secret exposure
3. **Architecture**: SOLID violations, circular deps, facade leaks
4. **Performance**: N+1 queries, unnecessary re-renders, large bundles

## Diff
\`\`\`diff
${diffContent}
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
  description: 'PR code review with multi-category analysis',
  deprecated: true,
  sunsetDate: '2026-03-15',
  build: (input: unknown) => {
    const data = input as {
      prNumber: number
      repoOwner: string
      repoName: string
      prBranch: string
      baseBranch: string
      filesChanged: number
      mode: string
      diffContent: string
    }
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: PR_REVIEWER_USER_PROMPT_TEMPLATE(
        data.prNumber,
        data.repoOwner,
        data.repoName,
        data.prBranch,
        data.baseBranch,
        data.filesChanged,
        data.mode,
        data.diffContent,
      ),
    }
  },
}

const v2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-25',
  description:
    'PR reviewer orchestrator v2 — reflects v2 prompts in internal step capabilities ' +
    '(review-step, classify, direct-fix, fix-validation)',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    // Stub prompt — orchestration delegates to step sub-capabilities
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: 'This capability uses orchestration. No direct AI call needed.',
    }
  },
}

export const PR_REVIEWER_PROMPT_VERSIONS: PromptRegistry = {
  v1,
  v2,
}

export const PR_REVIEWER_CURRENT_VERSION = 'v2'
