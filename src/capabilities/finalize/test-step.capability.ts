/**
 * Test step sub-capability definition.
 * Internal capability: runs tests in affected workspaces.
 *
 * Executes npm test in each workspace derived from the changed files,
 * collects results, and returns aggregated test status.
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import { parseJsonSafe, parseXmlBlock, TEST_RESULT_FALLBACK } from './finalize.helpers.js'
import type { TestResult, TestStepInput } from './finalize.schema.js'
import { TestResultSchema, TestStepInputSchema } from './finalize.schema.js'
import { TEST_CURRENT_VERSION, testPrompts } from './prompts/index.js'

/**
 * Internal sub-capability for running tests in affected workspaces.
 * Not intended for direct external use — invoked by the finalize orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * execute npm test commands in workspace directories. Input is validated via Zod
 * schema and this capability is only invoked through the orchestrator's authenticated channel.
 */
export const finalizeTestStepCapability: CapabilityDefinition<TestStepInput, TestResult> = {
  id: 'finalize_test_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Finalize Test Step (Internal)',
  description:
    'Internal sub-capability: runs npm test in affected workspaces. Not intended for direct use.',
  inputSchema: TestStepInputSchema,
  promptRegistry: testPrompts,
  currentPromptVersion: TEST_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet[1m]',
    maxTurns: 30,
    maxBudgetUsd: 2.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
  },

  preparePromptInput: (input: TestStepInput, _context) => ({
    workspaces: input.workspaces,
    cwd: input.cwd,
  }),

  processResult: (_input: TestStepInput, aiResult, _context) => {
    // Parse <test_result> XML block from AI response
    const xmlContent = parseXmlBlock(aiResult.content, 'test_result')
    const fallback = {
      ...TEST_RESULT_FALLBACK,
      summary: aiResult.content.slice(0, 2000),
    }

    if (xmlContent) {
      return parseJsonSafe(xmlContent, TestResultSchema, fallback)
    }

    return fallback
  },
}
