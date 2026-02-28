/**
 * Next.js BFF (Backend-for-Frontend) audit rules.
 * Extracted from audit-workflow.ts for file size compliance.
 */

export const NEXTJS_BFF_RULES = `
### Next.js (BFF Pattern)
| Pattern | Detection | Fix |
|---------|-----------|-----|
| API routes in BFF | app/api/ directory exists | Remove — backend owns endpoints |
| "use client" on pages | page.tsx with "use client" | Extract interactive parts to components |
| Direct DB access | import prisma/mongoose in Next.js | Fetch from backend API instead |
| Sync params access | params.id (not await) in page | Use async params (Next.js 15) |
`.trim()
