/**
 * Unit tests for lint fix prompt builder (lint-fix.v1.ts).
 * Tests prompt structure, content, and output format instructions.
 */

import { lintFixPromptV1 } from "../prompts/lint-fix.v1.js";

describe("Lint Fix Prompt (v1)", () => {
  it("returns BuiltPrompt with correct structure", () => {
    const input = {
      projectPath: "apps/my-server",
      lintReport: "Error: unused import",
      filesWithLintErrors: ["src/file1.ts"],
    };

    const result = lintFixPromptV1.build(input);

    expect(result).toHaveProperty("systemPrompt");
    expect(result).toHaveProperty("userPrompt");
    expect(typeof result.userPrompt).toBe("string");
  });

  it("uses claude_code preset for systemPrompt", () => {
    const input = {
      projectPath: "apps/my-server",
      lintReport: "Error: unused import",
      filesWithLintErrors: ["src/file1.ts"],
    };

    const result = lintFixPromptV1.build(input);

    expect(result.systemPrompt).toMatchObject({
      type: "preset",
      preset: "claude_code",
    });
  });

  it("includes project path in userPrompt", () => {
    const input = {
      projectPath: "apps/my-server",
      lintReport: "Error: unused import",
      filesWithLintErrors: ["src/file1.ts"],
    };

    const result = lintFixPromptV1.build(input);

    expect(result.userPrompt).toContain("apps/my-server");
    expect(result.userPrompt).toContain("<project_path>");
  });

  it("includes lint report in userPrompt", () => {
    const input = {
      projectPath: "apps/my-server",
      lintReport: "Error: unused import in file1.ts\nWarning: console.log in file2.ts",
      filesWithLintErrors: ["src/file1.ts", "src/file2.ts"],
    };

    const result = lintFixPromptV1.build(input);

    expect(result.userPrompt).toContain("Error: unused import in file1.ts");
    expect(result.userPrompt).toContain("<lint_report>");
  });

  it("includes files with lint errors in userPrompt", () => {
    const input = {
      projectPath: "apps/my-server",
      lintReport: "Error: unused import",
      filesWithLintErrors: ["src/file1.ts", "src/file2.ts", "src/utils/helper.ts"],
    };

    const result = lintFixPromptV1.build(input);

    expect(result.userPrompt).toContain("src/file1.ts");
    expect(result.userPrompt).toContain("src/file2.ts");
    expect(result.userPrompt).toContain("src/utils/helper.ts");
    expect(result.userPrompt).toContain("<files_with_lint_errors>");
  });

  it("instructs to fix ONLY lint issues (not TypeScript errors)", () => {
    const input = {
      projectPath: "apps/my-server",
      lintReport: "Error: unused import",
      filesWithLintErrors: ["src/file1.ts"],
    };

    const result = lintFixPromptV1.build(input);

    expect(result.userPrompt).toContain("Fix ONLY the lint errors");
    expect(result.userPrompt).toContain("Do NOT fix TypeScript errors");
    expect(result.userPrompt).toContain("CRITICAL CONSTRAINTS");
  });

  it("includes <lint_fix_result> output format", () => {
    const input = {
      projectPath: "apps/my-server",
      lintReport: "Error: unused import",
      filesWithLintErrors: ["src/file1.ts"],
    };

    const result = lintFixPromptV1.build(input);

    expect(result.userPrompt).toContain("<lint_fix_result>");
    expect(result.userPrompt).toContain("status");
    expect(result.userPrompt).toContain("files_modified");
    expect(result.userPrompt).toContain("summary");
  });
});
