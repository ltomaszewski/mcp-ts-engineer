---
name: react-query
description: "@tanstack/react-query (TanStack Query) data fetching - useQuery, useMutation, caching, invalidation. Use when working with @tanstack/react-query, TanStack Query, fetching API data, or managing server state."
---

# React Query (@tanstack/react-query)

> Server state management with automatic caching, background refetching, and stale-while-revalidate strategy.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Fetching data from APIs with `useQuery`
- Creating/updating/deleting with `useMutation`
- Setting up caching or stale time configuration
- Implementing query invalidation after mutations
- Adding optimistic updates

---

## Critical Rules

**ALWAYS:**
1. Use array format for query keys — `['users', userId]` enables proper invalidation
2. Set appropriate `staleTime` — prevents unnecessary refetches (default is 0)
3. Invalidate queries after mutations — keeps data in sync
4. Handle `isLoading`, `isError`, `data` states — provide good UX

**NEVER:**
1. Use string query keys — arrays allow hierarchical invalidation
2. Fetch in useEffect — use `useQuery` for automatic caching/deduping
3. Forget `enabled` option — prevents queries from running before deps are ready
4. Call `mutate` in render — triggers infinite loops

---

## Core Patterns

### Basic Query with Types

```typescript
import { useQuery } from '@tanstack/react-query';

interface User {
  id: string;
  name: string;
}

function useUsers() {
  return useQuery<User[]>({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then(res => res.json()),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

// Usage
const { data: users, isLoading, isError, error } = useUsers();
```

### Query with Parameters

```typescript
function useUser(id: string) {
  return useQuery<User>({
    queryKey: ['users', id],
    queryFn: () => fetch(`/api/users/${id}`).then(res => res.json()),
    enabled: !!id, // Only run when id exists
  });
}
```

### Mutation with Invalidation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (newUser: CreateUserInput) =>
      fetch('/api/users', {
        method: 'POST',
        body: JSON.stringify(newUser),
      }).then(res => res.json()),
    onSuccess: () => {
      // Invalidate and refetch users list
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
}

// Usage
const { mutate, isPending, isError } = useCreateUser();
mutate({ name: 'John' });
```

### Optimistic Update

```typescript
useMutation({
  mutationFn: updateTodo,
  onMutate: async (newTodo) => {
    await queryClient.cancelQueries({ queryKey: ['todos', newTodo.id] });
    const previousTodo = queryClient.getQueryData(['todos', newTodo.id]);
    queryClient.setQueryData(['todos', newTodo.id], newTodo);
    return { previousTodo };
  },
  onError: (err, newTodo, context) => {
    queryClient.setQueryData(['todos', newTodo.id], context?.previousTodo);
  },
  onSettled: () => {
    queryClient.invalidateQueries({ queryKey: ['todos'] });
  },
});
```

---

## Anti-Patterns

**BAD** — String query key:
```typescript
useQuery({ queryKey: 'users', ... }) // Can't invalidate hierarchically
```

**GOOD** — Array query key:
```typescript
useQuery({ queryKey: ['users'], ... })
useQuery({ queryKey: ['users', userId], ... }) // Child of ['users']
```

**BAD** — Fetching in useEffect:
```typescript
useEffect(() => {
  fetch('/api/users').then(setUsers);
}, []); // No caching, no loading state, no error handling
```

**GOOD** — Using useQuery:
```typescript
const { data, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: fetchUsers,
});
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Fetch data | `useQuery` | `useQuery({ queryKey, queryFn })` |
| Mutate data | `useMutation` | `useMutation({ mutationFn, onSuccess })` |
| Get client | `useQueryClient()` | `const qc = useQueryClient()` |
| Invalidate | `invalidateQueries` | `qc.invalidateQueries({ queryKey: ['users'] })` |
| Prefetch | `prefetchQuery` | `qc.prefetchQuery({ queryKey, queryFn })` |
| Set data | `setQueryData` | `qc.setQueryData(['user', id], user)` |
| Get data | `getQueryData` | `qc.getQueryData(['user', id])` |
| Conditional | `enabled` | `enabled: !!id` |
| Stale time | `staleTime` | `staleTime: 5 * 60 * 1000` |
| Cache time | `gcTime` | `gcTime: 30 * 60 * 1000` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Core concepts and architecture | [01-overview.md](01-overview.md) |
| Setup and QueryClientProvider | [02-installation-setup.md](02-installation-setup.md) |
| useQuery options and patterns | [03-api-usequery.md](03-api-usequery.md) |
| useMutation and optimistic updates | [04-api-usemutation.md](04-api-usemutation.md) |
| Query key patterns and invalidation | [09-guide-query-keys.md](09-guide-query-keys.md) |

---

**Version:** 5.x | **Source:** https://tanstack.com/query/latest
