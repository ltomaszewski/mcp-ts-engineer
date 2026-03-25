import { describe, expect, it } from 'vitest'
import { getProjectDir, groupFilesByProject } from '../pr-reviewer.helpers.js'

describe('getProjectDir', () => {
  it('returns apps/<name> for app files', () => {
    expect(getProjectDir('apps/mellow-app/src/foo.tsx')).toBe('apps/mellow-app')
  })

  it('returns packages/<name> for package files', () => {
    expect(getProjectDir('packages/types/src/index.ts')).toBe('packages/types')
  })

  it('returns root for top-level files', () => {
    expect(getProjectDir('tsconfig.json')).toBe('root')
  })

  it('returns root for dotfiles', () => {
    expect(getProjectDir('.github/workflows/ci.yml')).toBe('root')
  })

  it('handles nested app paths', () => {
    expect(getProjectDir('apps/mellow-server/src/modules/auth/auth.service.ts')).toBe(
      'apps/mellow-server',
    )
  })
})

describe('groupFilesByProject', () => {
  it('groups mixed files by project', () => {
    const files = [
      'apps/mellow-app/src/a.ts',
      'apps/mellow-server/src/b.ts',
      'apps/mellow-app/src/c.ts',
      'packages/types/src/d.ts',
      'tsconfig.json',
    ]

    const groups = groupFilesByProject(files)

    expect(groups.size).toBe(4)
    expect(groups.get('apps/mellow-app')).toEqual([
      'apps/mellow-app/src/a.ts',
      'apps/mellow-app/src/c.ts',
    ])
    expect(groups.get('apps/mellow-server')).toEqual(['apps/mellow-server/src/b.ts'])
    expect(groups.get('packages/types')).toEqual(['packages/types/src/d.ts'])
    expect(groups.get('root')).toEqual(['tsconfig.json'])
  })

  it('preserves order within groups', () => {
    const files = ['apps/x/z.ts', 'apps/x/a.ts', 'apps/x/m.ts']
    const groups = groupFilesByProject(files)
    expect(groups.get('apps/x')).toEqual(['apps/x/z.ts', 'apps/x/a.ts', 'apps/x/m.ts'])
  })

  it('returns empty map for empty input', () => {
    expect(groupFilesByProject([]).size).toBe(0)
  })
})
