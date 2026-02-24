/**
 * Result aggregation prompt templates.
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const AGGREGATION_V1_TEMPLATE = (agentResults: string[]): string => {
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

const AGGREGATION_V2_TEMPLATE = (agentResults: string[]): string => {
  return `<agent_results>
${agentResults.map((result, i) => `<agent id="${i + 1}">\n${result}\n</agent>`).join('\n\n')}
</agent_results>

<instructions>
Merge and deduplicate issues from all agents. Follow these steps in order:

1. Collect all issues from all agents into a single list
2. Deduplicate: remove identical issues (same file, line, severity, title)
3. When duplicates exist, keep the one with highest severity
4. Merge complementary explanations from duplicates into the kept issue
5. Remove false positives: filter out issues with confidence < 60
6. Rank: order by severity (CRITICAL > HIGH > MEDIUM > LOW), then by confidence
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
</output_format>

Return only the merged, deduplicated list.
`
}

const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Result aggregation to merge and deduplicate issues from multiple agents',
  deprecated: true,
  sunsetDate: '2026-03-15',
  build: (input: unknown) => {
    const data = input as { agentResults: string[] }
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: AGGREGATION_V1_TEMPLATE(data.agentResults),
    }
  },
}

const v2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-24',
  description: 'XML-structured aggregation with explicit numbered steps for haiku',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as { agentResults: string[] }
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: AGGREGATION_V2_TEMPLATE(data.agentResults),
    }
  },
}

export const AGGREGATION_VERSIONS: PromptRegistry = { v1, v2 }

export const AGGREGATION_CURRENT_VERSION = 'v2'
