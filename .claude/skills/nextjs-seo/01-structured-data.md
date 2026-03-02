# Structured Data (JSON-LD)

Type-safe JSON-LD structured data for Next.js using `schema-dts` types and XSS-safe serialization.

---

## Dependencies

```bash
npm install schema-dts
```

`schema-dts` provides TypeScript types for all Schema.org types — no runtime cost, types only.

---

## XSS Mitigation (Critical)

JSON-LD is injected via `<script type="application/ld+json">`. If the data contains `</script>`, it breaks out of the tag — a classic XSS vector.

### The Fix

```typescript
// lib/seo/json-ld.tsx
function safeJsonLdStringify(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}
```

This replaces all `<` with the Unicode escape `\u003c`, which JSON parsers interpret identically but prevents HTML tag injection. This is the [official Next.js recommended approach](https://nextjs.org/docs/app/guides/json-ld).

### JsonLdScript Server Component

```typescript
// lib/seo/json-ld.tsx
import type { Thing, WithContext } from 'schema-dts';

function safeJsonLdStringify(data: object): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

interface JsonLdScriptProps {
  data: WithContext<Thing> | WithContext<Thing>[];
}

export function JsonLdScript({ data }: JsonLdScriptProps) {
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: safeJsonLdStringify(data) }}
    />
  );
}
```

---

## Common Schema Types

### WebSite (Homepage)

```typescript
import type { WebSite, WithContext } from 'schema-dts';

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function buildWebSiteSchema(): WithContext<WebSite> {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    name: 'My App',
    url: siteUrl,
    potentialAction: {
      '@type': 'SearchAction',
      target: { '@type': 'EntryPoint', urlTemplate: `${siteUrl}/search?q={search_term_string}` },
      'query-input': 'required name=search_term_string',
    },
  };
}
```

### Organization

```typescript
import type { Organization, WithContext } from 'schema-dts';

export function buildOrganizationSchema(): WithContext<Organization> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'My Company',
    url: siteUrl,
    logo: `${siteUrl}/logo.png`,
    sameAs: [
      'https://twitter.com/mycompany',
      'https://github.com/mycompany',
    ],
  };
}
```

### Article (Blog Post)

```typescript
import type { Article, WithContext } from 'schema-dts';

interface ArticleInput {
  title: string;
  description: string;
  slug: string;
  publishedAt: string;
  modifiedAt?: string;
  authorName: string;
  imageUrl?: string;
}

export function buildArticleSchema(input: ArticleInput): WithContext<Article> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Article',
    headline: input.title,
    description: input.description,
    url: `${siteUrl}/blog/${input.slug}`,
    datePublished: input.publishedAt,
    ...(input.modifiedAt && { dateModified: input.modifiedAt }),
    author: { '@type': 'Person', name: input.authorName },
    ...(input.imageUrl && { image: input.imageUrl }),
  };
}
```

### BreadcrumbList

```typescript
import type { BreadcrumbList, WithContext } from 'schema-dts';

interface Breadcrumb {
  name: string;
  href: string;
}

export function buildBreadcrumbSchema(items: Breadcrumb[]): WithContext<BreadcrumbList> {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: `${siteUrl}${item.href}`,
    })),
  };
}
```

### Product

```typescript
import type { Product, WithContext } from 'schema-dts';

interface ProductInput {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  currency: string;
  availability: 'InStock' | 'OutOfStock' | 'PreOrder';
}

export function buildProductSchema(input: ProductInput): WithContext<Product> {
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: input.name,
    description: input.description,
    image: input.imageUrl,
    offers: {
      '@type': 'Offer',
      price: input.price,
      priceCurrency: input.currency,
      availability: `https://schema.org/${input.availability}`,
    },
  };
}
```

---

## Usage in Pages

### In Layout (Site-Wide)

```typescript
// app/layout.tsx
import { JsonLdScript } from '@/lib/seo/json-ld';
import { buildWebSiteSchema, buildOrganizationSchema } from '@/lib/seo/schemas';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <JsonLdScript data={buildWebSiteSchema()} />
        <JsonLdScript data={buildOrganizationSchema()} />
        {children}
      </body>
    </html>
  );
}
```

### In Dynamic Pages

```typescript
// app/blog/[slug]/page.tsx
import { JsonLdScript } from '@/lib/seo/json-ld';
import { buildArticleSchema, buildBreadcrumbSchema } from '@/lib/seo/schemas';

export default async function BlogPost({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const post = await getPost(slug);

  return (
    <article>
      <JsonLdScript data={buildArticleSchema({
        title: post.title,
        description: post.excerpt,
        slug: post.slug,
        publishedAt: post.publishedAt,
        authorName: post.author.name,
      })} />
      <JsonLdScript data={buildBreadcrumbSchema([
        { name: 'Home', href: '/' },
        { name: 'Blog', href: '/blog' },
        { name: post.title, href: `/blog/${post.slug}` },
      ])} />
      <h1>{post.title}</h1>
      <div>{post.content}</div>
    </article>
  );
}
```

---

## Next.js Metadata API

### Static Metadata

```typescript
// app/about/page.tsx
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'About Us',
  description: 'Learn about our company',
  openGraph: {
    title: 'About Us',
    description: 'Learn about our company',
    images: [{ url: '/og-about.png', width: 1200, height: 630 }],
  },
};
```

### Dynamic Metadata

```typescript
// app/blog/[slug]/page.tsx
import type { Metadata } from 'next';

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = await getPost(slug);

  return {
    title: post.title,
    description: post.excerpt,
    openGraph: {
      title: post.title,
      description: post.excerpt,
      type: 'article',
      publishedTime: post.publishedAt,
      images: post.imageUrl ? [{ url: post.imageUrl }] : [],
    },
    twitter: {
      card: 'summary_large_image',
      title: post.title,
      description: post.excerpt,
    },
  };
}
```

---

## File Organization

```
src/lib/seo/
├── json-ld.tsx          # JsonLdScript component + safeJsonLdStringify
├── schemas.ts           # Schema builder functions (WebSite, Organization, etc.)
├── metadata.ts          # Shared metadata helpers (buildSiteMetadata)
└── ai-bots.ts           # AI bot patterns (shared with middleware)
```

---

## References

- [Next.js JSON-LD Guide](https://nextjs.org/docs/app/guides/json-ld)
- [Next.js Metadata API](https://nextjs.org/docs/app/api-reference/functions/generate-metadata)
- [schema-dts](https://github.com/google/schema-dts)
- [JSON-LD XSS Issue #79593](https://github.com/vercel/next.js/issues/79593)
- [Schema.org Types](https://schema.org/docs/full.html)
