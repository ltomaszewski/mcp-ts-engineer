/**
 * XML block extraction utility.
 * Extracts text content between XML tags from AI response text.
 */

/**
 * Extract text content between XML tags.
 * @param content - Full text content to search
 * @param tagName - XML tag name (without angle brackets)
 * @returns Text between tags, or null if not found
 *
 * @example
 * ```ts
 * const json = parseXmlBlock('<result>{"status":"ok"}</result>', 'result');
 * // Returns '{"status":"ok"}'
 *
 * const missing = parseXmlBlock('no tags here', 'result');
 * // Returns null
 * ```
 */
export function parseXmlBlock(
  content: string,
  tagName: string,
): string | null {
  const regex = new RegExp(`<${tagName}>([\\s\\S]*?)<\\/${tagName}>`);
  const match = content.match(regex);
  return match?.[1]?.trim() ?? null;
}
