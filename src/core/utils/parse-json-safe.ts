/**
 * Safe JSON parsing with Zod validation.
 * Wraps JSON.parse() with error handling and schema validation.
 */

import type { ZodSchema } from "zod";

/**
 * Safely parse JSON with Zod schema validation.
 *
 * @param text - JSON string to parse
 * @param schema - Zod schema for validation
 * @param fallback - Value to return on parse or validation failure
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
  fallback: T
): T {
  try {
    const parsed = JSON.parse(text) as unknown;
    const result = schema.safeParse(parsed);

    if (!result.success) {
      return fallback;
    }

    return result.data;
  } catch {
    return fallback;
  }
}
