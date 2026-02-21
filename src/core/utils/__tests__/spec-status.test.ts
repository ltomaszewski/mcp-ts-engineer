/**
 * Tests for updateSpecStatus helper.
 */

import { writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { updateSpecStatus } from "../spec-status.js";

describe("updateSpecStatus", () => {
  const testDir = join(process.cwd(), ".tmp-spec-status-test");
  const testFile = join(testDir, "test-spec.md");

  beforeEach(async () => {
    await mkdir(testDir, { recursive: true });
  });

  afterEach(async () => {
    await rm(testDir, { recursive: true, force: true });
  });

  it("replaces bold Status X with Y", async () => {
    const content = `# Test Spec\n\n**Status**: IN_REVIEW\n\nSome content.`;
    await writeFile(testFile, content, "utf8");

    const result = await updateSpecStatus(testFile, "IN_REVIEW", "READY");

    expect(result).toBe(true);
    const updated = await readFile(testFile, "utf8");
    expect(updated).toContain("**Status**: READY");
    expect(updated).not.toContain("**Status**: IN_REVIEW");
  });

  it("replaces plain Status X with Y", async () => {
    const content = `# Test Spec\n\nStatus: READY\n\nSome content.`;
    await writeFile(testFile, content, "utf8");

    const result = await updateSpecStatus(testFile, "READY", "IMPLEMENTED");

    expect(result).toBe(true);
    const updated = await readFile(testFile, "utf8");
    expect(updated).toContain("Status: IMPLEMENTED");
    expect(updated).not.toContain("Status: READY");
  });

  it("returns false when fromStatus not found", async () => {
    const content = `# Test Spec\n\n**Status**: READY\n\nSome content.`;
    await writeFile(testFile, content, "utf8");

    const result = await updateSpecStatus(testFile, "BLOCKED", "READY");

    expect(result).toBe(false);
    const updated = await readFile(testFile, "utf8");
    expect(updated).toBe(content); // Content unchanged
  });

  it("does not modify other content", async () => {
    const content = `# Test Spec\n\n**Status**: IN_REVIEW\n\nThis is a test.\nStatus in the middle: BLOCKED\nMore content.`;
    await writeFile(testFile, content, "utf8");

    const result = await updateSpecStatus(testFile, "IN_REVIEW", "READY");

    expect(result).toBe(true);
    const updated = await readFile(testFile, "utf8");
    expect(updated).toContain("**Status**: READY");
    expect(updated).toContain("This is a test.");
    expect(updated).toContain("Status in the middle: BLOCKED");
    expect(updated).toContain("More content.");
  });

  it("handles absolute paths with cwd", async () => {
    const content = `# Test Spec\n\n**Status**: DRAFT\n\nContent.`;
    await writeFile(testFile, content, "utf8");

    const relativePath = "test-spec.md";
    const result = await updateSpecStatus(relativePath, "DRAFT", "IN_REVIEW", testDir);

    expect(result).toBe(true);
    const updated = await readFile(testFile, "utf8");
    expect(updated).toContain("**Status**: IN_REVIEW");
  });

  it("works for any fromStatus/toStatus pair", async () => {
    // DRAFT → IN_REVIEW
    await writeFile(testFile, `**Status**: DRAFT`, "utf8");
    let result = await updateSpecStatus(testFile, "DRAFT", "IN_REVIEW");
    expect(result).toBe(true);
    let content = await readFile(testFile, "utf8");
    expect(content).toContain("**Status**: IN_REVIEW");

    // IN_REVIEW → READY
    result = await updateSpecStatus(testFile, "IN_REVIEW", "READY");
    expect(result).toBe(true);
    content = await readFile(testFile, "utf8");
    expect(content).toContain("**Status**: READY");

    // READY → IMPLEMENTED
    result = await updateSpecStatus(testFile, "READY", "IMPLEMENTED");
    expect(result).toBe(true);
    content = await readFile(testFile, "utf8");
    expect(content).toContain("**Status**: IMPLEMENTED");
  });

  it("handles multiple occurrences of the status pattern", async () => {
    const content = `# Test Spec\n\n**Status**: IN_REVIEW\n\nSome text Status: IN_REVIEW again\n\n**Status**: IN_REVIEW`;
    await writeFile(testFile, content, "utf8");

    const result = await updateSpecStatus(testFile, "IN_REVIEW", "READY");

    expect(result).toBe(true);
    const updated = await readFile(testFile, "utf8");
    // All bold instances should be replaced
    expect(updated).not.toContain("**Status**: IN_REVIEW");
    expect(updated).toContain("**Status**: READY");
  });
});
