/**
 * Audit step sub-capability definition.
 * Internal capability: performs code quality scan and auto-fix on specified files.
 *
 * Scans files for code quality issues (race conditions, TypeScript errors, code style),
 * applies auto-fixes, and runs tsc --noEmit to verify TypeScript compilation.
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import { AUDIT_RESULT_FALLBACK, parseJsonSafe, parseXmlBlock } from './finalize.helpers.js'
import type { AuditResult, AuditStepInput } from './finalize.schema.js'
import { AuditResultSchema, AuditStepInputSchema } from './finalize.schema.js'
import { AUDIT_CURRENT_VERSION, auditPrompts } from './prompts/index.js'

/**
 * Internal sub-capability for code quality audit with auto-fix.
 * Not intended for direct external use — invoked by the finalize orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * scan files, apply fixes, and run TypeScript validation. Input is validated via Zod
 * schema and this capability is only invoked through the orchestrator's authenticated channel.
 */
const AUDIT_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['pass', 'warn', 'fail'] },
      fixes_applied: { type: 'integer', minimum: 0 },
      issues_remaining: { type: 'integer', minimum: 0 },
      tsc_passed: { type: 'boolean' },
      summary: { type: 'string' },
    },
    required: ['status', 'fixes_applied', 'issues_remaining', 'tsc_passed', 'summary'],
  },
}

export const finalizeAuditStepCapability: CapabilityDefinition<AuditStepInput, AuditResult> = {
  id: 'finalize_audit_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Finalize Audit Step (Internal)',
  description:
    'Internal sub-capability: code quality audit with auto-fix. Scans files for violations, applies fixes, and verifies with tsc. Not intended for direct use.',
  inputSchema: AuditStepInputSchema,
  promptRegistry: auditPrompts,
  currentPromptVersion: AUDIT_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 120,
    maxBudgetUsd: 6.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: AUDIT_OUTPUT_JSON_SCHEMA,
  },

  preparePromptInput: (input: AuditStepInput, _context) => ({
    filesChanged: input.files_changed,
    cwd: input.cwd,
  }),

  processResult: (_input: AuditStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = AuditResultSchema.safeParse(aiResult.structuredOutput)
      if (parsed.success) {
        return parsed.data
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, 'audit_result')
    const fallback = {
      ...AUDIT_RESULT_FALLBACK,
      summary: aiResult.content.slice(0, 2000),
    }

    if (xmlContent) {
      return parseJsonSafe(xmlContent, AuditResultSchema, fallback)
    }

    return fallback
  },
}
