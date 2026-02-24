/**
 * Todo reviewer prompt version 1 (Session 1 — Spec Writer).
 * Autonomous spec writer: reads any draft todo spec for any app in the monorepo,
 * generates all missing content from codebase research, writes a complete
 * implementation-ready spec.
 *
 * Agnostic — works for any target app (server, mobile, MCP, packages).
 *
 * Optimized for Claude Opus 4.5:
 * - Uses claude_code preset with `append` to override Edit-preference bias
 * - All task instructions in user prompt for maximum clarity
 * - Document skeleton with 16 sections forces complete generation
 * - Agnostic: derives all specifics from the draft spec content
 * - Reference spec for FORMAT only (not methodology)
 *
 * Key research findings applied (Anthropic official docs):
 * - claude_code preset says "ALWAYS prefer editing existing files" — append overrides this
 * - Claude 4.x: "Be explicit" + "Add context (explain WHY)" + "Tell what TO DO, not what NOT to do"
 * - Claude 4.5: More responsive to system prompt than previous models
 * - Affirmative instructions outperform negations
 */

import type { PromptVersion } from '../../../core/prompt/prompt.types.js'

/** Input shape for the review prompt build function. */
interface ReviewPromptInput {
  specPath: string
  cwd?: string
}

/**
 * System prompt append that overrides the claude_code preset's Edit preference.
 * The preset contains "ALWAYS prefer editing existing files" which causes the model
 * to use Edit for incremental patches instead of Write for complete document generation.
 * This append instructs the model to use Write for this specific task.
 */
const SYSTEM_PROMPT_APPEND = `<spec_writer_override>
You are a spec writer generating a complete document. For this task, use the Write tool to create the complete document in a single call. The Write tool is the correct tool because you are generating all content from scratch, not patching an existing file. After writing the document, output a summary XML block as plain text.

After completing all tool use, provide a brief text summary of the work you completed.
</spec_writer_override>`

const REVIEW_USER_PROMPT_TEMPLATE = (specPath: string): string => {
  return `You are a spec writer. Read a draft todo spec, research the codebase, then write a COMPLETE implementation-ready spec with all 16 sections populated.

<spec_path>${specPath}</spec_path>
<reference_spec>docs/specs/mcp-ts-engineer/todo-reviewer-capability.md</reference_spec>

<instructions>
Execute these steps in order:

1. Read the draft spec at <spec_path>
   - Identify the target app from the **App** field
   - Note what sections already exist and what is missing
   - If old "Review Findings" or "Blockers" exist, treat each as a content generation task

2. Read the reference spec at <reference_spec>
   - Use it ONLY as a FORMAT reference — it shows the structure and depth of a complete 16-section spec
   - Do NOT adopt its review methodology or "10 phases" process
   - Do NOT copy its content — derive everything from the draft spec and codebase research

3. Research the target app's codebase
   - Read existing source files in the target app directory to understand patterns, types, and conventions
   - Read relevant config, schemas, and framework types
   - Use Glob and Grep to discover file structure and patterns
   - Verify all file paths you plan to reference in the spec

4. Use the Write tool to write the COMPLETE 16-section document to <spec_path>
   - Write a BRAND NEW complete document because you are generating all content from scratch
   - ALL 16 sections must be present and fully populated with real content
   - Derive all specifics (schemas, acceptance criteria, phases, tests) from your codebase research
   - Set Status to IN_REVIEW (unless a genuine architectural ambiguity requires human decision — use BLOCKED)

5. Output the <review_summary> XML block as plain text
</instructions>

<rules>
- When content is missing from the draft, WRITE it. Never report it as "missing" or "blocked".
- Old "Review Findings" listing blockers are your TODO list — generate the content to resolve each, then replace the findings with your own.
- BLOCKED means only: an unresolvable architectural choice requiring human input. Missing content is never a blocker — you write it.
- Use the Write tool with the complete document. You are generating all 16 sections from scratch, so the Write tool is the correct choice.
- Avoid placeholder text: "TBD", "TODO", "etc.", "as needed", "to be defined".
- Avoid calling AskUserQuestion, slash commands, or referencing .claude/commands/ files.
</rules>

<sections>
Your document must contain exactly these 16 sections. Derive all content from the draft spec and your codebase research.

## SECTION 1: Metadata Header
App name, Status (IN_REVIEW), Created date, Reviewed date.

## SECTION 2: Overview
2-3 sentences describing the feature/capability. Preserve key info from the draft.

## SECTION 3: User Story
"As a [role] I want [capability] so that [benefit]" — infer from the draft's description and context.

## SECTION 4: Problem Context
3-5 sentences explaining why this feature is needed. Use the draft's context and your codebase research.

## SECTION 5: Feature Analysis
Table: Primary Area | Technologies | Key Patterns. Infer from the target app's tech stack.

## SECTION 6: Acceptance Criteria
Write 10-15 numbered acceptance criteria (AC-1 through AC-N). Each must be testable. Cover: input validation, output validation, core workflow/orchestration, registration/integration, error handling, and any constraints from the draft.

## SECTION 7: Technical Requirements
Framework constraints, dependencies, and patterns relevant to the target app. Read config files and package.json for specifics.

## SECTION 8: Inter-Session Data Contracts
If the feature involves multiple sessions/steps: define typed data contracts (Zod schemas or TypeScript interfaces) for every handoff between steps. If single-session: define input/output schemas.

## SECTION 9: Required Knowledge
Table: Skill | Area | Usage. List skills needed to implement (infer from technologies).

## SECTION 10: Architecture
Preserve any existing architecture diagram from the draft. Add relevant registration or integration tables.

## SECTION 11: Implementation Phases
Write 3-5 phases. For EACH phase include:
- Purpose (one sentence)
- Dependencies (what must be done first)
- Files table (path | action CREATE/MODIFY | purpose)
- Steps (3-8 numbered steps)
- Verification command (specific test or build command)
- Success criteria (what "done" means)

## SECTION 12: File Changes Summary
Complete table: Path | Action (CREATE/MODIFY) | Purpose — for every file.

## SECTION 13: Scope Boundary
Three subsections:
- In scope: list all new/modified files
- Out of scope: what should NOT be changed
- Unchanged modules: existing modules that remain untouched

## SECTION 14: Testing Strategy
Coverage target (80%+). List each test file with 3-5 specific test case descriptions. Describe mocking approach.

## SECTION 15: Key Design Decisions
Expand design decisions from the draft into numbered items with: decision, rationale, alternatives considered, evidence from codebase.

## SECTION 16: Review Findings
Your own findings from building this spec. Status IN_REVIEW with 0 blockers if you wrote all content. List any warnings discovered during research.
</sections>

<output_format>
After writing the complete spec, output a <review_summary> XML block with this JSON:

| Field | Type | Description |
|-------|------|-------------|
| status | "IN_REVIEW" or "BLOCKED" | IN_REVIEW if all 16 sections written |
| spec_path | string | Spec file path |
| target_app | string | Target app from spec metadata |
| corrections_applied | number | Sections generated + fixes |
| blockers_remaining | number | 0 if READY |
| warnings | number | Warning count |
| cross_app_status | "READY", "BLOCKED", or "N/A" | N/A if self-contained |
| consistency_score | string | e.g. "14/14 (0B, 2W)" |
| key_findings | string[] | What you wrote (max 10) |
| spec_modified | boolean | true if you wrote the spec |

<example>
<review_summary>
{"status":"IN_REVIEW","spec_path":"docs/specs/app/feature.md","target_app":"my-app","corrections_applied":14,"blockers_remaining":0,"warnings":2,"cross_app_status":"N/A","consistency_score":"14/14 (0B, 2W)","key_findings":["Wrote 12 acceptance criteria from codebase analysis","Wrote inter-session data contracts with Zod schemas","Wrote 5 implementation phases with verification commands","Wrote testing strategy with 7 test files","Wrote scope boundary","Wrote 4 design decisions with rationale"],"spec_modified":true}
</review_summary>
</example>
</output_format>`
}

/** Version 1: Agnostic spec writer with ReviewSummary output */
export const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-01-29',
  description:
    'Agnostic spec writer: reads any draft todo, generates all missing content, writes complete 16-section spec',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { specPath } = input as ReviewPromptInput
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
        append: SYSTEM_PROMPT_APPEND,
      },
      userPrompt: REVIEW_USER_PROMPT_TEMPLATE(specPath),
    }
  },
}
