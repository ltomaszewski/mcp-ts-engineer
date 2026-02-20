/**
 * Phase engineering step prompt version 1.
 * Implements a single phase according to spec instructions.
 *
 * Receives full phase plan and current phase number.
 * Uses embedded spec instructions for TDD implementation.
 */

import type { PromptVersion } from "../../../core/prompt/prompt.types.js";
import type { PhasePlan } from "../todo-code-writer.schema.js";
import { buildDevContext } from "./dev-context.js";

/** Input shape for the phase engineering prompt build function. */
interface PhaseEngPromptInput {
  specPath: string;
  phasePlan: PhasePlan;
  currentPhaseNumber: number;
  cwd?: string;
}

/**
 * System prompt append for phase engineering step.
 * Combines execution guidance with development context.
 * Called at invocation time so the builder can read dynamic config.
 */
const buildPhaseEngSystemPromptAppend = (): string =>
  `After completing all tool use, provide a brief text summary of the implementation work. Your structured output will be captured automatically via the output schema.

${buildDevContext()}`;

const PHASE_ENG_USER_PROMPT_TEMPLATE = (
  specPath: string,
  phasePlan: PhasePlan,
  currentPhaseNumber: number,
): string => {
  const currentPhase = phasePlan.phases.find(
    (p) => p.phase_number === currentPhaseNumber,
  );

  if (!currentPhase) {
    return `Error: Phase ${currentPhaseNumber} not found in phase plan.`;
  }

  const fileList = currentPhase.files
    .map((f) => `- ${f.action}: ${f.path} — ${f.purpose}`)
    .join("\n");

  return `You are a senior engineer implementing Phase ${currentPhaseNumber} of a feature spec.

<spec_path>${specPath}</spec_path>
<current_phase>${currentPhaseNumber}</current_phase>
<phase_purpose>${currentPhase.purpose}</phase_purpose>

<phase_files>
${fileList}
</phase_files>

<workflow>
1. Read the spec file at <spec_path> using the Read tool.

2. Locate the "Implementation Phases" section in the spec.

3. Find Phase ${currentPhaseNumber} and follow its step-by-step instructions EXACTLY.
   - The spec contains detailed implementation steps for this phase
   - Follow TDD: write tests FIRST, then implement to make tests pass
   - Use the file list above as a guide, but follow the spec's actual instructions

4. After implementation, output a summary in the following JSON format inside <phase_eng_result> XML tags:

<phase_eng_result>
{
  "status": "success",
  "files_modified": [
    "src/capabilities/feature/file1.ts",
    "src/capabilities/feature/file2.ts"
  ],
  "summary": "Implemented schemas with Zod validation. Created 3 schema files with comprehensive input/output types."
}
</phase_eng_result>

5. Provide a brief text summary of what was implemented.
</workflow>

<rules>
- FOLLOW THE SPEC'S PHASE ${currentPhaseNumber} INSTRUCTIONS EXACTLY
- TDD: Write tests FIRST, then implement code to make tests pass
- Verify tests fail initially (red phase), then pass after implementation (green phase)
- The spec contains all implementation details — avoid extensive codebase research
- Avoid calling AskUserQuestion, slash commands, or referencing .claude/commands/ files
- If tests fail to pass, set status to "failed" and explain in summary
</rules>

<output_format>
- Wrap the JSON in <phase_eng_result></phase_eng_result> XML tags
- JSON must have: status ("success" or "failed"), files_modified (array of strings), summary (string)
- files_modified should list ACTUAL files you created or modified during implementation
- summary should be 1-3 sentences describing what was implemented
</output_format>`;
};

/** Version 1: Phase engineering with embedded spec instructions */
export const phaseEngPromptV1: PromptVersion = {
  version: "v1",
  createdAt: "2026-01-30",
  description:
    "Phase engineering: reads spec, implements phase N with TDD, returns PhaseEngResult via XML block",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { specPath, phasePlan, currentPhaseNumber } =
      input as PhaseEngPromptInput;
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
        append: buildPhaseEngSystemPromptAppend(),
      },
      userPrompt: PHASE_ENG_USER_PROMPT_TEMPLATE(
        specPath,
        phasePlan,
        currentPhaseNumber,
      ),
    };
  },
};
