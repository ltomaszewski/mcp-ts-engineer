# Core Philosophy & Overview

**Module:** `01-overview.md` | **Version:** 5.x (^5.90.x)

---

## What is TanStack Query?

A server state management library that handles fetching, caching, synchronizing, and updating remote data. Eliminates manual loading/error/caching logic. Approximately 20% smaller than v4 with simplified APIs.

---

## Server State vs Client State

| Aspect | Client State | Server State |
|--------|-------------|--------------|
| Ownership | Your app | Remote server |
| Mutability | Synchronous | Asynchronous, unpredictable |
| Staleness | Always fresh | Can become stale |
| Lifespan | Lives in memory | Persists independently |

**Client state:** UI toggles, form inputs, theme -- use Zustand/Redux.
**Server state:** API data, user profiles, lists -- use TanStack Query.

---

## Problems TanStack Query Solves

1. **Caching** -- Automatic with configurable staleness
2. **Deduplication** -- Multiple components requesting same data = one request
3. **Background sync** -- Refetch on window focus, reconnect, intervals
4. **Request cancellation** -- Automatic on component unmount
5. **Memory management** -- Garbage collection of unused cache entries
6. **Retry logic** -- Configurable retries with exponential backoff
7. **Pagination** -- Cursor-based infinite queries with `maxPages` for memory control
8. **Optimistic updates** -- Instant UI with rollback on failure
9. **Structural sharing** -- Referential stability of unchanged data across refetches

---

## Core Concepts

### Queries (Data Fetching)

```typescript
const { data, isPending, error } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
})
```

### Mutations (Data Modification)

```typescript
const mutation = useMutation({
  mutationFn: (newUser: User) =>
    fetch('/api/users', { method: 'POST', body: JSON.stringify(newUser) }).then(r => r.json()),
  onSuccess: () => queryClient.invalidateQueries({ queryKey: ['users'] }),
})
```

### Query Invalidation

```typescript
queryClient.invalidateQueries({ queryKey: ['users'] })          // All users
queryClient.invalidateQueries({ queryKey: ['users', id] })       // Specific user
queryClient.invalidateQueries({ queryKey: ['users'], exact: true }) // Exact match only
```

### Query Keys

Array-based identifiers for hierarchical caching and invalidation:

```typescript
['users']                                    // All users
['users', userId]                           // Specific user
['users', userId, 'posts']                  // User's posts
['posts', { status: 'published', page: 1 }] // Filtered posts
```

---

## Architecture

```
React Application
  |-- useQuery() / useMutation() / useQueryClient()
  |-- QueryClientProvider
  |-- QueryClient
       |-- QueryCache (in-memory)
       |    |-- ['users'] -> { data, status, ... }
       |    |-- ['users', 1] -> { data, status, ... }
       |-- MutationCache
       |-- Staleness tracking
       |-- Garbage collection
       |-- Background refetch scheduler
```

---

## v5 Key Changes from v4

| Change | v4 | v5 |
|--------|-----|-----|
| Cache time option | `cacheTime` | `gcTime` |
| Loading state | `status: 'loading'` | `status: 'pending'` |
| Loading flag | `isLoading` (first load) | `isPending` (first load), `isLoading` = `isPending && isFetching` |
| Previous data | `keepPreviousData` | `placeholderData: (prev) => prev` |
| Query callbacks | `onSuccess`/`onError`/`onSettled` on useQuery | Removed -- use `useEffect` |
| API shape | Multiple overloads | Single object parameter |
| Options helpers | None | `queryOptions()`, `infiniteQueryOptions()`, `mutationOptions()` |
| Mutation state | Not shared | `useMutationState()` hook |
| Infinite queries | No limit | `maxPages` option |
| useQueries | No combining | `combine` option |
| Mutation scoping | None | `scope: { id }` for serial execution |
| React requirement | React 17+ | React 18+ (uses `useSyncExternalStore`) |

---

## When to Use

**Use TanStack Query for:** API fetching, caching, pagination, background sync, optimistic updates.

**Do NOT use for:** Pure client state (use Zustand), real-time streaming (combine with WebSockets), offline-first persistent storage (use SQLite/IndexedDB alongside).

---

**Source:** https://tanstack.com/query/v5/docs/framework/react/overview
**Version:** 5.x (^5.90.x)
