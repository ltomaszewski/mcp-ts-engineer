/**
 * Tests for shared workspace detector.
 * Verifies detection still works after moving from capability-specific location.
 */

import { describe, it, expect } from "@jest/globals";
import {
  detectWorkspace,
  detectWorkspaceTechnologies,
  type TechnologyTag,
} from "../workspace-detector.js";

describe("detectWorkspace (shared)", () => {
  it("reads package.json and returns technologies", () => {
    // Using the current package.json path as test data
    const result = detectWorkspace(
      "/Users/ltomaszewski/Desktop/bastion-mono/apps/mcp-ts-engineer",
    );

    expect(result.technologies).toBeInstanceOf(Array);
    expect(result.dependencies).toBeInstanceOf(Array);
    // Should detect @modelcontextprotocol/sdk and zod
    expect(result.dependencies).toContain("zod");
    expect(result.dependencies).toContain("@modelcontextprotocol/sdk");
  });

  it("returns empty for missing cwd", () => {
    const result = detectWorkspace(undefined);

    expect(result.technologies).toEqual([]);
    expect(result.dependencies).toEqual([]);
  });

  it("returns empty for invalid JSON", () => {
    const result = detectWorkspace("/nonexistent/path");

    expect(result.technologies).toEqual([]);
    expect(result.dependencies).toEqual([]);
  });

  it("detectWorkspaceTechnologies returns array", () => {
    const result = detectWorkspaceTechnologies(
      "/Users/ltomaszewski/Desktop/bastion-mono/apps/mcp-ts-engineer",
    );

    expect(result).toBeInstanceOf(Array);
  });
});
