/**
 * Logger type definitions for structured logging.
 */

/** Log levels supported by the logger */
export type LogLevel = 'INFO' | 'DEBUG' | 'ERROR' | 'WARN'

/** Structured log context - arbitrary key-value pairs */
export interface LogContext {
  [key: string]: unknown
}

/** Structured log entry in NDJSON format */
export interface LogEntry {
  /** ISO 8601 timestamp */
  timestamp: string
  /** Log level */
  level: LogLevel
  /** Primary log message */
  message: string
  /** Optional structured context */
  context?: LogContext
}
