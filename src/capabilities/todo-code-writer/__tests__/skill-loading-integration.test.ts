/**
 * Cross-project skill loading integration tests.
 *
 * Tests shared across multiple project types and MCP/utility projects.
 * Project-specific tests are in:
 *   - skill-loading-nestjs.test.ts
 *   - skill-loading-nextjs.test.ts
 *   - skill-loading-rn.test.ts
 */

import { vi } from 'vitest'
import {
  EXAMPLE_SERVER_PKG,
  EXAMPLE_APP_PKG,
  MCP_TS_ENGINEER_PKG,
  MCP_AGENTS_EXECUTOR_PKG,
  UTILS_PKG,
  MOCK_PHASE_PLAN,
} from './skill-loading-test-utils.js'

// ---------------------------------------------------------------------------
// Mock fs before importing modules under test (ESM mocking)
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

// Dynamic imports after mock setup
const { detectWorkspace } = await import('../workspace-detector.js')
const { resolveSkillsFromTechnologies, DEPENDENCY_SKILL_MAP } = await import(
  '../../../shared/prompts/eng-rules/skill-loading.js'
)
const { phaseEngPromptV2 } = await import('../prompts/phase-eng.v2.js')

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockPackageJson(content: Record<string, unknown>): void {
  mockReadFileSync.mockReturnValue(JSON.stringify(content))
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Dynamic Skill Loading — Cross-Project Integration', () => {
  describe('mcp-ts-engineer (MCP + Agent SDK)', () => {
    beforeEach(() => mockPackageJson(MCP_TS_ENGINEER_PKG))

    it('does NOT detect any framework technology tags', () => {
      const result = detectWorkspace('/apps/mcp-ts-engineer')
      expect(result.technologies).not.toContain('nestjs')
      expect(result.technologies).not.toContain('react-native')
      expect(result.technologies).not.toContain('react')
      expect(result.technologies).not.toContain('expo')
    })

    it('resolves claude-agent-sdk and zod skills', () => {
      const result = detectWorkspace('/apps/mcp-ts-engineer')
      const skills = resolveSkillsFromTechnologies(result.technologies, result.dependencies)

      expect(skills).toContain('typescript-clean-code')
      expect(skills).toContain('claude-agent-sdk')
      expect(skills).toContain('zod')

      expect(skills).not.toContain('nestjs-core')
      expect(skills).not.toContain('react-native-core')
      expect(skills).not.toContain('expo-core')
    })

    it('eng prompt has NO race-conditions or component-check', () => {
      const result = detectWorkspace('/apps/mcp-ts-engineer')
      const prompt = phaseEngPromptV2.build({
        specPath: 'docs/specs/feature.md',
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: result.technologies,
        detectedDependencies: result.dependencies,
      })

      expect(prompt.userPrompt).not.toContain('<race_conditions>')
      expect(prompt.userPrompt).not.toContain('<component_check>')
      expect(prompt.userPrompt).toContain('claude-agent-sdk')
      expect(prompt.userPrompt).toContain('zod')
    })
  })

  describe('mcp-agents-executor (MCP server, no Agent SDK)', () => {
    beforeEach(() => mockPackageJson(MCP_AGENTS_EXECUTOR_PKG))

    it('resolves zod and claude-agent-sdk (via @modelcontextprotocol/sdk mapping)', () => {
      const result = detectWorkspace('/apps/mcp-agents-executor')
      const skills = resolveSkillsFromTechnologies(result.technologies, result.dependencies)

      expect(skills).toContain('typescript-clean-code')
      expect(skills).toContain('zod')
      expect(skills).toContain('claude-agent-sdk')
    })

    it('has same skill set as mcp-ts-engineer (both have @modelcontextprotocol/sdk)', () => {
      const executorResult = detectWorkspace('/apps/mcp-agents-executor')
      const executorSkills = resolveSkillsFromTechnologies(
        executorResult.technologies,
        executorResult.dependencies,
      )

      mockPackageJson(MCP_TS_ENGINEER_PKG)
      const swResult = detectWorkspace('/apps/mcp-ts-engineer')
      const swSkills = resolveSkillsFromTechnologies(swResult.technologies, swResult.dependencies)

      expect(executorSkills).toContain('claude-agent-sdk')
      expect(swSkills).toContain('claude-agent-sdk')
      expect(executorSkills).toContain('zod')
      expect(swSkills).toContain('zod')
    })
  })

  describe('packages/utils (minimal utility package)', () => {
    beforeEach(() => mockPackageJson(UTILS_PKG))

    it('detects no technology tags', () => {
      const result = detectWorkspace('/packages/utils')
      expect(result.technologies).toEqual([])
    })

    it('resolves only typescript-clean-code', () => {
      const result = detectWorkspace('/packages/utils')
      const skills = resolveSkillsFromTechnologies(result.technologies, result.dependencies)
      expect(skills).toEqual(['typescript-clean-code'])
    })

    it('eng prompt still has skill_loading section with typescript-clean-code', () => {
      const result = detectWorkspace('/packages/utils')
      const prompt = phaseEngPromptV2.build({
        specPath: 'docs/specs/feature.md',
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: result.technologies,
        detectedDependencies: result.dependencies,
      })

      expect(prompt.userPrompt).toContain('<skill_loading>')
      expect(prompt.userPrompt).toContain('typescript-clean-code')
      expect(prompt.userPrompt).not.toContain('nestjs-core')
      expect(prompt.userPrompt).not.toContain('react-native-core')
    })
  })

  describe('Cross-project skill set differentiation', () => {
    it('server and app produce completely different skill sets', () => {
      mockPackageJson(EXAMPLE_SERVER_PKG)
      const serverResult = detectWorkspace('/apps/example-server')
      const serverSkills = resolveSkillsFromTechnologies(
        serverResult.technologies,
        serverResult.dependencies,
      )

      mockPackageJson(EXAMPLE_APP_PKG)
      const appResult = detectWorkspace('/apps/example-app')
      const appSkills = resolveSkillsFromTechnologies(
        appResult.technologies,
        appResult.dependencies,
      )

      const serverOnly = serverSkills.filter((s) => !appSkills.includes(s))
      const appOnly = appSkills.filter((s) => !serverSkills.includes(s))

      expect(serverOnly).toContain('nestjs-core')
      expect(serverOnly).toContain('nestjs-graphql')
      expect(serverOnly).toContain('nestjs-mongoose')
      expect(serverOnly).toContain('nestjs-auth')
      expect(serverOnly).toContain('class-validator')

      expect(appOnly).toContain('react-native-core')
      expect(appOnly).toContain('expo-core')
      expect(appOnly).toContain('expo-router')
      expect(appOnly).toContain('nativewind')
      expect(appOnly).toContain('zustand')
      expect(appOnly).toContain('reanimated')
    })

    it('MCP projects have minimal skill sets compared to app projects', () => {
      mockPackageJson(MCP_TS_ENGINEER_PKG)
      const mcpResult = detectWorkspace('/apps/mcp-ts-engineer')
      const mcpSkills = resolveSkillsFromTechnologies(
        mcpResult.technologies,
        mcpResult.dependencies,
      )

      mockPackageJson(EXAMPLE_APP_PKG)
      const appResult = detectWorkspace('/apps/example-app')
      const appSkills = resolveSkillsFromTechnologies(
        appResult.technologies,
        appResult.dependencies,
      )

      expect(mcpSkills.length).toBeLessThan(appSkills.length)
      expect(mcpSkills.length).toBeLessThanOrEqual(5)
      expect(appSkills.length).toBeGreaterThanOrEqual(15)
    })

    it('eng prompt character count scales with project complexity', () => {
      mockPackageJson(UTILS_PKG)
      const utilsResult = detectWorkspace('/packages/utils')
      const utilsPrompt = phaseEngPromptV2.build({
        specPath: 'docs/specs/feature.md',
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: utilsResult.technologies,
        detectedDependencies: utilsResult.dependencies,
      })

      mockPackageJson(EXAMPLE_APP_PKG)
      const appResult = detectWorkspace('/apps/example-app')
      const appPrompt = phaseEngPromptV2.build({
        specPath: 'docs/specs/feature.md',
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: appResult.technologies,
        detectedDependencies: appResult.dependencies,
      })

      expect(appPrompt.userPrompt.length).toBeGreaterThan(utilsPrompt.userPrompt.length)
    })
  })

  describe('DEPENDENCY_SKILL_MAP completeness', () => {
    it('maps @modelcontextprotocol/sdk to claude-agent-sdk', () => {
      const mcpDeps = [
        ...Object.keys(MCP_TS_ENGINEER_PKG.dependencies),
        ...Object.keys(MCP_TS_ENGINEER_PKG.devDependencies),
      ]

      expect(mcpDeps).toContain('@modelcontextprotocol/sdk')
      expect(DEPENDENCY_SKILL_MAP['@modelcontextprotocol/sdk']).toBe('claude-agent-sdk')
    })

    it('GAP: @anthropic-ai/claude-agent-sdk is NOT in DEPENDENCY_SKILL_MAP', () => {
      expect(DEPENDENCY_SKILL_MAP['@anthropic-ai/claude-agent-sdk']).toBeUndefined()
    })
  })

  describe('Conditional engineering rules — MCP & utils', () => {
    it('mcp-ts-engineer: testing + export only', () => {
      mockPackageJson(MCP_TS_ENGINEER_PKG)
      const result = detectWorkspace('/apps/mcp-ts-engineer')
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

    it('packages/utils: testing + export only', () => {
      mockPackageJson(UTILS_PKG)
      const result = detectWorkspace('/packages/utils')
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
})
