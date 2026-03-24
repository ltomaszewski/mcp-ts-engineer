import { describe, expect, it, vi } from 'vitest'
import { isProtectedPath } from '../git-safety.js'

describe('isProtectedPath', () => {
  describe('protected paths', () => {
    it.each([
      // scripts/ directories
      ['scripts/bump-version.js', 'root scripts'],
      ['apps/mellow-app/scripts/bump-version.js', 'app scripts'],
      ['apps/mellow-app/scripts/check-fingerprint.js', 'fingerprint script'],
      ['apps/mellow-app/scripts/generate-image-map.js', 'image map script'],
      ['packages/utils/scripts/build.sh', 'package scripts'],

      // .maestro/ directories
      ['.maestro/helpers/reset-database.js', 'root maestro'],
      ['apps/mellow-app/.maestro/helpers/reset-database.js', 'app maestro helper'],
      ['apps/mellow-app/.maestro/helpers/seed-test-user.js', 'app maestro seed'],
      ['apps/mellow-app/.maestro/helpers/seed-user-with-learn-progress.js', 'app maestro seed progress'],

      // Config files
      ['metro.config.js', 'root metro config'],
      ['apps/mellow-app/metro.config.js', 'app metro config'],
      ['babel.config.js', 'root babel config'],
      ['apps/mellow-app/babel.config.js', 'app babel config'],
      ['jest.config.js', 'jest config'],
      ['apps/mellow-server/jest.config.js', 'server jest config'],
      ['vitest.config.ts', 'vitest config'],
      ['packages/mcp-ts-engineer/vitest.config.ts', 'package vitest config'],
      ['knip.config.ts', 'knip config'],
      ['apps/mellow-server/knip.config.ts', 'server knip config'],
      ['apps/mellow-app/knip.json', 'app knip json'],
      ['app.config.ts', 'expo app config'],
      ['apps/mellow-app/app.config.ts', 'app expo config'],
      ['tailwind.config.js', 'tailwind config'],
      ['tsconfig.json', 'root tsconfig'],
      ['tsconfig.build.json', 'build tsconfig'],
      ['biome.json', 'biome config'],
    ])('%s is protected (%s)', (path) => {
      expect(isProtectedPath(path)).toBe(true)
    })
  })

  describe('unprotected paths (safe to delete)', () => {
    it.each([
      ['src/services/user.service.ts', 'source file'],
      ['src/__tests__/helper.ts', 'test helper'],
      ['src/features/onboarding/components/index.ts', 'barrel file'],
      ['src/features/schedule/hooks/useSleepScoreFeedback.ts', 'unused hook'],
      ['apps/mellow-app/src/stores/auth.store.ts', 'store file'],
      ['packages/types/src/index.ts', 'package source'],
      ['docs/specs/todo/feature.md', 'spec doc'],
    ])('%s is NOT protected (%s)', (path) => {
      expect(isProtectedPath(path)).toBe(false)
    })
  })
})
