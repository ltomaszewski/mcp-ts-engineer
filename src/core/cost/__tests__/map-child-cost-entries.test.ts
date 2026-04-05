/**
 * Tests for mapChildCostEntries utility.
 */

import { mapChildCostEntries } from '../map-child-cost-entries.js'
import type { ChildCostEntry } from '../cost.types.js'

/** Helper to build a minimal ChildCostEntry */
function makeEntry(overrides: Partial<ChildCostEntry> = {}): ChildCostEntry {
  return {
    id: 'entry-1',
    sid: 'session-abc',
    model: 'haiku',
    inputTokens: 100,
    outputTokens: 50,
    costUsd: 0.001,
    timestamp: '2026-01-15T10:00:00Z',
    capabilityName: 'echo_agent',
    ...overrides,
  }
}

describe('mapChildCostEntries', () => {
  it('maps required fields correctly', () => {
    const entries = [makeEntry()]
    const result = mapChildCostEntries(entries)

    expect(result).toHaveLength(1)
    expect(result[0]).toMatchObject({
      sid: 'session-abc',
      capability: 'echo_agent',
      costUsd: 0.001,
      turns: 0,
      inputTokens: 100,
      outputTokens: 50,
      model: 'haiku',
      status: 'success',
    })
  })

  it('preserves optional fields when present', () => {
    const entries = [
      makeEntry({
        commitSha: 'abc123',
        promptCacheWrite: 200,
        promptCacheRead: 150,
        promptVersion: 'v2',
        totalTokensIn: 450,
        totalTokensOut: 50,
      }),
    ]
    const result = mapChildCostEntries(entries)

    expect(result[0]).toMatchObject({
      commitSha: 'abc123',
      promptCacheWrite: 200,
      promptCacheRead: 150,
      promptVersion: 'v2',
      totalTokensIn: 450,
      totalTokensOut: 50,
    })
  })

  it('omits optional fields when absent', () => {
    const entries = [makeEntry()]
    const result = mapChildCostEntries(entries)

    expect(result[0]).not.toHaveProperty('commitSha')
    expect(result[0]).not.toHaveProperty('promptCacheWrite')
    expect(result[0]).not.toHaveProperty('promptCacheRead')
    expect(result[0]).not.toHaveProperty('promptVersion')
    expect(result[0]).not.toHaveProperty('totalTokensIn')
    expect(result[0]).not.toHaveProperty('totalTokensOut')
  })

  it('uses childSessionId as sid when available, falls back to entry sid', () => {
    const withChild = makeEntry({ childSessionId: 'child-session-xyz', sid: 'parent-sid' })
    const withoutChild = makeEntry({ sid: 'parent-sid' })

    const result = mapChildCostEntries([withChild, withoutChild])

    expect(result[0]!.sid).toBe('child-session-xyz')
    expect(result[1]!.sid).toBe('parent-sid')
  })

  it('handles empty input array', () => {
    const result = mapChildCostEntries([])

    expect(result).toEqual([])
  })
})
