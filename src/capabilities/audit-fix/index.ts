/**
 * Barrel exports for the audit-fix capability module.
 */

// Public orchestrator
export { auditFixCapability } from './audit-fix.capability.js'
// Helpers
export {
  AUDIT_STEP_RESULT_FALLBACK,
  COMMIT_RESULT_FALLBACK,
  discoverProjects,
  ENG_FIX_RESULT_FALLBACK,
  TEST_RESULT_FALLBACK,
} from './audit-fix.helpers.js'
// Types
export type {
  AuditFixInput,
  AuditFixOutput,
  AuditPlan,
  AuditStepInput,
  AuditStepResult,
  CommitResult,
  CommitStepInput,
  EngFixResult,
  EngStepInput,
  ProjectResult,
  TestResult,
  TestStepInput,
} from './audit-fix.schema.js'
// Schemas (for external use / testing)
export {
  AuditFixInputSchema,
  AuditFixOutputSchema,
  AuditPlanSchema,
  AuditStepInputSchema,
  AuditStepResultSchema,
  CommitResultSchema,
  CommitStepInputSchema,
  EngFixResultSchema,
  EngStepInputSchema,
  ProjectResultSchema,
  TestResultSchema,
  TestStepInputSchema,
} from './audit-fix.schema.js'
// Internal sub-capabilities
export { auditFixAuditStepCapability } from './audit-step.capability.js'
export { auditFixCommitStepCapability } from './commit-step.capability.js'
export { auditFixDepsFixStepCapability } from './deps-fix-step.capability.js'
export { auditFixDepsScanStepCapability } from './deps-scan-step.capability.js'
export { auditFixEngStepCapability } from './eng-step.capability.js'
export { auditFixLintFixStepCapability } from './lint-fix-step.capability.js'
export { auditFixLintScanStepCapability } from './lint-scan-step.capability.js'
export { auditFixTestStepCapability } from './test-step.capability.js'
