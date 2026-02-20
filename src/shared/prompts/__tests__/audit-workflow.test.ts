/**
 * Tests for shared audit workflow prompt builder.
 * Validates file-scoped and project-scoped modes.
 */

import { describe, it, expect } from "@jest/globals";
import {
  AUDIT_WORKFLOW,
  buildAuditUserPrompt,
} from "../audit-workflow.js";

describe("AUDIT_WORKFLOW constant", () => {
  it("contains identity section", () => {
    expect(AUDIT_WORKFLOW).toContain("## Identity");
    expect(AUDIT_WORKFLOW).toContain("You are **AuditAgent**");
  });

  it("contains all workflow phases", () => {
    expect(AUDIT_WORKFLOW).toContain("## Phase 0: Load KB");
    expect(AUDIT_WORKFLOW).toContain("## Phase 1: Load Skills");
    expect(AUDIT_WORKFLOW).toContain("## Phase 2: Scan");
    expect(AUDIT_WORKFLOW).toContain("## Phase 3: Fix & Verify");
    expect(AUDIT_WORKFLOW).toContain("## Phase 4: Report");
  });
});

describe("buildAuditUserPrompt", () => {
  it("produces file-scoped prompt when filesChanged provided", () => {
    const result = buildAuditUserPrompt({
      filesChanged: ["src/file1.ts", "src/file2.ts"],
    });

    expect(result).toContain("Files to audit:");
    expect(result).toContain("- src/file1.ts");
    expect(result).toContain("- src/file2.ts");
    expect(result).toContain("Only audit the files listed above");
    expect(result).not.toContain("Scan all TypeScript files");
  });

  it("produces project-scoped prompt when projectPath provided", () => {
    const result = buildAuditUserPrompt({
      projectPath: "/workspace/apps/bastion-app",
    });

    expect(result).toContain("Scan all TypeScript files");
    expect(result).toContain("/workspace/apps/bastion-app");
    expect(result).not.toContain("Files to audit:");
    expect(result).not.toContain("Only audit the files listed above");
  });

  it("includes 'Scan all TypeScript files' for project scope", () => {
    const result = buildAuditUserPrompt({
      projectPath: "/workspace/apps/test",
    });

    expect(result).toContain("Scan all TypeScript files");
  });

  it("passes cwd through to prompt", () => {
    const result = buildAuditUserPrompt({
      filesChanged: ["src/test.ts"],
      cwd: "/workspace/apps/bastion-server",
    });

    expect(result).toContain("Working directory: /workspace/apps/bastion-server");
  });

  it("returns BuiltPrompt with systemPrompt and userPrompt", () => {
    const result = buildAuditUserPrompt({
      filesChanged: ["test.ts"],
    });

    // Should contain embedded workflow
    expect(result).toContain(AUDIT_WORKFLOW);
    // Should contain user-facing instructions
    expect(result).toContain("Autonomous Mode Overrides");
  });

  it("handles empty filesChanged with projectPath fallback", () => {
    const result = buildAuditUserPrompt({
      filesChanged: [],
      projectPath: "/workspace/apps/fallback",
    });

    expect(result).toContain("Scan all TypeScript files");
    expect(result).toContain("/workspace/apps/fallback");
  });
});
