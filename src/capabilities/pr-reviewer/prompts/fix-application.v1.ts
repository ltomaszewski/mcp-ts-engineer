/**
 * Fix application prompt template (v1).
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const FIX_APPLICATION_USER_PROMPT_TEMPLATE = (
  issue: string,
  filePath: string,
  fileContent: string,
): string => {
  return `# Fix Application Task

You are applying an automated fix to a code quality issue.

## Issue to Fix
\`\`\`json
${issue}
\`\`\`

## File Path
${filePath}

## File Content
\`\`\`typescript
${fileContent}
\`\`\`

## Your Task
Apply the fix described in the issue using EDIT OPERATIONS (not full file replacement):
1. **Minimal changes**: Only modify what's necessary to fix the issue
2. **Preserve formatting**: Keep existing indentation and style
3. **No side effects**: Don't introduce new issues
4. **Type safety**: Ensure TypeScript compiles after fix
5. **Test compatibility**: Don't break existing tests

## Output Format
Return a JSON object with an array of edit operations:
\`\`\`json
{
  "edits": [
    {
      "old_string": "// exact text to find in the file",
      "new_string": "// replacement text"
    }
  ],
  "changes_summary": "Brief description of what changed",
  "confidence": 90
}
\`\`\`

### Edit Rules
- Each edit has \`old_string\` (exact match in file) and \`new_string\` (replacement)
- \`old_string\` must be unique within the file — include enough context lines to disambiguate
- Preserve surrounding whitespace and indentation exactly
- Order edits top-to-bottom as they appear in the file
- Keep edits small and focused — one logical change per edit
- Set confidence 0-100: how certain the fix is correct without manual review

After applying the fix, verify it doesn't break TypeScript compilation.
`
}

const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Fix application prompt for automated issue remediation',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as {
      issue: string
      filePath: string
      fileContent: string
    }
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: FIX_APPLICATION_USER_PROMPT_TEMPLATE(data.issue, data.filePath, data.fileContent),
    }
  },
}

export const FIX_APPLICATION_VERSIONS: PromptRegistry = {
  v1,
}

export const FIX_APPLICATION_CURRENT_VERSION = 'v1'
