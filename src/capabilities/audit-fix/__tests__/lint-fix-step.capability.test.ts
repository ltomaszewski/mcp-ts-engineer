/**
 * Unit tests for lint fix step capability (lint-fix-step.capability.ts).
 * Tests capability metadata, options, prompt preparation, and result processing.
 */

import { describe, it, expect } from "@jest/globals";
import { auditFixLintFixStepCapability } from "../lint-fix-step.capability.js";

describe("Lint Fix Step Capability", () => {
  it("has correct metadata with Internal visibility", () => {
    expect(auditFixLintFixStepCapability.id).toBe("audit_fix_lint_fix_step");
    expect(auditFixLintFixStepCapability.type).toBe("tool");
    expect(auditFixLintFixStepCapability.name).toContain("Internal");
    expect(auditFixLintFixStepCapability.description).toContain(
      "Internal sub-capability"
    );
    expect(auditFixLintFixStepCapability.description).toContain(
      "Not intended for direct use"
    );
  });

  it("has correct default options (model, turns, budget, tools)", () => {
    const options = auditFixLintFixStepCapability.defaultRequestOptions;

    expect(options?.model).toBe("sonnet");
    expect(options?.maxTurns).toBe(80);
    expect(options?.maxBudgetUsd).toBe(4.0);
    expect(options?.tools).toMatchObject({
      type: "preset",
      preset: "claude_code",
    });
  });

  it("preparePromptInput builds correct input object", () => {
    const input = {
      project_path: "apps/my-server",
      lint_report: "Error: unused import in file1.ts",
      files_with_lint_errors: ["src/file1.ts", "src/file2.ts"],
      cwd: "/monorepo",
    };

    const result = auditFixLintFixStepCapability.preparePromptInput(
      input,
      {} as never
    );

    expect(result).toMatchObject({
      projectPath: "apps/my-server",
      lintReport: "Error: unused import in file1.ts",
      filesWithLintErrors: ["src/file1.ts", "src/file2.ts"],
      cwd: "/monorepo",
    });
  });

  it("processResult parses <lint_fix_result> XML with valid JSON", () => {
    const input = {
      project_path: "apps/my-server",
      lint_report: "Error: unused import",
      files_with_lint_errors: ["src/file1.ts"],
    };

    const mockContext = {} as never;
    const aiResult = {
      content: `<lint_fix_result>
{
  "status": "success",
  "files_modified": ["src/file1.ts", "src/file2.ts"],
  "summary": "Fixed 3 lint errors: removed unused imports"
}
</lint_fix_result>`,
    } as never;

    const result = auditFixLintFixStepCapability.processResult(
      input,
      aiResult,
      mockContext
    );

    expect(result).toEqual({
      status: "success",
      files_modified: ["src/file1.ts", "src/file2.ts"],
      summary: "Fixed 3 lint errors: removed unused imports",
    });
  });

  it("processResult uses structured output when available", () => {
    const input = {
      project_path: "apps/my-server",
      lint_report: "Error: unused import",
      files_with_lint_errors: ["src/file1.ts"],
    };

    const mockContext = {} as never;
    const aiResult = {
      content: "AI text response here",
      structuredOutput: {
        status: "success",
        files_modified: ["src/utils/helper.ts"],
        summary: "Fixed formatting issues",
      },
    } as never;

    const result = auditFixLintFixStepCapability.processResult(
      input,
      aiResult,
      mockContext
    );

    expect(result).toEqual({
      status: "success",
      files_modified: ["src/utils/helper.ts"],
      summary: "Fixed formatting issues",
    });
  });

  it("processResult returns fallback on malformed XML", () => {
    const input = {
      project_path: "apps/my-server",
      lint_report: "Error: unused import",
      files_with_lint_errors: ["src/file1.ts"],
    };

    const mockContext = {} as never;
    const aiResult = {
      content: "Some text without XML block",
    } as never;

    const result = auditFixLintFixStepCapability.processResult(
      input,
      aiResult,
      mockContext
    );

    expect(result).toEqual({
      status: "failed",
      files_modified: [],
      summary: "Failed to parse lint fix output",
    });
  });

  it("processResult extracts status, files_modified, and summary", () => {
    const input = {
      project_path: "apps/my-server",
      lint_report: "Error: console.log in file",
      files_with_lint_errors: ["src/test.ts"],
    };

    const mockContext = {} as never;
    const aiResult = {
      content: `<lint_fix_result>
{
  "status": "failed",
  "files_modified": [],
  "summary": "Unable to fix lint errors: complex regex patterns"
}
</lint_fix_result>`,
    } as never;

    const result = auditFixLintFixStepCapability.processResult(
      input,
      aiResult,
      mockContext
    );

    expect(result).toEqual({
      status: "failed",
      files_modified: [],
      summary: "Unable to fix lint errors: complex regex patterns",
    });
  });
});
