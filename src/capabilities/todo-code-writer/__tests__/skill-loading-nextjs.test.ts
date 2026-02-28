/**
 * Next.js-specific skill loading integration tests.
 * Tests that Next.js web app projects get correct skills and prompt rules.
 */

import { vi } from 'vitest'
import {
  EXAMPLE_NEXT_APP_PKG,
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

describe('Dynamic Skill Loading — Next.js Web App', () => {
  describe('example-next-app (Next.js web app)', () => {
    beforeEach(() => mockPackageJson(EXAMPLE_NEXT_APP_PKG))

    it('detects nextjs technology tag', () => {
      const result = detectWorkspace('/apps/example-next-app')
      expect(result.technologies).toContain('nextjs')
    })

    it('does NOT detect standalone react (nextjs implies react)', () => {
      const result = detectWorkspace('/apps/example-next-app')
      expect(result.technologies).not.toContain('react')
    })

    it('does NOT detect react-native or expo', () => {
      const result = detectWorkspace('/apps/example-next-app')
      expect(result.technologies).not.toContain('react-native')
      expect(result.technologies).not.toContain('expo')
    })

    it('resolves correct Next.js skill set', () => {
      const result = detectWorkspace('/apps/example-next-app')
      const skills = resolveSkillsFromTechnologies(result.technologies, result.dependencies)

      expect(skills).toContain('typescript-clean-code')
      expect(skills).toContain('nextjs-core')
      expect(skills).toContain('tailwind-v4')
      expect(skills).toContain('shadcn-ui')
      expect(skills).toContain('better-auth')
      expect(skills).toContain('nextjs-testing')
      expect(skills).toContain('react-query')
      expect(skills).toContain('zustand')
      expect(skills).toContain('zod')
      expect(skills).toContain('react-hook-form')
      expect(skills).toContain('biome')

      expect(skills).not.toContain('react-native-core')
      expect(skills).not.toContain('expo-core')
      expect(skills).not.toContain('nestjs-core')
      expect(skills).not.toContain('nativewind')
    })

    it('eng prompt includes race-conditions but NOT component-check for Next.js', () => {
      const result = detectWorkspace('/apps/example-next-app')
      const prompt = phaseEngPromptV2.build({
        specPath: 'docs/specs/example-next-app/feature.md',
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: result.technologies,
        detectedDependencies: result.dependencies,
      })

      expect(prompt.userPrompt).toContain('<race_conditions>')
      expect(prompt.userPrompt).not.toContain('<component_check>')
      expect(prompt.userPrompt).toContain('nextjs-core')
      expect(prompt.userPrompt).toContain('tailwind-v4')
      expect(prompt.userPrompt).toContain('better-auth')
    })

    it('audit prompt includes Next.js skills', () => {
      const result = detectWorkspace('/apps/example-next-app')
      const prompt = phaseAuditPromptV2.build({
        specPath: 'docs/specs/example-next-app/feature.md',
        phaseNumber: 1,
        filesModified: ['src/features/dashboard/dashboard.tsx'],
        engSummary: 'Implemented dashboard',
        detectedTechnologies: result.technologies,
        detectedDependencies: result.dependencies,
      })

      expect(prompt.userPrompt).toContain('nextjs-core')
      expect(prompt.userPrompt).toContain('tailwind-v4')
      expect(prompt.userPrompt).toContain('typescript-clean-code')
    })
  })

  describe('DEPENDENCY_SKILL_MAP — Next.js dependencies', () => {
    it('maps all dependencies from example-next-app that have skills', () => {
      const nextAppDeps = [
        ...Object.keys(EXAMPLE_NEXT_APP_PKG.dependencies),
        ...Object.keys(EXAMPLE_NEXT_APP_PKG.devDependencies),
      ]

      const expectedMapped = [
        'next',
        '@tanstack/react-query',
        'zustand',
        'react-hook-form',
        'zod',
        'better-auth',
        'class-variance-authority',
        '@biomejs/biome',
        '@tailwindcss/postcss',
        '@testing-library/react',
      ]

      for (const dep of expectedMapped) {
        expect(nextAppDeps).toContain(dep)
        expect(DEPENDENCY_SKILL_MAP[dep]).toBeDefined()
      }
    })
  })

  describe('preparePromptInput — Next.js', () => {
    it('end-to-end: Next.js workspace → capability detects technologies', async () => {
      mockPackageJson(EXAMPLE_NEXT_APP_PKG)
      const { phaseEngStepCapability } = await import('../phase-eng-step.capability.js')

      const input = {
        spec_path: 'docs/specs/example-next-app/feature.md',
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
        cwd: '/apps/example-next-app',
      }

      const promptInput = phaseEngStepCapability.preparePromptInput(
        input as never,
        createMockContext() as never,
      ) as Record<string, unknown>

      expect(promptInput.detectedTechnologies).toContain('nextjs')
      expect(promptInput.detectedTechnologies).not.toContain('react')
      expect(promptInput.detectedDependencies).toContain('next')
      expect(promptInput.detectedDependencies).toContain('better-auth')
      expect(promptInput.detectedDependencies).toContain('@tailwindcss/postcss')
    })
  })
})
