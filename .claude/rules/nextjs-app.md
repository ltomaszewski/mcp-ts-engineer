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
| No API routes in Next.js (exception: auth catch-all at `app/api/auth/[...all]/route.ts`) | Backend owns all endpoints |
| Environment: `NEXT_PUBLIC_API_URL` | Backend URL configured per environment |

---

## Server vs Client Components

- **Server Components** (default): Data fetching, SEO content, layout shells
- **Client Components** (`"use client"`): Interactive UI, TanStack Query hooks, browser APIs

For detailed patterns and code examples, load the `nextjs-core` skill.

### Anti-Patterns

| Anti-Pattern | Fix |
|--------------|-----|
| `"use client"` on page components | Keep pages as Server Components, extract interactive parts |
| Fetching in Client Components without TanStack Query | Use `useQuery` for caching and deduplication |
| Direct database calls in Next.js | Fetch from NestJS backend instead |
| API routes (`app/api/`) for proxying (exception: auth catch-all at `app/api/auth/[...all]/route.ts`) | Use Server Components or Server Actions |
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

- **Server Components**: Use `apiFetch<T>()` with optional `next: { revalidate }` for caching
- **Client Components**: Use TanStack Query `useQuery` / `useMutation` with cache invalidation
- **Mutations**: Server Actions or `useMutation` proxying to backend

For detailed data fetching and mutation patterns, load the `nextjs-core` skill.

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

For test patterns, query helpers, and mocking strategies, load the `nextjs-testing` skill.

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
