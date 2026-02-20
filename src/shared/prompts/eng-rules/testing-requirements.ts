/**
 * Curated testing requirements rules.
 * Extracted from /eng Section 5: Testing Requirements.
 *
 * Originally from: src/capabilities/todo-code-writer/prompts/eng-rules/testing-requirements.ts
 */

export const TESTING_REQUIREMENTS_RULES = `## Testing Requirements

### Test Coverage Priority
1. **Business Logic First** — Core functions, calculations, transformations
2. **Edge Cases** — Boundary conditions, error scenarios, empty/null inputs
3. **Integration Points** — API calls, database operations, external services
4. **Happy Path** — Standard successful operations

### TDD Workflow (MANDATORY for new features)
1. RED — Write failing test first
2. GREEN — Write minimal code to pass
3. REFACTOR — Improve while tests stay green
4. VERIFY — Check coverage >= 80%

### Test-Only Exports Audit
Run AFTER implementation, BEFORE marking task complete:
- Each export MUST have at least one production consumer (not just tests)
- Test-only exports MUST NOT be added to barrel/index.ts files
- Intentional test-only exports MUST have @internal JSDoc comment
- Run knip production exports check: npx knip --production --include exports

### ALWAYS Rules
- Write tests FIRST, then implement (TDD)
- Test business logic and edge cases, not implementation details
- Remove exports that exist purely for testing internals (test through public API)
- Document intentional test-only exports with @internal JSDoc

### NEVER Rules
- Skip testing for "small changes" (small exports still add surface area)
- Export internal helpers just to test them
- Leave undocumented test-only exports in barrel files`;
