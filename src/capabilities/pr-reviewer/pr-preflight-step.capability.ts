import type { CapabilityDefinition, CapabilityContext } from "../../core/capability-registry/capability-registry.types.js";
import type { AIQueryResult } from "../../core/ai-provider/ai-provider.types.js";
import type { PromptRegistry, PromptVersion } from "../../core/prompt/prompt.types.js";
import { parseXmlBlock, parseJsonSafe } from "../../core/utils/index.js";
import { tryParseJson, sanitizePrContext } from "./pr-reviewer.helpers.js";
import {
  PreflightStepInputSchema,
  PreflightStepOutputSchema,
  PREFLIGHT_OUTPUT_JSON_SCHEMA,
} from "./pr-reviewer.schema.js";
import type { PreflightStepInput, PreflightStepOutput } from "./pr-reviewer.schema.js";

const PREFLIGHT_PROMPT_V1: PromptVersion = {
  version: "v1",
  createdAt: "2026-02-14",
  description: "PR preflight checks - verify PR state, concurrency locks, and incremental SHA",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as PreflightStepInput;
    return {
      systemPrompt: { type: "preset" as const, preset: "claude_code" as const },
      userPrompt: `# PR Preflight Checks

You are performing preflight checks for PR "${data.pr}".

## Tasks

1. **Check PR Status**
   - Run: \`gh pr view ${data.pr} --json state,headRefName,baseRefName,isDraft,number,headRepository\`
   - Verify PR is open (not draft, not closed)
   - Extract: PR number, branch name, base branch, repo owner, repo name

2. **Get Changed Files List**
   - Run: \`gh pr diff ${data.pr} --name-only\`
   - Capture the list of changed file paths

3. **Check Concurrency Lock**
   - Look for lock file matching the PR number
   - If exists and fresh (<10 min), set proceed=false with skip_reason
   - If stale or missing, proceed

4. **Check Incremental SHA** (if incremental=${data.incremental})
   - Check for .pr-reviewer-last-sha file for this PR
   - If exists, include the SHA value

## CRITICAL: Output Format

You MUST respond with ONLY a JSON code block. Do NOT include diff content — that is handled by a later step.

\`\`\`json
{
  "proceed": true,
  "skip_reason": null,
  "pr_context": {
    "pr_number": 123,
    "repo_owner": "owner",
    "repo_name": "repo",
    "pr_branch": "feature/branch",
    "base_branch": "main",
    "files_changed": ["path/to/file1.ts", "path/to/file2.ts"],
    "is_draft": false,
    "is_closed": false,
    "last_reviewed_sha": null
  },
  "last_reviewed_sha": null
}
\`\`\`

IMPORTANT:
- Do NOT include "diff_content" — it will be fetched in the next step
- "files_changed" MUST be an array of file path strings
- "pr_number" MUST be a number (not string)
- Set proceed=false if PR is draft, closed, or locked

Proceed with checks now.`,
    };
  },
};

const PROMPT_VERSIONS: PromptRegistry = { v1: PREFLIGHT_PROMPT_V1 };
const CURRENT_VERSION = "v1";

export const prPreflightStepCapability: CapabilityDefinition<
  PreflightStepInput,
  PreflightStepOutput
> = {
  id: "pr_preflight_step",
  type: "tool",
  visibility: "internal",
  name: "PR Preflight Step",
  description: "Verify PR state, check concurrency locks, and determine incremental review SHA",
  inputSchema: PreflightStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: "haiku",
    maxTurns: 20,
    maxBudgetUsd: 0.5,
    tools: { type: "preset", preset: "claude_code" },
    permissionMode: "bypassPermissions",
    allowDangerouslySkipPermissions: true,
    settingSources: ["user", "project"],
    outputSchema: PREFLIGHT_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: PreflightStepInput, _context: CapabilityContext) => input,
  processResult: (
    _input: PreflightStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext
  ): PreflightStepOutput => {
    const FALLBACK: PreflightStepOutput = { proceed: false, skip_reason: "Failed to parse AI result" };

    // Strategy 1: SDK structured output
    if (aiResult.structuredOutput) {
      const validated = PreflightStepOutputSchema.safeParse(aiResult.structuredOutput);
      if (validated.success) {
        // Sanitize pr_context through Zod to apply defaults and coerce nulls
        const rawCtx = validated.data.pr_context;
        const prCtx = rawCtx ? sanitizePrContext(rawCtx) : null;
        if (validated.data.proceed && !prCtx) {
          return { proceed: false, skip_reason: "Failed to validate pr_context from structured output" };
        }
        return { ...validated.data, pr_context: prCtx ?? undefined };
      }
    }

    // Strategy 2: XML block fallback
    const xmlContent = parseXmlBlock(aiResult.content, "preflight_result");
    if (xmlContent) {
      const fromXml = parseJsonSafe(xmlContent, PreflightStepOutputSchema, FALLBACK);
      const prCtx = fromXml.pr_context ? sanitizePrContext(fromXml.pr_context) : null;
      return { ...fromXml, pr_context: prCtx ?? undefined };
    }

    // Strategy 3: Regex JSON extraction fallback
    const parsed = tryParseJson<Record<string, unknown>>(aiResult.content);
    if (!parsed) return FALLBACK;

    const rawContext = parsed.pr_context;
    const prContext = rawContext ? sanitizePrContext(rawContext) : null;
    if (parsed.proceed && !prContext) {
      return { proceed: false, skip_reason: "Failed to validate pr_context from agent output" };
    }
    return {
      proceed: Boolean(parsed.proceed),
      skip_reason: typeof parsed.skip_reason === "string" ? parsed.skip_reason : undefined,
      pr_context: prContext ?? undefined,
      last_reviewed_sha: typeof parsed.last_reviewed_sha === "string" ? parsed.last_reviewed_sha : undefined,
    };
  },
};
