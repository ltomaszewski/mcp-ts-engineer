/**
 * Spec path validation and classification.
 */

import { PATH_CLASSIFICATION } from "./spec-path.constants.js";
import type { ValidationResult, PathStatus } from "./spec-path.types.js";

/**
 * Validates spec paths and categorizes them by correctability.
 *
 * Categorizes paths into:
 * - **valid**: Already in correct monorepo format (apps/*, packages/*)
 * - **correctable**: Can be auto-corrected (src/*, ./*)
 * - **uncorrectable**: Cannot be corrected (absolute paths, ../ references)
 *
 * @param paths - List of file paths to validate
 * @param target - Target app/package name (e.g., 'my-app', 'my-server')
 * @returns Validation result with categorized paths
 *
 * @public
 * @remarks
 * This function is part of Phase 1 path utilities and will be consumed
 * by Phase 2 capability integration. It is intentionally unused in production
 * until integrated into the capability registry.
 *
 * @example
 * ```ts
 * const paths = ['apps/my-app/src/Button.tsx', 'src/hooks/useAuth.ts', '/Users/dev/file.ts'];
 * const result = validateSpecPaths(paths, 'my-app');
 * // Returns:
 * // {
 * //   valid: ['apps/my-app/src/Button.tsx'],
 * //   correctable: ['src/hooks/useAuth.ts'],
 * //   uncorrectable: ['/Users/dev/file.ts']
 * // }
 * ```
 */
export function validateSpecPaths(
  paths: string[],
  _target: string
): ValidationResult {
  const result: ValidationResult = {
    valid: [],
    correctable: [],
    uncorrectable: [],
  };

  for (const path of paths) {
    const status = classifyPath(path);
    result[status].push(path);
  }

  return result;
}

/**
 * Classifies a path by its correctability status.
 *
 * @param path - File path to classify
 * @returns Path status classification
 */
export function classifyPath(path: string): PathStatus {
  // Valid monorepo paths
  if (PATH_CLASSIFICATION.VALID.test(path)) {
    return "valid";
  }

  // Correctable relative paths
  if (
    PATH_CLASSIFICATION.CORRECTABLE_SRC.test(path) ||
    PATH_CLASSIFICATION.CORRECTABLE_DOT.test(path)
  ) {
    return "correctable";
  }

  // Correctable internal directories
  if (PATH_CLASSIFICATION.INTERNAL_DIRS?.test(path)) {
    return "correctable";
  }

  // Uncorrectable paths
  if (
    PATH_CLASSIFICATION.ABSOLUTE.test(path) ||
    PATH_CLASSIFICATION.PARENT_DIR.test(path)
  ) {
    return "uncorrectable";
  }

  // Default to uncorrectable for unknown patterns
  return "uncorrectable";
}
