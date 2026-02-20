/**
 * Todo reviewer capability exports.
 */

// Types
export type {
  TodoReviewerInput,
  TodoReviewerOutput,
  ReviewSummary,
  TddSummary,
  CommitResult,
  TddValidateStepInput,
  CommitStepInput,
  TddScanStepInput,
  TddScanStepResult,
  TddFixStepInput,
  TddFixStepResult,
} from "./todo-reviewer.schema.js";

// Schemas
export {
  TodoReviewerInputSchema,
  TodoReviewerOutputSchema,
  ReviewSummarySchema,
  TddSummarySchema,
  CommitResultSchema,
  TddValidateStepInputSchema,
  CommitStepInputSchema,
  TddScanStepInputSchema,
  TddScanStepResultSchema,
  TddFixStepInputSchema,
  TddFixStepResultSchema,
} from "./todo-reviewer.schema.js";

// Prompt registries
export {
  REVIEW_PROMPT_VERSIONS,
  REVIEW_CURRENT_VERSION,
  TDD_VALIDATE_PROMPT_VERSIONS,
  TDD_VALIDATE_CURRENT_VERSION,
  TDD_SCAN_PROMPT_VERSIONS,
  TDD_SCAN_CURRENT_VERSION,
  TDD_FIX_PROMPT_VERSIONS,
  TDD_FIX_CURRENT_VERSION,
  COMMIT_PROMPT_VERSIONS,
  COMMIT_CURRENT_VERSION,
} from "./prompts/index.js";

// Capabilities
export { todoReviewerCapability } from "./todo-reviewer.capability.js";
export { tddValidateStepCapability } from "./tdd-validate-step.capability.js";
export { tddScanStepCapability } from "./tdd-scan-step.capability.js";
export { tddFixStepCapability } from "./tdd-fix-step.capability.js";
export { commitStepCapability } from "./commit-step.capability.js";

// Helpers and fallback constants (exported for unit testing and sub-capability reuse)
export {
  parseXmlBlock,
  parseJsonSafe,
  REVIEW_SUMMARY_FALLBACK,
  TDD_SUMMARY_FALLBACK,
  COMMIT_RESULT_FALLBACK,
  TDD_SCAN_STEP_RESULT_FALLBACK,
  TDD_FIX_STEP_RESULT_FALLBACK,
} from "./todo-reviewer.helpers.js";
