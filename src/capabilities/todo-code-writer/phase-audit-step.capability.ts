/**
 * Phase audit step sub-capability definition.
 * Internal capability: audits code modified in a single phase against spec requirements.
 *
 * Uses SDK structured output (outputSchema) as primary extraction method.
 * Falls back to XML parsing from aiResult.content if structured output is unavailable.
 *
 * v2 enhancements:
 * - Detects workspace technologies and dependencies from package.json
 * - Passes detectedTechnologies and detectedDependencies to prompt builder
 * - Prompt instructs sub-agent to load relevant skills via the Skill tool
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import { buildPathValidationHooks } from '../../shared/hooks/index.js'
import { PHASE_AUDIT_CURRENT_VERSION, PHASE_AUDIT_PROMPT_VERSIONS } from './prompts/index.js'
import {
  PHASE_AUDIT_RESULT_FALLBACK,
  parseJsonSafe,
  parseXmlBlock,
} from './todo-code-writer.helpers.js'
import type { PhaseAuditResult, PhaseAuditStepInput } from './todo-code-writer.schema.js'
import { PhaseAuditResultSchema, PhaseAuditStepInputSchema } from './todo-code-writer.schema.js'
import { detectWorkspace } from './workspace-detector.js'

/**
 * JSON Schema for phase audit structured output.
 * Matches PhaseAuditResultSchema but in JSON Schema format for the SDK's outputFormat.
 */
const PHASE_AUDIT_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['pass', 'warn', 'fail'] },
      issues_found: { type: 'number' },
      summary: { type: 'string' },
    },
    required: ['status', 'issues_found', 'summary'],
  },
}

/**
 * Internal sub-capability for phase audit.
 * Not intended for direct external use — invoked by the todo_code_writer orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * read files and run verification checks. Input is validated via Zod schema and this
 * capability is only invoked through the orchestrator's authenticated channel.
 */
export const phaseAuditStepCapability: CapabilityDefinition<PhaseAuditStepInput, PhaseAuditResult> =
  {
    id: 'todo_code_writer_phase_audit_step',
    type: 'tool',
    visibility: 'internal',
    name: 'Todo Code Writer Phase Audit Step (Internal)',
    description:
      'Internal sub-capability: audits code modified in a single phase. Not intended for direct use.',
    inputSchema: PhaseAuditStepInputSchema,
    promptRegistry: PHASE_AUDIT_PROMPT_VERSIONS,
    currentPromptVersion: PHASE_AUDIT_CURRENT_VERSION,
    defaultRequestOptions: {
      model: 'sonnet[1m]',
      maxTurns: 50,
      maxBudgetUsd: 2.0,
      tools: { type: 'preset', preset: 'claude_code' },
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      settingSources: ['user', 'project'],
      outputSchema: PHASE_AUDIT_OUTPUT_JSON_SCHEMA,
      hooks:
        buildPathValidationHooks() as unknown as import('../../core/ai-provider/ai-provider.types.js').AIHooksConfig,
    },

    preparePromptInput: (input: PhaseAuditStepInput, _context) => {
      const detection = detectWorkspace(input.cwd)
      return {
        specPath: input.spec_path,
        phaseNumber: input.phase_number,
        filesModified: input.files_modified,
        engSummary: input.eng_summary,
        cwd: input.cwd,
        detectedTechnologies: detection.technologies,
        detectedDependencies: detection.dependencies,
      }
    },

    processResult: (_input: PhaseAuditStepInput, aiResult, _context) => {
      // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
      if (aiResult.structuredOutput) {
        const parsed = PhaseAuditResultSchema.safeParse(aiResult.structuredOutput)
        if (parsed.success) {
          return parsed.data
        }
      }

      // Strategy 2: Fall back to XML parsing from text content
      const xmlContent = parseXmlBlock(aiResult.content, 'phase_audit_result')
      const fallback = { ...PHASE_AUDIT_RESULT_FALLBACK, summary: aiResult.content.slice(0, 2000) }
      if (xmlContent) {
        return parseJsonSafe(xmlContent, PhaseAuditResultSchema, fallback)
      }

      return fallback
    },
  }
