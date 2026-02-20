/**
 * Spec path correction to monorepo format.
 */

import { PATH_CLASSIFICATION } from "./spec-path.constants.js";
import type { CorrectionResult } from "./spec-path.types.js";
import { extractFilePaths } from "./spec-path-extraction.js";
import { validateSpecPaths } from "./spec-path-validation.js";

/**
 * Corrects spec paths to valid monorepo format.
 *
 * Transformations:
 * - `src/foo.ts` → `apps/{target}/src/foo.ts`
 * - `./foo.ts` → `apps/{target}/foo.ts`
 * - `apps/...` → unchanged (already valid)
 * - `packages/...` → unchanged (already valid)
 * - Absolute paths → unchanged, added to uncorrectable list
 *
 * @param content - Spec content with paths to correct
 * @param target - Target app/package name (e.g., 'my-app')
 * @returns Correction result with updated content and metadata
 *
 * @public
 * @remarks
 * This function is part of Phase 1 path utilities and will be consumed
 * by Phase 2 capability integration. It is intentionally unused in production
 * until integrated into the capability registry.
 *
 * @example
 * ```ts
 * const content = `
 *   \`\`\`typescript
 *   // src/components/Button.tsx
 *   export const Button = () => <View />
 *   \`\`\`
 * `;
 * const result = correctSpecPaths(content, 'my-app');
 * // Returns:
 * // {
 * //   correctedContent: "// apps/my-app/src/components/Button.tsx\n...",
 * //   corrections: [{ original: 'src/components/Button.tsx', corrected: 'apps/my-app/src/components/Button.tsx' }],
 * //   uncorrectable: []
 * // }
 * ```
 */
export function correctSpecPaths(
  content: string,
  target: string
): CorrectionResult {
  const extractedPaths = extractFilePaths(content);
  const validation = validateSpecPaths(extractedPaths, target);

  let correctedContent = content;
  const corrections: Array<{ original: string; corrected: string }> = [];

  // Correct each correctable path
  for (const path of validation.correctable) {
    const corrected = correctPath(path, target);
    if (corrected !== path) {
      // Replace all occurrences of the original path
      correctedContent = correctedContent.replace(
        new RegExp(escapeRegExp(path), "g"),
        corrected
      );
      corrections.push({ original: path, corrected });
    }
  }

  return {
    correctedContent,
    corrections,
    uncorrectable: validation.uncorrectable,
  };
}

/**
 * Corrects a single path to monorepo format.
 *
 * @param path - Path to correct
 * @param target - Target app/package name
 * @returns Corrected path
 */
export function correctPath(path: string, target: string): string {
  // src/foo.ts → apps/{target}/src/foo.ts
  if (PATH_CLASSIFICATION.CORRECTABLE_SRC.test(path)) {
    return `apps/${target}/${path}`;
  }

  // ./foo.ts → apps/{target}/foo.ts
  if (PATH_CLASSIFICATION.CORRECTABLE_DOT.test(path)) {
    return `apps/${target}/${path.slice(2)}`;
  }

  // Prefix internal dirs: core/... → apps/{target}/src/core/...
  if (PATH_CLASSIFICATION.INTERNAL_DIRS?.test(path)) {
    return `apps/${target}/src/${path}`;
  }

  return path;
}

/**
 * Escapes special regex characters in a string.
 *
 * @param str - String to escape
 * @returns Escaped string safe for use in RegExp
 */
export function escapeRegExp(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}
