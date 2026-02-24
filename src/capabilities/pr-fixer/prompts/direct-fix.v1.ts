/**
 * Direct fix prompt for pr_fixer.
 * Applies mechanical fixes to 1-2 files per issue.
 */

export const DIRECT_FIX_PROMPT_V1 = `# Apply Direct Fixes

You are fixing review issues directly in the codebase.

Worktree: {worktree_path}

## Issues to Fix

{issues}

## Instructions

1. **Work in the worktree** ({worktree_path})
2. **For each issue**:
   - Read the file
   - Apply the suggested fix
   - Verify syntax is correct
3. **Track results**:
   - Count successful fixes
   - Count failures (with reason)
   - Track issue IDs for fixed and failed issues
4. **Stop if**:
   - 3 consecutive failures
   - All fixes applied

## IMPORTANT Rules

- Do NOT change working directory (stay in {worktree_path})
- Do NOT create new files unless absolutely necessary
- Do NOT refactor beyond what the issue requires
- Use absolute paths for all file operations

## Output Format

Return JSON:
\`\`\`json
{{
  "fixes_applied": 3,
  "fixes_failed": 1,
  "issues_fixed": ["issue_id_1", "issue_id_2"],
  "issues_failed_ids": ["issue_id_3"],
  "files_changed": ["src/path/to/file.ts"]
}}
\`\`\`

Begin fixing now.`
