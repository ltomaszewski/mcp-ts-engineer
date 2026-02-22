import { describe, it, expect } from "vitest";
import {
  PrFixerInputSchema,
  PrFixerOutputSchema,
  PR_FIXER_OUTPUT_FALLBACK,
} from "../pr-fixer.schema.js";

describe("PrFixerInputSchema", () => {
  it("accepts valid input with pr only", () => {
    const result = PrFixerInputSchema.safeParse({ pr: "42" });
    expect(result.success).toBe(true);
  });

  it("accepts valid input with pr and cwd", () => {
    const result = PrFixerInputSchema.safeParse({ pr: "42", cwd: "/tmp/work" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.cwd).toBe("/tmp/work");
    }
  });

  it("accepts PR URL", () => {
    const result = PrFixerInputSchema.safeParse({
      pr: "https://github.com/owner/repo/pull/42",
    });
    expect(result.success).toBe(true);
  });

  it("rejects empty pr string", () => {
    const result = PrFixerInputSchema.safeParse({ pr: "" });
    expect(result.success).toBe(false);
  });

  it("rejects missing pr field", () => {
    const result = PrFixerInputSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("PrFixerOutputSchema", () => {
  it("validates success status", () => {
    const result = PrFixerOutputSchema.safeParse({
      status: "success",
      issues_input: 3,
      issues_resolved: 3,
      spec_path: "docs/specs/test/todo/spec.md",
      files_changed: ["src/a.ts", "src/b.ts"],
      cost_usd: 1.5,
    });
    expect(result.success).toBe(true);
  });

  it("validates partial status", () => {
    const result = PrFixerOutputSchema.safeParse({
      status: "partial",
      issues_input: 3,
      issues_resolved: 1,
      spec_path: "spec.md",
      files_changed: [],
      cost_usd: 0.5,
    });
    expect(result.success).toBe(true);
  });

  it("validates nothing_to_fix status", () => {
    const result = PrFixerOutputSchema.safeParse({
      status: "nothing_to_fix",
      issues_input: 0,
      issues_resolved: 0,
      spec_path: "",
      files_changed: [],
      cost_usd: 0,
    });
    expect(result.success).toBe(true);
  });

  it("validates failed status", () => {
    const result = PrFixerOutputSchema.safeParse({
      status: "failed",
      issues_input: 2,
      issues_resolved: 0,
      spec_path: "",
      files_changed: [],
      cost_usd: 0.1,
    });
    expect(result.success).toBe(true);
  });

  it("rejects invalid status", () => {
    const result = PrFixerOutputSchema.safeParse({
      status: "invalid",
      issues_input: 0,
      issues_resolved: 0,
      spec_path: "",
      files_changed: [],
      cost_usd: 0,
    });
    expect(result.success).toBe(false);
  });

  it("rejects negative cost", () => {
    const result = PrFixerOutputSchema.safeParse({
      status: "success",
      issues_input: 0,
      issues_resolved: 0,
      spec_path: "",
      files_changed: [],
      cost_usd: -1,
    });
    expect(result.success).toBe(false);
  });
});

describe("PR_FIXER_OUTPUT_FALLBACK", () => {
  it("has failed status", () => {
    expect(PR_FIXER_OUTPUT_FALLBACK.status).toBe("failed");
  });

  it("has zero counts", () => {
    expect(PR_FIXER_OUTPUT_FALLBACK.issues_input).toBe(0);
    expect(PR_FIXER_OUTPUT_FALLBACK.issues_resolved).toBe(0);
    expect(PR_FIXER_OUTPUT_FALLBACK.cost_usd).toBe(0);
  });

  it("validates against schema", () => {
    const result = PrFixerOutputSchema.safeParse(PR_FIXER_OUTPUT_FALLBACK);
    expect(result.success).toBe(true);
  });
});
