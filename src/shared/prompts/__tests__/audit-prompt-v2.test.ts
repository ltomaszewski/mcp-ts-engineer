/**
 * Tests for shared audit prompt builder.
 * Validates spec mode and scan mode behaviors.
 */

import { describe, it, expect } from "@jest/globals";
import { buildAuditPromptV2, type AuditPromptInput } from "../audit-prompt.v2.js";
import { REVIEW_CONTEXT_APPEND_PROMPT } from "../review-context.js";

describe("shared audit prompt builder", () => {
  it("spec mode matches existing PhaseAuditV2 prompt output", () => {
    const input: AuditPromptInput = {
      mode: "spec",
      specPath: "docs/specs/test.md",
      phaseNumber: 1,
      filesModified: ["src/test.ts"],
      engSummary: "Implemented feature X",
      detectedTechnologies: ["react-native"],
      detectedDependencies: ["react-native"],
    };

    const result = buildAuditPromptV2(input);

    expect(result.userPrompt).toContain("You are a code auditor");
    expect(result.userPrompt).toContain("<spec_path>docs/specs/test.md</spec_path>");
    expect(result.userPrompt).toContain("<phase_number>1</phase_number>");
    expect(result.userPrompt).toContain("src/test.ts");
    expect(result.userPrompt).toContain("Implemented feature X");
  });

  it("scan mode includes project path", () => {
    const input: AuditPromptInput = {
      mode: "scan",
      projectPath: "/workspace/apps/bastion-server",
      detectedTechnologies: ["nestjs"],
    };

    const result = buildAuditPromptV2(input);

    expect(result.userPrompt).toContain("/workspace/apps/bastion-server");
  });

  it("scan mode excludes spec-specific fields", () => {
    const input: AuditPromptInput = {
      mode: "scan",
      projectPath: "/workspace/apps/test",
      // These should be ignored:
      specPath: "should-not-appear.md",
      phaseNumber: 999,
      filesModified: ["should-not-appear.ts"],
      engSummary: "Should not appear",
    };

    const result = buildAuditPromptV2(input);

    expect(result.userPrompt).not.toContain("should-not-appear.md");
    expect(result.userPrompt).not.toContain("999");
    expect(result.userPrompt).not.toContain("should-not-appear.ts");
    expect(result.userPrompt).not.toContain("Should not appear");
  });

  it("includes detected technologies", () => {
    const input: AuditPromptInput = {
      mode: "spec",
      specPath: "test.md",
      phaseNumber: 1,
      filesModified: [],
      engSummary: "Summary",
      detectedTechnologies: ["react-native", "expo"],
      detectedDependencies: ["react-native", "expo"],
    };

    const result = buildAuditPromptV2(input);

    // Should include skill loading for technologies
    expect(result.userPrompt.length).toBeGreaterThan(0);
  });

  it("system prompt append includes REVIEW_CONTEXT", () => {
    const input: AuditPromptInput = {
      mode: "spec",
      specPath: "test.md",
      phaseNumber: 1,
      filesModified: [],
      engSummary: "Summary",
    };

    const result = buildAuditPromptV2(input);

    expect(result.systemPrompt?.append).toContain(REVIEW_CONTEXT_APPEND_PROMPT);
  });

  it("both modes return valid BuiltPrompt", () => {
    const specInput: AuditPromptInput = {
      mode: "spec",
      specPath: "test.md",
      phaseNumber: 1,
      filesModified: [],
      engSummary: "Summary",
    };

    const scanInput: AuditPromptInput = {
      mode: "scan",
      projectPath: "/workspace",
    };

    const specResult = buildAuditPromptV2(specInput);
    const scanResult = buildAuditPromptV2(scanInput);

    expect(specResult.userPrompt).toBeTruthy();
    expect(specResult.systemPrompt).toBeTruthy();
    expect(scanResult.userPrompt).toBeTruthy();
    expect(scanResult.systemPrompt).toBeTruthy();
  });
});
