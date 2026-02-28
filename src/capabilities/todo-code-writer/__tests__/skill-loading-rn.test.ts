/**
 * React Native/Expo-specific skill loading integration tests.
 * Tests that React Native mobile projects get correct skills and prompt rules.
 */

import { vi } from 'vitest'
import {
  EXAMPLE_APP_PKG,
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

describe('Dynamic Skill Loading — React Native/Expo', () => {
  describe('example-app (React Native/Expo mobile)', () => {
    beforeEach(() => mockPackageJson(EXAMPLE_APP_PKG))

    it('detects react-native and expo technology tags', () => {
      const result = detectWorkspace('/apps/example-app')
      expect(result.technologies).toContain('react-native')
      expect(result.technologies).toContain('expo')
      expect(result.technologies).toContain('zustand')
      expect(result.technologies).toContain('tanstack-query')
    })

    it('does NOT include standalone react tag (react-native implies react)', () => {
      const result = detectWorkspace('/apps/example-app')
      expect(result.technologies).not.toContain('react')
    })

    it('does NOT detect nestjs', () => {
      const result = detectWorkspace('/apps/example-app')
      expect(result.technologies).not.toContain('nestjs')
    })

    it('resolves comprehensive mobile skill set', () => {
      const result = detectWorkspace('/apps/example-app')
      const skills = resolveSkillsFromTechnologies(result.technologies, result.dependencies)

      expect(skills).toContain('typescript-clean-code')
      expect(skills).toContain('react-native-core')
      expect(skills).toContain('expo-core')
      expect(skills).toContain('expo-router')
      expect(skills).toContain('expo-notifications')
      expect(skills).toContain('nativewind')
      expect(skills).toContain('reanimated')
      expect(skills).toContain('zustand')
      expect(skills).toContain('react-query')
      expect(skills).toContain('zod')
      expect(skills).toContain('mmkv')
      expect(skills).toContain('react-hook-form')
      expect(skills).toContain('graphql-request')
      expect(skills).toContain('flash-list')
      expect(skills).toContain('netinfo')
      expect(skills).toContain('date-fns')
      expect(skills).toContain('rn-testing-library')
      expect(skills).toContain('keyboard-controller')
      expect(skills).toContain('sentry-react-native')
      expect(skills).toContain('biome')

      expect(skills).not.toContain('nestjs-core')
      expect(skills).not.toContain('nestjs-graphql')
      expect(skills).not.toContain('nestjs-mongoose')
      expect(skills).not.toContain('nestjs-auth')
      expect(skills).not.toContain('class-validator')
    })

    it('eng prompt includes race-conditions AND component-check for react-native', () => {
      const result = detectWorkspace('/apps/example-app')
      const prompt = phaseEngPromptV2.build({
        specPath: 'docs/specs/example-app/feature.md',
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: result.technologies,
        detectedDependencies: result.dependencies,
      })

      expect(prompt.userPrompt).toContain('<race_conditions>')
      expect(prompt.userPrompt).toContain('</race_conditions>')
      expect(prompt.userPrompt).toContain('AbortController')

      expect(prompt.userPrompt).toContain('<component_check>')
      expect(prompt.userPrompt).toContain('</component_check>')
      expect(prompt.userPrompt).toContain('variant')

      expect(prompt.userPrompt).toContain('react-native-core')
      expect(prompt.userPrompt).toContain('expo-core')
      expect(prompt.userPrompt).toContain('zustand')
    })

    it('audit prompt includes mobile skills', () => {
      const result = detectWorkspace('/apps/example-app')
      const prompt = phaseAuditPromptV2.build({
        specPath: 'docs/specs/example-app/feature.md',
        phaseNumber: 1,
        filesModified: ['src/features/sleep/hooks/useSleepTimer.ts'],
        engSummary: 'Implemented sleep timer',
        detectedTechnologies: result.technologies,
        detectedDependencies: result.dependencies,
      })

      expect(prompt.userPrompt).toContain('react-native-core')
      expect(prompt.userPrompt).toContain('expo-core')
      expect(prompt.userPrompt).toContain('zustand')
      expect(prompt.userPrompt).toContain('typescript-clean-code')
    })
  })

  describe('DEPENDENCY_SKILL_MAP — React Native dependencies', () => {
    it('maps all dependencies from example-app that have skills', () => {
      const appDeps = [
        ...Object.keys(EXAMPLE_APP_PKG.dependencies),
        ...Object.keys(EXAMPLE_APP_PKG.devDependencies),
      ]

      const expectedMapped = [
        'react-native',
        'expo',
        'expo-router',
        'expo-notifications',
        'nativewind',
        'react-native-reanimated',
        'zustand',
        '@tanstack/react-query',
        'zod',
        'react-native-mmkv',
        'react-hook-form',
        'graphql-request',
        '@shopify/flash-list',
        '@react-native-community/netinfo',
        'date-fns',
        '@testing-library/react-native',
        'react-native-keyboard-controller',
        '@biomejs/biome',
        '@sentry/react-native',
      ]

      for (const dep of expectedMapped) {
        expect(appDeps).toContain(dep)
        expect(DEPENDENCY_SKILL_MAP[dep]).toBeDefined()
      }
    })
  })

  describe('Conditional engineering rules — React Native', () => {
    it('ALL four rule sections', () => {
      mockPackageJson(EXAMPLE_APP_PKG)
      const result = detectWorkspace('/apps/example-app')
      const prompt = phaseEngPromptV2.build({
        specPath: 'test.md',
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: result.technologies,
        detectedDependencies: result.dependencies,
      })

      expect(prompt.userPrompt).toContain('<testing_requirements>')
      expect(prompt.userPrompt).toContain('<export_design>')
      expect(prompt.userPrompt).toContain('<race_conditions>')
      expect(prompt.userPrompt).toContain('<component_check>')
    })
  })

  describe('preparePromptInput — React Native', () => {
    it('end-to-end: RN workspace → capability detects technologies', async () => {
      mockPackageJson(EXAMPLE_APP_PKG)
      const { phaseEngStepCapability } = await import('../phase-eng-step.capability.js')

      const input = {
        spec_path: 'docs/specs/example-app/feature.md',
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
        cwd: '/apps/example-app',
      }

      const promptInput = phaseEngStepCapability.preparePromptInput(
        input as never,
        createMockContext() as never,
      ) as Record<string, unknown>

      expect(promptInput.detectedTechnologies).toContain('react-native')
      expect(promptInput.detectedTechnologies).toContain('expo')
      expect(promptInput.detectedDependencies).toContain('react-native')
      expect(promptInput.detectedDependencies).toContain('zustand')
      expect(promptInput.detectedDependencies).toContain('nativewind')
    })

    it('end-to-end: audit capability detects workspace for RN project', async () => {
      mockPackageJson(EXAMPLE_APP_PKG)
      const { phaseAuditStepCapability } = await import('../phase-audit-step.capability.js')

      const input = {
        spec_path: 'docs/specs/example-app/feature.md',
        phase_number: 1,
        files_modified: ['src/features/sleep/hooks/useSleepTimer.ts'],
        eng_summary: 'Implemented sleep timer',
        cwd: '/apps/example-app',
      }

      const promptInput = phaseAuditStepCapability.preparePromptInput(
        input as never,
        createMockContext() as never,
      ) as Record<string, unknown>

      expect(promptInput.detectedTechnologies).toContain('react-native')
      expect(promptInput.detectedTechnologies).toContain('expo')
      expect(promptInput.detectedDependencies).toContain('zustand')
    })
  })
})
