import type { PromptVersion } from '../../../core/prompt/prompt.types.js'

/**
 * Audit step prompt for finalize capability.
 * Scans files for code quality issues, applies auto-fixes, and verifies with tsc.
 */

interface AuditPromptInput {
  filesChanged: string[]
  cwd?: string
}

const buildAuditUserPrompt = (filesChanged: string[], cwd?: string): string => {
  const filesChangedList = filesChanged.map((f) => `  - ${f}`).join('\n')
  const cwdContext = cwd ? `Working directory: ${cwd}\n\n` : ''

  return `You are the Audit Agent for code quality verification and auto-fixing.

${cwdContext}Files to audit:
${filesChangedList}

Your responsibilities:
1. Read and analyze each file for common code quality issues:
   - Race conditions (async/await issues, unhandled promises)
   - TypeScript type errors or unsafe patterns
   - Code style violations (unused imports, missing types)
   - Missing error handling in critical paths
   - Potential bugs or logical errors

2. Apply auto-fixes for detected issues:
   - Fix TypeScript type errors
   - Remove unused imports
   - Add missing await keywords
   - Add proper error handling where needed
   - Fix formatting issues

3. After fixes, run TypeScript verification:
   - Execute: npx tsc --noEmit
   - Capture the result (pass/fail)

4. Count the issues:
   - fixes_applied: number of auto-fixes you made
   - issues_remaining: number of issues you couldn't auto-fix

5. Output your results in this format:

<audit_result>
{
  "status": "pass" | "warn" | "fail",
  "fixes_applied": <number>,
  "issues_remaining": <number>,
  "tsc_passed": <boolean>,
  "summary": "<brief description of what was fixed and any remaining issues>"
}
</audit_result>

Status guidance:
- "pass": No issues found or all issues auto-fixed, tsc passes
- "warn": Some issues auto-fixed, tsc passes, but minor issues remain
- "fail": Critical issues remain or tsc fails

Be thorough but practical. Focus on actionable fixes that improve code quality.`
}

export const auditPromptV1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-01-30',
  description:
    'Audit step: scans files for code quality issues, applies auto-fixes, verifies with tsc',
  deprecated: true,
  sunsetDate: '2026-03-01',
  build: (input: unknown) => {
    const { filesChanged, cwd } = input as AuditPromptInput
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
      },
      userPrompt: buildAuditUserPrompt(filesChanged, cwd),
    }
  },
}
