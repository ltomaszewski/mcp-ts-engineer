/**
 * Helper utilities for PR reviewer step capabilities.
 *
 * @internal Shared across step capabilities for JSON parsing and common operations.
 */

import { PrContextSchema } from "./pr-reviewer.schema.js";
import type { PrContext } from "./pr-reviewer.schema.js";

/**
 * Try to parse JSON from AI result content.
 * Handles both raw JSON and markdown-fenced JSON blocks.
 *
 * @param content - AI result content string
 * @returns Parsed object or null on failure
 */
export function tryParseJson<T>(content: string): T | null {
  try {
    // Try to extract JSON from markdown code block first
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/);
    const jsonStr = jsonMatch ? jsonMatch[1] : content;
    return JSON.parse(jsonStr) as T;
  } catch {
    return null;
  }
}

/**
 * Sanitize and validate a raw pr_context object from AI agent output.
 *
 * AI agents return untyped JSON where fields may be null, missing, or
 * wrong types. This function applies the Zod schema with defaults to
 * produce a valid PrContext or null if the data is irrecoverable
 * (e.g. missing pr_number, repo_owner, pr_branch, base_branch).
 */
export function sanitizePrContext(raw: unknown): PrContext | null {
  if (!raw || typeof raw !== "object") return null;
  const result = PrContextSchema.safeParse(raw);
  return result.success ? result.data : null;
}

/**
 * Try to extract a GitHub comment URL from raw AI output.
 * Looks for issuecomment URLs that `gh pr comment` prints after posting.
 *
 * @param content - Raw AI result content
 * @returns Comment URL or empty string if not found
 */
export function tryExtractCommentUrl(content: string): string {
  const urlMatch = content.match(
    /https:\/\/github\.com\/[^\s"'`)]+#issuecomment-\d+/
  );
  return urlMatch ? urlMatch[0] : "";
}
