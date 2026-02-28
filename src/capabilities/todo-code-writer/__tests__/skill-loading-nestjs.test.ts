/**
 * NestJS-specific skill loading integration tests.
 * Tests that NestJS backend projects get correct skills and prompt rules.
 */

import { vi } from 'vitest'
import {
  EXAMPLE_SERVER_PKG,
  MOCK_PHASE_PLAN,
  createMockContext,
} from './skill-loading-test-utils.js'

// ---------------------------------------------------------------------------
// Mock fs (must be in each test file for ESM mocking)
// ---------------------------------------------------------------------------
const { mockReadFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn<(path: string, encoding: string) => string>(),
}))

vi.mock('fs', () => ({
  readFileSync: mockReadFileSync,
  writeFileSync: vi.fn(),
  existsSync: vi.fn().mockReturnValue(false),
  promises: { readFile: vi.fn(), writeFile: vi.fn() },
}))

const { detectWorkspace } = await import('../workspace-detector.js')
const { resolveSkillsFromTechnologies, DEPENDENCY_SKILL_MAP } = await import(
  '../prompts/eng-rules/skill-loading.js'
)
const { phaseEngPromptV2 } = await import('../prompts/phase-eng.v2.js')
const { phaseAuditPromptV2 } = await import('../prompts/phase-audit.v2.js')

function mockPackageJson(content: Record<string, unknown>): void {
  mockReadFileSync.mockReturnValue(JSON.stringify(content))
}

beforeEach(() => {
  vi.clearAllMocks()
})

describe('Dynamic Skill Loading — NestJS Backend', () => {
  describe('example-server (NestJS backend)', () => {
    beforeEach(() => mockPackageJson(EXAMPLE_SERVER_PKG))

    it('detects nestjs technology tag', () => {
      const result = detectWorkspace('/apps/example-server')
      expect(result.technologies).toContain('nestjs')
    })

    it('does NOT detect react-native or expo', () => {
      const result = detectWorkspace('/apps/example-server')
      expect(result.technologies).not.toContain('react-native')
      expect(result.technologies).not.toContain('expo')
      expect(result.technologies).not.toContain('react')
    })

    it('resolves correct NestJS skill set', () => {
      const result = detectWorkspace('/apps/example-server')
      const skills = resolveSkillsFromTechnologies(result.technologies, result.dependencies)

      expect(skills).toContain('typescript-clean-code')
      expect(skills).toContain('nestjs-core')
      expect(skills).toContain('nestjs-graphql')
      expect(skills).toContain('nestjs-mongoose')
      expect(skills).toContain('nestjs-auth')
      expect(skills).toContain('class-validator')
      expect(skills).toContain('date-fns')

      expect(skills).not.toContain('react-native-core')
      expect(skills).not.toContain('expo-core')
      expect(skills).not.toContain('expo-router')
      expect(skills).not.toContain('nativewind')
      expect(skills).not.toContain('zustand')
      expect(skills).not.toContain('react-query')
      expect(skills).not.toContain('reanimated')
    })

    it('eng prompt includes nestjs skills but NOT race-conditions or component-check', () => {
      const result = detectWorkspace('/apps/example-server')
      const prompt = phaseEngPromptV2.build({
        specPath: 'docs/specs/example-server/feature.md',
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: result.technologies,
        detectedDependencies: result.dependencies,
      })

      expect(prompt.userPrompt).toContain('nestjs-core')
      expect(prompt.userPrompt).toContain('nestjs-graphql')
      expect(prompt.userPrompt).toContain('class-validator')
      expect(prompt.userPrompt).not.toContain('<race_conditions>')
      expect(prompt.userPrompt).not.toContain('<component_check>')
      expect(prompt.userPrompt).toContain('<testing_requirements>')
      expect(prompt.userPrompt).toContain('<export_design>')
    })

    it('audit prompt includes nestjs skills', () => {
      const result = detectWorkspace('/apps/example-server')
      const prompt = phaseAuditPromptV2.build({
        specPath: 'docs/specs/example-server/feature.md',
        phaseNumber: 1,
        filesModified: ['src/modules/auth/auth.service.ts'],
        engSummary: 'Implemented auth feature',
        detectedTechnologies: result.technologies,
        detectedDependencies: result.dependencies,
      })

      expect(prompt.userPrompt).toContain('nestjs-core')
      expect(prompt.userPrompt).toContain('nestjs-graphql')
      expect(prompt.userPrompt).toContain('typescript-clean-code')
    })
  })

  describe('DEPENDENCY_SKILL_MAP — NestJS dependencies', () => {
    it('maps all dependencies from example-server that have skills', () => {
      const serverDeps = [
        ...Object.keys(EXAMPLE_SERVER_PKG.dependencies),
        ...Object.keys(EXAMPLE_SERVER_PKG.devDependencies),
      ]

      const expectedMapped = [
        '@nestjs/core',
        '@nestjs/graphql',
        '@nestjs/mongoose',
        '@nestjs/passport',
        'class-validator',
        'date-fns',
      ]

      for (const dep of expectedMapped) {
        expect(serverDeps).toContain(dep)
        expect(DEPENDENCY_SKILL_MAP[dep]).toBeDefined()
      }
    })
  })

  describe('Conditional engineering rules — NestJS', () => {
    it('testing + export (NO race-conditions, NO component-check)', () => {
      mockPackageJson(EXAMPLE_SERVER_PKG)
      const result = detectWorkspace('/apps/example-server')
      const prompt = phaseEngPromptV2.build({
        specPath: 'test.md',
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: result.technologies,
        detectedDependencies: result.dependencies,
      })

      expect(prompt.userPrompt).toContain('<testing_requirements>')
      expect(prompt.userPrompt).toContain('<export_design>')
      expect(prompt.userPrompt).not.toContain('<race_conditions>')
      expect(prompt.userPrompt).not.toContain('<component_check>')
    })
  })

  describe('preparePromptInput — NestJS', () => {
    it('end-to-end: NestJS workspace → capability detects technologies', async () => {
      mockPackageJson(EXAMPLE_SERVER_PKG)
      const { phaseEngStepCapability } = await import('../phase-eng-step.capability.js')

      const input = {
        spec_path: 'docs/specs/example-server/feature.md',
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
        cwd: '/apps/example-server',
      }

      const promptInput = phaseEngStepCapability.preparePromptInput(
        input as never,
        createMockContext() as never,
      ) as Record<string, unknown>

      expect(promptInput.detectedTechnologies).toContain('nestjs')
      expect(promptInput.detectedDependencies).toContain('@nestjs/core')
      expect(promptInput.detectedDependencies).toContain('@nestjs/graphql')
    })
  })
})
