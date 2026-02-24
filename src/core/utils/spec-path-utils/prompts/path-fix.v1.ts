/**
 * Path fix step prompt version 1.
 * AI-assisted path correction for spec files with uncorrectable paths.
 *
 * Uses haiku model for cost efficiency ($0.25/$1.25 per MTok vs sonnet's $3/$15).
 * Structured output guarantees validated JSON result matching PathFixStepOutput schema.
 */

import type { PromptVersion } from '../../../prompt/prompt.types.js'

/** Input shape for the path fix prompt build function. */
export interface PathFixPromptInput {
  specPath: string
  specContent: string
  targetApp: string
  uncorrectablePaths: string[]
  cwd?: string
}

/**
 * System prompt append for path fix step.
 * Ensures AI provides structured output even with minimal verbosity.
 */
const PATH_FIX_SYSTEM_PROMPT_APPEND = `You are a path correction specialist for monorepo spec files. Your task is to fix file paths that reference internal directories or incorrect monorepo roots by researching the codebase structure. Use the Read, Glob, and Grep tools to locate files and determine correct paths. Output corrections as structured JSON matching the PathFixStepOutput schema.`

const PATH_FIX_USER_PROMPT_TEMPLATE = (
  specPath: string,
  specContent: string,
  targetApp: string,
  uncorrectablePaths: string[],
): string => {
  const pathsList = uncorrectablePaths.map((p) => `  - ${p}`).join('\n')

  return `Fix file paths in a spec document by researching the codebase.

<spec_path>${specPath}</spec_path>

<target_app>${targetApp}</target_app>

<uncorrectable_paths>
${pathsList}
</uncorrectable_paths>

<spec_preview>
${specContent.slice(0, 1000)}
${specContent.length > 1000 ? '\n... (truncated for brevity)' : ''}
</spec_preview>

<workflow>
1. **Analyze uncorrectable paths**: Examine each path in <uncorrectable_paths> to determine what file it likely references.

2. **Search the codebase**: For each path, use available tools to locate the correct file:
   - Use Glob to search by filename patterns (e.g., "**/*filename.ts")
   - Use Grep to search for unique identifiers (class names, function exports)
   - Use Read to verify file contents when multiple candidates exist

3. **Determine correct paths**: For each uncorrectable path:
   - If you find the exact file → use "apps/{target_app}/src/{internal_path}" with high confidence
   - If you find similar files but not exact match → infer from patterns with medium confidence
   - If file doesn't exist but pattern is clear → infer location with low confidence
   - If you cannot determine the correct path → mark as remaining uncorrectable

4. **Apply corrections to spec content**: Replace each original path with the corrected monorepo-rooted path in the spec content.

5. **Output structured result**: Return a JSON object matching PathFixStepOutput schema.
</workflow>

<correction_patterns>
Common internal directory patterns:
- core/utils/index.ts → apps/{target_app}/src/core/utils/index.ts
- lib/helpers.ts → apps/{target_app}/src/lib/helpers.ts
- capabilities/index.ts → apps/{target_app}/src/capabilities/index.ts
- modules/auth/auth.service.ts → apps/{target_app}/src/modules/auth/auth.service.ts
</correction_patterns>

<confidence_guidelines>
- **high**: File exists at the corrected path (verified via Read or Glob)
- **medium**: File doesn't exist but similar files follow the pattern
- **low**: Cannot verify but path structure suggests a likely location
</confidence_guidelines>

<rules>
- Research efficiently: Use targeted Glob patterns before broad searches
- Verify ambiguous matches: If multiple files match, use Read to check contents
- Keep original spec structure: Only replace paths, don't modify other content
- Be honest about uncertainty: Use "low" confidence when unsure
- Mark truly uncorrectable paths: If research yields no results, add to remaining_uncorrectable
</rules>

Output format: Your structured output will be captured automatically via the output schema (PathFixStepOutput).`
}

/** Version 1: AI-assisted path correction with codebase research */
export const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-05',
  description:
    'AI-assisted path correction: researches codebase to fix uncorrectable paths, returns PathFixStepOutput via structured output',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { specPath, specContent, targetApp, uncorrectablePaths, cwd } =
      input as PathFixPromptInput
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
        append: PATH_FIX_SYSTEM_PROMPT_APPEND,
      },
      userPrompt: PATH_FIX_USER_PROMPT_TEMPLATE(
        specPath,
        specContent,
        targetApp,
        uncorrectablePaths,
      ),
      cwd,
    }
  },
}
