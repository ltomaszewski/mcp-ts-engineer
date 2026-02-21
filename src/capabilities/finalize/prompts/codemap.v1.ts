import type { PromptVersion } from "../../../core/prompt/prompt.types.js";

/**
 * Codemap step prompt for finalize capability.
 * Analyzes file changes and updates .claude/codemaps/ architecture documentation.
 */

interface CodemapPromptInput {
  filesChanged: string[];
  monorepoRoot: string;
  cwd?: string;
}

const buildCodemapUserPrompt = (
  filesChanged: string[],
  monorepoRoot: string,
  cwd?: string,
): string => {
  const filesChangedList = filesChanged.map((f) => `  - ${f}`).join("\n");
  const cwdContext = cwd ? `Working directory: ${cwd}\n\n` : "";

  return `You are the Codemap Agent for maintaining architecture documentation.

${cwdContext}Monorepo root: ${monorepoRoot}
Codemaps directory: ${monorepoRoot}/.claude/codemaps/

Changed files:
${filesChangedList}

Your responsibilities:
1. Analyze the changed files for structural impact:
   - New modules or packages added
   - Significant refactoring or architectural changes
   - New capabilities or major features
   - Changes to core infrastructure

2. Determine if codemaps need updating:
   - Read existing codemaps from ${monorepoRoot}/.claude/codemaps/
   - Check if changed files are covered by existing codemaps
   - Identify which codemaps are outdated

3. Update affected codemaps:
   - ALWAYS write codemaps to ${monorepoRoot}/.claude/codemaps/ (the monorepo root, NOT a submodule directory)
   - Keep codemaps under 200 lines
   - Use tables for structured data
   - Use directory trees for file structure
   - Focus on high-level architecture, not implementation details
   - Include: purpose, key files, data flow, integration points

4. Codemap format example:
   # Module Name
   **Purpose**: Brief description
   **Location**: path/to/module

   ## Architecture
   [High-level description]

   ## Key Files
   | File | Purpose |
   |------|---------|
   | file.ts | Description |

   ## Directory Structure
   \`\`\`
   module/
   ├── core/
   │   └── main.ts
   └── utils/
       └── helper.ts
   \`\`\`

5. Output your results in this format:

<codemap_result>
{
  "updated": <boolean>,
  "codemaps_changed": ["path/to/codemap1.md", "path/to/codemap2.md"],
  "summary": "<description of what was updated or why no updates were needed>"
}
</codemap_result>

Important:
- Only update if changes are architecturally significant
- Don't update for minor bug fixes or small tweaks
- Create new codemaps for new major modules
- Keep codemaps focused and concise
- ALWAYS use the absolute path ${monorepoRoot}/.claude/codemaps/ for reading and writing codemaps

Your goal is to keep architecture documentation current and useful.`;
};

export const codemapPromptV1: PromptVersion = {
  version: "v1",
  createdAt: "2026-01-30",
  description:
    "Codemap step: analyzes file changes and updates .claude/codemaps/ architecture documentation",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { filesChanged, monorepoRoot, cwd } = input as CodemapPromptInput;
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
      },
      userPrompt: buildCodemapUserPrompt(filesChanged, monorepoRoot, cwd),
    };
  },
};
