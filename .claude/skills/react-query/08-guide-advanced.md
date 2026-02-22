# Advanced Patterns & Best Practices

**Module:** `08-guide-advanced.md` | **Version:** 5.x (^5.62.11)

---

## Dependent (Serial) Queries

Fetch one query only after another completes using `enabled`:

```typescript
function UserPosts({ userId }: { userId: string }) {
  const userQuery = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  })

  const postsQuery = useQuery({
    queryKey: ['users', userId, 'posts'],
    queryFn: () => fetchUserPosts(userId),
    enabled: !!userQuery.data,  // Only fetch when user loaded
  })

  if (userQuery.isPending) return <div>Loading user...</div>
  if (postsQuery.isPending) return <div>Loading posts...</div>

  return <div>{postsQuery.data?.map(/* ... */)}</div>
}
```

Chain multiple dependencies:

```typescript
const { data: user } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),
})

const { data: org } = useQuery({
  queryKey: ['orgs', user?.orgId],
  queryFn: () => fetchOrg(user!.orgId),
  enabled: !!user?.orgId,
})

const { data: members } = useQuery({
  queryKey: ['orgs', user?.orgId, 'members'],
  queryFn: () => fetchOrgMembers(user!.orgId),
  enabled: !!org,
})
```

---

## Parallel Queries

Independent queries run in parallel automatically:

```typescript
function Dashboard() {
  const usersQuery = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
  const projectsQuery = useQuery({ queryKey: ['projects'], queryFn: fetchProjects })
  const statsQuery = useQuery({ queryKey: ['stats'], queryFn: fetchStats })

  // All three fetch simultaneously
}
```

### `useQueries` for Dynamic Parallel Queries

When the number of queries is dynamic:

```typescript
import { useQueries } from '@tanstack/react-query'

function UserProfiles({ userIds }: { userIds: string[] }) {
  const queries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ['users', id],
      queryFn: () => fetchUser(id),
      staleTime: 5 * 60 * 1000,
    })),
  })

  const isLoading = queries.some((q) => q.isPending)
  const users = queries.map((q) => q.data).filter(Boolean)

  return <div>{users.map(/* ... */)}</div>
}
```

### `useQueries` with Combine

Transform results of multiple queries:

```typescript
const { data, pending } = useQueries({
  queries: userIds.map((id) => ({
    queryKey: ['users', id],
    queryFn: () => fetchUser(id),
  })),
  combine: (results) => ({
    data: results.map((r) => r.data).filter(Boolean),
    pending: results.some((r) => r.isPending),
  }),
})
```

---

## Retry Logic

### Default Behavior

Queries retry 3 times with exponential backoff. Mutations do not retry by default.

### Custom Retry

```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  retry: 3,
  retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
})
```

### Conditional Retry

```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  retry: (failureCount, error) => {
    // Don't retry on 404 or 401
    if (error instanceof HttpError && [401, 404].includes(error.status)) {
      return false
    }
    return failureCount < 3
  },
})
```

### Mutation Retry

```typescript
useMutation({
  mutationFn: createUser,
  retry: 1,  // Retry once on failure (default is 0)
  retryDelay: 1000,
})
```

---

## Error Handling

### Per-Query Error Handling

```typescript
function UserProfile({ userId }: { userId: string }) {
  const { data, error, isError, refetch } = useQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  })

  if (isError) {
    return (
      <div>
        <p>Error: {error.message}</p>
        <button onClick={() => refetch()}>Retry</button>
      </div>
    )
  }

  return <div>{data?.name}</div>
}
```

### Error Boundary Integration

```typescript
// Throw errors to React error boundary
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  throwOnError: true,
})

// Conditional throwing
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  throwOnError: (error) => error.status >= 500,
})
```

### Global Error Handler

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      throwOnError: (error) => {
        // Only throw server errors to boundary
        return error instanceof HttpError && error.status >= 500
      },
    },
  },
})
```

### Mutation Error with Toast

```typescript
const mutation = useMutation({
  mutationFn: createTodo,
  onError: (error) => {
    toast.error(`Failed to create: ${error.message}`)
  },
})
```

---

## Optimistic Updates

### Pattern: Cancel, Snapshot, Update, Rollback

```typescript
function useUpdateTodo() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updated: Todo) =>
      fetch(`/api/todos/${updated.id}`, {
        method: 'PUT',
        body: JSON.stringify(updated),
      }).then(r => r.json()),

    onMutate: async (newTodo) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos', newTodo.id] })

      // 2. Snapshot previous value
      const previous = queryClient.getQueryData<Todo>(['todos', newTodo.id])

      // 3. Optimistically update cache
      queryClient.setQueryData<Todo>(['todos', newTodo.id], newTodo)

      // 4. Return rollback context
      return { previous }
    },

    onError: (_err, newTodo, context) => {
      // Rollback on failure
      if (context?.previous) {
        queryClient.setQueryData(['todos', newTodo.id], context.previous)
      }
    },

    onSettled: (_data, _error, newTodo) => {
      // Always refetch to confirm server state
      queryClient.invalidateQueries({ queryKey: ['todos', newTodo.id] })
    },
  })
}
```

### List Optimistic Update (Add Item)

```typescript
useMutation({
  mutationFn: createTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos'] })
    const previous = queryClient.getQueryData<Todo[]>(['todos'])

    queryClient.setQueryData<Todo[]>(['todos'], (old) => [
      ...(old ?? []),
      { ...newTodo, id: Date.now() },  // Temp ID
    ])

    return { previous }
  },
  onError: (_err, _newTodo, context) => {
    queryClient.setQueryData(['todos'], context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

---

## Polling and Real-Time

### Interval Polling

```typescript
useQuery({
  queryKey: ['notifications'],
  queryFn: fetchNotifications,
  refetchInterval: 10_000,  // Every 10 seconds
  refetchIntervalInBackground: false,  // Pause when tab hidden
})
```

### Dynamic Interval

```typescript
useQuery({
  queryKey: ['job', jobId],
  queryFn: () => fetchJobStatus(jobId),
  refetchInterval: (query) => {
    // Stop polling when job completes
    if (query.state.data?.status === 'completed') return false
    return 2000  // Poll every 2s while running
  },
})
```

### WebSocket + Invalidation

```typescript
useEffect(() => {
  const ws = new WebSocket('wss://api.example.com/ws')

  ws.onmessage = (event) => {
    const update = JSON.parse(event.data)
    if (update.type === 'todo_updated') {
      queryClient.invalidateQueries({ queryKey: ['todos', update.id] })
    }
  }

  return () => ws.close()
}, [queryClient])
```

---

## Suspense Integration

### `useSuspenseQuery`

Data is guaranteed defined. Must wrap in `<Suspense>` boundary.

```typescript
import { useSuspenseQuery } from '@tanstack/react-query'

function UserProfile({ userId }: { userId: string }) {
  const { data } = useSuspenseQuery({
    queryKey: ['users', userId],
    queryFn: () => fetchUser(userId),
  })

  // data is guaranteed defined
  return <div>{data.name}</div>
}

// Parent
function App() {
  return (
    <Suspense fallback={<Spinner />}>
      <ErrorBoundary fallback={<Error />}>
        <UserProfile userId="1" />
      </ErrorBoundary>
    </Suspense>
  )
}
```

### `useSuspenseQueries` for Parallel Suspense

```typescript
import { useSuspenseQueries } from '@tanstack/react-query'

function Dashboard() {
  const [users, projects] = useSuspenseQueries({
    queries: [
      { queryKey: ['users'], queryFn: fetchUsers },
      { queryKey: ['projects'], queryFn: fetchProjects },
    ],
  })

  // Both guaranteed defined
  return <div>{users.data.length} users, {projects.data.length} projects</div>
}
```

**Options NOT available on Suspense hooks:** `enabled`, `placeholderData`, `throwOnError`.

---

## Placeholder and Initial Data

### `placeholderData` -- Show Previous Results

```typescript
function SearchResults({ query }: { query: string }) {
  const { data, isPlaceholderData } = useQuery({
    queryKey: ['search', query],
    queryFn: () => search(query),
    placeholderData: (previousData) => previousData,
  })

  return (
    <div style={{ opacity: isPlaceholderData ? 0.5 : 1 }}>
      {data?.map(/* ... */)}
    </div>
  )
}
```

### `initialData` -- Pre-populate from Cache

```typescript
function TodoDetail({ todoId }: { todoId: number }) {
  const { data } = useQuery({
    queryKey: ['todos', todoId],
    queryFn: () => fetchTodo(todoId),
    initialData: () => {
      // Pre-populate from list cache
      return queryClient
        .getQueryData<Todo[]>(['todos'])
        ?.find(t => t.id === todoId)
    },
    initialDataUpdatedAt: () =>
      queryClient.getQueryState(['todos'])?.dataUpdatedAt,
  })
}
```

---

## Performance Best Practices

### 1. Set Appropriate `staleTime`

```typescript
// Data that rarely changes
useQuery({ queryKey: ['config'], queryFn: fetchConfig, staleTime: Infinity })

// Data that changes occasionally
useQuery({ queryKey: ['users'], queryFn: fetchUsers, staleTime: 5 * 60 * 1000 })

// Real-time data
useQuery({ queryKey: ['prices'], queryFn: fetchPrices, staleTime: 0 })
```

### 2. Use `select` to Narrow Subscriptions

```typescript
// Only re-render when count changes, not full array
const { data: todoCount } = useQuery({
  queryKey: ['todos'],
  queryFn: fetchTodos,
  select: (todos) => todos.length,
})
```

### 3. Prefetch Before Navigation

```typescript
// Prefetch on hover
queryClient.prefetchQuery({
  queryKey: ['users', nextUserId],
  queryFn: () => fetchUser(nextUserId),
})
```

### 4. Use `gcTime` to Control Memory

```typescript
// Short-lived cache for large datasets
useQuery({
  queryKey: ['analytics', dateRange],
  queryFn: () => fetchAnalytics(dateRange),
  gcTime: 60 * 1000,  // Remove from memory after 1 minute unused
})
```

### 5. Avoid Over-Fetching

```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  refetchOnWindowFocus: false,   // Skip window focus refetch
  refetchOnReconnect: false,     // Skip reconnect refetch
  staleTime: 10 * 60 * 1000,    // Keep fresh 10 minutes
})
```

---

## Common Pitfalls

| Pitfall | Problem | Fix |
|---------|---------|-----|
| Missing variables in key | Stale/shared cache | Include all variables in queryKey |
| `enabled: false` forever | Query never fetches | Ensure condition eventually becomes true |
| `mutate()` in render | Infinite loop | Call in event handler or useEffect |
| New `queryFn` each render | Unnecessary refetches | Stabilize with useCallback or extract |
| Forgetting `onSettled` | Optimistic UI stuck | Always invalidate in onSettled |
| `staleTime: 0` (default) | Too many refetches | Set appropriate staleTime per query |

---

**Source:** https://tanstack.com/query/v5/docs/react/guides/dependent-queries | https://tanstack.com/query/v5/docs/react/guides/parallel-queries | https://tanstack.com/query/v5/docs/react/guides/optimistic-updates
**Version:** 5.x (^5.62.11)
