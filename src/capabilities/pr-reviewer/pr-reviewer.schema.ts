/**
 * Zod schemas for PR reviewer capability input/output.
 */

import { z } from 'zod'
import { isValidGitRef, isValidGitSha, isValidPath } from '../../core/utils/shell-safe.js'

/** Git ref (branch/tag) pattern: alphanumeric, dots, hyphens, underscores, slashes. */
const gitRefSchema = z.string().refine(isValidGitRef, {
  message: 'Invalid git ref: must contain only alphanumeric, dot, hyphen, underscore, slash characters',
})

/** Git SHA pattern: 7-40 lowercase hex characters. */
const gitShaSchema = z.string().refine(isValidGitSha, {
  message: 'Invalid git SHA: must be 7-40 hex characters',
})

/** Safe filesystem path pattern: no shell metacharacters or path traversal. */
const safePathSchema = z.string().refine(isValidPath, {
  message: 'Invalid path: must not contain shell metacharacters or path traversal',
})

// ---------------------------------------------------------------------------
// Main capability schemas
// ---------------------------------------------------------------------------

/** Input schema for pr_reviewer tool. */
export const PrReviewerInputSchema = z.object({
  pr: z.string().min(1, 'PR number or URL is required'),
  mode: z.enum(['review-fix']).default('review-fix'),
  incremental: z.boolean().default(false),
  budget: z.number().positive().optional(),
  cwd: z.string().optional(),
}) as z.ZodType<{
  pr: string
  mode: 'review-fix'
  incremental: boolean
  budget?: number
  cwd?: string
}>

export type PrReviewerInput = z.infer<typeof PrReviewerInputSchema>

/** Output schema for pr_reviewer tool. */
export const PrReviewerOutputSchema = z.object({
  status: z.enum(['success', 'partial', 'failed']),
  issues_found: z.number().min(0),
  issues_fixed: z.number().min(0),
  critical_count: z.number().min(0),
  high_count: z.number().min(0),
  medium_count: z.number().min(0),
  low_count: z.number().min(0),
  unfixed_medium_count: z.number().min(0),
  unfixed_auto_fixable_count: z.number().min(0),
  comment_url: z.string(),
  cost_usd: z.number().min(0),
  worktree_path: z.string().optional(),
  round: z.number().min(1).optional(),
  last_reviewed_sha: z.string().optional(),
  summary: z.string().optional(),
})

export type PrReviewerOutput = z.infer<typeof PrReviewerOutputSchema>

// ---------------------------------------------------------------------------
// Shared internal schemas
// ---------------------------------------------------------------------------

/** Review issue type (defined explicitly to avoid Zod .default() input/output mismatch). */
export interface ReviewIssue {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  category?: 'code-quality' | 'security' | 'architecture' | 'performance'
  title: string
  file_path: string
  line?: number
  details: string
  suggestion?: string
  auto_fixable: boolean
  confidence: number
  /** Deterministic issue ID (SHA-256 of file_path + title, 12 hex chars). */
  issue_id?: string
}

/** Structured issue data for PR comments, consumed by downstream tools (e.g. pr_fixer). */
export interface ReviewIssueData {
  /** Deterministic issue ID for cross-round tracking. */
  id?: string
  file: string
  line: number | null
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW'
  category: string
  title: string
  description: string
  suggestedFix: string
  autoFixable: boolean
}

/** Normalize AI-returned category values (underscores → hyphens). */
const categoryEnum = z.preprocess(
  (v) => (typeof v === 'string' ? v.replace(/_/g, '-') : v),
  z.enum(['code-quality', 'security', 'architecture', 'performance']),
)

/** Normalize AI-returned severity values (INFO → LOW, WARNING → MEDIUM, case-insensitive). */
const severityEnum = z.preprocess(
  (v) => {
    if (typeof v !== 'string') return v
    const upper = v.toUpperCase()
    if (upper === 'INFO') return 'LOW'
    if (upper === 'WARN' || upper === 'WARNING') return 'MEDIUM'
    return upper
  },
  z.enum(['CRITICAL', 'HIGH', 'MEDIUM', 'LOW']),
)

/** Review issue structure (used internally by review steps). */
export const ReviewIssueSchema = z.object({
  severity: severityEnum,
  category: categoryEnum.optional(),
  title: z.string(),
  file_path: z.string(),
  line: z.number().positive().optional(),
  details: z.string(),
  suggestion: z.string().optional(),
  auto_fixable: z.boolean().default(false),
  confidence: z.number().min(0).max(100).default(70),
  issue_id: z.string().optional(),
}) as z.ZodType<ReviewIssue>

/** PR context structure (used internally).
 *
 * NOTE: AI agents return `null` for absent fields (not `undefined`).
 * - `z.preprocess()` coerces missing/null → sensible defaults
 * - `as z.ZodType<PrContext>` keeps input/output types aligned
 *   (same pattern as PrReviewerInputSchema above)
 */
export interface PrContext {
  pr_number: number
  repo_owner: string
  repo_name: string
  pr_branch: string
  base_branch: string
  files_changed: string[]
  diff_content: string
  is_draft: boolean
  is_closed: boolean
  last_reviewed_sha?: string | null
}

export const PrContextSchema = z.object({
  pr_number: z.number(),
  repo_owner: z.string(),
  repo_name: z.string(),
  pr_branch: gitRefSchema,
  base_branch: gitRefSchema,
  files_changed: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.string())),
  diff_content: z.preprocess((v) => (typeof v === 'string' ? v : ''), z.string()),
  is_draft: z.preprocess((v) => (typeof v === 'boolean' ? v : false), z.boolean()),
  is_closed: z.preprocess((v) => (typeof v === 'boolean' ? v : false), z.boolean()),
  last_reviewed_sha: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    gitShaSchema.nullish(),
  ),
}) as z.ZodType<PrContext>

// ---------------------------------------------------------------------------
// Step capability schemas
// ---------------------------------------------------------------------------

/** Preflight step input. */
export const PreflightStepInputSchema = z.object({
  pr: z.string(),
  incremental: z.boolean(),
  cwd: z.string().optional(),
})
export type PreflightStepInput = z.infer<typeof PreflightStepInputSchema>

/** Preflight step output. */
export const PreflightStepOutputSchema = z.object({
  proceed: z.boolean(),
  skip_reason: z.string().nullish(),
  pr_context: PrContextSchema.nullish(),
  last_reviewed_sha: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().nullish(),
  ),
  head_sha: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.string().nullish(),
  ),
})
export type PreflightStepOutput = z.infer<typeof PreflightStepOutputSchema>

/** Context step input. */
export const ContextStepInputSchema = z.object({
  pr_context: PrContextSchema,
  cwd: z.string().optional(),
})
export type ContextStepInput = z.infer<typeof ContextStepInputSchema>

/** Context step output. */
export const ContextStepOutputSchema = z.object({
  worktree_path: safePathSchema,
  diff_content: z.string(),
  files_changed: z.array(z.string()),
})
export type ContextStepOutput = z.infer<typeof ContextStepOutputSchema>

/** Review step input. */
export const ReviewStepInputSchema = z.object({
  pr_context: PrContextSchema,
  diff_content: z.string(),
  worktree_path: safePathSchema,
  project_context: z.string().optional(),
  cwd: z.string().optional(),
})
export type ReviewStepInput = z.infer<typeof ReviewStepInputSchema>

/** Review step output (per-agent). */
export const ReviewStepOutputSchema = z.object({
  agent: z.string(),
  issues: z.array(ReviewIssueSchema),
  error: z.string().optional(),
})
export type ReviewStepOutput = z.infer<typeof ReviewStepOutputSchema>

/** Aggregate step input. */
export const AggregateStepInputSchema = z.object({
  agent_results: z.array(ReviewStepOutputSchema),
  /** Previous review issues from prior runs (for cross-run deduplication). */
  previous_issues: z.array(ReviewIssueSchema).optional(),
})
export type AggregateStepInput = z.infer<typeof AggregateStepInputSchema>

/** Aggregate step output. */
export const AggregateStepOutputSchema = z.object({
  issues: z.array(ReviewIssueSchema),
  deduped_count: z.number(),
})
export type AggregateStepOutput = z.infer<typeof AggregateStepOutputSchema>

/** Validate step input. */
export const ValidateStepInputSchema = z.object({
  issues: z.array(ReviewIssueSchema),
  agent_results: z.array(ReviewStepOutputSchema),
  feedback_log_path: z.string().optional(),
})
export type ValidateStepInput = z.infer<typeof ValidateStepInputSchema>

/** Validate step output. */
export const ValidateStepOutputSchema = z.object({
  issues: z.array(ReviewIssueSchema),
  auto_fixable: z.array(ReviewIssueSchema),
  manual: z.array(ReviewIssueSchema),
  filtered_count: z.number(),
})
export type ValidateStepOutput = z.infer<typeof ValidateStepOutputSchema>

/** Fix step input. */
export const FixStepInputSchema = z.object({
  issues: z.array(ReviewIssueSchema),
  worktree_path: safePathSchema,
  budget_remaining: z.number(),
  project_context: z.string().optional(),
  cwd: z.string().optional(),
})
export type FixStepInput = z.infer<typeof FixStepInputSchema>

/** Fix step output. */
export const FixStepOutputSchema = z.object({
  fixes_applied: z.number(),
  fixes_failed: z.number(),
  issues_fixed: z.array(z.string()),
  budget_spent: z.number(),
})
export type FixStepOutput = z.infer<typeof FixStepOutputSchema>

/** Cleanup step input. */
export const CleanupStepInputSchema = z.object({
  worktree_path: safePathSchema,
  files_changed: z.preprocess((v) => (Array.isArray(v) ? v : []), z.array(z.string())),
  cwd: z.string().optional(),
}) as z.ZodType<{
  worktree_path: string
  files_changed: string[]
  cwd?: string
}>
export type CleanupStepInput = z.infer<typeof CleanupStepInputSchema>

/** Cleanup step output. */
export const CleanupStepOutputSchema = z.object({
  unused_exports_found: z.number(),
  unused_exports_removed: z.number(),
  tsc_passed: z.boolean(),
})
export type CleanupStepOutput = z.infer<typeof CleanupStepOutputSchema>

/** Test step input. */
export const TestStepInputSchema = z.object({
  worktree_path: safePathSchema,
  files_changed: z.array(z.string()),
  cwd: z.string().optional(),
})
export type TestStepInput = z.infer<typeof TestStepInputSchema>

/** Test step output. */
export const TestStepOutputSchema = z.object({
  tests_passed: z.boolean(),
  workspaces_tested: z.array(z.string()),
  reverts_needed: z.number(),
})
export type TestStepOutput = z.infer<typeof TestStepOutputSchema>

/** Commit step input. */
export const CommitStepInputSchema = z.object({
  worktree_path: safePathSchema,
  pr_branch: gitRefSchema,
  fixes_applied: z.number(),
  issues_fixed: z.array(z.string()).default([]),
  cwd: z.string().optional(),
})
export type CommitStepInput = z.infer<typeof CommitStepInputSchema>

/** Commit step output. */
export const CommitStepOutputSchema = z.object({
  committed: z.boolean(),
  pushed: z.boolean(),
  commit_sha: z.string().optional(),
})
export type CommitStepOutput = z.infer<typeof CommitStepOutputSchema>

/** Revert/cleanup step input. */
export const RevertStepInputSchema = z.object({
  worktree_path: safePathSchema.optional(),
  lock_file_path: safePathSchema.optional(),
  cwd: z.string().optional(),
})
export type RevertStepInput = z.infer<typeof RevertStepInputSchema>

/** Revert/cleanup step output. */
export const RevertStepOutputSchema = z.object({
  worktree_removed: z.boolean(),
  lock_removed: z.boolean(),
})
export type RevertStepOutput = z.infer<typeof RevertStepOutputSchema>

/** Comment step input. */
export const CommentStepInputSchema = z.object({
  pr_context: PrContextSchema,
  issues: z.array(ReviewIssueSchema),
  fixes_applied: z.number(),
  issues_fixed: z.array(z.string()).default([]),
  cost_usd: z.number(),
  mode: z.enum(['review-fix']),
  incremental: z.boolean(),
  unfixed_medium_count: z.number().min(0).default(0),
  unfixed_auto_fixable_count: z.number().min(0).default(0),
  round: z.number().min(1).default(1),
  head_sha: z.string().default(''),
  cwd: z.string().optional(),
})
export type CommentStepInput = z.infer<typeof CommentStepInputSchema>

/** Comment step output. */
export const CommentStepOutputSchema = z.object({
  comment_url: z.string(),
  inline_comments_posted: z.number(),
  summary_posted: z.boolean(),
})
export type CommentStepOutput = z.infer<typeof CommentStepOutputSchema>

// ---------------------------------------------------------------------------
// JSON Schemas for structured output (SDK outputFormat)
// Re-exported from pr-reviewer.json-schemas.ts for backward compatibility
// ---------------------------------------------------------------------------

export {
  AGGREGATE_OUTPUT_JSON_SCHEMA,
  CLEANUP_OUTPUT_JSON_SCHEMA,
  COMMENT_OUTPUT_JSON_SCHEMA,
  COMMIT_OUTPUT_JSON_SCHEMA,
  CONTEXT_OUTPUT_JSON_SCHEMA,
  FIX_OUTPUT_JSON_SCHEMA,
  PREFLIGHT_OUTPUT_JSON_SCHEMA,
  REVERT_OUTPUT_JSON_SCHEMA,
  REVIEW_OUTPUT_JSON_SCHEMA,
  TEST_OUTPUT_JSON_SCHEMA,
  VALIDATE_OUTPUT_JSON_SCHEMA,
} from './pr-reviewer.json-schemas.js'

// ---------------------------------------------------------------------------
// Fallback constants
// ---------------------------------------------------------------------------

export const PR_REVIEWER_OUTPUT_FALLBACK: PrReviewerOutput = {
  status: 'failed',
  issues_found: 0,
  issues_fixed: 0,
  critical_count: 0,
  high_count: 0,
  medium_count: 0,
  low_count: 0,
  unfixed_medium_count: 0,
  unfixed_auto_fixable_count: 0,
  comment_url: '',
  cost_usd: 0,
}
