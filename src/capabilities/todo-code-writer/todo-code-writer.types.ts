/**
 * Internal types for todo-code-writer orchestration.
 * @internal Module-level types, not exported publicly
 */

import type { PhaseEngResult, PhaseAuditResult, PhaseStatus } from "./todo-code-writer.schema.js";

/**
 * Result from phase execution loop including halt information.
 */
export interface PhaseLoopResult {
  phaseResults: Array<{ eng: PhaseEngResult; audit: PhaseAuditResult }>;
  phaseStatuses: PhaseStatus[];
  allModifiedFiles: string[];
  phaseSummaries: string[];
  halted: boolean;
  failedPhase: number | null;
  failureReason: string | null;
}

/**
 * Result interface for engineering step retry logic.
 */
export interface EngStepResult {
  engResult: PhaseEngResult | null;
  halted: boolean;
  failedPhase: number | null;
  failureReason: string | null;
  retryAttempts: number;
  pendingFiles: string[];
  phaseSummary: string | null;
}

/**
 * Result interface for audit step retry logic.
 */
export interface AuditStepResult {
  auditResult: PhaseAuditResult | null;
  halted: boolean;
  failedPhase: number | null;
  failureReason: string | null;
  retryAttempts: number;
}
