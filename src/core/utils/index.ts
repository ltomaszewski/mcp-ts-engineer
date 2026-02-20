/**
 * Core utility functions.
 */

export { parseJsonSafe } from "./parse-json-safe.js";
export { parseXmlBlock } from "./parse-xml-block.js";
export { updateSpecStatus } from "./spec-status.js";
export {
  extractErrorChain,
  extractErrorInfo,
  extractCauseChain,
} from "./error-utils.js";
export {
  hasUncommittedChanges,
  isFileTracked,
  fileNeedsCommit,
} from "./git-utils.js";
export {
  extractFilePaths,
  validateSpecPaths,
  correctSpecPaths,
  validateAndCorrectSpecPaths,
  type ValidationResult,
  type CorrectionResult,
  type PathStatus,
} from "./spec-path-utils.js";
