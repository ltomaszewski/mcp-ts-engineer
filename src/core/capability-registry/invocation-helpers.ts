/**
 * Helper utilities for capability invocation handling.
 * Extracted from invocation-handler.ts for better modularity.
 */

import crypto from "node:crypto";
import type { CostSummary } from "../cost/cost.types.js";
import { ValidationError, AIProviderError, TimeoutError, CapabilityError } from "../errors.js";

/**
 * Generate spec hash for correlation.
 * @param input - Validated input object
 * @returns SHA256 hash (first 16 chars) of spec_path field, or undefined
 * @internal Test utility only
 */
export function generateSpecHash(input: unknown): string | undefined {
  const specPath = (input as Record<string, unknown>)?.spec_path;
  if (typeof specPath === "string") {
    return crypto.createHash("sha256").update(specPath).digest("hex").slice(0, 16);
  }
  return undefined;
}

/**
 * Sanitize input by removing sensitive fields and truncating large values.
 * @param input - Raw input object
 * @returns Sanitized record or undefined
 * @internal Test utility only
 */
export function sanitizeInput(input: unknown): Record<string, unknown> | undefined {
  if (!input || typeof input !== "object") return undefined;
  const sanitized: Record<string, unknown> = {};
  const sensitiveKeys = ["token", "secret", "password", "key", "auth"];
  for (const [key, value] of Object.entries(input as Record<string, unknown>)) {
    if (sensitiveKeys.some((k) => key.toLowerCase().includes(k))) {
      continue; // Skip sensitive keys
    }
    if (typeof value === "string" && value.length > 500) {
      sanitized[key] = value.slice(0, 500) + "...[truncated]";
    } else {
      sanitized[key] = value;
    }
  }
  return Object.keys(sanitized).length > 0 ? sanitized : undefined;
}

/**
 * Categorize error into report enum type.
 * @param error - Error instance
 * @returns Error category string
 * @internal Test utility only
 */
export function categorizeError(error: unknown): string {
  if (error instanceof ValidationError) return "validation";
  if (error instanceof AIProviderError) return "ai_error";
  if (error instanceof TimeoutError) return "timeout";
  if (error instanceof CapabilityError) {
    const msg = (error.message || "").toLowerCase();
    if (msg.includes("halted") || msg.includes("tests failed")) return "halted";
    return "capability";
  }
  return "unknown";
}

/**
 * Extract model name from cost summary (for error cases where aiResult unavailable).
 * @param costSummary - Session cost summary
 * @returns Model name or "unknown"
 * @internal Test utility only
 */
export function extractModelFromCostSummary(costSummary: CostSummary): string {
  const models = Object.keys(costSummary.byModel);
  return models[0] || "unknown";
}
