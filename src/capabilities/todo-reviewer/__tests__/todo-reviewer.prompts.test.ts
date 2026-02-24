/**
 * Tests for todo-reviewer prompt build() functions.
 * Updated to match the agnostic spec writer prompts (v1).
 */

import { v1 as commitV1 } from '../prompts/commit-step.v1.js'
import { v1 as tddValidateV1 } from '../prompts/tdd-validate-step.v1.js'
import { v1 as reviewV1 } from '../prompts/v1.js'
import { VALID_REVIEW_SUMMARY, VALID_TDD_SUMMARY } from './test-helpers.js'

// ---------------------------------------------------------------------------
// Review prompt v1
// ---------------------------------------------------------------------------

describe('review prompt v1', () => {
  it('build() returns userPrompt containing specPath', () => {
    const result = reviewV1.build({ specPath: 'docs/specs/feature.md' })

    expect(result.userPrompt).toContain('docs/specs/feature.md')
  })

  it('build() returns systemPrompt with type=preset and preset=claude_code', () => {
    const result = reviewV1.build({ specPath: 'docs/specs/feature.md' })

    expect(result.systemPrompt).toBeDefined()
    expect(typeof result.systemPrompt).toBe('object')
    const systemPrompt = result.systemPrompt as { type: string; preset: string; append?: string }
    expect(systemPrompt.type).toBe('preset')
    expect(systemPrompt.preset).toBe('claude_code')
  })

  it('build() returns systemPrompt with append as a string', () => {
    const result = reviewV1.build({ specPath: 'docs/specs/feature.md' })

    const systemPrompt = result.systemPrompt as { type: string; preset: string; append?: string }
    expect(typeof systemPrompt.append).toBe('string')
    expect(systemPrompt.append?.length).toBeGreaterThan(0)
  })

  it('build() systemPrompt.append contains spec_writer_override', () => {
    const result = reviewV1.build({ specPath: 'docs/specs/feature.md' })

    const systemPrompt = result.systemPrompt as { type: string; preset: string; append?: string }
    expect(systemPrompt.append).toContain('spec_writer_override')
    expect(systemPrompt.append).toContain('Write tool')
  })

  it('build() systemPrompt.append instructs Write tool over Edit', () => {
    const result = reviewV1.build({ specPath: 'docs/specs/feature.md' })

    const systemPrompt = result.systemPrompt as { type: string; preset: string; append?: string }
    expect(systemPrompt.append).toContain('complete document in a single call')
    expect(systemPrompt.append).toContain('generating all content from scratch')
  })

  it('build() userPrompt contains 16-section document skeleton', () => {
    const result = reviewV1.build({ specPath: 'docs/specs/feature.md' })

    expect(result.userPrompt).toContain('SECTION 1: Metadata Header')
    expect(result.userPrompt).toContain('SECTION 6: Acceptance Criteria')
    expect(result.userPrompt).toContain('SECTION 11: Implementation Phases')
    expect(result.userPrompt).toContain('SECTION 16: Review Findings')
  })

  it('build() userPrompt contains instructions for reading draft and reference spec', () => {
    const result = reviewV1.build({ specPath: 'docs/specs/feature.md' })

    expect(result.userPrompt).toContain('Read the draft spec')
    expect(result.userPrompt).toContain('Read the reference spec')
    expect(result.userPrompt).toContain('Research the target app')
  })

  it('build() userPrompt contains rules about blockers and placeholders', () => {
    const result = reviewV1.build({ specPath: 'docs/specs/feature.md' })

    expect(result.userPrompt).toContain('BLOCKED means only')
    expect(result.userPrompt).toContain('Avoid placeholder text')
    expect(result.userPrompt).toContain('AskUserQuestion')
  })

  it('build() userPrompt contains review_summary output format', () => {
    const result = reviewV1.build({ specPath: 'docs/specs/feature.md' })

    expect(result.userPrompt).toContain('review_summary')
    expect(result.userPrompt).toContain('spec_modified')
    expect(result.userPrompt).toContain('consistency_score')
    expect(result.userPrompt).toContain('key_findings')
  })

  it('build() userPrompt does not reference /todo-review command', () => {
    const result = reviewV1.build({ specPath: 'docs/specs/feature.md' })

    expect(result.userPrompt).not.toContain('Validate with /todo-review')
  })
})

// ---------------------------------------------------------------------------
// TDD validate step prompt v1
// ---------------------------------------------------------------------------

describe('tdd-validate-step prompt v1', () => {
  it('build() returns userPrompt with specPath and validation workflow', () => {
    const result = tddValidateV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
    })

    expect(result.userPrompt).toContain('docs/specs/feature.md')
    expect(result.userPrompt).toContain('TDD validator')
    expect(result.userPrompt).toContain('decision_criteria')
  })

  it('build() returns systemPrompt with type=preset and preset=claude_code', () => {
    const result = tddValidateV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
    })

    const systemPrompt = result.systemPrompt as { type: string; preset: string; append?: string }
    expect(systemPrompt.type).toBe('preset')
    expect(systemPrompt.preset).toBe('claude_code')
  })

  it('build() returns systemPrompt.append as a string', () => {
    const result = tddValidateV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
    })

    const systemPrompt = result.systemPrompt as { type: string; preset: string; append?: string }
    expect(typeof systemPrompt.append).toBe('string')
    expect(systemPrompt.append?.length).toBeGreaterThan(0)
  })

  it('build() systemPrompt.append instructs text output after tool use', () => {
    const result = tddValidateV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
    })

    const systemPrompt = result.systemPrompt as { type: string; preset: string; append?: string }
    expect(systemPrompt.append).toContain('text summary')
    expect(systemPrompt.append).toContain('structured output')
  })

  it('build() userPrompt contains prior_review_status from reviewSummary', () => {
    const result = tddValidateV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
    })

    expect(result.userPrompt).toContain('prior_review_status')
    expect(result.userPrompt).toContain('IN_REVIEW')
  })

  it('build() userPrompt contains decision criteria (PASS/FAIL/WARN)', () => {
    const result = tddValidateV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
    })

    expect(result.userPrompt).toContain('decision_criteria')
    expect(result.userPrompt).toContain('PASS:')
    expect(result.userPrompt).toContain('FAIL:')
    expect(result.userPrompt).toContain('WARN:')
  })

  it('build() userPrompt contains workflow steps', () => {
    const result = tddValidateV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
    })

    expect(result.userPrompt).toContain('Read the spec file')
    expect(result.userPrompt).toContain('Check these criteria')
    expect(result.userPrompt).toContain('coverage target')
  })

  it('build() userPrompt contains rules about AskUserQuestion', () => {
    const result = tddValidateV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
    })

    expect(result.userPrompt).toContain('AskUserQuestion')
  })
})

// ---------------------------------------------------------------------------
// Commit step prompt v1
// ---------------------------------------------------------------------------

describe('commit-step prompt v1', () => {
  it('build() returns userPrompt containing reviewSummary.status and tddSummary.status', () => {
    const result = commitV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
      tddSummary: VALID_TDD_SUMMARY,
    })

    expect(result.userPrompt).toContain('IN_REVIEW')
    expect(result.userPrompt).toContain('PASS')
  })

  it('build() returns systemPrompt with type=preset and preset=claude_code', () => {
    const result = commitV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
      tddSummary: VALID_TDD_SUMMARY,
    })

    const systemPrompt = result.systemPrompt as { type: string; preset: string; append?: string }
    expect(systemPrompt.type).toBe('preset')
    expect(systemPrompt.preset).toBe('claude_code')
  })

  it('build() returns systemPrompt without append (no custom system prompt)', () => {
    const result = commitV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
      tddSummary: VALID_TDD_SUMMARY,
    })

    const systemPrompt = result.systemPrompt as { type: string; preset: string; append?: string }
    expect(systemPrompt.append).toBeUndefined()
  })

  it('build() userPrompt contains commit instructions', () => {
    const result = commitV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
      tddSummary: VALID_TDD_SUMMARY,
    })

    expect(result.userPrompt).toContain('git diff')
    expect(result.userPrompt).toContain('git add')
    expect(result.userPrompt).toContain('chore(docs): [ts-engineer]')
  })

  it('build() userPrompt contains context block with review and TDD status', () => {
    const result = commitV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
      tddSummary: VALID_TDD_SUMMARY,
    })

    expect(result.userPrompt).toContain('Review status: IN_REVIEW')
    expect(result.userPrompt).toContain('TDD status: PASS')
    expect(result.userPrompt).toContain('Corrections applied:')
    expect(result.userPrompt).toContain('Consistency score:')
  })

  it('build() userPrompt contains commit_result output format', () => {
    const result = commitV1.build({
      specPath: 'docs/specs/feature.md',
      reviewSummary: VALID_REVIEW_SUMMARY,
      tddSummary: VALID_TDD_SUMMARY,
    })

    expect(result.userPrompt).toContain('commit_result')
    expect(result.userPrompt).toContain('committed')
    expect(result.userPrompt).toContain('commit_sha')
    expect(result.userPrompt).toContain('files_changed')
  })
})
