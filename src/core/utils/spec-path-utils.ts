/**
 * Utilities for extracting and validating file paths from spec content.
 * Re-exports from spec-path-utils/ directory for backward compatibility.
 */

export {
  // Types
  type ValidationResult,
  type CorrectionResult,
  type PathStatus,
  // Functions
  extractFilePaths,
  validateSpecPaths,
  correctSpecPaths,
  validateAndCorrectSpecPaths,
} from "./spec-path-utils/index.js";
