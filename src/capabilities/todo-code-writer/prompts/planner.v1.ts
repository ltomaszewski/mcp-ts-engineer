/**
 * Planner session prompt version 1.
 * Reads spec file and splits work into ordered phases.
 *
 * This is the orchestrator's initial AI query (embedded in orchestrator).
 * Outputs PhasePlan JSON with sequential phases.
 */

import type { PromptVersion } from '../../../core/prompt/prompt.types.js'

/** Input shape for the planner prompt build function. */
interface PlannerPromptInput {
  specPath: string
  maxPhases: number
  cwd?: string
}

/**
 * System prompt append for planner step.
 * Ensures text output after tool use.
 */
const PLANNER_SYSTEM_PROMPT_APPEND = `After completing all tool use, provide a brief text summary of the implementation plan. Your structured output will be captured automatically via the output schema.`

const PLANNER_USER_PROMPT_TEMPLATE = (specPath: string, maxPhases: number): string => {
  return `You are a technical lead planning implementation phases for a feature spec.

<spec_path>${specPath}</spec_path>
<max_phases>${maxPhases}</max_phases>

<workflow>
1. Read the spec file at <spec_path> using the Read tool.

2. Analyze the spec's "Implementation Phases" section to understand the intended work breakdown.

3. Split the work into sequential phases (maximum <max_phases> phases):
   - Each phase should be focused on a specific aspect (e.g., schemas, core logic, tests)
   - Phases should build on each other (respect dependencies)
   - Each phase should identify files to CREATE or MODIFY
   - Keep phases digestible (5-15 files per phase maximum)

4. Output a phase plan in the following JSON format inside <phase_plan> XML tags:

<phase_plan>
{
  "phases": [
    {
      "phase_number": 1,
      "purpose": "Define data schemas and types",
      "dependencies": ["none"],
      "files": [
        {
          "path": "src/capabilities/feature/feature.schema.ts",
          "action": "CREATE",
          "purpose": "Zod schemas for input/output validation"
        }
      ]
    },
    {
      "phase_number": 2,
      "purpose": "Implement core capability logic",
      "dependencies": ["1"],
      "files": [
        {
          "path": "src/capabilities/feature/feature.capability.ts",
          "action": "CREATE",
          "purpose": "Main capability definition and orchestration"
        }
      ]
    }
  ]
}
</phase_plan>

5. Provide a brief text summary of the plan.
</workflow>

<rules>
- Keep analysis brief. Read the spec, identify phases from the Implementation Phases section, output JSON.
- The spec file contains all needed information — avoid extensive codebase research.
- Avoid calling AskUserQuestion, slash commands, or referencing .claude/commands/ files.
- If the spec has more than <max_phases> phases, consolidate related phases together.
- Each phase MUST have at least one file listed.
</rules>

<reasoning_guidance>
Apply these principles when splitting work into phases:

**Dependency chains**: If file B imports from file A, file A must be in an earlier phase.
  - Schemas/types first → implementations that consume them → tests that exercise them.
  - Shared utilities before the modules that use them.

**Testable units**: Each phase should produce code that can be tested in isolation.
  - Avoid phases where tests can only run after a later phase completes.
  - If a phase creates interfaces, include at least a stub implementation so tests can instantiate.

**Schema-first phasing**: When the spec defines Zod schemas, DTOs, or type definitions, put those in Phase 1.
  - This lets all subsequent phases import validated types.
  - Include schema tests in the same phase.

**Common mistakes to avoid**:
  - Putting all tests in a final phase — tests should accompany the code they verify.
  - Creating a phase with only type files and no runnable tests.
  - Splitting tightly coupled files (e.g., a service and its sole caller) across phases.
  - Forgetting to include barrel exports (index.ts) when downstream phases need them.
</reasoning_guidance>

<output_format>
- Wrap the JSON in <phase_plan></phase_plan> XML tags
- JSON must match the structure shown above
- phase_number starts at 1 and increments sequentially
- dependencies is an array of strings (phase numbers or "none")
- action is either "CREATE" or "MODIFY"
</output_format>`
}

/** Version 1: Planner for splitting spec into phases */
export const plannerPromptV1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-01-30',
  description:
    'Planner: reads spec, splits into sequential phases, returns PhasePlan via XML block',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { specPath, maxPhases } = input as PlannerPromptInput
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
        append: PLANNER_SYSTEM_PROMPT_APPEND,
      },
      userPrompt: PLANNER_USER_PROMPT_TEMPLATE(specPath, maxPhases),
    }
  },
}
