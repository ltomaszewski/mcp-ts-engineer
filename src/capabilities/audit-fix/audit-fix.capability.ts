/**
 * Audit-fix orchestrator capability definition.
 * Main public capability that chains audit -> eng fix -> commit per project.
 *
 * State machine:
 * 1. Planner AI determines projects (or fallback to discoverProjects)
 * 2. For each project: audit -> fix loop with early exit
 * 3. Commit per project if files were modified
 * 4. Build aggregate output
 */

import type { CapabilityDefinition } from "../../core/capability-registry/capability-registry.types.js";
import type { CapabilityContext } from "../../core/capability-registry/capability-registry.types.js";
import type { AIQueryResult } from "../../core/ai-provider/ai-provider.types.js";
import { AuditFixInputSchema } from "./audit-fix.schema.js";
import type {
  AuditFixInput,
  AuditFixOutput,
  ProjectResult,
} from "./audit-fix.schema.js";
import {
  plannerPrompts,
  PLANNER_CURRENT_VERSION,
} from "./prompts/index.js";
import {
  parseAuditPlan,
  discoverProjects,
  determineOverallStatus,
  buildSummary,
} from "./audit-fix.helpers.js";
import { processProject } from "./audit-fix-process-project.js";

// ---------------------------------------------------------------------------
// Capability Definition
// ---------------------------------------------------------------------------

/**
 * Audit-fix orchestrator capability.
 * Public MCP tool for multi-project code quality audit with auto-fix.
 *
 * Workflow per project:
 * 1. Audit step: project-scoped code quality scan
 * 2. Eng fix step: apply fixes based on audit findings
 * 3. Repeat audit->fix until clean or limits reached
 * 4. Commit step: commit changes for this project
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous orchestration. The orchestrator requires unrestricted capability access
 * to chain internal sub-capabilities. Input is validated via Zod schema and all
 * sub-capabilities use their own input validation.
 */
export const auditFixCapability: CapabilityDefinition<
  AuditFixInput,
  AuditFixOutput
> = {
  id: "audit_fix",
  type: "tool",
  visibility: "public",
  name: "Audit Fix",
  description:
    "Multi-project code quality audit with auto-fix. Discovers projects in the monorepo, runs code quality audit per project, applies fixes iteratively, and commits changes. Supports single-project mode or full monorepo scan.",
  inputSchema: AuditFixInputSchema,
  promptRegistry: plannerPrompts,
  currentPromptVersion: PLANNER_CURRENT_VERSION,
  defaultRequestOptions: {
    model: "sonnet",
    maxTurns: 10,
    maxBudgetUsd: 1.0,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
  },

  preparePromptInput: (input: AuditFixInput, _context) => ({
    targetProject: input.project,
    cwd: input.cwd,
  }),

  processResult: async (
    input: AuditFixInput,
    aiResult: AIQueryResult,
    context: CapabilityContext,
  ): Promise<AuditFixOutput> => {
    // Step 1: Parse plan from planner AI result
    let plan = parseAuditPlan(aiResult.content);

    // Step 2: Fallback to discoverProjects if plan is empty
    if (plan.projects.length === 0) {
      plan = { projects: discoverProjects(input.cwd) };
    }

    // Step 3: Single-project override
    if (input.project) {
      plan = {
        projects: [
          { path: input.project, reason: "user-specified", priority: 1 },
        ],
      };
    }

    // Sort by priority
    const sortedProjects = [...plan.projects].sort(
      (a, b) => a.priority - b.priority,
    );

    // Step 4: Process each project
    let totalIterations = 0;
    const projectResults: ProjectResult[] = [];

    for (const project of sortedProjects) {
      const remainingCap = input.max_total_cap - totalIterations;
      if (remainingCap <= 0) {
        break;
      }

      const { result, iterationsUsed } = await processProject(
        project.path,
        input.max_iteration_per_project,
        remainingCap,
        input.cwd,
        context,
        input.skip_tests ?? false,
        input.spec_path,
      );

      projectResults.push(result);
      totalIterations += iterationsUsed;
    }

    // Step 5: Build aggregate output
    const status = determineOverallStatus(projectResults);
    const summary = buildSummary(projectResults, totalIterations);

    return {
      status,
      projects_audited: projectResults.length,
      total_iterations: totalIterations,
      project_results: projectResults,
      summary,
    };
  },
};
