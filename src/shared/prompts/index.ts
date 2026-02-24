/**
 * Barrel exports for shared prompts.
 */

export {
  type AuditPromptInput,
  type BuiltPrompt as AuditBuiltPrompt,
  buildAuditPromptV2,
} from './audit-prompt.v2.js'
export { AUDIT_WORKFLOW, type AuditWorkflowParams, buildAuditUserPrompt } from './audit-workflow.js'
export { buildDevContext, DEV_CONTEXT_APPEND_PROMPT } from './dev-context.js'
export {
  type BuiltPrompt as EngBuiltPrompt,
  buildEngPromptV2,
  type EngPromptInput,
} from './eng-prompt.v2.js'
export * from './eng-rules/index.js'
export { buildReviewContext, REVIEW_CONTEXT_APPEND_PROMPT } from './review-context.js'
