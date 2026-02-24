/**
 * PR comment state serialization/deserialization.
 * Embeds machine-readable JSON in hidden HTML comments for cross-round tracking.
 */

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

export const REVIEWER_STATE_MARKER = 'pr-review-state'
export const FIXER_STATE_MARKER = 'pr-fixer-state'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type IssueStatus = 'open' | 'fixing' | 'fixed' | 'wontfix'

export interface PrCommentState {
  v: 1
  round: number
  sha: string
  issues: Record<string, IssueStatus>
}

// ---------------------------------------------------------------------------
// Serialization
// ---------------------------------------------------------------------------

/**
 * Serialize state into a hidden HTML comment.
 *
 * @param marker - State marker identifier (e.g. REVIEWER_STATE_MARKER)
 * @param state - State to embed
 * @returns HTML comment string like `<!-- pr-review-state:{"v":1,...} -->`
 */
export function serializeState(marker: string, state: PrCommentState): string {
  return `<!-- ${marker}:${JSON.stringify(state)} -->`
}

/**
 * Parse state from a comment body by marker.
 *
 * @param marker - State marker identifier
 * @param body - Full comment body string
 * @returns Parsed state or null if not found/invalid
 */
export function parseState(marker: string, body: string): PrCommentState | null {
  const escapedMarker = marker.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const regex = new RegExp(`<!-- ${escapedMarker}:(\\{.+\\}) -->`)
  const match = body.match(regex)
  if (!match?.[1]) return null

  try {
    const parsed: unknown = JSON.parse(match[1])
    if (
      typeof parsed === 'object' &&
      parsed !== null &&
      'v' in parsed &&
      (parsed as PrCommentState).v === 1
    ) {
      return parsed as PrCommentState
    }
    return null
  } catch {
    return null
  }
}
