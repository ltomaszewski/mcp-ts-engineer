import { vi } from 'vitest'

/**
 * Integration tests for dynamic skill loading across monorepo projects.
 *
 * Validates that detectWorkspace + resolveSkillsFromTechnologies + prompt builders
 * produce different, correct skill sets depending on which project's package.json
 * is being analyzed (e.g. NestJS server, React Native app, MCP server, etc.).
 *
 * Uses mocked package.json content that mirrors the real monorepo projects.
 */

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
  '../prompts/eng-rules/skill-loading.js'
)
const { phaseEngPromptV2 } = await import('../prompts/phase-eng.v2.js')
const { phaseAuditPromptV2 } = await import('../prompts/phase-audit.v2.js')

// ---------------------------------------------------------------------------
// Real-world package.json data from monorepo projects
// ---------------------------------------------------------------------------

/** Example NestJS GraphQL backend package.json */
const EXAMPLE_SERVER_PKG = {
  dependencies: {
    '@apollo/server': '4.0.0',
    '@nestjs/apollo': '12.0.0',
    '@nestjs/common': '11.0.0',
    '@nestjs/config': '3.0.0',
    '@nestjs/core': '11.0.0',
    '@nestjs/graphql': '12.0.0',
    '@nestjs/jwt': '11.0.0',
    '@nestjs/mongoose': '11.0.0',
    '@nestjs/passport': '11.0.0',
    '@nestjs/platform-express': '11.0.0',
    'class-transformer': '0.5.0',
    'class-validator': '0.14.0',
    'date-fns': '3.0.0',
    'date-fns-tz': '3.0.0',
    graphql: '16.0.0',
    mongoose: '8.0.0',
    passport: '0.7.0',
    'passport-jwt': '4.0.0',
    rxjs: '7.0.0',
  },
  devDependencies: {
    '@nestjs/cli': '11.0.0',
    '@nestjs/testing': '11.0.0',
    '@types/jest': '29.0.0',
    jest: '29.0.0',
    'ts-jest': '29.0.0',
    typescript: '5.0.0',
  },
}

/** Example React Native/Expo mobile app package.json */
const EXAMPLE_APP_PKG = {
  dependencies: {
    '@react-native-community/netinfo': '11.0.0',
    '@sentry/react-native': '6.0.0',
    '@shopify/flash-list': '1.0.0',
    '@tanstack/react-query': '5.0.0',
    'date-fns': '3.0.0',
    expo: '54.0.0',
    'expo-notifications': '0.28.0',
    'expo-router': '4.0.0',
    'graphql-request': '7.0.0',
    nativewind: '4.0.0',
    react: '19.0.0',
    'react-hook-form': '7.0.0',
    'react-native': '0.81.0',
    'react-native-gesture-handler': '2.0.0',
    'react-native-keyboard-controller': '1.0.0',
    'react-native-mmkv': '3.0.0',
    'react-native-reanimated': '3.0.0',
    zod: '3.0.0',
    zustand: '5.0.0',
  },
  devDependencies: {
    '@biomejs/biome': '1.0.0',
    '@testing-library/react-native': '12.0.0',
    '@types/jest': '29.0.0',
    jest: '29.0.0',
    typescript: '5.0.0',
  },
}

/** apps/mcp-ts-engineer/package.json (MCP server with Agent SDK) */
const MCP_TS_ENGINEER_PKG = {
  dependencies: {
    '@anthropic-ai/claude-agent-sdk': '0.1.0',
    '@modelcontextprotocol/sdk': '1.22.0',
    zod: '3.0.0',
  },
  devDependencies: {
    '@types/jest': '29.0.0',
    '@types/node': '20.0.0',
    jest: '29.0.0',
    'ts-jest': '29.0.0',
    tsx: '4.0.0',
    typescript: '5.0.0',
  },
}

/** Example Next.js web app package.json */
const EXAMPLE_NEXT_APP_PKG = {
  dependencies: {
    next: '15.0.0',
    react: '19.0.0',
    'react-dom': '19.0.0',
    '@tanstack/react-query': '5.0.0',
    zustand: '5.0.0',
    'react-hook-form': '7.0.0',
    '@hookform/resolvers': '3.0.0',
    zod: '3.0.0',
    'better-auth': '1.0.0',
    'class-variance-authority': '0.7.0',
    clsx: '2.0.0',
    'tailwind-merge': '2.0.0',
    'lucide-react': '0.400.0',
    'tw-animate-css': '1.0.0',
  },
  devDependencies: {
    typescript: '5.0.0',
    '@biomejs/biome': '2.0.0',
    '@tailwindcss/postcss': '4.0.0',
    tailwindcss: '4.0.0',
    vitest: '3.0.0',
    '@vitejs/plugin-react': '4.0.0',
    '@testing-library/react': '16.0.0',
    '@testing-library/jest-dom': '6.0.0',
    '@testing-library/user-event': '14.0.0',
    'vite-tsconfig-paths': '5.0.0',
    jsdom: '25.0.0',
  },
}

/** apps/mcp-agents-executor/package.json (MCP server, no Agent SDK) */
const MCP_AGENTS_EXECUTOR_PKG = {
  dependencies: {
    '@modelcontextprotocol/sdk': '1.22.0',
    zod: '3.0.0',
  },
  devDependencies: {
    '@types/jest': '29.0.0',
    '@types/node': '20.0.0',
    jest: '29.0.0',
    'ts-jest': '29.0.0',
    tsx: '4.0.0',
    typescript: '5.0.0',
  },
}

/** packages/utils/package.json (minimal shared utility package) */
const UTILS_PKG = {
  devDependencies: {
    typescript: '5.0.0',
  },
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function mockPackageJson(content: Record<string, unknown>): void {
  mockReadFileSync.mockReturnValue(JSON.stringify(content))
}

const MOCK_PHASE_PLAN = {
  phases: [
    {
      phase_number: 1,
      purpose: 'Test phase',
      dependencies: ['none'],
      files: [{ path: 'src/test.ts', action: 'CREATE', purpose: 'Test file' }],
    },
  ],
}

beforeEach(() => {
  vi.clearAllMocks()
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('Dynamic Skill Loading — Cross-Project Integration', () => {
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

      // Expected NestJS skills
      expect(skills).toContain('typescript-clean-code')
      expect(skills).toContain('nestjs-core')
      expect(skills).toContain('nestjs-graphql')
      expect(skills).toContain('nestjs-mongoose')
      expect(skills).toContain('nestjs-auth')
      expect(skills).toContain('class-validator')
      expect(skills).toContain('date-fns')

      // Must NOT contain mobile skills
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

      // Skills present
      expect(prompt.userPrompt).toContain('nestjs-core')
      expect(prompt.userPrompt).toContain('nestjs-graphql')
      expect(prompt.userPrompt).toContain('class-validator')

      // Conditional rules NOT included for backend
      expect(prompt.userPrompt).not.toContain('<race_conditions>')
      expect(prompt.userPrompt).not.toContain('<component_check>')

      // Always-included rules
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

      // Expected mobile skills
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

      // Must NOT contain backend skills
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

      // Conditional rules included for react-native
      expect(prompt.userPrompt).toContain('<race_conditions>')
      expect(prompt.userPrompt).toContain('</race_conditions>')
      expect(prompt.userPrompt).toContain('AbortController')

      expect(prompt.userPrompt).toContain('<component_check>')
      expect(prompt.userPrompt).toContain('</component_check>')
      expect(prompt.userPrompt).toContain('variant')

      // Skills present
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

      // Expected Next.js skills
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

      // Must NOT contain mobile or backend skills
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

      // Race conditions included (Next.js uses React)
      expect(prompt.userPrompt).toContain('<race_conditions>')

      // Component check NOT included (that's react-native only)
      expect(prompt.userPrompt).not.toContain('<component_check>')

      // Skills present
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

      // Must NOT contain framework-specific skills
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
      // @modelcontextprotocol/sdk maps to claude-agent-sdk skill
      expect(skills).toContain('claude-agent-sdk')
    })

    it('has same skill set as mcp-ts-engineer (both have @modelcontextprotocol/sdk)', () => {
      // Both MCP projects have @modelcontextprotocol/sdk → claude-agent-sdk
      const executorResult = detectWorkspace('/apps/mcp-agents-executor')
      const executorSkills = resolveSkillsFromTechnologies(
        executorResult.technologies,
        executorResult.dependencies,
      )

      mockPackageJson(MCP_TS_ENGINEER_PKG)
      const swResult = detectWorkspace('/apps/mcp-ts-engineer')
      const swSkills = resolveSkillsFromTechnologies(swResult.technologies, swResult.dependencies)

      // Both get claude-agent-sdk and zod
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
      // Server
      mockPackageJson(EXAMPLE_SERVER_PKG)
      const serverResult = detectWorkspace('/apps/example-server')
      const serverSkills = resolveSkillsFromTechnologies(
        serverResult.technologies,
        serverResult.dependencies,
      )

      // App
      mockPackageJson(EXAMPLE_APP_PKG)
      const appResult = detectWorkspace('/apps/example-app')
      const appSkills = resolveSkillsFromTechnologies(
        appResult.technologies,
        appResult.dependencies,
      )

      // Only shared skill should be typescript-clean-code and date-fns
      const serverOnly = serverSkills.filter((s) => !appSkills.includes(s))
      const appOnly = appSkills.filter((s) => !serverSkills.includes(s))

      // Server has NestJS-specific skills
      expect(serverOnly).toContain('nestjs-core')
      expect(serverOnly).toContain('nestjs-graphql')
      expect(serverOnly).toContain('nestjs-mongoose')
      expect(serverOnly).toContain('nestjs-auth')
      expect(serverOnly).toContain('class-validator')

      // App has mobile-specific skills
      expect(appOnly).toContain('react-native-core')
      expect(appOnly).toContain('expo-core')
      expect(appOnly).toContain('expo-router')
      expect(appOnly).toContain('nativewind')
      expect(appOnly).toContain('zustand')
      expect(appOnly).toContain('reanimated')
    })

    it('MCP projects have minimal skill sets compared to app projects', () => {
      // MCP ts-engineer
      mockPackageJson(MCP_TS_ENGINEER_PKG)
      const mcpResult = detectWorkspace('/apps/mcp-ts-engineer')
      const mcpSkills = resolveSkillsFromTechnologies(
        mcpResult.technologies,
        mcpResult.dependencies,
      )

      // Example app
      mockPackageJson(EXAMPLE_APP_PKG)
      const appResult = detectWorkspace('/apps/example-app')
      const appSkills = resolveSkillsFromTechnologies(
        appResult.technologies,
        appResult.dependencies,
      )

      // MCP has far fewer skills
      expect(mcpSkills.length).toBeLessThan(appSkills.length)
      expect(mcpSkills.length).toBeLessThanOrEqual(5)
      expect(appSkills.length).toBeGreaterThanOrEqual(15)
    })

    it('eng prompt character count scales with project complexity', () => {
      // Minimal project (utils)
      mockPackageJson(UTILS_PKG)
      const utilsResult = detectWorkspace('/packages/utils')
      const utilsPrompt = phaseEngPromptV2.build({
        specPath: 'docs/specs/feature.md',
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: utilsResult.technologies,
        detectedDependencies: utilsResult.dependencies,
      })

      // Complex project (example-app)
      mockPackageJson(EXAMPLE_APP_PKG)
      const appResult = detectWorkspace('/apps/example-app')
      const appPrompt = phaseEngPromptV2.build({
        specPath: 'docs/specs/feature.md',
        phasePlan: MOCK_PHASE_PLAN,
        currentPhaseNumber: 1,
        detectedTechnologies: appResult.technologies,
        detectedDependencies: appResult.dependencies,
      })

      // App prompt should be larger due to more skills + conditional rules
      expect(appPrompt.userPrompt.length).toBeGreaterThan(utilsPrompt.userPrompt.length)
    })
  })

  describe('preparePromptInput integration via capabilities', () => {
    it('end-to-end: NestJS workspace → capability detects and passes technologies', async () => {
      mockPackageJson(EXAMPLE_SERVER_PKG)
      const { phaseEngStepCapability } = await import('../phase-eng-step.capability.js')

      const mockContext = {
        session: { id: 's1' },
        invocation: { id: 'i1' },
        logger: { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} },
        getSessionCost: () => ({ totalCostUsd: 0 }),
        promptVersion: 'v2',
        providerName: 'ClaudeProvider',
        invokeCapability: vi.fn(),
      }

      const input = {
        spec_path: 'docs/specs/example-server/feature.md',
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
        cwd: '/apps/example-server',
      }

      const promptInput = phaseEngStepCapability.preparePromptInput(
        input as never,
        mockContext as never,
      ) as Record<string, unknown>

      expect(promptInput.detectedTechnologies).toContain('nestjs')
      expect(promptInput.detectedDependencies).toContain('@nestjs/core')
      expect(promptInput.detectedDependencies).toContain('@nestjs/graphql')
    })

    it('end-to-end: React Native workspace → capability detects and passes technologies', async () => {
      mockPackageJson(EXAMPLE_APP_PKG)
      const { phaseEngStepCapability } = await import('../phase-eng-step.capability.js')

      const mockContext = {
        session: { id: 's1' },
        invocation: { id: 'i1' },
        logger: { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} },
        getSessionCost: () => ({ totalCostUsd: 0 }),
        promptVersion: 'v2',
        providerName: 'ClaudeProvider',
        invokeCapability: vi.fn(),
      }

      const input = {
        spec_path: 'docs/specs/example-app/feature.md',
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
        cwd: '/apps/example-app',
      }

      const promptInput = phaseEngStepCapability.preparePromptInput(
        input as never,
        mockContext as never,
      ) as Record<string, unknown>

      expect(promptInput.detectedTechnologies).toContain('react-native')
      expect(promptInput.detectedTechnologies).toContain('expo')
      expect(promptInput.detectedDependencies).toContain('react-native')
      expect(promptInput.detectedDependencies).toContain('zustand')
      expect(promptInput.detectedDependencies).toContain('nativewind')
    })

    it('end-to-end: Next.js workspace → capability detects and passes technologies', async () => {
      mockPackageJson(EXAMPLE_NEXT_APP_PKG)
      const { phaseEngStepCapability } = await import('../phase-eng-step.capability.js')

      const mockContext = {
        session: { id: 's1' },
        invocation: { id: 'i1' },
        logger: { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} },
        getSessionCost: () => ({ totalCostUsd: 0 }),
        promptVersion: 'v2',
        providerName: 'ClaudeProvider',
        invokeCapability: vi.fn(),
      }

      const input = {
        spec_path: 'docs/specs/example-next-app/feature.md',
        phase_plan: MOCK_PHASE_PLAN,
        current_phase_number: 1,
        cwd: '/apps/example-next-app',
      }

      const promptInput = phaseEngStepCapability.preparePromptInput(
        input as never,
        mockContext as never,
      ) as Record<string, unknown>

      expect(promptInput.detectedTechnologies).toContain('nextjs')
      expect(promptInput.detectedTechnologies).not.toContain('react')
      expect(promptInput.detectedDependencies).toContain('next')
      expect(promptInput.detectedDependencies).toContain('better-auth')
      expect(promptInput.detectedDependencies).toContain('@tailwindcss/postcss')
    })

    it('end-to-end: audit capability detects workspace for RN project', async () => {
      mockPackageJson(EXAMPLE_APP_PKG)
      const { phaseAuditStepCapability } = await import('../phase-audit-step.capability.js')

      const mockContext = {
        session: { id: 's1' },
        invocation: { id: 'i1' },
        logger: { info: () => {}, debug: () => {}, error: () => {}, warn: () => {} },
        getSessionCost: () => ({ totalCostUsd: 0 }),
        promptVersion: 'v2',
        providerName: 'ClaudeProvider',
        invokeCapability: vi.fn(),
      }

      const input = {
        spec_path: 'docs/specs/example-app/feature.md',
        phase_number: 1,
        files_modified: ['src/features/sleep/hooks/useSleepTimer.ts'],
        eng_summary: 'Implemented sleep timer',
        cwd: '/apps/example-app',
      }

      const promptInput = phaseAuditStepCapability.preparePromptInput(
        input as never,
        mockContext as never,
      ) as Record<string, unknown>

      expect(promptInput.detectedTechnologies).toContain('react-native')
      expect(promptInput.detectedTechnologies).toContain('expo')
      expect(promptInput.detectedDependencies).toContain('zustand')
    })
  })

  describe('DEPENDENCY_SKILL_MAP completeness', () => {
    it('maps all dependencies from example-server that have skills', () => {
      const serverDeps = [
        ...Object.keys(EXAMPLE_SERVER_PKG.dependencies),
        ...Object.keys(EXAMPLE_SERVER_PKG.devDependencies),
      ]

      // These server deps should have skill mappings
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

    it('maps @modelcontextprotocol/sdk to claude-agent-sdk', () => {
      const mcpDeps = [
        ...Object.keys(MCP_TS_ENGINEER_PKG.dependencies),
        ...Object.keys(MCP_TS_ENGINEER_PKG.devDependencies),
      ]

      expect(mcpDeps).toContain('@modelcontextprotocol/sdk')
      expect(DEPENDENCY_SKILL_MAP['@modelcontextprotocol/sdk']).toBe('claude-agent-sdk')
    })

    it('GAP: @anthropic-ai/claude-agent-sdk is NOT in DEPENDENCY_SKILL_MAP', () => {
      // Note: @anthropic-ai/claude-agent-sdk exists in mcp-ts-engineer
      // but does NOT have its own entry in DEPENDENCY_SKILL_MAP.
      // It gets claude-agent-sdk skill indirectly via @modelcontextprotocol/sdk.
      // This could be a gap if a project uses only the Agent SDK without the MCP SDK.
      expect(DEPENDENCY_SKILL_MAP['@anthropic-ai/claude-agent-sdk']).toBeUndefined()
    })
  })

  describe('Conditional engineering rules per project', () => {
    it('example-server: testing + export (NO race-conditions, NO component-check)', () => {
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

    it('example-app: ALL four rule sections', () => {
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
