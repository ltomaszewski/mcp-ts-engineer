/**
 * Framework-level type definitions.
 * Core dependencies and pending state types.
 */

import type { AIProvider } from "./ai-provider/ai-provider.types.js";

/** Pending cost record (not yet written to disk) */
export interface PendingCostRecord {
  /** Session ID (short key for serialization) */
  sid: string;
  /** Model used */
  model: string;
  /** Input tokens */
  inputTokens: number;
  /** Output tokens */
  outputTokens: number;
  /** Cost in USD */
  costUsd: number;
  /** Timestamp */
  timestamp: string;
}

/** Framework dependencies - core services available globally */
export interface FrameworkDeps {
  /** AI provider instance */
  aiProvider: AIProvider;
  /** Logger instance */
  logger: {
    info: (message: string, context?: Record<string, unknown>) => void;
    debug: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, context?: Record<string, unknown>) => void;
    warn: (message: string, context?: Record<string, unknown>) => void;
  };
  /** Session ID (current active session) */
  sessionId: string;
}
