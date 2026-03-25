/**
 * Tests for tdd-fix-step sub-capability definition.
 */

import { tddFixStepCapability } from '../tdd-fix-step.capability.js'
import type { TddFixStepInput } from '../todo-reviewer.schema.js'
import { createMockContext } from './test-helpers.js'

describe('tddFixStepCapability', () => {
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

  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(tddFixStepCapability.id).toBe('todo_tdd_fix_step')
    })

    it('has correct type', () => {
      expect(tddFixStepCapability.type).toBe('tool')
    })

    it('defaults to sonnet model', () => {
      expect(tddFixStepCapability.defaultRequestOptions?.model).toBe('sonnet[1m]')
    })

    it('has prompt registry with v1', () => {
      expect(tddFixStepCapability.promptRegistry).toBeDefined()
      expect(tddFixStepCapability.promptRegistry.v1).toBeDefined()
    })

    it('has current prompt version v1', () => {
      expect(tddFixStepCapability.currentPromptVersion).toBe('v1')
    })

    it('has internal visibility', () => {
      expect(tddFixStepCapability.visibility).toBe('internal')
    })
  })

  describe('preparePromptInput', () => {
    it('extracts specPath, scanResult, and cwd', () => {
      const input: TddFixStepInput = {
        spec_path: 'docs/specs/feature.md',
        scan_result: validScanResult,
        cwd: '/some/path',
      }
      const context = createMockContext()

      const result = tddFixStepCapability.preparePromptInput(input, context)

      expect(result).toEqual({
        specPath: 'docs/specs/feature.md',
        scanResult: validScanResult,
        cwd: '/some/path',
      })
    })
  })
})
