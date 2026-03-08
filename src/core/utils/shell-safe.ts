/**
 * Shell-safety utilities for values embedded in bash commands within prompts.
 * Defense-in-depth: validate and quote values before interpolation.
 */

/**
 * Git ref name pattern (branches, tags).
 * Allows: alphanumeric, dots, hyphens, underscores, forward slashes.
 */
const GIT_REF_PATTERN = /^[a-zA-Z0-9][a-zA-Z0-9._\/-]*$/

/**
 * Git SHA pattern (abbreviated or full).
 * Allows: 7-40 lowercase hex characters.
 */
const GIT_SHA_PATTERN = /^[a-f0-9]{7,40}$/

/**
 * Safe filesystem path pattern.
 * Allows: alphanumeric, dots, hyphens, underscores, forward slashes, @, +, colons.
 * Rejects: shell metacharacters (;, &, |, $, `, etc.) and path traversal.
 */
const SAFE_PATH_PATTERN = /^[a-zA-Z0-9./][a-zA-Z0-9._\/@+: -]*$/

/** Validate that a string is a safe git ref name (branch/tag). */
export function isValidGitRef(ref: string): boolean {
  if (ref.length === 0 || ref.length > 256) return false
  if (ref.includes('..') || ref.endsWith('.lock') || ref.endsWith('/')) return false
  return GIT_REF_PATTERN.test(ref)
}

/** Validate that a string is a safe git SHA (7-40 hex chars). */
export function isValidGitSha(sha: string): boolean {
  return GIT_SHA_PATTERN.test(sha)
}

/** Validate that a string is a safe filesystem path. */
export function isValidPath(path: string): boolean {
  if (path.length === 0 || path.length > 512) return false
  if (path.includes('..')) return false
  return SAFE_PATH_PATTERN.test(path)
}

/**
 * Shell-quote a value for safe embedding in bash commands.
 * Wraps in single quotes, escaping any embedded single quotes.
 */
export function shellQuote(value: string): string {
  return `'${value.replace(/'/g, "'\\''")}'`
}
