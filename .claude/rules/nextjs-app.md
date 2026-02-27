# Next.js Web App Rules

Architecture and coding rules for Next.js apps using the BFF pattern.

---

## BFF Pattern (Backend-for-Frontend)

Next.js acts as a **thin frontend layer**. All business logic, data access, and auth live in the NestJS backend.

### Data Flow

```
Browser → Next.js Server Component → NestJS Backend → Database
Browser → Next.js Client Component → TanStack Query → NestJS Backend
Browser → Next.js Server Action → NestJS Backend (mutations)
```

### Rules

| Rule | Why |
|------|-----|
| Server Components fetch from backend | No direct DB access in Next.js |
| Client Components use TanStack Query | Caching, polling, optimistic updates |
| Server Actions proxy mutations | No client-side API keys |
| No API routes in Next.js | Backend owns all endpoints |
| Environment: `NEXT_PUBLIC_API_URL` | Backend URL configured per environment |

---

## Server vs Client Components

### Server Components (default)

Use for:
- Initial data fetching
- SEO-critical content
- Static or rarely-changing content
- Layout and page shells

```tsx
// app/users/page.tsx — Server Component (default)
export default async function UsersPage() {
  const users = await apiFetch<User[]>("/users");
  return <UserList users={users} />;
}
```

### Client Components (`"use client"`)

Use for:
- Interactive UI (forms, buttons, modals)
- TanStack Query hooks
- Browser APIs (localStorage, window)
- Real-time updates (polling, WebSocket)

```tsx
"use client";
// components/user-search.tsx
export function UserSearch() {
  const [query, setQuery] = useState("");
  const { data } = useQuery({ queryKey: ["users", query], queryFn: ... });
  return <input value={query} onChange={e => setQuery(e.target.value)} />;
}
```

### Anti-Patterns

| Anti-Pattern | Fix |
|--------------|-----|
| `"use client"` on page components | Keep pages as Server Components, extract interactive parts |
| Fetching in Client Components without TanStack Query | Use `useQuery` for caching and deduplication |
| Direct database calls in Next.js | Fetch from NestJS backend instead |
| API routes (`app/api/`) for proxying | Use Server Components or Server Actions |
| `useEffect` for data fetching | Use TanStack Query or Server Components |

---

## Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (providers, fonts)
│   ├── page.tsx            # Home page
│   ├── loading.tsx         # Global loading state
│   ├── not-found.tsx       # 404 page
│   ├── globals.css         # Tailwind imports + theme
│   └── (routes)/           # Route groups
├── components/
│   └── ui/                 # shadcn/ui components (generated)
├── features/               # Feature modules
│   └── {feature}/
│       ├── api.ts           # Server-side fetch functions
│       ├── {name}.tsx       # Client component
│       └── __tests__/       # Feature tests
├── lib/
│   ├── api-client.ts       # Backend fetch wrapper
│   ├── query-client.ts     # TanStack Query provider
│   └── utils.ts            # cn() helper
├── hooks/                  # Shared custom hooks
├── stores/                 # Zustand stores
└── types/                  # Shared type definitions
```

---

## Data Fetching

### Server Components

```tsx
// Direct fetch in Server Component — cached by Next.js
const data = await apiFetch<T>("/endpoint");

// With revalidation
const data = await apiFetch<T>("/endpoint", {
  next: { revalidate: 60 },
});
```

### Client Components

```tsx
"use client";
const { data, isLoading, error } = useQuery({
  queryKey: ["resource", id],
  queryFn: () => fetchResource(id),
  staleTime: 60_000,
});
```

### Mutations

```tsx
const mutation = useMutation({
  mutationFn: (input: CreateInput) => apiFetch("/resource", {
    method: "POST",
    body: JSON.stringify(input),
  }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ["resource"] }),
});
```

---

## Styling

- **Tailwind CSS v4**: CSS-first config via `@import "tailwindcss"`
- **shadcn/ui**: Component source in `src/components/ui/`
- **cn() helper**: Merge Tailwind classes with `clsx` + `tailwind-merge`
- **No `tailwind.config.js`**: Tailwind v4 uses CSS `@theme` blocks

---

## Testing

- **Runner**: Vitest + jsdom
- **Library**: @testing-library/react
- **Setup**: `vitest.setup.ts` imports `@testing-library/jest-dom`
- **Path aliases**: `vite-tsconfig-paths` resolves `@/` imports

```tsx
import { render, screen } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return ({ children }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  );
}

it("renders component", () => {
  render(<MyComponent />, { wrapper: createWrapper() });
  expect(screen.getByText("Hello")).toBeInTheDocument();
});
```

---

## Auth: Better Auth

- **Not next-auth** — Better Auth is the recommended replacement
- Auth logic lives in the NestJS backend
- Next.js stores session token (cookie or header)
- Protected routes use middleware or Server Component checks

---

## Linting

- **Biome** (not ESLint) — consistent with monorepo
- `next.config.ts` sets `eslint: { ignoreDuringBuilds: true }`
- Biome excludes `.next/` directory
