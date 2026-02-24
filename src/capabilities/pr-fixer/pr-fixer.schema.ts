/**
 * Zod schemas for pr_fixer capability input/output.
 */

import { z } from 'zod'

// ---------------------------------------------------------------------------
// Main capability schemas
// ---------------------------------------------------------------------------

/** Input schema for pr_fixer tool. */
export const PrFixerInputSchema = z.object({
  pr: z.string().min(1, 'PR number or URL is required'),
  budget: z.number().positive().optional(),
  cwd: z.string().optional(),
}) as z.ZodType<{ pr: string; budget?: number; cwd?: string }>

export type PrFixerInput = z.infer<typeof PrFixerInputSchema>

/** Per-issue tracking in output. */
export const FixerIssueResultSchema = z.object({
  issue_id: z.string(),
  title: z.string(),
  status: z.enum(['fixed', 'failed', 'skipped']),
  method: z.enum(['direct', 'spec', 'none']),
})

export type FixerIssueResult = z.infer<typeof FixerIssueResultSchema>

/** Output schema for pr_fixer tool. */
export const PrFixerOutputSchema = z.object({
  status: z.enum(['success', 'partial', 'failed', 'nothing_to_fix']),
  issues_input: z.number().min(0),
  issues_resolved: z.number().min(0),
  issues_failed: z.number().min(0),
  issues_skipped: z.number().min(0),
  direct_fixes: z.number().min(0),
  spec_fixes: z.number().min(0),
  files_changed: z.array(z.string()),
  cost_usd: z.number().min(0),
  round: z.number().min(1),
  per_issue: z.array(FixerIssueResultSchema),
})

export type PrFixerOutput = z.infer<typeof PrFixerOutputSchema>

/** Fallback output for error cases. */
export const PR_FIXER_OUTPUT_FALLBACK: PrFixerOutput = {
  status: 'failed',
  issues_input: 0,
  issues_resolved: 0,
  issues_failed: 0,
  issues_skipped: 0,
  direct_fixes: 0,
  spec_fixes: 0,
  files_changed: [],
  cost_usd: 0,
  round: 1,
  per_issue: [],
}

// ---------------------------------------------------------------------------
// Internal step schemas
// ---------------------------------------------------------------------------

/** Classify step output. */
export const ClassifyStepOutputSchema = z.object({
  classifications: z.array(
    z.object({
      issue_id: z.string(),
      title: z.string(),
      classification: z.enum(['direct', 'spec-required', 'skip']),
      reason: z.string(),
    }),
  ),
})

export type ClassifyStepOutput = z.infer<typeof ClassifyStepOutputSchema>

/** Direct fix step output. */
export const DirectFixStepOutputSchema = z.object({
  fixes_applied: z.number(),
  fixes_failed: z.number(),
  issues_fixed: z.array(z.string()),
  issues_failed_ids: z.array(z.string()),
  files_changed: z.array(z.string()),
})

export type DirectFixStepOutput = z.infer<typeof DirectFixStepOutputSchema>

/** Validate step output. */
export const FixerValidateStepOutputSchema = z.object({
  tsc_passed: z.boolean(),
  tests_passed: z.boolean(),
})

export type FixerValidateStepOutput = z.infer<typeof FixerValidateStepOutputSchema>

/** Commit step output. */
export const FixerCommitStepOutputSchema = z.object({
  committed: z.boolean(),
  pushed: z.boolean(),
  commit_sha: z.string().optional(),
})

export type FixerCommitStepOutput = z.infer<typeof FixerCommitStepOutputSchema>

/** Comment step output. */
export const FixerCommentStepOutputSchema = z.object({
  comment_url: z.string(),
  comment_posted: z.boolean(),
})

export type FixerCommentStepOutput = z.infer<typeof FixerCommentStepOutputSchema>

// ---------------------------------------------------------------------------
// JSON Schemas for structured output (SDK outputFormat)
// ---------------------------------------------------------------------------

/** JSON Schema for structured output (SDK outputFormat). */
export const PR_FIXER_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['success', 'partial', 'failed', 'nothing_to_fix'] },
      issues_input: { type: 'number' },
      issues_resolved: { type: 'number' },
      issues_failed: { type: 'number' },
      issues_skipped: { type: 'number' },
      direct_fixes: { type: 'number' },
      spec_fixes: { type: 'number' },
      files_changed: { type: 'array', items: { type: 'string' } },
      cost_usd: { type: 'number' },
      round: { type: 'number' },
      per_issue: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            issue_id: { type: 'string' },
            title: { type: 'string' },
            status: { type: 'string', enum: ['fixed', 'failed', 'skipped'] },
            method: { type: 'string', enum: ['direct', 'spec', 'none'] },
          },
          required: ['issue_id', 'title', 'status', 'method'],
        },
      },
    },
    required: [
      'status',
      'issues_input',
      'issues_resolved',
      'issues_failed',
      'issues_skipped',
      'direct_fixes',
      'spec_fixes',
      'files_changed',
      'cost_usd',
      'round',
      'per_issue',
    ],
  },
}

export const CLASSIFY_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      classifications: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            issue_id: { type: 'string' },
            title: { type: 'string' },
            classification: { type: 'string', enum: ['direct', 'spec-required', 'skip'] },
            reason: { type: 'string' },
          },
          required: ['issue_id', 'title', 'classification', 'reason'],
        },
      },
    },
    required: ['classifications'],
  },
}

export const DIRECT_FIX_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      fixes_applied: { type: 'number' },
      fixes_failed: { type: 'number' },
      issues_fixed: { type: 'array', items: { type: 'string' } },
      issues_failed_ids: { type: 'array', items: { type: 'string' } },
      files_changed: { type: 'array', items: { type: 'string' } },
    },
    required: [
      'fixes_applied',
      'fixes_failed',
      'issues_fixed',
      'issues_failed_ids',
      'files_changed',
    ],
  },
}

export const FIXER_VALIDATE_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      tsc_passed: { type: 'boolean' },
      tests_passed: { type: 'boolean' },
    },
    required: ['tsc_passed', 'tests_passed'],
  },
}

export const FIXER_COMMIT_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      committed: { type: 'boolean' },
      pushed: { type: 'boolean' },
      commit_sha: { type: 'string' },
    },
    required: ['committed', 'pushed'],
  },
}

export const FIXER_COMMENT_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      comment_url: { type: 'string' },
      comment_posted: { type: 'boolean' },
    },
    required: ['comment_url', 'comment_posted'],
  },
}
