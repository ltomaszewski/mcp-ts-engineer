/**
 * Tests for audit-fix schemas (AC-5).
 * Validates all schemas with valid input, defaults, boundary values, and invalid input.
 */

import {
  AuditFixInputSchema,
  AuditFixOutputSchema,
  AuditPlanSchema,
  AuditStepResultSchema,
  CommitResultSchema,
  DepsFixStepInputSchema,
  DepsFixStepResultSchema,
  DepsScanStepInputSchema,
  DepsScanStepResultSchema,
  EngFixResultSchema,
  EngStepInputSchema,
  LintFixInputSchema,
  LintFixResultSchema,
  LintScanInputSchema,
  LintScanResultSchema,
  ProjectResultSchema,
  TestResultSchema,
  TestStepInputSchema,
  VulnerabilitiesBySeveritySchema,
} from '../audit-fix.schema.js'

describe('AuditFixInputSchema', () => {
  it('accepts valid input with all fields', () => {
    const input = {
      project: 'apps/my-server',
      max_iteration_per_project: 5,
      max_total_cap: 15,
      cwd: '/path/to/workspace',
      spec_path: 'docs/specs/feature.md',
    }
    const result = AuditFixInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(input)
    }
  })

  it('applies defaults for max_iteration_per_project and max_total_cap', () => {
    const input = { cwd: '/path/to/workspace' }
    const result = AuditFixInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.max_iteration_per_project).toBe(2)
      expect(result.data.max_total_cap).toBe(10)
    }
  })

  it('rejects max_iteration_per_project below minimum', () => {
    const input = { max_iteration_per_project: 0 }
    const result = AuditFixInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects max_iteration_per_project above maximum', () => {
    const input = { max_iteration_per_project: 11 }
    const result = AuditFixInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects max_total_cap below minimum', () => {
    const input = { max_total_cap: 0 }
    const result = AuditFixInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects max_total_cap above maximum', () => {
    const input = { max_total_cap: 21 }
    const result = AuditFixInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})

describe('AuditPlanSchema', () => {
  it('accepts valid plan with multiple projects', () => {
    const plan = {
      projects: [
        { path: 'apps/my-server', reason: 'TypeScript violations', priority: 1 },
        { path: 'apps/my-app', reason: 'ESLint errors', priority: 2 },
      ],
    }
    const result = AuditPlanSchema.safeParse(plan)
    expect(result.success).toBe(true)
  })

  it('accepts empty projects array', () => {
    const plan = { projects: [] }
    const result = AuditPlanSchema.safeParse(plan)
    expect(result.success).toBe(true)
  })

  it('rejects plan missing projects field', () => {
    const plan = {}
    const result = AuditPlanSchema.safeParse(plan)
    expect(result.success).toBe(false)
  })
})

describe('AuditStepResultSchema', () => {
  it('accepts valid audit result with pass status', () => {
    const result = {
      status: 'pass' as const,
      fixes_applied: 5,
      issues_remaining: 0,
      tsc_passed: true,
      summary: 'All checks passed',
      files_with_issues: [],
    }
    const parsed = AuditStepResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('rejects negative fixes_applied', () => {
    const result = {
      status: 'fail' as const,
      fixes_applied: -1,
      issues_remaining: 3,
      tsc_passed: false,
      summary: 'Failed',
      files_with_issues: ['file.ts'],
    }
    const parsed = AuditStepResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })

  it('rejects invalid status value', () => {
    const result = {
      status: 'invalid',
      fixes_applied: 0,
      issues_remaining: 0,
      tsc_passed: true,
      summary: 'Invalid',
      files_with_issues: [],
    }
    const parsed = AuditStepResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })
})

describe('EngFixResultSchema', () => {
  it('accepts valid eng fix result with success status', () => {
    const result = {
      status: 'success' as const,
      files_modified: ['src/module.ts', 'src/utils.ts'],
      summary: 'Fixed 2 files',
    }
    const parsed = EngFixResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('accepts empty files_modified array', () => {
    const result = {
      status: 'failed' as const,
      files_modified: [],
      summary: 'No fixes applied',
    }
    const parsed = EngFixResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('rejects invalid status value', () => {
    const result = {
      status: 'invalid',
      files_modified: [],
      summary: 'Invalid',
    }
    const parsed = EngFixResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })
})

describe('CommitResultSchema', () => {
  it('accepts valid commit result with successful commit', () => {
    const result = {
      committed: true,
      commit_sha: 'abc123',
      commit_message: 'chore(server): auto-fix audit violations',
      files_changed: ['src/file.ts'],
    }
    const parsed = CommitResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('accepts commit result with null sha and message when not committed', () => {
    const result = {
      committed: false,
      commit_sha: null,
      commit_message: null,
      files_changed: [],
    }
    const parsed = CommitResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })
})

describe('ProjectResultSchema', () => {
  it('accepts valid project result', () => {
    const result = {
      project_path: 'apps/my-server',
      iterations: 2,
      total_fixes: 10,
      final_audit_status: 'pass' as const,
      files_modified: ['src/file.ts'],
      commit_sha: 'abc123',
      summary: 'Project fixed successfully',
    }
    const parsed = ProjectResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('rejects negative iterations', () => {
    const result = {
      project_path: 'apps/my-server',
      iterations: -1,
      total_fixes: 0,
      final_audit_status: 'fail' as const,
      files_modified: [],
      commit_sha: null,
      summary: 'Invalid',
    }
    const parsed = ProjectResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })
})

describe('AuditFixOutputSchema', () => {
  it('accepts valid output with success status', () => {
    const output = {
      status: 'success' as const,
      projects_audited: 2,
      total_iterations: 4,
      project_results: [
        {
          project_path: 'apps/my-server',
          iterations: 2,
          total_fixes: 5,
          final_audit_status: 'pass' as const,
          files_modified: ['src/file.ts'],
          commit_sha: 'abc123',
          summary: 'Fixed',
        },
      ],
      summary: 'All projects fixed successfully',
      session_id: 'test-session-123',
    }
    const parsed = AuditFixOutputSchema.safeParse(output)
    expect(parsed.success).toBe(true)
  })

  it('accepts output without session_id (optional)', () => {
    const output = {
      status: 'partial' as const,
      projects_audited: 1,
      total_iterations: 2,
      project_results: [],
      summary: 'Partially fixed',
    }
    const parsed = AuditFixOutputSchema.safeParse(output)
    expect(parsed.success).toBe(true)
  })

  it('rejects invalid status value', () => {
    const output = {
      status: 'invalid',
      projects_audited: 0,
      total_iterations: 0,
      project_results: [],
      summary: 'Invalid',
    }
    const parsed = AuditFixOutputSchema.safeParse(output)
    expect(parsed.success).toBe(false)
  })
})

describe('TestStepInputSchema', () => {
  it('accepts valid test input with all required fields', () => {
    const input = {
      project_path: 'apps/my-server',
      workspaces: ['apps/my-server'],
      cwd: '/path/to/workspace',
    }
    const result = TestStepInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(input)
    }
  })

  it('accepts test input with multiple workspaces', () => {
    const input = {
      project_path: '.',
      workspaces: ['apps/my-server', 'packages/utils'],
    }
    const result = TestStepInputSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('accepts test input without cwd (optional)', () => {
    const input = {
      project_path: 'apps/my-server',
      workspaces: ['apps/my-server'],
    }
    const result = TestStepInputSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('rejects empty project_path', () => {
    const input = {
      project_path: '',
      workspaces: ['apps/my-server'],
    }
    const result = TestStepInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects empty workspaces array', () => {
    const input = {
      project_path: 'apps/my-server',
      workspaces: [],
    }
    const result = TestStepInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects workspaces with empty strings', () => {
    const input = {
      project_path: 'apps/my-server',
      workspaces: ['apps/my-server', ''],
    }
    const result = TestStepInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects missing project_path', () => {
    const input = {
      workspaces: ['apps/my-server'],
    }
    const result = TestStepInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects missing workspaces', () => {
    const input = {
      project_path: 'apps/my-server',
    }
    const result = TestStepInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})

describe('TestResultSchema', () => {
  it('accepts valid test result with all tests passing', () => {
    const result = {
      passed: true,
      tests_total: 150,
      tests_failed: 0,
      failure_summary: '',
      workspaces_tested: ['apps/my-server'],
    }
    const parsed = TestResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('accepts test result with failures', () => {
    const result = {
      passed: false,
      tests_total: 150,
      tests_failed: 5,
      failure_summary: '5 tests failed in auth module',
      workspaces_tested: ['apps/my-server', 'packages/utils'],
    }
    const parsed = TestResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('accepts test result with empty workspaces_tested', () => {
    const result = {
      passed: false,
      tests_total: 0,
      tests_failed: 0,
      failure_summary: 'No tests found',
      workspaces_tested: [],
    }
    const parsed = TestResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })

  it('rejects negative tests_total', () => {
    const result = {
      passed: false,
      tests_total: -1,
      tests_failed: 0,
      failure_summary: 'Invalid',
      workspaces_tested: [],
    }
    const parsed = TestResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })

  it('rejects negative tests_failed', () => {
    const result = {
      passed: false,
      tests_total: 100,
      tests_failed: -5,
      failure_summary: 'Invalid',
      workspaces_tested: [],
    }
    const parsed = TestResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })

  it('rejects missing passed field', () => {
    const result = {
      tests_total: 100,
      tests_failed: 0,
      failure_summary: '',
      workspaces_tested: [],
    }
    const parsed = TestResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })

  it('rejects missing failure_summary', () => {
    const result = {
      passed: true,
      tests_total: 100,
      tests_failed: 0,
      workspaces_tested: [],
    }
    const parsed = TestResultSchema.safeParse(result)
    expect(parsed.success).toBe(false)
  })
})

describe('AuditFixInputSchema - Extended Fields', () => {
  it('accepts optional spec_path', () => {
    const input = { spec_path: 'docs/specs/feature.md' }
    const result = AuditFixInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.spec_path).toBe('docs/specs/feature.md')
    }
  })

  it('does not accept skip_tests field', () => {
    const input = { skip_tests: true }
    const result = AuditFixInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect('skip_tests' in result.data).toBe(false)
    }
  })
})

describe('EngStepInputSchema - Extended Fields', () => {
  it('accepts optional test_failure_summary', () => {
    const input = {
      project_path: 'apps/my-server',
      audit_summary: '5 violations found',
      files_with_issues: ['src/file.ts'],
      iteration_number: 1,
      test_failure_summary: '3 tests failed in auth module',
    }
    const result = EngStepInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.test_failure_summary).toBe('3 tests failed in auth module')
    }
  })

  it('accepts optional spec_path', () => {
    const input = {
      project_path: 'apps/my-server',
      audit_summary: '5 violations found',
      files_with_issues: ['src/file.ts'],
      iteration_number: 1,
      spec_path: 'docs/specs/auth-feature.md',
    }
    const result = EngStepInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.spec_path).toBe('docs/specs/auth-feature.md')
    }
  })

  it('accepts both test_failure_summary and spec_path', () => {
    const input = {
      project_path: 'apps/my-server',
      audit_summary: '5 violations found',
      files_with_issues: ['src/file.ts'],
      iteration_number: 1,
      test_failure_summary: '2 tests failed',
      spec_path: 'docs/specs/feature.md',
    }
    const result = EngStepInputSchema.safeParse(input)
    expect(result.success).toBe(true)
  })

  it('accepts input without new optional fields (backward compatibility)', () => {
    const input = {
      project_path: 'apps/my-server',
      audit_summary: '5 violations found',
      files_with_issues: ['src/file.ts'],
      iteration_number: 1,
    }
    const result = EngStepInputSchema.safeParse(input)
    expect(result.success).toBe(true)
  })
})

describe('ProjectResultSchema - Extended Fields', () => {
  it('accepts tests_passed as true', () => {
    const result = {
      project_path: 'apps/my-server',
      iterations: 2,
      total_fixes: 10,
      final_audit_status: 'pass' as const,
      files_modified: ['src/file.ts'],
      commit_sha: 'abc123',
      summary: 'Project fixed successfully',
      tests_passed: true,
    }
    const parsed = ProjectResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.tests_passed).toBe(true)
    }
  })

  it('accepts tests_passed as false', () => {
    const result = {
      project_path: 'apps/my-server',
      iterations: 2,
      total_fixes: 10,
      final_audit_status: 'warn' as const,
      files_modified: ['src/file.ts'],
      commit_sha: 'abc123',
      summary: 'Fixed but tests failed',
      tests_passed: false,
    }
    const parsed = ProjectResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.tests_passed).toBe(false)
    }
  })

  it('accepts tests_passed as null (tests skipped)', () => {
    const result = {
      project_path: 'apps/my-server',
      iterations: 2,
      total_fixes: 10,
      final_audit_status: 'pass' as const,
      files_modified: ['src/file.ts'],
      commit_sha: 'abc123',
      summary: 'Fixed without running tests',
      tests_passed: null,
    }
    const parsed = ProjectResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.tests_passed).toBe(null)
    }
  })

  it('accepts result without tests_passed (backward compatibility)', () => {
    const result = {
      project_path: 'apps/my-server',
      iterations: 2,
      total_fixes: 10,
      final_audit_status: 'pass' as const,
      files_modified: ['src/file.ts'],
      commit_sha: 'abc123',
      summary: 'Project fixed successfully',
    }
    const parsed = ProjectResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
  })
})

describe('LintScanInputSchema', () => {
  it('validates project_path is required with minimum 1 character', () => {
    const input = { project_path: 'apps/my-server' }
    const result = LintScanInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.project_path).toBe('apps/my-server')
    }
  })

  it('accepts optional cwd field', () => {
    const input = {
      project_path: 'apps/my-server',
      cwd: '/path/to/workspace',
    }
    const result = LintScanInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cwd).toBe('/path/to/workspace')
    }
  })

  it('rejects empty project_path', () => {
    const input = { project_path: '' }
    const result = LintScanInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})

describe('LintScanResultSchema', () => {
  it('validates all 6 required fields with correct types', () => {
    const result = {
      lint_available: true,
      lint_passed: false,
      error_count: 5,
      warning_count: 3,
      lint_report: 'Full lint output...',
      files_with_lint_errors: ['src/file1.ts', 'src/file2.ts'],
    }
    const parsed = LintScanResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)
    if (parsed.success) {
      expect(parsed.data.lint_available).toBe(true)
      expect(parsed.data.lint_passed).toBe(false)
      expect(parsed.data.error_count).toBe(5)
      expect(parsed.data.warning_count).toBe(3)
      expect(parsed.data.lint_report).toBe('Full lint output...')
      expect(parsed.data.files_with_lint_errors).toEqual(['src/file1.ts', 'src/file2.ts'])
    }
  })

  it('validates error_count and warning_count are non-negative integers', () => {
    const validResult = {
      lint_available: true,
      lint_passed: true,
      error_count: 0,
      warning_count: 0,
      lint_report: '',
      files_with_lint_errors: [],
    }
    const validParsed = LintScanResultSchema.safeParse(validResult)
    expect(validParsed.success).toBe(true)

    const negativeErrorCount = { ...validResult, error_count: -1 }
    const negativeErrorParsed = LintScanResultSchema.safeParse(negativeErrorCount)
    expect(negativeErrorParsed.success).toBe(false)

    const negativeWarningCount = { ...validResult, warning_count: -1 }
    const negativeWarningParsed = LintScanResultSchema.safeParse(negativeWarningCount)
    expect(negativeWarningParsed.success).toBe(false)
  })

  it('validates files_with_lint_errors is array of strings', () => {
    const result = {
      lint_available: true,
      lint_passed: false,
      error_count: 2,
      warning_count: 0,
      lint_report: 'Lint output',
      files_with_lint_errors: ['src/file1.ts', 'src/file2.ts'],
    }
    const parsed = LintScanResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)

    const invalidFiles = { ...result, files_with_lint_errors: ['file1.ts', 123] }
    const invalidParsed = LintScanResultSchema.safeParse(invalidFiles)
    expect(invalidParsed.success).toBe(false)
  })
})

describe('LintFixInputSchema', () => {
  it('validates required fields: project_path, lint_report, files_with_lint_errors', () => {
    const input = {
      project_path: 'apps/my-server',
      lint_report: 'Full lint output with errors...',
      files_with_lint_errors: ['src/file1.ts', 'src/file2.ts'],
    }
    const result = LintFixInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.project_path).toBe('apps/my-server')
      expect(result.data.lint_report).toBe('Full lint output with errors...')
      expect(result.data.files_with_lint_errors).toEqual(['src/file1.ts', 'src/file2.ts'])
    }
  })

  it('accepts optional cwd field', () => {
    const input = {
      project_path: 'apps/my-server',
      lint_report: 'Lint errors',
      files_with_lint_errors: ['src/file.ts'],
      cwd: '/workspace/monorepo',
    }
    const result = LintFixInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cwd).toBe('/workspace/monorepo')
    }
  })
})

describe('LintFixResultSchema', () => {
  it("validates status enum accepts 'success' or 'failed'", () => {
    const successResult = {
      status: 'success' as const,
      files_modified: ['src/file1.ts'],
      summary: 'Fixed 5 lint errors',
    }
    const successParsed = LintFixResultSchema.safeParse(successResult)
    expect(successParsed.success).toBe(true)

    const failedResult = {
      status: 'failed' as const,
      files_modified: [],
      summary: 'Unable to fix errors',
    }
    const failedParsed = LintFixResultSchema.safeParse(failedResult)
    expect(failedParsed.success).toBe(true)

    const invalidStatus = { ...successResult, status: 'invalid' }
    const invalidParsed = LintFixResultSchema.safeParse(invalidStatus)
    expect(invalidParsed.success).toBe(false)
  })

  it('validates files_modified is string array', () => {
    const result = {
      status: 'success' as const,
      files_modified: ['src/file1.ts', 'src/file2.ts'],
      summary: 'Fixed files',
    }
    const parsed = LintFixResultSchema.safeParse(result)
    expect(parsed.success).toBe(true)

    const emptyArray = { ...result, files_modified: [] }
    const emptyParsed = LintFixResultSchema.safeParse(emptyArray)
    expect(emptyParsed.success).toBe(true)

    const invalidArray = { ...result, files_modified: [123, 'file.ts'] }
    const invalidParsed = LintFixResultSchema.safeParse(invalidArray)
    expect(invalidParsed.success).toBe(false)
  })
})

describe('VulnerabilitiesBySeveritySchema', () => {
  it('accepts valid severity counts with all fields', () => {
    const severities = {
      critical: 2,
      high: 5,
      moderate: 10,
      low: 3,
    }
    const result = VulnerabilitiesBySeveritySchema.safeParse(severities)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(severities)
    }
  })

  it('rejects negative values', () => {
    const severities = {
      critical: -1,
      high: 0,
      moderate: 0,
      low: 0,
    }
    const result = VulnerabilitiesBySeveritySchema.safeParse(severities)
    expect(result.success).toBe(false)
  })
})

describe('DepsScanStepInputSchema', () => {
  it('accepts valid project_path', () => {
    const input = { project_path: 'apps/my-server' }
    const result = DepsScanStepInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.project_path).toBe('apps/my-server')
    }
  })

  it('accepts project_path with cwd', () => {
    const input = {
      project_path: 'apps/my-server',
      cwd: '/workspace',
    }
    const result = DepsScanStepInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cwd).toBe('/workspace')
    }
  })

  it('rejects empty project_path', () => {
    const input = { project_path: '' }
    const result = DepsScanStepInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects missing project_path', () => {
    const input = {}
    const result = DepsScanStepInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})

describe('DepsScanStepResultSchema', () => {
  it('accepts valid result with all fields', () => {
    const scanResult = {
      audit_ran: true,
      vulnerabilities_found: 15,
      vulnerabilities_by_severity: {
        critical: 2,
        high: 5,
        moderate: 6,
        low: 2,
      },
      audit_json: '{"vulnerabilities": {}}',
    }
    const result = DepsScanStepResultSchema.safeParse(scanResult)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(scanResult)
    }
  })

  it('rejects negative vulnerability counts', () => {
    const scanResult = {
      audit_ran: true,
      vulnerabilities_found: -5,
      vulnerabilities_by_severity: {
        critical: 0,
        high: 0,
        moderate: 0,
        low: 0,
      },
      audit_json: '{}',
    }
    const result = DepsScanStepResultSchema.safeParse(scanResult)
    expect(result.success).toBe(false)
  })

  it('requires all fields', () => {
    const scanResult = {
      audit_ran: true,
      vulnerabilities_found: 5,
      // Missing vulnerabilities_by_severity
      audit_json: '{}',
    }
    const result = DepsScanStepResultSchema.safeParse(scanResult)
    expect(result.success).toBe(false)
  })
})

describe('DepsFixStepInputSchema', () => {
  it('accepts valid input with all required fields', () => {
    const input = {
      project_path: 'apps/my-server',
      vulnerabilities_found: 10,
    }
    const result = DepsFixStepInputSchema.safeParse(input)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(input)
    }
  })

  it('rejects negative vulnerabilities_found', () => {
    const input = {
      project_path: 'apps/my-server',
      vulnerabilities_found: -3,
    }
    const result = DepsFixStepInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })

  it('rejects missing project_path', () => {
    const input = {
      vulnerabilities_found: 5,
    }
    const result = DepsFixStepInputSchema.safeParse(input)
    expect(result.success).toBe(false)
  })
})

describe('DepsFixStepResultSchema', () => {
  it('accepts valid result with all fields', () => {
    const fixResult = {
      fix_ran: true,
      vulnerabilities_fixed: 8,
      vulnerabilities_remaining: 2,
      files_modified: ['package.json', 'package-lock.json'],
      fix_summary: 'Fixed 8/10 vulnerabilities',
    }
    const result = DepsFixStepResultSchema.safeParse(fixResult)
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data).toEqual(fixResult)
    }
  })

  it('accepts empty files_modified array', () => {
    const fixResult = {
      fix_ran: false,
      vulnerabilities_fixed: 0,
      vulnerabilities_remaining: 5,
      files_modified: [],
      fix_summary: 'No fixes applied',
    }
    const result = DepsFixStepResultSchema.safeParse(fixResult)
    expect(result.success).toBe(true)
  })

  it('rejects missing required fields', () => {
    const fixResult = {
      fix_ran: true,
      vulnerabilities_fixed: 5,
      // Missing vulnerabilities_remaining, files_modified, fix_summary
    }
    const result = DepsFixStepResultSchema.safeParse(fixResult)
    expect(result.success).toBe(false)
  })
})
