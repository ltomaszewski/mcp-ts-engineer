/**
 * Shared helper functions and constants for the todo-reviewer capability.
 *
 * Extracted from todo-reviewer.capability.ts to:
 * - Keep individual files under 300 lines
 * - Deduplicate constants used across sub-capabilities
 * - Enable direct unit testing of pure helpers
 *
 * @internal Exported for unit testing and sub-capability reuse
 */

import type {
  ReviewSummary,
  TddSummary,
  CommitResult,
  TddScanStepResult,
  TddFixStepResult,
} from "./todo-reviewer.schema.js";

// Re-export shared utilities from core
export { parseJsonSafe, parseXmlBlock } from "../../core/utils/index.js";

// ---------------------------------------------------------------------------
// Default fallback values (shared across orchestrator + sub-capabilities)
// ---------------------------------------------------------------------------

/** Default ReviewSummary returned when AI output cannot be parsed. */
export const REVIEW_SUMMARY_FALLBACK: ReviewSummary = {
  status: "BLOCKED",
  spec_path: "",
  target_app: "",
  corrections_applied: 0,
  blockers_remaining: 0,
  warnings: 0,
  cross_app_status: "N/A",
  consistency_score: "0/0",
  key_findings: ["Failed to parse review output"],
  spec_modified: false,
};

/** Default TddSummary returned when AI output cannot be parsed. */
export const TDD_SUMMARY_FALLBACK: TddSummary = {
  status: "FAIL",
  details: "Failed to parse TDD validation output",
  issues_found: 0,
  spec_modified: false,
};

/** Default CommitResult returned when AI output cannot be parsed. */
export const COMMIT_RESULT_FALLBACK: CommitResult = {
  committed: false,
  commit_sha: null,
  commit_message: null,
  files_changed: [],
};

/** Default TddScanStepResult returned when AI output cannot be parsed. */
export const TDD_SCAN_STEP_RESULT_FALLBACK: TddScanStepResult = {
  status: "FAIL",
  scope_analysis: {
    files_changed: 0,
    tests_defined: 0,
    tests_in_scope: 0,
    tests_out_of_scope: 0,
    justified_regression: 0,
    unjustified_scope_creep: 0,
    scope_verdict: "CLEAN",
  },
  coverage_analysis: {
    coverage_target: "missing",
    coverage_explicit: false,
    fr_ec_total: 0,
    fr_ec_with_tests: 0,
    forward_traceability: "gaps",
    backward_traceability: "orphan_tests",
    test_scenarios: {
      happy_path: false,
      edge_cases: 0,
      error_conditions: 0,
    },
    yagni_violations: 0,
  },
  issues: [],
  spec_modified: false,
  needs_fix: false,
  details: "Failed to parse TDD scan output",
};

/** Default TddFixStepResult returned when AI output cannot be parsed. */
export const TDD_FIX_STEP_RESULT_FALLBACK: TddFixStepResult = {
  status: "failed",
  issues_fixed: 0,
  issues_remaining: 0,
  spec_modified: false,
  fix_summary: "Failed to parse TDD fix output",
};

// parseXmlBlock and parseJsonSafe are now imported from core/utils above
