import { execFileSync } from 'node:child_process'

/** Maximum comment body size allowed by GitHub API (65536 chars). */
const GITHUB_COMMENT_BODY_MAX = 65536

/** Timeout for gh API calls (ms). Matches other gh calls in the codebase. */
const GH_TIMEOUT_MS = 15_000

/** Maximum retry attempts for transient failures. */
const MAX_RETRIES = 1

/** Validate that a GitHub owner/repo value contains only safe characters. */
function assertSafeGhArg(value: string, label: string): void {
  if (!/^[a-zA-Z0-9._-]+$/.test(value)) {
    throw new Error(`Unsafe ${label}: ${value}`)
  }
}

/**
 * Validate that a marker string is safe for jq `contains()` interpolation.
 * Markers are internal HTML comment prefixes (e.g. '<!-- pr-review-state:').
 * Only `"` and `\` can break the jq expression `contains("...")`.
 */
function assertSafeJqString(value: string, label: string): void {
  if (value.length === 0 || value.length > 200) {
    throw new Error(`${label} length out of range: ${value.length}`)
  }
  if (/["\\]/.test(value)) {
    throw new Error(`${label} contains unsafe jq characters`)
  }
}

/** Check if an error is transient (network/timeout) and worth retrying. */
function isTransientError(error: unknown): boolean {
  const msg = error instanceof Error ? error.message : String(error)
  return /ETIMEDOUT|ECONNRESET|ECONNREFUSED|timeout|socket hang up|502|503|rate limit/i.test(msg)
}

/**
 * Execute fn with immediate retry on transient errors.
 * No delay between retries — avoids blocking the MCP server event loop.
 */
function withRetry<T>(fn: () => T, retries = MAX_RETRIES): T {
  let lastError: unknown
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return fn()
    } catch (error) {
      lastError = error
      if (attempt < retries && isTransientError(error)) {
        continue
      }
      throw error
    }
  }
  throw lastError
}

/**
 * Find an existing PR comment by searching for a marker string in the body.
 * Returns the comment ID if found, null otherwise.
 */
export function findCommentByMarker(
  owner: string,
  repo: string,
  prNumber: number,
  marker: string,
): string | null {
  try {
    assertSafeGhArg(owner, 'owner')
    assertSafeGhArg(repo, 'repo')
    assertSafeJqString(marker, 'marker')
  } catch {
    return null
  }

  try {
    const result = withRetry(() =>
      execFileSync(
        'gh',
        [
          'api',
          `repos/${owner}/${repo}/issues/${prNumber}/comments`,
          '--jq',
          // marker is safe for jq interpolation (assertSafeJqString rejects " and \)
          `[.[] | select(.body | contains("${marker}")) | .id] | last`,
        ],
        { encoding: 'utf-8', timeout: GH_TIMEOUT_MS },
      ).trim(),
    )
    if (result && result !== 'null' && /^\d+$/.test(result)) return result
    return null
  } catch {
    return null
  }
}

/**
 * Post a new comment or update an existing one identified by marker.
 * Returns the comment HTML URL.
 *
 * Uses `gh api` for both create and update to get consistent JSON responses
 * with `html_url` field. The previous `gh pr comment` approach returned
 * unpredictable text output depending on gh version and TTY mode.
 */
export function postOrUpdateComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
  marker: string,
): string {
  assertSafeGhArg(owner, 'owner')
  assertSafeGhArg(repo, 'repo')

  if (body.length > GITHUB_COMMENT_BODY_MAX) {
    throw new Error(
      `Comment body exceeds GitHub limit: ${body.length} > ${GITHUB_COMMENT_BODY_MAX} chars`,
    )
  }

  const existingId = findCommentByMarker(owner, repo, prNumber, marker)

  if (existingId) {
    return withRetry(() => {
      const jsonPayload = JSON.stringify({ body })
      const result = execFileSync(
        'gh',
        [
          'api',
          `repos/${owner}/${repo}/issues/comments/${existingId}`,
          '-X',
          'PATCH',
          '--input',
          '-',
        ],
        { encoding: 'utf-8', input: jsonPayload, timeout: GH_TIMEOUT_MS },
      )
      const parsed = JSON.parse(result)
      return parsed.html_url ?? ''
    })
  }

  // POST new comment via gh api (returns JSON with html_url)
  return withRetry(() => {
    const jsonPayload = JSON.stringify({ body })
    const result = execFileSync(
      'gh',
      [
        'api',
        `repos/${owner}/${repo}/issues/${prNumber}/comments`,
        '-X',
        'POST',
        '--input',
        '-',
      ],
      { encoding: 'utf-8', input: jsonPayload, timeout: GH_TIMEOUT_MS },
    )
    const parsed = JSON.parse(result)
    return parsed.html_url ?? ''
  })
}
