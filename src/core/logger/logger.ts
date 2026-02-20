/**
 * Structured logger with context binding and disk persistence.
 * Dual-write: stderr (for MCP protocol) + disk (NDJSON files).
 */

import { DiskWriter } from "./disk-writer.js";
import { redactSensitive } from "./redact.js";
import type { LogLevel, LogEntry, LogContext } from "./logger.types.js";

/**
 * Logger class for structured logging with context binding.
 */
export class Logger {
  private diskWriter: DiskWriter;
  private baseContext: LogContext;
  private sessionId?: string;

  constructor(options?: { diskWriter?: DiskWriter; context?: LogContext }) {
    this.diskWriter = options?.diskWriter ?? new DiskWriter();
    this.baseContext = options?.context ?? {};
  }

  /**
   * Set session ID for per-session logging.
   * @param sessionId - Session identifier
   */
  async setSession(sessionId: string): Promise<void> {
    this.sessionId = sessionId;
    await this.diskWriter.openSession(sessionId);
  }

  /**
   * Bind additional context to this logger instance.
   * Creates a new logger with merged context.
   *
   * @param context - Context to bind
   * @returns New logger with bound context
   */
  withContext(context: LogContext): Logger {
    const child = new Logger({
      diskWriter: this.diskWriter,
      context: { ...this.baseContext, ...context },
    });
    // Propagate session ID so child loggers write to session-specific log files
    if (this.sessionId) {
      child.sessionId = this.sessionId;
    }
    return child;
  }

  /**
   * Log an INFO level message.
   * @param message - Log message
   * @param context - Optional additional context
   */
  info(message: string, context?: LogContext): void {
    this.log("INFO", message, context);
  }

  /**
   * Log a DEBUG level message.
   * @param message - Log message
   * @param context - Optional additional context
   */
  debug(message: string, context?: LogContext): void {
    this.log("DEBUG", message, context);
  }

  /**
   * Log an ERROR level message.
   * @param message - Log message
   * @param context - Optional additional context
   */
  error(message: string, context?: LogContext): void {
    this.log("ERROR", message, context);
  }

  /**
   * Log a WARN level message.
   * @param message - Log message
   * @param context - Optional additional context
   */
  warn(message: string, context?: LogContext): void {
    this.log("WARN", message, context);
  }

  /**
   * Internal log method - handles redaction, formatting, and dual-write.
   * @param level - Log level
   * @param message - Log message
   * @param context - Optional context
   */
  private log(level: LogLevel, message: string, context?: LogContext): void {
    const mergedContext = { ...this.baseContext, ...context };
    const redactedContext = redactSensitive(mergedContext) as LogContext;
    const redactedMessage = redactSensitive(message) as string;

    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message: redactedMessage,
      context: Object.keys(redactedContext).length > 0 ? redactedContext : undefined,
    };

    // Write to stderr (for MCP protocol)
    this.writeToStderr(entry);

    // Write to disk (async, fire-and-forget)
    this.diskWriter.write(entry, this.sessionId).catch((error) => {
      // Fallback: write disk error to stderr only
      console.error(`[DISK-WRITE-ERROR] ${error}`);
    });
  }

  /**
   * Write log entry to stderr in human-readable format.
   * @param entry - Log entry
   */
  private writeToStderr(entry: LogEntry): void {
    const contextStr = entry.context ? ` ${JSON.stringify(entry.context)}` : "";
    const line = `[${entry.timestamp}] [${entry.level}] ${entry.message}${contextStr}`;
    console.error(line);
  }

  /**
   * Close logger and flush pending writes.
   * Should be called on graceful shutdown.
   */
  async close(): Promise<void> {
    await this.diskWriter.closeAll();
  }
}

/**
 * Create a new logger instance.
 * @param context - Initial context
 * @returns Logger instance
 */
export function createLogger(context?: LogContext): Logger {
  return new Logger({ context });
}
