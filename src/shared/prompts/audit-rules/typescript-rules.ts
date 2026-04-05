/**
 * TypeScript-specific audit rules.
 * Extracted from audit-workflow.ts for file size compliance.
 */

export const TYPESCRIPT_RULES = `
### TypeScript

<reasoning_guidance>
Before flagging a violation, ask: "Would splitting/fixing this actually improve readability?"
- A 310-line file with cohesive logic may be better than 3 scattered 100-line files
- A 55-line function that reads top-to-bottom may be clearer than extracted helpers
- Use judgment on borderlines — flag only when the fix genuinely helps
</reasoning_guidance>

| Rule | Max | Severity | Fix | Skip If |
|------|-----|----------|-----|---------|
| File length | 300 lines | Medium | Split by responsibility | Cohesive single-concern file (e.g., long schema) |
| Function length | 50 lines | Medium | Extract helper functions | Linear pipeline that reads clearly as-is |
| Parameters | 4 | Low | Use options object pattern | Well-named primitives with defaults |
| Nesting depth | 3 levels | Medium | Early returns, guard clauses | Pattern match / switch with simple cases |
| any type | 0 | High | Use unknown + type guard, or specific type | External lib types without declarations |
| Non-null assertion (!) | 0 in new code | Low | Add null check or refactor control flow | Immediately after truthiness check |

### Forbidden
| Pattern | Detection | Severity | Fix |
|---------|-----------|----------|-----|
| StyleSheet | import.*StyleSheet | High | Use NativeWind className |
| Redux | from 'redux' | High | Use Zustand |
| AsyncStorage | from.*AsyncStorage | High | Use MMKV |
| God component | >150 lines JSX | Medium | Extract sub-components |
`.trim()
