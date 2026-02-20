/**
 * Tests for git utility functions.
 */

import { describe, it, expect, jest, beforeEach } from "@jest/globals";

// ---------------------------------------------------------------------------
// Mock child_process before importing the module under test (ESM mocking)
// ---------------------------------------------------------------------------
const mockExecSync = jest.fn<(cmd: string, opts: unknown) => Buffer>();

jest.unstable_mockModule("node:child_process", () => ({
  execSync: mockExecSync,
}));

// Dynamic import after mock setup (required for ESM mocking)
const { hasUncommittedChanges, isFileTracked, fileNeedsCommit } = await import(
  "../git-utils.js"
);

beforeEach(() => {
  jest.clearAllMocks();
});

describe("git-utils", () => {
  describe("hasUncommittedChanges", () => {
    it("returns false when file has no changes (both git diff commands succeed)", () => {
      // Both commands succeed = no changes
      mockExecSync.mockReturnValue(Buffer.from(""));

      const result = hasUncommittedChanges("test.md");

      expect(result).toBe(false);
      expect(mockExecSync).toHaveBeenCalledTimes(2);
    });

    it("returns true when file has unstaged changes (first git diff fails)", () => {
      // First call (unstaged) fails
      mockExecSync.mockImplementationOnce(() => {
        throw new Error("exit code 1");
      });

      const result = hasUncommittedChanges("test.md");

      expect(result).toBe(true);
      expect(mockExecSync).toHaveBeenCalledTimes(1);
    });

    it("returns true when file has staged changes (second git diff fails)", () => {
      // First call (unstaged) succeeds
      mockExecSync.mockReturnValueOnce(Buffer.from(""));
      // Second call (staged) fails
      mockExecSync.mockImplementationOnce(() => {
        throw new Error("exit code 1");
      });

      const result = hasUncommittedChanges("test.md");

      expect(result).toBe(true);
      expect(mockExecSync).toHaveBeenCalledTimes(2);
    });

    it("uses provided cwd for git operations", () => {
      mockExecSync.mockReturnValue(Buffer.from(""));

      hasUncommittedChanges("test.md", "/custom/path");

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining("git diff --quiet"),
        expect.objectContaining({ cwd: "/custom/path" }),
      );
    });
  });

  describe("isFileTracked", () => {
    it("returns true when file is tracked", () => {
      mockExecSync.mockReturnValue(Buffer.from("test.md"));

      const result = isFileTracked("test.md");

      expect(result).toBe(true);
      expect(mockExecSync).toHaveBeenCalledWith(
        expect.stringContaining("git ls-files --error-unmatch"),
        expect.any(Object),
      );
    });

    it("returns false when file is not tracked", () => {
      mockExecSync.mockImplementation(() => {
        throw new Error("exit code 1");
      });

      const result = isFileTracked("untracked.md");

      expect(result).toBe(false);
    });

    it("uses provided cwd for git operations", () => {
      mockExecSync.mockReturnValue(Buffer.from(""));

      isFileTracked("test.md", "/custom/path");

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ cwd: "/custom/path" }),
      );
    });
  });

  describe("fileNeedsCommit", () => {
    it("returns true when file has uncommitted changes", () => {
      // hasUncommittedChanges returns true (first diff fails)
      mockExecSync.mockImplementationOnce(() => {
        throw new Error("exit code 1");
      });

      const result = fileNeedsCommit("test.md");

      expect(result).toBe(true);
    });

    it("returns true when file is untracked (new file)", () => {
      // hasUncommittedChanges returns false (both diffs succeed)
      mockExecSync
        .mockReturnValueOnce(Buffer.from("")) // unstaged diff
        .mockReturnValueOnce(Buffer.from("")); // staged diff

      // isFileTracked returns false (ls-files fails)
      mockExecSync.mockImplementationOnce(() => {
        throw new Error("exit code 1");
      });

      const result = fileNeedsCommit("new-file.md");

      expect(result).toBe(true);
    });

    it("returns false when file is clean and tracked", () => {
      // hasUncommittedChanges returns false
      mockExecSync
        .mockReturnValueOnce(Buffer.from("")) // unstaged diff
        .mockReturnValueOnce(Buffer.from("")); // staged diff

      // isFileTracked returns true
      mockExecSync.mockReturnValueOnce(Buffer.from("test.md"));

      const result = fileNeedsCommit("test.md");

      expect(result).toBe(false);
    });

    it("uses provided cwd", () => {
      // Make all checks pass (clean file)
      mockExecSync
        .mockReturnValueOnce(Buffer.from(""))
        .mockReturnValueOnce(Buffer.from(""))
        .mockReturnValueOnce(Buffer.from("test.md"));

      fileNeedsCommit("test.md", "/custom/path");

      expect(mockExecSync).toHaveBeenCalledWith(
        expect.any(String),
        expect.objectContaining({ cwd: "/custom/path" }),
      );
    });
  });
});
