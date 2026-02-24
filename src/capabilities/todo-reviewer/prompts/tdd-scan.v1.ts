/**
 * TDD scan step prompt version 1.
 * Comprehensive TDD validation with scope boundary, YAGNI, and bidirectional traceability analysis.
 *
 * Uses Opus model for deep reasoning about test adequacy and scope.
 * Replaces the lightweight tdd-validate-step with comprehensive validation matching
 * the Claude Code todo-tdd-reviewer agent's thoroughness.
 *
 * Key validations:
 * - Scope boundary: tests target only files in "Files Changed" section
 * - YAGNI: no tests for library/framework internals
 * - Bidirectional traceability: FR/EC ↔ tests
 * - Proportionality: test count vs FR/EC count ratio
 */

import type { PromptVersion } from '../../../core/prompt/prompt.types.js'
import type { ReviewSummary } from '../todo-reviewer.schema.js'

/** Input shape for the TDD scan step prompt build function. */
export interface TddScanPromptInput {
  specPath: string
  reviewSummary: ReviewSummary
  cwd?: string
}

/**
 * System prompt append for TDD scan step.
 * Ensures structured output is provided after tool use.
 */
const TDD_SCAN_SYSTEM_PROMPT_APPEND = `After completing all analysis, provide your assessment in the required structured output format. Include all findings in the structured output even if you summarize them in text.`

const TDD_SCAN_USER_PROMPT_TEMPLATE = (specPath: string, reviewSummary: ReviewSummary): string => {
  return `You are a comprehensive TDD validator using deep reasoning to ensure test specifications are adequate, properly scoped, and implementation-ready.

<spec_path>${specPath}</spec_path>

<prior_review_status>${reviewSummary.status}</prior_review_status>

<workflow>
## Phase 1: Parse Specification

Read the spec file at <spec_path> and extract:
1. **Files Changed**: List from "## Files Changed" or "## File Changes Summary" section
2. **Functional Requirements (FR)**: Items starting with "FR-" from Acceptance Criteria
3. **Error Conditions (EC)**: Items starting with "EC-" from Acceptance Criteria
4. **Test Coverage Section**: "## Test Coverage" or "## Testing Strategy" section
5. **Test File Mappings**: Which test files test which source files

## Phase 2: Scope Boundary Validation

**Change Boundary**: The spec's "Files Changed" section defines the implementation scope. Tests MUST target only these files unless explicitly justified.

**Validation Steps**:
1. For each test file in the Test Coverage section:
   - Identify which source file it tests (from file name or description)
   - Check if that source file is in "Files Changed"
   - If NOT in "Files Changed", check for justification in a "Scope Boundary" section
2. Classify tests as:
   - **In-scope**: Tests targeting files in "Files Changed"
   - **Justified regression**: Out-of-scope tests with documented reason in spec
   - **Unjustified scope creep**: Out-of-scope tests without justification

**Issue Criteria**:
- CRITICAL: Test targets file not in "Files Changed" and no "Scope Boundary" section exists
- HIGH: Test targets file not in "Files Changed" and "Scope Boundary" section doesn't mention this test

## Phase 3: Coverage Adequacy Validation

**Test File Mapping**:
1. Every file in "Files Changed" with business logic SHOULD have a corresponding test file
2. Exceptions: config files, type-only files, generated files
3. Check if test file is listed in Test Coverage section

**Coverage Target**:
1. Look for explicit coverage target (e.g. "80% line coverage")
2. If missing, flag as MEDIUM severity issue

**FR/EC Traceability**:
1. **Forward traceability** (FR/EC → tests):
   - For each FR-X and EC-X, check if Test Coverage section mentions it
   - Example: "Test: should validate email format (FR-2, EC-1)"
2. **Backward traceability** (tests → FR/EC):
   - For each test case description, check if it references an FR/EC
   - Orphan tests (no FR/EC reference) may indicate YAGNI violations

**Test Scenario Coverage**:
1. Happy path: At least one test for successful operation
2. Edge cases: Boundary conditions, empty inputs, max values
3. Error conditions: Each EC-X should have a test

**YAGNI Violations** (You Ain't Gonna Need It):
- Tests for library/framework internals (e.g., "should verify React useState hook")
- Tests for third-party package behavior (e.g., "should test Zod schema validation")
- Tests for non-existent requirements (no FR/EC mapping)

**Issue Criteria**:
- CRITICAL: Source file in "Files Changed" has no test file listed
- CRITICAL: FR/EC has no corresponding test case
- HIGH: Test case has no FR/EC reference (possible orphan/YAGNI)
- MEDIUM: No explicit coverage target
- WARN: Test count > 3× FR/EC count (possible over-testing)

## Phase 4: Issue Scoring

Categorize each issue by severity:
- **CRITICAL**: Blocks implementation (missing critical tests, untested requirements)
- **HIGH**: Major quality issue (scope creep, missing traceability, YAGNI violations)
- **MEDIUM**: Should fix but not blocking (missing coverage target, minor gaps)
- **WARN**: Advisory (proportionality concerns, optimization opportunities)

For CRITICAL and HIGH issues, set \`needs_fix: true\` in the result.

## Phase 5: Generate Report

For each issue, provide:
1. **Title**: Brief description (e.g., "Missing test coverage for user.service.ts")
2. **Severity**: CRITICAL/HIGH/MEDIUM/WARN
3. **Details**: Explanation of what's wrong
4. **Remediation**: Copy-paste template to fix the issue

**Remediation Template Examples**:

Missing test file:
\`\`\`
Add to Test Coverage section:

- \`src/services/__tests__/user.service.test.ts\`: Unit tests for UserService (FR-1, FR-2, EC-1)
  - Test: should create user with valid data (FR-1)
  - Test: should throw error for duplicate email (EC-1)
\`\`\`

Missing coverage target:
\`\`\`
Add section after Test Coverage:

## Test Coverage Target

80% line coverage across all new code.
\`\`\`

Missing FR/EC mapping:
\`\`\`
Update test case:
- Test: should validate email format (FR-2, EC-1)
\`\`\`

Scope creep (unjustified out-of-scope test):
\`\`\`
Either:
1. Remove test: src/other/__tests__/other.test.ts (not in Files Changed)
2. Or add to Scope Boundary section:

## Scope Boundary

### Regression Tests
- \`src/other/__tests__/other.test.ts\`: Tests unchanged file due to [reason: e.g., "refactored function called by new feature"]
\`\`\`

YAGNI violation:
\`\`\`
Remove test:
- Test: should verify Zod validates schema (YAGNI — testing library internals)
\`\`\`
</workflow>

<rules>
- Use Read tool to analyze the spec file
- DO NOT modify the spec file in this step — only analyze and report issues
- Provide specific file paths and FR/EC identifiers in issues
- Include copy-paste remediation templates for every issue
- Set \`needs_fix: true\` if any CRITICAL or HIGH issues found
- Be thorough: this is Opus-powered deep analysis, not quick validation
</rules>

<output_format>
Return structured output with:
- \`status\`: "PASS" (no issues), "FAIL" (CRITICAL/HIGH issues), or "WARN" (MEDIUM/WARN only)
- \`scope_analysis\`: Scope boundary metrics
- \`coverage_analysis\`: Coverage adequacy metrics
- \`issues\`: Array of detected issues with remediation templates
- \`spec_modified\`: false (scan step doesn't modify)
- \`needs_fix\`: true if any CRITICAL or HIGH issues exist
- \`details\`: Human-readable summary
</output_format>

<decision_criteria>
**PASS**:
- All tests target files in "Files Changed" (or justified in Scope Boundary)
- All files in "Files Changed" have test files
- All FR/EC have corresponding tests
- All tests reference FR/EC (no orphans)
- Explicit coverage target >= 80%
- No YAGNI violations
- Test count proportional to FR/EC count

**FAIL**:
- Missing test coverage for changed files
- Scope creep (unjustified out-of-scope tests)
- Missing FR/EC → test traceability
- YAGNI violations (tests for library internals)

**WARN**:
- Missing coverage target (but tests exist)
- Test count > 3× FR/EC count
- Minor traceability gaps
</decision_criteria>`
}

/** Version 1: Comprehensive TDD scan with Opus-level reasoning */
export const v1: PromptVersion = {
  version: 'v1',
  createdAt: '2026-02-05',
  description:
    'Comprehensive TDD scan: scope boundary, YAGNI, bidirectional traceability, proportionality checks. Returns TddScanStepResult via structured output.',
  deprecated: false,
  sunsetDate: undefined,
  build: (input: unknown) => {
    const { specPath, reviewSummary } = input as TddScanPromptInput
    return {
      systemPrompt: {
        type: 'preset' as const,
        preset: 'claude_code' as const,
        append: TDD_SCAN_SYSTEM_PROMPT_APPEND,
      },
      userPrompt: TDD_SCAN_USER_PROMPT_TEMPLATE(specPath, reviewSummary),
    }
  },
}
