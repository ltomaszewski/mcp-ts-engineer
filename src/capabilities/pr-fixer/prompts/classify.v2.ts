/**
 * Classification prompt v2 for pr_fixer.
 * Haiku-optimized: explicit XML tags, short steps, concrete examples.
 */

export function buildClassifyPromptV2(issues: string, projectContext?: string): string {
  const contextSection = projectContext
    ? `<context>
<project_rules>
${projectContext}
</project_rules>
</context>

`
    : ''

  return `${contextSection}<issues>
${issues}
</issues>

<classification_rules>
Classify each issue into exactly ONE category:

direct — 1-2 file mechanical fix. Examples:
  - Adding a null/undefined check
  - Adding missing type annotation or return type
  - Fixing an import path or adding missing import
  - Adding error handling to an empty catch block
  - Adding a missing decorator or annotation

spec-required — Multi-file architectural change. Examples:
  - Extracting shared types across 3+ modules
  - Implementing a new auth flow or middleware chain
  - Refactoring cross-module dependencies
  - Adding a new abstraction layer

skip — LOW severity style/docs items. Examples:
  - Documentation improvements
  - Minor naming preferences
  - Code style suggestions already handled by linters

KEY RULES:
- CRITICAL/HIGH severity issues default to "direct" unless they require 3+ file architectural changes
- NEVER skip security issues regardless of severity
- When in doubt between direct and spec-required, choose "direct"
</classification_rules>

<output_format>
Return JSON:
\`\`\`json
{{
  "classifications": [
    {{
      "issue_id": "the_issue_id",
      "title": "Issue title",
      "classification": "direct",
      "reason": "Brief reason"
    }}
  ]
}}
\`\`\`
</output_format>

Classify each issue now.`
}
