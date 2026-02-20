/**
 * Tests for todo-reviewer orchestration helper functions.
 *
 * These helpers are extracted from todo-reviewer.capability.ts for:
 * - File size reduction
 * - Better unit testing of pure functions
 * - Separation of orchestration logic from capability definition
 */

import { describe, it, expect } from "@jest/globals";
import {
  parseReviewFromAiContent,
  validateTddResult,
  determineStatus,
  buildOutput,
} from "../todo-reviewer.orchestration.js";
import type { IterationState } from "../todo-reviewer.orchestration.js";
import type { ReviewSummary, TddSummary } from "../todo-reviewer.schema.js";
import { REVIEW_SUMMARY_FALLBACK, TDD_SUMMARY_FALLBACK } from "../todo-reviewer.helpers.js";

// ---------------------------------------------------------------------------
// parseReviewFromAiContent
// ---------------------------------------------------------------------------

describe("parseReviewFromAiContent", () => {
  it("extracts ReviewSummary from valid XML content", () => {
    const content = `
      Some text before
      <review_summary>
      {
        "status": "IN_REVIEW",
        "spec_path": "test.md",
        "target_app": "my-app",
        "corrections_applied": 5,
        "blockers_remaining": 0,
        "warnings": 2,
        "cross_app_status": "N/A",
        "consistency_score": "14/16",
        "key_findings": ["Finding 1"],
        "spec_modified": true
      }
      </review_summary>
      Some text after
    `;
    const result = parseReviewFromAiContent(content, "test.md");

    expect(result.status).toBe("IN_REVIEW");
    expect(result.target_app).toBe("my-app");
    expect(result.corrections_applied).toBe(5);
  });

  it("returns fallback with spec_path when XML not found", () => {
    const result = parseReviewFromAiContent("no xml here", "my-spec.md");

    expect(result.status).toBe("BLOCKED");
    expect(result.spec_path).toBe("my-spec.md");
  });

  it("returns fallback with spec_path when JSON is invalid", () => {
    const content = "<review_summary>not valid json</review_summary>";
    const result = parseReviewFromAiContent(content, "my-spec.md");

    expect(result.status).toBe("BLOCKED");
    expect(result.spec_path).toBe("my-spec.md");
  });
});

// ---------------------------------------------------------------------------
// validateTddResult
// ---------------------------------------------------------------------------

describe("validateTddResult", () => {
  it("returns parsed result for valid TddSummary", () => {
    const validInput: TddSummary = {
      status: "PASS",
      details: "All tests defined",
      issues_found: 0,
      spec_modified: false,
    };
    const result = validateTddResult(validInput);

    expect(result.status).toBe("PASS");
    expect(result.details).toBe("All tests defined");
  });

  it("returns fallback for invalid input", () => {
    const result = validateTddResult({ wrong: "data" });

    expect(result).toEqual(TDD_SUMMARY_FALLBACK);
  });

  it("returns fallback for null input", () => {
    const result = validateTddResult(null);

    expect(result).toEqual(TDD_SUMMARY_FALLBACK);
  });

  it("returns fallback for undefined input", () => {
    const result = validateTddResult(undefined);

    expect(result).toEqual(TDD_SUMMARY_FALLBACK);
  });
});

// ---------------------------------------------------------------------------
// determineStatus
// ---------------------------------------------------------------------------

describe("determineStatus", () => {
  const baseReview: ReviewSummary = {
    ...REVIEW_SUMMARY_FALLBACK,
    status: "IN_REVIEW",
  };

  const baseTdd: TddSummary = {
    ...TDD_SUMMARY_FALLBACK,
    status: "PASS",
    details: "Tests look good",
  };

  it("returns success when review is IN_REVIEW and TDD passes", () => {
    const result = determineStatus(baseReview, baseTdd);

    expect(result).toBe("success");
  });

  it("returns success when review is READY and TDD passes", () => {
    const review: ReviewSummary = { ...baseReview, status: "READY" };
    const result = determineStatus(review, baseTdd);

    expect(result).toBe("success");
  });

  it("returns failed when TDD fails with meaningful output", () => {
    const tdd: TddSummary = { ...baseTdd, status: "FAIL", details: "Missing tests" };
    const result = determineStatus(baseReview, tdd);

    expect(result).toBe("failed");
  });

  it("returns success when TDD fails but details are indeterminate", () => {
    const tdd: TddSummary = {
      ...baseTdd,
      status: "FAIL",
      details: "Failed to parse TDD validation output",
    };
    const result = determineStatus(baseReview, tdd);

    expect(result).toBe("success");
  });

  it("returns success when TDD fails with empty details", () => {
    const tdd: TddSummary = { ...baseTdd, status: "FAIL", details: "" };
    const result = determineStatus(baseReview, tdd);

    expect(result).toBe("success");
  });

  it("returns failed when review is BLOCKED", () => {
    const review: ReviewSummary = { ...baseReview, status: "BLOCKED" };
    const result = determineStatus(review, baseTdd);

    expect(result).toBe("failed");
  });

  it("returns failed when review is BLOCKED (not IN_REVIEW or READY)", () => {
    const review: ReviewSummary = { ...baseReview, status: "BLOCKED" };
    const result = determineStatus(review, baseTdd);

    expect(result).toBe("failed");
  });
});

// ---------------------------------------------------------------------------
// buildOutput
// ---------------------------------------------------------------------------

describe("buildOutput", () => {
  it("builds output with commit result", () => {
    const state: IterationState = {
      reviewSummary: { ...REVIEW_SUMMARY_FALLBACK, status: "IN_REVIEW" },
      tddSummary: { ...TDD_SUMMARY_FALLBACK, status: "PASS", details: "Good" },
      tddScanResult: null,
      tddFixResult: null,
      reviewReport: "Review report content",
      tddReport: "TDD report content",
      iterationsCompleted: 2,
      specHasChanges: true,
      exitedEarly: false,
    };

    const commitResult = {
      committed: true,
      commit_sha: "abc123",
      commit_message: "feat: implement spec",
      files_changed: ["file1.ts", "file2.ts"],
    };

    const result = buildOutput(state, commitResult);

    expect(result.status).toBe("success");
    expect(result.review_report).toBe("Review report content");
    expect(result.tdd_report).toBe("TDD report content");
    expect(result.iterations_completed).toBe(2);
    expect(result.commit_sha).toBe("abc123");
    expect(result.commit_message).toBe("feat: implement spec");
    expect(result.files_changed).toEqual(["file1.ts", "file2.ts"]);
  });

  it("builds output with null commit result", () => {
    const state: IterationState = {
      reviewSummary: { ...REVIEW_SUMMARY_FALLBACK, status: "IN_REVIEW" },
      tddSummary: { ...TDD_SUMMARY_FALLBACK, status: "PASS", details: "Good" },
      tddScanResult: null,
      tddFixResult: null,
      reviewReport: "Report",
      tddReport: "TDD",
      iterationsCompleted: 1,
      specHasChanges: false,
      exitedEarly: true,
    };

    const result = buildOutput(state, {
      committed: false,
      commit_sha: null,
      commit_message: null,
      files_changed: [],
    });

    expect(result.commit_sha).toBeNull();
    expect(result.commit_message).toBeNull();
    expect(result.files_changed).toEqual([]);
  });
});
