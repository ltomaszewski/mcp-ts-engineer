/**
 * Audit step prompt v2 for finalize capability.
 * Re-exports shared audit workflow from src/shared/prompts/audit-workflow.ts
 *
 * This file exists for backward compatibility. Original implementation
 * moved to shared location for reuse across capabilities.
 */

import type { PromptVersion } from '../../../core/prompt/prompt.types.js'
import {
  AUDIT_WORKFLOW,
  type AuditWorkflowParams,
  buildAuditUserPrompt,
} from '../../../shared/prompts/audit-workflow.js'

// Re-export for backward compatibility
export { AUDIT_WORKFLOW, buildAuditUserPrompt }

interface AuditPromptInput {
  filesChanged: string[]
  cwd?: string
}

export const auditPromptV2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-01-31',
  description:
    'Audit step v2: embeds full /audit workflow for 100% parity with .claude/commands/audit.md',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { filesChanged, cwd } = input as AuditPromptInput

    // Convert to shared params format
    const params: AuditWorkflowParams = {
      filesChanged,
      cwd,
    }

    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
        append:
          'REMINDER: After completing all audit phases, you MUST output <audit_result>{...}</audit_result> with your findings.',
      },
      userPrompt: buildAuditUserPrompt(params),
    }
  },
}
