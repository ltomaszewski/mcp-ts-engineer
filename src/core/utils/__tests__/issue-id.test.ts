import { generateIssueId } from '../issue-id.js'

describe('generateIssueId', () => {
  it('returns a 12-character hex string', () => {
    const id = generateIssueId('src/foo.ts', 'Missing null check')
    expect(id).toMatch(/^[0-9a-f]{12}$/)
  })

  it('is deterministic — same inputs produce same output', () => {
    const a = generateIssueId('src/foo.ts', 'Missing null check')
    const b = generateIssueId('src/foo.ts', 'Missing null check')
    expect(a).toBe(b)
  })

  it('produces different IDs for different file paths', () => {
    const a = generateIssueId('src/foo.ts', 'Missing null check')
    const b = generateIssueId('src/bar.ts', 'Missing null check')
    expect(a).not.toBe(b)
  })

  it('produces different IDs for different titles', () => {
    const a = generateIssueId('src/foo.ts', 'Missing null check')
    const b = generateIssueId('src/foo.ts', 'Type mismatch')
    expect(a).not.toBe(b)
  })

  it('handles empty strings', () => {
    const id = generateIssueId('', '')
    expect(id).toMatch(/^[0-9a-f]{12}$/)
  })
})
