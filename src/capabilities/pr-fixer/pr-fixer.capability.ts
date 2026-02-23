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
  description: 'PR fixer orchestration prompt',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as { prNumber: number; repoOwner: string; repoName: string }

    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# PR Fixer Pipeline

You must fix the manual review issues found by pr_reviewer on PR #${data.prNumber} in ${data.repoOwner}/${data.repoName}.

## Pipeline Steps

Execute these steps IN ORDER. Do NOT skip any step.

### Step 1: Fetch the latest pr_reviewer comment
Run: \`gh pr view ${data.prNumber} --repo ${data.repoOwner}/${data.repoName} --json comments --jq '.comments | map(select(.body | contains("Issues Data"))) | last | .body'\`

If no comment with "Issues Data" is found, return:
\`\`\`json
{"status": "nothing_to_fix", "issues_input": 0, "issues_resolved": 0, "spec_path": "", "files_changed": [], "cost_usd": 0}
\`\`\`

### Step 2: Parse the Issues Data JSON block
Extract the JSON array from the \`### Issues Data\` section. Filter to all issues with severity other than LOW. Since the reviewer always attempts auto-fixes, any remaining issue is unfixed regardless of its original autoFixable classification.

If no unfixed issues found, return:
\`\`\`json
{"status": "nothing_to_fix", "issues_input": 0, "issues_resolved": 0, "spec_path": "", "files_changed": [], "cost_usd": 0}
\`\`\`

### Step 3: Generate a todo spec
Create a markdown spec file at \`docs/specs/mcp-ts-engineer/todo/YYYY-MM-DD-pr-${data.prNumber}-review-fixes.md\` (use today's date).

The spec must include:
- **Status**: DRAFT header
- Context from the review findings
- Each issue as an implementation step with: file, line, severity, description, suggested fix
- Acceptance criteria per issue
- TDD test cases
- Verification section (build + test commands)

### Step 4: Run todo_reviewer
Use the MCP tool \`todo_reviewer\` with \`spec_path\` set to the spec file path and \`iterations=3\`.
Wait for it to complete. If it returns BLOCKED, stop and return failed status.

### Step 5: Run todo_code_writer
Use the MCP tool \`todo_code_writer\` with \`spec_path\` set to the spec file path and \`max_phases=5\`.
Wait for it to complete. Track all files changed.

### Step 6: Run finalize
Use the MCP tool \`finalize\` with:
- \`files_changed\`: list of all modified files from step 5
- \`spec_path\`: the spec file path

### Step 7: Push to PR branch
Get the PR branch name: \`gh pr view ${data.prNumber} --repo ${data.repoOwner}/${data.repoName} --json headRefName --jq .headRefName\`
Push the commits: \`git push origin <branch-name>\`

### Step 8: Re-run pr_reviewer
Use the MCP tool \`pr_reviewer\` with \`pr="${data.prNumber}"\`.
Compare the new issue count with the original to determine resolution.

### Step 9: Return result
Return a JSON object:
\`\`\`json
{
  "status": "success" or "partial" or "failed",
  "issues_input": <number of manual issues from step 2>,
  "issues_resolved": <issues_input - remaining manual issues after step 8>,
  "spec_path": "<path to spec file>",
  "files_changed": ["<list of changed files>"],
  "cost_usd": 0
}
\`\`\`

- "success" = all manual issues resolved
- "partial" = some but not all resolved
- "failed" = pipeline failed

IMPORTANT: Execute each step sequentially. Do NOT parallelize. Report progress after each step.

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
    'Resolves manual pr_reviewer findings by generating a todo spec and running the spec pipeline ' +
    '(review -> implement -> finalize). Pushes fixes to the PR branch and re-runs review to verify.',
  inputSchema: PrFixerInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 200,
    maxBudgetUsd: 20.0,
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
