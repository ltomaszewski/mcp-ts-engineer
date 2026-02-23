import type {
  CapabilityDefinition,
  CapabilityContext,
} from '../../core/capability-registry/capability-registry.types.js'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseXmlBlock, parseJsonSafe } from '../../core/utils/index.js'
import { tryExtractCommentUrl } from './pr-reviewer.helpers.js'
import {
  CommentStepInputSchema,
  CommentStepOutputSchema,
  COMMENT_OUTPUT_JSON_SCHEMA,
} from './pr-reviewer.schema.js'
import type {
  CommentStepInput,
  CommentStepOutput,
  ReviewIssue,
  ReviewIssueData,
} from './pr-reviewer.schema.js'

/**
 * Map internal ReviewIssue to the public ReviewIssueData schema.
 */
function mapIssuesToData(issues: ReviewIssue[]): ReviewIssueData[] {
  return issues.map((issue) => ({
    file: issue.file_path,
    line: issue.line ?? null,
    severity: issue.severity,
    category: issue.category ?? '',
    title: issue.title,
    description: issue.details,
    suggestedFix: issue.suggestion ?? '',
    autoFixable: issue.auto_fixable,
  }))
}

/**
 * Build the "Issues Data" JSON code block for downstream tools.
 */
function buildIssuesDataSection(issues: ReviewIssue[]): string {
  const data = mapIssuesToData(issues)
  return ['### Issues Data', '', '```json', JSON.stringify(data, null, 2), '```'].join('\n')
}

/**
 * Build the approval comment body for zero-issues case.
 */
function buildApprovalComment(data: CommentStepInput): string {
  return [
    '## ✅ PR Review — Approved',
    '',
    'No issues found. Code looks good!',
    '',
    `| Detail | Value |`,
    `|--------|-------|`,
    `| Issues | 0 |`,
    `| Cost | $${data.cost_usd.toFixed(2)} |`,
    '',
    buildIssuesDataSection([]),
    '',
    '*Automated review by PR Reviewer*',
  ].join('\n')
}

/**
 * Determine the comment header based on issue severity and unfixed counts.
 */
function getCommentHeader(
  hasCriticalOrHigh: boolean,
  unfixedAutoFixableCount: number,
  unfixedMediumCount: number,
): string {
  if (hasCriticalOrHigh) return '## ⚠️ PR Review — Changes Requested'
  if (unfixedAutoFixableCount > 0) return '## ⚠️ PR Review — Changes Requested (Auto-Fix Failed)'
  if (unfixedMediumCount >= 3) return '## 📋 PR Review — Needs Attention'
  return '## 📋 PR Review — Approved with Comments'
}

/**
 * Build the full report comment body for issues-found case.
 */
function buildFullReportComment(data: CommentStepInput): string {
  const criticalIssues = data.issues.filter((i) => i.severity === 'CRITICAL')
  const highIssues = data.issues.filter((i) => i.severity === 'HIGH')
  const mediumIssues = data.issues.filter((i) => i.severity === 'MEDIUM')
  const lowIssues = data.issues.filter((i) => i.severity === 'LOW')
  const manualIssues = data.issues.filter((i) => !i.auto_fixable)

  const hasCriticalOrHigh = criticalIssues.length > 0 || highIssues.length > 0
  const unfixedAutoFixableCount = data.unfixed_auto_fixable_count ?? 0
  const unfixedMediumCount = data.unfixed_medium_count ?? 0
  const header = getCommentHeader(hasCriticalOrHigh, unfixedAutoFixableCount, unfixedMediumCount)

  const lines: string[] = [
    header,
    '',
    `| Severity | Count |`,
    `|----------|-------|`,
    `| Critical | ${criticalIssues.length} |`,
    `| High | ${highIssues.length} |`,
    `| Medium | ${mediumIssues.length} |`,
    `| Low | ${lowIssues.length} |`,
    '',
    `**Fixes Applied**: ${data.fixes_applied} | **Cost**: $${data.cost_usd.toFixed(2)}`,
    '',
  ]

  // Section: Failed auto-fixes (FR-5)
  if (unfixedAutoFixableCount > 0) {
    lines.push(
      '### Failed Auto-Fixes',
      '',
      `${unfixedAutoFixableCount} issue(s) were classified as auto-fixable but could not be fixed automatically. These must be addressed before merge.`,
      '',
    )
  }

  // Section: Unfixed MEDIUM issues (FR-5)
  if (unfixedMediumCount >= 3) {
    lines.push(
      '### Unfixed Medium Issues',
      '',
      `${unfixedMediumCount} MEDIUM-severity issue(s) remain unfixed. Review and address these before merge.`,
      '',
    )
  }

  if (manualIssues.length > 0) {
    lines.push('### Issues Requiring Manual Review', '')
    for (const issue of manualIssues) {
      lines.push(
        `#### [${issue.severity}] ${issue.title}`,
        `**File**: \`${issue.file_path}${issue.line ? `:${issue.line}` : ''}\`${issue.category ? ` | **Category**: ${issue.category}` : ''}`,
        '',
        issue.details,
      )
      if (issue.suggestion) {
        lines.push('', `**Suggested Fix**: ${issue.suggestion}`)
      }
      lines.push('')
    }
  }

  if (data.fixes_applied > 0) {
    lines.push(
      `### Auto-Fixed Issues`,
      '',
      `${data.fixes_applied} issue(s) were automatically fixed and committed.`,
      '',
    )
  }

  lines.push(buildIssuesDataSection(data.issues))
  lines.push('')
  lines.push('*Automated review by PR Reviewer*')
  return lines.join('\n')
}

const COMMENT_PROMPT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Post review summary as GitHub PR comment',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as CommentStepInput
    const ctx = data.pr_context
    const commentBody =
      data.issues.length === 0 ? buildApprovalComment(data) : buildFullReportComment(data)

    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Post PR Review Comment

You MUST post a comment on PR #${ctx.pr_number} in ${ctx.repo_owner}/${ctx.repo_name}.
This is MANDATORY — always post the comment regardless of whether issues were found.

## Comment Body

Post EXACTLY this comment body (do not modify it):

\`\`\`
${commentBody}
\`\`\`

## Steps

1. **Post the comment** using the gh CLI command below. Use a HEREDOC to preserve formatting:

\`\`\`bash
gh pr comment ${ctx.pr_number} --repo ${ctx.repo_owner}/${ctx.repo_name} --body "$(cat <<'COMMENT_EOF'
${commentBody}
COMMENT_EOF
)"
\`\`\`

2. **Capture the comment URL** from the gh command output (it prints the URL of the created comment).

3. **Return JSON result** with the comment URL:

\`\`\`json
{
  "comment_url": "<URL from gh output>",
  "inline_comments_posted": 0,
  "summary_posted": true
}
\`\`\`

IMPORTANT: You MUST run the gh command and return the resulting URL. Do NOT skip posting.

Begin now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: COMMENT_PROMPT_V1 }
const CURRENT_VERSION = 'v1'

export const prCommentStepCapability: CapabilityDefinition<CommentStepInput, CommentStepOutput> = {
  id: 'pr_comment_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Comment Step',
  description: 'Post formatted review summary as GitHub PR comment',
  inputSchema: CommentStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 30,
    maxBudgetUsd: 1.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: COMMENT_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: CommentStepInput, _context: CapabilityContext) => input,
  processResult: (
    _input: CommentStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): CommentStepOutput => {
    // Strategy 1: SDK structured output
    if (aiResult.structuredOutput) {
      const validated = CommentStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success && validated.data.comment_url) return validated.data
    }

    // Strategy 2: XML block fallback
    const xmlContent = parseXmlBlock(aiResult.content, 'comment_result')
    if (xmlContent) {
      const extractedUrl = tryExtractCommentUrl(aiResult.content)
      const urlFallback: CommentStepOutput = {
        comment_url: extractedUrl,
        inline_comments_posted: 0,
        summary_posted: extractedUrl.length > 0,
      }
      return parseJsonSafe(xmlContent, CommentStepOutputSchema, urlFallback)
    }

    // Strategy 3: Extract comment URL directly from AI output
    const extractedUrl = tryExtractCommentUrl(aiResult.content)
    return {
      comment_url: extractedUrl,
      inline_comments_posted: 0,
      summary_posted: extractedUrl.length > 0,
    }
  },
}
