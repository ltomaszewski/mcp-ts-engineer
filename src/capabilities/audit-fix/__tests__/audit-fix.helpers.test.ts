import { type Mock, vi } from 'vitest'

/**
 * Tests for audit-fix helper functions (AC-9).
 * Tests discoverProjects() logic and fallback value verification.
 */

import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import {
  AUDIT_STEP_RESULT_FALLBACK,
  COMMIT_RESULT_FALLBACK,
  detectSubmodules,
  discoverProjects,
  ENG_FIX_RESULT_FALLBACK,
  TEST_RESULT_FALLBACK,
} from '../audit-fix.helpers.js'
import { deriveWorkspacesFromProject, invokeTestStep } from '../audit-fix-process-project.js'

describe('detectSubmodules', () => {
  it('returns empty array when cwd is undefined', () => {
    expect(detectSubmodules(undefined)).toEqual([])
  })

  it('returns empty array for nonexistent cwd', () => {
    expect(detectSubmodules('/nonexistent/path')).toEqual([])
  })

  it('returns array of strings (paths) when called on a git repo', () => {
    const result = detectSubmodules(process.cwd())
    expect(Array.isArray(result)).toBe(true)
    for (const path of result) {
      expect(typeof path).toBe('string')
      expect(path.length).toBeGreaterThan(0)
    }
  })
})

describe('discoverProjects', () => {
  it('returns empty array when cwd is undefined', () => {
    const result = discoverProjects(undefined)
    expect(result).toEqual([])
  })

  it('returns empty array for nonexistent cwd', () => {
    const result = discoverProjects('/nonexistent/path/that/does/not/exist')
    expect(result).toEqual([])
  })

  it('returns array of projects when valid cwd is provided', () => {
    const result = discoverProjects(process.cwd())
    expect(Array.isArray(result)).toBe(true)

    if (result.length > 0) {
      expect(result[0]).toHaveProperty('path')
      expect(result[0]).toHaveProperty('reason')
      expect(result[0]).toHaveProperty('priority')
      expect(typeof result[0].path).toBe('string')
      expect(typeof result[0].reason).toBe('string')
      expect(typeof result[0].priority).toBe('number')
    }
  })

  it('filters out explicitly excluded paths', () => {
    const allProjects = discoverProjects(process.cwd())
    if (allProjects.length === 0) return // Skip if no projects in cwd

    const excludePath = allProjects[0]!.path
    const filtered = discoverProjects(process.cwd(), [excludePath])
    expect(filtered.find((p) => p.path === excludePath)).toBeUndefined()
    expect(filtered.length).toBeLessThan(allProjects.length)
  })

  it('backward-compatible: no exclude returns same as before', () => {
    const withoutExclude = discoverProjects(process.cwd())
    const withEmptyExclude = discoverProjects(process.cwd(), [])
    // Submodules are auto-detected, so both should produce same result
    expect(withoutExclude).toEqual(withEmptyExclude)
  })
})

describe('fallback values', () => {
  it('AUDIT_STEP_RESULT_FALLBACK has status fail', () => {
    expect(AUDIT_STEP_RESULT_FALLBACK.status).toBe('fail')
    expect(AUDIT_STEP_RESULT_FALLBACK.fixes_applied).toBe(0)
    expect(AUDIT_STEP_RESULT_FALLBACK.issues_remaining).toBe(0)
    expect(AUDIT_STEP_RESULT_FALLBACK.tsc_passed).toBe(false)
    expect(AUDIT_STEP_RESULT_FALLBACK.files_with_issues).toEqual([])
  })

  it('ENG_FIX_RESULT_FALLBACK has status failed', () => {
    expect(ENG_FIX_RESULT_FALLBACK.status).toBe('failed')
    expect(ENG_FIX_RESULT_FALLBACK.files_modified).toEqual([])
  })

  it('COMMIT_RESULT_FALLBACK has committed false', () => {
    expect(COMMIT_RESULT_FALLBACK.committed).toBe(false)
    expect(COMMIT_RESULT_FALLBACK.commit_sha).toBeNull()
    expect(COMMIT_RESULT_FALLBACK.commit_message).toBeNull()
    expect(COMMIT_RESULT_FALLBACK.files_changed).toEqual([])
  })

  it('fallback values match schema shapes', () => {
    // Verify all fallback values are valid according to schemas
    expect(AUDIT_STEP_RESULT_FALLBACK).toMatchObject({
      status: expect.stringMatching(/^(pass|warn|fail)$/),
      fixes_applied: expect.any(Number),
      issues_remaining: expect.any(Number),
      tsc_passed: expect.any(Boolean),
      summary: expect.any(String),
      files_with_issues: expect.any(Array),
    })

    expect(ENG_FIX_RESULT_FALLBACK).toMatchObject({
      status: expect.stringMatching(/^(success|failed)$/),
      files_modified: expect.any(Array),
      summary: expect.any(String),
    })

    expect(COMMIT_RESULT_FALLBACK).toMatchObject({
      committed: expect.any(Boolean),
      commit_sha: null,
      commit_message: null,
      files_changed: expect.any(Array),
    })
  })

  it('TEST_RESULT_FALLBACK has passed false', () => {
    expect(TEST_RESULT_FALLBACK.passed).toBe(false)
    expect(TEST_RESULT_FALLBACK.tests_total).toBe(0)
    expect(TEST_RESULT_FALLBACK.tests_failed).toBe(0)
    expect(TEST_RESULT_FALLBACK.failure_summary).toBeTruthy()
    expect(TEST_RESULT_FALLBACK.workspaces_tested).toEqual([])
  })

  it('TEST_RESULT_FALLBACK matches TestResult schema shape', () => {
    expect(TEST_RESULT_FALLBACK).toMatchObject({
      passed: expect.any(Boolean),
      tests_total: expect.any(Number),
      tests_failed: expect.any(Number),
      failure_summary: expect.any(String),
      workspaces_tested: expect.any(Array),
    })
  })
})

describe('deriveWorkspacesFromProject', () => {
  it('returns single workspace from project path', () => {
    const result = deriveWorkspacesFromProject('apps/my-server')
    expect(result).toEqual(['apps/my-server'])
  })

  it('returns single workspace for packages', () => {
    const result = deriveWorkspacesFromProject('packages/types')
    expect(result).toEqual(['packages/types'])
  })

  it('handles root path', () => {
    const result = deriveWorkspacesFromProject('.')
    expect(result).toEqual(['.'])
  })

  it('handles nested paths', () => {
    const result = deriveWorkspacesFromProject('apps/my-server/src')
    expect(result).toEqual(['apps/my-server/src'])
  })
})

describe('invokeTestStep', () => {
  function createMockContext(): CapabilityContext {
    return {
      session: {
        id: 'test-session',
        state: 'active',
        startedAt: '2026-02-03T00:00:00Z',
        invocations: [],
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
      },
      invocation: {
        id: 'test-invocation',
        capability: 'test_capability',
        input: {},
        timestamp: '2026-02-03T00:00:00Z',
      },
      logger: {
        info: () => {},
        debug: () => {},
        error: () => {},
        warn: () => {},
      },
      getSessionCost: () => ({
        totalCostUsd: 0,
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalTurns: 0,
      }),
      promptVersion: 'v1',
      providerName: 'ClaudeProvider',
      invokeCapability: vi.fn<() => Promise<unknown>>(),
    }
  }

  it('invokes audit_fix_test_step capability with correct input', async () => {
    const mockContext = createMockContext()
    const mockResult = {
      passed: true,
      tests_total: 100,
      tests_failed: 0,
      failure_summary: '',
      workspaces_tested: ['apps/test'],
    }

    ;(mockContext.invokeCapability as Mock<() => Promise<unknown>>).mockResolvedValue(mockResult)

    const result = await invokeTestStep('apps/test', ['apps/test'], '/cwd', mockContext)

    expect(mockContext.invokeCapability).toHaveBeenCalledWith('audit_fix_test_step', {
      project_path: 'apps/test',
      workspaces: ['apps/test'],
      cwd: '/cwd',
    })
    expect(result).toEqual(mockResult)
  })

  it('passes multiple workspaces correctly', async () => {
    const mockContext = createMockContext()
    const mockResult = {
      passed: true,
      tests_total: 200,
      tests_failed: 0,
      failure_summary: '',
      workspaces_tested: ['apps/test1', 'apps/test2'],
    }

    ;(mockContext.invokeCapability as Mock<() => Promise<unknown>>).mockResolvedValue(mockResult)

    const result = await invokeTestStep('.', ['apps/test1', 'apps/test2'], '/cwd', mockContext)

    expect(mockContext.invokeCapability).toHaveBeenCalledWith('audit_fix_test_step', {
      project_path: '.',
      workspaces: ['apps/test1', 'apps/test2'],
      cwd: '/cwd',
    })
    expect(result).toEqual(mockResult)
  })

  it('handles undefined cwd', async () => {
    const mockContext = createMockContext()
    const mockResult = {
      passed: true,
      tests_total: 50,
      tests_failed: 0,
      failure_summary: '',
      workspaces_tested: ['packages/utils'],
    }

    ;(mockContext.invokeCapability as Mock<() => Promise<unknown>>).mockResolvedValue(mockResult)

    const result = await invokeTestStep(
      'packages/utils',
      ['packages/utils'],
      undefined,
      mockContext,
    )

    expect(mockContext.invokeCapability).toHaveBeenCalledWith('audit_fix_test_step', {
      project_path: 'packages/utils',
      workspaces: ['packages/utils'],
      cwd: undefined,
    })
    expect(result).toEqual(mockResult)
  })
})
