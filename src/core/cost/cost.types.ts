/**
 * Cost tracking type definitions.
 */

import type { AIModel } from "../ai-provider/ai-provider.types.js";

/** Cost entry for a single AI operation */
export interface CostEntry {
  /** Unique entry ID */
  id: string;
  /** Session ID this cost belongs to (short key for serialization) */
  sid: string;
  /** Model used */
  model: AIModel;
  /** Input tokens */
  inputTokens: number;
  /** Output tokens */
  outputTokens: number;
  /** Cost in USD */
  costUsd: number;
  /** Timestamp */
  timestamp: string;
  /** Child session ID (when this entry represents aggregated child cost) */
  childSessionId?: string;
  /** Number of turns (agentic iterations) */
  turns?: number;
  /** Commit SHA from capability execution */
  commitSha?: string;
  /** Execution status */
  status?: "success" | "error";
  /** Cache creation input tokens (prompt cache write) */
  promptCacheWrite?: number;
  /** Cache read input tokens (prompt cache read) */
  promptCacheRead?: number;
  /** Prompt version identifier */
  promptVersion?: string;
  /** Total input tokens (inputTokens + promptCacheRead) */
  totalTokensIn?: number;
  /** Total output tokens (alias for outputTokens) */
  totalTokensOut?: number;
}

/** Child cost entry with capability information */
export interface ChildCostEntry extends CostEntry {
  /** Capability name */
  capabilityName: string;
}

/** Aggregated cost summary */
export interface CostSummary {
  /** Total input tokens */
  totalInputTokens: number;
  /** Total output tokens */
  totalOutputTokens: number;
  /** Total cost in USD */
  totalCostUsd: number;
  /** Number of operations */
  operationCount: number;
  /** Total turns (agentic iterations) across all operations */
  totalTurns: number;
  /** Breakdown by model (partial - only models actually used) */
  byModel: Partial<Record<AIModel, {
    inputTokens: number;
    outputTokens: number;
    promptCacheWrite?: number;
    promptCacheRead?: number;
    totalTokensIn?: number;
    totalTokensOut?: number;
    costUsd: number;
    count: number;
  }>>;
  /** Breakdown by capability (optional for Phase 3) */
  byCapability?: Record<string, {
    inputTokens: number;
    outputTokens: number;
    costUsd: number;
    count: number;
  }>;
  /** Total cache creation tokens across all operations (prompt cache write) */
  totalPromptCacheWrite?: number;
  /** Total cache read tokens across all operations (prompt cache read) */
  totalPromptCacheRead?: number;
  /** Cache hit rate (cacheRead / totalInput, 0-1) */
  cacheHitRate?: number;
}
