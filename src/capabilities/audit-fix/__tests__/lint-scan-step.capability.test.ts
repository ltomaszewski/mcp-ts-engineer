/**
 * Unit tests for lint scan step capability (lint-scan-step.capability.ts).
 * Tests capability definition, metadata, and result processing.
 */

import type { LintScanResult } from '../audit-fix.schema.js'
import { auditFixLintScanStepCapability } from '../lint-scan-step.capability.js'

describe('auditFixLintScanStepCapability', () => {
  describe('metadata', () => {
    it('has correct id', () => {
      expect(auditFixLintScanStepCapability.id).toBe('audit_fix_lint_scan_step')
    })

    it("has type 'tool'", () => {
      expect(auditFixLintScanStepCapability.type).toBe('tool')
    })

    it("has visibility 'internal'", () => {
      expect(auditFixLintScanStepCapability.visibility).toBe('internal')
    })

    it('has name indicating Internal sub-capability', () => {
      expect(auditFixLintScanStepCapability.name).toContain('Internal')
    })

    it('has description indicating internal sub-capability', () => {
      expect(auditFixLintScanStepCapability.description).toContain('Internal')
      expect(auditFixLintScanStepCapability.description).toContain('lint')
    })
  })

  describe('defaultRequestOptions', () => {
    it('uses haiku model', () => {
      expect(auditFixLintScanStepCapability.defaultRequestOptions?.model).toBe('haiku')
    })

    it('has maxTurns of 40', () => {
      expect(auditFixLintScanStepCapability.defaultRequestOptions?.maxTurns).toBe(40)
    })

    it('has maxBudgetUsd of 2.0', () => {
      expect(auditFixLintScanStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(2.0)
    })

    it('uses claude_code tools preset', () => {
      expect(auditFixLintScanStepCapability.defaultRequestOptions?.tools).toEqual({
        type: 'preset',
        preset: 'claude_code',
      })
    })

    it('has outputSchema configured', () => {
      expect(auditFixLintScanStepCapability.defaultRequestOptions?.outputSchema).toBeDefined()
    })
  })

  describe('preparePromptInput', () => {
    it('builds correct input with projectPath and cwd', () => {
      const input = { project_path: 'apps/test-project', cwd: '/workspace' }
      const mockContext = {} as never

      const result = auditFixLintScanStepCapability.preparePromptInput(input, mockContext)

      expect(result).toEqual({
        projectPath: 'apps/test-project',
        cwd: '/workspace',
      })
    })

    it('handles optional cwd', () => {
      const input = { project_path: 'apps/test-project' }
      const mockContext = {} as never

      const result = auditFixLintScanStepCapability.preparePromptInput(input, mockContext)

      expect(result).toEqual({
        projectPath: 'apps/test-project',
        cwd: undefined,
      })
    })
  })

  describe('processResult', () => {
    it('parses <lint_scan_result> XML with valid JSON', () => {
      const input = { project_path: 'apps/test' }
      const mockContext = {} as never
      const aiResult = {
        content: `Some text before
<lint_scan_result>
{
  "lint_available": true,
  "lint_passed": false,
  "error_count": 5,
  "warning_count": 3,
  "lint_report": "Error: unused import",
  "files_with_lint_errors": ["src/file1.ts", "src/file2.ts"]
}
</lint_scan_result>
Some text after`,
      } as never

      const result = auditFixLintScanStepCapability.processResult(input, aiResult, mockContext)

      expect(result).toEqual({
        lint_available: true,
        lint_passed: false,
        error_count: 5,
        warning_count: 3,
        lint_report: 'Error: unused import',
        files_with_lint_errors: ['src/file1.ts', 'src/file2.ts'],
      })
    })

    it('returns fallback on malformed XML', () => {
      const input = { project_path: 'apps/test' }
      const mockContext = {} as never
      const aiResult = {
        content: 'No XML block here',
      } as never

      const result = auditFixLintScanStepCapability.processResult(input, aiResult, mockContext)

      expect(result).toEqual({
        lint_available: false,
        lint_passed: false,
        error_count: 0,
        warning_count: 0,
        lint_report: '',
        files_with_lint_errors: [],
      })
    })

    it('extracts all 6 fields correctly', () => {
      const input = { project_path: 'apps/test' }
      const mockContext = {} as never
      const aiResult = {
        content: `<lint_scan_result>
{
  "lint_available": false,
  "lint_passed": true,
  "error_count": 0,
  "warning_count": 0,
  "lint_report": "",
  "files_with_lint_errors": []
}
</lint_scan_result>`,
      } as never

      const result = auditFixLintScanStepCapability.processResult(
        input,
        aiResult,
        mockContext,
      ) as LintScanResult

      expect(result).toHaveProperty('lint_available', false)
      expect(result).toHaveProperty('lint_passed', true)
      expect(result).toHaveProperty('error_count', 0)
      expect(result).toHaveProperty('warning_count', 0)
      expect(result).toHaveProperty('lint_report', '')
      expect(result).toHaveProperty('files_with_lint_errors')
      expect(Array.isArray(result.files_with_lint_errors)).toBe(true)
    })

    it('validates files_with_lint_errors as array', () => {
      const input = { project_path: 'apps/test' }
      const mockContext = {} as never
      const aiResult = {
        content: `<lint_scan_result>
{
  "lint_available": true,
  "lint_passed": true,
  "error_count": 0,
  "warning_count": 2,
  "lint_report": "warnings only",
  "files_with_lint_errors": ["file1.ts", "file2.ts", "file3.ts"]
}
</lint_scan_result>`,
      } as never

      const result = auditFixLintScanStepCapability.processResult(
        input,
        aiResult,
        mockContext,
      ) as LintScanResult

      expect(Array.isArray(result.files_with_lint_errors)).toBe(true)
      expect(result.files_with_lint_errors).toHaveLength(3)
    })
  })
})
