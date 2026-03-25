/**
 * Engineering fix step sub-capability definition for audit-fix.
 * Internal capability: runs shared eng prompt in "fix" mode with
 * auditSummary and filesWithIssues, parses <eng_fix_result> XML or structured output.
 *
 * Uses the shared eng prompt builder from src/shared/prompts/eng-prompt.v2.ts
 * in "fix" mode for applying audit-discovered issues.
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { buildDevContext } from '../../shared/prompts/dev-context.js'
import { buildEngPromptV2 } from '../../shared/prompts/eng-prompt.v2.js'
import { detectWorkspace } from '../../shared/workspace-detector.js'
import { ENG_FIX_RESULT_FALLBACK, parseJsonSafe, parseXmlBlock } from './audit-fix.helpers.js'
import type { EngFixResult, EngStepInput } from './audit-fix.schema.js'
import { EngFixResultSchema, EngStepInputSchema } from './audit-fix.schema.js'

// ---------------------------------------------------------------------------
// Prompt version for eng fix step
// ---------------------------------------------------------------------------

interface EngStepPromptInput {
  projectPath: string
  auditSummary: string
  filesWithIssues: string[]
  iterationNumber: number
  detectedTechnologies: string[]
  detectedDependencies: string[]
  cwd?: string
  testFailureSummary?: string
  specPath?: string
}

const engStepPromptV1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-01',
  description: 'Eng fix step: applies audit fixes using shared eng prompt in fix mode',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const {
      projectPath,
      auditSummary,
      filesWithIssues,
      iterationNumber,
      detectedTechnologies,
      detectedDependencies,
      cwd,
      testFailureSummary,
      specPath,
    } = input as EngStepPromptInput

    const result = buildEngPromptV2({
      mode: 'fix',
      projectPath,
      auditSummary,
      filesWithIssues,
      iterationNumber,
      detectedTechnologies,
      detectedDependencies,
      cwd,
      testFailureSummary,
      specPath,
    })

    return {
      systemPrompt: result.systemPrompt,
      userPrompt: result.userPrompt,
    }
  },
}

const engStepPrompts: PromptRegistry = {
  v1: engStepPromptV1,
}

// ---------------------------------------------------------------------------
// JSON Schema for structured output
// ---------------------------------------------------------------------------

const ENG_FIX_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['success', 'failed'] },
      files_modified: { type: 'array', items: { type: 'string' } },
      summary: { type: 'string' },
    },
    required: ['status', 'files_modified', 'summary'],
  },
}

// ---------------------------------------------------------------------------
// Capability Definition
// ---------------------------------------------------------------------------

/**
 * Internal sub-capability for engineering fix step.
 * Not intended for direct external use — invoked by the audit_fix orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * read files, apply fixes, and run tests. Input is validated via Zod schema and this
 * capability is only invoked through the orchestrator's authenticated channel.
 */
export const auditFixEngStepCapability: CapabilityDefinition<EngStepInput, EngFixResult> = {
  id: 'audit_fix_eng_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Audit Fix Eng Step (Internal)',
  description:
    'Internal sub-capability: applies audit fixes using shared eng prompt in fix mode. Reads files with issues, applies fixes, runs tsc and tests. Not intended for direct use.',
  inputSchema: EngStepInputSchema,
  promptRegistry: engStepPrompts,
  currentPromptVersion: 'v1',
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 100,
    maxBudgetUsd: 8.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: ENG_FIX_OUTPUT_JSON_SCHEMA,
    get appendSystemPrompt() {
      return buildDevContext()
    },
  },

  preparePromptInput: (input: EngStepInput, _context) => {
    const detection = detectWorkspace(input.cwd)
    return {
      projectPath: input.project_path,
      auditSummary: input.audit_summary,
      filesWithIssues: input.files_with_issues,
      iterationNumber: input.iteration_number,
      detectedTechnologies: detection.technologies,
      detectedDependencies: detection.dependencies,
      cwd: input.cwd,
      testFailureSummary: input.test_failure_summary,
      specPath: input.spec_path,
    }
  },

  processResult: (_input: EngStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = EngFixResultSchema.safeParse(aiResult.structuredOutput)
      if (parsed.success) {
        return parsed.data
      }
    }

    // Strategy 2: Fall back to XML parsing (check both tag names)
    const xmlContent =
      parseXmlBlock(aiResult.content, 'eng_fix_result') ||
      parseXmlBlock(aiResult.content, 'fix_result')
    const fallback: EngFixResult = {
      ...ENG_FIX_RESULT_FALLBACK,
      summary: aiResult.content.slice(0, 2000),
    }

    if (xmlContent) {
      return parseJsonSafe(xmlContent, EngFixResultSchema, fallback)
    }

    return fallback
  },
}
