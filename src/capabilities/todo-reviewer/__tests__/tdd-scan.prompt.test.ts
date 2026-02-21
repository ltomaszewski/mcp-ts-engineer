/**
 * Tests for TDD scan prompt builder.
 */

import { describe, it, expect } from "@jest/globals";
import { v1 } from "../prompts/tdd-scan.v1.js";
import type { ReviewSummary } from "../todo-reviewer.schema.js";

describe("TDD Scan Prompt v1", () => {
  const validReviewSummary: ReviewSummary = {
    status: "IN_REVIEW",
    spec_path: "docs/specs/feature.md",
    target_app: "my-server",
    corrections_applied: 0,
    blockers_remaining: 0,
    warnings: 0,
    cross_app_status: "N/A",
    consistency_score: "14/14",
    key_findings: [],
    spec_modified: false,
  };

  it("builds prompt with valid input", () => {
    const result = v1.build({
      specPath: "docs/specs/feature.md",
      reviewSummary: validReviewSummary,
    });

    expect(result).toHaveProperty("systemPrompt");
    expect(result).toHaveProperty("userPrompt");
    expect(typeof result.systemPrompt).toBe("object");
    if (typeof result.systemPrompt === "object" && result.systemPrompt !== null) {
      expect(result.systemPrompt.type).toBe("preset");
      expect(result.systemPrompt.preset).toBe("claude_code");
    }
  });

  it("includes spec path in user prompt", () => {
    const result = v1.build({
      specPath: "docs/specs/test.md",
      reviewSummary: validReviewSummary,
    });

    expect(result.userPrompt).toContain("docs/specs/test.md");
    expect(result.userPrompt).toContain("<spec_path>");
  });

  it("includes review status in user prompt", () => {
    const result = v1.build({
      specPath: "docs/specs/feature.md",
      reviewSummary: { ...validReviewSummary, status: "BLOCKED" },
    });

    expect(result.userPrompt).toContain("BLOCKED");
    expect(result.userPrompt).toContain("<prior_review_status>");
  });

  it("includes scope boundary validation workflow", () => {
    const result = v1.build({
      specPath: "docs/specs/feature.md",
      reviewSummary: validReviewSummary,
    });

    expect(result.userPrompt).toContain("Scope Boundary Validation");
    expect(result.userPrompt).toContain("Files Changed");
  });

  it("includes YAGNI validation workflow", () => {
    const result = v1.build({
      specPath: "docs/specs/feature.md",
      reviewSummary: validReviewSummary,
    });

    expect(result.userPrompt).toContain("YAGNI");
    expect(result.userPrompt).toContain("library/framework internals");
  });

  it("includes bidirectional traceability validation", () => {
    const result = v1.build({
      specPath: "docs/specs/feature.md",
      reviewSummary: validReviewSummary,
    });

    expect(result.userPrompt).toContain("Forward traceability");
    expect(result.userPrompt).toContain("Backward traceability");
    expect(result.userPrompt).toContain("FR/EC");
  });
});
