/**
 * Spec path utilities - extraction, validation, and correction.
 */

// Types
export type {
  ValidationResult,
  CorrectionResult,
  PathStatus,
} from "./spec-path.types.js";

// Path fix schemas and types
export {
  PathFixStepInputSchema,
  PathFixStepOutputSchema,
} from "./spec-path.schema.js";
export type {
  PathFixStepInput,
  PathFixStepOutput,
} from "./spec-path.schema.js";

// Extraction
export { extractFilePaths, isValidPath, isLikelyFilePath } from "./spec-path-extraction.js";

// Validation
export { validateSpecPaths, classifyPath } from "./spec-path-validation.js";

// Correction
export { correctSpecPaths, correctPath, escapeRegExp } from "./spec-path-correction.js";

// Orchestration
export { validateAndCorrectSpecPaths } from "./spec-path-orchestration.js";

// Constants (exported for testing)
export {
  PATH_PATTERNS,
  IGNORE_PATTERNS,
  VALID_EXTENSIONS,
  ABBREVIATIONS_BLACKLIST,
  CODE_PATTERN_PREFIXES,
  PATH_CLASSIFICATION,
} from "./spec-path.constants.js";
