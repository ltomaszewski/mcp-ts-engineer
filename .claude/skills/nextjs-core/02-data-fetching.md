# Next.js 15 App Router -- Data Fetching

Server-first data fetching with extended `fetch()`, caching, revalidation, Server Actions for mutations, and streaming with Suspense.

---

## Server Component Fetching

Server Components are async by default. Fetch data directly in the component body.

### Basic Fetch

```typescript
// app/posts/page.tsx -- Server Component
export default async function PostsPage() {
  const res = await fetch('https://api.example.com/posts');
  const posts: Post[] = await res.json();

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### BFF Pattern (This Project)

All data comes from the NestJS backend. Use the shared `apiFetch` wrapper:

```typescript
// lib/api-client.ts
const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...init?.headers },
    ...init,
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  return res.json() as Promise<T>;
}
```

```typescript
// app/users/page.tsx
import { apiFetch } from '@/lib/api-client';
import type { User } from '@/types/user';

export default async function UsersPage() {
  const users = await apiFetch<User[]>('/users');
  return <UserList users={users} />;
}
```

---

## Fetch Options

Next.js extends the Web `fetch()` API with caching and revalidation options.

### `cache` Option

| Value | Behavior |
|-------|----------|
| (default) | Auto: cached during build, fresh per request in dev |
| `'no-store'` | Always fetch fresh data on every request |
| `'force-cache'` | Use Data Cache; fetch from cache if available |

```typescript
// Always fresh
const data = await fetch('https://api.example.com/data', {
  cache: 'no-store',
});

// Cached aggressively
const data = await fetch('https://api.example.com/data', {
  cache: 'force-cache',
});
```

### `next.revalidate` -- Time-Based Revalidation

```typescript
// Revalidate at most every 60 seconds
const data = await fetch('https://api.example.com/posts', {
  next: { revalidate: 60 },
});

// Cache indefinitely (equivalent to revalidate: Infinity)
const data = await fetch('https://api.example.com/posts', {
  next: { revalidate: false },
});

// Never cache
const data = await fetch('https://api.example.com/posts', {
  next: { revalidate: 0 },
});
```

**Rules:**
- If a `fetch()` sets a lower `revalidate` than the route default, the entire route interval decreases
- If two fetches in the same route have different revalidate values, the lower value wins
- `{ revalidate: 3600, cache: 'no-store' }` is invalid -- both options are ignored

### `next.tags` -- Tag-Based Revalidation

```typescript
// Tag the request
const posts = await fetch('https://api.example.com/posts', {
  next: { tags: ['posts'] },
});

// Tag with specific identifiers
const post = await fetch(`https://api.example.com/posts/${id}`, {
  next: { tags: ['posts', `post-${id}`] },
});
```

Revalidate by tag in a Server Action:

```typescript
'use server';

import { revalidateTag } from 'next/cache';

export async function refreshPosts(): Promise<void> {
  revalidateTag('posts');
}
```

**Limits:** Max tag length is 256 characters. Max 128 tags per fetch.

---

## Request Deduplication

### Automatic Memoization

`fetch` calls with the same URL and options in a single render pass are automatically deduplicated:

```typescript
// app/layout.tsx
const user = await fetch('https://api.example.com/user'); // Request 1

// app/page.tsx (same render pass)
const user = await fetch('https://api.example.com/user'); // Deduped, no second request
```

### Manual Deduplication with `React.cache`

For non-fetch data sources (ORMs, databases), wrap with `React.cache`:

```typescript
// lib/data.ts
import { cache } from 'react';

export const getUser = cache(async (id: string) => {
  const res = await fetch(`https://api.example.com/users/${id}`);
  return res.json();
});
```

Both the layout and page can call `getUser('1')` -- only one request is made per render.

---

## Parallel Data Fetching

Avoid sequential requests by initiating fetches simultaneously:

**BAD -- Sequential (waterfall):**

```typescript
export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const artist = await getArtist(username);     // Blocks
  const albums = await getAlbums(username);     // Waits for artist

  return <div>{artist.name} - {albums.length} albums</div>;
}
```

**GOOD -- Parallel with Promise.all:**

```typescript
export default async function Page({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;

  const [artist, albums] = await Promise.all([
    getArtist(username),
    getAlbums(username),
  ]);

  return <div>{artist.name} - {albums.length} albums</div>;
}
```

Use `Promise.allSettled` if individual failures should not block the entire page.

---

## Client Component Data Fetching

### Streaming Promises with `use()`

Pass a promise from Server Component to Client Component:

```typescript
// app/posts/page.tsx (Server Component)
import { Suspense } from 'react';
import { PostList } from '@/features/posts/post-list';

export default function PostsPage() {
  const postsPromise = fetch('https://api.example.com/posts').then((r) =>
    r.json()
  );

  return (
    <Suspense fallback={<div>Loading posts...</div>}>
      <PostList postsPromise={postsPromise} />
    </Suspense>
  );
}
```

```typescript
// features/posts/post-list.tsx (Client Component)
'use client';

import { use } from 'react';

export function PostList({
  postsPromise,
}: {
  postsPromise: Promise<Post[]>;
}) {
  const posts = use(postsPromise);

  return (
    <ul>
      {posts.map((post) => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### TanStack Query (Recommended for Client Components)

```typescript
'use client';

import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';

export function UserSearch({ initialQuery }: { initialQuery: string }) {
  const [query, setQuery] = useState(initialQuery);

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', query],
    queryFn: () => apiFetch<User[]>(`/users?q=${query}`),
    staleTime: 60_000,
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <div>
      <input value={query} onChange={(e) => setQuery(e.target.value)} />
      <ul>
        {data?.map((user) => (
          <li key={user.id}>{user.name}</li>
        ))}
      </ul>
    </div>
  );
}
```

---

## Server Actions

Server Functions that run on the server, invoked from forms or event handlers.

### Creating Server Actions

**File-level directive (recommended for shared actions):**

```typescript
// app/actions.ts
'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { apiFetch } from '@/lib/api-client';

export async function createPost(formData: FormData): Promise<void> {
  const title = formData.get('title') as string;
  const content = formData.get('content') as string;

  await apiFetch('/posts', {
    method: 'POST',
    body: JSON.stringify({ title, content }),
  });

  revalidatePath('/posts');
  redirect('/posts');
}
```

**Inline in Server Components:**

```typescript
// app/page.tsx
export default function Page() {
  async function handleSubmit(formData: FormData) {
    'use server';
    // Server-side logic here
  }

  return <form action={handleSubmit}>...</form>;
}
```

### Using in Forms

```typescript
// components/create-post-form.tsx
import { createPost } from '@/app/actions';

export function CreatePostForm() {
  return (
    <form action={createPost}>
      <input type="text" name="title" placeholder="Post title" required />
      <textarea name="content" placeholder="Write your post..." required />
      <button type="submit">Create Post</button>
    </form>
  );
}
```

### Pending State with `useActionState`

```typescript
'use client';

import { useActionState } from 'react';
import { createPost } from '@/app/actions';

type FormState = { error?: string; success?: boolean };

export function CreatePostForm() {
  const [state, formAction, isPending] = useActionState<FormState, FormData>(
    async (prevState, formData) => {
      try {
        await createPost(formData);
        return { success: true };
      } catch (error) {
        return { error: 'Failed to create post' };
      }
    },
    {},
  );

  return (
    <form action={formAction}>
      <input type="text" name="title" required />
      <button type="submit" disabled={isPending}>
        {isPending ? 'Creating...' : 'Create Post'}
      </button>
      {state.error && <p className="text-red-500">{state.error}</p>}
      {state.success && <p className="text-green-500">Post created!</p>}
    </form>
  );
}
```

### Pending State with `useFormStatus`

```typescript
'use client';

import { useFormStatus } from 'react-dom';

export function SubmitButton() {
  const { pending } = useFormStatus();

  return (
    <button type="submit" disabled={pending}>
      {pending ? 'Submitting...' : 'Submit'}
    </button>
  );
}
```

`useFormStatus` must be used inside a component that is a child of the `<form>`.

### Event Handler Invocation

```typescript
'use client';

import { useState } from 'react';
import { incrementLike } from '@/app/actions';

export function LikeButton({ initialLikes }: { initialLikes: number }) {
  const [likes, setLikes] = useState(initialLikes);

  return (
    <button
      onClick={async () => {
        const updatedLikes = await incrementLike();
        setLikes(updatedLikes);
      }}
    >
      {likes} Likes
    </button>
  );
}
```

### After Mutations

| Goal | API | Example |
|------|-----|---------|
| Revalidate specific path | `revalidatePath()` | `revalidatePath('/posts')` |
| Revalidate by tag | `revalidateTag()` | `revalidateTag('posts')` |
| Redirect after action | `redirect()` | `redirect('/posts')` |
| Refresh current page | `refresh()` | `import { refresh } from 'next/cache'` |
| Read/set cookies | `cookies()` | `const store = await cookies()` |

**Important:** `redirect()` throws internally. Place `revalidatePath`/`revalidateTag` before `redirect()` calls.

---

## Streaming

Break pages into chunks and progressively send them from server to client.

### Page-Level Streaming with `loading.tsx`

```typescript
// app/dashboard/loading.tsx
export default function Loading() {
  return <DashboardSkeleton />;
}
```

Behind the scenes, this wraps `page.tsx` in a `<Suspense>` boundary.

### Component-Level Streaming with `<Suspense>`

```typescript
// app/dashboard/page.tsx
import { Suspense } from 'react';
import { RevenueChart } from '@/features/dashboard/revenue-chart';
import { RecentActivity } from '@/features/dashboard/recent-activity';

export default function DashboardPage() {
  return (
    <div>
      <h1>Dashboard</h1>

      {/* Sent immediately */}
      <div className="grid grid-cols-2 gap-4">
        <Suspense fallback={<ChartSkeleton />}>
          <RevenueChart />
        </Suspense>

        <Suspense fallback={<ActivitySkeleton />}>
          <RecentActivity />
        </Suspense>
      </div>
    </div>
  );
}
```

Each `<Suspense>` boundary streams independently. Fast data arrives first.

### Sequential Fetching with Streaming

When one component depends on another's data:

```typescript
// app/artist/[username]/page.tsx
import { Suspense } from 'react';

export default async function ArtistPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const artist = await getArtist(username);

  return (
    <>
      <h1>{artist.name}</h1>
      <Suspense fallback={<div>Loading playlists...</div>}>
        <Playlists artistId={artist.id} />
      </Suspense>
    </>
  );
}

async function Playlists({ artistId }: { artistId: string }) {
  const playlists = await getArtistPlaylists(artistId);

  return (
    <ul>
      {playlists.map((pl) => (
        <li key={pl.id}>{pl.name}</li>
      ))}
    </ul>
  );
}
```

The artist name renders immediately. Playlists stream in when ready.

---

## generateStaticParams

Pre-render dynamic routes at build time. Works with `[slug]`, `[...slug]`, and `[[...slug]]`.

```typescript
// app/blog/[slug]/page.tsx
export async function generateStaticParams(): Promise<{ slug: string }[]> {
  const posts = await fetch('https://api.example.com/posts').then((r) =>
    r.json()
  );

  return posts.map((post: { slug: string }) => ({
    slug: post.slug,
  }));
}
```

### Hierarchical Generation

Parent generates params, child can use them:

```typescript
// app/products/[category]/[product]/page.tsx
export async function generateStaticParams(): Promise<
  { category: string; product: string }[]
> {
  const products = await getProducts();

  return products.map((product) => ({
    category: product.category.slug,
    product: product.slug,
  }));
}
```

### Behavior

- Params NOT returned by `generateStaticParams` are rendered dynamically on first request
- Fetch calls inside `generateStaticParams` are automatically deduped across layouts, pages, and other `generateStaticParams`

---

## Preloading Data

Eagerly start a fetch before it is needed:

```typescript
// lib/data.ts
import { cache } from 'react';

export const getItem = cache(async (id: string) => {
  const res = await fetch(`https://api.example.com/items/${id}`);
  return res.json();
});

export const preloadItem = (id: string): void => {
  void getItem(id);
};
```

```typescript
// app/items/[id]/page.tsx
import { getItem, preloadItem } from '@/lib/data';

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  preloadItem(id); // Start fetching immediately
  const isAvailable = await checkAvailability(); // Other async work

  if (!isAvailable) return <div>Not available</div>;

  const item = await getItem(id); // Already fetched or in progress
  return <div>{item.name}</div>;
}
```

---

**Version:** 15.x | **Source:** https://nextjs.org/docs
