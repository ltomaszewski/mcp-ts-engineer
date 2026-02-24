/**
 * Zod schemas for cost report validation.
 */

import { z } from 'zod'

/**
 * Schema for child session cost entry (sub-invocation breakdown).
 */
export const ChildSessionCostEntrySchema = z.object({
  sid: z.string(),
  capability: z.string(),
  costUsd: z.number().nonnegative(),
  turns: z.number().int().nonnegative(),
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  commitSha: z.string().nullable().optional(),
  model: z.string().optional().default('unknown'),
  status: z.enum(['success', 'error']).optional().default('success'),
  promptCacheWrite: z.number().int().nonnegative().optional(),
  promptCacheRead: z.number().int().nonnegative().optional(),
  promptVersion: z.string().optional(),
  totalTokensIn: z.number().int().nonnegative().optional(),
  totalTokensOut: z.number().int().nonnegative().optional(),
})

/**
 * Schema for model cost breakdown.
 */
export const ModelCostBreakdownSchema = z.object({
  inputTokens: z.number().int().nonnegative(),
  outputTokens: z.number().int().nonnegative(),
  promptCacheWrite: z.number().int().nonnegative().optional(),
  promptCacheRead: z.number().int().nonnegative().optional(),
  totalTokensIn: z.number().int().nonnegative().optional(),
  totalTokensOut: z.number().int().nonnegative().optional(),
  costUsd: z.number().nonnegative(),
  count: z.number().int().positive(),
})

/**
 * Schema for session-level model breakdown.
 */
export const SessionModelBreakdownSchema = z.record(z.string(), ModelCostBreakdownSchema)

/**
 * Schema for session cost entry.
 */
export const SessionCostEntrySchema = z.object({
  sid: z.string().regex(/^[a-f0-9]{32}$/, 'Invalid session ID format'),
  startedAt: z.string().datetime({ message: 'Invalid ISO 8601 timestamp' }),
  completedAt: z.string().datetime({ message: 'Invalid ISO 8601 timestamp' }).optional(),
  totalInputTokens: z.number().int().nonnegative().default(0),
  totalOutputTokens: z.number().int().nonnegative().default(0),
  totalCostUsd: z.number().nonnegative(),
  invocationCount: z.number().int().nonnegative(),
  byModel: SessionModelBreakdownSchema,
  childSessions: z.array(ChildSessionCostEntrySchema).optional(),
  commitSha: z.string().nullable().optional(),
  capability: z.string().optional().default('unknown'),
  model: z.string().optional().default('unknown'),
  status: z.enum(['success', 'error', 'halted']).optional().default('success'),
  specHash: z.string().optional(),
  input: z.record(z.string(), z.unknown()).optional(),
  errorType: z
    .enum(['validation', 'budget', 'timeout', 'ai_error', 'capability', 'halted', 'unknown'])
    .optional(),
  errorMessage: z.string().optional(),
  totalPromptCacheWrite: z.number().int().nonnegative().optional(),
  totalPromptCacheRead: z.number().int().nonnegative().optional(),
  cacheHitRate: z.number().min(0).max(1).optional(),
})

/**
 * Schema for daily cost report.
 */
export const DailyCostReportSchema = z.object({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date format (expected YYYY-MM-DD)'),
  totalCostUsd: z.number().nonnegative(),
  totalSessions: z.number().int().nonnegative(),
  sessions: z.array(SessionCostEntrySchema),
  aggregatedByModel: SessionModelBreakdownSchema,
})

/**
 * Export types inferred from Zod schemas.
 */
export type ChildSessionCostEntry = z.infer<typeof ChildSessionCostEntrySchema>
export type ModelCostBreakdown = z.infer<typeof ModelCostBreakdownSchema>
export type SessionModelBreakdown = z.infer<typeof SessionModelBreakdownSchema>
export type SessionCostEntry = z.infer<typeof SessionCostEntrySchema>
export type DailyCostReport = z.infer<typeof DailyCostReportSchema>
