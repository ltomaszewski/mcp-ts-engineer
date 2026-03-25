/**
 * Lint fix step sub-capability definition for audit-fix.
 * Internal capability: dedicated eng session to fix ONLY lint issues.
 *
 * Receives lint report and files with errors, applies minimal fixes.
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import { buildPathValidationHooks } from '../../shared/hooks/index.js'
import { LINT_FIX_RESULT_FALLBACK, parseJsonSafe, parseXmlBlock } from './audit-fix.helpers.js'
import type { LintFixInput, LintFixResult } from './audit-fix.schema.js'
import { LintFixInputSchema, LintFixResultSchema } from './audit-fix.schema.js'
import { LINT_FIX_CURRENT_VERSION, lintFixPrompts } from './prompts/index.js'

/**
 * Internal sub-capability for lint error fixing.
 * Not intended for direct external use — invoked by the audit_fix orchestrator.
 */
export const auditFixLintFixStepCapability: CapabilityDefinition<LintFixInput, LintFixResult> = {
  id: 'audit_fix_lint_fix_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Audit Fix Lint Fix Step (Internal)',
  description:
    'Internal sub-capability: dedicated eng session to fix ONLY lint issues. Receives lint report and files with errors, applies minimal fixes. Not intended for direct use.',
  inputSchema: LintFixInputSchema,
  promptRegistry: lintFixPrompts,
  currentPromptVersion: LINT_FIX_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet[1m]',
    maxTurns: 80,
    maxBudgetUsd: 4.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    hooks:
      buildPathValidationHooks() as unknown as import('../../core/ai-provider/ai-provider.types.js').AIHooksConfig,
  },

  preparePromptInput: (input: LintFixInput, _context) => ({
    projectPath: input.project_path,
    lintReport: input.lint_report,
    filesWithLintErrors: input.files_with_lint_errors,
    cwd: input.cwd,
  }),

  processResult: (_input: LintFixInput, aiResult, _context) => {
    // Prefer structured output if available
    if (aiResult.structuredOutput) {
      const parsed = LintFixResultSchema.safeParse(aiResult.structuredOutput)
      if (parsed.success) {
        return parsed.data
      }
    }

    // Parse <lint_fix_result> XML block from AI response
    const xmlContent = parseXmlBlock(aiResult.content, 'lint_fix_result')

    if (xmlContent) {
      return parseJsonSafe(xmlContent, LintFixResultSchema, LINT_FIX_RESULT_FALLBACK)
    }

    // Fallback: return safe defaults
    return LINT_FIX_RESULT_FALLBACK
  },
}
