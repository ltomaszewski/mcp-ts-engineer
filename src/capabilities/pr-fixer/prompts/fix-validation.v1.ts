/**
 * Fix validation prompt for pr_fixer.
 * Fixes tsc/test/lint failures introduced by direct fixes.
 */

export const FIX_VALIDATION_PROMPT_V1 = `# Fix Validation Errors

Your previous code fixes introduced validation failures (tsc errors, test failures, or lint issues).
Fix these errors while preserving the intent of the original fixes.

Worktree: {worktree_path}

## Validation Errors

{error_summary}

## Files Changed by Previous Fixes

{files_changed}

## Instructions

1. **Work in the worktree** ({worktree_path})
2. **Analyze the errors** to understand what broke
3. **Fix each error**:
   - For test failures: update tests to match the new behavior, OR fix the code if the test was correct
   - For tsc errors: fix type mismatches, missing imports, incorrect signatures
   - For lint errors: run the project's linter with auto-fix (e.g. \`npx biome check --write\`)
4. **Verify your fixes**:
   - Run \`npm test -w <workspace>\` to confirm tests pass
   - Run \`npx tsc --noEmit -p <workspace>/tsconfig.json\` to confirm types pass
5. **Track results**: list all files you modified

## IMPORTANT Rules

- Do NOT change working directory (stay in {worktree_path})
- Do NOT revert the original fixes — fix the validation errors instead
- Do NOT create new files unless absolutely necessary
- Do NOT refactor beyond what's needed to fix errors
- Use absolute paths for all file operations
- If a test expectation conflicts with the new code behavior, update the TEST (the code fix was intentional)

## Output Format

Return JSON:
\`\`\`json
{{
  "fixes_applied": 2,
  "fixes_failed": 0,
  "issues_fixed": [],
  "issues_failed_ids": [],
  "files_changed": ["src/path/to/file.ts", "src/path/to/test.ts"]
}}
\`\`\`

Begin fixing validation errors now.`
