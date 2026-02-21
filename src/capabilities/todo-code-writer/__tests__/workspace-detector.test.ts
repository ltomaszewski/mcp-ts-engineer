import { vi } from "vitest";
/**
 * Tests for workspace technology detection.
 * Verifies AC-3.1 through AC-3.9.
 */


// ---------------------------------------------------------------------------
// Mock fs before importing the module under test (ESM mocking)
// ---------------------------------------------------------------------------
const { mockReadFileSync } = vi.hoisted(() => ({
  mockReadFileSync: vi.fn<(path: string, encoding: string) => string>(),
}));

vi.mock("fs", () => ({
  readFileSync: mockReadFileSync,
}));

// Dynamic import after mock setup (required for ESM mocking)
const { detectWorkspace, detectWorkspaceTechnologies } = await import(
  "../workspace-detector.js"
);

// ---------------------------------------------------------------------------
// Test helpers
// ---------------------------------------------------------------------------

function mockPackageJson(content: Record<string, unknown>): void {
  mockReadFileSync.mockReturnValue(JSON.stringify(content));
}

beforeEach(() => {
  vi.clearAllMocks();
});

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("detectWorkspace", () => {
  describe("technology detection", () => {
    it("detects react-native from dependencies (AC-3.3)", () => {
      mockPackageJson({ dependencies: { "react-native": "0.74.0", react: "18.0.0" } });
      const result = detectWorkspace("/some/path");
      expect(result.technologies).toContain("react-native");
    });

    it("detects react when react-native is NOT present (AC-3.4)", () => {
      mockPackageJson({ dependencies: { react: "18.0.0" } });
      const result = detectWorkspace("/some/path");
      expect(result.technologies).toContain("react");
      expect(result.technologies).not.toContain("react-native");
    });

    it("does NOT include standalone react tag when react-native is present", () => {
      mockPackageJson({ dependencies: { "react-native": "0.74.0", react: "18.0.0" } });
      const result = detectWorkspace("/some/path");
      expect(result.technologies).toContain("react-native");
      expect(result.technologies).not.toContain("react");
    });

    it("detects nestjs from @nestjs/core (AC-3.5)", () => {
      mockPackageJson({ dependencies: { "@nestjs/core": "11.0.0" } });
      const result = detectWorkspace("/some/path");
      expect(result.technologies).toContain("nestjs");
    });

    it("detects expo from dependencies (AC-3.6)", () => {
      mockPackageJson({ dependencies: { expo: "51.0.0" } });
      const result = detectWorkspace("/some/path");
      expect(result.technologies).toContain("expo");
    });

    it("detects tanstack-query from @tanstack/react-query", () => {
      mockPackageJson({ dependencies: { "@tanstack/react-query": "5.0.0" } });
      const result = detectWorkspace("/some/path");
      expect(result.technologies).toContain("tanstack-query");
    });

    it("detects zustand", () => {
      mockPackageJson({ dependencies: { zustand: "4.0.0" } });
      const result = detectWorkspace("/some/path");
      expect(result.technologies).toContain("zustand");
    });
  });

  describe("dependencies field (AC-3.9)", () => {
    it("checks both dependencies and devDependencies", () => {
      mockPackageJson({ devDependencies: { "@nestjs/core": "11.0.0" } });
      const result = detectWorkspace("/some/path");
      expect(result.technologies).toContain("nestjs");
    });

    it("returns raw dependency names from both deps and devDeps", () => {
      mockPackageJson({
        dependencies: { axios: "1.0.0", expo: "51.0.0" },
        devDependencies: { jest: "29.0.0" },
      });
      const result = detectWorkspace("/some/path");
      expect(result.dependencies).toContain("axios");
      expect(result.dependencies).toContain("expo");
      expect(result.dependencies).toContain("jest");
    });

    it("deduplicates dependencies appearing in both deps and devDeps", () => {
      mockPackageJson({
        dependencies: { typescript: "5.0.0" },
        devDependencies: { typescript: "5.0.0" },
      });
      const result = detectWorkspace("/some/path");
      const tsCount = result.dependencies.filter((d) => d === "typescript").length;
      expect(tsCount).toBe(1);
    });
  });

  describe("reads correct path (AC-3.2)", () => {
    it("reads package.json at the cwd path", () => {
      mockPackageJson({ dependencies: {} });
      detectWorkspace("/my/workspace");
      expect(mockReadFileSync).toHaveBeenCalledWith(
        expect.stringContaining("/my/workspace/package.json"),
        "utf-8",
      );
    });
  });

  describe("error handling", () => {
    it("returns empty arrays for undefined cwd (AC-3.7)", () => {
      const result = detectWorkspace(undefined);
      expect(result.technologies).toEqual([]);
      expect(result.dependencies).toEqual([]);
    });

    it("returns empty arrays when package.json is unreadable (AC-3.7)", () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("ENOENT: no such file");
      });
      const result = detectWorkspace("/nonexistent");
      expect(result.technologies).toEqual([]);
      expect(result.dependencies).toEqual([]);
    });

    it("returns empty arrays for malformed package.json (AC-3.8)", () => {
      mockReadFileSync.mockReturnValue("not valid json {{{");
      const result = detectWorkspace("/some/path");
      expect(result.technologies).toEqual([]);
      expect(result.dependencies).toEqual([]);
    });

    it("returns empty arrays for empty package.json {} (EC-2)", () => {
      mockPackageJson({});
      const result = detectWorkspace("/some/path");
      expect(result.technologies).toEqual([]);
      expect(result.dependencies).toEqual([]);
    });
  });

  describe("mixed technologies (EC-3)", () => {
    it("detects both react-native and nestjs when both present", () => {
      mockPackageJson({
        dependencies: {
          "react-native": "0.74.0",
          react: "18.0.0",
          "@nestjs/core": "11.0.0",
        },
      });
      const result = detectWorkspace("/some/path");
      expect(result.technologies).toContain("react-native");
      expect(result.technologies).toContain("nestjs");
    });
  });
});

describe("detectWorkspaceTechnologies (legacy compat)", () => {
  it("returns technologies array from detectWorkspace", () => {
    mockPackageJson({ dependencies: { "@nestjs/core": "11.0.0" } });
    const result = detectWorkspaceTechnologies("/some/path");
    expect(result).toContain("nestjs");
  });

  it("returns empty array for undefined cwd", () => {
    expect(detectWorkspaceTechnologies(undefined)).toEqual([]);
  });
});
