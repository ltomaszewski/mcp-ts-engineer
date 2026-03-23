import { type MockInstance, vi } from 'vitest'

/**
 * Integration tests for processProject orchestration.
 * Tests lint phase execution, counter accuracy, fix tracking, and fatal error propagation.
 */

import type { CapabilityContext } from '../../../core/capability-registry/capability-registry.types.js'
import { CapabilityError, ServerShuttingDownError } from '../../../core/errors.js'
import type {
  AuditStepResult,
  DepsFixStepResult,
  DepsScanStepResult,
  EngFixResult,
  LintFixResult,
  LintScanResult,
} from '../audit-fix.schema.js'
import { processProject } from '../audit-fix-process-project.js'

describe('Process Project - Lint Integration', () => {
  let mockContext: CapabilityContext
  let invokeSpy: MockInstance<typeof mockContext.invokeCapability>

  beforeEach(() => {
    invokeSpy = vi.fn<typeof mockContext.invokeCapability>()
    mockContext = {
      invokeCapability: invokeSpy,
    } as unknown as CapabilityContext
  })

  describe('lint scan invocation order', () => {
    it('invokes lint scan BEFORE audit step (after deps scan)', async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: '',
      }

      const auditResult: AuditStepResult = {
        status: 'pass',
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: 'All clean',
      }

      const lintScanResult: LintScanResult = {
        lint_available: false,
        lint_passed: true,
        error_count: 0,
        warning_count: 0,
        lint_report: '',
        files_with_lint_errors: [],
      }

      const testResult = { passed: true, tests_total: 10, tests_failed: 0, failure_summary: '', workspaces_tested: ['apps/test-project'] }

      invokeSpy
        .mockResolvedValueOnce(depsScanResult) // deps scan (runs first)
        .mockResolvedValueOnce(lintScanResult) // lint scan
        .mockResolvedValueOnce(auditResult) // audit step
        .mockResolvedValueOnce(testResult) // test step

      await processProject('apps/test-project', 5, 10, '/test/cwd', mockContext, undefined)

      expect(invokeSpy).toHaveBeenCalledTimes(4)
      expect(invokeSpy.mock.calls[0]?.[0]).toBe('audit_fix_deps_scan_step')
      expect(invokeSpy.mock.calls[1]?.[0]).toBe('audit_fix_lint_scan_step')
      expect(invokeSpy.mock.calls[2]?.[0]).toBe('audit_fix_audit_step')
      expect(invokeSpy.mock.calls[3]?.[0]).toBe('audit_fix_test_step')
    })
  })

  describe('lint fix invocation conditions', () => {
    it('invokes lint fix ONLY when lint_available: true AND lint_passed: false', async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: '',
      }

      const lintScanResult: LintScanResult = {
        lint_available: true,
        lint_passed: false,
        error_count: 5,
        warning_count: 2,
        lint_report: '5 lint errors found',
        files_with_lint_errors: ['src/file1.ts', 'src/file2.ts'],
      }

      const lintFixResult: LintFixResult = {
        status: 'success',
        files_modified: ['src/file1.ts', 'src/file2.ts'],
        summary: 'Fixed 5 lint errors',
      }

      const auditResult: AuditStepResult = {
        status: 'pass',
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: 'All clean',
      }

      const testResult = { passed: true, tests_total: 10, tests_failed: 0, failure_summary: '', workspaces_tested: ['apps/test-project'] }

      invokeSpy
        .mockResolvedValueOnce(depsScanResult) // deps scan (runs first)
        .mockResolvedValueOnce(lintScanResult) // lint scan
        .mockResolvedValueOnce(lintFixResult) // lint fix
        .mockResolvedValueOnce(auditResult) // audit step
        .mockResolvedValueOnce(testResult) // test step
        .mockResolvedValueOnce({ commit_sha: 'abc123', status: 'success', summary: 'Committed' }) // commit

      const { result } = await processProject(
        'apps/test-project',
        5,
        10,
        '/test/cwd',
        mockContext,
        undefined,
      )

      expect(invokeSpy).toHaveBeenCalledWith('audit_fix_lint_scan_step', {
        project_path: 'apps/test-project',
        cwd: '/test/cwd',
      })

      expect(invokeSpy).toHaveBeenCalledWith('audit_fix_lint_fix_step', {
        project_path: 'apps/test-project',
        lint_report: '5 lint errors found',
        files_with_lint_errors: ['src/file1.ts', 'src/file2.ts'],
        cwd: '/test/cwd',
      })

      expect(result.files_modified).toContain('src/file1.ts')
      expect(result.files_modified).toContain('src/file2.ts')
    })

    it('does NOT invoke lint fix when lint_available: false', async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: '',
      }

      const lintScanResult: LintScanResult = {
        lint_available: false,
        lint_passed: true,
        error_count: 0,
        warning_count: 0,
        lint_report: '',
        files_with_lint_errors: [],
      }

      const auditResult: AuditStepResult = {
        status: 'pass',
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: 'All clean',
      }

      const testResult = { passed: true, tests_total: 10, tests_failed: 0, failure_summary: '', workspaces_tested: ['apps/test-project'] }

      invokeSpy
        .mockResolvedValueOnce(depsScanResult) // deps scan
        .mockResolvedValueOnce(lintScanResult) // lint scan
        .mockResolvedValueOnce(auditResult) // audit step
        .mockResolvedValueOnce(testResult) // test step

      await processProject('apps/test-project', 5, 10, '/test/cwd', mockContext, undefined)

      const lintFixCalls = invokeSpy.mock.calls.filter(
        (call) => call[0] === 'audit_fix_lint_fix_step',
      )
      expect(lintFixCalls).toHaveLength(0)
    })

    it('does NOT invoke lint fix when lint_passed: true', async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: '',
      }

      const lintScanResult: LintScanResult = {
        lint_available: true,
        lint_passed: true,
        error_count: 0,
        warning_count: 3,
        lint_report: '3 warnings found',
        files_with_lint_errors: [],
      }

      const auditResult: AuditStepResult = {
        status: 'pass',
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: 'All clean',
      }

      const testResult = { passed: true, tests_total: 10, tests_failed: 0, failure_summary: '', workspaces_tested: ['apps/test-project'] }

      invokeSpy
        .mockResolvedValueOnce(depsScanResult) // deps scan
        .mockResolvedValueOnce(lintScanResult) // lint scan
        .mockResolvedValueOnce(auditResult) // audit step
        .mockResolvedValueOnce(testResult) // test step

      await processProject('apps/test-project', 5, 10, '/test/cwd', mockContext, undefined)

      const lintFixCalls = invokeSpy.mock.calls.filter(
        (call) => call[0] === 'audit_fix_lint_fix_step',
      )
      expect(lintFixCalls).toHaveLength(0)
    })
  })

  describe('lint error handling', () => {
    it('continues workflow when lint scan throws error (uses fallback)', async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: '',
      }

      const auditResult: AuditStepResult = {
        status: 'pass',
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: 'All clean',
      }

      const testResult = { passed: true, tests_total: 10, tests_failed: 0, failure_summary: '', workspaces_tested: ['apps/test-project'] }

      invokeSpy
        .mockResolvedValueOnce(depsScanResult) // deps scan
        .mockRejectedValueOnce(new Error('Lint scan failed')) // lint scan error
        .mockResolvedValueOnce(auditResult) // audit step
        .mockResolvedValueOnce(testResult) // test step

      const { result } = await processProject(
        'apps/test-project',
        5,
        10,
        '/test/cwd',
        mockContext,
        undefined,
      )

      expect(invokeSpy).toHaveBeenCalledWith('audit_fix_lint_scan_step', {
        project_path: 'apps/test-project',
        cwd: '/test/cwd',
      })

      expect(invokeSpy).toHaveBeenCalledWith('audit_fix_audit_step', {
        project_path: 'apps/test-project',
        cwd: '/test/cwd',
      })

      expect(result.final_audit_status).toBe('pass')
    })
  })

  describe('files_modified tracking', () => {
    it('adds files_modified from lint fix to allFilesModified', async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: '',
      }

      const lintScanResult: LintScanResult = {
        lint_available: true,
        lint_passed: false,
        error_count: 3,
        warning_count: 0,
        lint_report: '3 errors',
        files_with_lint_errors: ['src/a.ts', 'src/b.ts'],
      }

      const lintFixResult: LintFixResult = {
        status: 'success',
        files_modified: ['src/a.ts', 'src/b.ts'],
        summary: 'Fixed 3 errors',
      }

      const auditResult: AuditStepResult = {
        status: 'pass',
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: 'All clean',
      }

      const testResult = { passed: true, tests_total: 10, tests_failed: 0, failure_summary: '', workspaces_tested: ['apps/test-project'] }

      invokeSpy
        .mockResolvedValueOnce(depsScanResult) // deps scan
        .mockResolvedValueOnce(lintScanResult) // lint scan
        .mockResolvedValueOnce(lintFixResult) // lint fix
        .mockResolvedValueOnce(auditResult) // audit step
        .mockResolvedValueOnce(testResult) // test step
        .mockResolvedValueOnce({ commit_sha: 'abc123', status: 'success', summary: 'Committed' }) // commit

      const { result } = await processProject(
        'apps/test-project',
        5,
        10,
        '/test/cwd',
        mockContext,
        undefined,
      )

      expect(result.files_modified).toContain('src/a.ts')
      expect(result.files_modified).toContain('src/b.ts')
      expect(result.files_modified.length).toBeGreaterThanOrEqual(2)
    })
  })

  describe('iteration counter accuracy', () => {
    const passTestResult = { passed: true, tests_total: 10, tests_failed: 0, failure_summary: '', workspaces_tested: ['apps/test-project'] }
    const failTestResult = { passed: false, tests_total: 10, tests_failed: 1, failure_summary: 'test failed', workspaces_tested: ['apps/test-project'] }

    it('reports iterations: 1 when audit passes on first check', async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: '',
      }

      const lintScanResult: LintScanResult = {
        lint_available: false,
        lint_passed: true,
        error_count: 0,
        warning_count: 0,
        lint_report: '',
        files_with_lint_errors: [],
      }

      const auditResult: AuditStepResult = {
        status: 'pass',
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: 'All clean',
      }

      invokeSpy
        .mockResolvedValueOnce(depsScanResult)
        .mockResolvedValueOnce(lintScanResult)
        .mockResolvedValueOnce(auditResult)
        .mockResolvedValueOnce(passTestResult)

      const { result, iterationsUsed } = await processProject(
        'apps/test-project',
        5,
        10,
        '/test/cwd',
        mockContext,
        undefined,
      )

      expect(result.iterations).toBe(1)
      expect(iterationsUsed).toBe(1)
    })

    it('reports iterations: 2 when audit fails first then passes', async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: '',
      }

      const lintScanResult: LintScanResult = {
        lint_available: false,
        lint_passed: true,
        error_count: 0,
        warning_count: 0,
        lint_report: '',
        files_with_lint_errors: [],
      }

      const failAudit: AuditStepResult = {
        status: 'fail',
        issues_remaining: 3,
        files_with_issues: ['src/a.ts'],
        fixes_applied: 2,
        tsc_passed: false,
        summary: '3 issues found',
      }

      const engResult: EngFixResult = {
        status: 'success',
        files_modified: ['src/a.ts'],
        summary: 'Fixed issues',
      }

      const passAudit: AuditStepResult = {
        status: 'pass',
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: 'All clean',
      }

      invokeSpy
        .mockResolvedValueOnce(depsScanResult)
        .mockResolvedValueOnce(lintScanResult)
        .mockResolvedValueOnce(failAudit)      // iteration 1: audit fails
        .mockResolvedValueOnce(failTestResult)  // iteration 1: test
        .mockResolvedValueOnce(engResult)       // iteration 1: eng fix
        .mockResolvedValueOnce(passAudit)       // iteration 2: audit passes
        .mockResolvedValueOnce(passTestResult)  // iteration 2: test passes
        .mockResolvedValueOnce({ committed: true, commit_sha: 'abc', commit_message: 'fix', files_changed: ['src/a.ts'] })

      const { result, iterationsUsed } = await processProject(
        'apps/test-project',
        5,
        10,
        '/test/cwd',
        mockContext,
        undefined,
      )

      expect(result.iterations).toBe(2)
      expect(iterationsUsed).toBe(2)
    })
  })

  describe('total_fixes counter accuracy', () => {
    const passTestResult = { passed: true, tests_total: 10, tests_failed: 0, failure_summary: '', workspaces_tested: ['apps/test-project'] }

    it('includes lint fix count in total_fixes', async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 0,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
        audit_json: '',
      }

      const lintScanResult: LintScanResult = {
        lint_available: true,
        lint_passed: false,
        error_count: 3,
        warning_count: 0,
        lint_report: '3 errors',
        files_with_lint_errors: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
      }

      const lintFixResult: LintFixResult = {
        status: 'success',
        files_modified: ['src/a.ts', 'src/b.ts', 'src/c.ts'],
        summary: 'Fixed 3 files',
      }

      const auditResult: AuditStepResult = {
        status: 'pass',
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: 'All clean',
      }

      invokeSpy
        .mockResolvedValueOnce(depsScanResult)
        .mockResolvedValueOnce(lintScanResult)
        .mockResolvedValueOnce(lintFixResult)
        .mockResolvedValueOnce(auditResult)
        .mockResolvedValueOnce(passTestResult)
        .mockResolvedValueOnce({ committed: true, commit_sha: 'abc', commit_message: 'fix', files_changed: [] })

      const { result } = await processProject(
        'apps/test-project',
        5,
        10,
        '/test/cwd',
        mockContext,
        undefined,
      )

      expect(result.total_fixes).toBe(3)
    })

    it('includes deps fix count in total_fixes', async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 5,
        vulnerabilities_by_severity: { critical: 1, high: 2, moderate: 1, low: 1 },
        audit_json: '{}',
      }

      const depsFixResult: DepsFixStepResult = {
        fix_ran: true,
        vulnerabilities_fixed: 4,
        vulnerabilities_remaining: 1,
        files_modified: ['package-lock.json'],
        fix_summary: 'Fixed 4 vulnerabilities',
      }

      const lintScanResult: LintScanResult = {
        lint_available: false,
        lint_passed: true,
        error_count: 0,
        warning_count: 0,
        lint_report: '',
        files_with_lint_errors: [],
      }

      const auditResult: AuditStepResult = {
        status: 'pass',
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: 'All clean',
      }

      invokeSpy
        .mockResolvedValueOnce(depsScanResult)
        .mockResolvedValueOnce(depsFixResult)
        .mockResolvedValueOnce(lintScanResult)
        .mockResolvedValueOnce(auditResult)
        .mockResolvedValueOnce(passTestResult)
        .mockResolvedValueOnce({ committed: true, commit_sha: 'abc', commit_message: 'fix', files_changed: [] })

      const { result } = await processProject(
        'apps/test-project',
        5,
        10,
        '/test/cwd',
        mockContext,
        undefined,
      )

      expect(result.total_fixes).toBe(4)
    })

    it('aggregates fixes from all phases: deps + lint + audit', async () => {
      const failTestResult = { passed: false, tests_total: 10, tests_failed: 1, failure_summary: 'test failed', workspaces_tested: ['apps/test-project'] }

      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 2,
        vulnerabilities_by_severity: { critical: 0, high: 1, moderate: 1, low: 0 },
        audit_json: '{}',
      }

      const depsFixResult: DepsFixStepResult = {
        fix_ran: true,
        vulnerabilities_fixed: 2,
        vulnerabilities_remaining: 0,
        files_modified: ['package-lock.json'],
        fix_summary: 'Fixed 2 vulnerabilities',
      }

      const lintScanResult: LintScanResult = {
        lint_available: true,
        lint_passed: false,
        error_count: 2,
        warning_count: 0,
        lint_report: '2 errors',
        files_with_lint_errors: ['src/a.ts', 'src/b.ts'],
      }

      const lintFixResult: LintFixResult = {
        status: 'success',
        files_modified: ['src/a.ts', 'src/b.ts'],
        summary: 'Fixed 2 files',
      }

      const failAudit: AuditStepResult = {
        status: 'fail',
        issues_remaining: 1,
        files_with_issues: ['src/c.ts'],
        fixes_applied: 3,
        tsc_passed: false,
        summary: '1 issue',
      }

      const engResult: EngFixResult = {
        status: 'success',
        files_modified: ['src/c.ts'],
        summary: 'Fixed',
      }

      const passAudit: AuditStepResult = {
        status: 'pass',
        issues_remaining: 0,
        files_with_issues: [],
        fixes_applied: 0,
        tsc_passed: true,
        summary: 'All clean',
      }

      invokeSpy
        .mockResolvedValueOnce(depsScanResult)
        .mockResolvedValueOnce(depsFixResult)
        .mockResolvedValueOnce(lintScanResult)
        .mockResolvedValueOnce(lintFixResult)
        .mockResolvedValueOnce(failAudit)       // iteration 1: audit fails, 3 fixes_applied
        .mockResolvedValueOnce(failTestResult)   // iteration 1: test fails
        .mockResolvedValueOnce(engResult)        // iteration 1: eng fix
        .mockResolvedValueOnce(passAudit)        // iteration 2: audit passes
        .mockResolvedValueOnce(passTestResult)   // iteration 2: test passes
        .mockResolvedValueOnce({ committed: true, commit_sha: 'abc', commit_message: 'fix', files_changed: [] })

      const { result } = await processProject(
        'apps/test-project',
        5,
        10,
        '/test/cwd',
        mockContext,
        undefined,
      )

      // deps: 2 + lint: 2 files + audit: 3 fixes_applied = 7
      expect(result.total_fixes).toBe(7)
    })

    it('includes fix counts in error path result', async () => {
      const depsScanResult: DepsScanStepResult = {
        audit_ran: true,
        vulnerabilities_found: 1,
        vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 1, low: 0 },
        audit_json: '{}',
      }

      const depsFixResult: DepsFixStepResult = {
        fix_ran: true,
        vulnerabilities_fixed: 1,
        vulnerabilities_remaining: 0,
        files_modified: ['package-lock.json'],
        fix_summary: 'Fixed 1 vulnerability',
      }

      const lintScanResult: LintScanResult = {
        lint_available: false,
        lint_passed: true,
        error_count: 0,
        warning_count: 0,
        lint_report: '',
        files_with_lint_errors: [],
      }

      invokeSpy
        .mockResolvedValueOnce(depsScanResult)
        .mockResolvedValueOnce(depsFixResult)
        .mockResolvedValueOnce(lintScanResult)
        .mockRejectedValueOnce(new Error('Audit step crashed'))

      const { result } = await processProject(
        'apps/test-project',
        5,
        10,
        '/test/cwd',
        mockContext,
        undefined,
      )

      expect(result.final_audit_status).toBe('fail')
      expect(result.total_fixes).toBe(1)
    })
  })
})

describe('Process Project - Fatal Error Propagation', () => {
  let mockContext: CapabilityContext
  let invokeSpy: MockInstance<typeof mockContext.invokeCapability>

  beforeEach(() => {
    invokeSpy = vi.fn<typeof mockContext.invokeCapability>()
    mockContext = {
      invokeCapability: invokeSpy,
    } as unknown as CapabilityContext
  })

  it('re-throws ServerShuttingDownError from deps scan (catch #1)', async () => {
    invokeSpy.mockRejectedValueOnce(new ServerShuttingDownError('shutting down'))

    await expect(
      processProject('apps/test', 5, 10, '/cwd', mockContext, undefined),
    ).rejects.toThrow(ServerShuttingDownError)
  })

  it('re-throws fatal "aborted by user" from deps fix (catch #2)', async () => {
    const depsScan: DepsScanStepResult = {
      audit_ran: true,
      vulnerabilities_found: 3,
      vulnerabilities_by_severity: { critical: 1, high: 1, moderate: 1, low: 0 },
      audit_json: '{}',
    }
    invokeSpy
      .mockResolvedValueOnce(depsScan) // deps scan succeeds
      .mockRejectedValueOnce(new Error('Claude Code process aborted by user')) // deps fix fatal

    await expect(
      processProject('apps/test', 5, 10, '/cwd', mockContext, undefined),
    ).rejects.toThrow('aborted by user')
  })

  it('re-throws fatal error from lint scan (catch #3)', async () => {
    const depsScan: DepsScanStepResult = {
      audit_ran: true,
      vulnerabilities_found: 0,
      vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
      audit_json: '',
    }
    invokeSpy
      .mockResolvedValueOnce(depsScan)
      .mockRejectedValueOnce(new ServerShuttingDownError('shutting down'))

    await expect(
      processProject('apps/test', 5, 10, '/cwd', mockContext, undefined),
    ).rejects.toThrow(ServerShuttingDownError)
  })

  it('re-throws CapabilityError wrapping fatal message from lint fix (catch #4)', async () => {
    const depsScan: DepsScanStepResult = {
      audit_ran: true,
      vulnerabilities_found: 0,
      vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
      audit_json: '',
    }
    const lintScan: LintScanResult = {
      lint_available: true,
      lint_passed: false,
      error_count: 1,
      warning_count: 0,
      lint_report: 'errors',
      files_with_lint_errors: ['a.ts'],
    }
    invokeSpy
      .mockResolvedValueOnce(depsScan)
      .mockResolvedValueOnce(lintScan)
      .mockRejectedValueOnce(
        new CapabilityError('Child capability lint_fix failed: Claude Code process aborted by user'),
      )

    await expect(
      processProject('apps/test', 5, 10, '/cwd', mockContext, undefined),
    ).rejects.toThrow('aborted by user')
  })

  it('re-throws fatal error from outer catch (audit step throws fatal)', async () => {
    const depsScan: DepsScanStepResult = {
      audit_ran: true,
      vulnerabilities_found: 0,
      vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
      audit_json: '',
    }
    const lintScan: LintScanResult = {
      lint_available: false,
      lint_passed: true,
      error_count: 0,
      warning_count: 0,
      lint_report: '',
      files_with_lint_errors: [],
    }
    invokeSpy
      .mockResolvedValueOnce(depsScan)
      .mockResolvedValueOnce(lintScan)
      .mockRejectedValueOnce(new ServerShuttingDownError('shutting down')) // audit step

    await expect(
      processProject('apps/test', 5, 10, '/cwd', mockContext, undefined),
    ).rejects.toThrow(ServerShuttingDownError)
  })

  it('swallows transient error and returns graceful fallback', async () => {
    const depsScan: DepsScanStepResult = {
      audit_ran: true,
      vulnerabilities_found: 0,
      vulnerabilities_by_severity: { critical: 0, high: 0, moderate: 0, low: 0 },
      audit_json: '',
    }
    const lintScan: LintScanResult = {
      lint_available: false,
      lint_passed: true,
      error_count: 0,
      warning_count: 0,
      lint_report: '',
      files_with_lint_errors: [],
    }
    invokeSpy
      .mockResolvedValueOnce(depsScan)
      .mockResolvedValueOnce(lintScan)
      .mockRejectedValueOnce(new Error('network timeout')) // transient audit error

    const { result } = await processProject('apps/test', 5, 10, '/cwd', mockContext, undefined)
    expect(result.final_audit_status).toBe('fail')
    expect(result.summary).toContain('network timeout')
  })

  it('logs WARN to stderr when step error is caught', async () => {
    // Fresh spy within the test to avoid interference
    const localSpy = vi.spyOn(process.stderr, 'write')
    const lintScan: LintScanResult = {
      lint_available: false,
      lint_passed: true,
      error_count: 0,
      warning_count: 0,
      lint_report: '',
      files_with_lint_errors: [],
    }
    const auditResult: AuditStepResult = {
      status: 'pass',
      issues_remaining: 0,
      files_with_issues: [],
      fixes_applied: 0,
      tsc_passed: true,
      summary: 'All clean',
    }
    const testResult = { passed: true, tests_total: 1, tests_failed: 0, failure_summary: '', workspaces_tested: ['apps/test'] }

    // deps scan throws transient, then lint scan + audit succeed
    invokeSpy
      .mockRejectedValueOnce(new Error('some transient error'))
      .mockResolvedValueOnce(lintScan)
      .mockResolvedValueOnce(auditResult)
      .mockResolvedValueOnce(testResult)

    await processProject('apps/test', 5, 10, '/cwd', mockContext, undefined)

    expect(localSpy).toHaveBeenCalled()
    const logged = localSpy.mock.calls.find((c) => String(c[0]).includes('WARN'))
    expect(logged).toBeDefined()
    expect(String(logged?.[0])).toContain('deps_scan')
    localSpy.mockRestore()
  })
})
