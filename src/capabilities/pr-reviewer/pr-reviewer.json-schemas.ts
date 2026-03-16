/**
 * JSON Schema objects for structured output (SDK outputFormat).
 * Extracted from pr-reviewer.schema.ts to keep files under 300 lines.
 */

// ---------------------------------------------------------------------------
// Shared JSON Schema fragment
// ---------------------------------------------------------------------------

/** Shared JSON Schema fragment for review issues. */
const REVIEW_ISSUE_JSON_SCHEMA = {
  type: 'object',
  properties: {
    severity: {
      type: 'string',
      enum: ['CRITICAL', 'HIGH', 'MEDIUM', 'LOW', 'INFO', 'WARN', 'WARNING'],
    },
    category: { type: 'string', enum: ['code-quality', 'security', 'architecture', 'performance'] },
    title: { type: 'string' },
    file_path: { type: 'string' },
    line: { type: 'number' },
    details: { type: 'string' },
    suggestion: { type: 'string' },
    auto_fixable: { type: 'boolean' },
    confidence: { type: 'number' },
  },
  required: ['severity', 'title', 'file_path', 'details', 'auto_fixable', 'confidence'],
} as const

// ---------------------------------------------------------------------------
// Step JSON Schemas
// ---------------------------------------------------------------------------

export const PREFLIGHT_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      proceed: { type: 'boolean' },
      skip_reason: { type: 'string' },
      pr_context: {
        type: 'object',
        properties: {
          pr_number: { type: 'number' },
          repo_owner: { type: 'string' },
          repo_name: { type: 'string' },
          pr_branch: { type: 'string' },
          base_branch: { type: 'string' },
          files_changed: { type: 'array', items: { type: 'string' } },
          is_draft: { type: 'boolean' },
          is_closed: { type: 'boolean' },
          last_reviewed_sha: { type: 'string' },
        },
        required: ['pr_number', 'repo_owner', 'repo_name', 'pr_branch', 'base_branch'],
      },
      last_reviewed_sha: { type: 'string' },
      head_sha: { type: 'string' },
    },
    required: ['proceed'],
  },
}

export const CONTEXT_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      worktree_path: { type: 'string' },
      diff_content: { type: 'string' },
      files_changed: { type: 'array', items: { type: 'string' } },
    },
    required: ['worktree_path', 'diff_content', 'files_changed'],
  },
}

export const REVIEW_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      agent: { type: 'string' },
      issues: { type: 'array', items: REVIEW_ISSUE_JSON_SCHEMA },
    },
    required: ['agent', 'issues'],
  },
}

export const AGGREGATE_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      issues: { type: 'array', items: REVIEW_ISSUE_JSON_SCHEMA },
      deduped_count: { type: 'number' },
    },
    required: ['issues', 'deduped_count'],
  },
}

export const VALIDATE_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      issues: { type: 'array', items: REVIEW_ISSUE_JSON_SCHEMA },
      auto_fixable: { type: 'array', items: REVIEW_ISSUE_JSON_SCHEMA },
      manual: { type: 'array', items: REVIEW_ISSUE_JSON_SCHEMA },
      filtered_count: { type: 'number' },
    },
    required: ['issues', 'auto_fixable', 'manual', 'filtered_count'],
  },
}

export const FIX_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      fixes_applied: { type: 'number' },
      fixes_failed: { type: 'number' },
      issues_fixed: { type: 'array', items: { type: 'string' } },
      budget_spent: { type: 'number' },
    },
    required: ['fixes_applied', 'fixes_failed', 'issues_fixed', 'budget_spent'],
  },
}

export const CLEANUP_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      unused_exports_found: { type: 'number' },
      unused_exports_removed: { type: 'number' },
      tsc_passed: { type: 'boolean' },
    },
    required: ['unused_exports_found', 'unused_exports_removed', 'tsc_passed'],
  },
}

export const TEST_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      tests_passed: { type: 'boolean' },
      workspaces_tested: { type: 'array', items: { type: 'string' } },
      reverts_needed: { type: 'number' },
    },
    required: ['tests_passed', 'workspaces_tested', 'reverts_needed'],
  },
}

export const COMMIT_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      committed: { type: 'boolean' },
      pushed: { type: 'boolean' },
      commit_sha: { type: 'string' },
    },
    required: ['committed', 'pushed'],
  },
}

export const COMMENT_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      comment_url: { type: 'string' },
      inline_comments_posted: { type: 'number' },
      summary_posted: { type: 'boolean' },
    },
    required: ['comment_url', 'inline_comments_posted', 'summary_posted'],
  },
}

export const REVERT_OUTPUT_JSON_SCHEMA: Record<string, unknown> = {
  type: 'json_schema',
  schema: {
    type: 'object',
    properties: {
      worktree_removed: { type: 'boolean' },
      lock_removed: { type: 'boolean' },
    },
    required: ['worktree_removed', 'lock_removed'],
  },
}
