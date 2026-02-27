# [mcp-ts-engineer] feat: add Next.js web app template and rules

**Source**: https://github.com/ltomaszewski/mcp-ts-engineer/issues/7
**Issue**: #7
**Project**: mcp-ts-engineer
**Status**: IMPLEMENTED

---

## Description

---
project: mcp-ts-engineer
path: packages/mcp-ts-engineer
type: feat
status: draft
created: 2026-02-27
session: "Add Next.js 15 thin-client web app template with BFF architecture, skills, and rules to the monorepo scaffold system"
---

# Add Next.js web app template and rules

## Context

The monorepo scaffold system (`create-app.sh`) currently supports 3 app types: expo-app, nestjs-server, and mcp-server. A 4th type is needed: `next-app` — a Next.js 15 thin frontend that delegates all heavy lifting to a NestJS backend via the Backend-for-Frontend (BFF) pattern. Research confirmed the optimal dependency stack, and all version compatibility has been verified.

---

## Requirements

- [ ] FR-1: `next-app` entry exists in `templates/apps/registry.json` with label "Next.js Web App" and description listing key technologies
- [ ] FR-2: `templates/apps/next-app/` contains all required template files (package.json.template, tsconfig.json.template, biome.json.template, next.config.ts.template, postcss.config.mjs.template, vitest.config.ts.template, nvmrc.template, env.example.template, components.json.template)
- [ ] FR-3: Scaffolded app passes `npm run type-check`, `npm run lint`, and `npm test` out of the box with zero errors
- [ ] FR-4: Health check starter page demonstrates BFF pattern — Server Component fetches from backend, client component uses TanStack Query for live refresh
- [ ] FR-5: `__tests__/create-app-scripts.test.ts` includes next-app in APP_TYPES array and validates template structure (vitest.config, next.config, layout.tsx, postcss.config)
- [ ] FR-6: `.claude/rules/nextjs-app.md` provides architecture rules (BFF pattern, Server vs Client components, data fetching, folder structure, anti-patterns)
- [ ] FR-7: `CLAUDE.md` updated with next-app in Available App Types table, Per-App Scripts table, and Per-App Biome Config section
- [ ] FR-8: Skills downloaded via `/update-skills`: nextjs-core, tailwind-v4, shadcn-ui, better-auth, nextjs-testing

---

## Architecture Decisions (from research)

### BFF Pattern
Next.js acts as a thin frontend layer. Server Components fetch data from NestJS backend at server level (no client-side API key exposure). Server Actions proxy mutations. TanStack Query handles client-side refresh/polling.

### Auth: better-auth (not next-auth)
Auth.js (next-auth) is in maintenance mode — the lead maintainer left Jan 2025, v5 never left beta after 3 years. Auth.js officially merged under Better Auth stewardship (Sep 2025) and the Auth.js website recommends Better Auth for new projects. Better Auth is stable (v1.4.19), TypeScript-first, has $5M funding, built-in RBAC/MFA, and active development (last release: Feb 2026).

### UI: shadcn/ui + Tailwind CSS v4
shadcn/ui is a CLI tool (not a runtime dependency) that copies component source into the project. It requires: class-variance-authority, clsx, tailwind-merge, lucide-react, tw-animate-css, and per-component @radix-ui/* packages. Tailwind v4 uses CSS-first config (`@import "tailwindcss"`) with `@tailwindcss/postcss` plugin.

### Testing: Vitest + @testing-library/react + jsdom
Official Next.js recommendation. `vite-tsconfig-paths` needed for `@/` alias resolution. jsdom preferred over happy-dom (more complete browser API, official docs use it).

### Linting: Biome (not ESLint)
Next.js 15.5+ deprecated `next lint` in favor of Biome. 10-25x faster, single binary, consistent with other monorepo templates.

### No ky/axios
Native `fetch` is sufficient — Next.js extends it with caching/revalidation. Using ky bypasses those optimizations.

---

## Verified Dependency Versions

### Production Dependencies
| Package | Version | Notes |
|---------|---------|-------|
| `next` | `^15.5.0` | Latest stable 15.x |
| `react` | `^19.2.0` | Required by Next.js 15.1+ |
| `react-dom` | `^19.2.0` | Required by Next.js 15 |
| `@tanstack/react-query` | `^5.90.0` | Server state, caching, polling |
| `zustand` | `^5.0.0` | Client state (theme, UI) |
| `react-hook-form` | `^7.71.0` | Form handling |
| `@hookform/resolvers` | `^5.2.0` | Bridges RHF + Zod |
| `zod` | `^4.3.0` | Schema validation |
| `better-auth` | `^1.4.0` | Authentication |
| `class-variance-authority` | `^0.7.0` | shadcn/ui dependency |
| `clsx` | `^2.1.0` | shadcn/ui dependency |
| `tailwind-merge` | `^3.0.0` | shadcn/ui dependency |
| `lucide-react` | `^0.500.0` | Icon library for shadcn/ui |
| `tw-animate-css` | `^1.4.0` | Animation (replaces deprecated tailwindcss-animate) |

### Dev Dependencies
| Package | Version | Notes |
|---------|---------|-------|
| `typescript` | `^5.9.0` | Latest stable (6.0 is beta only) |
| `@types/react` | `^19.2.0` | React 19 types |
| `@types/react-dom` | `^19.2.0` | ReactDOM 19 types |
| `@types/node` | `^22.0.0` | Match Node 22 LTS |
| `@biomejs/biome` | `^2.4.0` | Linter + formatter |
| `@tailwindcss/postcss` | `^4.2.0` | PostCSS plugin for Tailwind v4 |
| `tailwindcss` | `^4.2.0` | CSS framework (dev for PostCSS) |
| `vitest` | `^4.0.0` | Test runner |
| `@vitejs/plugin-react` | `^5.1.0` | React JSX transform for Vitest |
| `@testing-library/react` | `^16.3.0` | Component testing |
| `@testing-library/dom` | `^10.4.0` | DOM testing (peer dep) |
| `@testing-library/jest-dom` | `^6.9.0` | Custom matchers |
| `vite-tsconfig-paths` | `^6.1.0` | Resolves @/ aliases in Vitest |
| `jsdom` | `^25.0.0` | DOM environment for tests |

---

## Template Folder Structure

```
templates/apps/next-app/
├── package.json.template
├── tsconfig.json.template
├── next.config.ts.template
├── postcss.config.mjs.template
├── vitest.config.ts.template
├── vitest.setup.ts.template
├── biome.json.template
├── nvmrc.template
├── env.example.template              → .env.example
├── components.json.template          # shadcn/ui config
├── public/
│   └── .gitkeep
├── src/
│   ├── app/
│   │   ├── layout.tsx.template       # Root layout (providers, fonts)
│   │   ├── page.tsx.template         # Home page (health check demo)
│   │   ├── loading.tsx.template      # Global loading state
│   │   ├── not-found.tsx.template    # 404 page
│   │   └── globals.css.template      # Tailwind imports + shadcn theme
│   ├── components/
│   │   └── ui/
│   │       └── .gitkeep             # shadcn/ui components go here
│   ├── lib/
│   │   ├── api-client.ts.template   # Backend fetch wrapper
│   │   ├── query-client.ts.template # TanStack Query provider
│   │   └── utils.ts.template        # cn() helper for shadcn
│   ├── hooks/
│   │   └── .gitkeep
│   ├── stores/
│   │   └── .gitkeep
│   ├── features/
│   │   └── health/
│   │       ├── api.ts.template           # fetchHealth() server function
│   │       ├── health-status.tsx.template # Client component with TanStack Query
│   │       └── __tests__/
│   │           └── health-status.test.tsx.template
│   └── types/
│       └── .gitkeep
```

## Standard Scripts (consistent with monorepo)

| Script | Command |
|--------|---------|
| `dev` | `next dev --turbopack` |
| `build` | `next build` |
| `start` | `next start -p {{PORT}}` |
| `test` | `vitest run` |
| `test:watch` | `vitest` |
| `test:coverage` | `vitest run --coverage` |
| `type-check` | `tsc --noEmit` |
| `lint` | `biome check .` |
| `format` | `biome format --write .` |
| `clean` | `rm -rf .next` |

---

## Affected Files

| File | Action | Purpose |
|------|--------|---------|
| `templates/apps/registry.json` | MODIFY | Add `next-app` entry |
| `templates/apps/next-app/**` | CREATE | All template files (~25 files) |
| `__tests__/create-app-scripts.test.ts` | MODIFY | Add next-app test cases |
| `.claude/rules/nextjs-app.md` | CREATE | Architecture and coding rules for Next.js apps |
| `CLAUDE.md` | MODIFY | Add next-app to documentation tables |

---

## Implementation Notes

- Follow existing template conventions exactly: `.template` suffix, `{{PLACEHOLDER}}` syntax, dot-prefix handling for `env.example.template` → `.env.example`
- `biome.json.template` should exclude `.next/**` (similar to how mcp-server excludes `build/**`)
- `tsconfig.json.template` needs Next.js-specific config: `jsx: "preserve"`, `module: "esnext"`, `moduleResolution: "bundler"`, `noEmit: true`, `paths: { "@/*": ["./src/*"] }`
- `next.config.ts.template` must disable ESLint during builds (`eslint: { ignoreDuringBuilds: true }`) since Biome is used
- `postcss.config.mjs.template` uses `@tailwindcss/postcss` plugin (Tailwind v4 pattern)
- `globals.css.template` uses `@import "tailwindcss"` + `@import "tw-animate-css"` (v4 syntax, no tailwind.config.js needed)
- `components.json.template` configures shadcn/ui to write to `src/components/ui/`
- Test `APP_TYPES` array in create-app-scripts.test.ts must be updated from 3 to 4 entries
- The registry test checking "all three app types" needs updating to "all four app types"
- `.claude/rules/nextjs-app.md` should cover: BFF pattern, Server vs Client components, data fetching strategy, folder conventions, anti-patterns
- Skills to download after template is complete: nextjs-core, tailwind-v4, shadcn-ui, better-auth, nextjs-testing
- `env.example.template` should contain: `NEXT_PUBLIC_API_URL=http://localhost:3001` (backend URL for BFF pattern), `NODE_ENV=development`
- `vitest.setup.ts.template` should import `@testing-library/jest-dom` for DOM matchers
- Health check page is a fully working demo: Server Component fetches `/api/health` from backend, Client component (`health-status.tsx`) uses TanStack Query `useQuery` to poll status. Test should render the component and verify it shows loading/data states.
- Coverage target for scaffolded app: tests must pass (not 80% — starter app has minimal code)
- `next start -p {{PORT}}` is valid Next.js CLI syntax (supports `-p` flag)
- Middleware (`middleware.ts`) is out of scope for the starter template

---

## References

- [Next.js App Router Docs](https://nextjs.org/docs/app)
- [Next.js BFF Guide](https://nextjs.org/docs/app/guides/backend-for-frontend)
- [Next.js Vitest Testing Guide](https://nextjs.org/docs/app/guides/testing/vitest)
- [shadcn/ui Tailwind v4 Setup](https://ui.shadcn.com/docs/tailwind-v4)
- [Better Auth Docs](https://www.better-auth.com/docs)
- [Auth.js → Better Auth Migration](https://authjs.dev/getting-started/migrate-to-better-auth)
- [Tailwind CSS v4 PostCSS](https://tailwindcss.com/blog/tailwindcss-v4)

---

## For Implementation

| Field | Value |
|-------|-------|
| **Project** | `packages/mcp-ts-engineer` |
| **Workspace** | root (templates are in packages/mcp-ts-engineer/templates/) |
| **Test** | `npm test` |
| **Build** | `npm run build` |

**To implement:**
```
/issue-implement {number}
```

---

## Metadata

| Field | Value |
|-------|-------|
| Imported | 2026-02-27 |
| State | OPEN |
| Labels | project:mcp-ts-engineer, type:feature, status:draft |
| Project | mcp-ts-engineer |

---

## Next Steps

```bash
# Review and refine spec
/todo-review docs/specs/mcp-ts-engineer/todo/2026-02-27-add-next-js-web-app-template-and-rules.md

# Implement with code writer
mcp__ts-engineer__todo_code_writer spec_path="docs/specs/mcp-ts-engineer/todo/2026-02-27-add-next-js-web-app-template-and-rules.md"
```
