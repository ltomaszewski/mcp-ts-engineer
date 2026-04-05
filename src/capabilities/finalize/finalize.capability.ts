/**
 * Finalize orchestrator capability definition.
 * Main public capability that chains audit → test → codemap → commit steps.
 */

import { getProjectConfig } from '../../config/project-config.js'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import { updateSpecStatus } from '../../core/utils/index.js'
import {
  detectWorkspaces,
  FINALIZE_PLAN_FALLBACK,
  parseJsonSafe,
  parseXmlBlock,
} from './finalize.helpers.js'
import type {
  AuditResult,
  CodemapResult,
  FinalizeCommitResult,
  FinalizeInput,
  FinalizeOutput,
  FinalizePlan,
  ReadmeResult,
  TestResult,
} from './finalize.schema.js'
import { FinalizeInputSchema, FinalizePlanSchema } from './finalize.schema.js'
import { ORCHESTRATOR_CURRENT_VERSION, orchestratorPrompts } from './prompts/index.js'

// ---------------------------------------------------------------------------
// Orchestration helpers
// ---------------------------------------------------------------------------

/**
 * Parse the finalize plan from the orchestrator AI query response.
 * Uses Zod schema validation to ensure type safety.
 */
function parseFinalizePlanFromAiContent(content: string): FinalizePlan {
  const planXml = parseXmlBlock(content, 'finalize_plan')
  if (planXml) {
    return parseJsonSafe(planXml, FinalizePlanSchema, FINALIZE_PLAN_FALLBACK)
  }
  return FINALIZE_PLAN_FALLBACK
}

/**
 * Invoke the audit sub-capability.
 */
async function invokeAuditStep(
  input: FinalizeInput,
  context: CapabilityContext,
): Promise<AuditResult> {
  return (await context.invokeCapability('finalize_audit_step', {
    files_changed: input.files_changed,
    cwd: input.cwd,
  })) as AuditResult
}

/**
 * Invoke the test sub-capability.
 * Returns null if skipped.
 */
async function invokeTestStep(
  workspaces: string[],
  cwd: string | undefined,
  context: CapabilityContext,
): Promise<TestResult> {
  if (workspaces.length === 0) {
    return {
      passed: true,
      workspaces_tested: [],
      summary: 'No workspaces detected to test',
    }
  }

  return (await context.invokeCapability('finalize_test_step', {
    workspaces,
    cwd,
  })) as TestResult
}

/**
 * Invoke the codemap sub-capability.
 * Returns null if skipped.
 */
async function invokeCodemapStep(
  input: FinalizeInput,
  context: CapabilityContext,
): Promise<CodemapResult | null> {
  return (await context.invokeCapability('finalize_codemap_step', {
    files_changed: input.files_changed,
    cwd: input.cwd,
  })) as CodemapResult
}

/**
 * Invoke the readme sub-capability.
 * Returns null if skipped.
 */
async function invokeReadmeStep(
  input: FinalizeInput,
  context: CapabilityContext,
): Promise<ReadmeResult | null> {
  return (await context.invokeCapability('finalize_readme_step', {
    files_changed: input.files_changed,
    cwd: input.cwd,
  })) as ReadmeResult
}

/**
 * Invoke the commit sub-capability.
 */
async function invokeCommitStep(
  auditSummary: string,
  codemapSummary: string,
  readmeSummary: string,
  filesAffected: string[],
  cwd: string | undefined,
  context: CapabilityContext,
): Promise<FinalizeCommitResult> {
  return (await context.invokeCapability('finalize_commit_step', {
    audit_summary: auditSummary,
    codemap_summary: codemapSummary,
    readme_summary: readmeSummary,
    files_affected: filesAffected,
    cwd,
  })) as FinalizeCommitResult
}

/**
 * Build the final FinalizeOutput from all accumulated results.
 */
function buildOutput(
  auditResult: AuditResult,
  testResult: TestResult,
  codemapResult: CodemapResult | null,
  readmeResult: ReadmeResult | null,
  commitResult: FinalizeCommitResult,
): FinalizeOutput {
  // Determine overall status
  const status = auditResult.tsc_passed && testResult.passed ? 'success' : 'failed'

  return {
    status,
    audit_status: auditResult.status,
    audit_fixes_applied: auditResult.fixes_applied,
    audit_summary: auditResult.summary,
    tests_passed: testResult.passed,
    tests_summary: testResult.summary,
    codemaps_updated: codemapResult?.updated ?? null,
    codemaps_summary: codemapResult?.summary ?? 'Codemaps skipped',
    readmes_updated: readmeResult?.updated ?? null,
    readmes_summary: readmeResult?.summary ?? 'READMEs skipped',
    commit_sha: commitResult.commit_sha,
    commit_message: commitResult.commit_message,
  }
}

// ---------------------------------------------------------------------------
// Capability Definition
// ---------------------------------------------------------------------------

/**
 * Finalize orchestrator capability.
 * Public MCP tool for post-implementation cleanup.
 *
 * Chains 4 sub-capabilities in sequence:
 * 1. Audit step: code quality scan and auto-fix
 * 2. Test step: run tests in affected workspaces (optional)
 * 3. Codemap step: update architecture documentation (optional)
 * 4. Commit step: commit all cleanup changes
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous orchestration. The orchestrator requires unrestricted capability access
 * to chain internal sub-capabilities. Input is validated via Zod schema and all
 * sub-capabilities use their own input validation.
 */
export const finalizeCapability: CapabilityDefinition<FinalizeInput, FinalizeOutput> = {
  id: 'finalize',
  type: 'tool',
  visibility: 'public',
  name: 'Finalize',
  description:
    'Post-implementation cleanup: runs code audit with auto-fix on modified files, executes tests on affected workspaces, updates codemaps if files changed significantly, and commits all cleanup changes. Use this after any code changes to ensure quality and documentation are up to date.',
  inputSchema: FinalizeInputSchema,
  promptRegistry: orchestratorPrompts,
  currentPromptVersion: ORCHESTRATOR_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 50,
    maxBudgetUsd: 3.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
  },

  preparePromptInput: (input: FinalizeInput, _context) => ({
    filesChanged: input.files_changed,
    monorepoRoot: getProjectConfig().monorepoRoot,
    cwd: input.cwd,
  }),

  processResult: async (
    input: FinalizeInput,
    aiResult: AIQueryResult,
    context: CapabilityContext,
    // biome-ignore lint/complexity/noExcessiveCognitiveComplexity: orchestration pipeline with conditional steps
  ): Promise<FinalizeOutput> => {
    // Parse finalize plan from orchestrator AI response
    const finalizePlan = parseFinalizePlanFromAiContent(aiResult.content)

    // If no workspaces detected from plan, fall back to detectWorkspaces helper
    const workspaces =
      finalizePlan.workspaces.length > 0
        ? finalizePlan.workspaces
        : detectWorkspaces(input.files_changed)

    // Phase 1: Audit + Test in parallel (independent)
    const [auditSettled, testSettled] = await Promise.allSettled([
      invokeAuditStep(input, context),
      invokeTestStep(workspaces, input.cwd, context),
    ])
    const auditResult = auditSettled.status === 'fulfilled'
      ? auditSettled.value
      : (() => { context.logger.warn('Audit step failed', { error: auditSettled.reason }); return { status: 'fail' as const, fixes_applied: 0, issues_remaining: 0, tsc_passed: false, summary: 'Audit step failed' } })()
    const testResult = testSettled.status === 'fulfilled'
      ? testSettled.value
      : (() => { context.logger.warn('Test step failed', { error: testSettled.reason }); return { passed: false, workspaces_tested: [] as string[], summary: 'Test step failed' } })()

    // Phase 2: Codemap + README in parallel (independent, conditional)
    const codemapPromise = !input.skip_codemaps ? invokeCodemapStep(input, context) : Promise.resolve(null)
    const readmePromise = !input.skip_readmes ? invokeReadmeStep(input, context).catch((error) => { context.logger.warn('README step failed, continuing', { error }); return null }) : Promise.resolve(null)
    const [codemapResult, readmeResult] = await Promise.all([codemapPromise, readmePromise])

    // Step 3.6: Mark spec as IMPLEMENTED (finalization complete)
    const filesAffected = [
      ...input.files_changed,
      ...(codemapResult?.codemaps_changed ?? []),
      ...(readmeResult?.readmes_changed ?? []),
    ]
    if (input.spec_path && auditResult.tsc_passed && testResult.passed) {
      try {
        const specUpdated = await updateSpecStatus(
          input.spec_path,
          'READY',
          'IMPLEMENTED',
          input.cwd,
        )
        if (specUpdated) {
          filesAffected.push(input.spec_path)
        }
      } catch (error) {
        // Non-fatal: log warning, continue with commit
        context.logger.warn(`Failed to update spec status: ${error}`)
      }
    }

    // Step 4: Commit
    const commitResult = await invokeCommitStep(
      auditResult.summary,
      codemapResult?.summary ?? 'No codemap changes',
      readmeResult?.summary ?? 'No README changes',
      filesAffected,
      input.cwd,
      context,
    )

    // Build and return final output
    return buildOutput(auditResult, testResult, codemapResult, readmeResult, commitResult)
  },
}
