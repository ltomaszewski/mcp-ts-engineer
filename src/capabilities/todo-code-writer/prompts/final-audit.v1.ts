/**
 * Final audit step prompt version 1.
 * Repository-wide audit on all modified files across all phases.
 *
 * Verifies cross-file consistency and integration.
 */

import type { PromptVersion } from "../../../core/prompt/prompt.types.js";

/** Input shape for the final audit prompt build function. */
interface FinalAuditPromptInput {
  specPath: string;
  allModifiedFiles: string[];
  cwd?: string;
}

/**
 * System prompt append for final audit step.
 * Ensures text output after tool use.
 */
const FINAL_AUDIT_SYSTEM_PROMPT_APPEND = `After completing all tool use, provide a brief text summary of the final audit findings. Your structured output will be captured automatically via the output schema.`;

const FINAL_AUDIT_USER_PROMPT_TEMPLATE = (
  specPath: string,
  allModifiedFiles: string[],
): string => {
  const fileList = allModifiedFiles.map((f) => `- ${f}`).join("\n");

  return `You are a code auditor performing a final repository-wide audit.

<spec_path>${specPath}</spec_path>

<all_modified_files>
${fileList}
</all_modified_files>

<workflow>
1. Read the spec file at <spec_path> using the Read tool to understand the overall feature requirements.

2. Read a sample of the modified files (focus on key integration points):
   - Schema files (for type consistency)
   - Main capability files (for orchestration correctness)
   - Test files (for coverage adequacy)

3. Verify cross-file integration:
   - Types are consistent across files
   - Imports/exports are correct
   - Files work together as a cohesive feature
   - No obvious integration issues

4. Count issues found (type mismatches, missing imports, integration gaps).

5. Output final audit result in the following JSON format inside <final_audit_result> XML tags:

<final_audit_result>
{
  "status": "pass",
  "issues_found": 0,
  "summary": "All files integrate correctly. Types consistent, imports valid, feature cohesive."
}
</final_audit_result>

6. Provide a brief text summary of the final audit.
</workflow>

<rules>
- Focus on integration, not re-auditing individual files (that was done in phase audits).
- Sample key files rather than reading every file (too many files to read exhaustively).
- The spec and modified files contain all needed information — avoid extensive codebase research beyond the modified files.
- Avoid calling AskUserQuestion, slash commands, or referencing .claude/commands/ files.
</rules>

<decision_criteria>
- "pass": All files integrate correctly, no cross-file issues (issues_found = 0)
- "warn": Minor integration issues like missing JSDoc or minor type inconsistencies (issues_found = 1-2)
- "fail": Type mismatches, missing imports, broken integration (issues_found >= 3)
</decision_criteria>

<output_format>
- Wrap the JSON in <final_audit_result></final_audit_result> XML tags
- JSON must have: status ("pass", "warn", or "fail"), issues_found (integer), summary (string)
- summary should be 1-3 sentences describing final audit findings
</output_format>`;
};

/** Version 1: Final audit with cross-file verification */
export const finalAuditPromptV1: PromptVersion = {
  version: "v1",
  createdAt: "2026-01-30",
  description:
    "Final audit: reads spec, verifies cross-file integration, returns FinalAuditResult via XML block",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { specPath, allModifiedFiles } = input as FinalAuditPromptInput;
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
        append: FINAL_AUDIT_SYSTEM_PROMPT_APPEND,
      },
      userPrompt: FINAL_AUDIT_USER_PROMPT_TEMPLATE(specPath, allModifiedFiles),
    };
  },
};
