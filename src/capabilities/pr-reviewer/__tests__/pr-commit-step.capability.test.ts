import { describe, expect, it } from 'vitest'
import { buildCommitMessage } from '../pr-commit-step.capability.js'

describe('buildCommitMessage', () => {
  it('produces singular subject for single fix', () => {
    const msg = buildCommitMessage(1, ['Fix A'])
    expect(msg).toContain('fix(pr-review): resolve 1 review finding')
    expect(msg).not.toContain('findings')
  })

  it('produces plural subject for multiple fixes', () => {
    const msg = buildCommitMessage(3, ['Fix A', 'Fix B', 'Fix C'])
    expect(msg).toContain('fix(pr-review): resolve 3 review findings')
  })

  it('returns subject only when titles are empty', () => {
    const msg = buildCommitMessage(2, [])
    expect(msg).toBe('fix(pr-review): resolve 2 review findings')
    expect(msg).not.toContain('\n')
  })

  it('lists titles as bullets in body', () => {
    const msg = buildCommitMessage(2, ['Title A', 'Title B'])
    expect(msg).toContain('- Title A')
    expect(msg).toContain('- Title B')
  })

  it('truncates long titles at 72 chars', () => {
    const longTitle = 'A'.repeat(100)
    const msg = buildCommitMessage(1, [longTitle])
    const bodyLine = msg.split('\n').find((l) => l.startsWith('- '))
    expect(bodyLine).toBeDefined()
    // "- " + 69 chars + "..." = 74 total
    expect(bodyLine!.length).toBeLessThanOrEqual(74)
    expect(bodyLine).toContain('...')
  })

  it('shows overflow when more than 10 titles', () => {
    const titles = Array.from({ length: 12 }, (_, i) => `Issue ${i + 1}`)
    const msg = buildCommitMessage(12, titles)
    expect(msg).toContain('- ...and 2 more')
    // Should list first 10
    expect(msg).toContain('- Issue 1')
    expect(msg).toContain('- Issue 10')
    // Should NOT list 11th individually
    expect(msg).not.toContain('- Issue 11')
  })
})
