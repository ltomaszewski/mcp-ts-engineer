import type { CapabilityDefinition, CapabilityContext } from "../../core/capability-registry/capability-registry.types.js";
import type { AIQueryResult } from "../../core/ai-provider/ai-provider.types.js";
import type { PromptRegistry, PromptVersion } from "../../core/prompt/prompt.types.js";
import { parseXmlBlock, parseJsonSafe } from "../../core/utils/index.js";
import {
  CleanupStepInputSchema,
  CleanupStepOutputSchema,
  CLEANUP_OUTPUT_JSON_SCHEMA,
} from "./pr-reviewer.schema.js";
import type { CleanupStepInput, CleanupStepOutput } from "./pr-reviewer.schema.js";

const CLEANUP_PROMPT_V1: PromptVersion = {
  version: "v1",
  createdAt: "2026-02-14",
  description: "Run knip for dead code detection and cleanup",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as CleanupStepInput;

    // Derive affected workspaces from changed files (e.g. "apps/my-server" from "apps/my-server/src/foo.ts")
    const workspaces = [
      ...new Set(
        (data.files_changed ?? [])
          .map((f) => f.match(/^(apps\/[^/]+|packages\/[^/]+)/)?.[1])
          .filter((w): w is string => w !== undefined),
      ),
    ];

    const knipCommands = workspaces.length > 0
      ? workspaces
          .map((ws) => `cd ${data.worktree_path} && npx knip --workspace './${ws}' --no-exit-code 2>&1 || true`)
          .join("\n   ")
      : `cd ${data.worktree_path} && npx knip --no-exit-code 2>&1 || true`;

    return {
      systemPrompt: { type: "preset" as const, preset: "claude_code" as const },
      userPrompt: `# Cleanup Pass - Dead Code Detection

You are running cleanup in the worktree after applying fixes.

Worktree: ${data.worktree_path}
Changed workspaces: ${workspaces.length > 0 ? workspaces.join(", ") : "unknown"}

## CRITICAL CONSTRAINTS

- **NEVER create, modify, or read files outside** \`${data.worktree_path}\`
- **NEVER create files in the main repo root** (parent of .worktrees/)
- If a tool or config file is missing in the worktree, skip that step — do NOT create it

## Tasks

1. **Run knip** (dead code detector) scoped to changed workspaces:
   \`\`\`bash
   ${knipCommands}
   \`\`\`
   If knip fails (missing config, module errors), skip it and report 0 unused exports.

2. **Analyze knip output** (only if step 1 succeeded):
   - Unused exports
   - Unused dependencies
   - Unreachable code

3. **Remove dead code** (if safe):
   - Unused imports
   - Unused variables
   - DO NOT remove if unsure

4. **Run type check** in the affected workspace:
   \`\`\`bash
   cd ${data.worktree_path}${workspaces.length === 1 ? `/${workspaces[0]}` : ""} && npx tsc --noEmit
   \`\`\`

## Output Format

Respond with JSON:
\`\`\`json
{
  "unused_exports_found": 5,
  "unused_exports_removed": 3,
  "tsc_passed": true
}
\`\`\`

Begin cleanup now.`,
    };
  },
};

const PROMPT_VERSIONS: PromptRegistry = { v1: CLEANUP_PROMPT_V1 };
const CURRENT_VERSION = "v1";

export const prCleanupStepCapability: CapabilityDefinition<
  CleanupStepInput,
  CleanupStepOutput
> = {
  id: "pr_cleanup_step",
  type: "tool",
  visibility: "internal",
  name: "PR Cleanup Step",
  description: "Run knip for dead code detection and safe removal",
  inputSchema: CleanupStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: "haiku",
    maxTurns: 30,
    maxBudgetUsd: 1.0,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
    outputSchema: CLEANUP_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: CleanupStepInput, _context: CapabilityContext) => input,
  processResult: (
    _input: CleanupStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext
  ): CleanupStepOutput => {
    const FALLBACK: CleanupStepOutput = { unused_exports_found: 0, unused_exports_removed: 0, tsc_passed: false };

    // Strategy 1: SDK structured output
    if (aiResult.structuredOutput) {
      const validated = CleanupStepOutputSchema.safeParse(aiResult.structuredOutput);
      if (validated.success) return validated.data;
    }

    // Strategy 2: XML block fallback
    const xmlContent = parseXmlBlock(aiResult.content, "cleanup_result");
    if (xmlContent) return parseJsonSafe(xmlContent, CleanupStepOutputSchema, FALLBACK);

    return FALLBACK;
  },
};
