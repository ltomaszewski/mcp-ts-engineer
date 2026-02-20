/**
 * Tests for CostTracker - cost recording and aggregation.
 */

import { describe, it, expect, beforeEach } from "@jest/globals";
import { CostTracker } from "../cost.tracker.js";
import type { CostEntry } from "../cost.types.js";

describe("CostTracker", () => {
  let tracker: CostTracker;

  beforeEach(() => {
    tracker = new CostTracker();
  });

  describe("recordCost", () => {
    it("records cost entry for session", () => {
      const entry: CostEntry = {
        id: "cost-1",
        sid: "abc1230000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      tracker.recordCost("abc1230000000000000000000000000000", "invabcd000000000000000000000000000", "tool-a", entry);

      const summary = tracker.getSessionSummary("abc1230000000000000000000000000000");
      expect(summary.totalCostUsd).toBeCloseTo(0.01, 5);
      expect(summary.totalInputTokens).toBe(100);
      expect(summary.totalOutputTokens).toBe(50);
      expect(summary.operationCount).toBe(1);
    });

    it("records multiple cost entries for same session", () => {
      const entry1: CostEntry = {
        id: "cost-1",
        sid: "abc1230000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      const entry2: CostEntry = {
        id: "cost-2",
        sid: "abc1230000000000000000000000000000",
        model: "claude-3-5-haiku-20241022",
        inputTokens: 200,
        outputTokens: 100,
        costUsd: 0.005,
        timestamp: new Date().toISOString(),
      };

      tracker.recordCost("abc1230000000000000000000000000000", "invaaa100000000000000000000000000", "tool-a", entry1);
      tracker.recordCost("abc1230000000000000000000000000000", "invaaa200000000000000000000000000", "tool-b", entry2);

      const summary = tracker.getSessionSummary("abc1230000000000000000000000000000");
      expect(summary.totalCostUsd).toBeCloseTo(0.015, 5);
      expect(summary.totalInputTokens).toBe(300);
      expect(summary.totalOutputTokens).toBe(150);
      expect(summary.operationCount).toBe(2);
    });

    it("handles zero-cost entries (cached responses)", () => {
      const entry: CostEntry = {
        id: "cost-cached",
        sid: "abc1230000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 0,
        outputTokens: 0,
        costUsd: 0,
        timestamp: new Date().toISOString(),
      };

      tracker.recordCost("abc1230000000000000000000000000000", "invcached00000000000000000000000", "tool-cached", entry);

      const summary = tracker.getSessionSummary("abc1230000000000000000000000000000");
      expect(summary.totalCostUsd).toBe(0);
      expect(summary.totalInputTokens).toBe(0);
      expect(summary.totalOutputTokens).toBe(0);
      expect(summary.operationCount).toBe(1);
    });
  });

  describe("getSessionSummary", () => {
    it("returns summary with by_model breakdown", () => {
      const sonnetEntry: CostEntry = {
        id: "cost-1",
        sid: "abc1230000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      const haikuEntry: CostEntry = {
        id: "cost-2",
        sid: "abc1230000000000000000000000000000",
        model: "claude-3-5-haiku-20241022",
        inputTokens: 200,
        outputTokens: 100,
        costUsd: 0.005,
        timestamp: new Date().toISOString(),
      };

      tracker.recordCost("abc1230000000000000000000000000000", "invaaa100000000000000000000000000", "tool-a", sonnetEntry);
      tracker.recordCost("abc1230000000000000000000000000000", "invaaa200000000000000000000000000", "tool-b", haikuEntry);

      const summary = tracker.getSessionSummary("abc1230000000000000000000000000000");

      // Check model breakdown
      expect(summary.byModel["claude-3-5-sonnet-20241022"]).toBeDefined();
      expect(summary.byModel["claude-3-5-sonnet-20241022"]?.inputTokens).toBe(100);
      expect(summary.byModel["claude-3-5-sonnet-20241022"]?.outputTokens).toBe(50);
      expect(summary.byModel["claude-3-5-sonnet-20241022"]?.costUsd).toBeCloseTo(0.01, 5);
      expect(summary.byModel["claude-3-5-sonnet-20241022"]?.count).toBe(1);

      expect(summary.byModel["claude-3-5-haiku-20241022"]).toBeDefined();
      expect(summary.byModel["claude-3-5-haiku-20241022"]?.inputTokens).toBe(200);
      expect(summary.byModel["claude-3-5-haiku-20241022"]?.outputTokens).toBe(100);
      expect(summary.byModel["claude-3-5-haiku-20241022"]?.costUsd).toBeCloseTo(0.005, 5);
      expect(summary.byModel["claude-3-5-haiku-20241022"]?.count).toBe(1);
    });

    it("returns summary with by_capability breakdown", () => {
      const entry1: CostEntry = {
        id: "cost-1",
        sid: "abc1230000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      const entry2: CostEntry = {
        id: "cost-2",
        sid: "abc1230000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 150,
        outputTokens: 75,
        costUsd: 0.015,
        timestamp: new Date().toISOString(),
      };

      tracker.recordCost("abc1230000000000000000000000000000", "invaaa100000000000000000000000000", "tool-a", entry1);
      tracker.recordCost("abc1230000000000000000000000000000", "invaaa200000000000000000000000000", "tool-a", entry2);
      tracker.recordCost("abc1230000000000000000000000000000", "invaaa300000000000000000000000000", "tool-b", entry1);

      const summary = tracker.getSessionSummary("abc1230000000000000000000000000000");

      // Check capability breakdown
      expect(summary.byCapability).toBeDefined();
      expect(summary.byCapability?.["tool-a"]).toBeDefined();
      expect(summary.byCapability?.["tool-a"]?.inputTokens).toBe(250); // 100 + 150
      expect(summary.byCapability?.["tool-a"]?.outputTokens).toBe(125); // 50 + 75
      expect(summary.byCapability?.["tool-a"]?.costUsd).toBeCloseTo(0.025, 5);
      expect(summary.byCapability?.["tool-a"]?.count).toBe(2);

      expect(summary.byCapability?.["tool-b"]).toBeDefined();
      expect(summary.byCapability?.["tool-b"]?.inputTokens).toBe(100);
      expect(summary.byCapability?.["tool-b"]?.outputTokens).toBe(50);
      expect(summary.byCapability?.["tool-b"]?.costUsd).toBeCloseTo(0.01, 5);
      expect(summary.byCapability?.["tool-b"]?.count).toBe(1);
    });

    it("returns empty summary for session with no costs", () => {
      const summary = tracker.getSessionSummary("nonexistent00000000000000000000");

      expect(summary.totalCostUsd).toBe(0);
      expect(summary.totalInputTokens).toBe(0);
      expect(summary.totalOutputTokens).toBe(0);
      expect(summary.operationCount).toBe(0);
      expect(summary.byModel).toEqual({});
      expect(summary.byCapability).toEqual({});
    });

    it("aggregates multiple entries for same model", () => {
      const entry1: CostEntry = {
        id: "cost-1",
        sid: "abc1230000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      const entry2: CostEntry = {
        id: "cost-2",
        sid: "abc1230000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 200,
        outputTokens: 100,
        costUsd: 0.02,
        timestamp: new Date().toISOString(),
      };

      tracker.recordCost("abc1230000000000000000000000000000", "invaaa100000000000000000000000000", "tool-a", entry1);
      tracker.recordCost("abc1230000000000000000000000000000", "invaaa200000000000000000000000000", "tool-b", entry2);

      const summary = tracker.getSessionSummary("abc1230000000000000000000000000000");

      expect(summary.byModel["claude-3-5-sonnet-20241022"]?.inputTokens).toBe(300);
      expect(summary.byModel["claude-3-5-sonnet-20241022"]?.outputTokens).toBe(150);
      expect(summary.byModel["claude-3-5-sonnet-20241022"]?.costUsd).toBeCloseTo(0.03, 5);
      expect(summary.byModel["claude-3-5-sonnet-20241022"]?.count).toBe(2);
    });
  });

  describe("getAllSessionSummaries", () => {
    it("returns summaries for all tracked sessions", () => {
      const entry1: CostEntry = {
        id: "cost-1",
        sid: "abc1230000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      const entry2: CostEntry = {
        id: "cost-2",
        sid: "def4560000000000000000000000000000",
        model: "claude-3-5-haiku-20241022",
        inputTokens: 200,
        outputTokens: 100,
        costUsd: 0.005,
        timestamp: new Date().toISOString(),
      };

      tracker.recordCost("abc1230000000000000000000000000000", "invaaa100000000000000000000000000", "tool-a", entry1);
      tracker.recordCost("def4560000000000000000000000000000", "invaaa200000000000000000000000000", "tool-b", entry2);

      const summaries = tracker.getAllSessionSummaries();

      expect(summaries.size).toBe(2);
      expect(summaries.get("abc1230000000000000000000000000000")?.totalCostUsd).toBeCloseTo(0.01, 5);
      expect(summaries.get("def4560000000000000000000000000000")?.totalCostUsd).toBeCloseTo(0.005, 5);
    });

    it("returns empty map when no sessions tracked", () => {
      const summaries = tracker.getAllSessionSummaries();
      expect(summaries.size).toBe(0);
    });
  });

  describe("floating-point accumulation", () => {
    it("handles floating-point arithmetic correctly", () => {
      const entries: CostEntry[] = Array.from({ length: 10 }, (_, i) => ({
        id: `cost-${i}`,
        sid: "aaa1110000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 10,
        outputTokens: 5,
        costUsd: 0.001,
        timestamp: new Date().toISOString(),
      }));

      for (const entry of entries) {
        tracker.recordCost("aaa1110000000000000000000000000000", `inv${entry.id}00000000000000000000`, "tool", entry);
      }

      const summary = tracker.getSessionSummary("aaa1110000000000000000000000000000");

      // Should be close to 0.01 (10 * 0.001)
      expect(summary.totalCostUsd).toBeCloseTo(0.01, 5);
      expect(summary.totalInputTokens).toBe(100);
      expect(summary.totalOutputTokens).toBe(50);
    });
  });

  describe("recordChildCost", () => {
    it("records child cost entry with childSessionId", () => {
      const childEntry: CostEntry = {
        id: "cost-child",
        sid: "parent000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 200,
        outputTokens: 100,
        costUsd: 0.02,
        timestamp: new Date().toISOString(),
        childSessionId: "child0000000000000000000000000000",
        turns: 3,
      };

      tracker.recordChildCost(
        "parent000000000000000000000000000",
        "invchild000000000000000000000000",
        "child-capability",
        childEntry
      );

      const summary = tracker.getSessionSummary("parent000000000000000000000000000");
      expect(summary.totalCostUsd).toBeCloseTo(0.02, 5);
      expect(summary.totalInputTokens).toBe(200);
      expect(summary.totalOutputTokens).toBe(100);
      expect(summary.totalTurns).toBe(3);
    });

    it("aggregates turns from multiple child invocations", () => {
      const child1: CostEntry = {
        id: "cost-child1",
        sid: "parent000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
        childSessionId: "child1000000000000000000000000000",
        turns: 2,
      };

      const child2: CostEntry = {
        id: "cost-child2",
        sid: "parent000000000000000000000000000",
        model: "claude-3-5-haiku-20241022",
        inputTokens: 150,
        outputTokens: 75,
        costUsd: 0.005,
        timestamp: new Date().toISOString(),
        childSessionId: "child2000000000000000000000000000",
        turns: 5,
      };

      tracker.recordChildCost("parent000000000000000000000000000", "inv1", "child1", child1);
      tracker.recordChildCost("parent000000000000000000000000000", "inv2", "child2", child2);

      const summary = tracker.getSessionSummary("parent000000000000000000000000000");
      expect(summary.totalTurns).toBe(7); // 2 + 5
      expect(summary.totalCostUsd).toBeCloseTo(0.015, 5);
    });

    it("handles entries with no turns field", () => {
      const entryWithoutTurns: CostEntry = {
        id: "cost-no-turns",
        sid: "session000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      tracker.recordCost("session000000000000000000000000000", "inv1", "cap", entryWithoutTurns);

      const summary = tracker.getSessionSummary("session000000000000000000000000000");
      expect(summary.totalTurns).toBe(0); // No turns should default to 0
    });
  });

  describe("getChildCostEntries", () => {
    it("returns only entries with childSessionId set", () => {
      const regularEntry: CostEntry = {
        id: "cost-regular",
        sid: "parent000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      const childEntry1: CostEntry = {
        id: "cost-child1",
        sid: "parent000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 200,
        outputTokens: 100,
        costUsd: 0.02,
        timestamp: new Date().toISOString(),
        childSessionId: "child1000000000000000000000000000",
        turns: 3,
      };

      const childEntry2: CostEntry = {
        id: "cost-child2",
        sid: "parent000000000000000000000000000",
        model: "claude-3-5-haiku-20241022",
        inputTokens: 150,
        outputTokens: 75,
        costUsd: 0.005,
        timestamp: new Date().toISOString(),
        childSessionId: "child2000000000000000000000000000",
        turns: 2,
      };

      tracker.recordCost("parent000000000000000000000000000", "inv-regular", "cap-regular", regularEntry);
      tracker.recordChildCost("parent000000000000000000000000000", "inv-child1", "cap-child1", childEntry1);
      tracker.recordChildCost("parent000000000000000000000000000", "inv-child2", "cap-child2", childEntry2);

      const childEntries = tracker.getChildCostEntries("parent000000000000000000000000000");

      expect(childEntries).toHaveLength(2);
      expect(childEntries[0]?.childSessionId).toBe("child1000000000000000000000000000");
      expect(childEntries[0]?.capabilityName).toBe("cap-child1");
      expect(childEntries[1]?.childSessionId).toBe("child2000000000000000000000000000");
      expect(childEntries[1]?.capabilityName).toBe("cap-child2");
    });

    it("returns empty array when no child entries exist", () => {
      const regularEntry: CostEntry = {
        id: "cost-regular",
        sid: "session000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      tracker.recordCost("session000000000000000000000000000", "inv-regular", "cap-regular", regularEntry);

      const childEntries = tracker.getChildCostEntries("session000000000000000000000000000");

      expect(childEntries).toHaveLength(0);
    });

    it("returns empty array for non-existent session", () => {
      const childEntries = tracker.getChildCostEntries("nonexistent00000000000000000000");

      expect(childEntries).toHaveLength(0);
    });
  });

  describe("getSessionSummary with totalTurns", () => {
    it("includes totalTurns in empty session summary", () => {
      const summary = tracker.getSessionSummary("empty00000000000000000000000000");

      expect(summary.totalTurns).toBe(0);
      expect(summary.totalCostUsd).toBe(0);
    });

    it("aggregates totalTurns from mixed entries", () => {
      const entry1: CostEntry = {
        id: "cost-1",
        sid: "mixed00000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
        turns: 1,
      };

      const entry2: CostEntry = {
        id: "cost-2",
        sid: "mixed00000000000000000000000000000",
        model: "claude-3-5-haiku-20241022",
        inputTokens: 200,
        outputTokens: 100,
        costUsd: 0.005,
        timestamp: new Date().toISOString(),
        turns: 4,
      };

      const entry3: CostEntry = {
        id: "cost-3",
        sid: "mixed00000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 50,
        outputTokens: 25,
        costUsd: 0.005,
        timestamp: new Date().toISOString(),
        // No turns field
      };

      tracker.recordCost("mixed00000000000000000000000000000", "inv1", "cap1", entry1);
      tracker.recordCost("mixed00000000000000000000000000000", "inv2", "cap2", entry2);
      tracker.recordCost("mixed00000000000000000000000000000", "inv3", "cap3", entry3);

      const summary = tracker.getSessionSummary("mixed00000000000000000000000000000");
      expect(summary.totalTurns).toBe(5); // 1 + 4 + 0
    });
  });

  describe("cache metrics aggregation", () => {
    it("aggregates cache creation and cache read tokens (AC-4, AC-11)", () => {
      const entry1: CostEntry = {
        id: "cost-1",
        sid: "cache00000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 10000,
        outputTokens: 500,
        costUsd: 0.05,
        timestamp: new Date().toISOString(),
        promptCacheWrite: 2000,
        promptCacheRead: 7000,
      };

      const entry2: CostEntry = {
        id: "cost-2",
        sid: "cache00000000000000000000000000000",
        model: "claude-3-5-haiku-20241022",
        inputTokens: 5000,
        outputTokens: 250,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
        promptCacheWrite: 1000,
        promptCacheRead: 3000,
      };

      tracker.recordCost("cache00000000000000000000000000000", "inv1", "cap1", entry1);
      tracker.recordCost("cache00000000000000000000000000000", "inv2", "cap2", entry2);

      const summary = tracker.getSessionSummary("cache00000000000000000000000000000");

      expect(summary.totalPromptCacheWrite).toBe(3000); // 2000 + 1000
      expect(summary.totalPromptCacheRead).toBe(10000); // 7000 + 3000
    });

    it("calculates cache hit rate correctly (AC-4, AC-12)", () => {
      const entry: CostEntry = {
        id: "cost-1",
        sid: "hitrate00000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 10000,
        outputTokens: 500,
        costUsd: 0.05,
        timestamp: new Date().toISOString(),
        promptCacheWrite: 2000,
        promptCacheRead: 7000,
      };

      tracker.recordCost("hitrate00000000000000000000000000", "inv1", "cap1", entry);

      const summary = tracker.getSessionSummary("hitrate00000000000000000000000000");

      expect(summary.cacheHitRate).toBeCloseTo(7000 / 17000, 5); // 7000 / (10000 + 7000)
    });

    it("handles zero cache tokens (AC-4, AC-10, AC-12)", () => {
      const entry: CostEntry = {
        id: "cost-1",
        sid: "nocache00000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 1000,
        outputTokens: 500,
        costUsd: 0.05,
        timestamp: new Date().toISOString(),
      };

      tracker.recordCost("nocache00000000000000000000000000", "inv1", "cap1", entry);

      const summary = tracker.getSessionSummary("nocache00000000000000000000000000");

      expect(summary.totalPromptCacheWrite).toBe(0);
      expect(summary.totalPromptCacheRead).toBe(0);
      expect(summary.cacheHitRate).toBe(0);
    });

    it("returns zero cache hit rate when no input tokens (AC-4, AC-12)", () => {
      const summary = tracker.getSessionSummary("empty00000000000000000000000000");

      expect(summary.totalInputTokens).toBe(0);
      expect(summary.cacheHitRate).toBe(0);
    });

    it("handles mixed cache and non-cache entries (AC-4, AC-11)", () => {
      const cacheEntry: CostEntry = {
        id: "cost-1",
        sid: "mixed00000000000000000000000000000",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 10000,
        outputTokens: 500,
        costUsd: 0.05,
        timestamp: new Date().toISOString(),
        promptCacheWrite: 2000,
        promptCacheRead: 7000,
      };

      const noCacheEntry: CostEntry = {
        id: "cost-2",
        sid: "mixed00000000000000000000000000000",
        model: "claude-3-5-haiku-20241022",
        inputTokens: 5000,
        outputTokens: 250,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
        // No cache fields
      };

      tracker.recordCost("mixed00000000000000000000000000000", "inv1", "cap1", cacheEntry);
      tracker.recordCost("mixed00000000000000000000000000000", "inv2", "cap2", noCacheEntry);

      const summary = tracker.getSessionSummary("mixed00000000000000000000000000000");

      expect(summary.totalPromptCacheWrite).toBe(2000);
      expect(summary.totalPromptCacheRead).toBe(7000);
      expect(summary.totalInputTokens).toBe(15000); // 10000 + 5000
      expect(summary.cacheHitRate).toBeCloseTo(7000 / 22000, 4); // 7000 / (15000 + 7000)
    });
  });
});
