# Query Keys: Design & Patterns

**Module:** `07-guide-query-keys.md` | **Version:** 5.x (^5.62.11)

---

## Fundamentals

Query keys are **readonly arrays** that uniquely identify cached data. They determine when queries share cache entries and how invalidation propagates.

```typescript
['todos']                                    // All todos
['todos', todoId]                           // Specific todo
['todos', { status: 'completed' }]          // Filtered todos
['users', userId, 'posts']                  // User's posts
```

Key comparison is **deep equality** (not reference). Object property order does not matter:

```typescript
// These are the SAME key
['todos', { status: 'done', page: 1 }]
['todos', { page: 1, status: 'done' }]
```

---

## Matching Rules

### Prefix (Partial) Match -- Default

`invalidateQueries` matches by prefix by default:

```typescript
queryClient.invalidateQueries({ queryKey: ['todos'] })
// Matches:
// ['todos']
// ['todos', 1]
// ['todos', 1, 'comments']
// ['todos', { status: 'active' }]
```

### Exact Match

```typescript
queryClient.invalidateQueries({ queryKey: ['todos'], exact: true })
// Matches ONLY: ['todos']
// Does NOT match: ['todos', 1]
```

### Predicate Match

```typescript
queryClient.invalidateQueries({
  predicate: (query) =>
    query.queryKey[0] === 'todos' &&
    (query.queryKey[1] as number) > 5,
})
```

---

## Hierarchical Key Design

Organize keys from general to specific, like a file path:

```typescript
// Entity > ID > Relationship > Filter
['users']                                    // List
['users', userId]                           // Detail
['users', userId, 'posts']                  // Relationship
['users', userId, 'posts', { page: 1 }]    // Filtered relationship
```

This enables scoped invalidation:

```typescript
// After user profile update -- invalidate user and all sub-queries
queryClient.invalidateQueries({ queryKey: ['users', userId] })

// After any user change -- invalidate all user queries
queryClient.invalidateQueries({ queryKey: ['users'] })
```

---

## Include All Variables

Every variable used in `queryFn` must appear in `queryKey`:

```typescript
// BAD -- userId not in key, wrong cache
useQuery({
  queryKey: ['user'],
  queryFn: () => fetchUser(userId),
})

// GOOD -- unique cache per userId
useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),
})
```

For filters, use an object:

```typescript
useQuery({
  queryKey: ['todos', { status, sortBy, page }],
  queryFn: () => fetchTodos({ status, sortBy, page }),
})
```

---

## Query Key Factory Pattern

Centralize key creation in a factory object for type safety and consistency:

```typescript
// lib/query-keys.ts
export const todoKeys = {
  all: ['todos'] as const,
  lists: () => [...todoKeys.all, 'list'] as const,
  list: (filters: TodoFilters) => [...todoKeys.lists(), filters] as const,
  details: () => [...todoKeys.all, 'detail'] as const,
  detail: (id: number) => [...todoKeys.details(), id] as const,
}
```

Usage:

```typescript
// Queries
useQuery({ queryKey: todoKeys.detail(1), queryFn: () => fetchTodo(1) })
useQuery({ queryKey: todoKeys.list({ status: 'active' }), queryFn: fetchActiveTodos })

// Invalidation
queryClient.invalidateQueries({ queryKey: todoKeys.lists() })  // All lists
queryClient.invalidateQueries({ queryKey: todoKeys.all })       // Everything
```

### Multi-Entity Factory

```typescript
export const queryKeys = {
  users: {
    all: ['users'] as const,
    lists: () => [...queryKeys.users.all, 'list'] as const,
    list: (filters: UserFilters) => [...queryKeys.users.lists(), filters] as const,
    details: () => [...queryKeys.users.all, 'detail'] as const,
    detail: (id: string) => [...queryKeys.users.details(), id] as const,
    posts: (userId: string) => [...queryKeys.users.detail(userId), 'posts'] as const,
  },

  posts: {
    all: ['posts'] as const,
    lists: () => [...queryKeys.posts.all, 'list'] as const,
    list: (filters: PostFilters) => [...queryKeys.posts.lists(), filters] as const,
    details: () => [...queryKeys.posts.all, 'detail'] as const,
    detail: (id: number) => [...queryKeys.posts.details(), id] as const,
  },
}
```

---

## Invalidation Strategies

### After Create Mutation

```typescript
useMutation({
  mutationFn: createTodo,
  onSuccess: () => {
    // Invalidate all list queries (re-fetches)
    queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
  },
})
```

### After Update Mutation

```typescript
useMutation({
  mutationFn: updateTodo,
  onSuccess: (data, variables) => {
    // Invalidate the specific detail
    queryClient.invalidateQueries({ queryKey: todoKeys.detail(variables.id) })
    // Also invalidate lists (may affect sort/filter)
    queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
  },
})
```

### After Delete Mutation

```typescript
useMutation({
  mutationFn: deleteTodo,
  onSuccess: (_data, todoId) => {
    // Remove specific detail from cache
    queryClient.removeQueries({ queryKey: todoKeys.detail(todoId) })
    // Invalidate lists
    queryClient.invalidateQueries({ queryKey: todoKeys.lists() })
  },
})
```

### Cascade Invalidation (User Logout)

```typescript
function logout() {
  // Remove all user-specific data
  queryClient.removeQueries({ queryKey: ['users'] })
  queryClient.removeQueries({ queryKey: ['todos'] })
  // Or clear everything
  queryClient.clear()
}
```

---

## TypeScript Patterns

### Typed Key Factory

```typescript
export const todoKeys = {
  all: ['todos'] as const,
  detail: (id: number) => ['todos', 'detail', id] as const,
} satisfies Record<string, readonly unknown[] | ((...args: never[]) => readonly unknown[])>
```

### Using `queryOptions` Helper (v5)

```typescript
import { queryOptions } from '@tanstack/react-query'

function todoDetailOptions(id: number) {
  return queryOptions({
    queryKey: todoKeys.detail(id),
    queryFn: () => fetchTodo(id),
    staleTime: 5 * 60 * 1000,
  })
}

// Usage -- fully typed
useQuery(todoDetailOptions(1))
await queryClient.prefetchQuery(todoDetailOptions(1))
await queryClient.ensureQueryData(todoDetailOptions(1))
```

The `queryOptions` helper ensures queryKey and queryFn stay co-located and type-safe across `useQuery`, `prefetchQuery`, and `ensureQueryData`.

---

## Anti-Patterns

### String Keys

```typescript
// BAD -- no partial matching, easy typos
useQuery({ queryKey: 'todos' as any, queryFn: fetchTodos })

// GOOD -- array
useQuery({ queryKey: ['todos'], queryFn: fetchTodos })
```

### Variables Outside Key

```typescript
// BAD -- stale cache for different filters
useQuery({
  queryKey: ['todos'],
  queryFn: () => fetchTodos({ status }),  // status not in key
})

// GOOD
useQuery({
  queryKey: ['todos', { status }],
  queryFn: () => fetchTodos({ status }),
})
```

### Duplicate Key Definitions

```typescript
// BAD -- keys defined inline, easy to drift
// Component A
useQuery({ queryKey: ['users', id], ... })
// Component B
queryClient.invalidateQueries({ queryKey: ['user', id] })  // Typo! "user" vs "users"

// GOOD -- use factory
useQuery({ queryKey: userKeys.detail(id), ... })
queryClient.invalidateQueries({ queryKey: userKeys.detail(id) })
```

---

## Summary

| Pattern | When | Example |
|---------|------|---------|
| Simple key | Single entity list | `['todos']` |
| Key with ID | Single entity detail | `['todos', id]` |
| Key with object | Filtered/sorted list | `['todos', { status, page }]` |
| Hierarchical | Nested relationships | `['users', id, 'posts']` |
| Factory | Medium-large apps | `todoKeys.detail(id)` |
| `queryOptions` | Type-safe reuse | `todoDetailOptions(id)` |
| Prefix invalidation | After mutations | `invalidateQueries({ queryKey: ['todos'] })` |
| Exact invalidation | Target one query | `invalidateQueries({ queryKey, exact: true })` |

---

**Source:** https://tanstack.com/query/v5/docs/react/guides/query-keys | https://tanstack.com/query/v5/docs/react/guides/query-invalidation
**Version:** 5.x (^5.62.11)
