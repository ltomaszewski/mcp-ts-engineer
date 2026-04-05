/**
 * Shared engineering prompt builder with mode discriminator.
 * Supports "spec" mode (phase implementation) and "fix" mode (audit fix iteration).
 *
 * Originally from: src/capabilities/todo-code-writer/prompts/phase-eng.v2.ts
 */

import type { PhasePlan } from '../../capabilities/todo-code-writer/todo-code-writer.schema.js'
import { resolveCwd } from '../../core/utils/cwd.js'
import { buildTestCommand } from '../test-command.js'
import { buildDevContext } from './dev-context.js'
import {
  buildSkillLoadingSection,
  COMPONENT_CHECK_RULES,
  EXPORT_DESIGN_RULES,
  RACE_CONDITIONS_RULES,
  REACT_HOOKS_REVIEW_RULES,
  TESTING_REQUIREMENTS_RULES,
} from './eng-rules/index.js'

/** Built prompt result. */
export interface BuiltPrompt {
  systemPrompt: {
    type: 'preset'
    preset: 'claude_code'
    append?: string
  }
  userPrompt: string
}

/** Spec mode: implementing a phase from a spec */
interface SpecModeInput {
  mode: 'spec'
  specPath: string
  phasePlan: PhasePlan
  currentPhaseNumber: number
  detectedTechnologies?: string[]
  detectedDependencies?: string[]
  cwd?: string
  auditFeedback?: string
  // Fix-mode fields ignored in spec mode
  auditSummary?: string
  filesWithIssues?: string[]
  iterationNumber?: number
  projectPath?: string
}

/** Fix mode: applying audit fixes in iteration */
interface FixModeInput {
  mode: 'fix'
  projectPath: string
  auditSummary: string
  filesWithIssues: string[]
  iterationNumber: number
  detectedTechnologies?: string[]
  detectedDependencies?: string[]
  cwd?: string
  testFailureSummary?: string
  specPath?: string
  // Spec-mode fields ignored in fix mode
  phasePlan?: PhasePlan
  currentPhaseNumber?: number
}

/** Union type for eng prompt input */
export type EngPromptInput = SpecModeInput | FixModeInput

/**
 * Build system prompt append for phase engineering step.
 * Lazy evaluation ensures it uses the current ProjectConfig.
 */
function buildSystemPromptAppend(): string {
  return `After completing all tool use, provide a brief text summary of the implementation work. Your structured output will be captured automatically via the output schema.

${buildDevContext()}`
}

/**
 * Builds engineering rules section with conditional assembly based on technologies.
 */
const buildEngineeringRulesSection = (technologies: string[]): string => {
  // Include race condition rules for any React-based project (react-native, expo, nextjs all imply React)
  const hasReact =
    technologies.includes('react') ||
    technologies.includes('react-native') ||
    technologies.includes('expo') ||
    technologies.includes('nextjs')
  const hasReactNative = technologies.includes('react-native')

  let section = '<engineering_rules>\n'

  // ALWAYS include testing requirements
  section += '<testing_requirements>\n'
  section += TESTING_REQUIREMENTS_RULES
  section += '\n</testing_requirements>\n\n'

  // ALWAYS include export design
  section += '<export_design>\n'
  section += EXPORT_DESIGN_RULES
  section += '\n</export_design>\n'

  // Conditionally include race conditions for react/react-native/expo
  if (hasReact) {
    section += '\n<race_conditions>\n'
    section += RACE_CONDITIONS_RULES
    section += '\n</race_conditions>\n'
  }

  // Conditionally include component check for react-native only
  if (hasReactNative) {
    section += '\n<component_check>\n'
    section += COMPONENT_CHECK_RULES
    section += '\n</component_check>\n'
  }

  // Conditionally include React hooks review for react/react-native/expo/nextjs
  if (hasReact) {
    section += '\n<react_hooks_review>\n'
    section += REACT_HOOKS_REVIEW_RULES
    section += '\n</react_hooks_review>\n'
  }

  section += '</engineering_rules>'

  return section
}

/**
 * Builds spec mode user prompt.
 */
const buildSpecModeUserPrompt = (input: SpecModeInput): string => {
  const { specPath, phasePlan, currentPhaseNumber, detectedTechnologies, detectedDependencies } =
    input

  const currentPhase = phasePlan.phases.find((p) => p.phase_number === currentPhaseNumber)

  if (!currentPhase) {
    return `Error: Phase ${currentPhaseNumber} not found in phase plan.`
  }

  const fileList = currentPhase.files
    .map((f) => `- ${f.action}: ${f.path} — ${f.purpose}`)
    .join('\n')

  const technologies = detectedTechnologies || []

  // Build skill loading section
  const skillLoadingSection = buildSkillLoadingSection(technologies, detectedDependencies)

  const engineeringRulesSection = buildEngineeringRulesSection(technologies)

  const auditFeedbackSection = input.auditFeedback
    ? `\n<audit_feedback>\nA previous audit of this phase FAILED. You must address these issues:\n${input.auditFeedback}\n</audit_feedback>\n`
    : ''

  return `You are a senior engineer implementing Phase ${currentPhaseNumber} of a feature spec.
${auditFeedbackSection}
<spec_path>${specPath}</spec_path>
<current_phase>${currentPhaseNumber}</current_phase>
<phase_purpose>${currentPhase.purpose}</phase_purpose>

<phase_files>
${fileList}
</phase_files>

${skillLoadingSection}

<workflow>
1. Load all skills listed in <skill_loading> using the Skill tool. This is MANDATORY before any code changes.

2. Read the spec file at <spec_path> using the Read tool.

3. Locate the "Implementation Phases" section in the spec.

4. Find Phase ${currentPhaseNumber} and follow its step-by-step instructions EXACTLY.
   - The spec contains detailed implementation steps for this phase
   - Use the file list above as a guide, but follow the spec's actual instructions

5. **TDD Enforcement — Red-Green-Refactor:**
   a. RED: Create test files FIRST. Run tests — they MUST fail (this proves they test real behavior)
   b. GREEN: Write implementation to make tests pass
   c. REFACTOR: Clean up while tests stay green
   If you skip tests or write implementation first, set test_run_result.ran = false and explain why in summary.

6. After implementation, output a summary in the following JSON format inside <phase_eng_result> XML tags:

<phase_eng_result>
{
  "status": "success",
  "files_modified": [
    "src/capabilities/feature/file1.ts",
    "src/capabilities/feature/file2.ts"
  ],
  "summary": "Implemented schemas with Zod validation. Created 3 schema files with comprehensive input/output types.",
  "test_files_created": ["src/capabilities/feature/__tests__/file1.test.ts"],
  "test_run_result": { "ran": true, "passed": 12, "failed": 0, "skipped": 0 }
}
</phase_eng_result>

6. Provide a brief text summary of what was implemented.
</workflow>

<rules>
- FOLLOW THE SPEC'S PHASE ${currentPhaseNumber} INSTRUCTIONS EXACTLY
- LOAD SKILLS FIRST: Invoke all skills from <skill_loading> before writing code
- TDD: Write tests FIRST, then implement code to make tests pass
- Verify tests fail initially (red phase), then pass after implementation (green phase)
- Read only files referenced in the spec or needed for the current phase. Do not search the broader codebase beyond what the spec specifies.
- Avoid calling AskUserQuestion, slash commands, or referencing .claude/commands/ files
- If tests fail to pass, set status to "failed" and explain in summary
- WORKING DIRECTORY: Use absolute paths for all file operations. The monorepo root is at \`${resolveCwd(input.cwd)}\`.
- PATH FORMAT: Use absolute paths or paths relative to the monorepo root starting with \`apps/\` or \`packages/\`.
- NO CD FOR PATHS: Do NOT use \`cd\` to navigate before file operations.
- VERIFICATION: You MAY run tests but MUST use: cd <workspace> && ${buildTestCommand('jest')} (or Vitest equivalent). Run ONCE per workspace. NEVER re-run. NEVER use bare \`npm test\`.
</rules>

<exception_handling>
When the spec does not match reality, apply these rules:

**Wrong file paths**: If the spec references a file that does not exist at the given path:
  1. Search for the file by name (Glob) — it may have moved.
  2. If found elsewhere, use the actual path and note the discrepancy in your summary.
  3. If not found, create it at the spec path (the spec may be defining a new file).

**Missing APIs or imports**: If the spec calls a function/class that does not exist:
  1. Check if it was renamed (Grep for similar names).
  2. If it exists under a different name, use the real name.
  3. If it truly does not exist, implement it as the spec describes.

**Spec contradictions**: If two parts of the spec conflict:
  1. Prefer the more specific instruction over the general one.
  2. Prefer the Implementation Phases section over the Overview section.
  3. Note the contradiction in your summary so it can be corrected.

**Never**: Silently skip a spec requirement. If you cannot fulfill it, set status to "failed" and explain why.
</exception_handling>

${engineeringRulesSection}

<example>
A successful phase completion looks like:

<phase_eng_result>
{
  "status": "success",
  "files_modified": [
    "src/capabilities/auth/auth.schema.ts",
    "src/capabilities/auth/__tests__/auth.schema.test.ts",
    "src/capabilities/auth/auth.types.ts"
  ],
  "summary": "Created Zod schemas for login and registration inputs with comprehensive validation rules. Added 12 unit tests covering valid inputs, edge cases, and error messages."
}
</phase_eng_result>

A failed phase looks like:

<phase_eng_result>
{
  "status": "failed",
  "files_modified": [
    "src/capabilities/auth/auth.service.ts"
  ],
  "summary": "Implemented auth service but 3 tests fail due to missing mock for database connection. Error: Cannot connect to MongoDB in test environment."
}
</phase_eng_result>
</example>

<output_format>
- Wrap the JSON in <phase_eng_result></phase_eng_result> XML tags
- JSON must have: status ("success" or "failed"), files_modified (array of strings), summary (string)
- files_modified should list ACTUAL files you created or modified during implementation
- summary should be 1-3 sentences describing what was implemented
</output_format>`
}

/**
 * Builds fix mode user prompt.
 */
const buildFixModeUserPrompt = (input: FixModeInput): string => {
  const {
    projectPath,
    auditSummary,
    filesWithIssues,
    iterationNumber,
    detectedTechnologies,
    detectedDependencies,
    testFailureSummary,
    specPath,
  } = input

  const technologies = detectedTechnologies || []

  const skillLoadingSection = buildSkillLoadingSection(technologies, detectedDependencies)

  const engineeringRulesSection = buildEngineeringRulesSection(technologies)

  const filesList =
    filesWithIssues.length > 0
      ? filesWithIssues.map((f) => `  - ${f}`).join('\n')
      : '  (All files in project)'

  return `You are a senior engineer applying audit fixes. This is Iteration ${iterationNumber} of the fix loop.

<project_path>${projectPath}</project_path>
<iteration>${iterationNumber}</iteration>

<audit_summary>
${auditSummary}
</audit_summary>

<files_with_issues>
${filesList}
</files_with_issues>
${
  testFailureSummary
    ? `
<test_failures>
${testFailureSummary}
</test_failures>
`
    : ''
}
${specPath ? `<spec_path>${specPath}</spec_path>` : ''}

${skillLoadingSection}

<workflow>
1. Load all skills listed in <skill_loading> using the Skill tool.

2. Read the audit summary above to understand what issues were found.

3. For each file with issues:
   - Read the file
   - Apply fixes according to audit findings
   - Verify fixes don't break functionality

4. Run tests to verify fixes (detect runner from package.json devDependencies first):
   - Jest (has "jest"/"jest-expo"): ${buildTestCommand('jest')}
   - Vitest (has "vitest"): ${buildTestCommand('vitest')}
   - Run ONCE. NEVER re-run. NEVER parse stdout text. Determine pass/fail from numFailedTests === 0. NEVER use the success field.

5. Output result in JSON format:

<fix_result>
{
  "status": "success",
  "files_modified": ["file1.ts", "file2.ts"],
  "fixes_applied": 3,
  "summary": "Fixed 3 race conditions by adding cleanup functions to useEffect hooks."
}
</fix_result>
</workflow>

<rules>
- LOAD SKILLS FIRST before applying fixes
- Apply fixes based on audit findings in <audit_summary>
- Follow patterns from loaded skills
- Run tests after applying fixes
- Set status to "failed" if unable to fix issues
- WORKING DIRECTORY: Use absolute paths for all file operations. The monorepo root is at \`${resolveCwd(input.cwd)}\`.
- PATH FORMAT: Use absolute paths or paths relative to the monorepo root starting with \`apps/\` or \`packages/\`.
- NO CD FOR PATHS: Do NOT use \`cd\` to navigate before file operations.
- VERIFICATION: You MAY run tests but MUST use: cd <workspace> && ${buildTestCommand('jest')} (or Vitest equivalent). Run ONCE per workspace. NEVER re-run. NEVER use bare \`npm test\`.
</rules>

${engineeringRulesSection}

<example>
A successful fix iteration:

<fix_result>
{
  "status": "success",
  "files_modified": [
    "src/features/auth/login-screen.tsx",
    "src/features/auth/__tests__/login-screen.test.tsx"
  ],
  "fixes_applied": 3,
  "summary": "Fixed 2 race conditions in login screen (added AbortController cleanup and loading guard) and 1 TypeScript strict mode violation. All 8 tests pass."
}
</fix_result>

A failed fix iteration:

<fix_result>
{
  "status": "failed",
  "files_modified": [
    "src/features/dashboard/chart.tsx"
  ],
  "fixes_applied": 1,
  "summary": "Fixed 1 of 3 issues. Remaining 2 require architectural changes to the chart rendering pipeline that cannot be safely applied without manual review."
}
</fix_result>
</example>

<output_format>
- Wrap JSON in <fix_result></fix_result> XML tags
- JSON must have: status ("success" or "failed"), files_modified (array), fixes_applied (number), summary (string)
</output_format>`
}

/**
 * Builds engineering prompt with mode discriminator.
 *
 * @param input - Spec mode or fix mode input
 * @returns Built prompt with system and user prompts
 */
export function buildEngPromptV2(input: EngPromptInput): BuiltPrompt {
  const userPrompt =
    input.mode === 'spec' ? buildSpecModeUserPrompt(input) : buildFixModeUserPrompt(input)

  return {
    systemPrompt: {
      type: 'preset',
      preset: 'claude_code',
      append: buildSystemPromptAppend(),
    },
    userPrompt,
  }
}
