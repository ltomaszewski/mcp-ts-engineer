/**
 * Tests for phase-audit.v2.ts - skill loading in audit prompts.
 */

import { phaseAuditPromptV2 } from '../phase-audit.v2.js'

describe('phaseAuditPromptV2', () => {
  describe('Version Metadata', () => {
    it('should have version v2', () => {
      expect(phaseAuditPromptV2.version).toBe('v2')
    })

    it('should have createdAt 2026-02-01', () => {
      expect(phaseAuditPromptV2.createdAt).toBe('2026-02-01')
    })

    it('should not be deprecated', () => {
      expect(phaseAuditPromptV2.deprecated).toBe(false)
    })

    it('should have a description mentioning audit', () => {
      expect(phaseAuditPromptV2.description).toBeDefined()
      expect(phaseAuditPromptV2.description).toContain('audit')
    })
  })

  describe('Skill Loading', () => {
    it('should include skill_loading section with typescript-clean-code always', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: [],
      })

      expect(result.userPrompt).toContain('<skill_loading>')
      expect(result.userPrompt).toContain('</skill_loading>')
      expect(result.userPrompt).toContain('typescript-clean-code')
      expect(result.userPrompt).toContain('Skill tool')
    })

    it('should include nestjs-core skill for nestjs tech', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: ['nestjs'],
      })

      expect(result.userPrompt).toContain('nestjs-core')
    })

    it('should include react-native-core skill for react-native tech', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: ['react-native'],
      })

      expect(result.userPrompt).toContain('react-native-core')
    })

    it('should resolve precise skills from raw dependencies', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: ['nestjs'],
        detectedDependencies: ['@nestjs/core', '@nestjs/graphql', 'class-validator'],
      })

      const prompt = result.userPrompt
      expect(prompt).toContain('nestjs-core')
      expect(prompt).toContain('nestjs-graphql')
      expect(prompt).toContain('class-validator')
    })

    it('should instruct to load skills as first workflow step', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: ['nestjs'],
      })

      expect(result.userPrompt).toContain('LOAD SKILLS FIRST')
      expect(result.userPrompt).toContain('1. Load all skills listed in <skill_loading>')
    })
  })

  describe('Audit Workflow Content', () => {
    it('should contain spec verification workflow', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: [],
      })

      expect(result.userPrompt).toContain('<workflow>')
      expect(result.userPrompt).toContain('Read the spec file')
      expect(result.userPrompt).toContain('phase_audit_result')
    })

    it('should contain decision criteria', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: [],
      })

      expect(result.userPrompt).toContain('<decision_criteria>')
      expect(result.userPrompt).toContain('pass')
      expect(result.userPrompt).toContain('warn')
      expect(result.userPrompt).toContain('fail')
    })

    it('should include engineering summary in prompt', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Implemented feature X with TDD',
        detectedTechnologies: [],
      })

      expect(result.userPrompt).toContain('Implemented feature X with TDD')
    })

    it('should include files modified in prompt', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/file1.ts', 'src/file2.ts'],
        engSummary: 'Done',
        detectedTechnologies: [],
      })

      expect(result.userPrompt).toContain('src/file1.ts')
      expect(result.userPrompt).toContain('src/file2.ts')
    })
  })

  describe('System Prompt', () => {
    it('should use claude_code preset', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: [],
      })

      const systemPrompt = result.systemPrompt as {
        type: string
        preset: string
        append: string
      }
      expect(systemPrompt.type).toBe('preset')
      expect(systemPrompt.preset).toBe('claude_code')
    })

    it('should include review context in system append', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: [],
      })

      const systemPrompt = result.systemPrompt as { append: string }
      expect(systemPrompt.append).toContain('Review Context')
    })
  })

  describe('Character Count Limits', () => {
    it('should be under 5000 characters for backend-only', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: ['nestjs'],
      })

      expect(result.userPrompt.length).toBeLessThan(5000)
    })

    it('should be under 5000 characters for react-native', () => {
      const result = phaseAuditPromptV2.build({
        specPath: 'docs/specs/test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: ['react-native', 'expo'],
        detectedDependencies: ['react-native', 'expo', 'zustand', 'nativewind'],
      })

      expect(result.userPrompt.length).toBeLessThan(5000)
    })
  })
})
