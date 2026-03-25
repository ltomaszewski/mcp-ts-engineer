/**
 * Unit tests for deps fix step capability (deps-fix-step.capability.ts).
 * Tests capability definition, metadata, and result processing.
 */

import { auditFixDepsFixStepCapability } from '../deps-fix-step.capability.js'

describe('auditFixDepsFixStepCapability', () => {
  describe('metadata', () => {
    it('has correct id, type, and name', () => {
      expect(auditFixDepsFixStepCapability.id).toBe('audit_fix_deps_fix_step')
      expect(auditFixDepsFixStepCapability.type).toBe('tool')
      expect(auditFixDepsFixStepCapability.name).toContain('Internal')
    })

    it("has visibility 'internal'", () => {
      expect(auditFixDepsFixStepCapability.visibility).toBe('internal')
    })
  })

  describe('defaultRequestOptions', () => {
    it('uses correct model, budget, and turns', () => {
      expect(auditFixDepsFixStepCapability.defaultRequestOptions?.model).toBe('sonnet[1m]')
      expect(auditFixDepsFixStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(2.0)
      expect(auditFixDepsFixStepCapability.defaultRequestOptions?.maxTurns).toBe(30)
    })
  })

  describe('preparePromptInput', () => {
    it('extracts projectPath, vulnerabilitiesFound, and cwd correctly', () => {
      const input = {
        project_path: 'apps/my-server',
        vulnerabilities_found: 10,
        cwd: '/workspace',
      }
      const mockContext = {} as never

      const result = auditFixDepsFixStepCapability.preparePromptInput(input, mockContext)

      expect(result).toEqual({
        projectPath: 'apps/my-server',
        vulnerabilitiesFound: 10,
        cwd: '/workspace',
      })
    })
  })

  describe('processResult', () => {
    it('parses valid <deps_fix_result> XML with JSON', () => {
      const input = { project_path: 'apps/test', vulnerabilities_found: 10 }
      const mockContext = {} as never
      const aiResult = {
        content: `<deps_fix_result>
{
  "fix_ran": true,
  "vulnerabilities_fixed": 8,
  "vulnerabilities_remaining": 2,
  "files_modified": ["package.json", "package-lock.json"],
  "fix_summary": "Fixed 8/10 vulnerabilities"
}
</deps_fix_result>`,
      } as never

      const result = auditFixDepsFixStepCapability.processResult(
        input,
        aiResult,
        mockContext,
      ) as import('../audit-fix.schema.js').DepsFixStepResult

      expect(result.fix_ran).toBe(true)
      expect(result.vulnerabilities_fixed).toBe(8)
      expect(result.vulnerabilities_remaining).toBe(2)
      expect(result.files_modified).toEqual(['package.json', 'package-lock.json'])
    })

    it('returns fallback when XML missing', () => {
      const input = { project_path: 'apps/test', vulnerabilities_found: 5 }
      const mockContext = {} as never
      const aiResult = { content: 'No XML block' } as never

      const result = auditFixDepsFixStepCapability.processResult(
        input,
        aiResult,
        mockContext,
      ) as import('../audit-fix.schema.js').DepsFixStepResult

      expect(result.fix_ran).toBe(false)
      expect(result.vulnerabilities_fixed).toBe(0)
    })

    it('returns fallback when JSON is invalid', () => {
      const input = { project_path: 'apps/test', vulnerabilities_found: 5 }
      const mockContext = {} as never
      const aiResult = {
        content: `<deps_fix_result>bad json{</deps_fix_result>`,
      } as never

      const result = auditFixDepsFixStepCapability.processResult(
        input,
        aiResult,
        mockContext,
      ) as import('../audit-fix.schema.js').DepsFixStepResult

      expect(result.fix_ran).toBe(false)
    })

    it('validates files_modified as array type', () => {
      const input = { project_path: 'apps/test', vulnerabilities_found: 3 }
      const mockContext = {} as never
      const aiResult = {
        content: `<deps_fix_result>
{
  "fix_ran": true,
  "vulnerabilities_fixed": 2,
  "vulnerabilities_remaining": 1,
  "files_modified": [],
  "fix_summary": "Fixed 2/3 vulnerabilities"
}
</deps_fix_result>`,
      } as never

      const result = auditFixDepsFixStepCapability.processResult(
        input,
        aiResult,
        mockContext,
      ) as import('../audit-fix.schema.js').DepsFixStepResult

      expect(Array.isArray(result.files_modified)).toBe(true)
      expect(result.files_modified).toHaveLength(0)
    })
  })
})
