import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseJsonSafe, parseXmlBlock } from '../../core/utils/index.js'
import type { AggregateStepInput, AggregateStepOutput } from './pr-reviewer.schema.js'
import {
  AGGREGATE_OUTPUT_JSON_SCHEMA,
  AggregateStepInputSchema,
  AggregateStepOutputSchema,
} from './pr-reviewer.schema.js'

const AGGREGATE_PROMPT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Aggregate and deduplicate issues from review agents',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as AggregateStepInput

    // Build cross-run dedup section if previous issues are provided
    const previousIssuesSection =
      data.previous_issues && data.previous_issues.length > 0
        ? `## Previously Reported Issues (DO NOT re-report)

The following issues were already reported in a previous review. Do NOT include them in your output unless the underlying code has fundamentally changed:

${data.previous_issues.map((i) => `- [${i.severity}] ${i.file_path}:${i.line ?? '?'} - ${i.title}`).join('\n')}

If a new issue matches a previous issue (same file + similar title), EXCLUDE it from the output.

`
        : ''

    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Aggregate Review Issues

You are aggregating review results from ${data.agent_results.length} review pass(es).

${previousIssuesSection}## Agent Results

${data.agent_results
  .map(
    (result) => `### ${result.agent} Agent
Found ${result.issues.length} issues
${result.issues.map((i) => `- [${i.severity}] ${i.file_path}:${i.line ?? '?'} - ${i.title}`).join('\n')}`,
  )
  .join('\n\n')}

## Your Tasks

1. **Merge all issues** into a single list
2. **Deduplicate** issues that are essentially the same:
   - Same file + line number (± 3 lines)
   - Similar title (fuzzy match)
   - Same underlying problem
3. When deduplicating:
   - Keep the highest severity
   - Combine details
   - Boost confidence by +15 for consensus
4. **Preserve metadata**: category, auto_fixable, suggestion
5. **Exclude previously reported issues** (see above if applicable)

## Output Format

Respond with JSON:
\`\`\`json
{
  "issues": [
    {
      "severity": "HIGH",
      "category": "security",
      "title": "Issue title",
      "file_path": "path/to/file.ts",
      "line": 42,
      "details": "Combined details",
      "suggestion": "Fix suggestion",
      "auto_fixable": true,
      "confidence": 85
    }
  ],
  "deduped_count": 3
}
\`\`\`

Begin aggregation now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: AGGREGATE_PROMPT_V1 }
const CURRENT_VERSION = 'v1'

export const prAggregateStepCapability: CapabilityDefinition<
  AggregateStepInput,
  AggregateStepOutput
> = {
  id: 'pr_aggregate_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Aggregate Step',
  description: 'Merge and deduplicate issues from review agents',
  inputSchema: AggregateStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 10,
    maxBudgetUsd: 0.5,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: AGGREGATE_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: AggregateStepInput, _context: CapabilityContext) => input,
  processResult: (
    input: AggregateStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): AggregateStepOutput => {
    // Merge-all fallback used when parsing fails
    const mergeFallback = (): AggregateStepOutput => ({
      issues: input.agent_results.flatMap((r) => r.issues),
      deduped_count: 0,
    })

    // Strategy 1: SDK structured output
    if (aiResult.structuredOutput) {
      const validated = AggregateStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }

    // Strategy 2: XML block fallback
    const xmlContent = parseXmlBlock(aiResult.content, 'aggregate_result')
    if (xmlContent) return parseJsonSafe(xmlContent, AggregateStepOutputSchema, mergeFallback())

    return mergeFallback()
  },
}
