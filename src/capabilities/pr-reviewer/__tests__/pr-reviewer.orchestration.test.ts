/**
 * Test suite for PR reviewer orchestration helpers.
 * Validates pure functions (no mocks needed).
 */

import { describe, it, expect } from "@jest/globals";
import {
  createInitialState,
  getDefaultBudget,
  isOverBudget,
  countBySeverity,
  shouldSkipPhase,
  getNextPhase,
  type ReviewPhase,
  type ReviewState,
} from "../pr-reviewer.orchestration.js";
import type { ReviewIssue } from "../pr-reviewer.schema.js";

describe("createInitialState", () => {
  it("returns state with all fields initialized", () => {
    const state = createInitialState();
    expect(state.phase).toBe("preflight");
    expect(state.prContext).toBeNull();
    expect(state.worktreePath).toBeNull();
    expect(state.agentResults).toEqual([]);
    expect(state.mergedIssues).toEqual([]);
    expect(state.validatedIssues).toEqual([]);
    expect(state.autoFixableIssues).toEqual([]);
    expect(state.manualIssues).toEqual([]);
    expect(state.fixesApplied).toBe(0);
    expect(state.budgetSpent).toBe(0);
    expect(state.commentUrl).toBe("");
  });
});

describe("getDefaultBudget", () => {
  it("returns $5 for review-only", () => {
    expect(getDefaultBudget("review-only")).toBe(5);
  });

  it("returns $10 for review-fix", () => {
    expect(getDefaultBudget("review-fix")).toBe(10);
  });
});

describe("isOverBudget", () => {
  it("returns true when spent >= limit", () => {
    const state = { ...createInitialState(), budgetSpent: 5 };
    expect(isOverBudget(state, 5)).toBe(true);
  });

  it("returns false when spent < limit", () => {
    const state = { ...createInitialState(), budgetSpent: 4.99 };
    expect(isOverBudget(state, 5)).toBe(false);
  });
});

describe("countBySeverity", () => {
  it("counts issues by severity", () => {
    const issues: ReviewIssue[] = [
      { severity: "CRITICAL", title: "a", file_path: "f", details: "d", auto_fixable: false, confidence: 90 },
      { severity: "HIGH", title: "b", file_path: "f", details: "d", auto_fixable: false, confidence: 80 },
      { severity: "HIGH", title: "c", file_path: "f", details: "d", auto_fixable: false, confidence: 80 },
      { severity: "MEDIUM", title: "d", file_path: "f", details: "d", auto_fixable: false, confidence: 70 },
      { severity: "LOW", title: "e", file_path: "f", details: "d", auto_fixable: false, confidence: 60 },
    ];
    expect(countBySeverity(issues)).toEqual({ critical: 1, high: 2, medium: 1, low: 1 });
  });

  it("returns zeros for empty list", () => {
    expect(countBySeverity([])).toEqual({ critical: 0, high: 0, medium: 0, low: 0 });
  });
});

describe("getNextPhase", () => {
  const baseState = createInitialState();

  describe("phase order", () => {
    it("does not include revert phase", () => {
      // Walk through ALL phases in review-fix mode with auto-fixable issues
      const stateWithFixes: ReviewState = {
        ...baseState,
        autoFixableIssues: [{ severity: "LOW", title: "t", file_path: "f", details: "d", auto_fixable: true, confidence: 70 }],
        fixesApplied: 1,
      };
      const visitedPhases: ReviewPhase[] = ["preflight"];
      let current: ReviewPhase = "preflight";
      while (current !== "done") {
        current = getNextPhase(current, "review-fix", stateWithFixes);
        visitedPhases.push(current);
      }
      expect(visitedPhases).not.toContain("revert");
    });

    it("ends with done for review-only", () => {
      const visitedPhases: ReviewPhase[] = ["preflight"];
      let current: ReviewPhase = "preflight";
      while (current !== "done") {
        current = getNextPhase(current, "review-only", baseState);
        visitedPhases.push(current);
      }
      expect(visitedPhases[visitedPhases.length - 1]).toBe("done");
      expect(visitedPhases).not.toContain("revert");
    });
  });

  describe("review-only mode", () => {
    it("skips fix/cleanup/test/commit phases", () => {
      const phases: ReviewPhase[] = [];
      let current: ReviewPhase = "preflight";
      while (current !== "done") {
        current = getNextPhase(current, "review-only", baseState);
        phases.push(current);
      }
      expect(phases).not.toContain("fix");
      expect(phases).not.toContain("cleanup");
      expect(phases).not.toContain("test");
      expect(phases).not.toContain("commit");
    });

    it("follows preflight → context → review → aggregate → validate → comment → done", () => {
      const phases: ReviewPhase[] = [];
      let current: ReviewPhase = "preflight";
      while (current !== "done") {
        current = getNextPhase(current, "review-only", baseState);
        phases.push(current);
      }
      expect(phases).toEqual(["context", "review", "aggregate", "validate", "comment", "done"]);
    });
  });

  describe("review-fix mode", () => {
    it("includes fix phase when auto-fixable issues exist", () => {
      const stateWithFixes: ReviewState = {
        ...baseState,
        autoFixableIssues: [{ severity: "LOW", title: "t", file_path: "f", details: "d", auto_fixable: true, confidence: 70 }],
        fixesApplied: 1,
      };
      const phases: ReviewPhase[] = [];
      let current: ReviewPhase = "preflight";
      while (current !== "done") {
        current = getNextPhase(current, "review-fix", stateWithFixes);
        phases.push(current);
      }
      expect(phases).toContain("fix");
      expect(phases).toContain("cleanup");
      expect(phases).toContain("test");
      expect(phases).toContain("commit");
    });
  });
});

describe("shouldSkipPhase", () => {
  const baseState = createInitialState();

  it("skips fix in review-only mode", () => {
    expect(shouldSkipPhase("fix", baseState, "review-only")).toBe(true);
  });

  it("skips cleanup in review-only mode", () => {
    expect(shouldSkipPhase("cleanup", baseState, "review-only")).toBe(true);
  });

  it("does not skip comment phase", () => {
    expect(shouldSkipPhase("comment", baseState, "review-only")).toBe(false);
  });
});
