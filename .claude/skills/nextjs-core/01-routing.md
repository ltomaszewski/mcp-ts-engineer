# Next.js 15.5 App Router -- Routing

File-system based routing using the `app/` directory. Folders define route segments, special files define UI.

---

## File Conventions

Every route segment can use these special files:

| File | Purpose | Required `"use client"`? |
|------|---------|--------------------------|
| `page.tsx` | Unique UI for this route, makes route publicly accessible | No |
| `layout.tsx` | Shared UI wrapping children, persists across navigations | No |
| `loading.tsx` | Loading UI (wraps page in `<Suspense>`) | No |
| `error.tsx` | Error boundary for this segment | Yes |
| `not-found.tsx` | UI for `notFound()` calls within this segment | No |
| `template.tsx` | Like layout but re-mounts on every navigation | No |
| `default.tsx` | Fallback UI for parallel routes when no match | No |
| `route.tsx` | API Route Handler (GET, POST, etc.) | No |

### Rendering Order

Files compose into a nested structure:

```
layout.tsx
  template.tsx
    error.tsx (boundary)
      loading.tsx (suspense)
        page.tsx
```

---

## Page

The `page.tsx` file makes a route publicly accessible. It is the leaf UI for a route segment.

```typescript
// app/page.tsx -- Root page at /
export default function HomePage() {
  return <h1>Welcome</h1>;
}
```

### Props

| Prop | Type | Description |
|------|------|-------------|
| `params` | `Promise<{ [key: string]: string }>` | Dynamic route parameters |
| `searchParams` | `Promise<{ [key: string]: string \| string[] \| undefined }>` | URL query parameters |

```typescript
// app/posts/page.tsx
export default async function PostsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const { page } = await searchParams;
  const currentPage = Number(page) || 1;

  const res = await fetch(`https://api.example.com/posts?page=${currentPage}`);
  const posts = await res.json();

  return <PostList posts={posts} page={currentPage} />;
}
```

Using `searchParams` opts the page into dynamic rendering.

---

## Layout

Layouts wrap child segments. They persist across navigations and do not re-render.

### Root Layout (Required)

```typescript
// app/layout.tsx -- Must define <html> and <body>
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'My App',
  description: 'Built with Next.js 15',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
```

### Nested Layout

```typescript
// app/dashboard/layout.tsx
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <aside>Sidebar</aside>
      <main className="flex-1">{children}</main>
    </div>
  );
}
```

### Layout with Dynamic Params

```typescript
// app/dashboard/[team]/layout.tsx
export default async function TeamLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ team: string }>;
}) {
  const { team } = await params;

  return (
    <section>
      <header><h1>{team} Dashboard</h1></header>
      {children}
    </section>
  );
}
```

### Layout Caveats

- Layouts do NOT re-render on navigation
- Layouts cannot access `searchParams` (use `useSearchParams` in a Client Component child)
- Layouts cannot access `pathname` (use `usePathname` in a Client Component child)
- Layouts cannot pass data to `children` (fetch in both, requests are deduped)

---

## Loading

Creates an instant loading state using React Suspense. Shown while the page content loads.

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-1/3 mb-4" />
      <div className="h-4 bg-gray-200 rounded w-full mb-2" />
      <div className="h-4 bg-gray-200 rounded w-2/3" />
    </div>
  );
}
```

Behind the scenes, `loading.tsx` wraps `page.tsx` in a `<Suspense>` boundary.

---

## Error Boundary

Catches runtime errors in the segment and its children. Must be a Client Component.

```typescript
// app/dashboard/error.tsx
'use client';

import { useEffect } from 'react';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div>
      <h2>Something went wrong!</h2>
      <p>{error.message}</p>
      <button onClick={() => reset()}>Try again</button>
    </div>
  );
}
```

### Global Error

Handles errors in the root layout. Must define its own `<html>` and `<body>`.

```typescript
// app/global-error.tsx
'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body>
        <h2>Something went wrong!</h2>
        <button onClick={() => reset()}>Try again</button>
      </body>
    </html>
  );
}
```

### Error Props

| Prop | Type | Description |
|------|------|-------------|
| `error` | `Error & { digest?: string }` | The error object. `digest` is a hash for matching server logs |
| `reset` | `() => void` | Re-renders the error boundary contents |

**Production behavior:** Server Component errors send a generic message to the client (no sensitive data leaked). Use `error.digest` to match server-side logs.

---

## Not Found

Shown when `notFound()` is called within a route segment.

```typescript
// app/not-found.tsx
import Link from 'next/link';

export default function NotFound() {
  return (
    <div>
      <h2>Not Found</h2>
      <p>Could not find the requested resource.</p>
      <Link href="/">Return Home</Link>
    </div>
  );
}
```

Trigger from a Server Component:

```typescript
import { notFound } from 'next/navigation';

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);

  if (!post) notFound();

  return <article>{post.title}</article>;
}
```

---

## Dynamic Routes

### Conventions

| Pattern | Example | Matched URLs | `params` |
|---------|---------|-------------|----------|
| `[slug]` | `app/blog/[slug]/page.tsx` | `/blog/hello` | `{ slug: 'hello' }` |
| `[...slug]` | `app/shop/[...slug]/page.tsx` | `/shop/a/b/c` | `{ slug: ['a','b','c'] }` |
| `[[...slug]]` | `app/shop/[[...slug]]/page.tsx` | `/shop` or `/shop/a/b` | `{ slug: undefined }` or `{ slug: ['a','b'] }` |

### TypeScript Types

| Route | `params` Type |
|-------|---------------|
| `[slug]` | `{ slug: string }` |
| `[...slug]` | `{ slug: string[] }` |
| `[[...slug]]` | `{ slug?: string[] }` |
| `[categoryId]/[itemId]` | `{ categoryId: string, itemId: string }` |

### generateStaticParams

Pre-render dynamic routes at build time:

```typescript
// app/blog/[slug]/page.tsx
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = await fetch('https://api.example.com/posts').then((r) =>
    r.json()
  );
  return posts.map((post: { slug: string }) => ({ slug: post.slug }));
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = await getPost(slug);
  return <article><h1>{post.title}</h1></article>;
}
```

---

## Route Groups

Organize routes without affecting the URL path. Wrap folder name in parentheses: `(folderName)`.

### Use Cases

```
app/
  (marketing)/
    about/page.tsx       -> /about
    blog/page.tsx        -> /blog
  (dashboard)/
    settings/page.tsx    -> /settings
    analytics/page.tsx   -> /analytics
```

### Multiple Root Layouts

```
app/
  (marketing)/
    layout.tsx           -> Marketing root layout
    page.tsx             -> /
  (app)/
    layout.tsx           -> App root layout
    dashboard/page.tsx   -> /dashboard
```

**Caveat:** Navigating between routes that use different root layouts causes a full page reload.

---

## Parallel Routes

Render multiple pages simultaneously in the same layout using named slots (`@folder`).

```
app/
  layout.tsx
  @analytics/
    page.tsx
  @team/
    page.tsx
  page.tsx
```

```typescript
// app/layout.tsx
export default function Layout({
  children,
  analytics,
  team,
}: {
  children: React.ReactNode;
  analytics: React.ReactNode;
  team: React.ReactNode;
}) {
  return (
    <div>
      {children}
      <div className="grid grid-cols-2 gap-4">
        {analytics}
        {team}
      </div>
    </div>
  );
}
```

Parallel routes each load independently and can have their own `loading.tsx` and `error.tsx`.

### Default Fallback

When a parallel route has no matching segment, Next.js renders `default.tsx`:

```typescript
// app/@analytics/default.tsx
export default function Default() {
  return null; // or a fallback UI
}
```

---

## Intercepting Routes

Intercept a route to show it in the current layout while preserving the full page for direct navigation or refresh.

### Convention

| Pattern | Intercepts |
|---------|-----------|
| `(.)route` | Same level |
| `(..)route` | One level up |
| `(..)(..)route` | Two levels up |
| `(...)route` | From root |

Common use case -- modal pattern:

```
app/
  feed/
    page.tsx
    @modal/
      (.)photo/[id]/page.tsx    -> Intercepts /photo/[id] to show modal
      default.tsx
  photo/[id]/
    page.tsx                     -> Full page on direct navigation
```

---

## Linking and Navigation

### `<Link>` Component

```typescript
import Link from 'next/link';

export function Navigation() {
  return (
    <nav>
      <Link href="/">Home</Link>
      <Link href="/about">About</Link>
      <Link href={`/posts/${post.slug}`}>Read Post</Link>
      <Link href="/dashboard" prefetch={false}>Dashboard</Link>
    </nav>
  );
}
```

### `onNavigate` Prop (15.3+)

Event handler called during client-side (SPA) navigations only. Supports `preventDefault()` for navigation guards.

```typescript
'use client';

import Link from 'next/link';
import { useState } from 'react';

export function UnsavedFormLink({ href, children }: { href: string; children: React.ReactNode }) {
  const [isDirty, setIsDirty] = useState(false);

  return (
    <Link
      href={href}
      onNavigate={(e) => {
        if (isDirty && !window.confirm('Discard unsaved changes?')) {
          e.preventDefault();
        }
      }}
    >
      {children}
    </Link>
  );
}
```

**Note:** `onNavigate` does not fire for links with the `download` attribute. Use `onClick` for those.

### `useLinkStatus` Hook (15.3+)

Returns a `pending` boolean during navigation. Use for inline loading feedback on the clicked link.

```typescript
'use client';

import Link from 'next/link';
import { useLinkStatus } from 'next/link';

function NavItem({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href}>
      <NavItemContent>{children}</NavItemContent>
    </Link>
  );
}

function NavItemContent({ children }: { children: React.ReactNode }) {
  const { pending } = useLinkStatus();
  return <span className={pending ? 'opacity-50' : ''}>{children}</span>;
}
```

**Must be used inside a `<Link>` component's subtree.** Useful when prefetching is disabled, in progress, or the destination has no `loading.tsx`.

### `useRouter` Hook (Client Components)

```typescript
'use client';

import { useRouter } from 'next/navigation';

export function LoginButton() {
  const router = useRouter();

  function handleLogin() {
    // ... auth logic
    router.push('/dashboard');
    // router.replace('/dashboard'); -- no back history
    // router.refresh();             -- re-fetch server data
    // router.prefetch('/dashboard');
    // router.back();
  }

  return <button onClick={handleLogin}>Login</button>;
}
```

### Active Link Detection

```typescript
'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link href={href} className={isActive ? 'font-bold text-blue-600' : 'text-gray-600'}>
      {children}
    </Link>
  );
}
```

---

## Template

Like layout, but creates a new instance on every navigation (re-mounts, resets state).

```typescript
// app/dashboard/template.tsx
export default function Template({ children }: { children: React.ReactNode }) {
  return <div>{children}</div>;
}
```

Use `template.tsx` when you need:
- Enter/exit animations per route
- Features that rely on `useEffect` firing per navigation
- Resetting child Client Component state per navigation

---

## Metadata

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
    images: ['/og-about.png'],
  },
};

export default function AboutPage() {
  return <h1>About Us</h1>;
}
```

### Dynamic Metadata

```typescript
// app/posts/[slug]/page.tsx
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
  };
}
```

---

**Version:** 15.5.x | **Source:** https://nextjs.org/docs
