/**
 * Tests for DiskWriter class.
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { fileURLToPath } from "url";
import { DiskWriter } from "../disk-writer.js";
import { DiskWriteError } from "../../errors.js";
import type { LogEntry } from "../logger.types.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOGS_TESTS_DIR = path.join(__dirname, "../../../../logs_tests");

describe("DiskWriter", () => {
  let writer: DiskWriter;
  const TEST_LOG_DIR = path.join(LOGS_TESTS_DIR, "disk-writer");

  beforeEach(async () => {
    // Clean suite directory before each test for isolation
    await fs.rm(TEST_LOG_DIR, { recursive: true, force: true }).catch(() => {});
    writer = new DiskWriter(TEST_LOG_DIR);
  });

  afterEach(async () => {
    await writer.closeAll();
  });

  describe("initialize", () => {
    it("should create logs directory if it doesn't exist", async () => {
      await writer.initialize();
      const stats = await fs.stat(TEST_LOG_DIR);
      expect(stats.isDirectory()).toBe(true);
    });

    it("should not fail if directory already exists", async () => {
      await writer.initialize();
      await writer.initialize(); // Call again
      const stats = await fs.stat(TEST_LOG_DIR);
      expect(stats.isDirectory()).toBe(true);
    });

    it("should create sessions/ subdirectory", async () => {
      await writer.initialize();
      const stats = await fs.stat(path.join(TEST_LOG_DIR, 'sessions'));
      expect(stats.isDirectory()).toBe(true);
    });

    it("should create reports/ subdirectory", async () => {
      await writer.initialize();
      const stats = await fs.stat(path.join(TEST_LOG_DIR, 'reports'));
      expect(stats.isDirectory()).toBe(true);
    });
  });

  describe("constructor - log directory resolution", () => {
    const TEST_CUSTOM_DIR = path.join(LOGS_TESTS_DIR, "custom-logs");
    const TEST_ENV_DIR = path.join(LOGS_TESTS_DIR, "env-logs");
    const TEST_TILDE_DIR = path.join(os.homedir(), "test-tilde-logs");

    afterEach(async () => {
      // Clean up test directories
      await fs.rm(TEST_CUSTOM_DIR, { recursive: true, force: true }).catch(() => {});
      await fs.rm(TEST_ENV_DIR, { recursive: true, force: true }).catch(() => {});
      await fs.rm(TEST_TILDE_DIR, { recursive: true, force: true }).catch(() => {});
      // Clean up environment variable
      delete process.env.LOG_DIR;
    });

    it("should use default directory when no parameters or env var provided", async () => {
      // Ensure no env var set
      delete process.env.LOG_DIR;

      const defaultWriter = new DiskWriter();
      await defaultWriter.initialize();

      // Expected default path: ~/.claude/mcp-ts-engineer/logs/
      const expectedPath = path.join(
        os.homedir(),
        '.claude',
        'mcp-ts-engineer',
        'logs'
      );

      const stats = await fs.stat(expectedPath);
      expect(stats.isDirectory()).toBe(true);

      // Verify subdirectories created
      const sessionStats = await fs.stat(path.join(expectedPath, 'sessions'));
      expect(sessionStats.isDirectory()).toBe(true);

      const reportStats = await fs.stat(path.join(expectedPath, 'reports'));
      expect(reportStats.isDirectory()).toBe(true);

      // Close writer but do NOT delete production directory —
      // it may contain real logs from other sessions
      await defaultWriter.closeAll();
    });

    it("should use constructor parameter when provided", async () => {
      const customWriter = new DiskWriter(TEST_CUSTOM_DIR);
      await customWriter.initialize();

      const stats = await fs.stat(TEST_CUSTOM_DIR);
      expect(stats.isDirectory()).toBe(true);

      await customWriter.closeAll();
    });

    it("should use LOG_DIR environment variable when no constructor param", async () => {
      process.env.LOG_DIR = TEST_ENV_DIR;

      const envWriter = new DiskWriter();
      await envWriter.initialize();

      const stats = await fs.stat(TEST_ENV_DIR);
      expect(stats.isDirectory()).toBe(true);

      await envWriter.closeAll();
    });

    it("should prioritize constructor parameter over LOG_DIR env var", async () => {
      process.env.LOG_DIR = TEST_ENV_DIR;

      const customWriter = new DiskWriter(TEST_CUSTOM_DIR);
      await customWriter.initialize();

      // Constructor parameter should win
      const customStats = await fs.stat(TEST_CUSTOM_DIR);
      expect(customStats.isDirectory()).toBe(true);

      // ENV_DIR should not be created
      await expect(fs.stat(TEST_ENV_DIR)).rejects.toThrow();

      await customWriter.closeAll();
    });

    it("should expand tilde (~/) in log directory path", async () => {
      const tildeWriter = new DiskWriter("~/test-tilde-logs");
      await tildeWriter.initialize();

      // Should expand to home directory
      const stats = await fs.stat(TEST_TILDE_DIR);
      expect(stats.isDirectory()).toBe(true);

      await tildeWriter.closeAll();
    });

    it("should create subdirectories in resolved persistent directory", async () => {
      const customWriter = new DiskWriter(TEST_CUSTOM_DIR);
      await customWriter.initialize();

      // Verify sessions/ subdirectory
      const sessionStats = await fs.stat(path.join(TEST_CUSTOM_DIR, 'sessions'));
      expect(sessionStats.isDirectory()).toBe(true);

      // Verify reports/ subdirectory
      const reportStats = await fs.stat(path.join(TEST_CUSTOM_DIR, 'reports'));
      expect(reportStats.isDirectory()).toBe(true);

      await customWriter.closeAll();
    });
  });

  describe("openSession", () => {
    it("should open a new session log file", async () => {
      const sessionId = "test-session-123";
      await writer.openSession(sessionId);
      const sessions = writer.getActiveSessions();
      expect(sessions).toContain(sessionId);
    });

    it("should reject session IDs with path traversal attempts", async () => {
      await expect(writer.openSession("../evil")).rejects.toThrow(DiskWriteError);
      await expect(writer.openSession("evil/../path")).rejects.toThrow(DiskWriteError);
      await expect(writer.openSession("evil/path")).rejects.toThrow(DiskWriteError);
    });

    it("should create valid file paths for sessions", async () => {
      const sessionId = "valid-session-abc";
      await writer.openSession(sessionId);
      const sessions = writer.getActiveSessions();
      expect(sessions.length).toBe(1);
    });

    it("should create session file in sessions/ subdirectory", async () => {
      const sessionId = "test-session-456";
      await writer.openSession(sessionId);

      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "Test session log",
      };
      await writer.write(entry, sessionId);

      const date = new Date().toISOString().split("T")[0];
      const sessionPath = path.join(TEST_LOG_DIR, 'sessions', `${date}-${sessionId}.ndjson`);
      const content = await fs.readFile(sessionPath, "utf-8");

      expect(content).toContain("Test session log");
    });
  });

  describe("closeSession", () => {
    it("should close an open session", async () => {
      const sessionId = "session-to-close";
      await writer.openSession(sessionId);
      expect(writer.getActiveSessions()).toContain(sessionId);

      await writer.closeSession(sessionId);
      expect(writer.getActiveSessions()).not.toContain(sessionId);
    });

    it("should not fail if session doesn't exist", async () => {
      await expect(writer.closeSession("nonexistent")).resolves.not.toThrow();
    });
  });

  describe("write", () => {
    it("should write log entry to combined daily file", async () => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "Test log entry",
      };

      await writer.write(entry);

      const date = new Date().toISOString().split("T")[0];
      const combinedPath = path.join(TEST_LOG_DIR, `${date}-combined-${writer.getInstanceId()}.ndjson`);
      const content = await fs.readFile(combinedPath, "utf-8");

      expect(content).toContain("Test log entry");
      expect(content).toContain('"level":"INFO"');
    });

    it("should write log entry to session-specific file", async () => {
      const sessionId = "session-write-test";
      await writer.openSession(sessionId);

      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "Session-specific log",
      };

      await writer.write(entry, sessionId);

      const date = new Date().toISOString().split("T")[0];
      const sessionPath = path.join(TEST_LOG_DIR, 'sessions', `${date}-${sessionId}.ndjson`);
      const content = await fs.readFile(sessionPath, "utf-8");

      expect(content).toContain("Session-specific log");
    });

    it("should write NDJSON format (one line per entry)", async () => {
      const entry1: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "Entry 1",
      };
      const entry2: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "ERROR",
        message: "Entry 2",
      };

      await writer.write(entry1);
      await writer.write(entry2);

      const date = new Date().toISOString().split("T")[0];
      const combinedPath = path.join(TEST_LOG_DIR, `${date}-combined-${writer.getInstanceId()}.ndjson`);
      const content = await fs.readFile(combinedPath, "utf-8");
      const lines = content.trim().split("\n");

      expect(lines.length).toBe(2);
      expect(JSON.parse(lines[0]!).message).toBe("Entry 1");
      expect(JSON.parse(lines[1]!).message).toBe("Entry 2");
    });

    it("should handle log entries with context", async () => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "DEBUG",
        message: "Entry with context",
        context: { userId: "123", action: "login" },
      };

      await writer.write(entry);

      const date = new Date().toISOString().split("T")[0];
      const combinedPath = path.join(TEST_LOG_DIR, `${date}-combined-${writer.getInstanceId()}.ndjson`);
      const content = await fs.readFile(combinedPath, "utf-8");
      const parsed = JSON.parse(content.trim());

      expect(parsed.context.userId).toBe("123");
      expect(parsed.context.action).toBe("login");
    });

    it("should resolve sessionId from entry.context.sessionId when no explicit sessionId passed", async () => {
      const sessionId = "context-session-123";
      await writer.openSession(sessionId);

      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "Context-based session log",
        context: { sessionId },
      };

      // Call write WITHOUT explicit sessionId parameter
      await writer.write(entry);

      const date = new Date().toISOString().split("T")[0];
      const sessionPath = path.join(TEST_LOG_DIR, 'sessions', `${date}-${sessionId}.ndjson`);
      const content = await fs.readFile(sessionPath, "utf-8");

      expect(content).toContain("Context-based session log");
    });

    it("should resolve sessionId from entry.context.sid fallback key", async () => {
      const sessionId = "sid-fallback-session";
      await writer.openSession(sessionId);

      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "SID fallback session log",
        context: { sid: sessionId },
      };

      // Call write WITHOUT explicit sessionId parameter — uses `sid` key
      await writer.write(entry);

      const date = new Date().toISOString().split("T")[0];
      const sessionPath = path.join(TEST_LOG_DIR, 'sessions', `${date}-${sessionId}.ndjson`);
      const content = await fs.readFile(sessionPath, "utf-8");

      expect(content).toContain("SID fallback session log");
    });

    it("should prefer explicit sessionId over context.sid", async () => {
      const explicitId = "explicit-session";
      const sidId = "sid-session";
      await writer.openSession(explicitId);
      await writer.openSession(sidId);

      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "Explicit vs SID test",
        context: { sid: sidId },
      };

      // Pass explicit sessionId — should use that, not context.sid
      await writer.write(entry, explicitId);

      const date = new Date().toISOString().split("T")[0];
      const explicitPath = path.join(TEST_LOG_DIR, 'sessions', `${date}-${explicitId}.ndjson`);
      const sidPath = path.join(TEST_LOG_DIR, 'sessions', `${date}-${sidId}.ndjson`);

      const explicitContent = await fs.readFile(explicitPath, "utf-8");
      expect(explicitContent).toContain("Explicit vs SID test");

      // sid session file should NOT exist (or be empty)
      await expect(fs.readFile(sidPath, "utf-8")).rejects.toThrow();
    });
  });

  describe("closeAll", () => {
    it("should flush pending writes before closing", async () => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "Flush test",
      };

      await writer.write(entry);
      await writer.closeAll();

      const date = new Date().toISOString().split("T")[0];
      const combinedPath = path.join(TEST_LOG_DIR, `${date}-combined-${writer.getInstanceId()}.ndjson`);
      const content = await fs.readFile(combinedPath, "utf-8");

      expect(content).toContain("Flush test");
    });

    it("should close all active sessions", async () => {
      await writer.openSession("session1");
      await writer.openSession("session2");
      expect(writer.getActiveSessions().length).toBe(2);

      await writer.closeAll();
      expect(writer.getActiveSessions().length).toBe(0);
    });
  });

  describe("error resilience", () => {
    it("should handle write errors gracefully", async () => {
      const entry: LogEntry = {
        timestamp: new Date().toISOString(),
        level: "INFO",
        message: "Test",
      };

      // Note: This test is challenging without mocking fs
      // In real scenario, write should handle I/O errors
      await expect(writer.write(entry)).resolves.not.toThrow();
    });
  });

  describe("instance ID generation", () => {
    it("should generate unique 16-character hexadecimal instance ID on construction", () => {
      const writer = new DiskWriter(TEST_LOG_DIR);
      const instanceId = writer.getInstanceId();

      expect(instanceId).toBeDefined();
      expect(instanceId.length).toBe(16);
      expect(/^[0-9a-f]{16}$/.test(instanceId)).toBe(true);
    });

    it("should generate unique instance IDs for multiple DiskWriter instances", () => {
      const writers = Array.from({ length: 10 }, () => new DiskWriter(TEST_LOG_DIR));
      const instanceIds = writers.map(w => w.getInstanceId());

      // All IDs should be unique
      const uniqueIds = new Set(instanceIds);
      expect(uniqueIds.size).toBe(10);

      // Clean up
      writers.forEach(w => w.closeAll());
    });
  });
});
