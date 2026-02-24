import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseJsonSafe, parseXmlBlock } from '../../core/utils/index.js'
import { tryParseJson } from './pr-reviewer.helpers.js'
import type { ReviewStepInput, ReviewStepOutput } from './pr-reviewer.schema.js'
import {
  REVIEW_OUTPUT_JSON_SCHEMA,
  ReviewStepInputSchema,
  ReviewStepOutputSchema,
} from './pr-reviewer.schema.js'

const REVIEW_PROMPT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Comprehensive multi-category code review',
  deprecated: true,
  sunsetDate: '2026-03-15',
  build: (input: unknown) => {
    const data = input as ReviewStepInput
    const ctx = data.pr_context

    const projectContextSection = data.project_context
      ? `## Project-Specific Rules & Patterns\n\n${data.project_context}\n\n`
      : ''

    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Code Review

You are reviewing PR #${ctx.pr_number} in ${ctx.repo_owner}/${ctx.repo_name}.

## Context

Worktree: ${data.worktree_path}
Branch: ${ctx.pr_branch} → ${ctx.base_branch}
Files Changed: ${ctx.files_changed.length}

${projectContextSection}## Diff

\`\`\`diff
${data.diff_content.substring(0, 30000)}
\`\`\`

## Files to Review

${ctx.files_changed.map((f) => `- ${f}`).join('\n')}

Begin review now.`,
    }
  },
}

const REVIEW_PROMPT_V2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-24',
  description: 'Sonnet-optimized review with diff-first positioning and XML tags',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as ReviewStepInput
    const ctx = data.pr_context

    const projectRulesSection = data.project_context
      ? `<project_rules>\n${data.project_context}\n</project_rules>\n`
      : ''

    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `<diff>
${data.diff_content.substring(0, 30000)}
</diff>

<context>
<pr_info>PR #${ctx.pr_number} in ${ctx.repo_owner}/${ctx.repo_name}, branch ${ctx.pr_branch} → ${ctx.base_branch}</pr_info>
<worktree>${data.worktree_path}</worktree>
${projectRulesSection}<files_changed>
${ctx.files_changed.map((f) => `- ${f}`).join('\n')}
</files_changed>
</context>

<instructions>
Review from these perspectives (skip lint/formatting — handled by daily audit):

1. **Code Quality**: TypeScript anti-patterns, logic errors, missing error handling
2. **Security**: Input validation, auth bypass, secret exposure, injection risks
3. **Architecture**: SOLID violations, circular deps, coupling, design pattern misuse
4. **Performance**: N+1 queries, memory leaks, unnecessary re-renders, large bundles

Read each changed file in the worktree at ${data.worktree_path} for full context.
</instructions>

<constraints>
DO NOT REPORT (handled by daily audit):
- Lint/Biome violations, formatting, import ordering
- Unused exports, test coverage thresholds
- Missing semicolons, trailing commas, whitespace

auto_fixable=true ONLY for trivial mechanical changes (confidence >= 80):
- Unused import removal, console.log removal
- Missing return type on simple functions
- Simple null check additions
- Missing error logging in empty catch blocks

auto_fixable=false for EVERYTHING ELSE including:
- Error handling with business logic, type extraction
- Validation logic, security hardening, architectural refactors
</constraints>

<output_format>
Respond with JSON:
\`\`\`json
{
  "agent": "multi-review",
  "issues": [
    {
      "severity": "CRITICAL",
      "category": "security",
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
If no issues found, return: { "agent": "multi-review", "issues": [] }
</output_format>

Begin review now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: REVIEW_PROMPT_V1, v2: REVIEW_PROMPT_V2 }
const CURRENT_VERSION = 'v2'

export const prReviewStepCapability: CapabilityDefinition<ReviewStepInput, ReviewStepOutput> = {
  id: 'pr_review_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Review Step',
  description: 'Perform comprehensive multi-category code review',
  inputSchema: ReviewStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 50,
    maxBudgetUsd: 3.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: REVIEW_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: ReviewStepInput, _context: CapabilityContext) => input,
  processResult: (
    _input: ReviewStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): ReviewStepOutput => {
    const FALLBACK: ReviewStepOutput = { agent: 'multi-review', issues: [] }

    // Strategy 1: SDK structured output
    if (aiResult.structuredOutput) {
      const validated = ReviewStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) {
        _context.logger.info('Review parsed via structured output', {
          issueCount: validated.data.issues.length,
        })
        return validated.data
      }
      _context.logger.debug('Structured output parsing failed, trying XML fallback')
    }

    // Strategy 2: XML block fallback
    const xmlContent = parseXmlBlock(aiResult.content, 'review_result')
    if (xmlContent) {
      const xmlResult = parseJsonSafe(xmlContent, ReviewStepOutputSchema, FALLBACK)
      _context.logger.info('Review parsed via XML block', { issueCount: xmlResult.issues.length })
      return xmlResult
    }
    _context.logger.debug('XML block not found, trying regex fallback')

    // Strategy 3: Regex JSON extraction fallback
    const parsed = tryParseJson<ReviewStepOutput>(aiResult.content)
    if (parsed?.issues && Array.isArray(parsed.issues)) {
      _context.logger.info('Review parsed via regex JSON extraction', {
        issueCount: parsed.issues.length,
      })
      return parsed
    }

    _context.logger.warn('All review parsing strategies failed, returning empty issues')
    return FALLBACK
  },
}
