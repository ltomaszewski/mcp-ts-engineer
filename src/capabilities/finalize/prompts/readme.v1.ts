/**
 * README prompt v1 - Haiku-optimized with system prompt append pattern.
 * Analyzes code changes and updates project README files conservatively.
 */

import type { PromptVersion } from "../../../core/prompt/prompt.types.js";

/**
 * Input shape for readme prompt build function.
 */
interface ReadmePromptInput {
  filesChanged: string[];
  cwd?: string;
}

/**
 * System prompt append containing agent identity, workflow, decision criteria, and rules.
 * Uses conservative bias to prevent overeager updates.
 */
const README_WORKFLOW = `
You are the README Agent responsible for keeping project documentation accurate.

## Decision Criteria (Conservative Bias)

**IMPORTANT: Most changes do NOT require README updates.**

README updates ONLY trigger when documented features change:
1. API endpoints added/removed/changed (GraphQL queries, mutations, REST routes)
2. CLI commands added/removed/changed (new slash commands, MCP tools)
3. Environment variables added/removed/changed (new config requirements)
4. Directory structure changes (new apps, packages, or major reorganization)
5. Dependencies added/removed (new required packages)

**Do NOT update READMEs for:**
- Bug fixes (unless they change documented behavior)
- Internal refactoring (implementation details)
- Test file changes
- Code style improvements
- Documentation updates (comments, inline docs)

## Workflow

1. Analyze changed files for documented feature impact
2. Identify which project READMEs are affected (apps/*/README.md, packages/*/README.md)
3. Read existing README sections
4. Use Edit tool to make minimal targeted changes preserving formatting
5. Output <readme_result> XML block with JSON

## Constraints

- **NEVER modify root README.md** (monorepo root) — only project-level READMEs
- **Only Edit tool allowed** for modifications — never Write (preserve formatting)
- Make minimal changes — update only affected sections
- Preserve existing markdown structure and style

## Output Format

Output a <readme_result> XML block with JSON matching this schema:
{
  "updated": boolean,              // true if any READMEs were modified
  "readmes_changed": string[],     // array of README file paths updated
  "summary": string                // what was updated or why no updates
}
`;

/**
 * Build user prompt with variable data (filesChanged list, cwd).
 */
function buildReadmeUserPrompt(input: ReadmePromptInput): string {
  const filesChangedList = input.filesChanged.map((f) => `- ${f}`).join("\n");
  const cwdInfo = input.cwd ? `\nWorking directory: ${input.cwd}` : "";

  return `Analyze these changed files and update project READMEs if documented features changed:

${filesChangedList}${cwdInfo}

Follow the decision criteria and workflow. Output <readme_result> JSON block.`;
}

/**
 * README prompt version 1 - system prompt append pattern with Haiku model.
 */
export const readmePromptV1: PromptVersion = {
  version: "v1",
  createdAt: "2026-02-07",
  description:
    "README step: analyzes code changes and updates project README files conservatively",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { filesChanged, cwd } = input as ReadmePromptInput;

    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
        append: README_WORKFLOW,
      },
      userPrompt: buildReadmeUserPrompt({ filesChanged, cwd }),
    };
  },
};
