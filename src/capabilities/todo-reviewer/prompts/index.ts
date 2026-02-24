/**
 * Todo reviewer prompt version registries for all sub-capabilities.
 */

import { v1 as commitV1 } from './commit-step.v1.js'
import { v1 as tddFixV1 } from './tdd-fix.v1.js'
import { v1 as tddScanV1 } from './tdd-scan.v1.js'
import { v1 as tddValidateV1 } from './tdd-validate-step.v1.js'
import { v1 as reviewV1 } from './v1.js'

/** Review session prompt versions */
export const REVIEW_PROMPT_VERSIONS = { v1: reviewV1 } as const
/** Current review prompt version */
export const REVIEW_CURRENT_VERSION = 'v1' as const

/** TDD validate step prompt versions (deprecated — use TDD scan+fix instead) */
export const TDD_VALIDATE_PROMPT_VERSIONS = { v1: tddValidateV1 } as const
/** Current TDD validate prompt version */
export const TDD_VALIDATE_CURRENT_VERSION = 'v1' as const

/** TDD scan step prompt versions (NEW — comprehensive validation) */
export const TDD_SCAN_PROMPT_VERSIONS = { v1: tddScanV1 } as const
/** Current TDD scan prompt version */
export const TDD_SCAN_CURRENT_VERSION = 'v1' as const

/** TDD fix step prompt versions (NEW — remediation application) */
export const TDD_FIX_PROMPT_VERSIONS = { v1: tddFixV1 } as const
/** Current TDD fix prompt version */
export const TDD_FIX_CURRENT_VERSION = 'v1' as const

/** Commit step prompt versions */
export const COMMIT_PROMPT_VERSIONS = { v1: commitV1 } as const
/** Current commit prompt version */
export const COMMIT_CURRENT_VERSION = 'v1' as const
