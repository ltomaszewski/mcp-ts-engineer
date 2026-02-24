/**
 * Spec path utilities - extraction, validation, and correction.
 */

// Constants (exported for testing)
export {
  ABBREVIATIONS_BLACKLIST,
  CODE_PATTERN_PREFIXES,
  IGNORE_PATTERNS,
  PATH_CLASSIFICATION,
  PATH_PATTERNS,
  VALID_EXTENSIONS,
} from './spec-path.constants.js'
export type {
  PathFixStepInput,
  PathFixStepOutput,
} from './spec-path.schema.js'
// Path fix schemas and types
export {
  PathFixStepInputSchema,
  PathFixStepOutputSchema,
} from './spec-path.schema.js'
// Types
export type {
  CorrectionResult,
  PathStatus,
  ValidationResult,
} from './spec-path.types.js'
// Correction
export { correctPath, correctSpecPaths, escapeRegExp } from './spec-path-correction.js'
// Extraction
export { extractFilePaths, isLikelyFilePath, isValidPath } from './spec-path-extraction.js'

// Orchestration
export { validateAndCorrectSpecPaths } from './spec-path-orchestration.js'
// Validation
export { classifyPath, validateSpecPaths } from './spec-path-validation.js'
