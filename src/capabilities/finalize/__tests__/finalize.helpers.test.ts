/**
 * Tests for finalize helper functions.
 */

import {
  parseXmlBlock,
  parseJsonSafe,
  AUDIT_RESULT_FALLBACK,
  TEST_RESULT_FALLBACK,
  CODEMAP_RESULT_FALLBACK,
  README_RESULT_FALLBACK,
  FINALIZE_COMMIT_RESULT_FALLBACK,
  FINALIZE_PLAN_FALLBACK,
  detectWorkspaces,
} from "../finalize.helpers.js";
import { AuditResultSchema, ReadmeResultSchema } from "../finalize.schema.js";

// ---------------------------------------------------------------------------
// parseXmlBlock tests (re-exported from core/utils)
// ---------------------------------------------------------------------------

describe("parseXmlBlock", () => {
  it("extracts text between valid XML tags", () => {
    const content = "<audit_result>{ \"status\": \"pass\" }</audit_result>";
    const result = parseXmlBlock(content, "audit_result");
    expect(result).toBe("{ \"status\": \"pass\" }");
  });

  it("returns null when tag not found", () => {
    const content = "No XML tags here";
    const result = parseXmlBlock(content, "audit_result");
    expect(result).toBeNull();
  });
});

// ---------------------------------------------------------------------------
// parseJsonSafe tests (re-exported from core/utils)
// ---------------------------------------------------------------------------

describe("parseJsonSafe", () => {
  it("parses valid JSON and validates against schema", () => {
    const jsonString = JSON.stringify({
      status: "pass",
      fixes_applied: 0,
      issues_remaining: 0,
      tsc_passed: true,
      summary: "All good",
    });
    const result = parseJsonSafe(jsonString, AuditResultSchema, AUDIT_RESULT_FALLBACK);
    expect(result.status).toBe("pass");
  });

  it("returns fallback on invalid JSON string", () => {
    const invalidJson = "{ not valid json }";
    const result = parseJsonSafe(invalidJson, AuditResultSchema, AUDIT_RESULT_FALLBACK);
    expect(result).toEqual(AUDIT_RESULT_FALLBACK);
  });
});

// ---------------------------------------------------------------------------
// Fallback constants tests
// ---------------------------------------------------------------------------

describe("Fallback constants", () => {
  it("AUDIT_RESULT_FALLBACK has fail status", () => {
    expect(AUDIT_RESULT_FALLBACK.status).toBe("fail");
    expect(AUDIT_RESULT_FALLBACK.fixes_applied).toBe(0);
    expect(AUDIT_RESULT_FALLBACK.issues_remaining).toBe(0);
    expect(AUDIT_RESULT_FALLBACK.tsc_passed).toBe(false);
    expect(AUDIT_RESULT_FALLBACK.summary).toBe("Failed to parse audit output");
  });

  it("TEST_RESULT_FALLBACK has passed=false", () => {
    expect(TEST_RESULT_FALLBACK.passed).toBe(false);
    expect(TEST_RESULT_FALLBACK.workspaces_tested).toEqual([]);
    expect(TEST_RESULT_FALLBACK.summary).toBe("Failed to parse test output");
  });

  it("CODEMAP_RESULT_FALLBACK has updated=false", () => {
    expect(CODEMAP_RESULT_FALLBACK.updated).toBe(false);
    expect(CODEMAP_RESULT_FALLBACK.codemaps_changed).toEqual([]);
    expect(CODEMAP_RESULT_FALLBACK.summary).toBe("Failed to parse codemap output");
  });

  it("README_RESULT_FALLBACK has correct shape", () => {
    expect(README_RESULT_FALLBACK.updated).toBe(false);
    expect(README_RESULT_FALLBACK.readmes_changed).toEqual([]);
    expect(typeof README_RESULT_FALLBACK.summary).toBe("string");
    expect(README_RESULT_FALLBACK.summary).toBe("Failed to parse readme output");
  });

  it("README_RESULT_FALLBACK conforms to ReadmeResultSchema", () => {
    const result = ReadmeResultSchema.safeParse(README_RESULT_FALLBACK);
    expect(result.success).toBe(true);
  });

  it("FINALIZE_COMMIT_RESULT_FALLBACK has committed=false", () => {
    expect(FINALIZE_COMMIT_RESULT_FALLBACK.committed).toBe(false);
    expect(FINALIZE_COMMIT_RESULT_FALLBACK.commit_sha).toBeNull();
    expect(FINALIZE_COMMIT_RESULT_FALLBACK.commit_message).toBeNull();
    expect(FINALIZE_COMMIT_RESULT_FALLBACK.files_committed).toEqual([]);
  });

  it("FINALIZE_PLAN_FALLBACK has empty arrays", () => {
    expect(FINALIZE_PLAN_FALLBACK.workspaces).toEqual([]);
    expect(FINALIZE_PLAN_FALLBACK.codemap_areas).toEqual([]);
  });
});

// ---------------------------------------------------------------------------
// detectWorkspaces tests
// ---------------------------------------------------------------------------

describe("detectWorkspaces", () => {
  it("extracts unique workspace paths from file paths", () => {
    const files = [
      "apps/my-server/src/index.ts",
      "apps/my-server/src/routes/api.ts",
      "apps/my-client/src/main.ts",
    ];
    const result = detectWorkspaces(files);
    expect(result).toEqual(["apps/my-server", "apps/my-client"]);
  });

  it("handles nested workspace paths", () => {
    const files = [
      "packages/core/src/index.ts",
      "packages/utils/src/helpers.ts",
      "apps/web/src/app.ts",
    ];
    const result = detectWorkspaces(files);
    expect(result).toEqual(["packages/core", "packages/utils", "apps/web"]);
  });

  it("returns empty array for root-level files", () => {
    const files = [
      "README.md",
      "package.json",
      "tsconfig.json",
    ];
    const result = detectWorkspaces(files);
    expect(result).toEqual([]);
  });

  it("handles duplicate workspace paths", () => {
    const files = [
      "apps/my-server/src/index.ts",
      "apps/my-server/src/routes/api.ts",
      "apps/my-server/test/api.test.ts",
    ];
    const result = detectWorkspaces(files);
    expect(result).toEqual(["apps/my-server"]);
  });

  it("handles mixed root and workspace files", () => {
    const files = [
      "README.md",
      "apps/my-server/src/index.ts",
      "packages/utils/src/helpers.ts",
      "tsconfig.json",
    ];
    const result = detectWorkspaces(files);
    expect(result).toEqual(["apps/my-server", "packages/utils"]);
  });

  it("returns empty array for empty input", () => {
    const result = detectWorkspaces([]);
    expect(result).toEqual([]);
  });

  it("detects workspaces from paths with package.json pattern", () => {
    const files = [
      "apps/mcp-ts-engineer/src/index.ts",
      "apps/my-server/src/main.ts",
    ];
    const result = detectWorkspaces(files);
    expect(result).toEqual(["apps/mcp-ts-engineer", "apps/my-server"]);
  });
});
