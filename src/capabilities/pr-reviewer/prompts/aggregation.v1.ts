/**
 * Result aggregation prompt template (v1).
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const AGGREGATION_USER_PROMPT_TEMPLATE = (agentResults: string[]): string => {
  return `# Result Aggregation Task

You are aggregating code review results from multiple specialized agents.

## Agent Results
${agentResults.map((result, i) => `### Agent ${i + 1}\n\`\`\`json\n${result}\n\`\`\``).join('\n\n')}

## Your Task
Merge and deduplicate issues from all agents:
1. **Deduplicate**: Remove identical issues (same file, line, severity, title)
2. **Prioritize**: Keep highest severity when duplicates exist
3. **Merge details**: Combine complementary explanations
4. **Rank**: Order by severity (CRITICAL > HIGH > MEDIUM > LOW), then by confidence
5. **Remove false positives**: Filter out issues with confidence < 60

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
  ],
  "stats": {
    "total_issues": 5,
    "by_severity": {
      "critical": 1,
      "high": 2,
      "medium": 1,
      "low": 1
    }
  }
}
\`\`\`

Return only the merged, deduplicated list.
`
}

const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Result aggregation to merge and deduplicate issues from multiple agents',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as {
      agentResults: string[]
    }
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: AGGREGATION_USER_PROMPT_TEMPLATE(data.agentResults),
    }
  },
}

export const AGGREGATION_VERSIONS: PromptRegistry = {
  v1,
}

export const AGGREGATION_CURRENT_VERSION = 'v1'
