/**
 * Core utility functions.
 */

export {
  extractCauseChain,
  extractErrorChain,
  extractErrorInfo,
} from './error-utils.js'
export { findCommentByMarker, postOrUpdateComment } from './github-comment.js'
export {
  fileNeedsCommit,
  hasUncommittedChanges,
  isFileTracked,
  resolveGitRoot,
  resolveWorktreeGitFile,
} from './git-utils.js'
export { generateIssueId } from './issue-id.js'
export { parseJsonSafe } from './parse-json-safe.js'
export { parseXmlBlock } from './parse-xml-block.js'
export {
  FIXER_STATE_MARKER,
  type IssueStatus,
  type PrCommentState,
  parseState,
  REVIEWER_STATE_MARKER,
  serializeState,
} from './pr-comment-state.js'
export {
  type CorrectionResult,
  correctSpecPaths,
  extractFilePaths,
  type PathStatus,
  type ValidationResult,
  validateAndCorrectSpecPaths,
  validateSpecPaths,
} from './spec-path-utils.js'
export {
  isValidGitRef,
  isValidGitSha,
  isValidPath,
  shellQuote,
} from './shell-safe.js'
export { updateSpecStatus } from './spec-status.js'
