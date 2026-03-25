/**
 * Helper utilities for PR reviewer step capabilities.
 *
 * @internal Shared across step capabilities for JSON parsing and common operations.
 */

import type { PrContext } from './pr-reviewer.schema.js'
import { PrContextSchema } from './pr-reviewer.schema.js'

// ---------------------------------------------------------------------------
// Project directory helpers
// ---------------------------------------------------------------------------

/**
 * Extract the top-level project directory from a file path.
 * Returns 'apps/foo' or 'packages/bar', or 'root' for top-level files.
 */
export function getProjectDir(filePath: string): string {
  const match = filePath.match(/^((?:apps|packages)\/[^/]+)/)
  return match ? match[1] : 'root'
}

/**
 * Group files by their project directory, preserving order within groups.
 */
export function groupFilesByProject(files: string[]): Map<string, string[]> {
  const groups = new Map<string, string[]>()
  for (const file of files) {
    const project = getProjectDir(file)
    const group = groups.get(project) ?? []
    group.push(file)
    groups.set(project, group)
  }
  return groups
}

// ---------------------------------------------------------------------------
// File filtering, diff splitting, and chunking helpers
// ---------------------------------------------------------------------------

/** Patterns for files that should be excluded from code review. */
const NON_REVIEWABLE_PATTERNS = [
  /\.md$/,
  /\.map$/,
  /\.d\.ts$/,
  /\.lock$/,
  /(?:^|\/)dist\//,
  /(?:^|\/)build\//,
  /(?:^|\/)coverage\//,
  /(?:^|\/)node_modules\//,
  /\.snap$/,
  /(?:^|\/)packages\/mcp-ts-engineer\//,
] as const

/**
 * Filter out files that aren't worth reviewing (docs, build artifacts, etc.).
 */
export function filterReviewableFiles(files: string[]): string[] {
  return files.filter((f) => !NON_REVIEWABLE_PATTERNS.some((pattern) => pattern.test(f)))
}

/**
 * Parse a unified diff into per-file sections.
 * Splits on `diff --git a/... b/...` boundaries.
 *
 * @returns Map of filePath → diff content for that file
 */
export function splitDiffByFile(fullDiff: string): Map<string, string> {
  const result = new Map<string, string>()
  if (!fullDiff) return result

  const parts = fullDiff.split(/^(?=diff --git )/m)

  for (const part of parts) {
    if (!part.trim()) continue

    // Extract file path from "diff --git a/path b/path"
    const headerMatch = part.match(/^diff --git a\/.+ b\/(.+)/)
    if (headerMatch?.[1]) {
      result.set(headerMatch[1], part)
    }
  }

  return result
}

/**
 * Split a file list into groups of at most `maxFilesPerChunk`.
 */
export function chunkFiles(files: string[], maxFilesPerChunk = 10): string[][] {
  const chunks: string[][] = []
  for (let i = 0; i < files.length; i += maxFilesPerChunk) {
    chunks.push(files.slice(i, i + maxFilesPerChunk))
  }
  return chunks
}

/**
 * Concatenate diff sections for a set of files, truncated to maxChars.
 */
export function getDiffForFiles(
  diffByFile: Map<string, string>,
  files: string[],
  maxChars = 30000,
): string {
  let combined = ''
  for (const file of files) {
    const section = diffByFile.get(file)
    if (section) {
      if (combined.length + section.length > maxChars) {
        // Add as much as fits
        combined += section.substring(0, maxChars - combined.length)
        break
      }
      combined += section
    }
  }
  return combined
}

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
    const jsonMatch = content.match(/```json\n([\s\S]*?)\n```/)
    const jsonStr = jsonMatch ? jsonMatch[1] : content
    return JSON.parse(jsonStr) as T
  } catch {
    return null
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
  if (!raw || typeof raw !== 'object') return null
  // Coerce empty string SHAs to null before Zod validation (defensive against LLM output)
  const patched = { ...(raw as Record<string, unknown>) }
  if (typeof patched.last_reviewed_sha === 'string' && patched.last_reviewed_sha.trim() === '') {
    patched.last_reviewed_sha = null
  }
  const result = PrContextSchema.safeParse(patched)
  return result.success ? result.data : null
}

/**
 * Try to extract a GitHub comment URL from raw AI output.
 * Looks for issuecomment URLs that `gh pr comment` prints after posting.
 *
 * @param content - Raw AI result content
 * @returns Comment URL or empty string if not found
 */
export function tryExtractCommentUrl(content: string): string {
  const urlMatch = content.match(/https:\/\/github\.com\/[^\s"'`)]+#issuecomment-\d+/)
  return urlMatch ? urlMatch[0] : ''
}
