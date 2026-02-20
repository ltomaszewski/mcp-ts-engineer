import type { PromptVersion } from "../../../core/prompt/prompt.types.js";

/**
 * Orchestrator prompt for finalize capability.
 * Analyzes changed files, determines affected workspaces, and plans the finalize workflow.
 */

interface OrchestratorPromptInput {
  filesChanged: string[];
  cwd?: string;
}

const buildOrchestratorUserPrompt = (
  filesChanged: string[],
  cwd?: string,
): string => {
  const filesChangedList = filesChanged.map((f) => `  - ${f}`).join("\n");
  const cwdContext = cwd ? `Working directory: ${cwd}\n\n` : "";

  return `You are the Finalize Orchestrator Agent. Your role is to analyze changed files and plan the finalize workflow.

${cwdContext}The following files have changed:
${filesChangedList}

Your tasks:
1. Analyze the file list to determine which workspaces are affected
   - Extract workspace paths from file paths (e.g., "apps/my-server/src/foo.ts" → "apps/my-server")
   - A workspace is a directory containing a package.json file
   - Look for patterns like "apps/*", "packages/*", or root-level package.json

2. Identify which codemap areas might need updating
   - Codemaps are located in .claude/codemaps/
   - Changed files in core infrastructure may require codemap updates
   - Changed files adding new modules or significant structure changes need codemap updates

3. Output your analysis in the following format:

<finalize_plan>
{
  "workspaces": ["apps/workspace-a", "packages/workspace-b"],
  "codemap_areas": ["core-architecture", "capabilities"]
}
</finalize_plan>

The finalize workflow will execute these steps:
1. Audit Step: Scan files for code quality issues, apply auto-fixes, verify with tsc
2. Test Step: Run npm test in affected workspaces (if not skipped)
3. Codemap Step: Update .claude/codemaps/ for changed areas (if not skipped)
4. Commit Step: Commit all cleanup changes

Focus on accurate workspace detection and codemap area identification.`;
};

export const orchestratorPromptV1: PromptVersion = {
  version: "v1",
  createdAt: "2026-01-30",
  description:
    "Orchestrator: analyzes changed files and plans finalize workflow with workspace detection",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { filesChanged, cwd } = input as OrchestratorPromptInput;
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
      },
      userPrompt: buildOrchestratorUserPrompt(filesChanged, cwd),
    };
  },
};
