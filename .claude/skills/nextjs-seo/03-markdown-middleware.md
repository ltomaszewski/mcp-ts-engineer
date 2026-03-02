# Markdown Middleware for AI Bots

Thin middleware + fat API route architecture for serving clean Markdown to AI crawlers.

---

## Architecture Overview

```
Request → Middleware (Edge) → API Route (Node.js) → Markdown Response
              ↓                        ↓
        UA detection            Self-fetch + DOM parse
        URL rewrite             HTML → Markdown conversion
```

**Why this split:**
- Middleware runs on Edge Runtime — no access to `linkedom`, `@mozilla/readability`, or `turndown`
- API route runs on Node.js Runtime — full DOM manipulation available
- Thin middleware keeps per-request overhead minimal (~1ms UA check)

---

## Dependencies

```bash
npm install linkedom @mozilla/readability turndown
npm install -D @types/turndown
```

| Package | Size | Purpose |
|---------|------|---------|
| `linkedom` | ~50KB | Lightweight DOM implementation (vs jsdom at 2.5MB) |
| `@mozilla/readability` | ~30KB | Extract article content from HTML |
| `turndown` | ~20KB | Convert HTML to Markdown |

---

## Middleware (Edge-Compatible)

```typescript
// middleware.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { AI_BOT_PATTERNS } from '@/lib/seo/ai-bots';

const BYPASS_HEADER = 'X-Markdown-Bypass';

export function middleware(request: NextRequest): NextResponse | undefined {
  // Skip if this is already a bypass request (prevents infinite loop)
  if (request.headers.get(BYPASS_HEADER)) {
    return undefined;
  }

  const ua = request.headers.get('user-agent') ?? '';
  const accept = request.headers.get('accept') ?? '';

  const isAiBot = AI_BOT_PATTERNS.some((pattern) => pattern.test(ua));
  const wantsMarkdown = accept.includes('text/markdown');

  if (isAiBot || wantsMarkdown) {
    const url = request.nextUrl.clone();
    url.pathname = `/api/markdown${url.pathname}`;
    return NextResponse.rewrite(url);
  }

  return undefined;
}

export const config = {
  matcher: [
    // Match all paths except static files, API routes, and _next
    '/((?!api|_next/static|_next/image|favicon\\.ico|.*\\..*).*)',
  ],
};
```

### Matcher Configuration

The `matcher` excludes:
- `/api/*` — API routes (including the markdown API itself)
- `/_next/static/*` — Static assets
- `/_next/image/*` — Image optimization
- `/favicon.ico` — Favicon
- Files with extensions (`*.css`, `*.js`, `*.png`, etc.)

---

## API Route (Node.js Runtime)

```typescript
// app/api/markdown/[...path]/route.ts
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { parseHTML } from 'linkedom';
import { Readability } from '@mozilla/readability';
import TurndownService from 'turndown';

export const runtime = 'nodejs';

const BYPASS_HEADER = 'X-Markdown-Bypass';
const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
): Promise<NextResponse> {
  const { path } = await params;
  const targetPath = `/${path.join('/')}`;
  const targetUrl = `${siteUrl}${targetPath}`;

  try {
    // Self-fetch with bypass header to get rendered HTML
    const response = await fetch(targetUrl, {
      headers: { [BYPASS_HEADER]: '1' },
      next: { revalidate: 0 },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch: ${response.status}` },
        { status: response.status },
      );
    }

    const html = await response.text();

    // Parse HTML with linkedom
    const { document } = parseHTML(html);

    // Extract readable content
    const reader = new Readability(document);
    const article = reader.parse();

    if (!article) {
      return NextResponse.json(
        { error: 'Could not extract readable content' },
        { status: 422 },
      );
    }

    // Convert HTML to Markdown
    const turndown = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    const markdown = turndown.turndown(article.content);

    // Build response with title
    const output = article.title
      ? `# ${article.title}\n\n${markdown}`
      : markdown;

    return new NextResponse(output, {
      headers: {
        'Content-Type': 'text/markdown; charset=utf-8',
        'Vary': 'Accept, User-Agent',
        'Cache-Control': 'public, s-maxage=3600, stale-while-revalidate=1800',
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json(
      { error: `Markdown conversion failed: ${message}` },
      { status: 500 },
    );
  }
}
```

---

## Infinite Loop Prevention

The `X-Markdown-Bypass` header prevents the middleware from rewriting the self-fetch request back to the API route:

```
1. AI Bot requests /about
2. Middleware detects bot → rewrites to /api/markdown/about
3. API route self-fetches /about with X-Markdown-Bypass header
4. Middleware sees bypass header → passes through to normal page
5. Normal page renders HTML
6. API route converts HTML → Markdown
7. Markdown returned to AI bot
```

**Without the bypass header**, step 3 would trigger the middleware again, creating an infinite loop.

---

## Content Negotiation

Two detection methods, both triggering Markdown serving:

### 1. User-Agent Based

Matches against `AI_BOT_PATTERNS` from `@/lib/seo/ai-bots`. Catches known AI crawlers.

### 2. Accept Header Based (Cloudflare Convention)

```
Accept: text/markdown
```

When a client explicitly requests `text/markdown` via the `Accept` header, serve Markdown regardless of user-agent. This follows the [Cloudflare "Markdown for Agents" convention](https://blog.cloudflare.com/markdown-for-agents/).

This allows any client (not just known bots) to request Markdown content.

---

## Response Headers

| Header | Value | Purpose |
|--------|-------|---------|
| `Content-Type` | `text/markdown; charset=utf-8` | Correct MIME type for Markdown |
| `Vary` | `Accept, User-Agent` | Prevents CDN from serving Markdown to browsers (or vice versa) |
| `Cache-Control` | `public, s-maxage=3600, stale-while-revalidate=1800` | CDN cache: 1hr fresh, 30min stale |

### Why Vary is Critical

Without `Vary: Accept, User-Agent`, a CDN might cache the Markdown response and serve it to all subsequent requests (including browsers), or cache the HTML response and serve it to AI bots.

---

## Error Handling

| Scenario | Status | Response |
|----------|--------|----------|
| Target page returns non-200 | Same status | `{ error: "Failed to fetch: {status}" }` |
| Readability can't parse content | 422 | `{ error: "Could not extract readable content" }` |
| Conversion exception | 500 | `{ error: "Markdown conversion failed: {message}" }` |

All error responses are JSON (not Markdown) with appropriate HTTP status codes.

---

## Serverless Limitations

### Self-Fetch on Serverless

The self-fetch pattern (`fetch(siteUrl + path)`) works on all platforms but has nuances:

- **Vercel**: Self-fetch goes through the CDN, adding ~10-50ms latency
- **Self-hosted**: Requests loop back through the same server
- **Docker**: Use internal hostname if available for lower latency

### Cold Starts

The API route imports `linkedom`, `@mozilla/readability`, and `turndown`, which adds ~50-100ms to cold starts. This is acceptable because:
- AI crawlers are not latency-sensitive
- The route is cached at the CDN level (`s-maxage=3600`)
- Subsequent requests hit warm instances

---

## Testing

### Manual Testing with curl

```bash
# Test AI bot detection (via User-Agent)
curl -H "User-Agent: ClaudeBot/1.0" http://localhost:3000/about

# Test content negotiation (via Accept header)
curl -H "Accept: text/markdown" http://localhost:3000/about

# Verify bypass header works (should return HTML)
curl -H "X-Markdown-Bypass: 1" http://localhost:3000/about

# Verify normal request returns HTML
curl http://localhost:3000/about
```

---

## File Organization

```
src/
├── middleware.ts                        # Thin UA detection + rewrite
├── lib/seo/
│   └── ai-bots.ts                      # AI_BOT_USER_AGENTS + AI_BOT_PATTERNS
└── app/api/markdown/[...path]/
    └── route.ts                        # HTML→Markdown conversion
```

---

## References

- [Cloudflare Markdown for Agents](https://blog.cloudflare.com/markdown-for-agents/)
- [Next.js Middleware](https://nextjs.org/docs/app/building-your-application/routing/middleware)
- [linkedom](https://github.com/WebReflection/linkedom)
- [@mozilla/readability](https://github.com/mozilla/readability)
- [turndown](https://github.com/mixmark-io/turndown)
