/**
 * TDD scan step sub-capability definition.
 * Internal capability: comprehensive TDD validation with scope boundary, YAGNI, and bidirectional traceability analysis.
 *
 * Uses Opus model for deep reasoning about test adequacy and scope.
 * Uses SDK structured output (outputSchema) as primary extraction method.
 * Falls back to XML parsing from aiResult.content if structured output is unavailable.
 */

import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import { TDD_SCAN_CURRENT_VERSION, TDD_SCAN_PROMPT_VERSIONS } from './prompts/index.js'
import {
  parseJsonSafe,
  parseXmlBlock,
  TDD_SCAN_STEP_RESULT_FALLBACK,
} from './todo-reviewer.helpers.js'
import type { TddScanStepInput, TddScanStepResult } from './todo-reviewer.schema.js'
import { TddScanStepInputSchema, TddScanStepResultSchema } from './todo-reviewer.schema.js'

/**
 * JSON Schema for TDD scan structured output.
 * Matches TddScanStepResultSchema but in JSON Schema format for the SDK's outputFormat.
 */
const TDD_SCAN_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['PASS', 'FAIL', 'WARN'] },
      scope_analysis: {
        type: 'object',
        properties: {
          files_changed: { type: 'number' },
          tests_defined: { type: 'number' },
          tests_in_scope: { type: 'number' },
          tests_out_of_scope: { type: 'number' },
          justified_regression: { type: 'number' },
          unjustified_scope_creep: { type: 'number' },
          scope_verdict: {
            type: 'string',
            enum: ['CLEAN', 'CREEP_DETECTED', 'OVER_TESTED'],
          },
        },
        required: [
          'files_changed',
          'tests_defined',
          'tests_in_scope',
          'tests_out_of_scope',
          'justified_regression',
          'unjustified_scope_creep',
          'scope_verdict',
        ],
      },
      coverage_analysis: {
        type: 'object',
        properties: {
          coverage_target: { type: 'string' },
          coverage_explicit: { type: 'boolean' },
          fr_ec_total: { type: 'number' },
          fr_ec_with_tests: { type: 'number' },
          forward_traceability: { type: 'string', enum: ['complete', 'gaps'] },
          backward_traceability: {
            type: 'string',
            enum: ['complete', 'orphan_tests'],
          },
          test_scenarios: {
            type: 'object',
            properties: {
              happy_path: { type: 'boolean' },
              edge_cases: { type: 'number' },
              error_conditions: { type: 'number' },
            },
            required: ['happy_path', 'edge_cases', 'error_conditions'],
          },
          yagni_violations: { type: 'number' },
        },
        required: [
          'coverage_target',
          'coverage_explicit',
          'fr_ec_total',
          'fr_ec_with_tests',
          'forward_traceability',
          'backward_traceability',
          'test_scenarios',
          'yagni_violations',
        ],
      },
      issues: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            severity: {
              type: 'string',
              enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'WARN'],
            },
            title: { type: 'string' },
            file_path: { type: 'string' },
            details: { type: 'string' },
            remediation: { type: 'string' },
          },
          required: ['severity', 'title', 'details', 'remediation'],
        },
      },
      spec_modified: { type: 'boolean' },
      needs_fix: { type: 'boolean' },
      details: { type: 'string' },
    },
    required: [
      'status',
      'scope_analysis',
      'coverage_analysis',
      'issues',
      'spec_modified',
      'needs_fix',
      'details',
    ],
  },
}

/**
 * Internal sub-capability for comprehensive TDD scan.
 * Not intended for direct external use — invoked by the todo_reviewer orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to read
 * spec files and validate TDD coverage. Input is validated via Zod schema and this
 * capability is only invoked through the orchestrator's authenticated channel.
 */
export const tddScanStepCapability: CapabilityDefinition<TddScanStepInput, TddScanStepResult> = {
  id: 'todo_tdd_scan_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Todo TDD Scan Step (Internal)',
  description:
    'Internal sub-capability: comprehensive TDD validation with scope boundary, YAGNI, and bidirectional traceability. Not intended for direct use.',
  inputSchema: TddScanStepInputSchema,
  promptRegistry: TDD_SCAN_PROMPT_VERSIONS,
  currentPromptVersion: TDD_SCAN_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'opus',
    maxTurns: 50,
    maxBudgetUsd: 2.0,
    maxThinkingTokens: 16000,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: TDD_SCAN_OUTPUT_JSON_SCHEMA,
  },

  preparePromptInput: (input: TddScanStepInput, _context) => ({
    specPath: input.spec_path,
    reviewSummary: input.review_summary,
    cwd: input.cwd,
  }),

  processResult: (_input: TddScanStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = TddScanStepResultSchema.safeParse(aiResult.structuredOutput)
      if (parsed.success) {
        return parsed.data
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, 'tdd_scan_result')
    const fallback = {
      ...TDD_SCAN_STEP_RESULT_FALLBACK,
      details: aiResult.content.slice(0, 2000),
    }
    if (xmlContent) {
      return parseJsonSafe(xmlContent, TddScanStepResultSchema, fallback)
    }

    return fallback
  },
}
