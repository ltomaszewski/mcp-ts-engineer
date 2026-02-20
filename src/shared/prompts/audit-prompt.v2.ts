/**
 * Shared audit prompt builder with mode discriminator.
 * Supports "spec" mode (phase audit) and "scan" mode (project-wide audit).
 *
 * Originally from: src/capabilities/todo-code-writer/prompts/phase-audit.v2.ts
 */

import { buildReviewContext } from "./review-context.js";
import {
  SKILL_LOADING_RULES,
  resolveSkillsFromTechnologies,
} from "./eng-rules/index.js";

/** Built prompt result. */
export interface BuiltPrompt {
  systemPrompt: {
    type: "preset";
    preset: "claude_code";
    append?: string;
  };
  userPrompt: string;
}

/** Spec mode: auditing a specific phase implementation */
interface SpecModeInput {
  mode: "spec";
  specPath: string;
  phaseNumber: number;
  filesModified: string[];
  engSummary: string;
  detectedTechnologies?: string[];
  detectedDependencies?: string[];
  cwd?: string;
  // Scan-mode fields ignored in spec mode
  projectPath?: string;
}

/** Scan mode: project-wide audit without spec */
interface ScanModeInput {
  mode: "scan";
  projectPath: string;
  detectedTechnologies?: string[];
  detectedDependencies?: string[];
  cwd?: string;
  // Spec-mode fields ignored in scan mode
  specPath?: string;
  phaseNumber?: number;
  filesModified?: string[];
  engSummary?: string;
}

/** Union type for audit prompt input */
export type AuditPromptInput = SpecModeInput | ScanModeInput;

/**
 * System prompt append for audit step.
 * Combines execution guidance with review context.
 * Called at invocation time so the builder can read dynamic config.
 */
const buildPhaseAuditV2SystemPromptAppend = (): string =>
  `After completing all tool use, provide a brief text summary of the audit findings. Your structured output will be captured automatically via the output schema.

${buildReviewContext()}`;

/**
 * Builds the skill loading section with the resolved list of skills to invoke.
 */
const buildSkillLoadingSection = (
  detectedTechnologies: string[],
  detectedDependencies?: string[],
): string => {
  const skills = resolveSkillsFromTechnologies(
    detectedTechnologies,
    detectedDependencies,
  );

  if (skills.length === 0) {
    return "";
  }

  const skillList = skills.map((s) => `  - ${s}`).join("\n");

  return `<skill_loading>
${SKILL_LOADING_RULES}

### Skills to Load
Invoke each of these skills using the Skill tool BEFORE reviewing code:
${skillList}
</skill_loading>`;
};

/**
 * Builds spec mode user prompt.
 */
const buildSpecModeUserPrompt = (input: SpecModeInput): string => {
  const {
    specPath,
    phaseNumber,
    filesModified,
    engSummary,
    detectedTechnologies,
    detectedDependencies,
  } = input;

  const fileList = filesModified.map((f) => `- ${f}`).join("\n");
  const technologies = detectedTechnologies || [];

  // Build skill loading section
  const skillLoadingSection = buildSkillLoadingSection(
    technologies,
    detectedDependencies,
  );

  return `You are a code auditor. Verify that Phase ${phaseNumber} implementation matches the spec requirements.

<spec_path>${specPath}</spec_path>
<phase_number>${phaseNumber}</phase_number>

<files_modified>
${fileList}
</files_modified>

<engineering_summary>
${engSummary}
</engineering_summary>

${skillLoadingSection}

<workflow>
1. Load all skills listed in <skill_loading> using the Skill tool. This is MANDATORY before reviewing code.

2. Read the spec file at <spec_path> using the Read tool.

3. Locate Phase ${phaseNumber} in the "Implementation Phases" section.

4. Read each file in <files_modified> to verify:
   - Files match the phase's intended purpose
   - Code follows spec's implementation steps
   - Tests exist and cover the implemented code
   - No obvious bugs or issues

5. Count issues found (missing tests, incorrect implementation, bugs).

6. Output audit result in the following JSON format inside <phase_audit_result> XML tags:

<phase_audit_result>
{
  "status": "pass",
  "issues_found": 0,
  "summary": "Phase ${phaseNumber} implementation correct. All files match spec requirements, tests present."
}
</phase_audit_result>

7. Provide a brief text summary of the audit.
</workflow>

<rules>
- LOAD SKILLS FIRST: Invoke all skills from <skill_loading> before reviewing code
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

/**
 * Builds scan mode user prompt.
 */
const buildScanModeUserPrompt = (input: ScanModeInput): string => {
  const {
    projectPath,
    detectedTechnologies,
    detectedDependencies,
  } = input;

  const technologies = detectedTechnologies || [];

  const skillLoadingSection = buildSkillLoadingSection(
    technologies,
    detectedDependencies,
  );

  return `You are a code auditor conducting a project-wide quality scan.

<project_path>${projectPath}</project_path>

${skillLoadingSection}

<workflow>
1. Load all skills listed in <skill_loading> using the Skill tool.

2. Scan all TypeScript files in the project for:
   - Code quality issues (functions > 50 lines, files > 300 lines)
   - Security issues (hardcoded secrets, missing validation)
   - Race conditions (useEffect without cleanup, unprotected handlers)
   - Testing gaps (missing tests for business logic)

3. Count total issues found by category.

4. Output scan result:

<scan_result>
{
  "status": "pass",
  "issues_found": 0,
  "summary": "Project scan complete. No major issues found."
}
</scan_result>
</workflow>

<rules>
- LOAD SKILLS FIRST before scanning
- Focus on critical issues: security, race conditions, missing tests
- Avoid calling AskUserQuestion or slash commands
- Report file paths with line numbers for all issues
</rules>

<decision_criteria>
- "pass": No critical issues (issues_found = 0)
- "warn": Minor issues present (issues_found = 1-5)
- "fail": Critical issues found (issues_found > 5)
</decision_criteria>

<output_format>
- Wrap JSON in <scan_result></scan_result> XML tags
- JSON must have: status ("pass", "warn", or "fail"), issues_found (integer), summary (string)
</output_format>`;
};

/**
 * Builds audit prompt with mode discriminator.
 *
 * @param input - Spec mode or scan mode input
 * @returns Built prompt with system and user prompts
 */
export function buildAuditPromptV2(input: AuditPromptInput): BuiltPrompt {
  const userPrompt =
    input.mode === "spec"
      ? buildSpecModeUserPrompt(input)
      : buildScanModeUserPrompt(input);

  return {
    systemPrompt: {
      type: "preset",
      preset: "claude_code",
      append: buildPhaseAuditV2SystemPromptAppend(),
    },
    userPrompt,
  };
}
