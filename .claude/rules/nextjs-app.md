---
globs: apps/*-web/**, apps/*-frontend/**, templates/apps/next-app/**
---

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
| No API routes in Next.js (exceptions: auth catch-all at `app/api/auth/[...all]/route.ts`, markdown proxy at `app/api/markdown/[...path]/route.ts`, and `app/llms.txt/route.ts`) | Backend owns all endpoints |
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
| API routes (`app/api/`) for proxying (exceptions: auth, markdown proxy, llms.txt) | Use Server Components or Server Actions |
| Hardcoded metadata in layout.tsx | Use `buildSiteMetadata()` from `@/lib/seo/metadata` |
| Missing JSON-LD structured data | Add `JsonLdScript` component with schema builders |
| `useEffect` for data fetching | Use TanStack Query or Server Components |

---

## Folder Structure

```
src/
├── app/                    # Next.js App Router
│   ├── layout.tsx          # Root layout (providers, fonts, JSON-LD)
│   ├── page.tsx            # Home page
│   ├── loading.tsx         # Global loading state
│   ├── not-found.tsx       # 404 page
│   ├── globals.css         # Tailwind imports + theme
│   ├── robots.ts           # Dynamic robots.txt generation
│   ├── sitemap.ts          # Dynamic sitemap.xml generation
│   ├── api/markdown/[...path]/ # Markdown proxy for AI bots
│   ├── llms.txt/           # LLM discovery manifest
│   ├── middleware.ts        # AI bot detection middleware
│   └── (routes)/           # Route groups
├── components/
│   ├── seo/                # SEO components
│   │   └── json-ld-script.tsx  # JSON-LD structured data renderer
│   └── ui/                 # shadcn/ui components (generated)
├── features/               # Feature modules
│   └── {feature}/
│       ├── api.ts           # Server-side fetch functions
│       ├── {name}.tsx       # Client component
│       └── __tests__/       # Feature tests
├── lib/
│   ├── api-client.ts       # Backend fetch wrapper
│   ├── query-client.ts     # TanStack Query provider
│   ├── seo/                # SEO utilities
│   │   ├── ai-bots.ts      # AI bot user-agent detection
│   │   ├── json-ld.ts      # JSON-LD schema builders (WebSite, Organization, etc.)
│   │   ├── markdown-transform.ts  # HTML-to-Markdown conversion
│   │   ├── metadata.ts     # Centralized metadata builder
│   │   └── sanitize.ts     # HTML sanitization for markdown output
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

## SEO & AI Readability

Every Next.js app includes built-in SEO infrastructure. For implementation details, load the `nextjs-seo` skill.

### Included Out-of-the-Box

| Feature | Location | Purpose |
|---------|----------|---------|
| Metadata builder | `lib/seo/metadata.ts` | Centralized `buildSiteMetadata()` with Open Graph, Twitter cards |
| JSON-LD structured data | `lib/seo/json-ld.ts` + `components/seo/json-ld-script.tsx` | Schema.org types via `schema-dts` |
| Dynamic robots.txt | `app/robots.ts` | Programmatic crawl rules |
| Dynamic sitemap.xml | `app/sitemap.ts` | Auto-generated from routes |
| AI bot middleware | `middleware.ts` + `lib/seo/ai-bots.ts` | Detect AI crawlers, serve markdown |
| Markdown proxy | `app/api/markdown/[...path]/route.ts` | HTML-to-Markdown for AI bots |
| LLM discovery | `app/llms.txt/route.ts` | llms.txt manifest for AI agents |
| HTML-to-Markdown | `lib/seo/markdown-transform.ts` | Readability + Turndown pipeline |
| Sanitization | `lib/seo/sanitize.ts` | Clean HTML before markdown conversion |

### Key Dependencies

| Package | Purpose |
|---------|---------|
| `schema-dts` | TypeScript types for Schema.org JSON-LD |
| `linkedom` | Lightweight DOM for server-side HTML parsing |
| `@mozilla/readability` | Content extraction (Mozilla's Readability algorithm) |
| `turndown` | HTML-to-Markdown conversion |

### Rules

- Use `buildSiteMetadata()` in root layout, never hardcode metadata
- Add page-specific metadata via `generateMetadata()` in page files
- Add JSON-LD to layout and key pages (products, articles, etc.)
- Keep `NEXT_PUBLIC_SITE_URL` in `.env` for canonical URLs
- AI bot detection runs in middleware, not in components

---

## Linting

- **Biome** (not ESLint) — consistent with monorepo
- `next.config.ts` sets `eslint: { ignoreDuringBuilds: true }`
- Biome excludes `.next/` directory
