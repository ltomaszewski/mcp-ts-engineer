import { vi, type MockInstance } from "vitest";
/**
 * Tests for structured Logger.
 */

import { Logger, createLogger } from "../logger.js";

describe("Logger", () => {
  let logger: Logger;
  let mockStderr: MockInstance<typeof console.error>;

  beforeEach(() => {
    logger = createLogger();
    // Spy on console.error to capture stderr output
    mockStderr = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(async () => {
    await logger.close();
    mockStderr.mockRestore();
  });

  describe("log levels", () => {
    it("should log INFO messages", () => {
      logger.info("Info message");
      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      expect(call).toContain("[INFO]");
      expect(call).toContain("Info message");
    });

    it("should log DEBUG messages", () => {
      logger.debug("Debug message");
      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      expect(call).toContain("[DEBUG]");
      expect(call).toContain("Debug message");
    });

    it("should log ERROR messages", () => {
      logger.error("Error message");
      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      expect(call).toContain("[ERROR]");
      expect(call).toContain("Error message");
    });

    it("should log WARN messages", () => {
      logger.warn("Warning message");
      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      expect(call).toContain("[WARN]");
      expect(call).toContain("Warning message");
    });
  });

  describe("context binding", () => {
    it("should bind base context at creation", () => {
      const contextLogger = createLogger({ service: "test-service" });
      contextLogger.info("Message with context");

      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      expect(call).toContain("test-service");
    });

    it("should merge additional context with withContext", () => {
      const baseLogger = createLogger({ service: "base" });
      const childLogger = baseLogger.withContext({ requestId: "123" });
      childLogger.info("Child message");

      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      expect(call).toContain("base");
      expect(call).toContain("123");
    });

    it("should allow inline context per log call", () => {
      logger.info("Message", { userId: "user-456" });

      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      expect(call).toContain("user-456");
    });

    it("should merge base, bound, and inline context", () => {
      const baseLogger = createLogger({ service: "app" });
      const childLogger = baseLogger.withContext({ module: "auth" });
      childLogger.info("Login", { userId: "789" });

      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      expect(call).toContain("app");
      expect(call).toContain("auth");
      expect(call).toContain("789");
    });
  });

  describe("redaction", () => {
    it("should redact sensitive messages", () => {
      logger.info("API key: sk-ant-api03-secretkey123");

      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      expect(call).toContain("[REDACTED]");
      expect(call).not.toContain("sk-ant");
    });

    it("should redact sensitive context values", () => {
      logger.info("Login attempt", { token: "Bearer secret-token-xyz" });

      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      expect(call).toContain("[REDACTED]");
      expect(call).not.toContain("secret-token");
    });

    it("should redact nested objects in context", () => {
      logger.info("Request", {
        headers: { authorization: "Bearer abc123" },
      });

      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      expect(call).toContain("[REDACTED]");
      expect(call).not.toContain("abc123");
    });
  });

  describe("output format", () => {
    it("should include timestamp in ISO 8601 format", () => {
      logger.info("Test");

      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      // Check for ISO 8601 pattern: [YYYY-MM-DDTHH:mm:ss.sssZ]
      expect(call).toMatch(/\[\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z\]/);
    });

    it("should not include context field if no context provided", () => {
      logger.info("Simple message");

      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      // Should not have trailing JSON object if no context
      expect(call).not.toMatch(/\{.*\}$/);
    });

    it("should append context as JSON when provided", () => {
      logger.info("Message", { key: "value" });

      expect(mockStderr).toHaveBeenCalled();
      const call = mockStderr.mock.calls[0]?.[0] as string;
      expect(call).toContain('{"key":"value"}');
    });
  });

  describe("session management", () => {
    it("should set session ID for per-session logging", async () => {
      await logger.setSession("session-123");
      // Session set successfully if no error thrown
      expect(true).toBe(true);
    });

    it("should propagate sessionId to child logger created with withContext", async () => {
      // Use a real DiskWriter with a temp dir to verify session file writes
      const { DiskWriter } = await import("../disk-writer.js");
      const path = await import("path");
      const { fileURLToPath } = await import("url");
      const { promises: fs } = await import("fs");

      const __dirname = path.dirname(fileURLToPath(import.meta.url));
      const testDir = path.join(__dirname, "../../../../logs_tests/logger-session-propagation");
      await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});

      const diskWriter = new DiskWriter(testDir);
      const parentLogger = new Logger({ diskWriter });

      const sessionId = "propagated-session";
      await parentLogger.setSession(sessionId);

      // Create child logger via withContext
      const childLogger = parentLogger.withContext({ module: "test-child" });

      // Log from child — should go to session file because sessionId is propagated
      childLogger.info("Child log message");

      // Wait for async disk writes
      await new Promise((resolve) => setTimeout(resolve, 100));

      // Verify session file was written
      const date = new Date().toISOString().split("T")[0];
      const sessionPath = path.join(testDir, "sessions", `${date}-${sessionId}.ndjson`);
      const content = await fs.readFile(sessionPath, "utf-8");

      expect(content).toContain("Child log message");

      await diskWriter.closeAll();
      await fs.rm(testDir, { recursive: true, force: true }).catch(() => {});
    });
  });

  describe("shutdown", () => {
    it("should close logger and flush pending writes", async () => {
      logger.info("Message before close");
      await logger.close();
      // Should not throw
      expect(true).toBe(true);
    });
  });
});
