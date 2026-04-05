/**
 * Shared mapping from ChildCostEntry to ChildSessionCostEntry.
 * Used by capability-registry, invocation-handler.finalize, and invocation-handler.error.
 */

import type { ChildSessionCostEntry } from './cost-report.schemas.js'
import type { ChildCostEntry } from './cost.types.js'

/**
 * Maps ChildCostEntry[] to ChildSessionCostEntry[] for cost report writing.
 * Includes all optional fields (cache tokens, prompt version, total tokens)
 * only when present on the source entry.
 */
export function mapChildCostEntries(entries: ChildCostEntry[]): ChildSessionCostEntry[] {
  return entries.map((entry) => ({
    sid: entry.childSessionId || entry.sid,
    capability: entry.capabilityName,
    costUsd: entry.costUsd,
    turns: entry.turns || 0,
    inputTokens: entry.inputTokens,
    outputTokens: entry.outputTokens,
    model: entry.model,
    status: entry.status || 'success',
    ...(entry.commitSha ? { commitSha: entry.commitSha } : {}),
    ...(entry.promptCacheWrite !== undefined
      ? { promptCacheWrite: entry.promptCacheWrite }
      : {}),
    ...(entry.promptCacheRead !== undefined
      ? { promptCacheRead: entry.promptCacheRead }
      : {}),
    ...(entry.promptVersion !== undefined ? { promptVersion: entry.promptVersion } : {}),
    ...(entry.totalTokensIn !== undefined ? { totalTokensIn: entry.totalTokensIn } : {}),
    ...(entry.totalTokensOut !== undefined ? { totalTokensOut: entry.totalTokensOut } : {}),
  }))
}
