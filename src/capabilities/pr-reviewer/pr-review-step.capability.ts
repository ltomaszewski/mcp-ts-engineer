import type {
  CapabilityDefinition,
  CapabilityContext,
} from '../../core/capability-registry/capability-registry.types.js'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseXmlBlock, parseJsonSafe } from '../../core/utils/index.js'
import { tryParseJson } from './pr-reviewer.helpers.js'
import {
  ReviewStepInputSchema,
  ReviewStepOutputSchema,
  REVIEW_OUTPUT_JSON_SCHEMA,
} from './pr-reviewer.schema.js'
import type { ReviewStepInput, ReviewStepOutput } from './pr-reviewer.schema.js'

const REVIEW_PROMPT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Comprehensive multi-category code review',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as ReviewStepInput
    const ctx = data.pr_context

    // Build project context section if available
    const projectContextSection = data.project_context
      ? `## Project-Specific Rules & Patterns

${data.project_context}

`
      : ''

    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Code Review

You are reviewing PR #${ctx.pr_number} in ${ctx.repo_owner}/${ctx.repo_name}.

## Context

Worktree: ${data.worktree_path}
Branch: ${ctx.pr_branch} → ${ctx.base_branch}
Files Changed: ${ctx.files_changed.length}

${projectContextSection}## Review Categories

Analyze from ALL of these perspectives:

### 1. Code Quality
- Biome/lint violations, TypeScript anti-patterns
- Unused variables, dead code
- Naming conventions, readability

### 2. Security
- Input validation, auth/authz bypass risks
- Secret handling, injection vulnerabilities
- Error messages leaking sensitive data

### 3. Architecture
- SOLID violations, circular dependencies
- Coupling, cohesion issues
- Design pattern misuse

### 4. Performance
- N+1 queries, unnecessary re-renders
- Memory leaks, large bundles
- Missing caching opportunities

## Files to Review

${ctx.files_changed.map((f) => `- ${f}`).join('\n')}

## Diff

\`\`\`diff
${data.diff_content.substring(0, 50000)}
\`\`\`

## Instructions

1. Read each changed file in the worktree at ${data.worktree_path}
2. Analyze for issues across all categories
3. For each issue, provide structured output

## Auto-Fixable Classification

When setting auto_fixable, be LIBERAL — prefer true when in doubt. The following patterns MUST be classified as auto_fixable=true:
- Missing error handling (add try/catch + logger)
- Enum registration (GraphQL enum exposed as String)
- Missing pagination args on resolvers
- Type extraction (inline type to named type)
- Simple refactors (extract function, rename)
- Missing null checks
- console.log removal
- Unused imports removal
- Silent/empty catch blocks (add error logging)
- Missing return type annotations

Only classify as auto_fixable=false for:
- Architectural redesign
- Business logic changes
- New feature requirements
- Complex algorithm changes

## Output Format

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
      "details": "Detailed explanation of the issue",
      "suggestion": "How to fix it",
      "auto_fixable": true,
      "confidence": 85
    }
  ]
}
\`\`\`

If no issues found, return: { "agent": "multi-review", "issues": [] }

Begin review now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: REVIEW_PROMPT_V1 }
const CURRENT_VERSION = 'v1'

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
