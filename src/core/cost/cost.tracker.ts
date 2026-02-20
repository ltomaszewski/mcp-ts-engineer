/**
 * CostTracker - tracks and aggregates cost entries per session.
 */

import type { CostEntry, CostSummary, ChildCostEntry } from "./cost.types.js";
import type { AIModel } from "../ai-provider/ai-provider.types.js";

/**
 * Internal cost record with invocation and capability tracking.
 * @internal
 */
interface CostRecord extends CostEntry {
  /** Invocation ID */
  invocationId: string;
  /** Capability name */
  capabilityName: string;
}

/**
 * CostTracker manages cost recording and aggregation.
 *
 * Features:
 * - Records cost per invocation with capability name
 * - Aggregates costs by session, model, and capability
 * - Handles zero-cost entries (cached responses)
 * - Provides session summaries with breakdown
 */
export class CostTracker {
  /** Cost records keyed by session ID */
  private costs: Map<string, CostRecord[]> = new Map();

  /**
   * Records a cost entry for a session invocation.
   *
   * @param sessionId - Session ID
   * @param invocationId - Invocation ID
   * @param capabilityName - Capability name (tool/resource/prompt)
   * @param entry - Cost entry to record
   */
  recordCost(
    sessionId: string,
    invocationId: string,
    capabilityName: string,
    entry: CostEntry
  ): void {
    const records = this.costs.get(sessionId) || [];

    const record: CostRecord = {
      ...entry,
      invocationId,
      capabilityName,
    };

    records.push(record);
    this.costs.set(sessionId, records);
  }

  /**
   * Records a child capability cost propagated to parent session.
   *
   * @param sessionId - Parent session ID
   * @param invocationId - Parent invocation ID
   * @param capabilityName - Child capability name
   * @param entry - Cost entry with childSessionId and turns
   */
  recordChildCost(
    sessionId: string,
    invocationId: string,
    capabilityName: string,
    entry: CostEntry
  ): void {
    // Delegate to recordCost - child costs are stored the same way
    this.recordCost(sessionId, invocationId, capabilityName, entry);
  }

  /**
   * Gets aggregated cost summary for a session.
   *
   * @param sessionId - Session ID
   * @returns Cost summary with by-model and by-capability breakdowns
   */
  getSessionSummary(sessionId: string): CostSummary {
    const records = this.costs.get(sessionId) || [];

    if (records.length === 0) {
      return {
        totalInputTokens: 0,
        totalOutputTokens: 0,
        totalCostUsd: 0,
        operationCount: 0,
        totalTurns: 0,
        totalPromptCacheWrite: 0,
        totalPromptCacheRead: 0,
        cacheHitRate: 0,
        byModel: {},
        byCapability: {},
      };
    }

    // Aggregate totals
    let totalInputTokens = 0;
    let totalOutputTokens = 0;
    let totalCostUsd = 0;
    let totalTurns = 0;
    let totalPromptCacheWrite = 0;
    let totalPromptCacheRead = 0;

    // Aggregate by model
    const byModel: Record<string, {
      inputTokens: number;
      outputTokens: number;
      promptCacheWrite: number;
      promptCacheRead: number;
      totalTokensIn: number;
      totalTokensOut: number;
      costUsd: number;
      count: number;
    }> = {};

    // Aggregate by capability
    const byCapability: Record<string, {
      inputTokens: number;
      outputTokens: number;
      costUsd: number;
      count: number;
    }> = {};

    for (const record of records) {
      // Update totals
      totalInputTokens += record.inputTokens;
      totalOutputTokens += record.outputTokens;
      totalCostUsd += record.costUsd;
      totalTurns += record.turns || 0;
      totalPromptCacheWrite += record.promptCacheWrite || 0;
      totalPromptCacheRead += record.promptCacheRead || 0;

      // Update by-model breakdown
      const modelKey: string = record.model;
      if (!byModel[modelKey]) {
        byModel[modelKey] = {
          inputTokens: 0,
          outputTokens: 0,
          promptCacheWrite: 0,
          promptCacheRead: 0,
          totalTokensIn: 0,
          totalTokensOut: 0,
          costUsd: 0,
          count: 0,
        };
      }
      const modelEntry = byModel[modelKey];
      if (modelEntry) {
        modelEntry.inputTokens += record.inputTokens;
        modelEntry.outputTokens += record.outputTokens;
        modelEntry.promptCacheWrite += record.promptCacheWrite || 0;
        modelEntry.promptCacheRead += record.promptCacheRead || 0;
        modelEntry.totalTokensIn += record.totalTokensIn || 0;
        modelEntry.totalTokensOut += record.totalTokensOut || 0;
        modelEntry.costUsd += record.costUsd;
        modelEntry.count += 1;
      }

      // Update by-capability breakdown
      const capabilityKey = record.capabilityName;
      if (!byCapability[capabilityKey]) {
        byCapability[capabilityKey] = {
          inputTokens: 0,
          outputTokens: 0,
          costUsd: 0,
          count: 0,
        };
      }
      const capabilityEntry = byCapability[capabilityKey];
      if (capabilityEntry) {
        capabilityEntry.inputTokens += record.inputTokens;
        capabilityEntry.outputTokens += record.outputTokens;
        capabilityEntry.costUsd += record.costUsd;
        capabilityEntry.count += 1;
      }
    }

    const totalInputWithCache = totalInputTokens + totalPromptCacheRead;
    const cacheHitRate = totalInputWithCache > 0
      ? totalPromptCacheRead / totalInputWithCache
      : 0;

    return {
      totalInputTokens,
      totalOutputTokens,
      totalCostUsd,
      operationCount: records.length,
      totalTurns,
      totalPromptCacheWrite,
      totalPromptCacheRead,
      cacheHitRate,
      byModel: byModel as Partial<Record<AIModel, {
        inputTokens: number;
        outputTokens: number;
        promptCacheWrite?: number;
        promptCacheRead?: number;
        totalTokensIn?: number;
        totalTokensOut?: number;
        costUsd: number;
        count: number;
      }>>,
      byCapability,
    };
  }

  /**
   * Gets summaries for all tracked sessions.
   *
   * @returns Map of session ID to cost summary
   */
  getAllSessionSummaries(): Map<string, CostSummary> {
    const summaries = new Map<string, CostSummary>();

    for (const sessionId of this.costs.keys()) {
      summaries.set(sessionId, this.getSessionSummary(sessionId));
    }

    return summaries;
  }

  /**
   * Gets child cost entries for a session (entries with childSessionId set).
   *
   * @param sessionId - Session ID
   * @returns Array of cost entries with capability names
   */
  getChildCostEntries(sessionId: string): ChildCostEntry[] {
    const records = this.costs.get(sessionId) || [];
    return records
      .filter((record) => record.childSessionId !== undefined)
      .map((record) => ({
        ...record,
        capabilityName: record.capabilityName,
      }));
  }
}
