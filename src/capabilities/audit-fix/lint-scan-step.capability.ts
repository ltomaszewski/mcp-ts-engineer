/**
 * Lint scan step sub-capability definition for audit-fix.
 * Internal capability: detects and runs npm run lint, reports results.
 *
 * Checks package.json for lint script, executes it if available,
 * parses output to extract error/warning counts and file paths.
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import { buildPathValidationHooks } from '../../shared/hooks/index.js'
import { LINT_SCAN_RESULT_FALLBACK, parseJsonSafe, parseXmlBlock } from './audit-fix.helpers.js'
import type { LintScanInput, LintScanResult } from './audit-fix.schema.js'
import { LintScanInputSchema, LintScanResultSchema } from './audit-fix.schema.js'
import { LINT_SCAN_CURRENT_VERSION, lintScanPrompts } from './prompts/index.js'

/**
 * Internal sub-capability for project lint script detection and execution.
 * Not intended for direct external use — invoked by the audit_fix orchestrator.
 */
const LINT_SCAN_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      lint_available: { type: 'boolean' },
      lint_passed: { type: 'boolean' },
      error_count: { type: 'integer', minimum: 0 },
      warning_count: { type: 'integer', minimum: 0 },
      lint_report: { type: 'string' },
      files_with_lint_errors: { type: 'array', items: { type: 'string' } },
    },
    required: ['lint_available', 'lint_passed', 'error_count', 'warning_count', 'lint_report', 'files_with_lint_errors'],
  },
}

export const auditFixLintScanStepCapability: CapabilityDefinition<LintScanInput, LintScanResult> = {
  id: 'audit_fix_lint_scan_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Audit Fix Lint Scan Step (Internal)',
  description:
    'Internal sub-capability: detect and run npm run lint in project. Returns lint status, error/warning counts, and files with errors. Not intended for direct use.',
  inputSchema: LintScanInputSchema,
  promptRegistry: lintScanPrompts,
  currentPromptVersion: LINT_SCAN_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 40,
    maxBudgetUsd: 2.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: LINT_SCAN_OUTPUT_JSON_SCHEMA,
    hooks:
      buildPathValidationHooks() as unknown as import('../../core/ai-provider/ai-provider.types.js').AIHooksConfig,
  },

  preparePromptInput: (input: LintScanInput, _context) => ({
    projectPath: input.project_path,
    cwd: input.cwd,
  }),

  processResult: (_input: LintScanInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = LintScanResultSchema.safeParse(aiResult.structuredOutput)
      if (parsed.success) {
        return parsed.data
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, 'lint_scan_result')

    if (xmlContent) {
      return parseJsonSafe(xmlContent, LintScanResultSchema, LINT_SCAN_RESULT_FALLBACK)
    }

    // Fallback: return safe defaults
    return LINT_SCAN_RESULT_FALLBACK
  },
}
