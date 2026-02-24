/**
 * Tests for todo-reviewer Zod schemas.
 */

import {
  CommitResultSchema,
  CommitStepInputSchema,
  CoverageAnalysisSchema,
  ReviewSummarySchema,
  ScopeAnalysisSchema,
  TddFixStepInputSchema,
  TddFixStepResultSchema,
  TddIssueSchema,
  TddScanStepInputSchema,
  TddScanStepResultSchema,
  TddSummarySchema,
  TddValidateStepInputSchema,
  TodoReviewerInputSchema,
  TodoReviewerOutputSchema,
} from '../todo-reviewer.schema.js'

// ---------------------------------------------------------------------------
// TodoReviewerInputSchema
// ---------------------------------------------------------------------------

describe('TodoReviewerInputSchema', () => {
  describe('valid inputs', () => {
    it('accepts valid spec_path ending in .md with defaults applied', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: 'docs/specs/feature.md',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.spec_path).toBe('docs/specs/feature.md')
        expect(result.data.model).toBe('sonnet')
        expect(result.data.iterations).toBe(3)
      }
    })

    it('accepts explicit sonnet model', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: 'docs/specs/feature.md',
        model: 'sonnet',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.model).toBe('sonnet')
      }
    })

    it('accepts optional cwd', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: 'docs/specs/feature.md',
        cwd: '/some/path',
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.cwd).toBe('/some/path')
      }
    })

    it('accepts iterations = 1 (boundary)', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: 'docs/specs/feature.md',
        iterations: 1,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.iterations).toBe(1)
      }
    })

    it('accepts iterations = 5 (mid-range)', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: 'docs/specs/feature.md',
        iterations: 5,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.iterations).toBe(5)
      }
    })

    it('accepts iterations = 10 (boundary)', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: 'docs/specs/feature.md',
        iterations: 10,
      })

      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.iterations).toBe(10)
      }
    })
  })

  describe('invalid inputs', () => {
    it('rejects empty spec_path', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: '',
      })

      expect(result.success).toBe(false)
    })

    it('rejects non-.md path', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: 'file.txt',
      })

      expect(result.success).toBe(false)
    })

    it('rejects invalid model', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: 'docs/specs/feature.md',
        model: 'gpt-4',
      })

      expect(result.success).toBe(false)
    })

    it('rejects missing spec_path', () => {
      const result = TodoReviewerInputSchema.safeParse({
        model: 'opus',
      })

      expect(result.success).toBe(false)
    })

    it('rejects iterations = 0', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: 'docs/specs/feature.md',
        iterations: 0,
      })

      expect(result.success).toBe(false)
    })

    it('rejects iterations = 11', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: 'docs/specs/feature.md',
        iterations: 11,
      })

      expect(result.success).toBe(false)
    })

    it('rejects iterations = -1', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: 'docs/specs/feature.md',
        iterations: -1,
      })

      expect(result.success).toBe(false)
    })

    it('rejects iterations = 2.5 (non-integer)', () => {
      const result = TodoReviewerInputSchema.safeParse({
        spec_path: 'docs/specs/feature.md',
        iterations: 2.5,
      })

      expect(result.success).toBe(false)
    })
  })
})

// ---------------------------------------------------------------------------
// ReviewSummarySchema
// ---------------------------------------------------------------------------

describe('ReviewSummarySchema', () => {
  const validSummary = {
    status: 'IN_REVIEW',
    spec_path: 'docs/specs/feature.md',
    target_app: 'my-server',
    corrections_applied: 3,
    blockers_remaining: 0,
    warnings: 1,
    cross_app_status: 'N/A',
    consistency_score: '14/14 (0B, 0W)',
    key_findings: ['Fixed schema reference', 'Added missing AC'],
    spec_modified: true,
  }

  it('accepts valid summary with all fields', () => {
    const result = ReviewSummarySchema.safeParse(validSummary)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('IN_REVIEW')
      expect(result.data.key_findings).toHaveLength(2)
    }
  })

  it('accepts IN_REVIEW status', () => {
    const result = ReviewSummarySchema.safeParse({
      ...validSummary,
      status: 'IN_REVIEW',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('IN_REVIEW')
    }
  })

  it('accepts READY status for backward compatibility', () => {
    const result = ReviewSummarySchema.safeParse({
      ...validSummary,
      status: 'READY',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('READY')
    }
  })

  it('accepts empty key_findings array', () => {
    const result = ReviewSummarySchema.safeParse({
      ...validSummary,
      key_findings: [],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.key_findings).toHaveLength(0)
    }
  })

  it('rejects invalid status', () => {
    const result = ReviewSummarySchema.safeParse({
      ...validSummary,
      status: 'UNKNOWN',
    })

    expect(result.success).toBe(false)
  })

  it('rejects missing required fields', () => {
    const result = ReviewSummarySchema.safeParse({
      status: 'IN_REVIEW',
    })

    expect(result.success).toBe(false)
  })

  it('accepts BLOCKED status', () => {
    const result = ReviewSummarySchema.safeParse({
      ...validSummary,
      status: 'BLOCKED',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('BLOCKED')
    }
  })
})

// ---------------------------------------------------------------------------
// TddSummarySchema
// ---------------------------------------------------------------------------

describe('TddSummarySchema', () => {
  it('accepts PASS status', () => {
    const result = TddSummarySchema.safeParse({
      status: 'PASS',
      details: 'All tests pass',
      issues_found: 0,
      spec_modified: false,
    })

    expect(result.success).toBe(true)
  })

  it('accepts FAIL status', () => {
    const result = TddSummarySchema.safeParse({
      status: 'FAIL',
      details: 'Tests failing',
      issues_found: 3,
      spec_modified: true,
    })

    expect(result.success).toBe(true)
  })

  it('accepts WARN status', () => {
    const result = TddSummarySchema.safeParse({
      status: 'WARN',
      details: 'Some warnings',
      issues_found: 1,
      spec_modified: false,
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = TddSummarySchema.safeParse({
      status: 'INVALID',
      details: 'test',
      issues_found: 0,
      spec_modified: false,
    })

    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// CommitResultSchema
// ---------------------------------------------------------------------------

describe('CommitResultSchema', () => {
  it('accepts null commit_sha/commit_message with empty files_changed', () => {
    const result = CommitResultSchema.safeParse({
      committed: false,
      commit_sha: null,
      commit_message: null,
      files_changed: [],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.committed).toBe(false)
      expect(result.data.commit_sha).toBeNull()
      expect(result.data.commit_message).toBeNull()
      expect(result.data.files_changed).toHaveLength(0)
    }
  })

  it('accepts populated values', () => {
    const result = CommitResultSchema.safeParse({
      committed: true,
      commit_sha: 'abc1234',
      commit_message: 'chore(spec): update',
      files_changed: ['docs/specs/feature.md'],
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.committed).toBe(true)
      expect(result.data.commit_sha).toBe('abc1234')
      expect(result.data.commit_message).toBe('chore(spec): update')
      expect(result.data.files_changed).toEqual(['docs/specs/feature.md'])
    }
  })
})

// ---------------------------------------------------------------------------
// TddValidateStepInputSchema
// ---------------------------------------------------------------------------

describe('TddValidateStepInputSchema', () => {
  const validReviewSummary = {
    status: 'IN_REVIEW' as const,
    spec_path: 'docs/specs/feature.md',
    target_app: 'my-server',
    corrections_applied: 0,
    blockers_remaining: 0,
    warnings: 0,
    cross_app_status: 'N/A' as const,
    consistency_score: '14/14',
    key_findings: [],
    spec_modified: false,
  }

  it('accepts valid spec_path and review_summary', () => {
    const result = TddValidateStepInputSchema.safeParse({
      spec_path: 'docs/specs/feature.md',
      review_summary: validReviewSummary,
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing review_summary', () => {
    const result = TddValidateStepInputSchema.safeParse({
      spec_path: 'docs/specs/feature.md',
    })

    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// CommitStepInputSchema
// ---------------------------------------------------------------------------

describe('CommitStepInputSchema', () => {
  const validReviewSummary = {
    status: 'IN_REVIEW' as const,
    spec_path: 'docs/specs/feature.md',
    target_app: 'my-server',
    corrections_applied: 0,
    blockers_remaining: 0,
    warnings: 0,
    cross_app_status: 'N/A' as const,
    consistency_score: '14/14',
    key_findings: [],
    spec_modified: false,
  }

  const validTddSummary = {
    status: 'PASS' as const,
    details: 'All tests pass',
    issues_found: 0,
    spec_modified: false,
  }

  it('accepts valid spec_path with both summaries', () => {
    const result = CommitStepInputSchema.safeParse({
      spec_path: 'docs/specs/feature.md',
      review_summary: validReviewSummary,
      tdd_summary: validTddSummary,
    })

    expect(result.success).toBe(true)
  })

  it('rejects missing tdd_summary', () => {
    const result = CommitStepInputSchema.safeParse({
      spec_path: 'docs/specs/feature.md',
      review_summary: validReviewSummary,
    })

    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// TodoReviewerOutputSchema
// ---------------------------------------------------------------------------

describe('TodoReviewerOutputSchema', () => {
  const validOutput = {
    status: 'success',
    review_report: 'Review completed',
    tdd_report: 'TDD validated',
    iterations_completed: 1,
    commit_sha: 'abc1234',
    commit_message: 'chore(spec): update',
    files_changed: ['docs/specs/feature.md'],
    session_id: 'sess_abc123',
  }

  it('accepts valid output with all fields', () => {
    const result = TodoReviewerOutputSchema.safeParse(validOutput)

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('success')
      expect(result.data.iterations_completed).toBe(1)
    }
  })

  it('accepts null commit_sha and commit_message', () => {
    const result = TodoReviewerOutputSchema.safeParse({
      ...validOutput,
      commit_sha: null,
      commit_message: null,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.commit_sha).toBeNull()
      expect(result.data.commit_message).toBeNull()
    }
  })

  it('rejects missing status', () => {
    const { status, ...withoutStatus } = validOutput
    const result = TodoReviewerOutputSchema.safeParse(withoutStatus)

    expect(result.success).toBe(false)
  })

  it('rejects invalid status', () => {
    const result = TodoReviewerOutputSchema.safeParse({
      ...validOutput,
      status: 'partial',
    })

    expect(result.success).toBe(false)
  })

  it('rejects iterations_completed = 0', () => {
    const result = TodoReviewerOutputSchema.safeParse({
      ...validOutput,
      iterations_completed: 0,
    })

    expect(result.success).toBe(false)
  })

  it('rejects iterations_completed = 11', () => {
    const result = TodoReviewerOutputSchema.safeParse({
      ...validOutput,
      iterations_completed: 11,
    })

    expect(result.success).toBe(false)
  })

  it('rejects non-integer iterations_completed', () => {
    const result = TodoReviewerOutputSchema.safeParse({
      ...validOutput,
      iterations_completed: 2.5,
    })

    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// TddIssueSchema
// ---------------------------------------------------------------------------

describe('TddIssueSchema', () => {
  it('accepts CRITICAL severity with all fields', () => {
    const result = TddIssueSchema.safeParse({
      severity: 'CRITICAL',
      title: 'Missing test coverage for FR-1',
      file_path: 'src/auth.service.ts',
      details: 'FR-1 has no corresponding test',
      remediation: 'Add test: __tests__/auth.service.test.ts',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.severity).toBe('CRITICAL')
      expect(result.data.file_path).toBe('src/auth.service.ts')
    }
  })

  it('accepts HIGH severity', () => {
    const result = TddIssueSchema.safeParse({
      severity: 'HIGH',
      title: 'Out-of-scope test',
      details: 'Test targets unchanged file',
      remediation: 'Remove test or justify in Scope Boundary section',
    })

    expect(result.success).toBe(true)
  })

  it('accepts MEDIUM severity without file_path', () => {
    const result = TddIssueSchema.safeParse({
      severity: 'MEDIUM',
      title: 'Missing coverage target',
      details: 'No explicit coverage target',
      remediation: "Add '## Test Coverage Target\\n\\n80% line coverage'",
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.file_path).toBeUndefined()
    }
  })

  it('accepts WARN severity', () => {
    const result = TddIssueSchema.safeParse({
      severity: 'WARN',
      title: 'Test count exceeds FR/EC count by 3x',
      details: '15 tests for 4 FR/EC',
      remediation: 'Review for over-testing',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid severity', () => {
    const result = TddIssueSchema.safeParse({
      severity: 'LOW',
      title: 'Test',
      details: 'Details',
      remediation: 'Fix',
    })

    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// ScopeAnalysisSchema
// ---------------------------------------------------------------------------

describe('ScopeAnalysisSchema', () => {
  it('accepts CLEAN scope verdict', () => {
    const result = ScopeAnalysisSchema.safeParse({
      files_changed: 3,
      tests_defined: 3,
      tests_in_scope: 3,
      tests_out_of_scope: 0,
      justified_regression: 0,
      unjustified_scope_creep: 0,
      scope_verdict: 'CLEAN',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.scope_verdict).toBe('CLEAN')
    }
  })

  it('accepts CREEP_DETECTED verdict', () => {
    const result = ScopeAnalysisSchema.safeParse({
      files_changed: 2,
      tests_defined: 4,
      tests_in_scope: 2,
      tests_out_of_scope: 2,
      justified_regression: 0,
      unjustified_scope_creep: 2,
      scope_verdict: 'CREEP_DETECTED',
    })

    expect(result.success).toBe(true)
  })

  it('accepts OVER_TESTED verdict', () => {
    const result = ScopeAnalysisSchema.safeParse({
      files_changed: 1,
      tests_defined: 20,
      tests_in_scope: 20,
      tests_out_of_scope: 0,
      justified_regression: 0,
      unjustified_scope_creep: 0,
      scope_verdict: 'OVER_TESTED',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid scope_verdict', () => {
    const result = ScopeAnalysisSchema.safeParse({
      files_changed: 1,
      tests_defined: 1,
      tests_in_scope: 1,
      tests_out_of_scope: 0,
      justified_regression: 0,
      unjustified_scope_creep: 0,
      scope_verdict: 'GOOD',
    })

    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// CoverageAnalysisSchema
// ---------------------------------------------------------------------------

describe('CoverageAnalysisSchema', () => {
  it('accepts complete traceability with test scenarios', () => {
    const result = CoverageAnalysisSchema.safeParse({
      coverage_target: '80%',
      coverage_explicit: true,
      fr_ec_total: 5,
      fr_ec_with_tests: 5,
      forward_traceability: 'complete',
      backward_traceability: 'complete',
      test_scenarios: {
        happy_path: true,
        edge_cases: 3,
        error_conditions: 2,
      },
      yagni_violations: 0,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.forward_traceability).toBe('complete')
      expect(result.data.backward_traceability).toBe('complete')
      expect(result.data.test_scenarios.happy_path).toBe(true)
    }
  })

  it('accepts gaps traceability', () => {
    const result = CoverageAnalysisSchema.safeParse({
      coverage_target: 'missing',
      coverage_explicit: false,
      fr_ec_total: 4,
      fr_ec_with_tests: 2,
      forward_traceability: 'gaps',
      backward_traceability: 'complete',
      test_scenarios: {
        happy_path: false,
        edge_cases: 0,
        error_conditions: 0,
      },
      yagni_violations: 0,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.forward_traceability).toBe('gaps')
    }
  })

  it('accepts orphan_tests backward traceability', () => {
    const result = CoverageAnalysisSchema.safeParse({
      coverage_target: '80%',
      coverage_explicit: true,
      fr_ec_total: 3,
      fr_ec_with_tests: 3,
      forward_traceability: 'complete',
      backward_traceability: 'orphan_tests',
      test_scenarios: {
        happy_path: true,
        edge_cases: 1,
        error_conditions: 1,
      },
      yagni_violations: 2,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.backward_traceability).toBe('orphan_tests')
      expect(result.data.yagni_violations).toBe(2)
    }
  })

  it('rejects invalid forward_traceability', () => {
    const result = CoverageAnalysisSchema.safeParse({
      coverage_target: '80%',
      coverage_explicit: true,
      fr_ec_total: 3,
      fr_ec_with_tests: 3,
      forward_traceability: 'partial',
      backward_traceability: 'complete',
      test_scenarios: {
        happy_path: true,
        edge_cases: 0,
        error_conditions: 0,
      },
      yagni_violations: 0,
    })

    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// TddScanStepResultSchema
// ---------------------------------------------------------------------------

describe('TddScanStepResultSchema', () => {
  const validScopeAnalysis = {
    files_changed: 2,
    tests_defined: 2,
    tests_in_scope: 2,
    tests_out_of_scope: 0,
    justified_regression: 0,
    unjustified_scope_creep: 0,
    scope_verdict: 'CLEAN' as const,
  }

  const validCoverageAnalysis = {
    coverage_target: '80%',
    coverage_explicit: true,
    fr_ec_total: 4,
    fr_ec_with_tests: 4,
    forward_traceability: 'complete' as const,
    backward_traceability: 'complete' as const,
    test_scenarios: {
      happy_path: true,
      edge_cases: 2,
      error_conditions: 1,
    },
    yagni_violations: 0,
  }

  it('accepts PASS status with no issues', () => {
    const result = TddScanStepResultSchema.safeParse({
      status: 'PASS',
      scope_analysis: validScopeAnalysis,
      coverage_analysis: validCoverageAnalysis,
      issues: [],
      spec_modified: false,
      needs_fix: false,
      details: 'All validations passed',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('PASS')
      expect(result.data.needs_fix).toBe(false)
      expect(result.data.issues).toHaveLength(0)
    }
  })

  it('accepts FAIL status with issues and needs_fix true', () => {
    const result = TddScanStepResultSchema.safeParse({
      status: 'FAIL',
      scope_analysis: validScopeAnalysis,
      coverage_analysis: validCoverageAnalysis,
      issues: [
        {
          severity: 'CRITICAL',
          title: 'Missing test coverage',
          details: 'FR-1 has no test',
          remediation: 'Add test case',
        },
      ],
      spec_modified: false,
      needs_fix: true,
      details: 'Critical issues found',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('FAIL')
      expect(result.data.needs_fix).toBe(true)
      expect(result.data.issues).toHaveLength(1)
    }
  })

  it('accepts WARN status', () => {
    const result = TddScanStepResultSchema.safeParse({
      status: 'WARN',
      scope_analysis: validScopeAnalysis,
      coverage_analysis: validCoverageAnalysis,
      issues: [
        {
          severity: 'MEDIUM',
          title: 'Warning',
          details: 'Details',
          remediation: 'Fix',
        },
      ],
      spec_modified: false,
      needs_fix: false,
      details: 'Warnings found',
    })

    expect(result.success).toBe(true)
  })
})

// ---------------------------------------------------------------------------
// TddScanStepInputSchema
// ---------------------------------------------------------------------------

describe('TddScanStepInputSchema', () => {
  const validReviewSummary = {
    status: 'IN_REVIEW' as const,
    spec_path: 'docs/specs/feature.md',
    target_app: 'my-server',
    corrections_applied: 0,
    blockers_remaining: 0,
    warnings: 0,
    cross_app_status: 'N/A' as const,
    consistency_score: '14/14',
    key_findings: [],
    spec_modified: false,
  }

  it('accepts valid spec_path and review_summary', () => {
    const result = TddScanStepInputSchema.safeParse({
      spec_path: 'docs/specs/feature.md',
      review_summary: validReviewSummary,
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.spec_path).toBe('docs/specs/feature.md')
    }
  })

  it('accepts optional cwd', () => {
    const result = TddScanStepInputSchema.safeParse({
      spec_path: 'docs/specs/feature.md',
      review_summary: validReviewSummary,
      cwd: '/some/path',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cwd).toBe('/some/path')
    }
  })

  it('rejects empty spec_path', () => {
    const result = TddScanStepInputSchema.safeParse({
      spec_path: '',
      review_summary: validReviewSummary,
    })

    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// TddFixStepInputSchema
// ---------------------------------------------------------------------------

describe('TddFixStepInputSchema', () => {
  const validScanResult = {
    status: 'FAIL' as const,
    scope_analysis: {
      files_changed: 2,
      tests_defined: 2,
      tests_in_scope: 2,
      tests_out_of_scope: 0,
      justified_regression: 0,
      unjustified_scope_creep: 0,
      scope_verdict: 'CLEAN' as const,
    },
    coverage_analysis: {
      coverage_target: '80%',
      coverage_explicit: true,
      fr_ec_total: 4,
      fr_ec_with_tests: 4,
      forward_traceability: 'complete' as const,
      backward_traceability: 'complete' as const,
      test_scenarios: {
        happy_path: true,
        edge_cases: 2,
        error_conditions: 1,
      },
      yagni_violations: 0,
    },
    issues: [],
    spec_modified: false,
    needs_fix: true,
    details: 'Test',
  }

  it('accepts valid spec_path and scan_result', () => {
    const result = TddFixStepInputSchema.safeParse({
      spec_path: 'docs/specs/feature.md',
      scan_result: validScanResult,
    })

    expect(result.success).toBe(true)
  })

  it('accepts optional cwd', () => {
    const result = TddFixStepInputSchema.safeParse({
      spec_path: 'docs/specs/feature.md',
      scan_result: validScanResult,
      cwd: '/test',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.cwd).toBe('/test')
    }
  })

  it('rejects missing scan_result', () => {
    const result = TddFixStepInputSchema.safeParse({
      spec_path: 'docs/specs/feature.md',
    })

    expect(result.success).toBe(false)
  })
})

// ---------------------------------------------------------------------------
// TddFixStepResultSchema
// ---------------------------------------------------------------------------

describe('TddFixStepResultSchema', () => {
  it('accepts success status with all fields', () => {
    const result = TddFixStepResultSchema.safeParse({
      status: 'success',
      issues_fixed: 3,
      issues_remaining: 0,
      spec_modified: true,
      fix_summary: 'Fixed 3 issues: added test mappings, coverage target, FR/EC mappings',
    })

    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.status).toBe('success')
      expect(result.data.issues_fixed).toBe(3)
      expect(result.data.spec_modified).toBe(true)
    }
  })

  it('accepts partial status', () => {
    const result = TddFixStepResultSchema.safeParse({
      status: 'partial',
      issues_fixed: 2,
      issues_remaining: 1,
      spec_modified: true,
      fix_summary: 'Fixed 2 of 3 issues',
    })

    expect(result.success).toBe(true)
  })

  it('accepts failed status', () => {
    const result = TddFixStepResultSchema.safeParse({
      status: 'failed',
      issues_fixed: 0,
      issues_remaining: 3,
      spec_modified: false,
      fix_summary: 'Unable to apply fixes',
    })

    expect(result.success).toBe(true)
  })

  it('rejects invalid status', () => {
    const result = TddFixStepResultSchema.safeParse({
      status: 'unknown',
      issues_fixed: 0,
      issues_remaining: 0,
      spec_modified: false,
      fix_summary: 'Test',
    })

    expect(result.success).toBe(false)
  })
})
