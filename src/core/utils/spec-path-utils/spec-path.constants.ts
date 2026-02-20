/**
 * Constants for spec path extraction and validation.
 */

export const PATH_PATTERNS = {
  /** Matches paths in fenced code blocks (```...```) */
  FENCED_CODE_BLOCK:
    /```(?:typescript|javascript|ts|js|tsx|jsx)?\s*\n(?:.*\n)*?```/gi,
  /** Matches // comments in code blocks */
  CODE_COMMENT: /\/\/\s*([^\n]+)/g,
  /** Matches inline code (`...`) */
  INLINE_CODE: /`([^`]+)`/g,
  /** Matches markdown table rows */
  TABLE_ROW: /^\|([^|]+\|)+$/gm,
  /** Matches file paths with extensions */
  FILE_PATH: /([a-zA-Z0-9@._/-]+\.[a-zA-Z]{1,4}(?:x)?)/g,
};

export const IGNORE_PATTERNS = {
  /** URL protocols to ignore */
  URL: /^https?:\/\//,
  /** npm packages with @ prefix */
  NPM_SCOPED: /^@[a-z0-9-]+\/[a-z0-9-]+$/i,
  /** Simple npm package names (no path separators) */
  NPM_SIMPLE: /^[a-z0-9-]+$/i,
  /** node_modules paths */
  NODE_MODULES: /node_modules/,
};

/** Valid file extensions for path extraction */
export const VALID_EXTENSIONS = [
  "ts",
  "tsx",
  "js",
  "jsx",
  "json",
  "md",
  "yaml",
  "yml",
  "css",
  "html",
  "sh",
  "py",
];

/** Common abbreviations that should not be extracted as paths */
export const ABBREVIATIONS_BLACKLIST = ["e.g", "i.e", "etc", "vs"];

/** Code pattern prefixes that indicate non-path content */
export const CODE_PATTERN_PREFIXES = ["this."];

export const PATH_CLASSIFICATION = {
  /** Valid monorepo paths (including docs/ and .claude/) */
  VALID: /^(apps|packages|docs|\.claude)\//,
  /** Correctable relative paths from project root */
  CORRECTABLE_SRC: /^src\//,
  /** Correctable relative paths from current directory */
  CORRECTABLE_DOT: /^\.\//,
  /** Correctable internal project directories */
  INTERNAL_DIRS: /^(core|lib|utils|modules|providers|capabilities|config|shared|hooks|prompts)\//,
  /** Uncorrectable absolute paths */
  ABSOLUTE: /^\//,
  /** Uncorrectable parent directory references */
  PARENT_DIR: /^\.\.\//,
};
