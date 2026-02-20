/**
 * Shared Hooks Module
 *
 * Exports hook factories for path validation and other common hook patterns.
 */

export { buildPathValidationHooks } from './path-validation-hooks.js';
export type {
  HookCallback,
  HookResult,
  HookConfig,
  HooksCollection,
} from './path-validation-hooks.js';
