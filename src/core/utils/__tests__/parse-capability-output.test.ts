/**
 * Tests for parseCapabilityOutput utility.
 */

import { z } from 'zod'
import { parseCapabilityOutput } from '../parse-capability-output.js'
import type { AIQueryResult } from '../../ai-provider/ai-provider.types.js'

const TestSchema = z.object({
  status: z.string(),
  count: z.number(),
})

type TestData = z.infer<typeof TestSchema>

const fallback: TestData = { status: 'fallback', count: 0 }

/** Helper to build a minimal AIQueryResult stub */
function makeResult(overrides: Partial<AIQueryResult> = {}): AIQueryResult {
  return {
    content: '',
    usage: { inputTokens: 0, outputTokens: 0, totalTokens: 0 },
    costUsd: 0,
    turns: 1,
    terminationReason: 'success',
    trace: {
      tid: 'test-tid',
      startedAt: new Date().toISOString(),
      request: { prompt: 'test' },
      turns: [],
    },
    ...overrides,
  }
}

describe('parseCapabilityOutput', () => {
  describe('Strategy 1: structuredOutput', () => {
    it('returns structuredOutput when valid and matches schema', () => {
      const aiResult = makeResult({
        structuredOutput: { status: 'ok', count: 42 },
      })

      const result = parseCapabilityOutput(aiResult, 'result', TestSchema, fallback)

      expect(result).toEqual({ status: 'ok', count: 42, _parseStrategy: 'structured' })
    })

    it('falls through to XML when structuredOutput is absent', () => {
      const aiResult = makeResult({
        content: '<result>{"status":"from-xml","count":7}</result>',
      })

      const result = parseCapabilityOutput(aiResult, 'result', TestSchema, fallback)

      expect(result).toEqual({ status: 'from-xml', count: 7, _parseStrategy: 'xml' })
    })

    it('falls through to XML when structuredOutput fails Zod validation', () => {
      const aiResult = makeResult({
        structuredOutput: { status: 123, count: 'not-a-number' },
        content: '<result>{"status":"xml-fallback","count":99}</result>',
      })

      const result = parseCapabilityOutput(aiResult, 'result', TestSchema, fallback)

      expect(result).toEqual({ status: 'xml-fallback', count: 99, _parseStrategy: 'xml' })
    })
  })

  describe('Strategy 2: XML block extraction', () => {
    it('returns parsed XML content when XML block is present and valid', () => {
      const aiResult = makeResult({
        content: 'Some preamble\n<output>{"status":"done","count":5}</output>\nSome epilogue',
      })

      const result = parseCapabilityOutput(aiResult, 'output', TestSchema, fallback)

      expect(result).toEqual({ status: 'done', count: 5, _parseStrategy: 'xml' })
    })

    it('returns fallback when XML content is invalid JSON', () => {
      const aiResult = makeResult({
        content: '<result>not valid json{</result>',
      })

      const result = parseCapabilityOutput(aiResult, 'result', TestSchema, fallback)

      expect(result).toEqual({ ...fallback, _parseStrategy: 'fallback' })
    })

    it('returns fallback when XML content fails Zod validation', () => {
      const aiResult = makeResult({
        content: '<result>{"status":true,"count":"bad"}</result>',
      })

      const result = parseCapabilityOutput(aiResult, 'result', TestSchema, fallback)

      expect(result).toEqual({ ...fallback, _parseStrategy: 'fallback' })
    })
  })

  describe('Strategy 3: Fallback', () => {
    it('returns fallback when no structuredOutput and no XML block', () => {
      const aiResult = makeResult({
        content: 'Just plain text with no XML tags',
      })

      const result = parseCapabilityOutput(aiResult, 'result', TestSchema, fallback)

      expect(result).toEqual({ ...fallback, _parseStrategy: 'fallback' })
    })
  })

  describe('_parseStrategy metadata', () => {
    it('returns "structured" strategy for valid structuredOutput', () => {
      const aiResult = makeResult({
        structuredOutput: { status: 'ok', count: 1 },
      })

      const result = parseCapabilityOutput(aiResult, 'result', TestSchema, fallback)

      expect(result._parseStrategy).toBe('structured')
    })

    it('returns "xml" strategy for valid XML block', () => {
      const aiResult = makeResult({
        content: '<result>{"status":"ok","count":1}</result>',
      })

      const result = parseCapabilityOutput(aiResult, 'result', TestSchema, fallback)

      expect(result._parseStrategy).toBe('xml')
    })

    it('returns "fallback" strategy when all strategies fail', () => {
      const aiResult = makeResult({
        content: 'no json here',
      })

      const result = parseCapabilityOutput(aiResult, 'result', TestSchema, fallback)

      expect(result._parseStrategy).toBe('fallback')
    })
  })
})
