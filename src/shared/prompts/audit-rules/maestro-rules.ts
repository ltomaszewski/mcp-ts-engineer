/**
 * Maestro E2E test audit rules.
 * Extracted from audit-workflow.ts for file size compliance.
 */

export const MAESTRO_RULES = `
### Maestro
| Rule | Max |
|------|-----|
| File size | 60 lines |
| Sleeps | 3 per file |
| Optional assertions | 20% |
`.trim()
