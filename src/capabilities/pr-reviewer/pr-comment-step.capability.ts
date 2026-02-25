import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { postOrUpdateComment } from '../../core/utils/github-comment.js'
import {
  type PrCommentState,
  REVIEWER_STATE_MARKER,
  serializeState,
} from '../../core/utils/pr-comment-state.js'
import type {
  CommentStepInput,
  CommentStepOutput,
  ReviewIssue,
  ReviewIssueData,
} from './pr-reviewer.schema.js'
import { CommentStepInputSchema } from './pr-reviewer.schema.js'

/** Maximum total issues to report in a PR comment. */
const MAX_REPORTED_ISSUES = 7

/** Maximum MEDIUM-severity issues to include (beyond this, only CRITICAL/HIGH). */
const MAX_MEDIUM_ISSUES = 3

/** Severity sort order (highest first). */
const SEVERITY_ORDER: Record<string, number> = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 }

/**
 * Filter and cap issues for reporting: suppress LOW, limit MEDIUM to 3, cap total at 7.
 * Returns issues sorted by severity (highest first).
 */
function filterIssuesForReport(issues: ReviewIssue[]): ReviewIssue[] {
  // Suppress LOW severity by default
  const nonLow = issues.filter((i) => i.severity !== 'LOW')

  // Sort by severity (highest first)
  const sorted = [...nonLow].sort(
    (a, b) => (SEVERITY_ORDER[a.severity] ?? 3) - (SEVERITY_ORDER[b.severity] ?? 3),
  )

  // Cap MEDIUM issues at MAX_MEDIUM_ISSUES
  let mediumCount = 0
  const capped = sorted.filter((issue) => {
    if (issue.severity === 'MEDIUM') {
      mediumCount++
      return mediumCount <= MAX_MEDIUM_ISSUES
    }
    return true
  })

  // Cap total at MAX_REPORTED_ISSUES
  return capped.slice(0, MAX_REPORTED_ISSUES)
}

/**
 * Map internal ReviewIssue to the public ReviewIssueData schema.
 */
function mapIssuesToData(issues: ReviewIssue[]): ReviewIssueData[] {
  return issues.map((issue) => ({
    id: issue.issue_id,
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
 * Build hidden state marker for cross-round tracking.
 */
function buildStateMarker(data: CommentStepInput): string {
  const issueStates: Record<string, 'open' | 'fixed'> = {}
  for (const issue of data.issues) {
    if (issue.issue_id) {
      issueStates[issue.issue_id] = 'open'
    }
  }
  const state: PrCommentState = {
    v: 1,
    round: 1,
    sha: '',
    issues: issueStates,
  }
  return serializeState(REVIEWER_STATE_MARKER, state)
}

/**
 * Build the "Issues Data" JSON code block for downstream tools.
 */
function buildIssuesDataSection(issues: ReviewIssue[]): string {
  const data = mapIssuesToData(issues)
  return ['### Issues Data', '', '```json', JSON.stringify(data, null, 2), '```'].join('\n')
}

/**
 * Build comment body from input. Exported for testing.
 */
export function buildCommentBody(data: CommentStepInput): string {
  return data.issues.length === 0 ? buildApprovalComment(data) : buildFullReportComment(data)
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
    '',
    buildStateMarker(data),
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

  // Apply severity filtering for display (cap at 7, suppress LOW, limit MEDIUM)
  const reportedIssues = filterIssuesForReport(data.issues)
  const manualIssues = reportedIssues.filter((i) => !i.auto_fixable)
  const suppressedCount = data.issues.length - reportedIssues.length

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

  if (suppressedCount > 0) {
    lines.push(
      `*${suppressedCount} lower-priority issue(s) suppressed. See Issues Data below for full list.*`,
      '',
    )
  }

  // Issues Data includes ALL issues (unfiltered) for downstream tools like pr_fixer
  lines.push(buildIssuesDataSection(data.issues))
  lines.push('')
  lines.push('*Automated review by PR Reviewer*')
  lines.push('')
  lines.push(buildStateMarker(data))
  return lines.join('\n')
}

// ---------------------------------------------------------------------------
// Capability definition (no AI agent — purely programmatic)
// ---------------------------------------------------------------------------

/**
 * Minimal prompt that returns immediately. The actual comment posting
 * happens in processResult() via execSync, guaranteeing the state marker
 * is preserved exactly as built.
 */
const COMMENT_PROMPT_V3: PromptVersion = {
  version: 'v3',
  createdAt: '2026-02-24',
  description: 'Programmatic comment posting — no AI agent needed',
  deprecated: false,
  sunsetDate: undefined,
  build: (_input: unknown) => ({
    systemPrompt: 'You are a no-op assistant. Return the JSON exactly as shown.',
    userPrompt: 'Return this JSON: {"status":"ready"}',
  }),
}

const PROMPT_VERSIONS: PromptRegistry = { v3: COMMENT_PROMPT_V3 }
const CURRENT_VERSION = 'v3'

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
    model: 'haiku',
    maxTurns: 1,
    maxBudgetUsd: 0.01,
  },
  preparePromptInput: (input: CommentStepInput, _context: CapabilityContext) => input,
  processResult: (
    input: CommentStepInput,
    _aiResult: AIQueryResult,
    context: CapabilityContext,
  ): CommentStepOutput => {
    const ctx = input.pr_context
    const commentBody =
      input.issues.length === 0 ? buildApprovalComment(input) : buildFullReportComment(input)

    try {
      const commentUrl = postOrUpdateComment(
        ctx.repo_owner,
        ctx.repo_name,
        ctx.pr_number,
        commentBody,
        '<!-- pr-review-state:',
      )
      context.logger.info('PR comment posted programmatically', { commentUrl })
      return {
        comment_url: commentUrl,
        inline_comments_posted: 0,
        summary_posted: true,
      }
    } catch (error) {
      context.logger.error('Failed to post PR comment', {
        error: error instanceof Error ? error.message : String(error),
      })
      return {
        comment_url: '',
        inline_comments_posted: 0,
        summary_posted: false,
      }
    }
  },
}
