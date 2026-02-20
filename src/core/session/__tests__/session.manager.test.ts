/**
 * Tests for SessionManager - session lifecycle and recursion detection.
 */

import { describe, it, expect, beforeEach, afterEach } from "@jest/globals";
import { SessionManager } from "../session.manager.js";
import type { CostEntry } from "../../cost/cost.types.js";

describe("SessionManager", () => {
  let manager: SessionManager;

  beforeEach(() => {
    manager = new SessionManager();
    // Clear any environment variable overrides
    delete process.env.SESSION_MAX_DEPTH;
  });

  afterEach(() => {
    delete process.env.SESSION_MAX_DEPTH;
  });

  describe("createSession", () => {
    it("creates session with valid ID format [32 hex chars without prefix]", () => {
      const session = manager.createSession("test-capability");

      expect(session.id).toMatch(/^[a-f0-9]{32}$/);
      expect(session.state).toBe("active");
      expect(session.invocations).toEqual([]);
    });

    it("creates session with root capability name in metadata", () => {
      const session = manager.createSession("root-tool");

      expect(session.metadata?.rootCapability).toBe("root-tool");
    });

    it("initializes session with zero cost", () => {
      const session = manager.createSession("test-capability");

      expect(session.totalInputTokens).toBe(0);
      expect(session.totalOutputTokens).toBe(0);
      expect(session.totalCost).toBe(0);
    });
  });

  describe("startInvocation", () => {
    it("starts invocation and returns invocation ID", () => {
      const session = manager.createSession("root");
      const invocationId = manager.startInvocation(session.id, "capability-a");

      expect(invocationId).toMatch(/^[a-f0-9]{32}$/);
    });

    it("tracks invocation chain for depth checking", () => {
      const session = manager.createSession("root");
      const inv1 = manager.startInvocation(session.id, "cap-a");
      const inv2 = manager.startInvocation(session.id, "cap-b", inv1);

      // Internal state should track chain [cap-a, cap-b]
      // This will be verified by recursion detection tests
      expect(inv2).toMatch(/^[a-f0-9]{32}$/);
    });

    it("throws error when session not found", () => {
      expect(() => {
        manager.startInvocation("nonexistent00000000000000000000", "cap");
      }).toThrow("Session nonexistent00000000000000000000 not found");
    });

    it("detects direct recursion (A calls A)", () => {
      const session = manager.createSession("tool-a");
      const inv1 = manager.startInvocation(session.id, "tool-a");

      expect(() => {
        manager.startInvocation(session.id, "tool-a", inv1);
      }).toThrow("Recursion detected: tool-a is already in the invocation chain");
    });

    it("detects transitive recursion (A → B → A)", () => {
      const session = manager.createSession("root");
      const invA1 = manager.startInvocation(session.id, "tool-a");
      const invB = manager.startInvocation(session.id, "tool-b", invA1);

      expect(() => {
        manager.startInvocation(session.id, "tool-a", invB);
      }).toThrow("Recursion detected: tool-a is already in the invocation chain");
    });

    it("allows sibling fan-out (A → B, A → C where B = C)", () => {
      const session = manager.createSession("root");
      const invA = manager.startInvocation(session.id, "tool-a");
      const invB = manager.startInvocation(session.id, "tool-b", invA);

      // Complete invB to pop it from chain
      const mockCost: CostEntry = {
        id: "cost-1",
        sid: session.id,
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };
      manager.completeInvocation(session.id, invB, { result: "done" }, mockCost);

      // Now A → C should succeed (C is same as B but B was completed)
      expect(() => {
        manager.startInvocation(session.id, "tool-b", invA);
      }).not.toThrow();
    });

    it("enforces depth limit (default 5)", () => {
      const session = manager.createSession("root");
      let currentInv = manager.startInvocation(session.id, "cap-1");

      // Create chain of depth 4 (cap-1 → cap-2 → cap-3 → cap-4)
      for (let i = 2; i <= 4; i++) {
        currentInv = manager.startInvocation(session.id, `cap-${i}`, currentInv);
      }

      // Depth 5 should succeed (within limit)
      const inv5 = manager.startInvocation(session.id, "cap-5", currentInv);
      expect(inv5).toMatch(/^[a-f0-9]{32}$/);

      // Depth 6 should fail (exceeds limit of 5)
      expect(() => {
        manager.startInvocation(session.id, "cap-6", inv5);
      }).toThrow("Maximum invocation depth (5) exceeded");
    });

    it("enforces SESSION_MAX_DEPTH from environment variable", () => {
      process.env.SESSION_MAX_DEPTH = "2";
      const envManager = new SessionManager();

      const session = envManager.createSession("root");
      const inv1 = envManager.startInvocation(session.id, "cap-1");
      const inv2 = envManager.startInvocation(session.id, "cap-2", inv1);

      expect(inv2).toMatch(/^[a-f0-9]{32}$/);

      // Depth 3 should fail with custom limit
      expect(() => {
        envManager.startInvocation(session.id, "cap-3", inv2);
      }).toThrow("Maximum invocation depth (2) exceeded");
    });

    it("enforces max invocations per session (50)", () => {
      const session = manager.createSession("root");

      // Create 50 invocations (each completes immediately)
      const mockCost: CostEntry = {
        id: "cost-x",
        sid: session.id,
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 10,
        outputTokens: 5,
        costUsd: 0.001,
        timestamp: new Date().toISOString(),
      };

      for (let i = 0; i < 50; i++) {
        const inv = manager.startInvocation(session.id, `cap-${i}`);
        manager.completeInvocation(session.id, inv, { result: "ok" }, mockCost);
      }

      // 51st invocation should fail
      expect(() => {
        manager.startInvocation(session.id, "cap-51");
      }).toThrow("Maximum invocations per session (50) exceeded");
    });

    it("enforces session budget limit (10 USD)", () => {
      const session = manager.createSession("root");

      // Add 9.99 USD cost
      const highCost: CostEntry = {
        id: "cost-high",
        sid: session.id,
        model: "claude-opus-4-20250514",
        inputTokens: 100000,
        outputTokens: 50000,
        costUsd: 9.99,
        timestamp: new Date().toISOString(),
      };

      const inv1 = manager.startInvocation(session.id, "cap-1");
      manager.completeInvocation(session.id, inv1, { result: "ok" }, highCost);

      // Next invocation should fail (would exceed budget)
      expect(() => {
        manager.startInvocation(session.id, "cap-2");
      }).toThrow("Session budget limit (10 USD) exceeded (current: 9.99)");
    });

    it("enforces session timeout (30 minutes)", () => {
      const session = manager.createSession("root");

      // Manually set startedAt to 31 minutes ago
      const oldSession = manager.getSession(session.id);
      if (oldSession) {
        const thirtyOneMinutesAgo = new Date(Date.now() - 31 * 60 * 1000);
        (oldSession as any).startedAt = thirtyOneMinutesAgo.toISOString();
      }

      expect(() => {
        manager.startInvocation(session.id, "cap-timeout");
      }).toThrow("Session timeout (30 minutes) exceeded");
    });
  });

  describe("completeInvocation", () => {
    it("completes invocation and pops from chain", () => {
      const session = manager.createSession("root");
      const inv = manager.startInvocation(session.id, "cap-a");

      const mockCost: CostEntry = {
        id: "cost-1",
        sid: session.id,
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      manager.completeInvocation(session.id, inv, { result: "success" }, mockCost);

      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.invocations).toHaveLength(1);
      expect(updatedSession?.invocations[0]?.output).toEqual({ result: "success" });
    });

    it("accumulates cost in session totals", () => {
      const session = manager.createSession("root");
      const inv = manager.startInvocation(session.id, "cap-a");

      const mockCost: CostEntry = {
        id: "cost-1",
        sid: session.id,
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      manager.completeInvocation(session.id, inv, { result: "ok" }, mockCost);

      const updatedSession = manager.getSession(session.id);
      expect(updatedSession?.totalInputTokens).toBe(100);
      expect(updatedSession?.totalOutputTokens).toBe(50);
      expect(updatedSession?.totalCost).toBeCloseTo(0.01, 5);
    });

    it("throws error when session not found", () => {
      const mockCost: CostEntry = {
        id: "cost-1",
        sid: "nonexistent",
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      expect(() => {
        manager.completeInvocation("nonexistent00000000000000000000", "fake", {}, mockCost);
      }).toThrow("Session nonexistent00000000000000000000 not found");
    });

    it("throws error when invocation not found in chain", () => {
      const session = manager.createSession("root");
      const mockCost: CostEntry = {
        id: "cost-1",
        sid: session.id,
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 100,
        outputTokens: 50,
        costUsd: 0.01,
        timestamp: new Date().toISOString(),
      };

      expect(() => {
        manager.completeInvocation(session.id, "nonexistent", {}, mockCost);
      }).toThrow("Invocation nonexistent not found in active chain");
    });
  });

  describe("closeSession", () => {
    it("marks session as completed", () => {
      const session = manager.createSession("root");
      manager.closeSession(session.id);

      const closed = manager.getSession(session.id);
      expect(closed?.state).toBe("completed");
      expect(closed?.completedAt).toBeDefined();
    });

    it("throws error when session not found", () => {
      expect(() => {
        manager.closeSession("nonexistent00000000000000000000");
      }).toThrow("Session nonexistent00000000000000000000 not found");
    });

    it("allows closing already completed session (idempotent)", () => {
      const session = manager.createSession("root");
      manager.closeSession(session.id);
      manager.closeSession(session.id); // Should not throw

      const closed = manager.getSession(session.id);
      expect(closed?.state).toBe("completed");
    });
  });

  describe("closeAll", () => {
    it("closes all active sessions", () => {
      const session1 = manager.createSession("cap-1");
      const session2 = manager.createSession("cap-2");
      const session3 = manager.createSession("cap-3");

      // Close one manually
      manager.closeSession(session1.id);

      const closedSessions = manager.closeAll();

      expect(closedSessions).toHaveLength(2); // Only 2 were active
      expect(closedSessions.map((s) => s.id)).toContain(session2.id);
      expect(closedSessions.map((s) => s.id)).toContain(session3.id);

      // All should now be completed
      expect(manager.getSession(session1.id)?.state).toBe("completed");
      expect(manager.getSession(session2.id)?.state).toBe("completed");
      expect(manager.getSession(session3.id)?.state).toBe("completed");
    });

    it("returns empty array when no active sessions", () => {
      const closedSessions = manager.closeAll();
      expect(closedSessions).toEqual([]);
    });
  });

  describe("getActiveSessions", () => {
    it("returns only active sessions", () => {
      const session1 = manager.createSession("cap-1");
      const session2 = manager.createSession("cap-2");
      manager.closeSession(session1.id);

      const active = manager.getActiveSessions();

      expect(active).toHaveLength(1);
      expect(active[0]?.id).toBe(session2.id);
      expect(active[0]?.state).toBe("active");
    });

    it("returns empty array when no sessions exist", () => {
      const active = manager.getActiveSessions();
      expect(active).toEqual([]);
    });
  });

  describe("getAllSessions", () => {
    it("returns all sessions regardless of state", () => {
      const session1 = manager.createSession("cap-1");
      const session2 = manager.createSession("cap-2");
      const session3 = manager.createSession("cap-3");

      // Close one session to create a mix of states
      manager.closeSession(session1.id);

      const allSessions = manager.getAllSessions();
      const activeSessions = manager.getActiveSessions();

      // getAllSessions should return all 3
      expect(allSessions).toHaveLength(3);
      expect(allSessions.some((s) => s.id === session1.id)).toBe(true);
      expect(allSessions.some((s) => s.id === session2.id)).toBe(true);
      expect(allSessions.some((s) => s.id === session3.id)).toBe(true);

      // getActiveSessions should return only 2
      expect(activeSessions).toHaveLength(2);
    });

    it("returns empty array when no sessions exist", () => {
      const allSessions = manager.getAllSessions();
      expect(allSessions).toEqual([]);
    });

    it("returns sessions with correct data", () => {
      const session = manager.createSession("test-cap");

      const allSessions = manager.getAllSessions();

      expect(allSessions).toHaveLength(1);
      expect(allSessions[0]?.id).toBe(session.id);
      expect(allSessions[0]?.state).toBe("active");
      expect(allSessions[0]?.metadata?.rootCapability).toBe("test-cap");
    });
  });

  describe("getSession", () => {
    it("returns session by ID", () => {
      const session = manager.createSession("root");
      const retrieved = manager.getSession(session.id);

      expect(retrieved).toBeDefined();
      expect(retrieved?.id).toBe(session.id);
    });

    it("returns undefined for non-existent session", () => {
      const retrieved = manager.getSession("nonexistent00000000000000000000");
      expect(retrieved).toBeUndefined();
    });
  });

  describe("propagateChildCost", () => {
    it("increments parent session totalCost", () => {
      const session = manager.createSession("root");

      manager.propagateChildCost(session.id, {
        costUsd: 0.05,
        inputTokens: 500,
        outputTokens: 250,
      });

      const updated = manager.getSession(session.id);
      expect(updated?.totalCost).toBeCloseTo(0.05, 5);
    });

    it("increments parent session totalInputTokens and totalOutputTokens", () => {
      const session = manager.createSession("root");

      manager.propagateChildCost(session.id, {
        costUsd: 0.02,
        inputTokens: 200,
        outputTokens: 100,
      });

      const updated = manager.getSession(session.id);
      expect(updated?.totalInputTokens).toBe(200);
      expect(updated?.totalOutputTokens).toBe(100);
    });

    it("accumulates multiple child costs", () => {
      const session = manager.createSession("root");

      manager.propagateChildCost(session.id, {
        costUsd: 0.01,
        inputTokens: 100,
        outputTokens: 50,
      });

      manager.propagateChildCost(session.id, {
        costUsd: 0.02,
        inputTokens: 200,
        outputTokens: 100,
      });

      const updated = manager.getSession(session.id);
      expect(updated?.totalCost).toBeCloseTo(0.03, 5);
      expect(updated?.totalInputTokens).toBe(300);
      expect(updated?.totalOutputTokens).toBe(150);
    });

    it("accumulates on top of direct session costs", () => {
      const session = manager.createSession("root");
      const inv = manager.startInvocation(session.id, "parent-cap");

      const directCost: CostEntry = {
        id: "cost-direct",
        sid: session.id,
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 50,
        outputTokens: 25,
        costUsd: 0.005,
        timestamp: new Date().toISOString(),
      };

      manager.completeInvocation(session.id, inv, { result: "ok" }, directCost);

      // Now add child cost
      manager.propagateChildCost(session.id, {
        costUsd: 0.01,
        inputTokens: 100,
        outputTokens: 50,
      });

      const updated = manager.getSession(session.id);
      expect(updated?.totalCost).toBeCloseTo(0.015, 5); // 0.005 + 0.01
      expect(updated?.totalInputTokens).toBe(150); // 50 + 100
      expect(updated?.totalOutputTokens).toBe(75); // 25 + 50
    });

    it("throws error when session not found", () => {
      expect(() => {
        manager.propagateChildCost("nonexistent00000000000000000000", {
          costUsd: 0.01,
          inputTokens: 100,
          outputTokens: 50,
        });
      }).toThrow("Session nonexistent00000000000000000000 not found");
    });

    it("triggers budget limit when child costs push totalCost above threshold", () => {
      const session = manager.createSession("root");

      // Add direct cost bringing session to 5 USD
      const inv1 = manager.startInvocation(session.id, "parent-direct");
      const directCost: CostEntry = {
        id: "cost-direct",
        sid: session.id,
        model: "claude-3-5-sonnet-20241022",
        inputTokens: 50000,
        outputTokens: 25000,
        costUsd: 5.0,
        timestamp: new Date().toISOString(),
      };
      manager.completeInvocation(session.id, inv1, { result: "ok" }, directCost);

      // Propagate child cost bringing total to 9.99 USD (below limit)
      manager.propagateChildCost(session.id, {
        costUsd: 4.99,
        inputTokens: 50000,
        outputTokens: 25000,
      });

      const updated = manager.getSession(session.id);
      expect(updated?.totalCost).toBeCloseTo(9.99, 5);

      // Next invocation should fail (totalCost >= 10 * 0.999)
      expect(() => {
        manager.startInvocation(session.id, "next-invocation");
      }).toThrow("Session budget limit (10 USD) exceeded (current: 9.99)");
    });
  });
});
