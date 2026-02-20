/**
 * File path extraction from spec content.
 */

import {
  PATH_PATTERNS,
  IGNORE_PATTERNS,
  VALID_EXTENSIONS,
  ABBREVIATIONS_BLACKLIST,
  CODE_PATTERN_PREFIXES,
} from "./spec-path.constants.js";

/**
 * Extracts file paths from spec content.
 *
 * Searches for paths in:
 * - Fenced code blocks (```typescript ... ```)
 * - Markdown tables
 * - Inline code (`path/to/file.ts`)
 *
 * Filters out:
 * - URLs (http://, https://)
 * - npm packages (@nestjs/core, react-native)
 * - node_modules paths
 *
 * @param content - Spec markdown content
 * @returns Unique list of extracted file paths
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
 *   // apps/my-app/src/Button.tsx
 *   export const Button = () => <View />
 *   \`\`\`
 * `;
 * const paths = extractFilePaths(content);
 * // Returns: ['apps/my-app/src/Button.tsx']
 * ```
 */
export function extractFilePaths(content: string): string[] {
  const paths = new Set<string>();

  // Extract from fenced code blocks
  const codeBlocks = content.match(PATH_PATTERNS.FENCED_CODE_BLOCK);
  if (codeBlocks) {
    for (const block of codeBlocks) {
      const comments = block.matchAll(PATH_PATTERNS.CODE_COMMENT);
      for (const match of comments) {
        const comment = match[1].trim();
        const filePaths = comment.match(PATH_PATTERNS.FILE_PATH);
        if (filePaths) {
          for (const path of filePaths) {
            if (isValidPath(path)) {
              paths.add(path);
            }
          }
        }
      }
    }
  }

  // Extract from inline code (strip fenced code blocks first to avoid false matches)
  // The INLINE_CODE regex /`([^`]+)`/g would incorrectly match content inside
  // fenced code blocks because ``` contains individual backticks
  const contentWithoutCodeBlocks = content.replace(
    PATH_PATTERNS.FENCED_CODE_BLOCK,
    "",
  );
  const inlineMatches = contentWithoutCodeBlocks.matchAll(
    PATH_PATTERNS.INLINE_CODE,
  );
  for (const match of inlineMatches) {
    const inlineContent = match[1];
    const filePaths = inlineContent.match(PATH_PATTERNS.FILE_PATH);
    if (filePaths) {
      for (const path of filePaths) {
        if (isValidPath(path)) {
          paths.add(path);
        }
      }
    }
  }

  // Extract from markdown tables
  const lines = content.split("\n");
  for (const line of lines) {
    // Check if line is a table row
    if (line.trim().startsWith("|") && line.trim().endsWith("|")) {
      // Skip header separator rows
      if (line.includes("---")) continue;

      const cells = line.split("|").map((cell) => cell.trim());
      for (const cell of cells) {
        // Check if cell looks like a path (contains / and has extension)
        if (cell.includes("/") && /\.[a-zA-Z]{1,4}(x)?$/.test(cell)) {
          const cleanPath = cell.trim();
          if (isValidPath(cleanPath)) {
            paths.add(cleanPath);
          }
        }
      }
    }
  }

  return Array.from(paths);
}

/**
 * Validates if a path should be extracted (filters out URLs, npm packages, etc).
 *
 * @param path - Potential file path
 * @returns True if path should be included
 */
export function isValidPath(path: string): boolean {
  // Ignore URLs
  if (IGNORE_PATTERNS.URL.test(path)) {
    return false;
  }

  // Ignore node_modules
  if (IGNORE_PATTERNS.NODE_MODULES.test(path)) {
    return false;
  }

  // Ignore npm packages
  if (IGNORE_PATTERNS.NPM_SCOPED.test(path)) {
    return false;
  }

  // Ignore simple package names without path separators
  if (IGNORE_PATTERNS.NPM_SIMPLE.test(path) && !path.includes("/")) {
    return false;
  }

  // Check if likely a file path (not code pattern)
  if (!isLikelyFilePath(path)) {
    return false;
  }

  return true;
}

/**
 * Determines if a string is likely a file path vs code pattern.
 *
 * Rejects:
 * - Paths starting with code prefixes (this.)
 * - Common abbreviations (e.g., i.e., etc., vs.)
 * - Paths with invalid extensions (.push, .name, .define)
 * - Bare filenames without path separators
 *
 * @param path - Potential file path
 * @returns True if likely a file path
 */
export function isLikelyFilePath(path: string): boolean {
  // Reject if starts with code pattern prefix
  for (const prefix of CODE_PATTERN_PREFIXES) {
    if (path.startsWith(prefix)) {
      return false;
    }
  }

  // Reject common abbreviations
  const lowerPath = path.toLowerCase();
  for (const abbr of ABBREVIATIONS_BLACKLIST) {
    if (lowerPath === abbr || lowerPath === abbr + ".") {
      return false;
    }
  }

  // Extract extension
  const lastDot = path.lastIndexOf(".");
  if (lastDot === -1) {
    return false;
  }
  const ext = path.slice(lastDot + 1).toLowerCase();

  // Reject if extension not in whitelist
  if (!VALID_EXTENSIONS.includes(ext)) {
    return false;
  }

  // Bare filenames (no slash) that don't start with known prefixes are suspicious
  if (!path.includes("/")) {
    const knownPrefixes = ["apps/", "packages/", "src/", "./"];
    const hasKnownPrefix = knownPrefixes.some((p) => path.startsWith(p));
    if (!hasKnownPrefix) {
      // Likely a bare filename reference - don't extract
      return false;
    }
  }

  return true;
}
