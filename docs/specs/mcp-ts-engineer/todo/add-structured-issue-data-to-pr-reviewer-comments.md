**App**: mcp-ts-engineer
**Status**: DRAFT
**Created**: 2026-02-22
**Issue**: #1

# Add structured issue data to pr_reviewer comments

## Context

The `pr_reviewer` tool posts GitHub PR comments with human-readable markdown (severity table, issue descriptions, suggested fixes). Downstream tools (like `pr_fixer` from #2) need to parse these comments to extract issue details programmatically. The comment should include a visible, structured JSON code block containing all issues in a consistent, parseable format — while keeping existing human-readable sections intact.

## Affected Files

- `src/capabilities/pr-reviewer/pr-reviewer.schema.ts`
- `src/capabilities/pr-reviewer/pr-comment-step.capability.ts`

## Implementation Steps

### Step 1: Add ReviewIssueData interface

**File:** `src/capabilities/pr-reviewer/pr-reviewer.schema.ts`
**Action:** Add interface export after the `ReviewIssue` interface.

Find:
```typescript
/** Normalize AI-returned category values (underscores → hyphens). */
const categoryEnum = z.preprocess(
```

Insert before:
```typescript
/** Structured issue data for PR comments, consumed by downstream tools (e.g. pr_fixer). */
export interface ReviewIssueData {
  file: string;
  line: number | null;
  severity: "CRITICAL" | "HIGH" | "MEDIUM" | "LOW";
  category: string;
  title: string;
  description: string;
  suggestedFix: string;
  autoFixable: boolean;
}

```

### Step 2: Update imports

**File:** `src/capabilities/pr-reviewer/pr-comment-step.capability.ts`
**Action:** Add `ReviewIssue` and `ReviewIssueData` to the schema import.

Find:
```typescript
import type { CommentStepInput, CommentStepOutput } from "./pr-reviewer.schema.js";
```

Replace with:
```typescript
import type {
  CommentStepInput,
  CommentStepOutput,
  ReviewIssue,
  ReviewIssueData,
} from "./pr-reviewer.schema.js";
```

### Step 3: Add helper functions

**File:** `src/capabilities/pr-reviewer/pr-comment-step.capability.ts`
**Action:** Add two helper functions before `buildApprovalComment`.

Find:
```typescript
/**
 * Build the approval comment body for zero-issues case.
 */
```

Insert before:
```typescript
/**
 * Map internal ReviewIssue to the public ReviewIssueData schema.
 */
function mapIssuesToData(issues: ReviewIssue[]): ReviewIssueData[] {
  return issues.map((issue) => ({
    file: issue.file_path,
    line: issue.line ?? null,
    severity: issue.severity,
    category: issue.category ?? "",
    title: issue.title,
    description: issue.details,
    suggestedFix: issue.suggestion ?? "",
    autoFixable: issue.auto_fixable,
  }));
}

/**
 * Build the "Issues Data" JSON code block for downstream tools.
 */
function buildIssuesDataSection(issues: ReviewIssue[]): string {
  const data = mapIssuesToData(issues);
  return [
    "### Issues Data",
    "",
    "```json",
    JSON.stringify(data, null, 2),
    "```",
  ].join("\n");
}

```

### Step 4: Modify buildApprovalComment

**File:** `src/capabilities/pr-reviewer/pr-comment-step.capability.ts`
**Action:** Add empty Issues Data section to approval comment.

Find:
```typescript
    `| Cost | $${data.cost_usd.toFixed(2)} |`,
    "",
    "*Automated review by PR Reviewer*",
  ].join("\n");
}

/**
 * Build the full report comment body for issues-found case.
 */
```

Replace with:
```typescript
    `| Cost | $${data.cost_usd.toFixed(2)} |`,
    "",
    buildIssuesDataSection([]),
    "",
    "*Automated review by PR Reviewer*",
  ].join("\n");
}

/**
 * Build the full report comment body for issues-found case.
 */
```

### Step 5: Modify buildFullReportComment

**File:** `src/capabilities/pr-reviewer/pr-comment-step.capability.ts`
**Action:** Add Issues Data section with all issues to full report comment.

Find:
```typescript
  lines.push("*Automated review by PR Reviewer*");
  return lines.join("\n");
}
```

Replace with:
```typescript
  lines.push(buildIssuesDataSection(data.issues));
  lines.push("");
  lines.push("*Automated review by PR Reviewer*");
  return lines.join("\n");
}
```

## Rules

- DO NOT modify existing human-readable comment sections (severity table, issue descriptions, auto-fix summary, metadata line)
- DO NOT change the HEREDOC prompt template, gh CLI command, or processResult logic
- The Issues Data section MUST appear after all human-readable content and before `*Automated review by PR Reviewer*`
- Use `.js` file extensions in all import paths (ESM requirement)

## Verification

After all steps, run:
1. `npm run build -w packages/mcp-ts-engineer` — must succeed with zero errors
2. `npm test -w packages/mcp-ts-engineer` — all existing tests must pass

## Expected Output

After changes, every PR comment ends with:

```
### Issues Data

```json
[
  {
    "file": "src/interceptors/logging.interceptor.ts",
    "line": 46,
    "severity": "HIGH",
    "category": "security",
    "title": "Logging interceptor logs sensitive request data",
    "description": "Request body is logged verbatim...",
    "suggestedFix": "Use NestJS Logger, filter sensitive fields...",
    "autoFixable": false
  }
]
```

For zero-issue comments, the JSON block contains `[]`.

## TDD Test Cases

### Unit Tests for mapIssuesToData

```
- maps ReviewIssue[] to ReviewIssueData[] correctly
- handles empty array → returns []
- maps null line values correctly
- maps missing category/suggestion to empty strings
```

### Unit Tests for buildIssuesDataSection

```
- returns markdown section with JSON code block
- empty issues → JSON block contains []
- multiple issues → all serialized in array
```

### Integration Tests for buildApprovalComment

```
- approval comment includes empty Issues Data section
- Issues Data section appears before footer
```

### Integration Tests for buildFullReportComment

```
- full report includes Issues Data section with all issues
- Issues Data section appears after issue details, before footer
```

## For Implementation

| Field | Value |
|-------|-------|
| **Project** | `packages/mcp-ts-engineer` |
| **Workspace** | `-w packages/mcp-ts-engineer` |
| **Test** | `npm test -w packages/mcp-ts-engineer` |
| **Build** | `npm run build -w packages/mcp-ts-engineer` |
