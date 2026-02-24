import { vi } from 'vitest'

/**
 * Tests for phase-audit-step sub-capability definition.
 * Updated for v2: workspace detection, skill loading.
 */

// ---------------------------------------------------------------------------
// Mock fs before importing (workspace-detector uses fs.readFileSync)
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

// Dynamic import after mock setup (required for ESM mocking)
const { phaseAuditStepCapability } = await import('../phase-audit-step.capability.js')

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

interface MockCapabilityContext {
  session: Record<string, unknown>
  invocation: Record<string, unknown>
  logger: Record<string, () => void>
  getSessionCost: () => Record<string, number>
  promptVersion: string
  providerName: string
  invokeCapability: ReturnType<typeof vi.fn>
}

function createMockContext(): MockCapabilityContext {
  return {
    session: {
      id: 'test-session',
      state: 'active',
      startedAt: '2026-01-30T00:00:00Z',
      invocations: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    },
    invocation: {
      id: 'test-invocation',
      capability: 'test_capability',
      input: {},
      timestamp: '2026-01-30T00:00:00Z',
    },
    logger: {
      info: () => {},
      debug: () => {},
      error: () => {},
      warn: () => {},
    },
    getSessionCost: () => ({
      totalCostUsd: 0,
      totalInputTokens: 0,
      totalOutputTokens: 0,
    }),
    promptVersion: 'v2',
    providerName: 'ClaudeProvider',
    invokeCapability: vi.fn(),
  }
}

function createMockAiResult(content: string, structuredOutput?: Record<string, unknown>) {
  return {
    content,
    structuredOutput,
    usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    costUsd: 0.1,
    turns: 5,
    terminationReason: 'success',
    trace: {
      tid: 'testtrace00000000000000000000000',
      startedAt: '2026-01-30T00:00:00Z',
      request: { prompt: 'test' },
      turns: [],
    },
  }
}

/** Configure mockReadFileSync to return a valid package.json. */
function mockPackageJson(content: Record<string, unknown>): void {
  mockReadFileSync.mockReturnValue(JSON.stringify(content))
}

beforeEach(() => {
  vi.clearAllMocks()
  // Default: NestJS workspace
  mockPackageJson({
    dependencies: { '@nestjs/core': '11.0.0', 'class-validator': '0.14.0' },
  })
})

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('phaseAuditStepCapability', () => {
  describe('definition metadata', () => {
    it('has correct id', () => {
      expect(phaseAuditStepCapability.id).toBe('todo_code_writer_phase_audit_step')
    })

    it('has correct type', () => {
      expect(phaseAuditStepCapability.type).toBe('tool')
    })

    it('has correct visibility', () => {
      expect(phaseAuditStepCapability.visibility).toBe('internal')
    })

    it('has non-empty name', () => {
      expect(phaseAuditStepCapability.name).toBeTruthy()
      expect(phaseAuditStepCapability.name.length).toBeGreaterThan(0)
    })

    it('has non-empty description', () => {
      expect(phaseAuditStepCapability.description).toBeTruthy()
      expect(phaseAuditStepCapability.description.length).toBeGreaterThan(0)
    })

    it('defaults to sonnet model', () => {
      expect(phaseAuditStepCapability.defaultRequestOptions?.model).toBe('sonnet')
    })

    it('defaults to 50 maxTurns', () => {
      expect(phaseAuditStepCapability.defaultRequestOptions?.maxTurns).toBe(50)
    })

    it('defaults to $2.0 budget', () => {
      expect(phaseAuditStepCapability.defaultRequestOptions?.maxBudgetUsd).toBe(2.0)
    })

    it('has prompt registry with v1 and v2', () => {
      expect(phaseAuditStepCapability.promptRegistry).toBeDefined()
      expect(phaseAuditStepCapability.promptRegistry.v1).toBeDefined()
      expect(phaseAuditStepCapability.promptRegistry.v2).toBeDefined()
    })

    it('has current prompt version v2', () => {
      expect(phaseAuditStepCapability.currentPromptVersion).toBe('v2')
    })

    it('v1 prompt is still available and not deprecated', () => {
      const v1 = phaseAuditStepCapability.promptRegistry.v1
      expect(v1).toBeDefined()
      expect(v1.deprecated).toBe(false)
      const result = v1.build({
        specPath: 'test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
      })
      expect(result.userPrompt).toBeDefined()
      expect(result.userPrompt.length).toBeGreaterThan(0)
    })

    it('has outputSchema configured', () => {
      expect(phaseAuditStepCapability.defaultRequestOptions?.outputSchema).toBeDefined()
    })

    it('prompt v1 systemPrompt.append contains review context', () => {
      const prompt = phaseAuditStepCapability.promptRegistry.v1.build({
        specPath: 'test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
      })
      const append = (prompt.systemPrompt as { append?: string }).append ?? ''
      expect(append).toContain('Security')
      expect(append).toContain('Review Checklist')
      expect(append).toContain('Review Context')
    })

    it('prompt v2 systemPrompt.append contains review context', () => {
      const prompt = phaseAuditStepCapability.promptRegistry.v2.build({
        specPath: 'test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
      })
      const append = (prompt.systemPrompt as { append?: string }).append ?? ''
      expect(append).toContain('Review Context')
    })

    it('includes path validation hooks in defaultRequestOptions', () => {
      expect(phaseAuditStepCapability.defaultRequestOptions?.hooks).toBeDefined()
      const hooks = phaseAuditStepCapability.defaultRequestOptions?.hooks as unknown as {
        PreToolUse?: unknown[]
      }
      expect(hooks?.PreToolUse).toHaveLength(2)
    })
  })

  describe('preparePromptInput', () => {
    /** Helper to get typed prompt input from capability. */
    function getPromptInput(input: Record<string, unknown>): Record<string, unknown> {
      const context = createMockContext()
      return phaseAuditStepCapability.preparePromptInput(
        input as never,
        context as never,
      ) as Record<string, unknown>
    }

    it('extracts specPath, phaseNumber, filesModified, engSummary, and cwd', () => {
      const result = getPromptInput({
        spec_path: 'docs/specs/feature.md',
        phase_number: 1,
        files_modified: ['src/test1.ts', 'src/test2.ts'],
        eng_summary: 'Implemented phase 1',
        cwd: '/some/path',
      })

      expect(result.specPath).toBe('docs/specs/feature.md')
      expect(result.phaseNumber).toBe(1)
      expect(result.filesModified).toEqual(['src/test1.ts', 'src/test2.ts'])
      expect(result.engSummary).toBe('Implemented phase 1')
      expect(result.cwd).toBe('/some/path')
    })

    it('includes detectedTechnologies from workspace detection', () => {
      const result = getPromptInput({
        spec_path: 'docs/specs/feature.md',
        phase_number: 1,
        files_modified: ['src/test.ts'],
        eng_summary: 'Done',
        cwd: '/some/path',
      })

      expect(result.detectedTechnologies).toBeDefined()
      expect(Array.isArray(result.detectedTechnologies)).toBe(true)
      expect(result.detectedTechnologies).toContain('nestjs')
    })

    it('includes detectedDependencies from workspace detection', () => {
      const result = getPromptInput({
        spec_path: 'docs/specs/feature.md',
        phase_number: 1,
        files_modified: ['src/test.ts'],
        eng_summary: 'Done',
        cwd: '/some/path',
      })

      expect(result.detectedDependencies).toBeDefined()
      expect(Array.isArray(result.detectedDependencies)).toBe(true)
      expect(result.detectedDependencies).toContain('@nestjs/core')
    })

    it('handles missing cwd gracefully', () => {
      const result = getPromptInput({
        spec_path: 'docs/specs/feature.md',
        phase_number: 1,
        files_modified: ['src/test.ts'],
        eng_summary: 'Done',
      })

      expect(result.cwd).toBeUndefined()
      expect(result.detectedTechnologies).toEqual([])
      expect(result.detectedDependencies).toEqual([])
    })
  })

  describe('v2 prompt skill loading', () => {
    it('v2 prompt includes skill_loading section', () => {
      const prompt = phaseAuditStepCapability.promptRegistry.v2.build({
        specPath: 'test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: ['nestjs'],
        detectedDependencies: ['@nestjs/core'],
      })

      expect(prompt.userPrompt).toContain('<skill_loading>')
      expect(prompt.userPrompt).toContain('</skill_loading>')
      expect(prompt.userPrompt).toContain('nestjs-core')
      expect(prompt.userPrompt).toContain('typescript-clean-code')
    })

    it('v2 prompt includes LOAD SKILLS FIRST rule', () => {
      const prompt = phaseAuditStepCapability.promptRegistry.v2.build({
        specPath: 'test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: ['nestjs'],
      })

      expect(prompt.userPrompt).toContain('LOAD SKILLS FIRST')
      expect(prompt.userPrompt).toContain('1. Load all skills listed in <skill_loading>')
    })

    it('v2 prompt includes Skill tool instruction', () => {
      const prompt = phaseAuditStepCapability.promptRegistry.v2.build({
        specPath: 'test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: [],
      })

      expect(prompt.userPrompt).toContain('Skill tool')
    })

    it('v2 prompt resolves skills from dependencies', () => {
      const prompt = phaseAuditStepCapability.promptRegistry.v2.build({
        specPath: 'test.md',
        phaseNumber: 1,
        filesModified: ['src/test.ts'],
        engSummary: 'Done',
        detectedTechnologies: ['react-native'],
        detectedDependencies: ['react-native', 'expo', 'zustand'],
      })

      expect(prompt.userPrompt).toContain('react-native-core')
      expect(prompt.userPrompt).toContain('expo-core')
      expect(prompt.userPrompt).toContain('zustand')
    })
  })

  describe('processResult', () => {
    /** Helper to get typed process result from capability. */
    function getProcessResult(
      input: Record<string, unknown>,
      aiResult: ReturnType<typeof createMockAiResult>,
    ): Record<string, unknown> {
      const context = createMockContext()
      return phaseAuditStepCapability.processResult(
        input as never,
        aiResult as never,
        context as never,
      ) as Record<string, unknown>
    }

    it('uses structured output when available', () => {
      const structuredOutput = {
        status: 'pass' as const,
        issues_found: 0,
        summary: 'All checks passed for phase 1',
      }
      const aiResult = createMockAiResult('Some content', structuredOutput)
      const input = {
        spec_path: 'docs/specs/feature.md',
        phase_number: 1,
        files_modified: ['src/test.ts'],
        eng_summary: 'Done',
      }

      const result = getProcessResult(input, aiResult)

      expect(result).toEqual(structuredOutput)
    })

    it('falls back to XML parsing when structured output unavailable', () => {
      const auditResult = {
        status: 'warn',
        issues_found: 2,
        summary: 'Minor issues found',
      }
      const content = `Audit complete.\n<phase_audit_result>${JSON.stringify(auditResult)}</phase_audit_result>`
      const aiResult = createMockAiResult(content)
      const input = {
        spec_path: 'docs/specs/feature.md',
        phase_number: 1,
        files_modified: ['src/test.ts'],
        eng_summary: 'Done',
      }

      const result = getProcessResult(input, aiResult)

      expect(result).toEqual(auditResult)
    })

    it('returns fallback on parse failure (no XML block)', () => {
      const content = 'No audit result block here.'
      const aiResult = createMockAiResult(content)
      const input = {
        spec_path: 'docs/specs/feature.md',
        phase_number: 1,
        files_modified: ['src/test.ts'],
        eng_summary: 'Done',
      }

      const result = getProcessResult(input, aiResult)

      expect(result.status).toBe('fail')
      expect(result.issues_found).toBe(0)
    })

    it('returns fallback on invalid JSON in XML block', () => {
      const content = `<phase_audit_result>not valid json</phase_audit_result>`
      const aiResult = createMockAiResult(content)
      const input = {
        spec_path: 'docs/specs/feature.md',
        phase_number: 1,
        files_modified: ['src/test.ts'],
        eng_summary: 'Done',
      }

      const result = getProcessResult(input, aiResult)

      expect(result.status).toBe('fail')
    })

    it('returns fallback on invalid structured output schema', () => {
      const invalidStructuredOutput = {
        status: 'invalid_status',
        issues_found: 'not_a_number',
        summary: 'Test',
      }
      const aiResult = createMockAiResult('Content', invalidStructuredOutput)
      const input = {
        spec_path: 'docs/specs/feature.md',
        phase_number: 1,
        files_modified: ['src/test.ts'],
        eng_summary: 'Done',
      }

      const result = getProcessResult(input, aiResult)

      expect(result.status).toBe('fail')
    })
  })
})
