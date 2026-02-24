/**
 * Tests for parseXmlBlock and parseJsonSafe helper functions.
 */

import { parseJsonSafe, parseXmlBlock } from '../todo-reviewer.capability.js'
import type { TddSummary } from '../todo-reviewer.schema.js'
import { TddSummarySchema } from '../todo-reviewer.schema.js'
import { VALID_TDD_SUMMARY } from './test-helpers.js'

// ---------------------------------------------------------------------------
// parseXmlBlock
// ---------------------------------------------------------------------------

describe('parseXmlBlock', () => {
  it('extracts content from XML tags', () => {
    const content = `Some text <review_summary>{"status":"READY"}</review_summary> more text`
    const result = parseXmlBlock(content, 'review_summary')

    expect(result).toBe(`{"status":"READY"}`)
  })

  it('returns null when tag not found', () => {
    const result = parseXmlBlock('no tags here', 'review_summary')

    expect(result).toBeNull()
  })

  it('returns null for malformed XML (missing close tag)', () => {
    const result = parseXmlBlock('<review_summary>content', 'review_summary')

    expect(result).toBeNull()
  })

  it('handles empty content between tags', () => {
    const result = parseXmlBlock('<review_summary></review_summary>', 'review_summary')

    expect(result).toBe('')
  })

  it('handles nested content', () => {
    const content = `<review_summary>{"key": "<inner>"}</review_summary>`
    const result = parseXmlBlock(content, 'review_summary')

    expect(result).toBe(`{"key": "<inner>"}`)
  })
})

// ---------------------------------------------------------------------------
// parseJsonSafe
// ---------------------------------------------------------------------------

describe('parseJsonSafe', () => {
  const fallback: TddSummary = {
    status: 'FAIL',
    details: 'fallback',
    issues_found: 0,
    spec_modified: false,
  }

  it('returns parsed data when JSON valid and schema matches', () => {
    const json = JSON.stringify(VALID_TDD_SUMMARY)
    const result = parseJsonSafe(json, TddSummarySchema, fallback)

    expect(result).toEqual(VALID_TDD_SUMMARY)
  })

  it('returns fallback for invalid JSON', () => {
    const result = parseJsonSafe('not json', TddSummarySchema, fallback)

    expect(result).toEqual(fallback)
  })

  it('returns fallback for valid JSON but schema mismatch', () => {
    const result = parseJsonSafe('{"wrong":"data"}', TddSummarySchema, fallback)

    expect(result).toEqual(fallback)
  })

  it('returns fallback for empty string', () => {
    const result = parseJsonSafe('', TddSummarySchema, fallback)

    expect(result).toEqual(fallback)
  })
})
