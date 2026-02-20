/**
 * Barrel exports for finalize capability.
 * Exports all public types, schemas, and capability definitions.
 */

// Schemas and types
export {
  FinalizeInputSchema,
  FinalizeOutputSchema,
  AuditResultSchema,
  TestResultSchema,
  CodemapResultSchema,
  ReadmeResultSchema,
  FinalizeCommitResultSchema,
  AuditStepInputSchema,
  TestStepInputSchema,
  CodemapStepInputSchema,
  ReadmeStepInputSchema,
  CommitStepInputSchema,
} from "./finalize.schema.js";

export type {
  FinalizeInput,
  FinalizeOutput,
  AuditResult,
  TestResult,
  CodemapResult,
  ReadmeResult,
  FinalizeCommitResult,
  AuditStepInput,
  TestStepInput,
  CodemapStepInput,
  ReadmeStepInput,
  CommitStepInput,
} from "./finalize.schema.js";

// Capability definitions
export { finalizeCapability } from "./finalize.capability.js";
export { finalizeAuditStepCapability } from "./audit-step.capability.js";
export { finalizeTestStepCapability } from "./test-step.capability.js";
export { finalizeCodemapStepCapability } from "./codemap-step.capability.js";
export { finalizeReadmeStepCapability } from "./readme-step.capability.js";
export { finalizeCommitStepCapability } from "./commit-step.capability.js";
