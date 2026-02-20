/**
 * Tests for TDD fix prompt builder.
 */

import { describe, it, expect } from "@jest/globals";
import { v1 } from "../prompts/tdd-fix.v1.js";
import type { TddScanStepResult } from "../todo-reviewer.schema.js";

describe("TDD Fix Prompt v1", () => {
  const validScanResult: TddScanStepResult = {
    status: "FAIL",
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
      fr_ec_total: 4,
      fr_ec_with_tests: 3,
      forward_traceability: "gaps",
      backward_traceability: "complete",
      test_scenarios: {
        happy_path: true,
        edge_cases: 2,
        error_conditions: 1,
      },
      yagni_violations: 0,
    },
    issues: [
      {
        severity: "CRITICAL",
        title: "Missing test coverage",
        details: "FR-4 has no corresponding test",
        remediation: "Add test case for FR-4",
      },
    ],
    spec_modified: false,
    needs_fix: true,
    details: "Critical issues found",
  };

  it("builds prompt with valid input", () => {
    const result = v1.build({
      specPath: "docs/specs/feature.md",
      scanResult: validScanResult,
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
      scanResult: validScanResult,
    });

    expect(result.userPrompt).toContain("docs/specs/test.md");
    expect(result.userPrompt).toContain("<spec_path>");
  });

  it("includes scan status in user prompt", () => {
    const result = v1.build({
      specPath: "docs/specs/feature.md",
      scanResult: validScanResult,
    });

    expect(result.userPrompt).toContain("FAIL");
    expect(result.userPrompt).toContain("<scan_status>");
  });

  it("includes issues with remediations in user prompt", () => {
    const result = v1.build({
      specPath: "docs/specs/feature.md",
      scanResult: validScanResult,
    });

    expect(result.userPrompt).toContain("<issues_with_remediations>");
    expect(result.userPrompt).toContain("Missing test coverage");
    expect(result.userPrompt).toContain("Add test case for FR-4");
  });

  it("includes fix workflow steps", () => {
    const result = v1.build({
      specPath: "docs/specs/feature.md",
      scanResult: validScanResult,
    });

    expect(result.userPrompt).toContain("Step 1: Read Current Spec");
    expect(result.userPrompt).toContain("Step 2: Apply Remediations");
    expect(result.userPrompt).toContain("Step 3: Write Corrected Spec");
  });
});
