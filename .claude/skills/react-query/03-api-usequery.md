# useQuery: Data Fetching Hook

**Module:** `03-api-usequery.md` | **Version:** 5.96.2

---

## Function Signature

```typescript
function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData>,
): UseQueryResult<TData, TError>
```

---

## All Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `queryKey` | `QueryKey` (readonly array) | Yes | -- | Unique cache identifier |
| `queryFn` | `(context: QueryFunctionContext) => Promise<TQueryFnData>` | Yes | -- | Async fetch function |
| `enabled` | `boolean` | No | `true` | Enable/disable auto-fetching |
| `staleTime` | `number \| Infinity` | No | `0` | Ms before data becomes stale |
| `gcTime` | `number \| Infinity` | No | `300000` (5 min) | Ms before unused cache is garbage collected |
| `retry` | `boolean \| number \| (failureCount, error) => boolean` | No | `3` | Retry count or function |
| `retryDelay` | `number \| (attempt, error) => number` | No | Exponential backoff | Ms delay between retries |
| `refetchInterval` | `number \| false \| (query) => number \| false` | No | `false` | Auto-refetch interval (ms) |
| `refetchIntervalInBackground` | `boolean` | No | `false` | Continue interval when tab hidden |
| `refetchOnMount` | `boolean \| 'always'` | No | `true` | Refetch on mount if stale |
| `refetchOnWindowFocus` | `boolean \| 'always'` | No | `true` | Refetch on window focus if stale |
| `refetchOnReconnect` | `boolean \| 'always'` | No | `true` | Refetch on reconnect if stale |
| `select` | `(data: TQueryFnData) => TData` | No | -- | Transform/select data |
| `placeholderData` | `TData \| (previousData, previousQuery) => TData` | No | -- | Placeholder while pending |
| `initialData` | `TQueryFnData \| () => TQueryFnData` | No | -- | Initial data (treated as fresh if `staleTime` not passed) |
| `initialDataUpdatedAt` | `number \| () => number` | No | -- | Timestamp of initialData |
| `networkMode` | `'online' \| 'always' \| 'offlineFirst'` | No | `'online'` | Network behavior |
| `throwOnError` | `boolean \| (error, query) => boolean` | No | `false` | Throw to error boundary |
| `meta` | `Record<string, unknown>` | No | -- | Metadata accessible in queryFn context |
| `queryKeyHashFn` | `(queryKey) => string` | No | -- | Custom key hashing |
| `structuralSharing` | `boolean \| (oldData, newData) => TData` | No | `true` | Structural sharing for referential stability |
| `notifyOnChangeProps` | `string[] \| 'all'` | No | -- | Only re-render when specific return properties change |

**Removed in v5:** `onSuccess`, `onError`, `onSettled` callbacks -- use `useEffect` for side effects. `keepPreviousData` -- use `placeholderData: (prev) => prev`. `cacheTime` -- renamed to `gcTime`. `isInitialLoading` -- use `isLoading` (= `isPending && isFetching`).

---

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `data` | `TData \| undefined` | Fetched data (undefined if pending/error) |
| `error` | `TError \| null` | Error object if failed |
| `status` | `'pending' \| 'error' \| 'success'` | Query status |
| `isPending` | `boolean` | First load, no data yet |
| `isLoading` | `boolean` | `isPending && isFetching` (first load with active fetch) |
| `isError` | `boolean` | Query errored |
| `isSuccess` | `boolean` | Query succeeded |
| `fetchStatus` | `'fetching' \| 'idle' \| 'paused'` | Network state |
| `isFetching` | `boolean` | Currently fetching (includes background refetches) |
| `isRefetching` | `boolean` | Background refetch in progress |
| `isStale` | `boolean` | Data is stale |
| `isPlaceholderData` | `boolean` | Using placeholder data |
| `dataUpdatedAt` | `number` | Timestamp of last successful fetch |
| `errorUpdatedAt` | `number` | Timestamp of last error |
| `failureCount` | `number` | Number of consecutive failures |
| `failureReason` | `TError \| null` | Reason for last failure |
| `refetch` | `(options?) => Promise<QueryObserverResult>` | Manually refetch |

### Status vs fetchStatus

| | `fetchStatus: 'fetching'` | `fetchStatus: 'paused'` | `fetchStatus: 'idle'` |
|---|---|---|---|
| `status: 'pending'` | First load in progress | First load paused (offline) | Disabled query |
| `status: 'error'` | Retrying / refetching | Paused retry | Idle with error |
| `status: 'success'` | Background refetch | Background refetch paused | Fresh data, idle |

---

## Code Examples

### Basic Query

```typescript
import { useQuery } from '@tanstack/react-query'

interface Todo {
  id: number
  title: string
  completed: boolean
}

function TodoList() {
  const { data: todos, isPending, error } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await fetch('/api/todos')
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })

  if (isPending) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  )
}
```

### Dependent (Serial) Queries

```typescript
function UserPosts({ userId }: { userId: string | null }) {
  const userQuery = useQuery<User>({
    queryKey: ['users', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
    enabled: !!userId,
  })

  const postsQuery = useQuery<Post[]>({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => fetch(`/api/users/${userId}/posts`).then(r => r.json()),
    enabled: !!userQuery.data?.id, // Wait for user data
  })

  return <div>{postsQuery.data?.length} posts</div>
}
```

### Data Selection

```typescript
function PostTitle({ postId }: { postId: number }) {
  const { data: title } = useQuery({
    queryKey: ['posts', postId],
    queryFn: (): Promise<Post> =>
      fetch(`/api/posts/${postId}`).then(r => r.json()),
    select: (post) => post.title, // Only re-render when title changes
  })

  return <h1>{title}</h1>
}
```

### Placeholder Data (Previous Query)

```typescript
function SearchPosts({ searchTerm }: { searchTerm: string }) {
  const { data, isPlaceholderData } = useQuery({
    queryKey: ['posts', 'search', searchTerm],
    queryFn: () =>
      fetch(`/api/posts/search?q=${searchTerm}`).then(r => r.json()),
    placeholderData: (previousData) => previousData, // Show previous results
  })

  return (
    <div style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
      {data?.map((post: Post) => <div key={post.id}>{post.title}</div>)}
    </div>
  )
}
```

### Using keepPreviousData Helper

```typescript
import { useQuery, keepPreviousData } from '@tanstack/react-query'

function PaginatedList({ page }: { page: number }) {
  const { data, isPlaceholderData } = useQuery({
    queryKey: ['items', page],
    queryFn: () => fetchItems(page),
    placeholderData: keepPreviousData, // Built-in identity function
  })

  return <div style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>{/* ... */}</div>
}
```

### Polling with refetchInterval

```typescript
function LiveDashboard() {
  const { data } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () => fetch('/api/stats').then(r => r.json()),
    refetchInterval: 5000,
    refetchIntervalInBackground: true,
  })

  return <div>{JSON.stringify(data)}</div>
}
```

### Manual Refetch

```typescript
function TodoList() {
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['todos'],
    queryFn: fetchTodos,
    refetchOnWindowFocus: false,
  })

  return (
    <div>
      <button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? 'Refreshing...' : 'Refresh'}
      </button>
    </div>
  )
}
```

### Error Handling with Retries

```typescript
const { data, error, refetch } = useQuery({
  queryKey: ['todos'],
  queryFn: async () => {
    const res = await fetch('/api/todos')
    if (!res.ok) throw new Error((await res.json()).message)
    return res.json()
  },
  retry: 3,
  retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
})

if (error) {
  return (
    <div>
      Error: {error.message}
      <button onClick={() => refetch()}>Retry</button>
    </div>
  )
}
```

### Side Effects (v5 Pattern)

```typescript
function UserProfile({ userId }: { userId: string }) {
  const { data, error } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  })

  // v5: use useEffect instead of removed onSuccess/onError
  useEffect(() => {
    if (data) {
      analytics.track('user_loaded', { userId })
    }
  }, [data, userId])

  useEffect(() => {
    if (error) {
      toast.error(`Failed to load user: ${error.message}`)
    }
  }, [error])

  return <div>{data?.name}</div>
}
```

---

## `useSuspenseQuery`

Same options as `useQuery` except `enabled`, `placeholderData`, and `throwOnError` are not available. Data is guaranteed to be defined.

```typescript
import { useSuspenseQuery } from '@tanstack/react-query'

function UserProfile({ userId }: { userId: string }) {
  // data is guaranteed to be defined (never undefined)
  const { data } = useSuspenseQuery<User>({
    queryKey: ['users', userId],
    queryFn: () => fetch(`/api/users/${userId}`).then(r => r.json()),
  })

  return <div>{data.name}</div> // No need to check undefined
}

// Must be wrapped in Suspense boundary
function App() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <UserProfile userId="1" />
    </Suspense>
  )
}
```

---

**Source:** https://tanstack.com/query/v5/docs/framework/react/reference/useQuery | https://tanstack.com/query/v5/docs/framework/react/reference/useSuspenseQuery
**Version:** 5.96.2
