/**
 * Tests for Path Validation Hooks
 *
 * Tests the createPathDuplicationBlockerHook function which detects
 * and blocks path duplications like apps/X/apps/X or packages/Y/packages/Y.
 */

import {
  buildPathValidationHooks,
  createPathDuplicationBlockerHook,
} from '../path-validation-hooks.js'

describe('createPathDuplicationBlockerHook', () => {
  it('blocks apps/X/apps/X pattern', () => {
    const hook = createPathDuplicationBlockerHook()
    const result = hook({ file_path: 'apps/my-server/apps/my-server/src/test.ts' })

    expect(result.decision).toBe('block')
    expect(result.reason).toContain('Path duplication detected')
    expect(result.reason).toContain('/apps/my-server/')
  })

  it('blocks packages/X/packages/X pattern', () => {
    const hook = createPathDuplicationBlockerHook()
    const result = hook({ file_path: 'packages/types/packages/types/src/index.ts' })

    expect(result.decision).toBe('block')
    expect(result.reason).toContain('Path duplication detected')
    expect(result.reason).toContain('/types/')
  })

  it('blocks apps/X/packages/Y/apps/X pattern (deeply nested duplication)', () => {
    const hook = createPathDuplicationBlockerHook()
    const result = hook({
      file_path: 'apps/my-server/packages/types/apps/my-server/test.ts',
    })

    expect(result.decision).toBe('block')
    expect(result.reason).toContain('Path duplication detected')
  })

  it('blocks packages/X/apps/Y/packages/X pattern', () => {
    const hook = createPathDuplicationBlockerHook()
    const result = hook({
      file_path: 'packages/utils/apps/my-app/packages/utils/index.ts',
    })

    expect(result.decision).toBe('block')
    expect(result.reason).toContain('Path duplication detected')
  })

  it('allows apps/X/src/Y.ts (valid monorepo path)', () => {
    const hook = createPathDuplicationBlockerHook()
    const result = hook({ file_path: 'apps/my-server/src/modules/user/user.service.ts' })

    expect(result.decision).toBe('continue')
  })

  it('allows packages/X/src/index.ts (valid monorepo path)', () => {
    const hook = createPathDuplicationBlockerHook()
    const result = hook({ file_path: 'packages/types/src/api/user.types.ts' })

    expect(result.decision).toBe('continue')
  })

  it('allows deeply nested valid paths without duplication', () => {
    const hook = createPathDuplicationBlockerHook()
    const result = hook({
      file_path: 'apps/my-server/src/modules/auth/guards/jwt-auth.guard.ts',
    })

    expect(result.decision).toBe('continue')
  })

  it('allows root-level files', () => {
    const hook = createPathDuplicationBlockerHook()
    const result = hook({ file_path: 'README.md' })

    expect(result.decision).toBe('continue')
  })

  it('allows paths without file_path (guards against undefined)', () => {
    const hook = createPathDuplicationBlockerHook()
    const result = hook({})

    expect(result.decision).toBe('continue')
  })

  it('allows paths with similar but non-identical segments', () => {
    const hook = createPathDuplicationBlockerHook()
    const result = hook({ file_path: 'apps/my-server/src/app/app.module.ts' })

    expect(result.decision).toBe('continue')
  })

  it('blocks case-insensitive duplications', () => {
    const hook = createPathDuplicationBlockerHook()
    const result = hook({ file_path: 'apps/Server/apps/server/test.ts' })

    expect(result.decision).toBe('block')
    expect(result.reason).toContain('Path duplication detected')
  })

  it('handles paths with special characters', () => {
    const hook = createPathDuplicationBlockerHook()
    const result = hook({
      file_path: 'apps/my-server-v2/apps/my-server-v2/src/test.ts',
    })

    expect(result.decision).toBe('block')
    expect(result.reason).toContain('Path duplication detected')
  })
})

describe('buildPathValidationHooks', () => {
  it('returns object with PreToolUse key', () => {
    const hooks = buildPathValidationHooks()

    expect(hooks).toHaveProperty('PreToolUse')
    expect(Array.isArray(hooks.PreToolUse)).toBe(true)
  })

  it('has Write and Edit matchers', () => {
    const hooks = buildPathValidationHooks()

    expect(hooks.PreToolUse).toHaveLength(2)

    const matchers = hooks.PreToolUse.map((h) => h.matcher)
    expect(matchers).toContain('Write')
    expect(matchers).toContain('Edit')
  })

  it('both matchers use the same hook callback', () => {
    const hooks = buildPathValidationHooks()

    const writeHook = hooks.PreToolUse.find((h) => h.matcher === 'Write')
    const editHook = hooks.PreToolUse.find((h) => h.matcher === 'Edit')

    expect(writeHook).toBeDefined()
    expect(editHook).toBeDefined()
    expect(writeHook?.hooks).toHaveLength(1)
    expect(editHook?.hooks).toHaveLength(1)

    // Both should block the same invalid path
    const invalidPath = 'apps/test/apps/test/file.ts'
    const writeResult = writeHook?.hooks[0]({ file_path: invalidPath })
    const editResult = editHook?.hooks[0]({ file_path: invalidPath })

    expect(writeResult.decision).toBe('block')
    expect(editResult.decision).toBe('block')
  })
})
