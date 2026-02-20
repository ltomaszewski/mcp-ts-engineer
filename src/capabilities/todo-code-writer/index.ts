/**
 * Todo code writer capability barrel exports.
 * Exports all public types, schemas, and capability definitions.
 */

// Schemas and types
export {
  TodoCodeWriterInputSchema,
  TodoCodeWriterOutputSchema,
  PhasePlanSchema,
  PhaseSchema,
  PhaseFileSchema,
  PhaseEngResultSchema,
  PhaseAuditResultSchema,
  FinalAuditResultSchema,
  CommitResultSchema,
  PhaseEngStepInputSchema,
  PhaseAuditStepInputSchema,
  FinalAuditStepInputSchema,
  CommitStepInputSchema,
} from "./todo-code-writer.schema.js";

export type {
  TodoCodeWriterInput,
  TodoCodeWriterOutput,
  PhasePlan,
  Phase,
  PhaseFile,
  PhaseEngResult,
  PhaseAuditResult,
  FinalAuditResult,
  CommitResult,
  PhaseEngStepInput,
  PhaseAuditStepInput,
  FinalAuditStepInput,
  CommitStepInput,
} from "./todo-code-writer.schema.js";

// Capability definitions
export { todoCodeWriterCapability } from "./todo-code-writer.capability.js";
export { phaseEngStepCapability } from "./phase-eng-step.capability.js";
export { phaseAuditStepCapability } from "./phase-audit-step.capability.js";
export { finalAuditStepCapability } from "./final-audit-step.capability.js";
export { commitStepCapability } from "./commit-step.capability.js";

// Helpers (exported for testing)
export {
  parseXmlBlock,
  parseJsonSafe,
  PHASE_PLAN_FALLBACK,
  PHASE_ENG_RESULT_FALLBACK,
  PHASE_AUDIT_RESULT_FALLBACK,
  FINAL_AUDIT_RESULT_FALLBACK,
  COMMIT_RESULT_FALLBACK,
} from "./todo-code-writer.helpers.js";
