/**
 * Prompt registry barrel for audit-fix capability.
 * Organizes versioned prompts for planner, audit, eng, and commit steps.
 */

import type { PromptRegistry } from '../../../core/prompt/prompt.types.js'
import { commitPromptV1 } from './commit.v1.js'
import { depsFixPromptV1 } from './deps-fix.v1.js'
import { depsScanPromptV1 } from './deps-scan.v1.js'
import { lintFixPromptV1 } from './lint-fix.v1.js'
import { lintScanPromptV1 } from './lint-scan.v1.js'
import { plannerPromptV1 } from './planner.v1.js'
import { testPromptV1 } from './test.v1.js'
import { testPromptV2 } from './test.v2.js'

/**
 * Planner prompt registry for audit-fix capability.
 * Determines which projects need auditing.
 */
export const plannerPrompts: PromptRegistry = {
  v1: plannerPromptV1,
}

/**
 * Commit step prompt registry for audit-fix capability.
 * Commits per-project audit-fix changes.
 */
export const auditFixCommitPrompts: PromptRegistry = {
  v1: commitPromptV1,
}

/**
 * Test step prompt registry for audit-fix capability.
 * Runs npm test in project workspaces and reports results.
 */
export const testPrompts: PromptRegistry = {
  v1: testPromptV1,
  v2: testPromptV2,
}

/**
 * Lint scan prompt registry for audit-fix capability.
 * Detects and runs project lint scripts.
 */
export const lintScanPrompts: PromptRegistry = {
  v1: lintScanPromptV1,
}

/**
 * Lint fix prompt registry for audit-fix capability.
 * Fixes lint issues in dedicated eng session.
 */
export const lintFixPrompts: PromptRegistry = {
  v1: lintFixPromptV1,
}

/**
 * Deps scan prompt registry for audit-fix capability.
 * Runs npm audit --json to detect vulnerabilities.
 */
export const depsScanPrompts: PromptRegistry = {
  v1: depsScanPromptV1,
}

/**
 * Deps fix prompt registry for audit-fix capability.
 * Runs npm audit fix and tracks modified files.
 */
export const depsFixPrompts: PromptRegistry = {
  v1: depsFixPromptV1,
}

// Current versions for each prompt
export const PLANNER_CURRENT_VERSION = 'v1'
export const AUDIT_FIX_COMMIT_CURRENT_VERSION = 'v1'
export const TEST_CURRENT_VERSION = 'v2'
export const LINT_SCAN_CURRENT_VERSION = 'v1'
export const LINT_FIX_CURRENT_VERSION = 'v1'
export const DEPS_SCAN_CURRENT_VERSION = 'v1'
export const DEPS_FIX_CURRENT_VERSION = 'v1'
