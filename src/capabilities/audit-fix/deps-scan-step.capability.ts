/**
 * Deps scan step sub-capability definition for audit-fix.
 * Internal capability: runs npm audit --json and reports vulnerability counts.
 *
 * Checks for package-lock.json, executes npm audit,
 * parses severity breakdown (critical/high/moderate/low).
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import { buildPathValidationHooks } from '../../shared/hooks/index.js'
import {
  DEPS_SCAN_STEP_RESULT_FALLBACK,
  parseJsonSafe,
  parseXmlBlock,
} from './audit-fix.helpers.js'
import type { DepsScanStepInput, DepsScanStepResult } from './audit-fix.schema.js'
import { DepsScanStepInputSchema, DepsScanStepResultSchema } from './audit-fix.schema.js'
import { DEPS_SCAN_CURRENT_VERSION, depsScanPrompts } from './prompts/index.js'

/**
 * Internal sub-capability for dependency vulnerability scanning with npm audit.
 * Not intended for direct external use — invoked by the audit_fix orchestrator.
 */
const DEPS_SCAN_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      audit_ran: { type: 'boolean' },
      vulnerabilities_found: { type: 'integer', minimum: 0 },
      vulnerabilities_by_severity: {
        type: 'object',
        properties: {
          critical: { type: 'integer', minimum: 0 },
          high: { type: 'integer', minimum: 0 },
          moderate: { type: 'integer', minimum: 0 },
          low: { type: 'integer', minimum: 0 },
        },
        required: ['critical', 'high', 'moderate', 'low'],
      },
      audit_json: { type: 'string' },
    },
    required: ['audit_ran', 'vulnerabilities_found', 'vulnerabilities_by_severity', 'audit_json'],
  },
}

export const auditFixDepsScanStepCapability: CapabilityDefinition<
  DepsScanStepInput,
  DepsScanStepResult
> = {
  id: 'audit_fix_deps_scan_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Audit Fix Deps Scan Step (Internal)',
  description:
    'Internal sub-capability: run npm audit --json in project and parse vulnerability severity breakdown. Returns audit status, vulnerability counts, and severity details. Not intended for direct use.',
  inputSchema: DepsScanStepInputSchema,
  promptRegistry: depsScanPrompts,
  currentPromptVersion: DEPS_SCAN_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 40,
    maxBudgetUsd: 2.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: DEPS_SCAN_OUTPUT_JSON_SCHEMA,
    hooks: buildPathValidationHooks(),
  },

  preparePromptInput: (input: DepsScanStepInput, _context) => ({
    projectPath: input.project_path,
    cwd: input.cwd,
  }),

  processResult: (_input: DepsScanStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = DepsScanStepResultSchema.safeParse(aiResult.structuredOutput)
      if (parsed.success) {
        return parsed.data
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, 'deps_scan_result')

    if (xmlContent) {
      return parseJsonSafe(xmlContent, DepsScanStepResultSchema, DEPS_SCAN_STEP_RESULT_FALLBACK)
    }

    // Fallback: return safe defaults
    return DEPS_SCAN_STEP_RESULT_FALLBACK
  },
}
