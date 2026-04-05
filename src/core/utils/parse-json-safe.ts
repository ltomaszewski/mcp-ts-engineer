/**
 * Safe JSON parsing with Zod validation.
 * Wraps JSON.parse() with error handling and schema validation.
 */

import type { ZodSchema } from 'zod'

/** Minimal logger interface for optional diagnostics. */
interface MinimalLogger {
  warn(message: string, context?: Record<string, unknown>): void
}

/**
 * Safely parse JSON with Zod schema validation.
 *
 * @param text - JSON string to parse
 * @param schema - Zod schema for validation
 * @param fallback - Value to return on parse or validation failure
 * @param logger - Optional logger; when provided, logs first 3 Zod issues on validation failure
 * @returns Parsed and validated data, or fallback on error
 *
 * @example
 * ```ts
 * const schema = z.object({ id: z.string() });
 * const result = parseJsonSafe('{"id":"123"}', schema, { id: '' });
 * // Returns { id: '123' }
 *
 * const invalid = parseJsonSafe('invalid', schema, { id: '' });
 * // Returns { id: '' }
 * ```
 */
export function parseJsonSafe<T>(
  text: string,
  schema: ZodSchema<T>,
  fallback: T,
  logger?: MinimalLogger,
): T {
  try {
    const parsed = JSON.parse(text) as unknown
    const result = schema.safeParse(parsed)

    if (!result.success) {
      if (logger) {
        const issues = result.error.issues.slice(0, 3).map((issue) => ({
          path: issue.path.join('.'),
          code: issue.code,
          message: issue.message,
        }))
        logger.warn('parseJsonSafe: Zod validation failed', { issues })
      }
      return fallback
    }

    return result.data
  } catch {
    return fallback
  }
}
