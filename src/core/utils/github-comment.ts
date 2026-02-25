import { execSync } from 'node:child_process'

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
    const result = execSync(
      `gh api repos/${owner}/${repo}/issues/${prNumber}/comments --jq '[.[] | select(.body | contains("${marker}")) | .id] | last'`,
      { encoding: 'utf-8', timeout: 15_000 },
    ).trim()
    if (result && result !== 'null' && /^\d+$/.test(result)) return result
    return null
  } catch {
    return null
  }
}

/**
 * Post a new comment or update an existing one identified by marker.
 * Returns the comment HTML URL.
 */
export function postOrUpdateComment(
  owner: string,
  repo: string,
  prNumber: number,
  body: string,
  marker: string,
): string {
  const existingId = findCommentByMarker(owner, repo, prNumber, marker)

  if (existingId) {
    const jsonPayload = JSON.stringify({ body })
    const result = execSync(
      `gh api repos/${owner}/${repo}/issues/comments/${existingId} -X PATCH --input -`,
      { encoding: 'utf-8', input: jsonPayload, timeout: 15_000 },
    )
    const parsed = JSON.parse(result)
    return parsed.html_url ?? ''
  }

  const result = execSync(
    `gh pr comment ${prNumber} --repo ${owner}/${repo} --body-file -`,
    { encoding: 'utf-8', input: body, timeout: 15_000 },
  ).trim()
  return result
}
