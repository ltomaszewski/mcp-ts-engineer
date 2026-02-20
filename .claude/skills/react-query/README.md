# TanStack Query v5 Knowledge Base

> A powerful, unopinionated server state management library for React applications. LLM-optimized modular architecture for context efficiency.

**Source:** [https://tanstack.com/query/v5/docs/react/overview](https://tanstack.com/query/v5/docs/react/overview)

---

## Quick Overview

TanStack Query handles **fetching, caching, synchronizing, and updating server state** with zero-configuration defaults. It abstracts away complexity: caching, deduplication, background sync, retry logic, pagination, mutations, offline support, and more.

**Installation:**
```bash
npm install @tanstack/react-query
```

---

## Module Navigation Guide

This knowledge base is organized into self-contained modules optimized for LLM context windows. Each module is independently retrievable and includes cross-references for broader context.

### Completed Modules (6 / 15)

| Module | File | Purpose | Typical Use Case |
|--------|------|---------|------------------|
| **Overview** | `01-overview.md` | Philosophy, server vs client state, core concepts (queries, mutations) | Understanding why TanStack Query exists |
| **Installation & Setup** | `02-installation-setup.md` | Installation, QueryClient, QueryClientProvider, configuration | Getting started, project setup |
| **useQuery API** | `03-api-usequery.md` | Complete `useQuery` reference with parameters, states, refetch, examples | Fetching data |
| **useMutation API** | `04-api-usemutation.md` | `useMutation` hook, lifecycle callbacks, mutation states, examples | Creating/updating/deleting data |
| **Query Key Design** | `09-guide-query-keys.md` | Query key patterns, hierarchical structure, key factories, best practices | Organizing queries, cache management |
| **Navigation & Index** | `INDEX.md` | Detailed module inventory, learning paths, dependency graph, statistics | Deep learning, architecture review |

---

## How to Use This Knowledge Base

### For Implementation Tasks
1. **"I need to fetch data"** → Start with `02-installation-setup.md`, then `03-api-usequery.md`, then `09-guide-query-keys.md`
2. **"I want to create/update/delete data"** → See `04-api-usemutation.md`
3. **"I need error handling & retries"** → See `11-guide-error-handling.md` (planned)
4. **"I'm migrating from v4"** → See `15-migration-v4-to-v5.md` (planned)

### For API Lookups
Each module contains:
- **Method/Hook Name** as heading
- **Description** of what it does
- **Type Signature** showing parameters and returns
- **Parameters** table with types and descriptions
- **Return Values** specification
- **Code Examples** showing real usage
- **Source URL** for official documentation verification

### For Troubleshooting
- **Type errors?** → See `02-installation-setup.md` and `03-api-usequery.md`
- **Caching issues?** → See `10-guide-caching.md` (planned)
- **Mutation not updating UI?** → See `04-api-usemutation.md`

---

## Core Concepts at a Glance

### Queries (Data Fetching)
A **query** is an async data dependency tied to a unique key:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
})
```

### Mutations (Data Modification)
A **mutation** performs side effects and updates server state:
```typescript
const mutation = useMutation({
  mutationFn: (newUser) => fetch('/api/users', { method: 'POST', body: JSON.stringify(newUser) }),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
})
```

### Query Invalidation
When data changes on server, invalidate the cache to refetch:
```typescript
queryClient.invalidateQueries({ queryKey: ['users'] })
```

---

## Cross-Module Dependencies

```
01-overview.md
    ↓
02-installation-setup.md
    ├→ 03-api-usequery.md
    │   ├→ 09-guide-query-keys.md
    │   ├→ 10-guide-caching.md (planned)
    │   └→ 11-guide-error-handling.md (planned)
    │
    ├→ 04-api-usemutation.md
    │   ├→ 13-guide-mutations-workflows.md (planned)
    │   └→ 11-guide-error-handling.md (planned)
    │
    └→ 14-best-practices.md (planned)
```

---

## Best Practices Summary

✅ **DO:**
- Use `staleTime` to control how long data is considered fresh
- Use `gcTime` (formerly `cacheTime`) for cache duration
- Use `select` to narrow data subscriptions to needed fields
- Invalidate queries after mutations to keep UI in sync
- Use `useQueryClient` to access cache outside components
- Handle loading and error states with `isLoading`, `isError`, `error`

❌ **DON'T:**
- Treat server state like client state
- Manually manage fetch/loading without TanStack Query
- Forget to invalidate queries after mutations
- Use `refetchInterval` for real-time data (use server push instead)
- Store sensitive data in browser cache

---

## Version & Compatibility

- **TanStack Query Version:** v5.x (5.90.12+)
- **React Compatibility:** React 18+
- **Framework Support:** React, React Native, Solid, Svelte, Vue
- **Last Updated:** December 2025

---

## Official Documentation

- **Main Docs:** https://tanstack.com/query/v5/docs/react/overview
- **GitHub:** https://github.com/TanStack/query
- **NPM Package:** https://www.npmjs.com/package/@tanstack/react-query

---

## Planned Modules (Phase 2)

### API Reference (4 remaining)
- **05-api-infinitequery.md** — Pagination and infinite scrolling with pageParam
- **06-api-queryclient.md** — QueryClient constructor and configuration
- **07-api-queryclient-methods.md** — All methods (fetchQuery, prefetchQuery, setQueryData, invalidateQueries, etc.)
- **08-api-hooks-advanced.md** — useQueryClient, useQueries, Suspense hooks, useIsFetching, useIsMutating

### Guide Modules (5 remaining)
- **10-guide-caching.md** — Cache lifecycle, staleTime vs gcTime, invalidation strategies
- **11-guide-error-handling.md** — Error patterns, retry logic, exponential backoff
- **12-guide-synchronization.md** — Network modes, offline support, background sync
- **13-guide-mutations-workflows.md** — Advanced mutation patterns, optimistic updates, rollback
- **15-migration-v4-to-v5.md** — Breaking changes, API updates, migration checklist

### Best Practices (1 remaining)
- **14-best-practices.md** — Performance optimization, common pitfalls, TypeScript patterns, security

---

**Last Updated:** December 2025 | **Status:** Phase 1 Complete (6/15 modules)