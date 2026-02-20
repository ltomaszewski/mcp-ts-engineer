import type { CapabilityDefinition, CapabilityContext } from "../../core/capability-registry/capability-registry.types.js";
import type { AIQueryResult } from "../../core/ai-provider/ai-provider.types.js";
import type { PromptRegistry, PromptVersion } from "../../core/prompt/prompt.types.js";
import { parseXmlBlock, parseJsonSafe } from "../../core/utils/index.js";
import {
  FixStepInputSchema,
  FixStepOutputSchema,
  FIX_OUTPUT_JSON_SCHEMA,
} from "./pr-reviewer.schema.js";
import type { FixStepInput, FixStepOutput } from "./pr-reviewer.schema.js";

const FIX_PROMPT_V1: PromptVersion = {
  version: "v1",
  createdAt: "2026-02-14",
  description: "Apply auto-fixes for validated issues",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as FixStepInput;
    return {
      systemPrompt: { type: "preset" as const, preset: "claude_code" as const },
      userPrompt: `# Apply Auto-Fixes

You are fixing ${data.issues.length} auto-fixable issues.

Worktree: ${data.worktree_path}
Budget remaining: $${data.budget_remaining} USD

## Issues to Fix

${data.issues
  .map(
    (issue, i) => `${i + 1}. [${issue.severity}] ${issue.file_path}:${issue.line ?? "?"}
   ${issue.title}
   Fix: ${issue.suggestion ?? "Apply standard fix"}
   Confidence: ${issue.confidence}`
  )
  .join("\n\n")}

## Instructions

1. **Work in the worktree** (${data.worktree_path})
2. **Apply fixes one by one**:
   - Read the file
   - Apply the suggested fix
   - Verify syntax is correct
3. **Track results**:
   - Count successful fixes
   - Count failures (with reason)
4. **Stop if**:
   - Budget exhausted
   - 3 consecutive failures
   - All fixes applied

## Output Format

Respond with JSON:
\`\`\`json
{
  "fixes_applied": 3,
  "fixes_failed": 1,
  "issues_fixed": ["Issue title 1", "Issue title 2"],
  "budget_spent": 0.5
}
\`\`\`

Begin fixing now.`,
    };
  },
};

const PROMPT_VERSIONS: PromptRegistry = { v1: FIX_PROMPT_V1 };
const CURRENT_VERSION = "v1";

export const prFixStepCapability: CapabilityDefinition<
  FixStepInput,
  FixStepOutput
> = {
  id: "pr_fix_step",
  type: "tool",
  visibility: "internal",
  name: "PR Fix Step",
  description: "Apply auto-fixes for validated issues within budget",
  inputSchema: FixStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: "sonnet",
    maxTurns: 50,
    maxBudgetUsd: 3.0,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
    outputSchema: FIX_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: FixStepInput, _context: CapabilityContext) => input,
  processResult: (
    _input: FixStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext
  ): FixStepOutput => {
    const FALLBACK: FixStepOutput = { fixes_applied: 0, fixes_failed: 0, issues_fixed: [], budget_spent: 0 };

    // Strategy 1: SDK structured output
    if (aiResult.structuredOutput) {
      const validated = FixStepOutputSchema.safeParse(aiResult.structuredOutput);
      if (validated.success) return validated.data;
    }

    // Strategy 2: XML block fallback
    const xmlContent = parseXmlBlock(aiResult.content, "fix_result");
    if (xmlContent) return parseJsonSafe(xmlContent, FixStepOutputSchema, FALLBACK);

    return FALLBACK;
  },
};
