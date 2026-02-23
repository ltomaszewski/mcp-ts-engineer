/**
 * Test suite for PR reviewer schemas.
 * Validates input/output schemas for the pr_reviewer capability.
 */

import {
  PrReviewerInputSchema,
  PrReviewerOutputSchema,
  ReviewIssueSchema,
  AggregateStepInputSchema,
  PREFLIGHT_OUTPUT_JSON_SCHEMA,
  CONTEXT_OUTPUT_JSON_SCHEMA,
  REVIEW_OUTPUT_JSON_SCHEMA,
  AGGREGATE_OUTPUT_JSON_SCHEMA,
  VALIDATE_OUTPUT_JSON_SCHEMA,
  FIX_OUTPUT_JSON_SCHEMA,
  CLEANUP_OUTPUT_JSON_SCHEMA,
  TEST_OUTPUT_JSON_SCHEMA,
  COMMIT_OUTPUT_JSON_SCHEMA,
  COMMENT_OUTPUT_JSON_SCHEMA,
  REVERT_OUTPUT_JSON_SCHEMA,
} from "../pr-reviewer.schema.js";

describe("PrReviewerInputSchema", () => {
  describe("valid inputs", () => {
    it("accepts PR number as string", () => {
      const result = PrReviewerInputSchema.safeParse({
        pr: "123",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pr).toBe("123");
        expect(result.data.mode).toBe("review-fix"); // default (review-only removed)
        expect(result.data.incremental).toBe(false); // default
      }
    });

    it("accepts PR number as GitHub URL", () => {
      const result = PrReviewerInputSchema.safeParse({
        pr: "https://github.com/owner/repo/pull/456",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.pr).toBe("https://github.com/owner/repo/pull/456");
      }
    });

    it("rejects review-only mode (removed)", () => {
      const result = PrReviewerInputSchema.safeParse({
        pr: "789",
        mode: "review-only",
      });
      expect(result.success).toBe(false);
    });

    it("accepts review-fix mode", () => {
      const result = PrReviewerInputSchema.safeParse({
        pr: "101",
        mode: "review-fix",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.mode).toBe("review-fix");
      }
    });

    it("accepts incremental flag", () => {
      const result = PrReviewerInputSchema.safeParse({
        pr: "202",
        incremental: true,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.incremental).toBe(true);
      }
    });

    it("accepts custom budget", () => {
      const result = PrReviewerInputSchema.safeParse({
        pr: "303",
        budget: 15.5,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.budget).toBe(15.5);
      }
    });

    it("accepts all fields together", () => {
      const result = PrReviewerInputSchema.safeParse({
        pr: "https://github.com/myorg/repo/pull/404",
        mode: "review-fix",
        incremental: true,
        budget: 12.0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid inputs", () => {
    it("rejects missing pr field", () => {
      const result = PrReviewerInputSchema.safeParse({});
      expect(result.success).toBe(false);
    });

    it("rejects empty pr string", () => {
      const result = PrReviewerInputSchema.safeParse({ pr: "" });
      expect(result.success).toBe(false);
    });

    it("rejects invalid mode value", () => {
      const result = PrReviewerInputSchema.safeParse({
        pr: "123",
        mode: "invalid-mode",
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative budget", () => {
      const result = PrReviewerInputSchema.safeParse({
        pr: "123",
        budget: -5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects zero budget", () => {
      const result = PrReviewerInputSchema.safeParse({
        pr: "123",
        budget: 0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects non-boolean incremental", () => {
      const result = PrReviewerInputSchema.safeParse({
        pr: "123",
        incremental: "yes",
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("PrReviewerOutputSchema", () => {
  describe("valid outputs", () => {
    it("accepts success status with all fields", () => {
      const result = PrReviewerOutputSchema.safeParse({
        status: "success",
        issues_found: 10,
        issues_fixed: 8,
        critical_count: 1,
        high_count: 3,
        medium_count: 4,
        low_count: 2,
        unfixed_medium_count: 1,
        unfixed_auto_fixable_count: 0,
        comment_url: "https://github.com/owner/repo/pull/123#issuecomment-456",
        cost_usd: 4.25,
      });
      expect(result.success).toBe(true);
    });

    it("accepts partial status", () => {
      const result = PrReviewerOutputSchema.safeParse({
        status: "partial",
        issues_found: 5,
        issues_fixed: 2,
        critical_count: 0,
        high_count: 2,
        medium_count: 2,
        low_count: 1,
        unfixed_medium_count: 2,
        unfixed_auto_fixable_count: 1,
        comment_url: "https://github.com/owner/repo/pull/123#issuecomment-789",
        cost_usd: 3.5,
      });
      expect(result.success).toBe(true);
    });

    it("accepts failed status", () => {
      const result = PrReviewerOutputSchema.safeParse({
        status: "failed",
        issues_found: 0,
        issues_fixed: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        unfixed_medium_count: 0,
        unfixed_auto_fixable_count: 0,
        comment_url: "",
        cost_usd: 0.5,
      });
      expect(result.success).toBe(true);
    });

    it("accepts optional worktree_path", () => {
      const result = PrReviewerOutputSchema.safeParse({
        status: "success",
        issues_found: 3,
        issues_fixed: 3,
        critical_count: 0,
        high_count: 1,
        medium_count: 2,
        low_count: 0,
        unfixed_medium_count: 0,
        unfixed_auto_fixable_count: 0,
        comment_url: "https://github.com/owner/repo/pull/111#issuecomment-222",
        cost_usd: 5.0,
        worktree_path: ".worktrees/pr-111-review-1234567890",
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.worktree_path).toBe(".worktrees/pr-111-review-1234567890");
      }
    });

    it("accepts zero issues", () => {
      const result = PrReviewerOutputSchema.safeParse({
        status: "success",
        issues_found: 0,
        issues_fixed: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        unfixed_medium_count: 0,
        unfixed_auto_fixable_count: 0,
        comment_url: "https://github.com/owner/repo/pull/333#issuecomment-444",
        cost_usd: 2.0,
      });
      expect(result.success).toBe(true);
    });
  });

  describe("invalid outputs", () => {
    it("rejects invalid status", () => {
      const result = PrReviewerOutputSchema.safeParse({
        status: "pending",
        issues_found: 5,
        issues_fixed: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        unfixed_medium_count: 0,
        unfixed_auto_fixable_count: 0,
        comment_url: "",
        cost_usd: 1.0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects missing required fields", () => {
      const result = PrReviewerOutputSchema.safeParse({
        status: "success",
        issues_found: 5,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative counts", () => {
      const result = PrReviewerOutputSchema.safeParse({
        status: "success",
        issues_found: -1,
        issues_fixed: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        unfixed_medium_count: 0,
        unfixed_auto_fixable_count: 0,
        comment_url: "",
        cost_usd: 1.0,
      });
      expect(result.success).toBe(false);
    });

    it("rejects negative cost", () => {
      const result = PrReviewerOutputSchema.safeParse({
        status: "success",
        issues_found: 0,
        issues_fixed: 0,
        critical_count: 0,
        high_count: 0,
        medium_count: 0,
        low_count: 0,
        unfixed_medium_count: 0,
        unfixed_auto_fixable_count: 0,
        comment_url: "",
        cost_usd: -2.5,
      });
      expect(result.success).toBe(false);
    });
  });
});

describe("ReviewIssueSchema", () => {
  const baseIssue = {
    severity: "HIGH" as const,
    title: "Test issue",
    file_path: "src/test.ts",
    details: "A test issue",
    auto_fixable: true,
    confidence: 80,
  };

  describe("category normalization", () => {
    it("accepts hyphenated category values (code-quality)", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, category: "code-quality" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.category).toBe("code-quality");
    });

    it("normalizes underscored category to hyphens (code_quality → code-quality)", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, category: "code_quality" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.category).toBe("code-quality");
    });

    it("accepts security category unchanged", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, category: "security" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.category).toBe("security");
    });

    it("accepts architecture category unchanged", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, category: "architecture" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.category).toBe("architecture");
    });

    it("accepts performance category unchanged", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, category: "performance" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.category).toBe("performance");
    });

    it("rejects invalid category value", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, category: "invalid" });
      expect(result.success).toBe(false);
    });

    it("accepts missing category (optional)", () => {
      const result = ReviewIssueSchema.safeParse(baseIssue);
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.category).toBeUndefined();
    });
  });

  describe("severity normalization", () => {
    it("accepts standard severity values unchanged", () => {
      for (const sev of ["CRITICAL", "HIGH", "MEDIUM", "LOW"] as const) {
        const result = ReviewIssueSchema.safeParse({ ...baseIssue, severity: sev });
        expect(result.success).toBe(true);
        if (result.success) expect(result.data.severity).toBe(sev);
      }
    });

    it("normalizes INFO to LOW", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, severity: "INFO" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.severity).toBe("LOW");
    });

    it("normalizes WARNING to MEDIUM", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, severity: "WARNING" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.severity).toBe("MEDIUM");
    });

    it("normalizes WARN to MEDIUM", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, severity: "WARN" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.severity).toBe("MEDIUM");
    });

    it("normalizes lowercase severity (critical → CRITICAL)", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, severity: "critical" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.severity).toBe("CRITICAL");
    });

    it("normalizes lowercase info to LOW", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, severity: "info" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.severity).toBe("LOW");
    });

    it("normalizes mixed case (Warning → MEDIUM)", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, severity: "Warning" });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.severity).toBe("MEDIUM");
    });

    it("rejects unknown severity values", () => {
      const result = ReviewIssueSchema.safeParse({ ...baseIssue, severity: "UNKNOWN" });
      expect(result.success).toBe(false);
    });
  });

  describe("defaults", () => {
    it("applies auto_fixable default (false)", () => {
      const { auto_fixable: _, ...withoutAutoFixable } = baseIssue;
      const result = ReviewIssueSchema.safeParse({ ...withoutAutoFixable });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.auto_fixable).toBe(false);
    });

    it("applies confidence default (70)", () => {
      const { confidence: _, ...withoutConfidence } = baseIssue;
      const result = ReviewIssueSchema.safeParse({ ...withoutConfidence });
      expect(result.success).toBe(true);
      if (result.success) expect(result.data.confidence).toBe(70);
    });
  });
});

describe("AggregateStepInputSchema", () => {
  it("accepts agent results with underscored categories (normalized by ReviewIssueSchema)", () => {
    const result = AggregateStepInputSchema.safeParse({
      agent_results: [{
        agent: "multi-review",
        issues: [{
          severity: "MEDIUM",
          category: "code_quality",
          title: "Unused variable",
          file_path: "src/test.ts",
          details: "Variable x is unused",
          auto_fixable: true,
          confidence: 75,
        }],
      }],
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.agent_results[0].issues[0].category).toBe("code-quality");
    }
  });
});

describe("JSON Schema constants for structured output", () => {
  const allSchemas = [
    { name: "PREFLIGHT_OUTPUT_JSON_SCHEMA", schema: PREFLIGHT_OUTPUT_JSON_SCHEMA },
    { name: "CONTEXT_OUTPUT_JSON_SCHEMA", schema: CONTEXT_OUTPUT_JSON_SCHEMA },
    { name: "REVIEW_OUTPUT_JSON_SCHEMA", schema: REVIEW_OUTPUT_JSON_SCHEMA },
    { name: "AGGREGATE_OUTPUT_JSON_SCHEMA", schema: AGGREGATE_OUTPUT_JSON_SCHEMA },
    { name: "VALIDATE_OUTPUT_JSON_SCHEMA", schema: VALIDATE_OUTPUT_JSON_SCHEMA },
    { name: "FIX_OUTPUT_JSON_SCHEMA", schema: FIX_OUTPUT_JSON_SCHEMA },
    { name: "CLEANUP_OUTPUT_JSON_SCHEMA", schema: CLEANUP_OUTPUT_JSON_SCHEMA },
    { name: "TEST_OUTPUT_JSON_SCHEMA", schema: TEST_OUTPUT_JSON_SCHEMA },
    { name: "COMMIT_OUTPUT_JSON_SCHEMA", schema: COMMIT_OUTPUT_JSON_SCHEMA },
    { name: "COMMENT_OUTPUT_JSON_SCHEMA", schema: COMMENT_OUTPUT_JSON_SCHEMA },
    { name: "REVERT_OUTPUT_JSON_SCHEMA", schema: REVERT_OUTPUT_JSON_SCHEMA },
  ];

  for (const { name, schema } of allSchemas) {
    it(`${name} has correct structure`, () => {
      expect(schema).toHaveProperty("type", "json_schema");
      expect(schema).toHaveProperty("schema");
      const inner = schema.schema as Record<string, unknown>;
      expect(inner).toHaveProperty("type", "object");
      expect(inner).toHaveProperty("properties");
      expect(inner).toHaveProperty("required");
      expect(Array.isArray(inner.required)).toBe(true);
    });
  }

  it("REVIEW_OUTPUT_JSON_SCHEMA includes issues array with issue schema", () => {
    const inner = REVIEW_OUTPUT_JSON_SCHEMA.schema as Record<string, unknown>;
    const props = inner.properties as Record<string, unknown>;
    expect(props).toHaveProperty("issues");
    const issuesSchema = props.issues as Record<string, unknown>;
    expect(issuesSchema).toHaveProperty("type", "array");
    expect(issuesSchema).toHaveProperty("items");
    const itemsSchema = issuesSchema.items as Record<string, unknown>;
    expect(itemsSchema).toHaveProperty("type", "object");
    const itemProps = itemsSchema.properties as Record<string, unknown>;
    expect(itemProps).toHaveProperty("severity");
    expect(itemProps).toHaveProperty("category");
    expect(itemProps).toHaveProperty("file_path");
    expect(itemProps).toHaveProperty("auto_fixable");
    expect(itemProps).toHaveProperty("confidence");
  });

  it("REVIEW_OUTPUT_JSON_SCHEMA severity enum includes INFO/WARN/WARNING for AI tolerance", () => {
    const inner = REVIEW_OUTPUT_JSON_SCHEMA.schema as Record<string, unknown>;
    const props = inner.properties as Record<string, unknown>;
    const issuesSchema = props.issues as Record<string, unknown>;
    const itemsSchema = issuesSchema.items as Record<string, unknown>;
    const itemProps = itemsSchema.properties as Record<string, unknown>;
    const severitySchema = itemProps.severity as Record<string, unknown>;
    const severityEnum = severitySchema.enum as string[];
    expect(severityEnum).toContain("INFO");
    expect(severityEnum).toContain("WARN");
    expect(severityEnum).toContain("WARNING");
    expect(severityEnum).toContain("CRITICAL");
    expect(severityEnum).toContain("HIGH");
    expect(severityEnum).toContain("MEDIUM");
    expect(severityEnum).toContain("LOW");
  });
});
