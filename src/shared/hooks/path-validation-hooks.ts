/**
 * Path Validation Hooks
 *
 * Provides hook factory for detecting and blocking path duplications
 * in Write/Edit operations (e.g., apps/X/apps/X or packages/Y/packages/Y).
 */

/**
 * Hook callback function type.
 * Receives tool input parameters and returns a decision on whether to continue or block.
 */
export type HookCallback = (toolInput: Record<string, unknown>) => HookResult

/**
 * Result of a hook callback execution.
 */
export interface HookResult {
  /** Decision on whether to continue or block the operation */
  decision: 'continue' | 'block'
  /** Reason for blocking (only when decision is 'block') */
  reason?: string
}

/**
 * Hook configuration for a specific tool matcher.
 */
export interface HookConfig {
  /** Tool name to match (e.g., 'Write', 'Edit') */
  matcher: string
  /** Array of hook callbacks to execute */
  hooks: HookCallback[]
}

/**
 * Collection of hooks organized by hook type.
 */
export interface HooksCollection {
  /** Hooks to execute before tool use */
  PreToolUse: HookConfig[]
}

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
export function createPathDuplicationBlockerHook(): HookCallback {
  return (toolInput: Record<string, unknown>): HookResult => {
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
export function buildPathValidationHooks(): HooksCollection {
  const hook = createPathDuplicationBlockerHook()

  return {
    PreToolUse: [
      { matcher: 'Write', hooks: [hook] },
      { matcher: 'Edit', hooks: [hook] },
    ],
  }
}
