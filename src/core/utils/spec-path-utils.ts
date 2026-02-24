/**
 * Utilities for extracting and validating file paths from spec content.
 * Re-exports from spec-path-utils/ directory for backward compatibility.
 */

export {
  type CorrectionResult,
  correctSpecPaths,
  // Functions
  extractFilePaths,
  type PathStatus,
  // Types
  type ValidationResult,
  validateAndCorrectSpecPaths,
  validateSpecPaths,
} from './spec-path-utils/index.js'
