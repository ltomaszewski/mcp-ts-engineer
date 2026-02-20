/**
 * Shared helper functions and constants for the todo-code-writer capability.
 *
 * Extracted to:
 * - Keep individual files under 300 lines
 * - Deduplicate constants used across sub-capabilities
 * - Enable direct unit testing of pure helpers
 *
 * @internal Exported for unit testing and sub-capability reuse
 */

import type {
  PhasePlan,
  PhaseEngResult,
  PhaseAuditResult,
  FinalAuditResult,
  CommitResult,
} from "./todo-code-writer.schema.js";

// Re-export shared utilities from core
export { parseJsonSafe, parseXmlBlock } from "../../core/utils/index.js";

// ---------------------------------------------------------------------------
// Default fallback values (shared across orchestrator + sub-capabilities)
// ---------------------------------------------------------------------------

/** Default PhasePlan returned when AI output cannot be parsed. */
export const PHASE_PLAN_FALLBACK: PhasePlan = {
  phases: [],
};

/** Default PhaseEngResult returned when AI output cannot be parsed. */
export const PHASE_ENG_RESULT_FALLBACK: PhaseEngResult = {
  status: "failed",
  files_modified: [],
  summary: "Failed to parse engineering output",
};

/** Default PhaseAuditResult returned when AI output cannot be parsed. */
export const PHASE_AUDIT_RESULT_FALLBACK: PhaseAuditResult = {
  status: "fail",
  issues_found: 0,
  summary: "Failed to parse audit output",
};

/** Default FinalAuditResult returned when AI output cannot be parsed. */
export const FINAL_AUDIT_RESULT_FALLBACK: FinalAuditResult = {
  status: "fail",
  issues_found: 0,
  summary: "Failed to parse final audit output",
};

/** Default CommitResult returned when AI output cannot be parsed. */
export const COMMIT_RESULT_FALLBACK: CommitResult = {
  committed: false,
  commit_sha: null,
  commit_message: null,
  files_changed: [],
};

// ---------------------------------------------------------------------------
// Retry configuration
// ---------------------------------------------------------------------------

/** Delays between retry attempts (exponential backoff). */
export const RETRY_DELAYS_MS = [1000, 2000] as const;

/** Maximum retry attempts per phase step. */
export const MAX_RETRIES = RETRY_DELAYS_MS.length;

/** Mockable delay function for retry backoff. */
export const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// parseXmlBlock and parseJsonSafe are now imported from core/utils above
