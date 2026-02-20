/**
 * Echo agent prompt versions registry.
 */

import { v1 } from "./v1.js";

/** All prompt versions for echo-agent */
export const PROMPT_VERSIONS = { v1 } as const;

/** Current active version */
export const CURRENT_VERSION = "v1" as const;

/** Current active prompt */
export const currentPrompt = PROMPT_VERSIONS[CURRENT_VERSION];
