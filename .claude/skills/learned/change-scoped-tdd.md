# Change-Scoped Test-Driven Development

**Extracted:** 2026-01-27
**Context:** When planning, reviewing, or validating test coverage for any feature spec or todo
**Project:** mcp-ts-engineer

## Problem

TDD validation often checks that tests *exist* but not that tests are *correctly scoped*. This leads to:
- Tests for unchanged code (scope creep)
- Tests for library/framework internals (YAGNI violation)
- Over-testing with duplicate coverage
- Tests disconnected from the actual change being made

## Solution

Apply **change-scoped TDD** — tests must cover the change and ONLY the change. This is enforced through five principles:

### 1. Define the Change Boundary First

Before writing any test, categorize every file as CREATE / MODIFY / DELETE. Only files in this set should have new tests. Unchanged files are out of scope unless regression risk is explicitly documented.

### 2. Bidirectional Traceability

- **Forward**: Every FR/EC in the change maps to at least one test case
- **Backward**: Every test case maps back to an FR/EC *in the change* — no orphan tests targeting unrelated requirements

### 3. YAGNI for Tests

Never test:
- External library behavior (e.g., "Zustand persists data" — that's Zustand's job)
- Framework mechanics (e.g., "NestJS DI injects service" — that's NestJS's job)
- Unchanged code paths without documented regression justification
- Trivial getters/setters with no logic

### 4. Proportionality Check

- Test scenario count should be roughly proportional to FR/EC count
- If tests > 3x FRs/ECs, likely over-testing
- If spec touches 3+ files, require an explicit "Out of Scope" section

### 5. Regression Requires Justification

Testing unchanged code is allowed ONLY when:
- The unchanged file is directly connected to changed behavior
- The specific regression risk is documented (not just "might break")
- The justification names the coupling mechanism

## Example

```markdown
## Scope Boundary

**In scope (files changed):**
- `src/modules/auth/auth.service.ts` - MODIFY - Add token rotation
- `src/modules/auth/__tests__/auth.service.test.ts` - MODIFY - Test rotation

**Out of scope (not tested):**
- `src/modules/user/user.service.ts` - No changes, stable
- `src/common/guards/jwt-auth.guard.ts` - No changes

**Regression coverage (justified):**
- `src/modules/auth/__tests__/auth.resolver.test.ts` - Not changed
- Risk: Resolver calls refreshToken() which now has rotation logic;
  integration test must verify resolver still works with new behavior
```

**YAGNI violation examples to reject:**
```
- "should persist auth store to MMKV" → Tests MMKV, not your code
- "should inject UserService via DI" → Tests NestJS, not your code
- "should render Button component" → Tests unchanged UI component
```

**Correct test examples:**
```
- "should rotate refresh token on use" → Tests NEW behavior in changed file
- "should reject expired rotated token" → Tests edge case OF the change
- "should return 401 when rotation fails" → Tests error path OF the change
```

## When to Use

- Writing a feature spec or todo file
- Reviewing test coverage in `/todo-review-validator-tdd`
- Planning tests before `/eng` implementation
- Reviewing PRs for test scope discipline
- Any time someone says "add tests for X" — ask: is X actually changing?
