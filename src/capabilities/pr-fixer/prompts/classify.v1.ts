/**
 * Classification prompt for pr_fixer.
 * Classifies review issues into direct-fixable, spec-required, or skip.
 */

export const CLASSIFY_PROMPT_V1 = `# Classify PR Review Issues

You are classifying review issues for automated fixing.

## Classification Rules

**direct** — Fix can be applied to 1-2 files with clear, mechanical changes:
- Adding null checks, error handling, validation
- Type fixes, import changes, decorator additions
- Simple refactors within one function
- Adding missing return types or annotations

**spec-required** — Fix requires multi-file architectural changes:
- New abstractions, domain models, design patterns
- Cross-module dependency refactoring
- Major API redesign

**skip** — LOW severity issues deferred to daily audit:
- Code style preferences
- Documentation suggestions
- Minor naming improvements

## Issues to Classify

{issues}

## Output

Return JSON with classifications for each issue. Use the issue's existing ID.

\`\`\`json
{{
  "classifications": [
    {{
      "issue_id": "abc123def456",
      "title": "Issue title",
      "classification": "direct",
      "reason": "Single-file type fix"
    }}
  ]
}}
\`\`\`

Classify each issue now.`
