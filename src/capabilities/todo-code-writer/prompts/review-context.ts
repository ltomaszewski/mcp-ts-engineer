/**
 * Embedded review context from .claude/contexts/review.md.
 * Re-exports shared constant from src/shared/prompts/review-context.ts
 *
 * This file exists for backward compatibility. Original implementation
 * moved to shared location for reuse across capabilities.
 */

export {
  buildReviewContext,
  REVIEW_CONTEXT_APPEND_PROMPT,
} from '../../../shared/prompts/review-context.js'
