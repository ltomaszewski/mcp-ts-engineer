import { execSync } from 'node:child_process'
import { existsSync } from 'node:fs'
import type { AIQueryResult } from '../../core/ai-provider/ai-provider.types.js'
import type {
  CapabilityContext,
  CapabilityDefinition,
} from '../../core/capability-registry/capability-registry.types.js'
import type { PromptRegistry, PromptVersion } from '../../core/prompt/prompt.types.js'
import { shellQuote } from '../../core/utils/index.js'
import type { RevertStepInput, RevertStepOutput } from './pr-reviewer.schema.js'
import { RevertStepInputSchema } from './pr-reviewer.schema.js'

/**
 * Remove a git worktree by path. Returns true if removed or already absent.
 */
function removeWorktree(worktreePath: string): boolean {
  if (!existsSync(worktreePath)) return true
  try {
    execSync(`git worktree remove ${shellQuote(worktreePath)} --force`, {
      stdio: 'pipe',
      timeout: 30_000,
    })
    return true
  } catch {
    return !existsSync(worktreePath)
  }
}

/**
 * Remove a lock file by path. Returns true if removed or already absent.
 */
function removeLockFile(lockFilePath: string): boolean {
  if (!existsSync(lockFilePath)) return true
  try {
    execSync(`rm -f ${shellQuote(lockFilePath)}`, { stdio: 'pipe', timeout: 10_000 })
    return true
  } catch {
    return !existsSync(lockFilePath)
  }
}

// ---------------------------------------------------------------------------
// Capability definition (programmatic — no AI agent needed)
// ---------------------------------------------------------------------------

const REVERT_PROMPT_V2: PromptVersion = {
  version: 'v2',
  createdAt: '2026-03-16',
  description: 'Programmatic worktree/lock cleanup — no AI agent needed',
  deprecated: false,
  sunsetDate: undefined,
  build: (_input: unknown) => ({
    systemPrompt: 'You are a no-op assistant. Return the JSON exactly as shown.',
    userPrompt: 'Return this JSON: {"status":"ready"}',
  }),
}

const PROMPT_VERSIONS: PromptRegistry = { v2: REVERT_PROMPT_V2 }
const CURRENT_VERSION = 'v2'

export const prRevertStepCapability: CapabilityDefinition<RevertStepInput, RevertStepOutput> = {
  id: 'pr_revert_step',
  type: 'tool',
  visibility: 'internal',
  name: 'PR Revert Step',
  description: 'Clean up worktree and lock file after review completion or failure',
  inputSchema: RevertStepInputSchema,
  promptRegistry: PROMPT_VERSIONS,
  currentPromptVersion: CURRENT_VERSION,
  defaultRequestOptions: {
    model: 'haiku',
    maxTurns: 1,
    maxBudgetUsd: 0.01,
  },
  preparePromptInput: (input: RevertStepInput, _context: CapabilityContext) => input,
  processResult: (
    input: RevertStepInput,
    _aiResult: AIQueryResult,
    context: CapabilityContext,
  ): RevertStepOutput => {
    const worktreeRemoved = input.worktree_path ? removeWorktree(input.worktree_path) : true
    const lockRemoved = input.lock_file_path ? removeLockFile(input.lock_file_path) : true

    context.logger.info('Revert step completed programmatically', {
      worktreeRemoved,
      lockRemoved,
      worktreePath: input.worktree_path ?? null,
      lockFilePath: input.lock_file_path ?? null,
    })

    return { worktree_removed: worktreeRemoved, lock_removed: lockRemoved }
  },
}
