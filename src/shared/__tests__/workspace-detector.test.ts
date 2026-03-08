/**
 * Tests for shared workspace detector.
 * Verifies detection still works after moving from capability-specific location.
 */

import { resolve } from 'node:path'
import { detectWorkspace, detectWorkspaceTechnologies } from '../workspace-detector.js'

/** Repo root — works regardless of where the tests are run from. */
const REPO_ROOT = resolve(import.meta.dirname, '../../..')

describe('detectWorkspace (shared)', () => {
  it('reads package.json and returns technologies', () => {
    const result = detectWorkspace(REPO_ROOT)

    expect(result.technologies).toBeInstanceOf(Array)
    expect(result.dependencies).toBeInstanceOf(Array)
    // Should detect @modelcontextprotocol/sdk and zod
    expect(result.dependencies).toContain('zod')
    expect(result.dependencies).toContain('@modelcontextprotocol/sdk')
  })

  it('returns empty for missing cwd', () => {
    const result = detectWorkspace(undefined)

    expect(result.technologies).toEqual([])
    expect(result.dependencies).toEqual([])
  })

  it('returns empty for invalid JSON', () => {
    const result = detectWorkspace('/nonexistent/path')

    expect(result.technologies).toEqual([])
    expect(result.dependencies).toEqual([])
  })

  it('detectWorkspaceTechnologies returns array', () => {
    const result = detectWorkspaceTechnologies(REPO_ROOT)

    expect(result).toBeInstanceOf(Array)
  })
})
