/**
 * Test step sub-capability definition for audit-fix.
 * Internal capability: runs tests in project workspaces.
 *
 * Executes npm test in each workspace derived from the project,
 * collects results, and returns aggregated test status.
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import { parseJsonSafe, parseXmlBlock, TEST_RESULT_FALLBACK } from './audit-fix.helpers.js'
import type { TestResult, TestStepInput } from './audit-fix.schema.js'
import { TestResultSchema, TestStepInputSchema } from './audit-fix.schema.js'
import { TEST_CURRENT_VERSION, testPrompts } from './prompts/index.js'

/**
 * Internal sub-capability for running tests in project workspaces.
 * Not intended for direct external use — invoked by the audit-fix orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * execute npm test commands in workspace directories. Input is validated via Zod
 * schema and this capability is only invoked through the orchestrator's authenticated channel.
 */
const TEST_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      passed: { type: 'boolean' },
      tests_total: { type: 'integer', minimum: 0 },
      tests_failed: { type: 'integer', minimum: 0 },
      failure_summary: { type: 'string' },
      workspaces_tested: { type: 'array', items: { type: 'string' } },
    },
    required: ['passed', 'tests_total', 'tests_failed', 'failure_summary', 'workspaces_tested'],
  },
}

export const auditFixTestStepCapability: CapabilityDefinition<TestStepInput, TestResult> = {
  id: 'audit_fix_test_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Audit-Fix Test Step (Internal)',
  description:
    'Internal sub-capability: runs npm test in project workspaces. Not intended for direct use.',
  inputSchema: TestStepInputSchema,
  promptRegistry: testPrompts,
  currentPromptVersion: TEST_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'sonnet',
    maxTurns: 30,
    maxBudgetUsd: 2.0,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: TEST_OUTPUT_JSON_SCHEMA,
  },

  preparePromptInput: (input: TestStepInput, _context) => ({
    project_path: input.project_path,
    workspaces: input.workspaces,
    cwd: input.cwd,
  }),

  processResult: (_input: TestStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = TestResultSchema.safeParse(aiResult.structuredOutput)
      if (parsed.success) {
        return parsed.data
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, 'test_result')
    const fallback = {
      ...TEST_RESULT_FALLBACK,
      failure_summary: aiResult.content.slice(0, 2000),
    }

    if (xmlContent) {
      return parseJsonSafe(xmlContent, TestResultSchema, fallback)
    }

    return fallback
  },
}
