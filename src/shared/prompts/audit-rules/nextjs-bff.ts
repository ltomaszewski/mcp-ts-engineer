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

**Async params (Next.js 15)** — BAD vs GOOD:
\`\`\`typescript
// BAD: Sync params access (breaks in Next.js 15)
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>
}

// GOOD: Async params with await
export default async function Page({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  return <div>{id}</div>
}
\`\`\`
`.trim()
