/**
 * TDD validate step prompt version 1 (Session 2 — TDD Validation).
 * Validates test coverage adequacy before implementation begins.
 *
 * Agnostic — works for any target app in the monorepo.
 *
 * Optimized for efficiency with structured output:
 * - Uses claude_code preset with append to ensure text output after tool use
 * - SDK structured output (outputSchema) guarantees validated JSON result
 * - Minimal tool usage: read spec once, validate, return result
 *
 * Research finding: Claude 4.5 "tends toward efficiency and may skip verbal
 * summaries after tool calls" — append + structured output solve this.
 */

import type { PromptVersion } from "../../../core/prompt/prompt.types.js";
import type { ReviewSummary } from "../todo-reviewer.schema.js";

/** Input shape for the TDD validate step prompt build function. */
interface TddValidatePromptInput {
  specPath: string;
  reviewSummary: ReviewSummary;
  cwd?: string;
}

/**
 * System prompt append for TDD step.
 * Claude 4.5 skips verbal summaries after tool use — this ensures text output.
 */
const TDD_SYSTEM_PROMPT_APPEND = `After completing all tool use, provide a brief text summary of your findings. Your structured output will be captured automatically via the output schema.`;

const TDD_USER_PROMPT_TEMPLATE = (
  specPath: string,
  reviewSummary: ReviewSummary,
): string => {
  return `You are a TDD validator. Read a spec file and check if its testing strategy is adequate.

<spec_path>${specPath}</spec_path>

<prior_review_status>${reviewSummary.status}</prior_review_status>

<workflow>
1. Read the spec file at <spec_path> using the Read tool.

2. Check these criteria:
   - Does the spec list files to create/modify?
   - Does the spec have a Testing Strategy section with test files?
   - Does every changed source file have a corresponding test file?
   - Is coverage target >= 80%?
   - Are acceptance criteria mapped to test cases?

3. If the spec is missing test coverage, use the Write tool to add or fix the Testing Strategy section.

4. Provide your assessment. The system will capture your structured output automatically.
</workflow>

<rules>
- Keep analysis brief. Read the spec, check criteria, fix if needed, provide assessment.
- The spec file contains all needed information — avoid extensive codebase research.
- Avoid calling AskUserQuestion, slash commands, or referencing .claude/commands/ files.
</rules>

<decision_criteria>
- PASS: All changed files have test files listed, coverage >= 80%, acceptance criteria mapped
- FAIL: Missing test files for changed source files, no coverage target, no testing section
- WARN: Coverage exactly 80%, fewer than 2 error scenarios, minor gaps
</decision_criteria>`;
};

/** Version 1: Agnostic TDD validator with structured output */
export const v1: PromptVersion = {
  version: "v1",
  createdAt: "2026-01-29",
  description:
    "Agnostic TDD validator: reads spec, validates test coverage, returns TddSummary via structured output",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { specPath, reviewSummary } = input as TddValidatePromptInput;
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
        append: TDD_SYSTEM_PROMPT_APPEND,
      },
      userPrompt: TDD_USER_PROMPT_TEMPLATE(specPath, reviewSummary),
    };
  },
};
