/**
 * Shared helper functions and constants for the finalize capability.
 *
 * Extracted to:
 * - Keep individual files under 300 lines
 * - Deduplicate constants used across sub-capabilities
 * - Enable direct unit testing of pure helpers
 *
 * @internal Exported for unit testing and sub-capability reuse
 */

import type {
  AuditResult,
  TestResult,
  CodemapResult,
  ReadmeResult,
  FinalizeCommitResult,
  FinalizePlan,
} from "./finalize.schema.js";

// Re-export shared utilities from core
export { parseJsonSafe, parseXmlBlock } from "../../core/utils/index.js";

// ---------------------------------------------------------------------------
// Default fallback values (shared across orchestrator + sub-capabilities)
// ---------------------------------------------------------------------------

/** Default AuditResult returned when AI output cannot be parsed. */
export const AUDIT_RESULT_FALLBACK: AuditResult = {
  status: "fail",
  fixes_applied: 0,
  issues_remaining: 0,
  tsc_passed: false,
  summary: "Failed to parse audit output",
};

/** Default TestResult returned when AI output cannot be parsed. */
export const TEST_RESULT_FALLBACK: TestResult = {
  passed: false,
  workspaces_tested: [],
  summary: "Failed to parse test output",
};

/** Default CodemapResult returned when AI output cannot be parsed. */
export const CODEMAP_RESULT_FALLBACK: CodemapResult = {
  updated: false,
  codemaps_changed: [],
  summary: "Failed to parse codemap output",
};

/** Default ReadmeResult returned when AI output cannot be parsed. */
export const README_RESULT_FALLBACK: ReadmeResult = {
  updated: false,
  readmes_changed: [],
  summary: "Failed to parse readme output",
};

/** Default FinalizeCommitResult returned when AI output cannot be parsed. */
export const FINALIZE_COMMIT_RESULT_FALLBACK: FinalizeCommitResult = {
  committed: false,
  commit_sha: null,
  commit_message: null,
  files_committed: [],
};

/** Default FinalizePlan returned when AI output cannot be parsed. */
export const FINALIZE_PLAN_FALLBACK: FinalizePlan = {
  workspaces: [],
  codemap_areas: [],
};

// ---------------------------------------------------------------------------
// Workspace detection helper
// ---------------------------------------------------------------------------

/**
 * Detects unique workspace paths from a list of file paths.
 *
 * Extracts workspace directories by finding directories with package.json
 * in path segments. For example:
 * - `apps/my-server/src/foo.ts` → `apps/my-server`
 * - `packages/core/src/index.ts` → `packages/core`
 *
 * @param files - Array of file paths
 * @returns Array of unique workspace paths
 */
export function detectWorkspaces(files: string[]): string[] {
  const workspaces = new Set<string>();

  for (const file of files) {
    const segments = file.split("/");

    // Look for workspace patterns: apps/*, packages/*
    // A workspace is typically 2 levels deep: apps/my-server, packages/core
    if (segments.length >= 2) {
      const firstSegment = segments[0];
      const secondSegment = segments[1];

      // Common workspace directory names
      if (
        firstSegment === "apps" ||
        firstSegment === "packages" ||
        firstSegment === "libs"
      ) {
        if (secondSegment) {
          workspaces.add(`${firstSegment}/${secondSegment}`);
        }
      }
    }
  }

  return Array.from(workspaces);
}
