/**
 * Path fix step sub-capability definition.
 * Internal capability: AI-assisted path correction for spec files with uncorrectable paths.
 *
 * Uses SDK structured output (outputSchema) as primary extraction method.
 * Falls back to XML parsing from aiResult.content if structured output is unavailable.
 *
 * Uses haiku model for cost efficiency ($0.25/$1.25 per MTok vs sonnet's $3/$15).
 * Path correction is a straightforward task requiring codebase search and pattern matching.
 */

import type { CapabilityDefinition } from '../../capability-registry/capability-registry.types.js'
import { parseJsonSafe, parseXmlBlock } from '../index.js'
import { PATH_FIX_CURRENT_VERSION, PATH_FIX_PROMPT_VERSIONS } from './prompts/index.js'
import type { PathFixStepInput, PathFixStepOutput } from './spec-path.schema.js'
import { PathFixStepInputSchema, PathFixStepOutputSchema } from './spec-path.schema.js'

/**
 * JSON Schema for PathFixStepOutput structured output.
 * Matches PathFixStepOutputSchema but in JSON Schema format for the SDK's outputFormat.
 */
const PATH_FIX_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      status: { type: 'string', enum: ['SUCCESS', 'PARTIAL', 'FAILED'] },
      corrections: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            original: { type: 'string' },
            corrected: { type: 'string' },
            confidence: { type: 'string', enum: ['high', 'medium', 'low'] },
          },
          required: ['original', 'corrected', 'confidence'],
        },
      },
      remaining_uncorrectable: {
        type: 'array',
        items: { type: 'string' },
      },
      corrected_content: { type: 'string' },
    },
    required: ['status', 'corrections', 'remaining_uncorrectable', 'corrected_content'],
  },
}

/**
 * Fallback PathFixStepOutput returned when AI output cannot be parsed.
 * Indicates complete failure of the path correction attempt.
 */
const PATH_FIX_FALLBACK: PathFixStepOutput = {
  status: 'FAILED',
  corrections: [],
  remaining_uncorrectable: [],
  corrected_content: '',
}

/**
 * Internal sub-capability for AI-assisted path correction.
 * Not intended for direct external use — invoked by validateAndCorrectSpecPaths orchestration.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to search
 * the codebase (Glob, Grep, Read). Input is validated via Zod schema and this capability
 * is only invoked through authenticated orchestration functions.
 */
export const pathFixStepCapability: CapabilityDefinition<PathFixStepInput, PathFixStepOutput> = {
  id: 'todo_path_fix_step',
  type: 'tool',
  visibility: 'internal',
  name: 'Todo Path Fix Step (Internal)',
  description:
    'Internal sub-capability: AI-assisted path correction for spec files. Not intended for direct use.',
  inputSchema: PathFixStepInputSchema,
  promptRegistry: PATH_FIX_PROMPT_VERSIONS,
  currentPromptVersion: PATH_FIX_CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 20,
    maxBudgetUsd: 0.5,
    tools: { type: 'preset', preset: 'claude_code' },
    permissionMode: 'bypassPermissions',
    allowDangerouslySkipPermissions: true,
    settingSources: ['user', 'project'],
    outputSchema: PATH_FIX_OUTPUT_JSON_SCHEMA,
  },

  preparePromptInput: (input: PathFixStepInput, _context) => ({
    specPath: input.spec_path,
    specContent: input.spec_content,
    targetApp: input.target_app,
    uncorrectablePaths: input.uncorrectable_paths,
    cwd: input.cwd,
  }),

  processResult: (_input: PathFixStepInput, aiResult, _context) => {
    // Strategy 1: Use SDK structured output (guaranteed when outputSchema is set)
    if (aiResult.structuredOutput) {
      const parsed = PathFixStepOutputSchema.safeParse(aiResult.structuredOutput)
      if (parsed.success) {
        return parsed.data
      }
    }

    // Strategy 2: Fall back to XML parsing from text content
    const xmlContent = parseXmlBlock(aiResult.content, 'path_fix')
    const fallback = {
      ...PATH_FIX_FALLBACK,
      corrected_content: aiResult.content.slice(0, 500),
    }
    if (xmlContent) {
      return parseJsonSafe(xmlContent, PathFixStepOutputSchema, fallback)
    }

    return fallback
  },
}
