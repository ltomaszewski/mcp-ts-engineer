/**
 * Capability registration - register all capabilities with the registry.
 */

import type { CapabilityDefinition } from '../core/capability-registry/capability-registry.types.js'
import type { CapabilityRegistry } from '../core/capability-registry/index.js'
import { pathFixStepCapability } from '../core/utils/spec-path-utils/path-fix-step.capability.js'
import { auditFixCapability } from './audit-fix/audit-fix.capability.js'
import { auditFixAuditStepCapability } from './audit-fix/audit-step.capability.js'
import { auditFixCommitStepCapability } from './audit-fix/commit-step.capability.js'
import { auditFixDepsFixStepCapability } from './audit-fix/deps-fix-step.capability.js'
import { auditFixDepsScanStepCapability } from './audit-fix/deps-scan-step.capability.js'
import { auditFixEngStepCapability } from './audit-fix/eng-step.capability.js'
import { auditFixLintFixStepCapability } from './audit-fix/lint-fix-step.capability.js'
import { auditFixLintScanStepCapability } from './audit-fix/lint-scan-step.capability.js'
import { auditFixTestStepCapability } from './audit-fix/test-step.capability.js'
import { echoAgentCapability } from './echo-agent/echo-agent.capability.js'
import { finalizeAuditStepCapability } from './finalize/audit-step.capability.js'
import { finalizeCodemapStepCapability } from './finalize/codemap-step.capability.js'
import { finalizeCommitStepCapability } from './finalize/commit-step.capability.js'
import { finalizeCapability } from './finalize/finalize.capability.js'
import { finalizeReadmeStepCapability } from './finalize/readme-step.capability.js'
import { finalizeTestStepCapability } from './finalize/test-step.capability.js'
import { prFixerCapability } from './pr-fixer/pr-fixer.capability.js'
import { prFixerClassifyStepCapability } from './pr-fixer/pr-fixer-classify-step.capability.js'
import { prFixerCommentStepCapability } from './pr-fixer/pr-fixer-comment-step.capability.js'
import { prFixerCommitStepCapability } from './pr-fixer/pr-fixer-commit-step.capability.js'
import { prFixerDirectFixStepCapability } from './pr-fixer/pr-fixer-direct-fix-step.capability.js'
import { prFixerFetchCommentStepCapability } from './pr-fixer/pr-fixer-fetch-comment-step.capability.js'
import { prFixerValidateStepCapability } from './pr-fixer/pr-fixer-validate-step.capability.js'
import { prAggregateStepCapability } from './pr-reviewer/pr-aggregate-step.capability.js'
import { prCleanupStepCapability } from './pr-reviewer/pr-cleanup-step.capability.js'
import { prCommentStepCapability } from './pr-reviewer/pr-comment-step.capability.js'
import { prCommitStepCapability } from './pr-reviewer/pr-commit-step.capability.js'
import { prContextStepCapability } from './pr-reviewer/pr-context-step.capability.js'
import { prFixStepCapability } from './pr-reviewer/pr-fix-step.capability.js'
import { prPreflightStepCapability } from './pr-reviewer/pr-preflight-step.capability.js'
import { prRevertStepCapability } from './pr-reviewer/pr-revert-step.capability.js'
import { prReviewStepCapability } from './pr-reviewer/pr-review-step.capability.js'
import { prReviewerCapability } from './pr-reviewer/pr-reviewer.capability.js'
import { prTestStepCapability } from './pr-reviewer/pr-test-step.capability.js'
import { prValidateStepCapability } from './pr-reviewer/pr-validate-step.capability.js'
import { commitStepCapability as todoCodeWriterCommitStepCapability } from './todo-code-writer/commit-step.capability.js'
import { finalAuditStepCapability } from './todo-code-writer/final-audit-step.capability.js'
import { phaseAuditStepCapability } from './todo-code-writer/phase-audit-step.capability.js'
import { phaseEngStepCapability } from './todo-code-writer/phase-eng-step.capability.js'
import { todoCodeWriterCapability } from './todo-code-writer/todo-code-writer.capability.js'
import { commitStepCapability } from './todo-reviewer/commit-step.capability.js'
import { tddFixStepCapability } from './todo-reviewer/tdd-fix-step.capability.js'
import { tddScanStepCapability } from './todo-reviewer/tdd-scan-step.capability.js'
import { tddValidateStepCapability } from './todo-reviewer/tdd-validate-step.capability.js'
import { todoReviewerCapability } from './todo-reviewer/todo-reviewer.capability.js'

/**
 * Register all capabilities with the capability registry.
 * This function should be called during server initialization.
 *
 * @param registry - The capability registry instance
 */
export function registerAllCapabilities(registry: CapabilityRegistry): void {
  // Cast to base type since registerCapability accepts CapabilityDefinition (not generic)
  registry.registerCapability(echoAgentCapability as CapabilityDefinition)

  // Todo reviewer orchestrator + internal sub-capabilities
  // (sub-capabilities required for invokeCapability, not exposed as separate MCP tools)
  registry.registerCapability(todoReviewerCapability as CapabilityDefinition)
  registry.registerCapability(tddValidateStepCapability as CapabilityDefinition) // Deprecated — use scan+fix
  registry.registerCapability(tddScanStepCapability as CapabilityDefinition) // NEW — comprehensive validation
  registry.registerCapability(tddFixStepCapability as CapabilityDefinition) // NEW — remediation application
  registry.registerCapability(commitStepCapability as CapabilityDefinition)

  // Todo code writer orchestrator + internal sub-capabilities
  // (sub-capabilities required for invokeCapability, not exposed as separate MCP tools)
  registry.registerCapability(todoCodeWriterCapability as CapabilityDefinition)
  registry.registerCapability(phaseEngStepCapability as CapabilityDefinition)
  registry.registerCapability(phaseAuditStepCapability as CapabilityDefinition)
  registry.registerCapability(finalAuditStepCapability as CapabilityDefinition)
  registry.registerCapability(todoCodeWriterCommitStepCapability as CapabilityDefinition)

  // Finalize orchestrator + internal sub-capabilities
  registry.registerCapability(finalizeCapability as CapabilityDefinition)
  registry.registerCapability(finalizeAuditStepCapability as CapabilityDefinition)
  registry.registerCapability(finalizeTestStepCapability as CapabilityDefinition)
  registry.registerCapability(finalizeCodemapStepCapability as CapabilityDefinition)
  registry.registerCapability(finalizeReadmeStepCapability as CapabilityDefinition)
  registry.registerCapability(finalizeCommitStepCapability as CapabilityDefinition)

  // Audit-fix orchestrator + internal sub-capabilities
  registry.registerCapability(auditFixCapability as CapabilityDefinition)
  registry.registerCapability(auditFixAuditStepCapability as CapabilityDefinition)
  registry.registerCapability(auditFixEngStepCapability as CapabilityDefinition)
  registry.registerCapability(auditFixCommitStepCapability as CapabilityDefinition)
  registry.registerCapability(auditFixTestStepCapability as CapabilityDefinition)
  // Audit-fix lint steps (internal)
  registry.registerCapability(auditFixLintScanStepCapability as CapabilityDefinition)
  registry.registerCapability(auditFixLintFixStepCapability as CapabilityDefinition)
  // Audit-fix deps steps (internal)
  registry.registerCapability(auditFixDepsScanStepCapability as CapabilityDefinition)
  registry.registerCapability(auditFixDepsFixStepCapability as CapabilityDefinition)

  // Path fix step (internal utility capability)
  registry.registerCapability(pathFixStepCapability as CapabilityDefinition)

  // PR reviewer orchestrator (public MCP tool) + internal sub-capabilities
  registry.registerCapability(prReviewerCapability as CapabilityDefinition)
  registry.registerCapability(prPreflightStepCapability as CapabilityDefinition)
  registry.registerCapability(prContextStepCapability as CapabilityDefinition)
  registry.registerCapability(prReviewStepCapability as CapabilityDefinition)
  registry.registerCapability(prAggregateStepCapability as CapabilityDefinition)
  registry.registerCapability(prValidateStepCapability as CapabilityDefinition)
  registry.registerCapability(prFixStepCapability as CapabilityDefinition)
  registry.registerCapability(prCleanupStepCapability as CapabilityDefinition)
  registry.registerCapability(prTestStepCapability as CapabilityDefinition)
  registry.registerCapability(prCommitStepCapability as CapabilityDefinition)
  registry.registerCapability(prRevertStepCapability as CapabilityDefinition)
  registry.registerCapability(prCommentStepCapability as CapabilityDefinition)

  // PR fixer orchestrator (public MCP tool) + internal sub-capabilities
  registry.registerCapability(prFixerCapability as CapabilityDefinition)
  registry.registerCapability(prFixerClassifyStepCapability as CapabilityDefinition)
  registry.registerCapability(prFixerDirectFixStepCapability as CapabilityDefinition)
  registry.registerCapability(prFixerValidateStepCapability as CapabilityDefinition)
  registry.registerCapability(prFixerCommitStepCapability as CapabilityDefinition)
  registry.registerCapability(prFixerCommentStepCapability as CapabilityDefinition)
  registry.registerCapability(prFixerFetchCommentStepCapability as CapabilityDefinition)
}
