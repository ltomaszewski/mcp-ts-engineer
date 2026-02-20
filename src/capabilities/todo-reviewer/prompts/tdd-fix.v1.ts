/**
 * TDD fix step prompt version 1.
 * Applies remediation templates from TDD scan to spec file.
 *
 * Uses Sonnet model (remediation is mechanical template application, not deep reasoning).
 * Receives scan results with issues and applies the provided remediation templates.
 *
 * Key operations:
 * - Add missing test file mappings
 * - Add missing coverage targets
 * - Add missing FR/EC test case mappings
 * - Add/correct "Scope Boundary" section
 * - Remove YAGNI-violating test specifications
 */

import type { PromptVersion } from "../../../core/prompt/prompt.types.js";
import type { TddScanStepResult } from "../todo-reviewer.schema.js";

/** Input shape for the TDD fix step prompt build function. */
export interface TddFixPromptInput {
  specPath: string;
  scanResult: TddScanStepResult;
  cwd?: string;
}

/**
 * System prompt append for TDD fix step.
 * Ensures structured output is provided after modifications.
 */
const TDD_FIX_SYSTEM_PROMPT_APPEND = `After applying all fixes, provide your assessment in the required structured output format. Summarize what was fixed and what remains.`;

const TDD_FIX_USER_PROMPT_TEMPLATE = (
  specPath: string,
  scanResult: TddScanStepResult,
): string => {
  const issuesJson = JSON.stringify(scanResult.issues, null, 2);
  const issueCount = scanResult.issues.length;

  return `You are a TDD spec fixer. Apply remediation templates from scan results to fix test specification issues.

<spec_path>${specPath}</spec_path>

<scan_status>${scanResult.status}</scan_status>

<issues_found>${issueCount}</issues_found>

<issues_with_remediations>
${issuesJson}
</issues_with_remediations>

<workflow>
## Step 1: Read Current Spec

Use Read tool to get the current spec content from <spec_path>.

## Step 2: Apply Remediations

For each issue in <issues_with_remediations>, apply its \`remediation\` template:

### Issue Type: Missing Test File

**Pattern**: "Add to Test Coverage section:"

**Action**:
1. Locate "## Test Coverage" or "## Testing Strategy" section
2. Append the test file specification from remediation template
3. Preserve existing formatting

**Example remediation**:
\`\`\`
Add to Test Coverage section:

- \`src/services/__tests__/user.service.test.ts\`: Unit tests for UserService (FR-1, FR-2, EC-1)
  - Test: should create user with valid data (FR-1)
  - Test: should throw error for duplicate email (EC-1)
\`\`\`

**Application**: Insert this content at the end of Test Coverage section.

### Issue Type: Missing Coverage Target

**Pattern**: "Add section after Test Coverage:"

**Action**:
1. Locate end of "## Test Coverage" section
2. Add new section "## Test Coverage Target" with target specification

**Example remediation**:
\`\`\`
Add section after Test Coverage:

## Test Coverage Target

80% line coverage across all new code.
\`\`\`

**Application**: Insert this as a new H2 section after Test Coverage.

### Issue Type: Missing FR/EC Mapping

**Pattern**: "Update test case:"

**Action**:
1. Find the test case description in Test Coverage section
2. Add FR/EC identifiers in parentheses

**Example remediation**:
\`\`\`
Update test case:
- Test: should validate email format (FR-2, EC-1)
\`\`\`

**Application**: Modify existing test line to include (FR-2, EC-1).

### Issue Type: Scope Creep (Out-of-Scope Test)

**Pattern**: "Either:" with two options

**Action**:
1. **Preferred**: Remove the out-of-scope test specification from Test Coverage
2. **Alternative**: Add "## Scope Boundary" section with justification

**Example remediation**:
\`\`\`
Either:
1. Remove test: src/other/__tests__/other.test.ts (not in Files Changed)
2. Or add to Scope Boundary section:

## Scope Boundary

### Regression Tests
- \`src/other/__tests__/other.test.ts\`: Tests unchanged file due to [reason]
\`\`\`

**Application**: Choose option 1 (removal) unless there's clear reason for regression test.

### Issue Type: YAGNI Violation

**Pattern**: "Remove test:"

**Action**:
1. Find the test line in Test Coverage section
2. Delete the entire test specification

**Example remediation**:
\`\`\`
Remove test:
- Test: should verify Zod validates schema (YAGNI — testing library internals)
\`\`\`

**Application**: Remove this line from Test Coverage.

## Step 3: Write Corrected Spec

Use Write tool to save the modified spec to <spec_path>.

## Step 4: Verify Fixes

Quick sanity check:
- Count how many issues you successfully fixed
- Note any issues you couldn't fix (e.g., ambiguous location)

## Step 5: Return Result

Provide structured output with:
- \`status\`: "success" (all fixed), "partial" (some fixed), or "failed" (none fixed)
- \`issues_fixed\`: Count of successfully applied remediations
- \`issues_remaining\`: Count of issues not fixed
- \`spec_modified\`: true if spec was written
- \`fix_summary\`: Human-readable summary of what was fixed
</workflow>

<rules>
- Apply EVERY remediation template from <issues_with_remediations>
- Use Write tool to save the corrected spec
- DO NOT skip issues marked CRITICAL or HIGH
- If a remediation is ambiguous, apply best effort and note in fix_summary
- Preserve spec formatting and existing content
- DO NOT add commentary or extra sections beyond remediations
</rules>

<output_format>
Return structured output with:
- \`status\`: "success", "partial", or "failed"
- \`issues_fixed\`: Number of issues successfully fixed
- \`issues_remaining\`: Number of issues not fixed (should be 0 for "success")
- \`spec_modified\`: true if Write tool was used
- \`fix_summary\`: Concise summary of applied fixes
</output_format>`;
};

/** Version 1: TDD fix with remediation template application */
export const v1: PromptVersion = {
  version: "v1",
  createdAt: "2026-02-05",
  description:
    "TDD fix: applies remediation templates from scan results to spec file. Returns TddFixStepResult via structured output.",
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { specPath, scanResult } = input as TddFixPromptInput;
    return {
      systemPrompt: {
        type: "preset" as const,
        preset: "claude_code" as const,
        append: TDD_FIX_SYSTEM_PROMPT_APPEND,
      },
      userPrompt: TDD_FIX_USER_PROMPT_TEMPLATE(specPath, scanResult),
    };
  },
};
