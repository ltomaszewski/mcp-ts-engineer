/**
 * Capability registry type definitions.
 * Registry tracks available capabilities with full lifecycle management.
 */

import type { ZodSchema } from "zod";
import type { PromptRegistry } from "../prompt/prompt.types.js";
import type { AIQueryRequest, AIQueryResult } from "../ai-provider/ai-provider.types.js";
import type { Session, CapabilityInvocation } from "../session/session.types.js";

/** Capability type */
export type CapabilityType = "tool" | "resource" | "prompt";

/** Capability visibility determines MCP exposure */
export type CapabilityVisibility = "public" | "internal";

/**
 * Context passed to capability handlers with framework integration.
 * Provides access to session, invocation, logging, and child capability invocation.
 */
export interface CapabilityContext {
  /** Current session */
  session: Session;
  /** Current invocation metadata */
  invocation: CapabilityInvocation;
  /** Pre-bound logger with session/capability context */
  logger: {
    info: (message: string, context?: Record<string, unknown>) => void;
    debug: (message: string, context?: Record<string, unknown>) => void;
    error: (message: string, context?: Record<string, unknown>) => void;
    warn: (message: string, context?: Record<string, unknown>) => void;
  };
  /** Get current session cost (read-only) */
  getSessionCost: () => { totalCostUsd: number; totalInputTokens: number; totalOutputTokens: number; totalTurns: number };
  /** Current prompt version being used */
  promptVersion: string;
  /** AI provider name */
  providerName: string;
  /**
   * Invoke another capability within this session (creates child invocation).
   * @param capabilityName - Name of capability to invoke
   * @param input - Input for the capability
   * @returns Result from the invoked capability
   */
  invokeCapability: (capabilityName: string, input: unknown) => Promise<unknown>;
}

/**
 * Capability definition with full lifecycle hooks.
 */
export interface CapabilityDefinition<TInput = unknown, TOutput = unknown> {
  /** Capability identifier (used for MCP tool name) */
  id: string;
  /** Capability type */
  type: CapabilityType;
  /** Visibility determines if capability is exposed as MCP tool (default: "public") */
  visibility?: CapabilityVisibility;
  /** Human-readable name */
  name: string;
  /** Description for LLM */
  description: string;
  /** Zod schema for input validation */
  inputSchema: ZodSchema<TInput>;
  /** Prompt registry for this capability */
  promptRegistry: PromptRegistry;
  /** Current active prompt version */
  currentPromptVersion: string;
  /** Default request options (can be overridden per invocation) */
  defaultRequestOptions?: Partial<AIQueryRequest>;
  /**
   * Prepare prompt input from validated raw input.
   * Called after input validation, before prompt building.
   *
   * @param validatedInput - Input validated against inputSchema
   * @param context - Capability context
   * @returns Data to pass to prompt's build() function
   */
  preparePromptInput: (validatedInput: TInput, context: CapabilityContext) => unknown;
  /**
   * Process AI result into final output.
   * Called after AI query completes successfully.
   *
   * @param validatedInput - Original validated input
   * @param aiResult - Result from AI provider
   * @param context - Capability context
   * @returns Final output to return to MCP client
   */
  processResult: (
    validatedInput: TInput,
    aiResult: AIQueryResult,
    context: CapabilityContext
  ) => TOutput | Promise<TOutput>;
}
