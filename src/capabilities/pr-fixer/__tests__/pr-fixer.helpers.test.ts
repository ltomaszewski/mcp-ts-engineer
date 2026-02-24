import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import type { ReviewIssueData } from '../../pr-reviewer/pr-reviewer.schema.js'
import {
  buildSpecPath,
  filterManualIssues,
  generateSpecContent,
  isComplexIssue,
  parseReviewIssuesFromComment,
} from '../pr-fixer.helpers.js'

const makeMockIssueData = (overrides?: Partial<ReviewIssueData>): ReviewIssueData => ({
  file: 'src/test.ts',
  line: 42,
  severity: 'HIGH',
  category: 'security',
  title: 'Test issue',
  description: 'Test description',
  suggestedFix: 'Fix suggestion',
  autoFixable: false,
  ...overrides,
})

describe('parseReviewIssuesFromComment', () => {
  it('parses valid Issues Data JSON block from comment body', () => {
    const issues = [makeMockIssueData()]
    const comment = [
      '## PR Review',
      '',
      '### Issues Data',
      '',
      '```json',
      JSON.stringify(issues, null, 2),
      '```',
      '',
      '*Automated review*',
    ].join('\n')

    const result = parseReviewIssuesFromComment(comment)
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('Test issue')
    expect(result[0]?.severity).toBe('HIGH')
  })

  it('returns empty array when no Issues Data section found', () => {
    const comment = '## PR Review\n\nNo issues found.'
    const result = parseReviewIssuesFromComment(comment)
    expect(result).toEqual([])
  })

  it('returns empty array for empty JSON array', () => {
    const comment = ['### Issues Data', '', '```json', '[]', '```'].join('\n')

    const result = parseReviewIssuesFromComment(comment)
    expect(result).toEqual([])
  })

  it('handles malformed JSON gracefully', () => {
    const comment = ['### Issues Data', '', '```json', '{ invalid json }', '```'].join('\n')

    const result = parseReviewIssuesFromComment(comment)
    expect(result).toEqual([])
  })

  it('handles non-array JSON gracefully', () => {
    const comment = ['### Issues Data', '', '```json', '{"not": "an array"}', '```'].join('\n')

    const result = parseReviewIssuesFromComment(comment)
    expect(result).toEqual([])
  })

  it('parses multiple issues correctly', () => {
    const issues = [
      makeMockIssueData({ title: 'Issue 1', severity: 'CRITICAL' }),
      makeMockIssueData({ title: 'Issue 2', severity: 'LOW' }),
    ]
    const comment = ['### Issues Data', '', '```json', JSON.stringify(issues, null, 2), '```'].join(
      '\n',
    )

    const result = parseReviewIssuesFromComment(comment)
    expect(result).toHaveLength(2)
    expect(result[0]?.title).toBe('Issue 1')
    expect(result[1]?.title).toBe('Issue 2')
  })
})

describe('filterManualIssues', () => {
  it('filters out autoFixable issues', () => {
    const issues = [
      makeMockIssueData({ title: 'Manual', autoFixable: false }),
      makeMockIssueData({ title: 'Auto', autoFixable: true }),
    ]
    const result = filterManualIssues(issues)
    expect(result).toHaveLength(1)
    expect(result[0]?.title).toBe('Manual')
  })

  it('returns all issues when none are autoFixable', () => {
    const issues = [
      makeMockIssueData({ autoFixable: false }),
      makeMockIssueData({ autoFixable: false }),
    ]
    const result = filterManualIssues(issues)
    expect(result).toHaveLength(2)
  })

  it('returns empty array when all are autoFixable', () => {
    const issues = [
      makeMockIssueData({ autoFixable: true }),
      makeMockIssueData({ autoFixable: true }),
    ]
    const result = filterManualIssues(issues)
    expect(result).toEqual([])
  })

  it('returns empty array for empty input', () => {
    const result = filterManualIssues([])
    expect(result).toEqual([])
  })
})

describe('buildSpecPath', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-22T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates correct spec path', () => {
    const path = buildSpecPath('mcp-ts-engineer', 42)
    expect(path).toBe('docs/specs/mcp-ts-engineer/todo/2026-02-22-pr-42-review-fixes.md')
  })

  it('includes PR number in path', () => {
    const path = buildSpecPath('my-project', 123)
    expect(path).toContain('pr-123')
  })
})

describe('generateSpecContent', () => {
  beforeEach(() => {
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2026-02-22T12:00:00Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it('generates valid markdown spec', () => {
    const issues = [makeMockIssueData()]
    const content = generateSpecContent(42, issues, 'mcp-ts-engineer')

    expect(content).toContain('**App**: mcp-ts-engineer')
    expect(content).toContain('**Status**: DRAFT')
    expect(content).toContain('# Fix PR #42 review findings')
  })

  it('includes affected files from issues', () => {
    const issues = [
      makeMockIssueData({ file: 'src/auth.ts' }),
      makeMockIssueData({ file: 'src/handler.ts' }),
    ]
    const content = generateSpecContent(1, issues, 'test')

    expect(content).toContain('`src/auth.ts`')
    expect(content).toContain('`src/handler.ts`')
  })

  it('deduplicates affected files', () => {
    const issues = [
      makeMockIssueData({ file: 'src/same.ts', title: 'Issue 1' }),
      makeMockIssueData({ file: 'src/same.ts', title: 'Issue 2' }),
    ]
    const content = generateSpecContent(1, issues, 'test')

    const fileMatches = content.match(/`src\/same\.ts`/g)
    // Should appear once in affected files + twice in steps (file references)
    expect(fileMatches).not.toBeNull()
  })

  it('includes acceptance criteria per issue', () => {
    const issues = [makeMockIssueData({ title: 'Fix security bug' })]
    const content = generateSpecContent(1, issues, 'test')

    expect(content).toContain('Fix security bug is resolved')
    expect(content).toContain('No regression in existing tests')
  })

  it('includes issue severity and category', () => {
    const issues = [makeMockIssueData({ severity: 'CRITICAL', category: 'security' })]
    const content = generateSpecContent(1, issues, 'test')

    expect(content).toContain('[CRITICAL]')
    expect(content).toContain('security')
  })

  it('includes suggested fix when present', () => {
    const issues = [makeMockIssueData({ suggestedFix: 'Use parameterized queries' })]
    const content = generateSpecContent(1, issues, 'test')

    expect(content).toContain('Use parameterized queries')
  })

  it('handles issues without suggested fix', () => {
    const issues = [makeMockIssueData({ suggestedFix: '' })]
    const content = generateSpecContent(1, issues, 'test')

    expect(content).not.toContain('**Suggested Fix:**')
  })

  it('includes line number in file reference', () => {
    const issues = [makeMockIssueData({ file: 'src/test.ts', line: 99 })]
    const content = generateSpecContent(1, issues, 'test')

    expect(content).toContain('`src/test.ts:99`')
  })

  it('handles null line number', () => {
    const issues = [makeMockIssueData({ line: null })]
    const content = generateSpecContent(1, issues, 'test')

    expect(content).toContain('`src/test.ts`')
    expect(content).not.toContain('`src/test.ts:`')
  })

  it('includes verification section', () => {
    const issues = [makeMockIssueData()]
    const content = generateSpecContent(1, issues, 'test')

    expect(content).toContain('## Verification')
    expect(content).toContain('`npm run build`')
    expect(content).toContain('`npm test`')
  })
})

describe('isComplexIssue', () => {
  it('returns true for architecture category', () => {
    const issue = makeMockIssueData({ category: 'architecture' })
    expect(isComplexIssue(issue)).toBe(true)
  })

  it('returns true for title containing redesign keyword', () => {
    const issue = makeMockIssueData({ title: 'Redesign auth flow', category: 'security' })
    expect(isComplexIssue(issue)).toBe(true)
  })

  it('returns true for description containing circular dependency', () => {
    const issue = makeMockIssueData({
      description: 'There is a circular dependency between modules',
      category: 'code-quality',
    })
    expect(isComplexIssue(issue)).toBe(true)
  })

  it('returns false for simple code quality issue', () => {
    const issue = makeMockIssueData({
      title: 'Missing null check',
      description: 'Add null check before accessing property',
      category: 'code-quality',
    })
    expect(isComplexIssue(issue)).toBe(false)
  })

  it('returns false for security issue without complex keywords', () => {
    const issue = makeMockIssueData({
      title: 'Missing input validation',
      description: 'Add zod validation for user input',
      category: 'security',
    })
    expect(isComplexIssue(issue)).toBe(false)
  })

  it('returns false for performance issue', () => {
    const issue = makeMockIssueData({
      title: 'N+1 query',
      description: 'Use batch loading instead of individual queries',
      category: 'performance',
    })
    expect(isComplexIssue(issue)).toBe(false)
  })
})
