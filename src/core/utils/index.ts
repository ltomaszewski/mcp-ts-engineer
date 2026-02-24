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
export { generateIssueId } from "./issue-id.js";
export {
  serializeState,
  parseState,
  REVIEWER_STATE_MARKER,
  FIXER_STATE_MARKER,
  type IssueStatus,
  type PrCommentState,
} from "./pr-comment-state.js";
