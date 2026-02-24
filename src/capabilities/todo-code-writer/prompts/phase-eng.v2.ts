/**
 * Phase engineering step prompt version 2.
 * Re-exports shared eng prompt builder from src/shared/prompts/eng-prompt.v2.ts
 *
 * This file exists for backward compatibility. Original implementation
 * moved to shared location for reuse across capabilities.
 */

import type { PromptVersion } from '../../../core/prompt/prompt.types.js'
import { buildEngPromptV2, type EngPromptInput } from '../../../shared/prompts/eng-prompt.v2.js'
import type { PhasePlan } from '../todo-code-writer.schema.js'

/** Extended input shape for the phase engineering v2 prompt build function. */
export interface PhaseEngV2PromptInput {
  specPath: string
  phasePlan: PhasePlan
  currentPhaseNumber: number
  detectedTechnologies?: string[]
  /** Raw dependency names from package.json (for precise skill resolution). */
  detectedDependencies?: string[]
  cwd?: string
}

/** Version 2: Phase engineering with skill loading and conditional engineering rule assembly */
export const phaseEngPromptV2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-01-31',
  description:
    'Phase engineering v2: loads skills via Skill tool and conditionally includes engineering rules based on detected technologies',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const typedInput = input as PhaseEngV2PromptInput

    // Convert to shared format (using "spec" mode)
    const sharedInput: EngPromptInput = {
      mode: 'spec',
      specPath: typedInput.specPath,
      phasePlan: typedInput.phasePlan,
      currentPhaseNumber: typedInput.currentPhaseNumber,
      detectedTechnologies: typedInput.detectedTechnologies,
      detectedDependencies: typedInput.detectedDependencies,
      cwd: typedInput.cwd,
    }

    return buildEngPromptV2(sharedInput)
  },
}
