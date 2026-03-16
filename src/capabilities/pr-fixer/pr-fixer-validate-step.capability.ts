/**
 * Validate step: Run tsc + tests after direct fixes.
 */

import { z } from 'zod'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { isValidPath, parseJsonSafe, shellQuote } from '../../core/utils/index.js'
import type { FixerValidateStepOutput } from './pr-fixer.schema.js'
import {
  FIXER_VALIDATE_OUTPUT_JSON_SCHEMA,
  FixerValidateStepOutputSchema,
} from './pr-fixer.schema.js'

const ValidateStepInputSchema = z.object({
  worktree_path: z.string().refine(isValidPath, { message: 'Invalid path' }),
  files_changed: z.array(z.string()),
  cwd: z.string().optional(),
})

type ValidateStepInput = z.infer<typeof ValidateStepInputSchema>

const VALIDATE_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-24',
  description: 'Validate fixes via tsc and tests (deprecated, use v2)',
  deprecated: true,
  sunsetDate: '2026-04-01',
  build: (input: unknown) => {
    const data = input as ValidateStepInput
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Validate Fixes

Worktree: ${data.worktree_path}

## Steps

1. **Run TypeScript type check**:
\`\`\`bash
cd ${shellQuote(data.worktree_path)} && npx tsc --noEmit 2>&1 | tail -20
\`\`\`

2. **Run tests**:
\`\`\`bash
cd ${shellQuote(data.worktree_path)} && npm test 2>&1 | tail -30
\`\`\`

## Output

Return JSON:
\`\`\`json
{
  "tsc_passed": true,
  "tests_passed": true
}
\`\`\`

Run validation now.`,
    }
  },
}

const VALIDATE_V2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-02-24',
  description: 'Workspace-aware validation with regression detection',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as ValidateStepInput
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Validate Fixes (Workspace-Aware)

Worktree: ${data.worktree_path}
Files Changed: ${data.files_changed.length}

## Changed Files
${data.files_changed.map((f) => `- ${f}`).join('\n')}

## Steps

### 1. Determine affected workspaces

Parse the changed file paths above to identify affected workspaces (e.g. \`apps/api-server\`, \`packages/types\`).
Extract the workspace prefix from each path (first two path segments like \`apps/X\` or \`packages/X\`).

**IMPORTANT**: Exclude \`packages/mcp-ts-engineer\` — it is a tooling submodule and should NOT be validated.

If no workspaces can be determined from the paths, set both tsc_passed and tests_passed to true and return.

### 2. Run TypeScript type check per workspace

For each affected workspace that has a \`tsconfig.json\`:
\`\`\`bash
cd ${shellQuote(data.worktree_path)} && npx tsc --noEmit -p <workspace>/tsconfig.json 2>&1 | tail -30
\`\`\`

**Regression detection**: Only count tsc errors as failures if the errors reference files that are in the changed files list above. Pre-existing errors in files NOT in the changed list should be IGNORED — they are not regressions introduced by the fixer.

Do NOT run \`npx tsc --noEmit\` at the monorepo root — this will use the root tsconfig which may lack project-specific settings like \`experimentalDecorators\`.

### 3. Run tests per workspace

For each affected workspace:
\`\`\`bash
cd ${shellQuote(data.worktree_path)} && npm test -w <workspace> 2>&1 | tail -30
\`\`\`

### 4. Determine results

- \`tsc_passed\` = all workspace tsc checks pass (ignoring pre-existing errors in unchanged files), OR no workspaces found
- \`tests_passed\` = all workspace tests pass, OR no workspaces found

## Output

Return JSON:
\`\`\`json
{
  "tsc_passed": true,
  "tests_passed": true,
  "error_summary": "Optional: if tsc or tests failed, include the relevant error messages here (last 30 lines of each failing command output). Leave empty or omit if all passed."
}
\`\`\`

**IMPORTANT**: If tsc or tests fail, you MUST include the error output in \`error_summary\` so subsequent fix steps can use it. Include the failing test names, assertion errors, and tsc error messages.

Begin validation now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: VALIDATE_V1, v2: VALIDATE_V2 }
const CURRENT_VERSION = 'v2'

const FALLBACK: FixerValidateStepOutput = { tsc_passed: false, tests_passed: false }

export const prFixerValidateStepCapability: CapabilityDefinition<
  ValidateStepInput,
  FixerValidateStepOutput
> = {
  id: 'pr_fixer_validate_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Fixer Validate Step',
  description: 'Validate fixes by running tsc and tests',
  inputSchema: ValidateStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 15,
    maxBudgetUsd: 0.5,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: FIXER_VALIDATE_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: ValidateStepInput) => input,
  processResult: (
    _input: ValidateStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): FixerValidateStepOutput => {
    if (aiResult.structuredOutput) {
      const validated = FixerValidateStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }
    return parseJsonSafe(aiResult.content, FixerValidateStepOutputSchema, FALLBACK)
  },
}
