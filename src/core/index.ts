/**
 * Core module exports.
 */

// Logger module
export { Logger, createLogger, DiskWriter, redactSensitive } from "./logger/index.js";
export type { LogLevel, LogEntry, LogContext } from "./logger/index.js";

// Error classes
export * from "./errors.js";

// Type modules
export type { FrameworkDeps, PendingCostRecord } from "./framework.types.js";
export * from "./ai-provider/index.js";
export * from "./session/index.js";
export * from "./cost/index.js";
export * from "./prompt/index.js";
export * from "./capability-registry/index.js";

// Utilities
export { parseJsonSafe, parseXmlBlock } from "./utils/index.js";
