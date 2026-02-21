import { vi } from "vitest";
/**
 * Shared test fixtures and factory helpers for todo-reviewer tests.
 * @internal Test utility only
 */

import type { ReviewSummary, TddSummary, CommitResult, TddScanStepResult, TddFixStepResult } from "../todo-reviewer.schema.js";
import type { AIQueryResult } from "../../../core/ai-provider/ai-provider.types.js";
import type { CapabilityContext } from "../../../core/capability-registry/capability-registry.types.js";

// ---------------------------------------------------------------------------
// Mock context factory
// ---------------------------------------------------------------------------

/**
 * Creates a CapabilityContext with optional overrides.
 * @param overrides - Partial overrides for the context
 */
export function createMockContext(
  overrides?: Partial<CapabilityContext>,
): CapabilityContext {
  return {
    session: {
      id: "test-session",
      state: "active",
      startedAt: "2026-01-29T00:00:00Z",
      invocations: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    },
    invocation: {
      id: "test-invocation",
      capability: "test_capability",
      input: {},
      timestamp: "2026-01-29T00:00:00Z",
    },
    logger: {
      info: () => {},
      debug: () => {},
      error: () => {},
      warn: () => {},
    },
    getSessionCost: () => ({ totalCostUsd: 0, totalInputTokens: 0, totalOutputTokens: 0, totalTurns: 0 }),
    promptVersion: "v1",
    providerName: "ClaudeProvider",
    invokeCapability: vi.fn<CapabilityContext["invokeCapability"]>(),
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Mock AI result factory
// ---------------------------------------------------------------------------

/**
 * Creates an AIQueryResult with the given content string.
 */
export function createMockAiResult(content: string): AIQueryResult {
  return {
    content,
    usage: { inputTokens: 100, outputTokens: 200, totalTokens: 300 },
    costUsd: 0.05,
    turns: 5,
    terminationReason: "success",
    trace: {
      tid: "testtrace00000000000000000000000",
      startedAt: "2026-01-29T00:00:00Z",
      request: { prompt: "test" },
      turns: [],
    },
  };
}

// ---------------------------------------------------------------------------
// Fixture constants
// ---------------------------------------------------------------------------

export const VALID_REVIEW_SUMMARY: ReviewSummary = {
  status: "IN_REVIEW",
  spec_path: "docs/specs/feature.md",
  target_app: "my-server",
  corrections_applied: 2,
  blockers_remaining: 0,
  warnings: 1,
  cross_app_status: "N/A",
  consistency_score: "14/14",
  key_findings: ["Fixed schema ref"],
  spec_modified: true,
};

export const BLOCKED_REVIEW_SUMMARY: ReviewSummary = {
  ...VALID_REVIEW_SUMMARY,
  status: "BLOCKED",
  blockers_remaining: 2,
};

export const VALID_TDD_SUMMARY: TddSummary = {
  status: "PASS",
  details: "All tests pass",
  issues_found: 0,
  spec_modified: false,
};

export const FAIL_TDD_SUMMARY: TddSummary = {
  status: "FAIL",
  details: "Tests failing",
  issues_found: 3,
  spec_modified: true,
};

export const WARN_TDD_SUMMARY: TddSummary = {
  status: "WARN",
  details: "Some warnings",
  issues_found: 1,
  spec_modified: false,
};

export const VALID_COMMIT_RESULT: CommitResult = {
  committed: true,
  commit_sha: "abc1234",
  commit_message: "chore(spec): update",
  files_changed: ["docs/specs/feature.md"],
};

export const VALID_SCAN_RESULT: TddScanStepResult = {
  status: "PASS",
  scope_analysis: {
    files_changed: 2,
    tests_defined: 2,
    tests_in_scope: 2,
    tests_out_of_scope: 0,
    justified_regression: 0,
    unjustified_scope_creep: 0,
    scope_verdict: "CLEAN",
  },
  coverage_analysis: {
    coverage_target: "80%",
    coverage_explicit: true,
    fr_ec_total: 3,
    fr_ec_with_tests: 3,
    forward_traceability: "complete",
    backward_traceability: "complete",
    test_scenarios: {
      happy_path: true,
      edge_cases: 2,
      error_conditions: 1,
    },
    yagni_violations: 0,
  },
  issues: [],
  spec_modified: false,
  needs_fix: false,
  details: "All TDD validations passed",
};

export const FAIL_SCAN_RESULT: TddScanStepResult = {
  status: "FAIL",
  scope_analysis: {
    files_changed: 2,
    tests_defined: 3,
    tests_in_scope: 2,
    tests_out_of_scope: 1,
    justified_regression: 0,
    unjustified_scope_creep: 1,
    scope_verdict: "CREEP_DETECTED",
  },
  coverage_analysis: {
    coverage_target: "missing",
    coverage_explicit: false,
    fr_ec_total: 3,
    fr_ec_with_tests: 1,
    forward_traceability: "gaps",
    backward_traceability: "orphan_tests",
    test_scenarios: {
      happy_path: true,
      edge_cases: 0,
      error_conditions: 0,
    },
    yagni_violations: 1,
  },
  issues: [
    {
      severity: "CRITICAL",
      title: "Missing test coverage for user.service.ts",
      details: "Source file has no test file listed",
      remediation: "Add test file mapping",
    },
  ],
  spec_modified: false,
  needs_fix: true,
  details: "Critical TDD issues found",
};

export const WARN_SCAN_RESULT: TddScanStepResult = {
  ...VALID_SCAN_RESULT,
  status: "WARN",
  issues: [
    {
      severity: "WARN",
      title: "Minor proportionality concern",
      details: "Test count slightly high",
      remediation: "Consider consolidating similar tests",
    },
  ],
  details: "Minor warnings found",
};

export const VALID_FIX_RESULT: TddFixStepResult = {
  status: "success",
  issues_fixed: 1,
  issues_remaining: 0,
  spec_modified: true,
  fix_summary: "Fixed all critical issues",
};
