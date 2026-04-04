---
name: react-query
version: "5.96.2"
description: "@tanstack/react-query v5 server state - useQuery, useMutation, useInfiniteQuery, useSuspenseQuery, QueryClient, queryOptions, caching, invalidation"
when_to_use: "fetching API data, managing server state, implementing pagination, or cache management"
---

# TanStack React Query v5

> Server state management with automatic caching, background refetching, deduplication, and stale-while-revalidate strategy.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Fetching data from APIs with `useQuery` or `useSuspenseQuery`
- Creating/updating/deleting data with `useMutation`
- Implementing pagination or infinite scroll with `useInfiniteQuery`
- Setting up caching, stale time, or garbage collection
- Implementing optimistic updates or query invalidation

---

## Critical Rules

**ALWAYS:**
1. Use array format for query keys -- `['users', userId]` enables hierarchical invalidation
2. Set appropriate `staleTime` -- default is `0` which means data is immediately stale
3. Invalidate queries after mutations -- keeps UI in sync with server
4. Handle `isPending`, `isError`, `data` states -- provide good UX
5. Include all variables in query key -- ensures correct caching per parameter
6. Use `queryOptions` helper to co-locate queryKey + queryFn for type safety and reuse

**NEVER:**
1. Fetch in useEffect -- use `useQuery` for automatic caching, deduping, retries
2. Forget `enabled` option when query depends on other data -- prevents premature fetching
3. Call `mutate()` in render body -- triggers infinite loops
4. Use string query keys -- arrays allow hierarchical matching and invalidation
5. Create multiple QueryClient instances -- export a single shared instance
6. Use `onSuccess`/`onError`/`onSettled` on useQuery -- removed in v5, use useEffect instead

---

## Core Patterns

### Basic Query with Types

```typescript
import { useQuery } from '@tanstack/react-query'

interface User { id: string; name: string }

function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
    staleTime: 5 * 60 * 1000,
  })
}

const { data: users, isPending, isError, error } = useUsers()
```

### Query with Parameters

```typescript
function useUser(id: string) {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()),
    enabled: !!id,
  })
}
```

### Type-Safe queryOptions Helper

```typescript
import { queryOptions, useQuery } from '@tanstack/react-query'

function userOptions(id: string) {
  return queryOptions({
    queryKey: ['users', id],
    queryFn: () => fetch(`/api/users/${id}`).then(r => r.json()) as Promise<User>,
    staleTime: 5 * 60 * 1000,
  })
}

// Fully typed across useQuery, prefetchQuery, ensureQueryData
useQuery(userOptions('1'))
queryClient.prefetchQuery(userOptions('1'))
queryClient.ensureQueryData(userOptions('1'))
```

### Mutation with Invalidation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (newUser: CreateUserInput) =>
      fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      }).then(r => r.json()),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['users'] })
    },
  })
}
```

### Optimistic Update

```typescript
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos', newTodo.id] })
    const previous = queryClient.getQueryData(['todos', newTodo.id])
    queryClient.setQueryData(['todos', newTodo.id], newTodo)
    return { previous }
  },
  onError: (_err, newTodo, context) => {
    queryClient.setQueryData(['todos', newTodo.id], context?.previous)
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] })
  },
})
```

---

## Anti-Patterns

**BAD** -- Fetching in useEffect:
```typescript
useEffect(() => {
  fetch('/api/users').then(setUsers)
}, [])
```

**GOOD** -- Using useQuery:
```typescript
const { data, isPending, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
})
```

**BAD** -- String query key:
```typescript
useQuery({ queryKey: 'users', queryFn: fetchUsers })
```

**GOOD** -- Array query key:
```typescript
useQuery({ queryKey: ['users'], queryFn: fetchUsers })
```

**BAD** -- Using removed onSuccess callback on useQuery (v5):
```typescript
useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
  onSuccess: (data) => { /* removed in v5 */ },
})
```

**GOOD** -- Using useEffect for side effects:
```typescript
const { data } = useQuery({ queryKey: ['users'], queryFn: fetchUsers })
useEffect(() => {
  if (data) { /* handle data */ }
}, [data])
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Fetch data | `useQuery` | `useQuery({ queryKey, queryFn })` |
| Mutate data | `useMutation` | `useMutation({ mutationFn, onSuccess })` |
| Infinite list | `useInfiniteQuery` | `useInfiniteQuery({ queryKey, queryFn, getNextPageParam, initialPageParam })` |
| Suspense query | `useSuspenseQuery` | `useSuspenseQuery({ queryKey, queryFn })` |
| Get client | `useQueryClient()` | `const qc = useQueryClient()` |
| Invalidate | `invalidateQueries` | `qc.invalidateQueries({ queryKey: ['users'] })` |
| Prefetch | `prefetchQuery` | `qc.prefetchQuery({ queryKey, queryFn })` |
| Set cache | `setQueryData` | `qc.setQueryData(['user', id], data)` |
| Get cache | `getQueryData` | `qc.getQueryData(['user', id])` |
| Remove cache | `removeQueries` | `qc.removeQueries({ queryKey: ['users'] })` |
| Cancel | `cancelQueries` | `qc.cancelQueries({ queryKey: ['users'] })` |
| Conditional | `enabled` | `enabled: !!id` |
| Fresh duration | `staleTime` | `staleTime: 5 * 60 * 1000` |
| Cache lifetime | `gcTime` | `gcTime: 30 * 60 * 1000` |
| Type-safe options | `queryOptions` | `queryOptions({ queryKey, queryFn })` |
| Mutation options | `mutationOptions` | `mutationOptions({ mutationFn })` |
| Mutation state | `useMutationState` | `useMutationState({ filters: { mutationKey } })` |
| Fetching count | `useIsFetching` | `const count = useIsFetching()` |
| Mutating count | `useIsMutating` | `const count = useIsMutating()` |
| Server detection | `environmentManager` | `environmentManager.setIsServer(false)` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Core concepts and architecture | [01-overview.md](01-overview.md) |
| Setup and QueryClientProvider | [02-installation-setup.md](02-installation-setup.md) |
| useQuery all options and patterns | [03-api-usequery.md](03-api-usequery.md) |
| useMutation and optimistic updates | [04-api-usemutation.md](04-api-usemutation.md) |
| useInfiniteQuery and pagination | [05-api-infinitequery.md](05-api-infinitequery.md) |
| QueryClient methods reference | [06-api-queryclient.md](06-api-queryclient.md) |
| Query key patterns and factories | [07-guide-query-keys.md](07-guide-query-keys.md) |
| Advanced patterns and best practices | [08-guide-advanced.md](08-guide-advanced.md) |

---

**Version:** 5.96.2 | **Source:** https://tanstack.com/query/latest
