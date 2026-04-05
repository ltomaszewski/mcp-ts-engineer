/**
 * Generic parser for capability AI output.
 * Attempts structured output, XML block extraction, then fallback.
 */

import type { ZodSchema } from 'zod'
import type { AIQueryResult } from '../ai-provider/ai-provider.types.js'
import { parseXmlBlock } from './parse-xml-block.js'

/**
 * Parse AI output using a 3-strategy cascade:
 * 1. Structured output from SDK (if available)
 * 2. XML block extraction + JSON parse
 * 3. Fallback value
 *
 * @param aiResult - The AI query result to parse
 * @param xmlTag - XML tag name to extract from response content
 * @param schema - Zod schema for validation
 * @param fallback - Default value if all strategies fail
 * @returns Parsed and validated output, or fallback
 */
export function parseCapabilityOutput<T>(
  aiResult: AIQueryResult,
  xmlTag: string,
  schema: ZodSchema<T>,
  fallback: T,
): T {
  // Strategy 1: Structured output from SDK
  if (aiResult.structuredOutput) {
    const result = schema.safeParse(aiResult.structuredOutput)
    if (result.success) return result.data
  }

  // Strategy 2: XML block extraction
  const xmlContent = parseXmlBlock(aiResult.content, xmlTag)
  if (xmlContent) {
    try {
      const parsed = JSON.parse(xmlContent)
      const result = schema.safeParse(parsed)
      if (result.success) return result.data
    } catch {
      /* fall through */
    }
  }

  // Strategy 3: Fallback
  return fallback
}
