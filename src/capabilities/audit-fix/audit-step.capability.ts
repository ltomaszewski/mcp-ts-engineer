/**
 * Audit step sub-capability definition for audit-fix.
 * Internal capability: runs shared audit prompt in project-scoped mode,
 * parses <audit_result> XML or structured output.
 *
 * Uses the shared audit workflow from src/shared/prompts/audit-workflow.ts
 * in project-scoped mode (entire project scan, not file-scoped).
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { buildPathValidationHooks } from '../../shared/hooks/index.js'
import { buildAuditUserPrompt } from '../../shared/prompts/audit-workflow.js'
import { buildReviewContext } from '../../shared/prompts/review-context.js'
import { AUDIT_STEP_RESULT_FALLBACK, parseJsonSafe, parseXmlBlock } from './audit-fix.helpers.js'
import type { AuditStepInput, AuditStepResult } from './audit-fix.schema.js'
import { AuditStepInputSchema, AuditStepResultSchema } from './audit-fix.schema.js'

// ---------------------------------------------------------------------------
// Prompt version for project-scoped audit
// ---------------------------------------------------------------------------

interface AuditStepPromptInput {
  projectPath: string
  cwd?: string
}

const auditStepPromptV1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-01',
  description:
    'Audit step: project-scoped audit using shared audit workflow with files_with_issues extension',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { projectPath, cwd } = input as AuditStepPromptInput

    const userPrompt = buildAuditUserPrompt({
      projectPath,
      cwd,
    })

    // Extend with files_with_issues output requirement
    const extendedPrompt = `${userPrompt}

## Additional Output Fields

In addition to the standard audit_result fields, also include:
- "files_with_issues": An array of file paths that still have remaining issues after auto-fix.

Updated output format:

<audit_result>
{
  "status": "pass" | "warn" | "fail",
  "fixes_applied": <number>,
  "issues_remaining": <number>,
  "tsc_passed": <boolean>,
  "summary": "<brief description>",
  "files_with_issues": ["src/file1.ts", "src/file2.ts"]
}
</audit_result>`

    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
        append:
          'REMINDER: After completing all audit phases, you MUST output <audit_result>{...}</audit_result> with your findings including files_with_issues.\n\n' +
          buildReviewContext(),
      },
      userPrompt: extendedPrompt,
    }
  },
}

const auditStepPrompts: PromptRegistry = {
  v1: auditStepPromptV1,
}

// ---------------------------------------------------------------------------
// Capability Definition
// ---------------------------------------------------------------------------

/**
 * Internal sub-capability for project-scoped code quality audit.
 * Not intended for direct external use — invoked by the audit_fix orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * scan files, apply fixes, and run TypeScript validation. Input is validated via Zod
 * schema and this capability is only invoked through the orchestrator's authenticated channel.
 */
const AUDIT_STEP_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['pass', 'warn', 'fail'] },
      fixes_applied: { type: 'integer', minimum: 0 },
      issues_remaining: { type: 'integer', minimum: 0 },
      tsc_passed: { type: 'boolean' },
      summary: { type: 'string' },
      files_with_issues: { type: 'array', items: { type: 'string' } },
    },
    required: ['status', 'fixes_applied', 'issues_remaining', 'tsc_passed', 'summary', 'files_with_issues'],
  },
}

export const auditFixAuditStepCapability: CapabilityDefinition<AuditStepInput, AuditStepResult> = {
  id: 'audit_fix_audit_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Audit Fix Audit Step (Internal)',
  description:
    'Internal sub-capability: project-scoped code quality audit with auto-fix. Scans all TypeScript files in a project for violations, applies fixes, and verifies with tsc. Not intended for direct use.',
  inputSchema: AuditStepInputSchema,
  promptRegistry: auditStepPrompts,
  currentPromptVersion: 'v1',
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 120,
    maxBudgetUsd: 6.0,
    maxThinkingTokens: 8000,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: AUDIT_STEP_OUTPUT_JSON_SCHEMA,
    hooks:
      buildPathValidationHooks() as unknown as import('../../core/ai-provider/ai-provider.types.js').AIHooksConfig,
  },

  preparePromptInput: (input: AuditStepInput, _context) => ({
    projectPath: input.project_path,
    cwd: input.cwd,
  }),

  processResult: (_input: AuditStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = AuditStepResultSchema.safeParse(aiResult.structuredOutput)
      if (parsed.success) {
        return parsed.data
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, 'audit_result')
    const fallback: AuditStepResult = {
      ...AUDIT_STEP_RESULT_FALLBACK,
      summary: aiResult.content.slice(0, 2000),
    }

    if (xmlContent) {
      return parseJsonSafe(xmlContent, AuditStepResultSchema, fallback)
    }

    return fallback
  },
}
