**App**: mcp-ts-engineer
**Status**: DRAFT
**Created**: 2026-02-22
**Issue**: #2

# Add pr_fixer tool to resolve review findings via spec pipeline

## Context

The `pr_reviewer` tool identifies code issues and classifies them as `auto_fixable` or `manual`. A new `pr_fixer` tool automates the manual fix workflow: parse the structured review comment (from #1), generate a todo spec, run the spec pipeline (review -> implement -> finalize), push fixes, and re-run pr_reviewer to verify resolution.

## Affected Files

| File | Action | Purpose |
|------|--------|---------|
| `src/capabilities/pr-fixer/pr-fixer.schema.ts` | CREATE | Input/output schemas and types |
| `src/capabilities/pr-fixer/pr-fixer.capability.ts` | CREATE | Capability definition with orchestration prompt |
| `src/capabilities/pr-fixer/pr-fixer.helpers.ts` | CREATE | Helper functions: parse review comment, generate spec |
| `src/capabilities/pr-fixer/__tests__/pr-fixer.schema.test.ts` | CREATE | Schema validation tests |
| `src/capabilities/pr-fixer/__tests__/pr-fixer.helpers.test.ts` | CREATE | Helper function tests |
| `src/capabilities/pr-fixer/index.ts` | CREATE | Module exports |
| `src/capabilities/index.ts` | MODIFY | Register pr_fixer capability |

## Implementation Steps

### Step 1: Create schema file

**File:** `src/capabilities/pr-fixer/pr-fixer.schema.ts`

```typescript
import { z } from "zod";

export const PrFixerInputSchema = z.object({
  pr: z.string().min(1, "PR number or URL is required"),
  cwd: z.string().optional(),
}) as z.ZodType<{ pr: string; cwd?: string }>;

export type PrFixerInput = z.infer<typeof PrFixerInputSchema>;

export const PrFixerOutputSchema = z.object({
  status: z.enum(["success", "partial", "failed", "nothing_to_fix"]),
  issues_input: z.number().min(0),
  issues_resolved: z.number().min(0),
  spec_path: z.string(),
  files_changed: z.array(z.string()),
  cost_usd: z.number().min(0),
});

export type PrFixerOutput = z.infer<typeof PrFixerOutputSchema>;

export const PR_FIXER_OUTPUT_FALLBACK: PrFixerOutput = {
  status: "failed",
  issues_input: 0,
  issues_resolved: 0,
  spec_path: "",
  files_changed: [],
  cost_usd: 0,
};
```

### Step 2: Create helpers file

**File:** `src/capabilities/pr-fixer/pr-fixer.helpers.ts`

Functions to create:
- `parseReviewIssuesFromComment(commentBody: string): ReviewIssueData[]` — Extract JSON from `### Issues Data` code block
- `filterManualIssues(issues: ReviewIssueData[]): ReviewIssueData[]` — Filter to `autoFixable: false`
- `generateSpecContent(prNumber: number, issues: ReviewIssueData[], project: string): string` — Generate todo spec markdown from issues
- `buildSpecPath(project: string, prNumber: number): string` — Generate spec file path

### Step 3: Create capability file

**File:** `src/capabilities/pr-fixer/pr-fixer.capability.ts`

The capability uses an AI agent with `claude_code` tools preset to orchestrate the pipeline:
1. Fetch latest pr_reviewer comment from PR
2. Parse the Issues Data JSON block
3. Filter to manual issues only
4. Generate todo spec
5. Invoke `todo_reviewer` on the spec
6. Invoke `todo_code_writer` on the spec
7. Invoke `finalize` with changed files
8. Push commits to PR branch
9. Re-run `pr_reviewer` in review-only mode
10. Return structured result

### Step 4: Create index and register

**File:** `src/capabilities/pr-fixer/index.ts` — Export capability definition
**File:** `src/capabilities/index.ts` — Import and register

### Step 5: Create tests

Schema validation tests and helper function tests.

## TDD Test Cases

### Schema Tests
- PrFixerInputSchema accepts valid input with pr only
- PrFixerInputSchema accepts valid input with pr and cwd
- PrFixerInputSchema rejects empty pr string
- PrFixerOutputSchema validates all status values

### Helper Tests: parseReviewIssuesFromComment
- Parses valid Issues Data JSON block from comment body
- Returns empty array when no Issues Data section found
- Returns empty array for empty JSON array
- Handles malformed JSON gracefully

### Helper Tests: filterManualIssues
- Filters out autoFixable issues
- Returns all issues when none are autoFixable
- Returns empty array when all are autoFixable

### Helper Tests: generateSpecContent
- Generates valid markdown spec with all issue fields
- Includes affected files from issues
- Includes acceptance criteria per issue
- Generates correct spec path

## Rules

- Follow existing capability patterns from `src/capabilities/pr-reviewer/`
- Use `.js` file extensions in all import paths (ESM requirement)
- Reuse `ReviewIssueData` type from `pr-reviewer.schema.ts` (from #1)
- The orchestration prompt delegates to the AI agent, which calls MCP tools

## Verification

1. `npm run build` — must succeed with zero errors
2. `npm test` — all tests must pass

## For Implementation

| Field | Value |
|-------|-------|
| **Project** | `packages/mcp-ts-engineer` |
| **Workspace** | `-w packages/mcp-ts-engineer` |
| **Test** | `npm test` |
| **Build** | `npm run build` |
