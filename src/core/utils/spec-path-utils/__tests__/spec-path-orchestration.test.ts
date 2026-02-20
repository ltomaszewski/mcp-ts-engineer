/**
 * Unit tests for spec path orchestration.
 * Tests three-tier correction: deterministic → filesystem → AI.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";
import { join } from "path";
import { ValidationError } from "../../../errors.js";
import type { CapabilityContext } from "../../../capability-registry/capability-registry.types.js";
import type { PathFixStepOutput } from "../spec-path.schema.js";

// ---------------------------------------------------------------------------
// Mock fs before importing (ESM mocking pattern)
// ---------------------------------------------------------------------------
const mockReadFileSync = jest.fn<(path: string, encoding: string) => string>();
const mockWriteFileSync = jest.fn<(path: string, data: string) => void>();
const mockExistsSync = jest.fn<(path: string) => boolean>();

jest.unstable_mockModule("fs", () => ({
  readFileSync: mockReadFileSync,
  writeFileSync: mockWriteFileSync,
  existsSync: mockExistsSync,
  promises: { readFile: jest.fn(), writeFile: jest.fn() },
}));

// Dynamic import after mock setup (required for ESM mocking)
const { validateAndCorrectSpecPaths } = await import(
  "../spec-path-orchestration.js"
);

describe("validateAndCorrectSpecPaths", () => {
  let mockContext: CapabilityContext;
  let mockLogger: any;
  let mockInvokeCapability: jest.Mock<(capabilityName: string, input: unknown) => Promise<unknown>>;

  beforeEach(() => {
    jest.clearAllMocks();

    mockLogger = {
      info: jest.fn(),
      warn: jest.fn(),
      error: jest.fn(),
      debug: jest.fn(),
    };

    mockInvokeCapability = jest.fn<(capabilityName: string, input: unknown) => Promise<unknown>>();

    mockContext = {
      session: {
        id: "test-session",
        state: "active",
        startedAt: "2026-02-05T00:00:00Z",
        invocations: [],
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCost: 0,
      },
      invocation: {
        id: "test-invocation",
        capability: "test_capability",
        input: {},
        timestamp: "2026-02-05T00:00:00Z",
      },
      logger: mockLogger,
      getSessionCost: () => ({ totalCostUsd: 0, totalInputTokens: 0, totalOutputTokens: 0, totalTurns: 0 }),
      promptVersion: "v1",
      providerName: "ClaudeProvider",
      invokeCapability: mockInvokeCapability,
    };
  });

  describe("Tier 1: Deterministic correction", () => {
    it("corrects src/ paths and writes to file", async () => {
      const specContent = "Check `src/components/Button.tsx` file.";
      const correctedContent =
        "Check `apps/test-app/src/components/Button.tsx` file.";

      mockReadFileSync.mockReturnValue(specContent);
      mockWriteFileSync.mockImplementation(() => {});

      await validateAndCorrectSpecPaths(
        "docs/specs/test/feature.md",
        "test-app",
        mockContext
      );

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("docs/specs/test/feature.md"),
        correctedContent
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Path corrected (deterministic)",
        expect.objectContaining({
          original: "src/components/Button.tsx",
          corrected: "apps/test-app/src/components/Button.tsx",
          method: "deterministic",
        })
      );
    });

    it("corrects internal directory paths", async () => {
      const specContent = "Import from `core/utils/index.ts`.";
      const correctedContent = "Import from `apps/test-app/src/core/utils/index.ts`.";

      mockReadFileSync.mockReturnValue(specContent);
      mockWriteFileSync.mockImplementation(() => {});

      await validateAndCorrectSpecPaths(
        "docs/specs/test/feature.md",
        "test-app",
        mockContext
      );

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("docs/specs/test/feature.md"),
        correctedContent
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Path corrected (deterministic)",
        expect.objectContaining({
          original: "core/utils/index.ts",
          corrected: "apps/test-app/src/core/utils/index.ts",
          method: "deterministic",
        })
      );
    });

    it("does not invoke AI when all paths are correctable", async () => {
      const specContent = "Check `src/Button.tsx` and `core/utils/index.ts`.";

      mockReadFileSync.mockReturnValue(specContent);
      mockWriteFileSync.mockImplementation(() => {});

      await validateAndCorrectSpecPaths(
        "docs/specs/test/feature.md",
        "test-app",
        mockContext
      );

      expect(mockInvokeCapability).not.toHaveBeenCalled();
    });
  });

  describe("Tier 2: Filesystem check", () => {
    it("corrects path when file exists at apps/{target}/src/{path}", async () => {
      const specContent = "Import from `unknown/file.ts`.";

      mockReadFileSync.mockReturnValue(specContent);
      mockExistsSync.mockImplementation((filePath) => {
        return filePath.toString().includes("apps/test-app/src/unknown/file.ts");
      });
      mockWriteFileSync.mockImplementation(() => {});

      await validateAndCorrectSpecPaths(
        "docs/specs/test/feature.md",
        "test-app",
        mockContext,
        "/Users/dev/project"
      );

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("docs/specs/test/feature.md"),
        "Import from `apps/test-app/src/unknown/file.ts`."
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Path corrected (filesystem check)",
        expect.objectContaining({
          original: "unknown/file.ts",
          corrected: "apps/test-app/src/unknown/file.ts",
          method: "filesystem",
        })
      );
    });

    it("skips correction when file does not exist", async () => {
      const specContent = "Import from `nonexistent/file.ts`.";

      mockReadFileSync.mockReturnValue(specContent);
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      // Mock AI to return FAILED
      const failedOutput: PathFixStepOutput = {
        status: "FAILED",
        corrections: [],
        remaining_uncorrectable: ["nonexistent/file.ts"],
        corrected_content: specContent,
      };
      mockInvokeCapability.mockResolvedValue(failedOutput);

      await expect(
        validateAndCorrectSpecPaths(
          "docs/specs/test/feature.md",
          "test-app",
          mockContext
        )
      ).rejects.toThrow(ValidationError);

      // Filesystem check should not log correction
      expect(mockLogger.info).not.toHaveBeenCalledWith(
        "Path corrected (filesystem check)",
        expect.anything()
      );
    });
  });

  describe("Tier 3: AI-assisted correction", () => {
    it("invokes AI when deterministic and filesystem checks fail", async () => {
      const specContent = "Import from `unknown/path.ts`.";

      mockReadFileSync.mockReturnValue(specContent);
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const aiOutput: PathFixStepOutput = {
        status: "SUCCESS",
        corrections: [
          {
            original: "unknown/path.ts",
            corrected: "apps/test-app/src/modules/unknown/path.ts",
            confidence: "high",
          },
        ],
        remaining_uncorrectable: [],
        corrected_content: "Import from `apps/test-app/src/modules/unknown/path.ts`.",
      };

      mockInvokeCapability.mockResolvedValue(aiOutput);

      await validateAndCorrectSpecPaths(
        "docs/specs/test/feature.md",
        "test-app",
        mockContext,
        "/Users/dev/project"
      );

      expect(mockInvokeCapability).toHaveBeenCalledWith(
        "todo_path_fix_step",
        expect.objectContaining({
          spec_path: "docs/specs/test/feature.md",
          target_app: "test-app",
          uncorrectable_paths: ["unknown/path.ts"],
          cwd: "/Users/dev/project",
        })
      );

      expect(mockWriteFileSync).toHaveBeenCalledWith(
        expect.stringContaining("docs/specs/test/feature.md"),
        aiOutput.corrected_content
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Path corrected (AI)",
        expect.objectContaining({
          original: "unknown/path.ts",
          corrected: "apps/test-app/src/modules/unknown/path.ts",
          confidence: "high",
          method: "ai",
        })
      );
    });

    it("handles PARTIAL status with remaining uncorrectable", async () => {
      const specContent = "Import `/absolute/path1.ts` and `/absolute/path2.ts`.";

      mockReadFileSync.mockReturnValue(specContent);
      mockExistsSync.mockReturnValue(false);
      mockWriteFileSync.mockImplementation(() => {});

      const aiOutput: PathFixStepOutput = {
        status: "PARTIAL",
        corrections: [
          {
            original: "/absolute/path1.ts",
            corrected: "apps/test-app/src/path1.ts",
            confidence: "medium",
          },
        ],
        remaining_uncorrectable: ["/absolute/path2.ts"],
        corrected_content: "Import `apps/test-app/src/path1.ts` and `/absolute/path2.ts`.",
      };

      mockInvokeCapability.mockResolvedValue(aiOutput);

      await expect(
        validateAndCorrectSpecPaths(
          "docs/specs/test/feature.md",
          "test-app",
          mockContext
        )
      ).rejects.toThrow(ValidationError);
      await expect(
        validateAndCorrectSpecPaths(
          "docs/specs/test/feature.md",
          "test-app",
          mockContext
        )
      ).rejects.toThrow("Invalid paths in spec: /absolute/path2.ts");

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Path corrected (AI)",
        expect.objectContaining({
          original: "/absolute/path1.ts",
          method: "ai",
        })
      );
    });

    it("handles FAILED status and throws ValidationError", async () => {
      const specContent = "Import from `unknown/path.ts`.";

      mockReadFileSync.mockReturnValue(specContent);
      mockExistsSync.mockReturnValue(false);

      const aiOutput: PathFixStepOutput = {
        status: "FAILED",
        corrections: [],
        remaining_uncorrectable: ["unknown/path.ts"],
        corrected_content: specContent,
      };

      mockInvokeCapability.mockResolvedValue(aiOutput);

      await expect(
        validateAndCorrectSpecPaths(
          "docs/specs/test/feature.md",
          "test-app",
          mockContext
        )
      ).rejects.toThrow(ValidationError);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "AI path fix returned FAILED status",
        expect.objectContaining({
          remaining: ["unknown/path.ts"],
        })
      );
    });

    it("handles AI exception and throws original ValidationError", async () => {
      const specContent = "Import from `unknown/path.ts`.";

      mockReadFileSync.mockReturnValue(specContent);
      mockExistsSync.mockReturnValue(false);

      const aiError = new Error("AI service unavailable");
      mockInvokeCapability.mockRejectedValue(aiError);

      await expect(
        validateAndCorrectSpecPaths(
          "docs/specs/test/feature.md",
          "test-app",
          mockContext
        )
      ).rejects.toThrow(ValidationError);

      expect(mockLogger.warn).toHaveBeenCalledWith(
        "AI path fix failed with exception",
        expect.objectContaining({
          error: "AI service unavailable",
        })
      );
    });

    it("logs AI invocation with remaining paths", async () => {
      const specContent = "Import from `unknown/path.ts`.";

      mockReadFileSync.mockReturnValue(specContent);
      mockExistsSync.mockReturnValue(false);

      mockInvokeCapability.mockResolvedValue({
        status: "SUCCESS",
        corrections: [
          {
            original: "unknown/path.ts",
            corrected: "apps/test-app/src/unknown/path.ts",
            confidence: "high",
          },
        ],
        remaining_uncorrectable: [],
        corrected_content: "Corrected",
      });

      await validateAndCorrectSpecPaths(
        "docs/specs/test/feature.md",
        "test-app",
        mockContext
      );

      expect(mockLogger.info).toHaveBeenCalledWith(
        "Invoking AI path fix step",
        expect.objectContaining({
          remaining_count: 1,
          remaining_paths: ["unknown/path.ts"],
        })
      );
    });
  });

  describe("edge cases", () => {
    it("throws ValidationError when spec file cannot be read", async () => {
      mockReadFileSync.mockImplementation(() => {
        throw new Error("File not found");
      });

      await expect(
        validateAndCorrectSpecPaths(
          "nonexistent/spec.md",
          "test-app",
          mockContext
        )
      ).rejects.toThrow(ValidationError);
      await expect(
        validateAndCorrectSpecPaths(
          "nonexistent/spec.md",
          "test-app",
          mockContext
        )
      ).rejects.toThrow("Failed to read spec file");
    });

    it("handles spec with no paths", async () => {
      const specContent = "# Feature\n\nNo file paths in this spec.";

      mockReadFileSync.mockReturnValue(specContent);

      await validateAndCorrectSpecPaths(
        "docs/specs/test/feature.md",
        "test-app",
        mockContext
      );

      // No corrections needed, no writes
      expect(mockWriteFileSync).not.toHaveBeenCalled();
      expect(mockInvokeCapability).not.toHaveBeenCalled();
    });

    it("handles spec with only valid paths", async () => {
      const specContent = "Check `apps/test-app/src/main.ts` and `docs/README.md`.";

      mockReadFileSync.mockReturnValue(specContent);

      await validateAndCorrectSpecPaths(
        "docs/specs/test/feature.md",
        "test-app",
        mockContext
      );

      expect(mockWriteFileSync).not.toHaveBeenCalled();
      expect(mockInvokeCapability).not.toHaveBeenCalled();
    });

    it("uses default cwd when not provided", async () => {
      const specContent = "Import `src/main.ts`.";

      mockReadFileSync.mockReturnValue(specContent);
      mockWriteFileSync.mockImplementation(() => {});

      await validateAndCorrectSpecPaths(
        "docs/specs/test/feature.md",
        "test-app",
        mockContext
      );

      // Should use process.cwd() internally
      expect(mockReadFileSync).toHaveBeenCalledWith(
        join(process.cwd(), "docs/specs/test/feature.md"),
        "utf-8"
      );
    });
  });
});
