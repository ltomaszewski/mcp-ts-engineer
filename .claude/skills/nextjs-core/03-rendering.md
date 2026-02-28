# Next.js 15 App Router -- Rendering

Server Components render on the server by default. Client Components opt-in with `"use client"`. Understanding the boundary between them is critical for performance and correctness.

---

## Server Components (Default)

All components in the `app/` directory are Server Components unless marked with `"use client"`.

### Capabilities

- Fetch data with `async`/`await` directly in the component
- Access backend resources (databases, file system, secrets)
- Keep sensitive data (API keys, tokens) on the server
- Reduce client JavaScript bundle size
- Stream content progressively to the client

### Restrictions

- Cannot use React state (`useState`, `useReducer`)
- Cannot use lifecycle effects (`useEffect`, `useLayoutEffect`)
- Cannot use browser APIs (`window`, `document`, `localStorage`)
- Cannot use event handlers (`onClick`, `onChange`)
- Cannot use custom hooks that depend on state or effects
- Cannot use React Context (`useContext`)

### Example

```typescript
// app/users/page.tsx -- Server Component (no directive needed)
import { apiFetch } from '@/lib/api-client';
import type { User } from '@/types/user';
import { UserCard } from '@/features/users/user-card';

export default async function UsersPage() {
  const users = await apiFetch<User[]>('/users');

  return (
    <section>
      <h1>Users</h1>
      <div className="grid grid-cols-3 gap-4">
        {users.map((user) => (
          <UserCard key={user.id} user={user} />
        ))}
      </div>
    </section>
  );
}
```

---

## Client Components

Add `"use client"` at the top of a file (above all imports) to make it a Client Component.

### Capabilities

- Use React state and effects
- Use event handlers
- Access browser APIs
- Use React Context
- Use custom hooks

### When to Use Client Components

| Need | Use Client Component? |
|------|----------------------|
| `useState`, `useReducer` | Yes |
| `useEffect`, `useLayoutEffect` | Yes |
| Event handlers (`onClick`, `onChange`) | Yes |
| Browser APIs (`window`, `localStorage`) | Yes |
| Custom hooks with state/effects | Yes |
| TanStack Query hooks | Yes |
| Zustand stores | Yes |
| Static display of server-fetched data | No -- use Server Component |
| Layout/page shells | No -- use Server Component |
| Data fetching | No -- use Server Component or Server Action |

### Example

```typescript
// features/users/user-search.tsx
'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiFetch } from '@/lib/api-client';
import type { User } from '@/types/user';

export function UserSearch() {
  const [query, setQuery] = useState('');

  const { data: users, isLoading } = useQuery({
    queryKey: ['users', query],
    queryFn: () => apiFetch<User[]>(`/users?q=${encodeURIComponent(query)}`),
    enabled: query.length > 0,
    staleTime: 30_000,
  });

  return (
    <div>
      <input
        type="search"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search users..."
      />
      {isLoading && <p>Loading...</p>}
      {users?.map((user) => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

---

## The `"use client"` Boundary

`"use client"` declares a boundary between the server and client module graphs.

### Key Rules

1. Once a file has `"use client"`, **all its imports are part of the client bundle** -- including child components
2. You do NOT need `"use client"` on every client component -- only the entry point of the client subtree
3. Server Components can import Client Components, but Client Components cannot import Server Components directly

### Module Graph

```
Server Module Graph          Client Module Graph
  layout.tsx                   search.tsx ('use client')
  page.tsx                       -> useSearchParams
  header.tsx                     -> useState
    -> imports search.tsx -----> search.tsx becomes client entry
```

### Minimizing Client Bundle

**BAD -- Large client boundary:**

```typescript
'use client'; // Everything below is now client-side

import { LargeDataTable } from './data-table';
import { StaticFooter } from './footer';
import { InteractiveFilter } from './filter';

export function Dashboard() {
  return (
    <div>
      <InteractiveFilter />
      <LargeDataTable />  {/* Does not need client JS */}
      <StaticFooter />     {/* Does not need client JS */}
    </div>
  );
}
```

**GOOD -- Narrow client boundary:**

```typescript
// app/dashboard/page.tsx (Server Component)
import { InteractiveFilter } from '@/components/interactive-filter'; // 'use client'
import { LargeDataTable } from '@/components/data-table';           // Server
import { StaticFooter } from '@/components/footer';                 // Server

export default async function DashboardPage() {
  const data = await apiFetch('/dashboard');

  return (
    <div>
      <InteractiveFilter />
      <LargeDataTable data={data} />
      <StaticFooter />
    </div>
  );
}
```

Only `InteractiveFilter` ships JavaScript to the client.

---

## Composition Patterns

### Passing Server Components as Children

Client Components can receive Server Components through `children` or other React node props:

```typescript
// components/modal.tsx (Client Component)
'use client';

import { useState } from 'react';

export function Modal({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button onClick={() => setIsOpen(true)}>Open</button>
      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center">
          <div className="bg-white p-6 rounded-lg">
            {children}
            <button onClick={() => setIsOpen(false)}>Close</button>
          </div>
        </div>
      )}
    </>
  );
}
```

```typescript
// app/page.tsx (Server Component)
import { Modal } from '@/components/modal';
import { ServerContent } from '@/components/server-content'; // Server Component

export default function Page() {
  return (
    <Modal>
      <ServerContent /> {/* Rendered on the server, passed as children */}
    </Modal>
  );
}
```

The Server Component renders on the server first. The Client Component receives the pre-rendered result.

### Passing Server Data to Client Components

Props from Server to Client must be serializable (JSON-compatible):

```typescript
// app/posts/[id]/page.tsx (Server Component)
import { LikeButton } from '@/components/like-button';
import { apiFetch } from '@/lib/api-client';

export default async function PostPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const post = await apiFetch<Post>(`/posts/${id}`);

  return (
    <article>
      <h1>{post.title}</h1>
      <p>{post.content}</p>
      <LikeButton postId={post.id} initialLikes={post.likes} />
    </article>
  );
}
```

### Serialization Rules

Props passed from Server to Client Components must be serializable by React:

| Allowed | Not Allowed |
|---------|-------------|
| `string`, `number`, `boolean`, `null` | Functions (except Server Actions) |
| `Date` | Class instances |
| Plain objects and arrays | `Map`, `Set`, `WeakMap`, `WeakSet` |
| `FormData` | DOM nodes |
| Server Actions (async functions with `'use server'`) | Symbols |
| Promises (streamable via `use()`) | Non-serializable objects |

---

## Context Providers

React Context is not available in Server Components. Create Client Component providers:

```typescript
// providers/theme-provider.tsx
'use client';

import { createContext, useContext, useState } from 'react';

type Theme = 'light' | 'dark';

const ThemeContext = createContext<{
  theme: Theme;
  setTheme: (theme: Theme) => void;
} | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');

  return (
    <ThemeContext.Provider value={{ theme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) throw new Error('useTheme must be used within ThemeProvider');
  return context;
}
```

```typescript
// app/layout.tsx (Server Component)
import { ThemeProvider } from '@/providers/theme-provider';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
```

**Best practice:** Render providers as deep as possible in the tree. `ThemeProvider` wraps `{children}`, not the entire `<html>`.

### Sharing Data with Context and React.cache

For data shared between Server and Client Components:

```typescript
// lib/user.ts
import { cache } from 'react';

export const getUser = cache(async () => {
  const res = await fetch('https://api.example.com/user');
  return res.json() as Promise<User>;
});
```

```typescript
// providers/user-provider.tsx
'use client';

import { createContext, useContext } from 'react';
import { use } from 'react';

type User = { id: string; name: string };

const UserContext = createContext<Promise<User> | null>(null);

export function UserProvider({
  children,
  userPromise,
}: {
  children: React.ReactNode;
  userPromise: Promise<User>;
}) {
  return <UserContext.Provider value={userPromise}>{children}</UserContext.Provider>;
}

export function useUser(): User {
  const promise = useContext(UserContext);
  if (!promise) throw new Error('useUser must be used within UserProvider');
  return use(promise);
}
```

```typescript
// app/layout.tsx
import { UserProvider } from '@/providers/user-provider';
import { getUser } from '@/lib/user';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const userPromise = getUser(); // Don't await -- stream to client

  return (
    <html lang="en">
      <body>
        <UserProvider userPromise={userPromise}>{children}</UserProvider>
      </body>
    </html>
  );
}
```

Server Components call `getUser()` directly (with `await`). Client Components resolve via `use()` with a Suspense boundary.

---

## Third-Party Components

Third-party components that use client APIs but lack `"use client"` need a wrapper:

```typescript
// components/carousel.tsx
'use client';

import { Carousel } from 'acme-carousel';

export default Carousel;
```

Now import `./carousel` in Server Components instead of `acme-carousel` directly.

---

## Preventing Environment Poisoning

### `server-only` Package

Guard server modules from accidental client import:

```typescript
// lib/secrets.ts
import 'server-only';

export async function getSecretData() {
  const res = await fetch('https://api.example.com/secret', {
    headers: { Authorization: `Bearer ${process.env.API_SECRET}` },
  });
  return res.json();
}
```

If a Client Component imports this file, the build fails with a clear error.

### `client-only` Package

Guard client modules from accidental server import:

```typescript
// lib/analytics.ts
import 'client-only';

export function trackEvent(name: string) {
  window.gtag('event', name);
}
```

---

## Rendering Lifecycle

### First Load (SSR)

1. Server renders Server Components into RSC Payload
2. Server pre-renders HTML using RSC Payload + Client Components
3. Client receives HTML (fast non-interactive preview)
4. Client receives RSC Payload (reconciles component tree)
5. Client hydrates Client Components (attaches event handlers)

### Subsequent Navigations (Client-Side)

1. RSC Payload is prefetched (via `<Link>` hover or `router.prefetch`)
2. Client Components render entirely on the client
3. No full HTML reload -- instant transition

---

## Dynamic Params in Client Components

In Client Components, use React's `use()` to unwrap the params promise:

```typescript
// app/posts/[slug]/page.tsx
'use client';

import { use } from 'react';

export default function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  return <div>Post: {slug}</div>;
}
```

Or use the `useParams()` hook anywhere in the client tree:

```typescript
'use client';

import { useParams } from 'next/navigation';

export function PostHeader() {
  const { slug } = useParams<{ slug: string }>();
  return <h1>Post: {slug}</h1>;
}
```

---

## Quick Decision Table

| What you are building | Component Type | Why |
|-----------------------|---------------|-----|
| Page shell / layout | Server | No JS shipped, direct data access |
| Static content display | Server | Zero client bundle impact |
| Data fetching | Server | Secure, no CORS, close to backend |
| Form with submit button | Server (form) + Client (submit button) | Progressive enhancement |
| Search with live filtering | Client | Needs `useState` for query |
| Modal / dialog | Client (wrapper) + Server (content as children) | Animation needs JS |
| Theme toggle | Client | Needs `useState` / context |
| Table with sorting | Client | Interactive column headers |
| Navigation sidebar | Server (shell) + Client (active link indicator) | `usePathname` needs JS |

---

**Version:** 15.x | **Source:** https://nextjs.org/docs
