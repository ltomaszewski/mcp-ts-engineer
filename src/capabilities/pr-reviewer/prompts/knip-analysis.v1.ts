/**
 * Knip dead code analysis prompt template (v1).
 */

import type { PromptRegistry, PromptVersion } from '../../../core/prompt/prompt.types.js'

const KNIP_ANALYSIS_USER_PROMPT_TEMPLATE = (knipOutput: string, worktreePath: string): string => {
  return `# Knip Dead Code Analysis Task

You are analyzing dead code detection results from Knip.

## Worktree Path
${worktreePath}

## Knip Output
\`\`\`
${knipOutput}
\`\`\`

## Your Task
Parse Knip output and identify safe removals:
1. **Unused exports**: Exports not referenced anywhere (safe to remove)
2. **Unused types**: Type definitions not imported (safe if not part of public API)
3. **Unused files**: Files not imported by any entry point (check if tests exist first)
4. **Unused dependencies**: npm packages not imported (safe to remove from package.json)
5. **Unused devDependencies**: Dev packages not used in scripts (safe to remove)

## Safety Rules
- **DO NOT** remove exports from index.ts barrel files (public API)
- **DO NOT** remove test files or test utilities
- **DO NOT** remove types used only in type definitions (even if unused at runtime)
- **DO NOT** remove files with side effects (e.g., polyfills, global setup)

## Output Format
Return a JSON object with this structure:
\`\`\`json
{
  "safe_removals": [
    {
      "type": "unused_export | unused_type | unused_file | unused_dependency",
      "file_path": "path/to/file.ts",
      "identifier": "unusedFunction",
      "reason": "Not imported by any file",
      "confidence": 95
    }
  ],
  "unsafe_removals": [
    {
      "type": "unused_export",
      "file_path": "index.ts",
      "identifier": "publicAPI",
      "reason": "Part of public API, may be used externally"
    }
  ]
}
\`\`\`

Focus on high-confidence safe removals.
`
}

const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-14',
  description: 'Knip analysis to identify safe dead code removals',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const data = input as {
      knipOutput: string
      worktreePath: string
    }
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: KNIP_ANALYSIS_USER_PROMPT_TEMPLATE(data.knipOutput, data.worktreePath),
    }
  },
}

export const KNIP_ANALYSIS_VERSIONS: PromptRegistry = {
  v1,
}

export const KNIP_ANALYSIS_CURRENT_VERSION = 'v1'
