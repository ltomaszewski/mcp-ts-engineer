/**
 * Tests for todo-code-writer helper functions.
 */

import {
  COMMIT_RESULT_FALLBACK,
  FINAL_AUDIT_RESULT_FALLBACK,
  PHASE_AUDIT_RESULT_FALLBACK,
  PHASE_ENG_RESULT_FALLBACK,
  PHASE_PLAN_FALLBACK,
  parseJsonSafe,
  parseXmlBlock,
} from '../todo-code-writer.helpers.js'
import { PhasePlanSchema } from '../todo-code-writer.schema.js'

// ---------------------------------------------------------------------------
// parseXmlBlock tests
// ---------------------------------------------------------------------------

describe('parseXmlBlock', () => {
  it('extracts text between valid XML tags', () => {
    const content = '<phase_plan>{ "phases": [] }</phase_plan>'
    const result = parseXmlBlock(content, 'phase_plan')
    expect(result).toBe('{ "phases": [] }')
  })

  it('returns null when tag not found', () => {
    const content = 'No XML tags here'
    const result = parseXmlBlock(content, 'phase_plan')
    expect(result).toBeNull()
  })

  it('handles nested content with whitespace', () => {
    const content = `
      <phase_plan>
        { "phases": [] }
      </phase_plan>
    `
    const result = parseXmlBlock(content, 'phase_plan')
    expect(result).toBe('{ "phases": [] }')
  })

  it('handles multiline JSON', () => {
    const content = `<result>
{
  "status": "success",
  "data": "value"
}
</result>`
    const result = parseXmlBlock(content, 'result')
    expect(result).toContain('"status": "success"')
  })

  it('returns null for malformed XML (missing closing tag)', () => {
    const content = '<phase_plan>{ "phases": [] }'
    const result = parseXmlBlock(content, 'phase_plan')
    expect(result).toBeNull()
  })

  it('handles empty content between tags', () => {
    const content = '<phase_plan></phase_plan>'
    const result = parseXmlBlock(content, 'phase_plan')
    expect(result).toBe('')
  })
})

// ---------------------------------------------------------------------------
// parseJsonSafe tests
// ---------------------------------------------------------------------------

describe('parseJsonSafe', () => {
  it('parses valid JSON and validates against schema', () => {
    const jsonString = '{ "phases": [] }'
    const result = parseJsonSafe(jsonString, PhasePlanSchema, PHASE_PLAN_FALLBACK)
    expect(result).toEqual({ phases: [] })
  })

  it('returns fallback on invalid JSON string', () => {
    const invalidJson = '{ not valid json }'
    const result = parseJsonSafe(invalidJson, PhasePlanSchema, PHASE_PLAN_FALLBACK)
    expect(result).toEqual(PHASE_PLAN_FALLBACK)
  })

  it("returns fallback when JSON doesn't match schema", () => {
    const jsonString = '{ "invalid_field": 123 }'
    const result = parseJsonSafe(jsonString, PhasePlanSchema, PHASE_PLAN_FALLBACK)
    expect(result).toEqual(PHASE_PLAN_FALLBACK)
  })

  it('returns fallback on empty string', () => {
    const result = parseJsonSafe('', PhasePlanSchema, PHASE_PLAN_FALLBACK)
    expect(result).toEqual(PHASE_PLAN_FALLBACK)
  })

  it('parses complex nested JSON', () => {
    const jsonString = JSON.stringify({
      phases: [
        {
          phase_number: 1,
          purpose: 'Setup',
          dependencies: ['none'],
          files: [{ path: 'src/file.ts', action: 'CREATE', purpose: 'Test' }],
        },
      ],
    })
    const result = parseJsonSafe(jsonString, PhasePlanSchema, PHASE_PLAN_FALLBACK)
    expect(result.phases).toHaveLength(1)
    expect(result.phases[0]?.phase_number).toBe(1)
  })
})

// ---------------------------------------------------------------------------
// Fallback constants tests
// ---------------------------------------------------------------------------

describe('Fallback constants', () => {
  it('PHASE_PLAN_FALLBACK has empty phases', () => {
    expect(PHASE_PLAN_FALLBACK.phases).toEqual([])
  })

  it('PHASE_ENG_RESULT_FALLBACK has failed status', () => {
    expect(PHASE_ENG_RESULT_FALLBACK.status).toBe('failed')
    expect(PHASE_ENG_RESULT_FALLBACK.files_modified).toEqual([])
  })

  it('PHASE_AUDIT_RESULT_FALLBACK has fail status', () => {
    expect(PHASE_AUDIT_RESULT_FALLBACK.status).toBe('fail')
    expect(PHASE_AUDIT_RESULT_FALLBACK.issues_found).toBe(0)
  })

  it('FINAL_AUDIT_RESULT_FALLBACK has fail status', () => {
    expect(FINAL_AUDIT_RESULT_FALLBACK.status).toBe('fail')
    expect(FINAL_AUDIT_RESULT_FALLBACK.issues_found).toBe(0)
  })

  it('COMMIT_RESULT_FALLBACK has committed=false', () => {
    expect(COMMIT_RESULT_FALLBACK.committed).toBe(false)
    expect(COMMIT_RESULT_FALLBACK.commit_sha).toBeNull()
    expect(COMMIT_RESULT_FALLBACK.commit_message).toBeNull()
  })
})
