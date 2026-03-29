# AI Discovery Infrastructure

Robots.txt, sitemap, llms.txt, and OG/Twitter metadata for AI crawler discovery.

---

## AI Crawler Allowlist

Single source of truth for all AI bot user-agent patterns, imported by both `robots.ts` and middleware.

```typescript
// lib/seo/ai-bots.ts

/** User-agent strings for robots.txt Allow rules */
export const AI_BOT_USER_AGENTS = [
  // OpenAI
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  // Anthropic
  'ClaudeBot',
  'Claude-Web',
  'anthropic-ai',
  // Google
  'Google-Extended',
  'Gemini-Deep-Research',
  'GoogleAgent-Mariner',
  'Google-CloudVertexBot',
  // Perplexity
  'PerplexityBot',
  'Perplexity-User',
  // Meta
  'Meta-ExternalAgent',
  // Apple
  'Applebot-Extended',
  // ByteDance
  'Bytespider',
  // xAI
  'xAI-Bot',
  // Deepseek
  'DeepseekBot',
  // Cohere
  'Cohere-AI',
  // Mistral
  'MistralAI-User',
  // Amazon
  'Amazonbot',
  // DuckDuckGo
  'DuckAssistBot',
  // Common Crawl
  'CCBot',
  // Diffbot
  'Diffbot',
] as const;

/** Regex patterns for middleware UA detection */
export const AI_BOT_PATTERNS: RegExp[] = AI_BOT_USER_AGENTS.map(
  (ua) => new RegExp(ua, 'i'),
);
```

---

## robots.ts

```typescript
// app/robots.ts
import type { MetadataRoute } from 'next';
import { AI_BOT_USER_AGENTS } from '@/lib/seo/ai-bots';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      // Default: allow all
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/api/', '/admin/'],
      },
      // AI bots: explicitly allow public content
      ...AI_BOT_USER_AGENTS.map((ua) => ({
        userAgent: ua,
        allow: '/',
        disallow: ['/api/', '/admin/', '/dashboard/'],
      })),
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
  };
}
```

---

## sitemap.ts

### Static Sitemap

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${siteUrl}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.9 },
  ];
}
```

### Dynamic Sitemap (with backend data)

```typescript
// app/sitemap.ts
import type { MetadataRoute } from 'next';
import { apiFetch } from '@/lib/api-client';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

interface BlogPost {
  slug: string;
  updatedAt: string;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: siteUrl, lastModified: new Date(), changeFrequency: 'daily', priority: 1.0 },
    { url: `${siteUrl}/about`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
  ];

  // Fetch dynamic routes from backend
  const posts = await apiFetch<BlogPost[]>('/posts', {
    next: { revalidate: 3600 },
  });

  const postRoutes: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${siteUrl}/blog/${post.slug}`,
    lastModified: new Date(post.updatedAt),
    changeFrequency: 'weekly' as const,
    priority: 0.7,
  }));

  return [...staticRoutes, ...postRoutes];
}
```

---

## llms.txt

The [llms.txt standard](https://llmstxt.org/) provides a Markdown file at `/llms.txt` that helps LLMs understand a website's structure.

### Format

```markdown
# Site Name

> Brief description of the site and its purpose.

## Docs

- [Getting Started](/docs/getting-started): How to set up and use the product
- [API Reference](/docs/api): Complete API documentation

## Blog

- [Latest Post](/blog/latest): Description of the latest blog post
```

**Required:** `# Title` (H1 heading)
**Optional:** `> Summary` blockquote, `## Section` headings with `- [Link](url): description` entries

### Implementation (Route Handler)

```typescript
// app/llms.txt/route.ts
import { NextResponse } from 'next/server';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function GET(): NextResponse {
  const content = `# My App

> A brief description of what My App does and who it's for.

## Documentation

- [Getting Started](${siteUrl}/docs/getting-started): Setup guide and quickstart
- [API Reference](${siteUrl}/docs/api): Complete API documentation
- [FAQ](${siteUrl}/docs/faq): Frequently asked questions

## Product

- [Features](${siteUrl}/features): Product features and capabilities
- [Pricing](${siteUrl}/pricing): Plans and pricing information
- [Changelog](${siteUrl}/changelog): Recent updates and releases
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  });
}
```

### Dynamic llms.txt (with backend data)

```typescript
// app/llms.txt/route.ts
import { NextResponse } from 'next/server';
import { apiFetch } from '@/lib/api-client';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

interface Page { title: string; slug: string; description: string }

export async function GET(): Promise<NextResponse> {
  const pages = await apiFetch<Page[]>('/pages/public', {
    next: { revalidate: 3600 },
  });

  const sections = pages
    .map((p) => `- [${p.title}](${siteUrl}/${p.slug}): ${p.description}`)
    .join('\n');

  const content = `# My App

> Brief site description.

## Pages

${sections}
`;

  return new NextResponse(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, s-maxage=86400, stale-while-revalidate=43200',
    },
  });
}
```

---

## OG / Twitter Metadata

### Site-Wide Defaults (Root Layout)

```typescript
// app/layout.tsx
import type { Metadata } from 'next';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: 'My App', template: '%s | My App' },
  description: 'App description for search engines',
  openGraph: {
    type: 'website',
    locale: 'en_US',
    siteName: 'My App',
    images: [{ url: '/og-default.png', width: 1200, height: 630, alt: 'My App' }],
  },
  twitter: {
    card: 'summary_large_image',
    creator: '@mycompany',
  },
};
```

### Page-Specific Override

```typescript
// app/pricing/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Pricing',
  description: 'Simple, transparent pricing for every team size',
  openGraph: {
    title: 'Pricing — My App',
    description: 'Simple, transparent pricing for every team size',
    images: [{ url: '/og-pricing.png', width: 1200, height: 630 }],
  },
};
```

---

## Environment Setup

Add to `.env.example`:

```bash
# Required for SEO — absolute URL used in sitemap, robots, OG tags, JSON-LD
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Production: set to `https://myapp.com` (no trailing slash).

---

## BFF Rule Exception

SEO routes are **documented exceptions** to the "no API routes in Next.js" BFF rule:

| Route | Purpose | Why Exception |
|-------|---------|---------------|
| `app/api/auth/[...all]/route.ts` | Auth catch-all | Better Auth requirement |
| `app/llms.txt/route.ts` | LLM discovery | Static content, no backend needed |
| `app/api/markdown/[...path]/route.ts` | AI content serving | Self-fetch + DOM conversion |

---

## References

- [llms.txt Specification](https://llmstxt.org/)
- [Next.js robots.ts](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/robots)
- [Next.js sitemap.ts](https://nextjs.org/docs/app/api-reference/file-conventions/metadata/sitemap)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [AI Crawler User-Agents](https://www.searchenginejournal.com/ai-crawler-user-agents-list/558130/)

---

**Source**: https://nextjs.org/docs/app/api-reference/file-conventions/metadata
**Version**: Next.js 15.5.x
