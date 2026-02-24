/**
 * PR fixer main capability definition.
 * Public MCP tool that resolves pr_reviewer findings via the spec pipeline.
 */

import type {
  CapabilityDefinition,
  CapabilityContext,
} from '../../core/capability-registry/capability-registry.types.js'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseJsonSafe } from '../../core/utils/index.js'
import { getProjectConfig } from '../../config/project-config.js'
import {
  PrFixerInputSchema,
  PrFixerOutputSchema,
  PR_FIXER_OUTPUT_FALLBACK,
  PR_FIXER_OUTPUT_JSON_SCHEMA,
} from './pr-fixer.schema.js'
import type { PrFixerInput, PrFixerOutput } from './pr-fixer.schema.js'

const PR_FIXER_PROMPT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-22',
  description: 'PR fixer orchestration prompt — lightweight direct fixes',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as { prNumber: number; repoOwner: string; repoName: string }

    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# PR Fixer — Lightweight Direct Fix Pipeline

You must fix the review issues found by pr_reviewer on PR #${data.prNumber} in ${data.repoOwner}/${data.repoName}.

IMPORTANT: Use DIRECT inline fixes. Do NOT use the spec pipeline (todo_reviewer/todo_code_writer) — it is too expensive for PR fixes.

## Pipeline Steps

Execute these steps IN ORDER.

### Step 1: Fetch the latest pr_reviewer comment
Run: \`gh pr view ${data.prNumber} --repo ${data.repoOwner}/${data.repoName} --json comments --jq '.comments | map(select(.body | contains("Issues Data"))) | last | .body'\`

If no comment with "Issues Data" is found, return:
\`\`\`json
{"status": "nothing_to_fix", "issues_input": 0, "issues_resolved": 0, "spec_path": "", "files_changed": [], "cost_usd": 0}
\`\`\`

### Step 2: Parse and classify issues
Extract the JSON array from the \`### Issues Data\` section. Filter to issues with severity CRITICAL, HIGH, or MEDIUM only.

If no issues found, return nothing_to_fix.

Classify each issue:
- **Simple** (direct fix): Code changes, error handling, type fixes, null checks, missing validation — anything that can be fixed by editing 1-2 files
- **Complex** (skip): Architecture redesigns, new modules, dependency injection restructuring, circular dependency resolution

Only attempt to fix **simple** issues. Cap at maximum 5 issues to fix.

### Step 3: Apply direct fixes
For each simple issue (up to 5):
1. Read the affected file
2. Understand the issue and suggested fix
3. Apply the fix directly by editing the file
4. Verify the fix doesn't break the file (check for syntax errors)

Track all files changed.

### Step 4: Verify fixes
Run these checks in the repository:
1. \`npm run type-check\` (or \`npx tsc --noEmit\`) — must pass
2. \`npm test\` — all tests must pass

If tests fail, revert the problematic fix and continue with remaining fixes.

### Step 5: Commit and push
If any fixes were applied:
1. Stage changed files: \`git add <files>\`
2. Commit: \`git commit -m "fix: apply <N> fixes from PR review"\`
3. Get PR branch: \`gh pr view ${data.prNumber} --repo ${data.repoOwner}/${data.repoName} --json headRefName --jq .headRefName\`
4. Push: \`git push origin <branch-name>\`

Do NOT re-run pr_reviewer after pushing. The fixes will be verified in the next review cycle if requested.

### Step 6: Return result
Return a JSON object:
\`\`\`json
{
  "status": "success" or "partial" or "failed",
  "issues_input": <total issues from step 2>,
  "issues_resolved": <number of issues successfully fixed>,
  "spec_path": "",
  "files_changed": ["<list of changed files>"],
  "cost_usd": 0
}
\`\`\`

- "success" = all simple issues resolved
- "partial" = some but not all resolved (complex issues skipped)
- "failed" = pipeline error

IMPORTANT: Execute each step sequentially. Keep fixes focused and minimal.

Begin now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: PR_FIXER_PROMPT_V1 }
const CURRENT_VERSION = 'v1'

export const prFixerCapability: CapabilityDefinition<PrFixerInput, PrFixerOutput> = {
  id: 'pr_fixer',
  type: 'tool',
  visibility: 'public',
  name: 'PR Fixer',
  description:
    'Resolves manual pr_reviewer findings by applying direct inline fixes. ' +
    'Classifies issues as simple (direct fix) or complex (skip). ' +
    'Pushes fixes to the PR branch. Does NOT re-run review automatically.',
  inputSchema: PrFixerInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 80,
    maxBudgetUsd: 5.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: PR_FIXER_OUTPUT_JSON_SCHEMA,
  },

  preparePromptInput: (input: PrFixerInput, _context: CapabilityContext) => {
    let prNumber: number
    if (input.pr.includes('github.com')) {
      const match = input.pr.match(/\/pull\/(\d+)/)
      prNumber = match ? parseInt(match[1]!, 10) : parseInt(input.pr, 10)
    } else {
      prNumber = parseInt(input.pr, 10)
    }

    const config = getProjectConfig()
    return {
      prNumber,
      repoOwner: config.repoOwner || '',
      repoName: config.repoName || '',
    }
  },

  processResult: (
    _input: PrFixerInput,
    aiResult: AIQueryResult,
    context: CapabilityContext,
  ): PrFixerOutput => {
    // Strategy 1: SDK structured output
    if (aiResult.structuredOutput) {
      const validated = PrFixerOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }

    // Strategy 2: Parse from content
    const fallback: PrFixerOutput = {
      ...PR_FIXER_OUTPUT_FALLBACK,
      cost_usd: context.getSessionCost().totalCostUsd,
    }
    return parseJsonSafe(aiResult.content, PrFixerOutputSchema, fallback)
  },
}
