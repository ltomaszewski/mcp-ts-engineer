/**
 * TypeScript-specific audit rules.
 * Extracted from audit-workflow.ts for file size compliance.
 */

export const TYPESCRIPT_RULES = `
### TypeScript
| Rule | Max | Fix |
|------|-----|-----|
| File | 300 lines | Split |
| Function | 50 lines | Extract |
| Params | 4 | Options object |
| Nesting | 3 | Early returns |
| any | 0 | Type properly |

### Forbidden
| Pattern | Detection |
|---------|-----------|
| StyleSheet | import.*StyleSheet |
| Redux | from 'redux' |
| AsyncStorage | from.*AsyncStorage |
| God component | >150 lines |
`.trim()
