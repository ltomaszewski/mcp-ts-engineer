/**
 * Embedded development context from .claude/contexts/dev.md.
 * Re-exports shared constant from src/shared/prompts/dev-context.ts
 *
 * This file exists for backward compatibility. Original implementation
 * moved to shared location for reuse across capabilities.
 */

export { DEV_CONTEXT_APPEND_PROMPT, buildDevContext } from "../../../shared/prompts/dev-context.js";
