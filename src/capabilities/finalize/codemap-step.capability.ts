/**
 * Codemap step sub-capability definition.
 * Internal capability: updates .claude/codemaps/ architecture documentation.
 *
 * Analyzes changed files for structural impact, reads existing codemaps,
 * and regenerates affected codemaps following the standard format.
 */

import { getProjectConfig } from '../../config/project-config.js'
import type { CapabilityDefinition } from '../../core/capability-registry/capability-registry.types.js'
import { CODEMAP_RESULT_FALLBACK, parseJsonSafe, parseXmlBlock } from './finalize.helpers.js'
import type { CodemapResult, CodemapStepInput } from './finalize.schema.js'
import { CodemapResultSchema, CodemapStepInputSchema } from './finalize.schema.js'
import { CODEMAP_CURRENT_VERSION, codemapPrompts } from './prompts/index.js'

/**
 * Internal sub-capability for updating architecture codemaps.
 * Not intended for direct external use — invoked by the finalize orchestrator.
 *
 * @security Uses `bypassPermissions` and `allowDangerouslySkipPermissions` intentionally
 * for autonomous agent operation. The sub-agent requires unrestricted tool access to
 * analyze file structure and write to .claude/codemaps/ directory. Input is validated
 * via Zod schema and this capability is only invoked through the orchestrator's
 * authenticated channel.
 */
export const finalizeCodemapStepCapability: CapabilityDefinition<CodemapStepInput, CodemapResult> =
  {
    id: 'finalize_codemap_step',
    type: 'tool',
    visibility: 'internal',
    name: 'Finalize Codemap Step (Internal)',
    description:
      'Internal sub-capability: updates .claude/codemaps/ architecture documentation based on file changes. Not intended for direct use.',
    inputSchema: CodemapStepInputSchema,
    promptRegistry: codemapPrompts,
    currentPromptVersion: CODEMAP_CURRENT_VERSION,
    defaultRequestOptions: {
      model: 'sonnet',
      maxTurns: 50,
      maxBudgetUsd: 3.0,
      tools: { type: 'preset', preset: 'claude_code' },
      permissionMode: 'bypassPermissions',
      allowDangerouslySkipPermissions: true,
      settingSources: ['user', 'project'],
    },

    preparePromptInput: (input: CodemapStepInput, _context) => ({
      filesChanged: input.files_changed,
      monorepoRoot: getProjectConfig().monorepoRoot,
      cwd: input.cwd,
    }),

    processResult: (_input: CodemapStepInput, aiResult, _context) => {
      // Parse <codemap_result> XML block from AI response
      const xmlContent = parseXmlBlock(aiResult.content, 'codemap_result')
      const fallback = {
        ...CODEMAP_RESULT_FALLBACK,
        summary: aiResult.content.slice(0, 2000),
      }

      if (xmlContent) {
        return parseJsonSafe(xmlContent, CodemapResultSchema, fallback)
      }

      return fallback
    },
  }
