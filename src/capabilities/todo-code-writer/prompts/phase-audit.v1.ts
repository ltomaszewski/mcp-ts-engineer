/**
 * Phase audit step prompt version 1.
 * Audits code from a single phase against spec requirements.
 *
 * Receives files modified and engineering summary from phase eng step.
 */

import type { PromptVersion } from "../../../core/prompt/prompt.types.js";
import { buildReviewContext } from "./review-context.js";

/** Input shape for the phase audit prompt build function. */
interface PhaseAuditPromptInput {
  specPath: string;
  phaseNumber: number;
  filesModified: string[];
  engSummary: string;
  cwd?: string;
}

/**
 * System prompt append for phase audit step.
 * Combines execution guidance with review context.
 * Called at invocation time so the builder can read dynamic config.
 */
const buildPhaseAuditSystemPromptAppend = (): string =>
  `After completing all tool use, provide a brief text summary of the audit findings. Your structured output will be captured automatically via the output schema.

${buildReviewContext()}`;

const PHASE_AUDIT_USER_PROMPT_TEMPLATE = (
  specPath: string,
  phaseNumber: number,
  filesModified: string[],
  engSummary: string,
): string => {
  const fileList = filesModified.map((f) => `- ${f}`).join("\n");

  return `You are a code auditor. Verify that Phase ${phaseNumber} implementation matches the spec requirements.

<spec_path>${specPath}</spec_path>
<phase_number>${phaseNumber}</phase_number>

<files_modified>
${fileList}
</files_modified>

<engineering_summary>
${engSummary}
</engineering_summary>

<workflow>
1. Read the spec file at <spec_path> using the Read tool.

2. Locate Phase ${phaseNumber} in the "Implementation Phases" section.

3. Read each file in <files_modified> to verify:
   - Files match the phase's intended purpose
   - Code follows spec's implementation steps
   - Tests exist and cover the implemented code
   - No obvious bugs or issues

4. Count issues found (missing tests, incorrect implementation, bugs).

5. Output audit result in the following JSON format inside <phase_audit_result> XML tags:

<phase_audit_result>
{
  "status": "pass",
  "issues_found": 0,
  "summary": "Phase ${phaseNumber} implementation correct. All files match spec requirements, tests present."
}
</phase_audit_result>

6. Provide a brief text summary of the audit.
</workflow>

<rules>
- Keep analysis focused. Read spec phase ${phaseNumber}, read modified files, verify correctness.
- The spec and modified files contain all needed information — avoid extensive codebase research.
- Avoid calling AskUserQuestion, slash commands, or referencing .claude/commands/ files.
</rules>

<decision_criteria>
- "pass": All files correct, tests present, no issues (issues_found = 0)
- "warn": Minor issues like missing edge case tests, minor style issues (issues_found = 1-2)
- "fail": Missing tests, incorrect implementation, bugs (issues_found >= 3)
</decision_criteria>

<output_format>
- Wrap the JSON in <phase_audit_result></phase_audit_result> XML tags
- JSON must have: status ("pass", "warn", or "fail"), issues_found (integer), summary (string)
- summary should be 1-3 sentences describing audit findings
</output_format>`;
};

/** Version 1: Phase audit with spec verification */
export const phaseAuditPromptV1: PromptVersion = {
  version: "v1",
  createdAt: "2026-01-30",
  description:
    "Phase audit: reads spec, verifies phase N implementation, returns PhaseAuditResult via XML block",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { specPath, phaseNumber, filesModified, engSummary } =
      input as PhaseAuditPromptInput;
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
        append: buildPhaseAuditSystemPromptAppend(),
      },
      userPrompt: PHASE_AUDIT_USER_PROMPT_TEMPLATE(
        specPath,
        phaseNumber,
        filesModified,
        engSummary,
      ),
    };
  },
};
