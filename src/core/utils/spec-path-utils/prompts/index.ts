/**
 * Path fix prompt version registry.
 */

import { v1 as pathFixV1 } from './path-fix.v1.js'

/** Path fix step prompt versions */
export const PATH_FIX_PROMPT_VERSIONS = { v1: pathFixV1 } as const

/** Current path fix prompt version */
export const PATH_FIX_CURRENT_VERSION = 'v1' as const
