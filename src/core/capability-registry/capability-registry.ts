/**
 * Capability Registry - Phase 5a Implementation.
 * Orchestrates capability registration, lifecycle management, context injection, and MCP server binding.
 */

import type { McpServer, ToolCallback } from "@modelcontextprotocol/sdk/server/mcp.js";
import type { AnySchema } from "@modelcontextprotocol/sdk/server/zod-compat.js";
import type {
  CapabilityDefinition,
  CapabilityType,
} from "./capability-registry.types.js";
import type { AIProvider } from "../ai-provider/ai-provider.types.js";
import type { SessionManager } from "../session/session.manager.js";
import type { CostTracker } from "../cost/cost.tracker.js";
import type { CostReportWriter } from "../cost/cost-report.writer.js";
import type { DiskWriter } from "../logger/disk-writer.js";
import type { PromptLoader } from "../prompt/prompt.loader.js";
import type { Logger } from "../logger/logger.js";
import { CapabilityError } from "../errors.js";
import {
  SHUTDOWN_COST_WAIT_MS,
  SHUTDOWN_COST_WAIT_MAX_MS,
} from "../../config/constants.js";
import { handleCapabilityInvocation } from "./invocation-handler.js";
import type { McpToolResponse } from "./invocation-handler.js";
import type { ChildCostEntry } from "../cost/cost.types.js";
import type { ChildSessionCostEntry } from "../cost/cost-report.schemas.js";

/**
 * Framework dependencies for CapabilityRegistry.
 */
export interface CapabilityRegistryDeps {
  sessionManager: SessionManager;
  costTracker: CostTracker;
  costReportWriter: CostReportWriter;
  diskWriter: DiskWriter;
  promptLoader: PromptLoader;
  logger: Logger;
  aiProvider: AIProvider;
}

/**
 * Registry for managing capabilities with full lifecycle orchestration.
 */
export class CapabilityRegistry {
  private readonly capabilities = new Map<string, CapabilityDefinition>();
  private readonly deps: CapabilityRegistryDeps;
  private shuttingDown = false;

  constructor(deps: CapabilityRegistryDeps) {
    this.deps = deps;
  }

  /**
   * Register a capability with the registry.
   * Validates prompt version and registers prompts with PromptLoader.
   *
   * @param definition - Capability definition
   * @throws {@link CapabilityError} When capability ID already registered
   * @throws {@link PromptVersionNotFoundError} When current prompt version invalid
   */
  registerCapability(definition: CapabilityDefinition): void {
    if (this.capabilities.has(definition.id)) {
      throw new CapabilityError(
        `Capability ${definition.id} already registered`
      );
    }

    this.deps.promptLoader.registerCapabilityPrompts(
      definition.id,
      definition.promptRegistry,
      definition.currentPromptVersion
    );

    this.capabilities.set(definition.id, definition);
  }

  /**
   * Get a registered capability by ID.
   *
   * @param id - Capability identifier
   * @returns Capability definition or undefined if not found
   */
  getCapability(id: string): CapabilityDefinition | undefined {
    return this.capabilities.get(id);
  }

  /**
   * List all registered capabilities, optionally filtered by type.
   *
   * @param type - Optional capability type filter
   * @returns Array of capability definitions
   */
  listCapabilities(type?: CapabilityType): CapabilityDefinition[] {
    const all = Array.from(this.capabilities.values());
    if (!type) return all;
    return all.filter((cap) => cap.type === type);
  }

  /**
   * Bind registered capabilities to an MCP server.
   *
   * @param server - MCP server instance
   */
  bindToMcpServer(server: McpServer): void {
    const tools = this.listCapabilities("tool")
      .filter(cap => cap.visibility !== "internal");

    for (const tool of tools) {
      const handler = async (rawInput: unknown) => {
        return this.handleCapabilityInvocation(tool.id, rawInput);
      };

      server.registerTool(
        tool.id,
        {
          title: tool.name,
          description: tool.description,
          inputSchema: tool.inputSchema as unknown as AnySchema,
        },
        handler as unknown as ToolCallback<AnySchema>
      );
    }
  }

  /**
   * Handle capability invocation with full lifecycle orchestration.
   * Delegates to the extracted invocation handler.
   *
   * @param capabilityName - Name of the capability to invoke
   * @param rawInput - Raw input from MCP client
   * @returns MCP response with result or error
   */
  async handleCapabilityInvocation(
    capabilityName: string,
    rawInput: unknown
  ): Promise<McpToolResponse> {
    return handleCapabilityInvocation(
      capabilityName,
      rawInput,
      this.capabilities,
      this.deps,
      this.shuttingDown,
      (name, input) => this.handleCapabilityInvocation(name, input)
    );
  }

  /**
   * Set shutting down flag (prevents new invocations).
   * @internal
   */
  setShuttingDown(value: boolean): void {
    this.shuttingDown = value;
  }

  /**
   * Check if server is shutting down.
   * @returns True if shutting down
   */
  isShuttingDown(): boolean {
    return this.shuttingDown;
  }

  /**
   * Graceful shutdown: close all sessions, write reports, close disk writer.
   */
  async gracefulShutdown(): Promise<void> {
    this.shuttingDown = true;

    await this.sleep(Math.min(SHUTDOWN_COST_WAIT_MS, SHUTDOWN_COST_WAIT_MAX_MS));

    const allSessions = this.deps.sessionManager.getAllSessions();

    for (const session of allSessions) {
      // Close if still active
      if (session.state === "active") {
        this.deps.sessionManager.closeSession(session.id);
      }

      // Write cost report for all sessions with costs (regardless of state)
      try {
        const costSummary = this.deps.costTracker.getSessionSummary(session.id);
        if (costSummary.totalCostUsd > 0) {
          const childEntries = this.mapChildCostEntries(
            this.deps.costTracker.getChildCostEntries(session.id)
          );
          await this.deps.costReportWriter.writeSessionToReport(session, costSummary, childEntries);
        }
      } catch (error) {
        this.deps.logger.error("Failed to write cost report during shutdown", {
          sid: session.id,
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    await this.deps.diskWriter.closeAll();
  }

  /**
   * Maps ChildCostEntry[] to ChildSessionCostEntry[] for report writing.
   * @internal
   */
  private mapChildCostEntries(entries: ChildCostEntry[]): ChildSessionCostEntry[] {
    return entries.map((entry) => ({
      sid: entry.childSessionId || entry.sid,
      capability: entry.capabilityName,
      costUsd: entry.costUsd,
      turns: entry.turns || 0,
      inputTokens: entry.inputTokens,
      outputTokens: entry.outputTokens,
      model: entry.model,
      status: entry.status || "success",
      ...(entry.commitSha ? { commitSha: entry.commitSha } : {}),
    }));
  }

  /**
   * Sleep utility.
   * @internal
   */
  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
