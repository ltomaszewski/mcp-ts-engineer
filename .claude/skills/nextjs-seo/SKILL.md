---
name: nextjs-seo
description: "Next.js SEO and AI readability - JSON-LD, robots.txt, sitemap.ts, llms.txt, Markdown middleware for AI bots"
when_to_use: "implementing SEO, adding JSON-LD, configuring robots/sitemap, adding llms.txt, or serving markdown to AI bots"
---

# Next.js SEO & AI Readability

> Three-layer SEO infrastructure for Next.js apps: discovery (robots/sitemap/llms.txt), metadata (JSON-LD/OG tags), and content serving (Markdown middleware for AI crawlers).

**Stack:** Next.js 15.5 App Router + schema-dts + linkedom + turndown

---

## When to Use

**LOAD THIS SKILL** when user is:
- Adding JSON-LD structured data to pages
- Configuring `robots.ts` with AI crawler rules
- Setting up `sitemap.ts` for dynamic generation
- Adding `llms.txt` following the llmstxt.org standard
- Building Markdown middleware for AI bot content serving
- Implementing OG/Twitter card metadata via `generateMetadata`
- Working on any SEO or AI readability feature

---

## Critical Rules

**ALWAYS:**
1. Use `safeJsonLdStringify()` for JSON-LD — raw `JSON.stringify` in `<script>` tags is an XSS vector
2. Keep middleware thin (Edge-compatible by default) — heavy DOM parsing belongs in API routes (Node.js runtime)
3. Use `NEXT_PUBLIC_SITE_URL` env var for all absolute URLs — never hardcode domains
4. Include `Vary: Accept, User-Agent` header on Markdown responses — prevents cache poisoning
5. Import `AI_BOT_PATTERNS` from single source (`ai-bots.ts`) — used by both robots.ts and middleware
6. Use `safeJsonLdStringify` with `replace(/</g, '\\u003c')` — this is the Next.js recommended approach per the official JSON-LD guide

**NEVER:**
1. Use `JSON.stringify()` directly in `<script type="application/ld+json">` — allows `</script>` XSS breakout
2. Import `linkedom`, `@mozilla/readability`, or `turndown` in Edge middleware — they are not Edge-compatible (with Node.js middleware runtime in 15.5 this is technically possible but still not recommended for performance)
3. Serve Markdown without `X-Markdown-Bypass` header check — causes infinite self-fetch loops
4. Hardcode site URLs in metadata or sitemaps — breaks across environments

---

## Core Patterns

### Safe JSON-LD Serialization

```typescript
// lib/seo/json-ld.tsx — XSS-safe JSON-LD component
function safeJsonLdStringify(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

export function JsonLdScript({ data }: { data: object }) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(data) }}
    />
  );
}
```

### Metadata with generateMetadata

```typescript
// app/layout.tsx — site-wide metadata
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'My App', template: '%s | My App' },
  description: 'App description',
  openGraph: { type: 'website', siteName: 'My App' },
  twitter: { card: 'summary_large_image' },
};
```

### AI Bot Detection (Middleware)

```typescript
// middleware.ts — thin UA check + URL rewrite
import { AI_BOT_PATTERNS } from '@/lib/seo/ai-bots';

export function middleware(request: NextRequest) {
  const ua = request.headers.get('user-agent') ?? '';
  const accept = request.headers.get('accept') ?? '';
  const isAiBot = AI_BOT_PATTERNS.some((p) => p.test(ua));
  const wantsMarkdown = accept.includes('text/markdown');

  if (isAiBot || wantsMarkdown) {
    const url = request.nextUrl.clone();
    url.pathname = `/api/markdown${url.pathname}`;
    return NextResponse.rewrite(url);
  }
}
```

---

## Anti-Patterns

**BAD** — Raw JSON.stringify in script tag (XSS vulnerable):
```typescript
<script type="application/ld+json">
  {JSON.stringify(data)}
</script>
```

**GOOD** — Escaped serialization via component:
```typescript
<JsonLdScript data={data} />
```

**BAD** — Heavy imports in middleware:
```typescript
// middleware.ts
import { parseHTML } from 'linkedom'; // Not Edge-compatible!
```

**GOOD** — Thin middleware, heavy API route:
```typescript
// middleware.ts — only UA detection + rewrite
// api/markdown/[...path]/route.ts — linkedom + readability + turndown
```

---

## Quick Reference

| Task | File | Pattern |
|------|------|---------|
| JSON-LD on page | `layout.tsx` / `page.tsx` | `<JsonLdScript data={...} />` |
| Site metadata | `app/layout.tsx` | `export const metadata: Metadata` |
| Page metadata | `app/[page]/page.tsx` | `export async function generateMetadata()` |
| Robots config | `app/robots.ts` | `export default function robots(): MetadataRoute.Robots` |
| Sitemap | `app/sitemap.ts` | `export default function sitemap(): MetadataRoute.Sitemap` |
| LLMs discovery | `app/llms.txt/route.ts` | `GET` handler returning `text/plain` |
| Bot detection | `middleware.ts` | `AI_BOT_PATTERNS.some(p => p.test(ua))` |
| HTML to Markdown | `api/markdown/[...path]` | `linkedom` + `readability` + `turndown` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| JSON-LD types, schema-dts, XSS mitigation, JsonLdScript component | [01-structured-data.md](01-structured-data.md) |
| robots.ts, sitemap.ts, llms.txt, AI crawler allowlist, OG/Twitter metadata | [02-ai-discovery.md](02-ai-discovery.md) |
| Middleware architecture, bot detection, HTML-to-Markdown conversion | [03-markdown-middleware.md](03-markdown-middleware.md) |

---

**Version:** Next.js 15.5.x | **Sources:** [Next.js Metadata](https://nextjs.org/docs/app/api-reference/file-conventions/metadata), [Next.js JSON-LD Guide](https://nextjs.org/docs/app/guides/json-ld), [llmstxt.org](https://llmstxt.org/), [Cloudflare Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/)
