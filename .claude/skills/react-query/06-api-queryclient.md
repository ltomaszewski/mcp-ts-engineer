# QueryClient: Cache Management API

**Module:** `06-api-queryclient.md` | **Version:** 5.x (^5.62.11)

---

## Constructor

```typescript
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions?: {
    queries?: Partial<QueryObserverOptions>
    mutations?: Partial<MutationObserverOptions>
  }
})
```

Access inside components:

```typescript
import { useQueryClient } from '@tanstack/react-query'

function Component() {
  const queryClient = useQueryClient()
}
```

---

## Query Data Methods

### `fetchQuery`

Fetches and caches a query. Returns cached data if fresh (not invalidated and within `staleTime`). Throws on error.

```typescript
const data = await queryClient.fetchQuery<TData>({
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  staleTime?: number,
  gcTime?: number,
  retry?: boolean | number | RetryFn,
  retryDelay?: number | RetryDelayFn,
  meta?: Record<string, unknown>,
})
```

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `queryKey` | `QueryKey` | Yes | Cache key |
| `queryFn` | `QueryFunction<TData>` | Yes* | Fetch function (*not needed if default queryFn set) |
| `staleTime` | `number` | No | If data is fresher than this, return cache |
| `gcTime` | `number` | No | Override default gcTime |
| `retry` | `boolean \| number \| RetryFn` | No | Retry on error |
| `retryDelay` | `number \| RetryDelayFn` | No | Delay between retries |

```typescript
// Fetch user data (returns cached if fresh)
const user = await queryClient.fetchQuery({
  queryKey: ['users', userId],
  queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
  staleTime: 5 * 60 * 1000,
})
```

**Use `fetchQuery` when you need the result.** Use `prefetchQuery` when you only want to warm the cache.

---

### `prefetchQuery`

Same as `fetchQuery` but does not return data and does not throw. Fire-and-forget cache warming.

```typescript
await queryClient.prefetchQuery({
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  staleTime?: number,
  gcTime?: number,
})
```

```typescript
// Prefetch on hover
function ProductLink({ id }: { id: number }) {
  const queryClient = useQueryClient()

  const prefetch = () => {
    queryClient.prefetchQuery({
      queryKey: ['products', id],
      queryFn: () => fetchProduct(id),
      staleTime: 5 * 60 * 1000,
    })
  }

  return <Link onMouseEnter={prefetch} to={`/products/${id}`}>View</Link>
}
```

---

### `ensureQueryData`

Returns cached data if it exists, otherwise calls `fetchQuery`. Useful in loaders and server components.

```typescript
const data = await queryClient.ensureQueryData<TData>({
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  staleTime?: number,
  revalidateIfStale?: boolean,  // default: true
})
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `queryKey` | `QueryKey` | -- | Cache key |
| `queryFn` | `QueryFunction<TData>` | -- | Fetch function (called only if no cache) |
| `staleTime` | `number` | `0` | Data freshness threshold |
| `revalidateIfStale` | `boolean` | `true` | Trigger background refetch if data is stale |

```typescript
// In a route loader
async function loader({ params }: LoaderArgs) {
  return queryClient.ensureQueryData({
    queryKey: ['users', params.id],
    queryFn: () => fetchUser(params.id),
  })
}
```

---

### `getQueryData`

Synchronously get cached data. Returns `undefined` if query does not exist.

```typescript
const data = queryClient.getQueryData<TData>(queryKey: QueryKey): TData | undefined
```

```typescript
const user = queryClient.getQueryData<User>(['users', userId])
```

---

### `getQueriesData`

Get data for multiple queries matching a filter.

```typescript
const entries = queryClient.getQueriesData<TData>({
  queryKey?: QueryKey,
  exact?: boolean,
  predicate?: (query: Query) => boolean,
}): [QueryKey, TData | undefined][]
```

```typescript
// Get all user queries
const allUsers = queryClient.getQueriesData<User>({ queryKey: ['users'] })
// Returns: [['users', 1], userData1], [['users', 2], userData2], ...]
```

---

### `setQueryData`

Synchronously set cached data. Triggers re-renders on subscribing components.

```typescript
queryClient.setQueryData<TData>(
  queryKey: QueryKey,
  updater: TData | ((oldData: TData | undefined) => TData | undefined),
): TData | undefined
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `queryKey` | `QueryKey` | Cache key to update |
| `updater` | `TData \| (old => TData)` | New data or updater function |

```typescript
// Direct set
queryClient.setQueryData(['users', userId], newUser)

// Functional update (safe for concurrent)
queryClient.setQueryData<User>(['users', userId], (old) =>
  old ? { ...old, name: 'Updated Name' } : old
)
```

**Important:** If `updater` function returns `undefined`, the query data is not updated.

---

### `setQueriesData`

Set data for multiple queries matching a filter.

```typescript
queryClient.setQueriesData<TData>(
  filters: { queryKey?: QueryKey; exact?: boolean; predicate?: (query: Query) => boolean },
  updater: TData | ((oldData: TData | undefined) => TData | undefined),
): [QueryKey, TData | undefined][]
```

```typescript
// Mark all todos as read
queryClient.setQueriesData<Todo[]>(
  { queryKey: ['todos'] },
  (old) => old?.map(todo => ({ ...todo, read: true }))
)
```

---

### `getQueryState`

Get the full query state (not just data). Includes status, error, timestamps.

```typescript
const state = queryClient.getQueryState<TData, TError>(
  queryKey: QueryKey,
): QueryState<TData, TError> | undefined
```

```typescript
const state = queryClient.getQueryState(['users', userId])
// state?.status, state?.error, state?.dataUpdatedAt, state?.fetchStatus
```

---

## Query Lifecycle Methods

### `invalidateQueries`

Mark queries as stale and optionally refetch active ones. **Primary cache invalidation method.**

```typescript
await queryClient.invalidateQueries({
  queryKey?: QueryKey,
  exact?: boolean,
  predicate?: (query: Query) => boolean,
  refetchType?: 'active' | 'inactive' | 'all' | 'none',
  type?: 'active' | 'inactive' | 'all',
})
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `queryKey` | `QueryKey` | -- | Match queries by key prefix |
| `exact` | `boolean` | `false` | Exact key match only |
| `predicate` | `(query) => boolean` | -- | Custom filter function |
| `refetchType` | `'active' \| 'inactive' \| 'all' \| 'none'` | `'active'` | Which queries to refetch |
| `type` | `'active' \| 'inactive' \| 'all'` | `'all'` | Which queries to invalidate |

```typescript
// Invalidate all user queries
await queryClient.invalidateQueries({ queryKey: ['users'] })

// Invalidate exact key only
await queryClient.invalidateQueries({ queryKey: ['users', 1], exact: true })

// Invalidate without refetching
await queryClient.invalidateQueries({
  queryKey: ['users'],
  refetchType: 'none',
})

// Custom predicate
await queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'todos' &&
    (query.queryKey[1] as { status?: string })?.status === 'done',
})
```

---

### `refetchQueries`

Force refetch queries (regardless of staleness).

```typescript
await queryClient.refetchQueries({
  queryKey?: QueryKey,
  exact?: boolean,
  predicate?: (query: Query) => boolean,
  type?: 'active' | 'inactive' | 'all',
})
```

```typescript
// Refetch all active queries
await queryClient.refetchQueries({ type: 'active' })

// Refetch specific query
await queryClient.refetchQueries({ queryKey: ['users'], exact: true })
```

---

### `cancelQueries`

Cancel in-flight queries. Useful for optimistic updates.

```typescript
await queryClient.cancelQueries({
  queryKey?: QueryKey,
  exact?: boolean,
  predicate?: (query: Query) => boolean,
})
```

```typescript
// Cancel before optimistic update
await queryClient.cancelQueries({ queryKey: ['todos', todoId] })
```

---

### `removeQueries`

Remove queries from cache entirely. Unlike `invalidateQueries`, this deletes the data.

```typescript
queryClient.removeQueries({
  queryKey?: QueryKey,
  exact?: boolean,
  predicate?: (query: Query) => boolean,
})
```

```typescript
// Remove user data on logout
queryClient.removeQueries({ queryKey: ['users'] })
```

---

### `resetQueries`

Reset queries to their initial state. If query has `initialData`, it is restored.

```typescript
await queryClient.resetQueries({
  queryKey?: QueryKey,
  exact?: boolean,
  predicate?: (query: Query) => boolean,
})
```

---

## Utility Methods

### `isFetching`

Return number of currently fetching queries.

```typescript
const count = queryClient.isFetching({
  queryKey?: QueryKey,
  exact?: boolean,
  predicate?: (query: Query) => boolean,
}): number
```

### `isMutating`

Return number of currently running mutations.

```typescript
const count = queryClient.isMutating({
  mutationKey?: MutationKey,
  predicate?: (mutation: Mutation) => boolean,
}): number
```

### `clear`

Clear all cache entries. Removes all queries and mutations.

```typescript
queryClient.clear()
```

### `getDefaultOptions` / `setDefaultOptions`

```typescript
const defaults = queryClient.getDefaultOptions()
queryClient.setDefaultOptions({ queries: { staleTime: 60000 } })
```

### `getQueryDefaults` / `setQueryDefaults`

Set default options for queries matching a key prefix.

```typescript
queryClient.setQueryDefaults(['users'], {
  staleTime: 5 * 60 * 1000,
  gcTime: 10 * 60 * 1000,
})

const defaults = queryClient.getQueryDefaults(['users'])
```

---

## Infinite Query Methods

### `prefetchInfiniteQuery`

```typescript
await queryClient.prefetchInfiniteQuery({
  queryKey: QueryKey,
  queryFn: QueryFunction<TData>,
  initialPageParam: TPageParam,
  getNextPageParam: (lastPage, allPages) => TPageParam | undefined,
  pages?: number,
})
```

```typescript
await queryClient.prefetchInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: '',
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  pages: 3,
})
```

### `fetchInfiniteQuery`

Same as `prefetchInfiniteQuery` but returns the data and throws on error.

---

## Method Comparison

| Method | Returns Data | Throws | Triggers Refetch | Use Case |
|--------|-------------|--------|-----------------|----------|
| `fetchQuery` | Yes | Yes | If stale | Need data imperatively |
| `prefetchQuery` | No | No | If stale | Warm cache |
| `ensureQueryData` | Yes | Yes | If stale (configurable) | Loaders, SSR |
| `getQueryData` | Yes (sync) | No | No | Read cache only |
| `invalidateQueries` | No | No | Active queries | After mutations |
| `refetchQueries` | No | No | Matched queries | Force refresh |
| `removeQueries` | No | No | No | Clear cache entries |
| `resetQueries` | No | No | Active queries | Restore initial state |

---

**Source:** https://tanstack.com/query/latest/docs/reference/QueryClient
**Version:** 5.x (^5.62.11)
