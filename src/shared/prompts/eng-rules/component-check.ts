/**
 * Curated component duplication check rules.
 * Extracted from /eng Section 2: Component Duplication Check.
 *
 * Originally from: src/capabilities/todo-code-writer/prompts/eng-rules/component-check.ts
 */

export const COMPONENT_CHECK_RULES = `## Component Duplication Check

### MANDATORY Before Creating ANY New UI Component
1. **Search existing components** in shared/components/ui/ and features/*/components/
2. **Check for similar functionality** — grep for similar component names and base elements
3. **Apply variant-first pattern** — same base behavior + different styling = add variant, NOT new component
4. **Prevent duplication** — always verify what exists before creating new components

### Decision Flow
- Need dark-themed Input → Add variant="dark" to existing Input
- Need larger Button → Add size="lg" to existing Button
- Need error state → Add state="error" to existing component
- Completely different behavior → Create new component (document why)

### If Creating New Component
1. Document why variant was not possible
2. Place correctly: Used by 1-2 features → features/<feature>/components/; Used by 3+ → shared/components/ui/
3. Create tests for the new component

### NEVER
- Create a new component when a variant of an existing one suffices
- Create CustomTextInput, DarkInput, etc. when Input already exists
- Skip the search step — always verify what exists first`
