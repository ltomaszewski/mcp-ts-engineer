import { describe, expect, it } from 'vitest'
import { buildCommentBody, prCommentStepCapability } from '../pr-comment-step.capability.js'
import type { CommentStepInput, ReviewIssue, ReviewIssueData } from '../pr-reviewer.schema.js'

const makeCommentStepInput = (
  issues: ReviewIssue[],
  overrides?: Partial<CommentStepInput>,
): CommentStepInput => ({
  pr_context: {
    pr_number: 42,
    repo_owner: 'test-owner',
    repo_name: 'test-repo',
    pr_branch: 'feat/test',
    base_branch: 'main',
    files_changed: ['src/test.ts'],
    diff_content: 'diff content',
    is_draft: false,
    is_closed: false,
  },
  issues,
  fixes_applied: 0,
  issues_fixed: [],
  cost_usd: 0.05,
  mode: 'review-fix',
  incremental: false,
  unfixed_medium_count: 0,
  unfixed_auto_fixable_count: 0,
  round: 1,
  head_sha: '',
  ...overrides,
})

const makeMockIssue = (overrides?: Partial<ReviewIssue>): ReviewIssue => ({
  severity: 'HIGH',
  category: 'security',
  title: 'Test issue title',
  file_path: 'src/test.ts',
  line: 42,
  details: 'Test issue details',
  suggestion: 'Fix the issue',
  auto_fixable: false,
  confidence: 85,
  ...overrides,
})

function extractIssuesDataJson(body: string): ReviewIssueData[] {
  const match = body.match(/### Issues Data\n\n```json\n([\s\S]*?)\n```/)
  if (!match?.[1]) throw new Error('Issues Data section not found in comment body')
  return JSON.parse(match[1]) as ReviewIssueData[]
}

describe('prCommentStepCapability definition metadata', () => {
  it('has maxBudgetUsd of 0.5', () => {
    expect(prCommentStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(0.5)
  })

  it('has maxTurns of 1', () => {
    expect(prCommentStepCapability.defaultRequestOptions?.maxTurns).toBe(1)
  })

  it('uses haiku model', () => {
    expect(prCommentStepCapability.defaultRequestOptions?.model).toBe('haiku')
  })
})

describe('pr-comment-step: Auto-Fixed Issues detail', () => {
  it('lists fixed issue titles as bullet points', () => {
    const input = makeCommentStepInput(
      [makeMockIssue({ auto_fixable: true })],
      { fixes_applied: 2, issues_fixed: ['Title A', 'Title B'] },
    )
    const body = buildCommentBody(input)

    expect(body).toContain('### Auto-Fixed Issues')
    expect(body).toContain('- ✅ Title A')
    expect(body).toContain('- ✅ Title B')
    expect(body).not.toContain('issue(s) were automatically fixed and committed')
  })

  it('falls back to count when issues_fixed is empty', () => {
    const input = makeCommentStepInput(
      [makeMockIssue({ auto_fixable: true })],
      { fixes_applied: 2, issues_fixed: [] },
    )
    const body = buildCommentBody(input)

    expect(body).toContain('### Auto-Fixed Issues')
    expect(body).toContain('2 issue(s) were automatically fixed and committed.')
  })

  it('falls back to count when issues_fixed is undefined (backward compat)', () => {
    const input = makeCommentStepInput(
      [makeMockIssue({ auto_fixable: true })],
      { fixes_applied: 3 },
    )
    const body = buildCommentBody(input)

    expect(body).toContain('### Auto-Fixed Issues')
    expect(body).toContain('3 issue(s) were automatically fixed and committed.')
  })
})

describe('pr-comment-step: Issues Data section', () => {
  describe('approval comment (zero issues)', () => {
    it('includes empty Issues Data section', () => {
      const input = makeCommentStepInput([])
      const body = buildCommentBody(input)

      expect(body).toContain('### Issues Data')
      expect(body).toContain('```json')
      const data = extractIssuesDataJson(body)
      expect(data).toEqual([])
    })

    it('Issues Data section appears before footer', () => {
      const input = makeCommentStepInput([])
      const body = buildCommentBody(input)

      const issuesDataIdx = body.indexOf('### Issues Data')
      const footerIdx = body.indexOf('*Automated review by PR Reviewer*')

      expect(issuesDataIdx).toBeGreaterThan(-1)
      expect(footerIdx).toBeGreaterThan(-1)
      expect(issuesDataIdx).toBeLessThan(footerIdx)
    })

    it('includes state marker after footer', () => {
      const input = makeCommentStepInput([])
      const body = buildCommentBody(input)

      expect(body).toContain('<!-- pr-review-state:')
    })
  })

  describe('full report comment (with issues)', () => {
    it('includes Issues Data section with all issues', () => {
      const issues = [
        makeMockIssue({ severity: 'CRITICAL', title: 'Critical bug' }),
        makeMockIssue({ severity: 'LOW', title: 'Minor style' }),
      ]
      const input = makeCommentStepInput(issues)
      const body = buildCommentBody(input)

      const data = extractIssuesDataJson(body)
      expect(data).toHaveLength(2)
      expect(data[0]?.severity).toBe('CRITICAL')
      expect(data[0]?.title).toBe('Critical bug')
      expect(data[1]?.severity).toBe('LOW')
      expect(data[1]?.title).toBe('Minor style')
    })

    it('Issues Data section appears after issue details, before footer', () => {
      const issues = [makeMockIssue()]
      const input = makeCommentStepInput(issues)
      const body = buildCommentBody(input)

      const issueDetailsIdx = body.indexOf('### Issues Requiring Manual Review')
      const issuesDataIdx = body.indexOf('### Issues Data')
      const footerIdx = body.indexOf('*Automated review by PR Reviewer*')

      expect(issueDetailsIdx).toBeGreaterThan(-1)
      expect(issuesDataIdx).toBeGreaterThan(issueDetailsIdx)
      expect(footerIdx).toBeGreaterThan(issuesDataIdx)
    })

    it('maps ReviewIssue fields to ReviewIssueData correctly', () => {
      const issue = makeMockIssue({
        file_path: 'src/auth.ts',
        line: 99,
        severity: 'MEDIUM',
        category: 'performance',
        title: 'Slow query',
        details: 'N+1 query detected',
        suggestion: 'Use batch loading',
        auto_fixable: true,
      })
      const input = makeCommentStepInput([issue])
      const body = buildCommentBody(input)
      const data = extractIssuesDataJson(body)

      expect(data[0]).toEqual({
        file: 'src/auth.ts',
        line: 99,
        severity: 'MEDIUM',
        category: 'performance',
        title: 'Slow query',
        description: 'N+1 query detected',
        suggestedFix: 'Use batch loading',
        autoFixable: true,
      })
    })

    it('maps null line values correctly', () => {
      const issue = makeMockIssue({ line: undefined })
      const input = makeCommentStepInput([issue])
      const body = buildCommentBody(input)
      const data = extractIssuesDataJson(body)

      expect(data[0]?.line).toBeNull()
    })

    it('maps missing category/suggestion to empty strings', () => {
      const issue = makeMockIssue({
        category: undefined,
        suggestion: undefined,
      })
      const input = makeCommentStepInput([issue])
      const body = buildCommentBody(input)
      const data = extractIssuesDataJson(body)

      expect(data[0]?.category).toBe('')
      expect(data[0]?.suggestedFix).toBe('')
    })

    it('includes state marker with issue IDs', () => {
      const issues = [
        makeMockIssue({ issue_id: 'abc123', title: 'Issue 1' }),
        makeMockIssue({ issue_id: 'def456', title: 'Issue 2' }),
      ]
      const input = makeCommentStepInput(issues)
      const body = buildCommentBody(input)

      expect(body).toContain('<!-- pr-review-state:')
      expect(body).toContain('"abc123":"open"')
      expect(body).toContain('"def456":"open"')
    })
  })
})
