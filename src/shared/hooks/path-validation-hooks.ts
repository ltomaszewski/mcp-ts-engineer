/**
 * Path Validation Hooks
 *
 * Provides hook factory for detecting and blocking path duplications
 * in Write/Edit operations (e.g., apps/X/apps/X or packages/Y/packages/Y).
 */

import type { AIHookCallback, AIHookResult, AIHooksConfig } from '../../core/ai-provider/ai-provider.types.js'

/**
 * @deprecated Use AIHookCallback from ai-provider.types.ts
 */
export type HookCallback = AIHookCallback

/**
 * @deprecated Use AIHookResult from ai-provider.types.ts
 */
export type HookResult = AIHookResult

/**
 * @deprecated Use AIHookMatcher from ai-provider.types.ts
 */
export interface HookConfig {
  matcher: string
  hooks: AIHookCallback[]
}

/**
 * @deprecated Use AIHooksConfig from ai-provider.types.ts
 */
export type HooksCollection = AIHooksConfig

/**
 * Creates a hook callback that detects and blocks path duplications.
 *
 * Blocks patterns like:
 * - apps/X/apps/X
 * - packages/Y/packages/Y
 * - apps/X/packages/Y/apps/X (deeply nested)
 *
 * Allows patterns like:
 * - apps/X/src/Y.ts
 * - packages/X/src/index.ts
 * - deeply nested valid paths without duplication
 *
 * @returns Hook callback function that checks for path duplication
 *
 * @example
 * ```ts
 * const hook = createPathDuplicationBlockerHook();
 * const result = hook({ file_path: 'apps/test/apps/test/file.ts' });
 * // result.decision === 'block'
 * // result.reason === 'Path duplication detected: "/apps/test/". Use monorepo-rooted path without duplication.'
 * ```
 */
export function createPathDuplicationBlockerHook(): AIHookCallback {
  return (toolInput: Record<string, unknown>): AIHookResult => {
    const filePath = toolInput.file_path as string | undefined

    // If no file_path provided, allow operation to continue
    if (!filePath) {
      return { decision: 'continue' }
    }

    // Match /segment/segment/ where both segments are identical (case-insensitive)
    // Pattern: /([^/]+)/ captures a path segment, then (?:.*\/)* allows any intermediate paths,
    // then \1\/ matches the same segment again (case-insensitive)
    const duplicationPattern = /\/([^/]+)\/(?:.*\/)*\1\//i
    const match = filePath.match(duplicationPattern)

    if (match) {
      return {
        decision: 'block',
        reason: `Path duplication detected: "${match[0]}". Use monorepo-rooted path without duplication.`,
      }
    }

    return { decision: 'continue' }
  }
}

/**
 * Builds a collection of path validation hooks for Write and Edit operations.
 *
 * Creates PreToolUse hooks that prevent path duplication in file operations.
 *
 * @returns Collection of hooks with Write and Edit matchers
 *
 * @example
 * ```ts
 * const hooks = buildPathValidationHooks();
 * // hooks.PreToolUse contains matchers for 'Write' and 'Edit'
 * ```
 */
export function buildPathValidationHooks(): AIHooksConfig {
  const hook = createPathDuplicationBlockerHook()

  return {
    PreToolUse: [
      { matcher: 'Write', hooks: [hook] },
      { matcher: 'Edit', hooks: [hook] },
    ],
  }
}
