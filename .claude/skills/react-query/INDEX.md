# TanStack Query v5 Knowledge Base - Detailed Learning Paths

> Deep-dive learning reference with curated learning paths, module dependencies, and role-specific guides. Start with [README.md](./README.md) for quick navigation.

---

## Complete Module Index

### ✅ Phase 1: Completed (6 / 15 modules)

| Module | File | Purpose |
|--------|------|---------|
| **Overview** | `01-overview.md` | Philosophy, server state vs client state, core concepts |
| **Installation & Setup** | `02-installation-setup.md` | Installation, QueryClient, QueryClientProvider |
| **useQuery API** | `03-api-usequery.md` | Data fetching hook with parameters and examples |
| **useMutation API** | `04-api-usemutation.md` | Data mutation hook with lifecycle callbacks |
| **Query Keys Design** | `09-guide-query-keys.md` | Key patterns, factories, invalidation strategies |
| **Navigation** | `README.md` | Quick start and module router |

### ⏳ Phase 2: Planned (9 remaining)

**API Reference (4 modules):**
- `05-api-infinitequery.md` — Pagination and infinite scrolling
- `06-api-queryclient.md` — QueryClient constructor and setup
- `07-api-queryclient-methods.md` — All QueryClient methods
- `08-api-hooks-advanced.md` — useQueryClient, useQueries, Suspense hooks

**Guides (4 modules):**
- `10-guide-caching.md` — Cache lifecycle, staleTime vs gcTime
- `11-guide-error-handling.md` — Error patterns and retry logic
- `12-guide-synchronization.md` — Network modes and offline support
- `13-guide-mutations-workflows.md` — Optimistic updates, rollback patterns

**Best Practices (1 module):**
- `14-best-practices.md` — Performance optimization, pitfalls, security
- `15-migration-v4-to-v5.md` — Breaking changes and migration guide

---

## Quick Navigation by Use Case (Phase 1)

### "I want to fetch data"
1. [02-installation-setup.md](./02-installation-setup.md) — Setup QueryClient
2. [03-api-usequery.md](./03-api-usequery.md) — Learn useQuery API
3. [09-guide-query-keys.md](./09-guide-query-keys.md) — Master query key patterns

### "I want to create/update/delete data"
1. [04-api-usemutation.md](./04-api-usemutation.md) — Complete useMutation reference
2. *[13-guide-mutations-workflows.md](./13-guide-mutations-workflows.md) — Optimistic updates (Phase 2)*

### "I want to understand server state deeply"
1. [01-overview.md](./01-overview.md) — Philosophy and core concepts
2. [03-api-usequery.md](./03-api-usequery.md) — Data fetching details
3. [04-api-usemutation.md](./04-api-usemutation.md) — Data mutation patterns

**Future paths (Phase 2):**
- Infinite scrolling → `05-api-infinitequery.md`
- Manual cache management → `06-api-queryclient.md` + `07-api-queryclient-methods.md`
- Error handling & retries → `11-guide-error-handling.md`
- Offline support → `12-guide-synchronization.md`
- Migration from v4 → `15-migration-v4-to-v5.md`

---

## Learning Paths by Role (Phase 1)

### 👨‍💻 For New Developers
1. [01-overview.md](./01-overview.md) — Understand why TanStack Query exists
2. [02-installation-setup.md](./02-installation-setup.md) — Set up QueryClient and provider
3. [03-api-usequery.md](./03-api-usequery.md) — Learn to fetch data with useQuery
4. [04-api-usemutation.md](./04-api-usemutation.md) — Learn to mutate with useMutation
5. [09-guide-query-keys.md](./09-guide-query-keys.md) — Master query key design patterns

**Status:** ✅ All modules available | **Time to productive:** ~2 hours

### 👨‍🏫 For Architects & Tech Leads
1. [01-overview.md](./01-overview.md) — Philosophy and mental model
2. [09-guide-query-keys.md](./09-guide-query-keys.md) — Key design for scale
3. [03-api-usequery.md](./03-api-usequery.md) — Deep useQuery patterns
4. [04-api-usemutation.md](./04-api-usemutation.md) — Deep mutation patterns
5. *[10-guide-caching.md](./10-guide-caching.md) — Cache strategies (Phase 2)*
6. *[14-best-practices.md](./14-best-practices.md) — Production patterns (Phase 2)*

**Status:** 5/6 modules available | **Time to mastery:** ~20 hours (Phase 2 completion)

## Future Learning Paths (Phase 2)

### 🔄 For Migrating from v4
- [15-migration-v4-to-v5.md](./15-migration-v4-to-v5.md) — Breaking changes guide
- Review [03-api-usequery.md](./03-api-usequery.md) and [04-api-usemutation.md](./04-api-usemutation.md) for new signatures
- [06-api-queryclient.md](./06-api-queryclient.md) — Updated QueryClient API

### 📱 For Offline-First / PWA Development
- [12-guide-synchronization.md](./12-guide-synchronization.md) — Network modes
- [13-guide-mutations-workflows.md](./13-guide-mutations-workflows.md) — Optimistic updates
- [11-guide-error-handling.md](./11-guide-error-handling.md) — Resilience patterns

### ∞ For Advanced Patterns
- [05-api-infinitequery.md](./05-api-infinitequery.md) — Pagination & infinite scrolling
- [06-api-queryclient.md](./06-api-queryclient.md) & [07-api-queryclient-methods.md](./07-api-queryclient-methods.md) — Manual cache management
- [08-api-hooks-advanced.md](./08-api-hooks-advanced.md) — Advanced hooks

---

## Module Dependency Graph (Phase 1)

```
01-overview.md
    ↓
02-installation-setup.md
    ├→ 03-api-usequery.md
    │   └→ 09-guide-query-keys.md
    │
    └→ 04-api-usemutation.md
        └→ 09-guide-query-keys.md
```

**Full graph (with Phase 2):**
```
01-overview.md
    ↓
02-installation-setup.md
    ├→ 03-api-usequery.md
    │   ├→ 09-guide-query-keys.md
    │   ├→ 10-guide-caching.md (Phase 2)
    │   └→ 11-guide-error-handling.md (Phase 2)
    │
    ├→ 04-api-usemutation.md
    │   ├→ 13-guide-mutations-workflows.md (Phase 2)
    │   └→ 11-guide-error-handling.md (Phase 2)
    │
    ├→ 05-api-infinitequery.md (Phase 2)
    │
    ├→ 06-api-queryclient.md (Phase 2)
    │   ├→ 07-api-queryclient-methods.md (Phase 2)
    │   └→ 10-guide-caching.md (Phase 2)
    │
    ├→ 08-api-hooks-advanced.md (Phase 2)
    │
    ├→ 12-guide-synchronization.md (Phase 2)
    │
    └→ 14-best-practices.md (Phase 2)
        └→ 15-migration-v4-to-v5.md (Phase 2)
```

---

## Document Quality Standards

✅ **Every Module Includes:**
- Exact source URL from official TanStack Query documentation
- Module summary at the top for quick context
- Table of contents for easy navigation
- Complete parameter documentation with types
- Comprehensive return value descriptions
- 5+ working, production-ready code examples
- TypeScript patterns throughout
- Cross-references to related modules

---

## Statistics

**Phase 1 (Complete):**
- Modules: 6
- Total lines: ~3,859
- Code examples: 30+
- Source references: 15+

**Phase 2 (Planned):**
- Modules: 9
- Estimated lines: ~3,800
- Estimated examples: 20+

**Total (When Complete):**
- Modules: 15
- Coverage: 100% of TanStack Query v5 API

---

## Cross-Reference Legend

Throughout documents, you'll see:

- **[Source: official-docs](URL)** — Direct link to official TanStack Query documentation
- **→ See [Module Name]** — Cross-reference to related module in this knowledge base
- **⚠️ Breaking Change** — Highlights v5-specific changes from v4
- **💡 Pro Tip** — Best practice or advanced technique
- **🔍 TypeScript** — Type-safe patterns

---

## Version Information

- **TanStack Query Version:** v5.x (5.90.12+)
- **React Compatibility:** React 18+
- **Framework Support:** React, React Native, Solid, Svelte, Vue (core library is framework-agnostic)
- **Last Updated:** December 2025

---

## Traceability & Verification

Every method and major concept includes:
- ✅ Typed parameters with descriptions
- ✅ Complete return value documentation
- ✅ Real-world code examples
- ✅ Direct source URL (official-docs)

This ensures 100% traceability and verification against the official TanStack Query documentation.

---

**Happy querying! 🚀**

For quick navigation, see [README.md](./README.md).