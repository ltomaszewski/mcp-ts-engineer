/**
 * Disk writer for NDJSON log persistence.
 * Writes to two files: daily combined log + per-session log.
 * Logs persist in user-scoped directory (~/.claude/mcp-ts-engineer/logs/)
 * configurable via LOG_DIR environment variable or constructor parameter.
 */

import crypto from "node:crypto";
import { promises as fs } from "fs";
import path from "path";
import { DiskWriteError } from "../errors.js";
import type { LogEntry } from "./logger.types.js";
import { resolveLogPath } from "./path-utils.js";
import { getDefaultLogDir } from "../../config/constants.js";

const MAX_PATH_LENGTH = 255;

/** Pending write operation */
interface PendingWrite {
  filePath: string;
  data: string;
}

/**
 * DiskWriter manages NDJSON file writes for logging.
 * Dual-write strategy: combined daily log + per-session logs.
 */
export class DiskWriter {
  private readonly logDir: string;
  private sessions = new Map<string, string>(); // sessionId -> file path
  private pendingWrites: PendingWrite[] = [];
  private initialized = false;
  private readonly instanceId: string;

  /**
   * @param logDir - Custom log directory (defaults to package-relative logs/)
   */
  constructor(logDir?: string) {
    const configuredDir = logDir ?? process.env.LOG_DIR ?? getDefaultLogDir();
    this.logDir = resolveLogPath(configuredDir);
    this.instanceId = crypto.randomBytes(8).toString("hex");
  }

  /**
   * Initialize log directory.
   * Creates logs/, logs/sessions/, and logs/reports/ directories if they don't exist.
   */
  async initialize(): Promise<void> {
    if (this.initialized) return;

    try {
      await fs.mkdir(this.logDir, { recursive: true });
      await fs.mkdir(path.join(this.logDir, 'sessions'), { recursive: true });
      await fs.mkdir(path.join(this.logDir, 'reports'), { recursive: true });
      this.initialized = true;
    } catch (error) {
      throw new DiskWriteError(`Failed to initialize log directory: ${this.logDir}`, {
        cause: error,
      });
    }
  }

  /**
   * Open a new session log file.
   * @param sessionId - Session identifier
   * @throws {DiskWriteError} If path is invalid or file creation fails
   */
  async openSession(sessionId: string): Promise<void> {
    await this.initialize();

    // Validate session ID to prevent path traversal
    if (sessionId.includes("..") || sessionId.includes("/") || sessionId.includes("\\")) {
      throw new DiskWriteError(`Invalid session ID: ${sessionId}`);
    }

    const timestamp = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const filename = `${timestamp}-${sessionId}.ndjson`;
    const filePath = path.join(this.logDir, 'sessions', filename);

    // Check path length
    if (filePath.length > MAX_PATH_LENGTH) {
      throw new DiskWriteError(`File path too long: ${filePath}`);
    }

    this.sessions.set(sessionId, filePath);
  }

  /**
   * Close a session log file.
   * @param sessionId - Session identifier
   */
  async closeSession(sessionId: string): Promise<void> {
    this.sessions.delete(sessionId);
  }

  /**
   * Write a log entry to disk (dual-write: combined + session).
   * @param entry - Log entry to write
   * @param sessionId - Session identifier (optional for session-specific log)
   * @throws {DiskWriteError} If write fails
   */
  async write(entry: LogEntry, sessionId?: string): Promise<void> {
    await this.initialize();

    const ndjson = JSON.stringify(entry) + "\n";
    const date = new Date().toISOString().split("T")[0]; // YYYY-MM-DD
    const combinedPath = path.join(this.logDir, `${date}-combined-${this.instanceId}.ndjson`);

    try {
      // Write to combined daily log
      this.pendingWrites.push({ filePath: combinedPath, data: ndjson });

      // Resolve sessionId from parameter, entry context (sessionId or sid key)
      const resolvedSessionId = sessionId
        || (entry.context?.sessionId as string | undefined)
        || (entry.context?.sid as string | undefined);

      // Write to session-specific log if sessionId resolved and session is open
      if (resolvedSessionId && this.sessions.has(resolvedSessionId)) {
        const sessionPath = this.sessions.get(resolvedSessionId)!;
        this.pendingWrites.push({ filePath: sessionPath, data: ndjson });
      }

      // Flush pending writes
      await this.flush();
    } catch (error) {
      throw new DiskWriteError(`Failed to write log entry`, { cause: error });
    }
  }

  /**
   * Flush pending writes to disk.
   * @throws {DiskWriteError} If any write fails
   */
  async flush(): Promise<void> {
    const writes = [...this.pendingWrites];
    this.pendingWrites = [];

    const errors: Error[] = [];

    for (const { filePath, data } of writes) {
      try {
        await fs.appendFile(filePath, data, "utf-8");
      } catch (error) {
        errors.push(error as Error);
      }
    }

    if (errors.length > 0) {
      throw new DiskWriteError(`Failed to flush ${errors.length} writes`, {
        cause: errors[0],
      });
    }
  }

  /**
   * Close all open sessions and flush pending writes.
   * Should be called on graceful shutdown.
   */
  async closeAll(): Promise<void> {
    // Flush any remaining pending writes
    if (this.pendingWrites.length > 0) {
      await this.flush();
    }

    // Close all sessions
    this.sessions.clear();
  }

  /**
   * Get list of active session IDs.
   * @returns Array of session IDs
   * @internal For testing only
   */
  getActiveSessions(): string[] {
    return Array.from(this.sessions.keys());
  }

  /**
   * Get the instance ID for this DiskWriter.
   * Each process instance has a unique ID to prevent combined log conflicts.
   * @returns 16-character hexadecimal instance ID
   */
  getInstanceId(): string {
    return this.instanceId;
  }
}
