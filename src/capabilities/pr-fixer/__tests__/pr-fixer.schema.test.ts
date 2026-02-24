import { describe, it, expect } from 'vitest'
import {
  PrFixerInputSchema,
  PrFixerOutputSchema,
  PR_FIXER_OUTPUT_FALLBACK,
  ClassifyStepOutputSchema,
  DirectFixStepOutputSchema,
  FixerValidateStepOutputSchema,
  FixerCommitStepOutputSchema,
  FixerCommentStepOutputSchema,
} from '../pr-fixer.schema.js'

// ---------------------------------------------------------------------------
// PrFixerInputSchema
// ---------------------------------------------------------------------------

describe('PrFixerInputSchema', () => {
  it('accepts valid input with pr only', () => {
    const result = PrFixerInputSchema.safeParse({ pr: '42' })
    expect(result.success).toBe(true)
  })

  it('accepts valid input with pr and budget', () => {
    const result = PrFixerInputSchema.safeParse({ pr: '42', budget: 5.0 })
    expect(result.success).toBe(true)
  })

  it('accepts valid input with pr and cwd', () => {
    const result = PrFixerInputSchema.safeParse({ pr: '42', cwd: '/tmp/work' })
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cwd).toBe('/tmp/work')
    }
  })

  it('accepts PR URL', () => {
    const result = PrFixerInputSchema.safeParse({
      pr: 'https://github.com/owner/repo/pull/42',
    })
    expect(result.success).toBe(true)
  })

  it('rejects empty pr string', () => {
    const result = PrFixerInputSchema.safeParse({ pr: '' })
    expect(result.success).toBe(false)
  })

  it('rejects missing pr field', () => {
    const result = PrFixerInputSchema.safeParse({})
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// PrFixerOutputSchema
// ---------------------------------------------------------------------------

describe('PrFixerOutputSchema', () => {
  it('validates success status with per_issue', () => {
    const result = PrFixerOutputSchema.safeParse({
      status: 'success',
      issues_input: 3,
      issues_resolved: 3,
      issues_failed: 0,
      issues_skipped: 0,
      direct_fixes: 3,
      spec_fixes: 0,
      files_changed: ['src/a.ts'],
      cost_usd: 0.75,
      round: 1,
      per_issue: [
        { issue_id: 'abc', title: 'Fix A', status: 'fixed', method: 'direct' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('validates nothing_to_fix status', () => {
    const result = PrFixerOutputSchema.safeParse({
      status: 'nothing_to_fix',
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
    })
    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = PrFixerOutputSchema.safeParse({
      status: 'invalid',
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
    })
    expect(result.success).toBe(false)
  })

  it('rejects negative cost', () => {
    const result = PrFixerOutputSchema.safeParse({
      status: 'success',
      issues_input: 0,
      issues_resolved: 0,
      issues_failed: 0,
      issues_skipped: 0,
      direct_fixes: 0,
      spec_fixes: 0,
      files_changed: [],
      cost_usd: -1,
      round: 1,
      per_issue: [],
    })
    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// PR_FIXER_OUTPUT_FALLBACK
// ---------------------------------------------------------------------------

describe('PR_FIXER_OUTPUT_FALLBACK', () => {
  it('has failed status', () => {
    expect(PR_FIXER_OUTPUT_FALLBACK.status).toBe('failed')
  })

  it('has zero counts', () => {
    expect(PR_FIXER_OUTPUT_FALLBACK.issues_input).toBe(0)
    expect(PR_FIXER_OUTPUT_FALLBACK.issues_resolved).toBe(0)
    expect(PR_FIXER_OUTPUT_FALLBACK.issues_failed).toBe(0)
    expect(PR_FIXER_OUTPUT_FALLBACK.issues_skipped).toBe(0)
    expect(PR_FIXER_OUTPUT_FALLBACK.cost_usd).toBe(0)
  })

  it('validates against schema', () => {
    const result = PrFixerOutputSchema.safeParse(PR_FIXER_OUTPUT_FALLBACK)
    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// Step output schemas
// ---------------------------------------------------------------------------

describe('ClassifyStepOutputSchema', () => {
  it('validates classifications', () => {
    const result = ClassifyStepOutputSchema.safeParse({
      classifications: [
        { issue_id: 'abc', title: 'Fix A', classification: 'direct', reason: 'Simple' },
        { issue_id: 'def', title: 'Fix B', classification: 'skip', reason: 'LOW severity' },
      ],
    })
    expect(result.success).toBe(true)
  })

  it('validates empty classifications', () => {
    const result = ClassifyStepOutputSchema.safeParse({ classifications: [] })
    expect(result.success).toBe(true)
  })
})

describe('DirectFixStepOutputSchema', () => {
  it('validates fix output', () => {
    const result = DirectFixStepOutputSchema.safeParse({
      fixes_applied: 2,
      fixes_failed: 1,
      issues_fixed: ['abc', 'def'],
      issues_failed_ids: ['ghi'],
      files_changed: ['src/a.ts'],
    })
    expect(result.success).toBe(true)
  })
})

describe('FixerValidateStepOutputSchema', () => {
  it('validates pass', () => {
    const result = FixerValidateStepOutputSchema.safeParse({
      tsc_passed: true,
      tests_passed: true,
    })
    expect(result.success).toBe(true)
  })

  it('validates failure', () => {
    const result = FixerValidateStepOutputSchema.safeParse({
      tsc_passed: false,
      tests_passed: false,
    })
    expect(result.success).toBe(true)
  })
})

describe('FixerCommitStepOutputSchema', () => {
  it('validates commit output', () => {
    const result = FixerCommitStepOutputSchema.safeParse({
      committed: true,
      pushed: true,
      commit_sha: 'abc123',
    })
    expect(result.success).toBe(true)
  })
})

describe('FixerCommentStepOutputSchema', () => {
  it('validates comment output', () => {
    const result = FixerCommentStepOutputSchema.safeParse({
      comment_url: 'https://github.com/org/repo/pull/1#issuecomment-123',
      comment_posted: true,
    })
    expect(result.success).toBe(true)
  })
})
