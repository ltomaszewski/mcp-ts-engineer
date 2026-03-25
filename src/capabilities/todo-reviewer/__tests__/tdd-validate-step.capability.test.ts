/**
 * Tests for tdd-validate-step sub-capability definition (Session 2).
 */

import { tddValidateStepCapability } from '../tdd-validate-step.capability.js'
import type { TddValidateStepInput } from '../todo-reviewer.schema.js'
import { createMockAiResult, createMockContext, VALID_REVIEW_SUMMARY } from './test-helpers.js'

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('tddValidateStepCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(tddValidateStepCapability.id).toBe('todo_tdd_validate_step')
    })

    it('has correct type', () => {
      expect(tddValidateStepCapability.type).toBe('tool')
    })

    it('has correct name', () => {
      expect(tddValidateStepCapability.name).toBe('Todo TDD Validate Step (Internal)')
    })

    it('has non-empty description', () => {
      expect(tddValidateStepCapability.description).toBeTruthy()
      expect(tddValidateStepCapability.description.length).toBeGreaterThan(0)
    })

    it('defaults to sonnet model', () => {
      expect(tddValidateStepCapability.defaultRequestOptions?.model).toBe('sonnet[1m]')
    })

    it('has prompt registry with v1', () => {
      expect(tddValidateStepCapability.promptRegistry).toBeDefined()
      expect(tddValidateStepCapability.promptRegistry.v1).toBeDefined()
    })

    it('has current prompt version v1', () => {
      expect(tddValidateStepCapability.currentPromptVersion).toBe('v1')
    })

    it('has internal visibility', () => {
      expect(tddValidateStepCapability.visibility).toBe('internal')
    })
  })

  describe('preparePromptInput', () => {
    it('extracts specPath, reviewSummary, and cwd', () => {
      const input: TddValidateStepInput = {
        spec_path: 'docs/specs/feature.md',
        review_summary: VALID_REVIEW_SUMMARY,
        cwd: '/some/path',
      }
      const context = createMockContext()

      const result = tddValidateStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        specPath: 'docs/specs/feature.md',
        reviewSummary: VALID_REVIEW_SUMMARY,
        cwd: '/some/path',
      })
    })

    it('handles missing cwd', () => {
      const input: TddValidateStepInput = {
        spec_path: 'docs/specs/feature.md',
        review_summary: VALID_REVIEW_SUMMARY,
      }
      const context = createMockContext()

      const result = tddValidateStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        specPath: 'docs/specs/feature.md',
        reviewSummary: VALID_REVIEW_SUMMARY,
        cwd: undefined,
      })
    })
  })

  describe('processResult', () => {
    it('parses valid <tdd_summary> XML block', async () => {
      const tddSummary = {
        status: 'PASS',
        details: 'All pass',
        issues_found: 0,
        spec_modified: false,
      }
      const content = `Validation done.\n<tdd_summary>${JSON.stringify(tddSummary)}</tdd_summary>`
      const aiResult = createMockAiResult(content)
      const input: TddValidateStepInput = {
        spec_path: 'docs/specs/feature.md',
        review_summary: VALID_REVIEW_SUMMARY,
      }
      const context = createMockContext()

      const result = await tddValidateStepCapability.processResult(input, aiResult, context)

      expect(result).toEqual(tddSummary)
    })

    it('returns fallback on parse failure (no XML block)', async () => {
      const content = 'No XML block here, just plain text.'
      const aiResult = createMockAiResult(content)
      const input: TddValidateStepInput = {
        spec_path: 'docs/specs/feature.md',
        review_summary: VALID_REVIEW_SUMMARY,
      }
      const context = createMockContext()

      const result = await tddValidateStepCapability.processResult(input, aiResult, context)

      expect(result.status).toBe('FAIL')
      expect(result.details).toContain('No XML block')
    })

    it('returns fallback on invalid JSON in XML block', async () => {
      const content = `<tdd_summary>not valid json</tdd_summary>`
      const aiResult = createMockAiResult(content)
      const input: TddValidateStepInput = {
        spec_path: 'docs/specs/feature.md',
        review_summary: VALID_REVIEW_SUMMARY,
      }
      const context = createMockContext()

      const result = await tddValidateStepCapability.processResult(input, aiResult, context)

      expect(result.status).toBe('FAIL')
    })
  })
})
