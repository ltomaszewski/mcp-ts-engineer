/**
 * Types for spec path validation and correction.
 */

/**
 * Validation result categorizing paths by their correctability status.
 */
export interface ValidationResult {
  /** Paths that are already in correct monorepo format (apps/* or packages/*) */
  valid: string[];
  /** Paths that can be automatically corrected (src/* or ./*) */
  correctable: string[];
  /** Paths that cannot be corrected (absolute paths, ../ references) */
  uncorrectable: string[];
}

/**
 * Result of path correction operation.
 */
export interface CorrectionResult {
  /** Content with corrected paths */
  correctedContent: string;
  /** List of corrections made */
  corrections: Array<{ original: string; corrected: string }>;
  /** Paths that could not be corrected */
  uncorrectable: string[];
}

/**
 * Path status classification.
 */
export type PathStatus = "valid" | "correctable" | "uncorrectable";
