import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { parseJsonSafe, parseXmlBlock, shellQuote } from '../../core/utils/index.js'
import type { TestStepInput, TestStepOutput } from './pr-reviewer.schema.js'
import {
  TEST_OUTPUT_JSON_SCHEMA,
  TestStepInputSchema,
  TestStepOutputSchema,
} from './pr-reviewer.schema.js'

const TEST_PROMPT_V1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: "Run tests to verify fixes didn't break functionality",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as TestStepInput
    return {
      systemPrompt: { type: 'preset' as const, preset: 'claude_code' as const },
      userPrompt: `# Test Verification

You are running tests after applying fixes and cleanup.

Worktree: ${data.worktree_path}
Files Changed: ${data.files_changed.length}

## Changed Files
${data.files_changed.map((f) => `- ${f}`).join('\n')}

## Tasks

1. **Determine affected workspaces**:
   - Parse file paths to identify apps/packages
   - Examples: apps/my-server, packages/types

2. **Run tests for each workspace**:
   \`\`\`bash
   cd ${shellQuote(data.worktree_path)}
   npm test -w <workspace>
   \`\`\`

3. **Analyze results**:
   - Pass/fail status per workspace
   - Count failures

4. **Determine action**:
   - If all pass: SUCCESS
   - If some fail due to fixes: Mark for REVERT

## Output Format

Respond with JSON:
\`\`\`json
{
  "tests_passed": true,
  "workspaces_tested": ["apps/my-server"],
  "reverts_needed": 0
}
\`\`\`

Begin testing now.`,
    }
  },
}

const PROMPT_VERSIONS: PromptRegistry = { v1: TEST_PROMPT_V1 }
const CURRENT_VERSION = 'v1'

export const prTestStepCapability: CapabilityDefinition<TestStepInput, TestStepOutput> = {
  id: 'pr_test_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Test Step',
  description: "Run tests to verify fixes didn't break functionality",
  inputSchema: TestStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 30,
    maxBudgetUsd: 1.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: TEST_OUTPUT_JSON_SCHEMA,
  },
  preparePromptInput: (input: TestStepInput, _context: CapabilityContext) => input,
  processResult: (
    _input: TestStepInput,
    aiResult: AIQueryResult,
    _context: CapabilityContext,
  ): TestStepOutput => {
    const FALLBACK: TestStepOutput = {
      tests_passed: false,
      workspaces_tested: [],
      reverts_needed: 0,
    }

    // Strategy 1: SDK structured output
    if (aiResult.structuredOutput) {
      const validated = TestStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (validated.success) return validated.data
    }

    // Strategy 2: XML block fallback
    const xmlContent = parseXmlBlock(aiResult.content, 'test_result')
    if (xmlContent) return parseJsonSafe(xmlContent, TestStepOutputSchema, FALLBACK)

    return FALLBACK
  },
}
