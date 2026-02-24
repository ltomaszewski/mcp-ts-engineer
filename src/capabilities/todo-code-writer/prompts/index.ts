/**
 * Prompt version registries for todo-code-writer capability.
 * Exports all prompt versions for planner, phase-eng, phase-audit, final-audit, and commit.
 */

import type { PromptRegistry } from '../../../core/prompt/prompt.types.js'
import { commitPromptV1 } from './commit.v1.js'
import { finalAuditPromptV1 } from './final-audit.v1.js'
import { phaseAuditPromptV1 } from './phase-audit.v1.js'
import { phaseAuditPromptV2 } from './phase-audit.v2.js'
import { phaseEngPromptV1 } from './phase-eng.v1.js'
import { phaseEngPromptV2 } from './phase-eng.v2.js'
import { plannerPromptV1 } from './planner.v1.js'

// ---------------------------------------------------------------------------
// Planner prompt registry (orchestrator's initial AI query)
// ---------------------------------------------------------------------------

export const PLANNER_PROMPT_VERSIONS: PromptRegistry = {
  v1: plannerPromptV1,
}

export const PLANNER_CURRENT_VERSION = 'v1'

// ---------------------------------------------------------------------------
// Phase engineering prompt registry
// ---------------------------------------------------------------------------

export const PHASE_ENG_PROMPT_VERSIONS: PromptRegistry = {
  v1: phaseEngPromptV1,
  v2: phaseEngPromptV2,
}

export const PHASE_ENG_CURRENT_VERSION = 'v2'

// ---------------------------------------------------------------------------
// Phase audit prompt registry
// ---------------------------------------------------------------------------

export const PHASE_AUDIT_PROMPT_VERSIONS: PromptRegistry = {
  v1: phaseAuditPromptV1,
  v2: phaseAuditPromptV2,
}

export const PHASE_AUDIT_CURRENT_VERSION = 'v2'

// ---------------------------------------------------------------------------
// Final audit prompt registry
// ---------------------------------------------------------------------------

export const FINAL_AUDIT_PROMPT_VERSIONS: PromptRegistry = {
  v1: finalAuditPromptV1,
}

export const FINAL_AUDIT_CURRENT_VERSION = 'v1'

// ---------------------------------------------------------------------------
// Commit prompt registry
// ---------------------------------------------------------------------------

export const COMMIT_PROMPT_VERSIONS: PromptRegistry = {
  v1: commitPromptV1,
}

export const COMMIT_CURRENT_VERSION = 'v1'
