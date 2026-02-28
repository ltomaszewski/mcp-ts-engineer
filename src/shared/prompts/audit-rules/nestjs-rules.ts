/**
 * NestJS-specific audit rules.
 * Extracted from audit-workflow.ts for file size compliance.
 */

export const NESTJS_RULES = `
### NestJS
| Rule | Fix |
|------|-----|
| Module encapsulation | Update exports |
| Missing @UseGuards | Add decorator |
| Missing validators | Add decorators |
`.trim()
