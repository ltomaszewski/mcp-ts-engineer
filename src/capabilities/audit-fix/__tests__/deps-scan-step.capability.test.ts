/**
 * Unit tests for deps scan step capability (deps-scan-step.capability.ts).
 * Tests capability definition, metadata, and result processing.
 */

import { auditFixDepsScanStepCapability } from '../deps-scan-step.capability.js'

describe('auditFixDepsScanStepCapability', () => {
  describe('metadata', () => {
    it('has correct id, type, and name', () => {
      expect(auditFixDepsScanStepCapability.id).toBe('audit_fix_deps_scan_step')
      expect(auditFixDepsScanStepCapability.type).toBe('tool')
      expect(auditFixDepsScanStepCapability.name).toContain('Internal')
    })

    it("has visibility 'internal'", () => {
      expect(auditFixDepsScanStepCapability.visibility).toBe('internal')
    })
  })

  describe('defaultRequestOptions', () => {
    it('uses correct model, budget, and turns (Haiku)', () => {
      expect(auditFixDepsScanStepCapability.defaultRequestOptions?.model).toBe('haiku')
      expect(auditFixDepsScanStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(2.0)
      expect(auditFixDepsScanStepCapability.defaultRequestOptions?.maxTurns).toBe(40)
    })
  })

  describe('preparePromptInput', () => {
    it('extracts projectPath and cwd correctly', () => {
      const input = { project_path: 'apps/my-server', cwd: '/workspace' }
      const mockContext = {} as never

      const result = auditFixDepsScanStepCapability.preparePromptInput(input, mockContext)

      expect(result).toEqual({
        projectPath: 'apps/my-server',
        cwd: '/workspace',
      })
    })
  })

  describe('processResult', () => {
    it('parses valid <deps_scan_result> XML with JSON payload', () => {
      const input = { project_path: 'apps/test' }
      const mockContext = {} as never
      const aiResult = {
        content: `<deps_scan_result>
{
  "audit_ran": true,
  "vulnerabilities_found": 15,
  "vulnerabilities_by_severity": {
    "critical": 2,
    "high": 5,
    "moderate": 6,
    "low": 2
  },
  "audit_json": "{\\"metadata\\":{...}}"
}
</deps_scan_result>`,
      } as never

      const result = auditFixDepsScanStepCapability.processResult(
        input,
        aiResult,
        mockContext,
      ) as import('../audit-fix.schema.js').DepsScanStepResult

      expect(result.audit_ran).toBe(true)
      expect(result.vulnerabilities_found).toBe(15)
      expect(result.vulnerabilities_by_severity.critical).toBe(2)
    })

    it('returns fallback when XML block missing', () => {
      const input = { project_path: 'apps/test' }
      const mockContext = {} as never
      const aiResult = { content: 'No XML block here' } as never

      const result = auditFixDepsScanStepCapability.processResult(
        input,
        aiResult,
        mockContext,
      ) as import('../audit-fix.schema.js').DepsScanStepResult

      expect(result.audit_ran).toBe(false)
      expect(result.vulnerabilities_found).toBe(0)
    })

    it('returns fallback when JSON parse fails', () => {
      const input = { project_path: 'apps/test' }
      const mockContext = {} as never
      const aiResult = {
        content: `<deps_scan_result>invalid json{</deps_scan_result>`,
      } as never

      const result = auditFixDepsScanStepCapability.processResult(
        input,
        aiResult,
        mockContext,
      ) as import('../audit-fix.schema.js').DepsScanStepResult

      expect(result.audit_ran).toBe(false)
    })

    it('validates severity breakdown structure (all 4 fields present)', () => {
      const input = { project_path: 'apps/test' }
      const mockContext = {} as never
      const aiResult = {
        content: `<deps_scan_result>
{
  "audit_ran": true,
  "vulnerabilities_found": 10,
  "vulnerabilities_by_severity": {
    "critical": 1,
    "high": 2,
    "moderate": 3,
    "low": 4
  },
  "audit_json": ""
}
</deps_scan_result>`,
      } as never

      const result = auditFixDepsScanStepCapability.processResult(
        input,
        aiResult,
        mockContext,
      ) as import('../audit-fix.schema.js').DepsScanStepResult

      expect(result.vulnerabilities_by_severity).toHaveProperty('critical')
      expect(result.vulnerabilities_by_severity).toHaveProperty('high')
      expect(result.vulnerabilities_by_severity).toHaveProperty('moderate')
      expect(result.vulnerabilities_by_severity).toHaveProperty('low')
    })
  })
})
