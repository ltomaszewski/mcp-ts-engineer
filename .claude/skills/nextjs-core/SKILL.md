---
name: nextjs-core
description: Next.js 15 App Router - Server/Client Components, routing, data fetching, Server Actions, middleware. Use when building Next.js pages, fetching data, or configuring routes.
---

# Next.js 15 App Router

> Server-first React framework with file-system routing, Server Components by default, and built-in data fetching with caching and revalidation.

**Stack:** Next.js 15 App Router + React 19

---

## When to Use

LOAD THIS SKILL when user is:
- Creating or modifying Next.js pages, layouts, or routes
- Fetching data in Server Components or Client Components
- Working with Server Actions for mutations
- Configuring next.config.ts, middleware, or environment variables
- Deciding between Server and Client Components
- Setting up dynamic routes, route groups, or parallel routes
- Optimizing images, fonts, or streaming with Suspense

---

## Critical Rules

**ALWAYS:**
1. Keep pages and layouts as Server Components -- add `"use client"` only to interactive leaf components
2. Await `params` and `searchParams` -- they are `Promise` in Next.js 15, not synchronous objects
3. Use `NEXT_PUBLIC_` prefix for browser-accessible env vars -- unprefixed vars are server-only
4. Fetch data in Server Components with `fetch()` -- Next.js extends it with caching/revalidation
5. Root layout must define `<html>` and `<body>` tags -- it is required and replaces `_document`
6. Use Metadata API for `<head>` elements -- never add `<title>` or `<meta>` tags manually in layouts
7. Mark error boundaries with `"use client"` -- React error boundaries must be Client Components

**NEVER:**
1. Create API routes (`app/api/`) in BFF architecture -- all endpoints belong in the NestJS backend (exception: auth catch-all at `app/api/auth/[...all]/route.ts`)
2. Use `useEffect` for data fetching -- use Server Components or TanStack Query instead
3. Add `"use client"` to page or layout files -- extract interactive parts into separate components
4. Pass non-serializable data from Server to Client Components -- only JSON-serializable props allowed
5. Access `searchParams` in layouts -- layouts do not re-render on navigation; use `useSearchParams` in a Client Component
6. Import server-only code in Client Components -- use `server-only` package to guard server modules

---

## Core Patterns

### Server Component (Data Fetching)

```typescript
// app/posts/page.tsx -- Server Component by default
import { PostList } from '@/features/posts/post-list';

export default async function PostsPage() {
  const res = await fetch('https://api.example.com/posts', {
    next: { revalidate: 60 },
  });
  const posts: Post[] = await res.json();

  return (
    <main>
      <h1>Posts</h1>
      <PostList posts={posts} />
    </main>
  );
}
```

### Client Component (Interactivity)

```typescript
// features/posts/like-button.tsx
'use client';

import { useState } from 'react';

export function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);

  return (
    <button onClick={() => setLikes((prev) => prev + 1)}>
      {likes} likes
    </button>
  );
}
```

### Server Action (Mutation)

```typescript
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

export async function createPost(formData: FormData): Promise<void> {
  const title = formData.get('title') as string;

  await fetch('https://api.example.com/posts', {
    method: 'POST',
    body: JSON.stringify({ title }),
    headers: { 'Content-Type': 'application/json' },
  });

  revalidatePath('/posts');
  redirect('/posts');
}
```

### Dynamic Route with Params

```typescript
// app/posts/[slug]/page.tsx
export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const res = await fetch(`https://api.example.com/posts/${slug}`);
  const post = await res.json();

  return <article><h1>{post.title}</h1><p>{post.content}</p></article>;
}
```

### Streaming with Suspense

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { SlowChart } from '@/features/dashboard/slow-chart';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>
      <Suspense fallback={<div>Loading chart...</div>}>
        <SlowChart />
      </Suspense>
    </div>
  );
}
```

---

## Anti-Patterns

**BAD** -- Marking entire page as Client Component:
```typescript
'use client'; // Moves everything to the client bundle
export default function Page() {
  const [data, setData] = useState(null);
  useEffect(() => { fetch('/api/data').then(...) }, []);
  return <div>{data}</div>;
}
```

**GOOD** -- Server Component page with Client interactive leaf:
```typescript
// app/page.tsx (Server Component)
import { InteractiveFilter } from '@/components/interactive-filter';

export default async function Page() {
  const data = await fetch('https://api.example.com/data').then((r) => r.json());
  return (
    <div>
      <h1>Data</h1>
      <InteractiveFilter initialData={data} />
    </div>
  );
}
```

**BAD** -- Accessing params synchronously in Next.js 15:
```typescript
export default function Page({ params }: { params: { id: string } }) {
  return <div>{params.id}</div>; // Deprecated: params is now a Promise
}
```

**GOOD** -- Awaiting params as Promise:
```typescript
export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <div>{id}</div>;
}
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Navigate | `<Link>` | `<Link href="/about">About</Link>` |
| Programmatic nav | `useRouter()` | `router.push('/dashboard')` |
| Read pathname | `usePathname()` | `const path = usePathname()` |
| Read search params | `useSearchParams()` | `const q = searchParams.get('q')` |
| Redirect (server) | `redirect()` | `redirect('/login')` |
| Revalidate path | `revalidatePath()` | `revalidatePath('/posts')` |
| Revalidate tag | `revalidateTag()` | `revalidateTag('posts')` |
| Not found | `notFound()` | `if (!post) notFound()` |
| Metadata | `export const metadata` | `{ title: 'Page Title' }` |
| Dynamic metadata | `generateMetadata()` | `async function generateMetadata({ params })` |
| Static generation | `generateStaticParams()` | `return posts.map(p => ({ slug: p.slug }))` |
| Image | `<Image>` | `<Image src="/photo.jpg" width={800} height={600} alt="" />` |
| Font | `next/font/google` | `const inter = Inter({ subsets: ['latin'] })` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| App Router file conventions, layouts, route groups, parallel routes | [01-routing.md](01-routing.md) |
| Server Component fetching, cache options, Server Actions, streaming | [02-data-fetching.md](02-data-fetching.md) |
| Server vs Client Components, composition, serialization, providers | [03-rendering.md](03-rendering.md) |
| next.config.ts, middleware, env vars, Image/Font, Turbopack | [04-configuration.md](04-configuration.md) |

---

**Version:** 15.x | **Source:** https://nextjs.org/docs
