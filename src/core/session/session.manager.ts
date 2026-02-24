/**
 * SessionManager - manages session lifecycle, invocation tracking, and recursion detection.
 */

import crypto from 'node:crypto'
import {
  MAX_INVOCATIONS_PER_SESSION,
  MAX_SESSION_BUDGET_USD,
  MAX_SESSION_DURATION_MS,
  SESSION_MAX_DEPTH,
} from '../../config/constants.js'
import type { CostEntry } from '../cost/cost.types.js'
import type { CapabilityInvocation, Session } from './session.types.js'

/**
 * Internal state for tracking active invocations and their chain.
 * @internal
 */
interface InvocationState {
  /** Invocation ID */
  id: string
  /** Capability name */
  capability: string
  /** Parent invocation ID (for chain building) */
  parentId?: string
  /** Timestamp when invocation started */
  startedAt: string
}

/**
 * SessionManager manages session lifecycle and enforces limits.
 *
 * Features:
 * - Creates and closes sessions
 * - Tracks invocation chains for recursion detection
 * - Enforces depth limits (configurable via SESSION_MAX_DEPTH env var)
 * - Enforces invocation count, budget, and timeout limits
 * - Detects direct and transitive recursion
 * - Allows sibling fan-out (A → B, A → C where B completed)
 */
export class SessionManager {
  /** Active sessions keyed by session ID */
  private sessions: Map<string, Session> = new Map()

  /** Active invocation chains keyed by session ID */
  private invocationChains: Map<string, InvocationState[]> = new Map()

  /** Maximum depth for invocation chains */
  private readonly maxDepth: number

  constructor() {
    // Allow SESSION_MAX_DEPTH override from environment
    const envMaxDepth = process.env.SESSION_MAX_DEPTH
    this.maxDepth = envMaxDepth ? parseInt(envMaxDepth, 10) : SESSION_MAX_DEPTH
  }

  /**
   * Creates a new session.
   *
   * @param rootCapabilityName - Name of the root capability starting this session
   * @returns Created session
   */
  createSession(rootCapabilityName: string): Session {
    const sessionId = crypto.randomBytes(16).toString('hex')

    const session: Session = {
      id: sessionId,
      state: 'active',
      startedAt: new Date().toISOString(),
      metadata: { rootCapability: rootCapabilityName },
      invocations: [],
      totalInputTokens: 0,
      totalOutputTokens: 0,
      totalCost: 0,
    }

    this.sessions.set(sessionId, session)
    this.invocationChains.set(sessionId, [])

    return session
  }

  /**
   * Starts a new capability invocation within a session.
   *
   * @param sessionId - Session ID
   * @param capabilityName - Name of the capability being invoked
   * @param parentInvocationId - Optional parent invocation ID (for nested calls)
   * @returns Invocation ID
   * @throws Error if session not found, recursion detected, or limits exceeded
   */
  startInvocation(sessionId: string, capabilityName: string, parentInvocationId?: string): string {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    // Check session state
    if (session.state !== 'active') {
      throw new Error(`Session ${sessionId} is not active`)
    }

    // Check invocation count limit
    if (session.invocations.length >= MAX_INVOCATIONS_PER_SESSION) {
      throw new Error(`Maximum invocations per session (${MAX_INVOCATIONS_PER_SESSION}) exceeded`)
    }

    // Check budget limit (prevent starting new invocation if it would likely exceed)
    if (session.totalCost >= MAX_SESSION_BUDGET_USD * 0.999) {
      throw new Error(
        `Session budget limit (${MAX_SESSION_BUDGET_USD} USD) exceeded (current: ${session.totalCost.toFixed(2)})`,
      )
    }

    // Check timeout
    const sessionStartTime = new Date(session.startedAt).getTime()
    const elapsed = Date.now() - sessionStartTime
    if (elapsed > MAX_SESSION_DURATION_MS) {
      throw new Error(`Session timeout (${MAX_SESSION_DURATION_MS / 60000} minutes) exceeded`)
    }

    // Get or initialize invocation chain
    const chain = this.invocationChains.get(sessionId) || []

    // Check recursion (capability already in chain)
    const capabilityChain = chain.map((inv) => inv.capability)
    if (capabilityChain.includes(capabilityName)) {
      throw new Error(`Recursion detected: ${capabilityName} is already in the invocation chain`)
    }

    // Check depth limit
    if (chain.length >= this.maxDepth) {
      throw new Error(`Maximum invocation depth (${this.maxDepth}) exceeded`)
    }

    // Create invocation
    const invocationId = crypto.randomBytes(16).toString('hex')
    const invocationState: InvocationState = {
      id: invocationId,
      capability: capabilityName,
      parentId: parentInvocationId,
      startedAt: new Date().toISOString(),
    }

    // Push to chain
    chain.push(invocationState)
    this.invocationChains.set(sessionId, chain)

    return invocationId
  }

  /**
   * Completes an invocation and pops it from the chain.
   *
   * @param sessionId - Session ID
   * @param invocationId - Invocation ID to complete
   * @param output - Result/output from the invocation
   * @param costEntry - Cost entry for this invocation
   * @throws Error if session or invocation not found
   */
  completeInvocation(
    sessionId: string,
    invocationId: string,
    output: unknown,
    costEntry: CostEntry,
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    const chain = this.invocationChains.get(sessionId)
    if (!chain) {
      throw new Error(`No invocation chain found for session ${sessionId}`)
    }

    // Find and remove invocation from chain
    const invIndex = chain.findIndex((inv) => inv.id === invocationId)
    if (invIndex === -1) {
      throw new Error(`Invocation ${invocationId} not found in active chain`)
    }

    const invState = chain[invIndex]
    if (!invState) {
      throw new Error(`Invocation ${invocationId} state is undefined`)
    }

    // Pop from chain (remove invocation)
    chain.splice(invIndex, 1)
    this.invocationChains.set(sessionId, chain)

    // Create capability invocation record
    const endTime = new Date()
    const startTime = new Date(invState.startedAt)
    const durationMs = endTime.getTime() - startTime.getTime()

    const invocationRecord: CapabilityInvocation = {
      id: invocationId,
      capability: invState.capability,
      input: {}, // Input tracking not required for Phase 3
      output,
      timestamp: invState.startedAt,
      durationMs,
    }

    // Add to session
    session.invocations.push(invocationRecord)

    // Update totals
    session.totalInputTokens += costEntry.inputTokens
    session.totalOutputTokens += costEntry.outputTokens
    session.totalCost += costEntry.costUsd

    this.sessions.set(sessionId, session)
  }

  /**
   * Closes a session, marking it as completed.
   *
   * @param sessionId - Session ID to close
   * @throws Error if session not found
   */
  closeSession(sessionId: string): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    if (session.state !== 'completed') {
      session.state = 'completed'
      session.completedAt = new Date().toISOString()
      this.sessions.set(sessionId, session)
    }

    // Clear invocation chain
    this.invocationChains.delete(sessionId)
  }

  /**
   * Closes all active sessions.
   *
   * @returns Array of closed sessions
   */
  closeAll(): Session[] {
    const activeSessions = this.getActiveSessions()

    for (const session of activeSessions) {
      this.closeSession(session.id)
    }

    return activeSessions
  }

  /**
   * Gets all active sessions.
   *
   * @returns Array of active sessions
   */
  getActiveSessions(): Session[] {
    return Array.from(this.sessions.values()).filter((s) => s.state === 'active')
  }

  /**
   * Gets all sessions regardless of state.
   * Used for shutdown cost reporting to include completed sessions.
   *
   * @returns Array of all sessions
   */
  getAllSessions(): Session[] {
    return Array.from(this.sessions.values())
  }

  /**
   * Gets a session by ID.
   *
   * @param sessionId - Session ID
   * @returns Session or undefined if not found
   */
  getSession(sessionId: string): Session | undefined {
    return this.sessions.get(sessionId)
  }

  /**
   * Propagates child session cost to parent session totals.
   * Called after child capability invocation completes.
   *
   * @param sessionId - Parent session ID
   * @param childCost - Child cost data to propagate
   * @throws Error if session not found
   */
  propagateChildCost(
    sessionId: string,
    childCost: {
      costUsd: number
      inputTokens: number
      outputTokens: number
    },
  ): void {
    const session = this.sessions.get(sessionId)
    if (!session) {
      throw new Error(`Session ${sessionId} not found`)
    }

    // Increment parent session totals
    session.totalCost += childCost.costUsd
    session.totalInputTokens += childCost.inputTokens
    session.totalOutputTokens += childCost.outputTokens

    this.sessions.set(sessionId, session)
  }
}
