/**
 * Planner prompt for audit-fix capability.
 * Determines which projects in the monorepo need auditing.
 * Supports single-project mode (targetProject set) or full scan mode.
 */

import type { PromptVersion } from '../../../core/prompt/prompt.types.js'

interface PlannerPromptInput {
  targetProject?: string
  cwd?: string
}

const buildPlannerUserPrompt = (targetProject?: string, cwd?: string): string => {
  const cwdContext = cwd ? `Working directory: ${cwd}\n\n` : ''

  if (targetProject) {
    return `${cwdContext}You are the Audit Planner. A specific project has been requested for auditing.

Output the following plan directly — no filesystem scanning needed:

<audit_plan>
{
  "projects": [
    {
      "path": "${targetProject}",
      "reason": "User-specified project",
      "priority": 1
    }
  ]
}
</audit_plan>`
  }

  return `${cwdContext}You are the Audit Planner for a TypeScript monorepo. Your role is to discover which projects need auditing.

Your tasks:
1. List directories in \`apps/\` and \`packages/\` that contain a \`package.json\`
2. For each project, check if it has TypeScript files (tsconfig.json or .ts files)
3. Prioritize apps over packages (apps get priority 1, packages get priority 2)
4. Output the plan

Use the following commands to discover projects:
- ls apps/ to list app directories
- ls packages/ to list package directories
- Check for package.json in each directory

Output your analysis in this format:

<audit_plan>
{
  "projects": [
    {
      "path": "apps/project-name",
      "reason": "TypeScript project with package.json",
      "priority": 1
    }
  ]
}
</audit_plan>

Only include projects that have a package.json file. Skip node_modules, dist, build directories.`
}

export const plannerPromptV1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-01',
  description: 'Planner: discovers monorepo projects for audit-fix workflow',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { targetProject, cwd } = input as PlannerPromptInput
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: buildPlannerUserPrompt(targetProject, cwd),
    }
  },
}
