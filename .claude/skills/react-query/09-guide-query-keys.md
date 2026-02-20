# 09 — Query Keys: Design & Patterns

**Module Summary**: Query key design patterns, hierarchical structure, dynamic keys with variables, key factories, matching rules (exact, partial, predicate), best practices, anti-patterns, and real-world e-commerce example. Critical for cache management and query invalidation.

**Source:** [https://tanstack.com/query/v5/docs/react/guides/important-defaults](https://tanstack.com/query/v5/docs/react/guides/important-defaults)

---

## Table of Contents
1. [Query Key Fundamentals](#query-key-fundamentals)
2. [Query Key Matching Rules](#query-key-matching-rules)
3. [Best Practice Patterns](#best-practice-patterns)
4. [Query Key Factory Pattern](#query-key-factory-pattern)
5. [Real-World Example: E-Commerce App](#real-world-example-e-commerce-app)
6. [Invalidation Patterns](#invalidation-patterns)
7. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
8. [TypeScript: Query Key Types](#typescript-query-key-types)
9. [Summary](#summary)

---

## Query Key Fundamentals

### What are Query Keys?

Query keys are **array-based identifiers** that uniquely identify cached queries:

```typescript
// Simple key
['todos']

// Key with variables
['todos', { status: 'completed' }]

// Hierarchical key
['users', userId, 'posts', postId]

// Key with complex objects
['search', { query: 'react', page: 1, sortBy: 'relevance' }]
```

### Why Arrays?

Arrays enable:
- **Hierarchical structure** — Parent-child relationships (`['users']` matches all user keys)
- **Partial matching** — Invalidate multiple queries at once
- **Type safety** — No string concatenation errors
- **Scalability** — Easy to organize complex key spaces

---

## Query Key Matching Rules

### Exact Match

```typescript
// These queries have DIFFERENT keys
useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
useQuery({ queryKey: ['todos', 1], queryFn: fetchTodo });

// Only first query is invalidated
queryClient.invalidateQueries({ queryKey: ['todos'], exact: true });
```

### Partial Match (Default)

```typescript
// These queries all match ['todos']:
useQuery({ queryKey: ['todos'] }); // ✅ exact match
useQuery({ queryKey: ['todos', 1] }); // ✅ partial match
useQuery({ queryKey: ['todos', 1, 'posts'] }); // ✅ partial match
useQuery({ queryKey: ['todos', 'archived'] }); // ✅ partial match

// Invalidate all at once
queryClient.invalidateQueries({ queryKey: ['todos'] });
```

### Predicate Function

```typescript
// Custom matching logic
queryClient.invalidateQueries({
  predicate: (query) => {
    return (
      query.queryKey[0] === 'todos' &&
      query.queryKey[1]?.status === 'completed'
    );
  },
});
```

---

## Best Practice Patterns

### 1. Hierarchical Structure

Organize keys like a file system:

```typescript
// ❌ Bad - Flat, hard to invalidate groups
useQuery({ queryKey: ['allTodos'], queryFn: fetchTodos });
useQuery({ queryKey: ['todoById1'], queryFn: () => fetchTodo(1) });
useQuery({ queryKey: ['todoById2'], queryFn: () => fetchTodo(2) });

// ✅ Good - Hierarchical
useQuery({ queryKey: ['todos'], queryFn: fetchTodos });
useQuery({ queryKey: ['todos', 1], queryFn: () => fetchTodo(1) });
useQuery({ queryKey: ['todos', 2], queryFn: () => fetchTodo(2) });

// Now invalidate all todos queries:
queryClient.invalidateQueries({ queryKey: ['todos'] });
```

### 2. Include Variables in Keys

Always include query variables:

```typescript
// ❌ Bad - Variable not in key, cache won't differentiate
const { data: user1 } = useQuery({
  queryKey: ['user'],
  queryFn: () => fetchUser(userId), // userId could change!
});

// ✅ Good - Variable in key
const { data: user } = useQuery({
  queryKey: ['users', userId],
  queryFn: () => fetchUser(userId),
});

// Different userId = different cache entry
```

### 3. Use Objects for Complex Filters

```typescript
// ❌ Bad - Order matters, hard to maintain
useQuery({
  queryKey: ['posts', status, sortBy, page, pageSize],
});

// ✅ Good - Explicit, order-independent
useQuery({
  queryKey: [
    'posts',
    { status, sortBy, page, pageSize },
  ],
  queryFn: () => fetchPosts({ status, sortBy, page, pageSize }),
});
```

### 4. Separate Concerns

```typescript
// ❌ Bad - Mixing different data types
useQuery({
  queryKey: ['dashboard', userId, 'stats', 'revenue'],
  queryFn: () => fetchUserStats(userId),
});

// ✅ Good - Clear separation
useQuery({
  queryKey: ['users', userId, 'stats', 'revenue'],
  queryFn: () => fetchUserStats(userId),
});

// Later: invalidate all user-1 data
queryClient.invalidateQueries({
  queryKey: ['users', 1],
});
```

---

## Query Key Factory Pattern

For large applications, use a factory object to centralize key creation:

```typescript
// lib/queryKeys.ts
export const queryKeys = {
  all: ['todos'] as const,
  lists: () => [...queryKeys.all, 'list'] as const,
  list: (filters: string) =>
    [...queryKeys.lists(), { filters }] as const,
  details: () => [...queryKeys.all, 'detail'] as const,
  detail: (id: number) =>
    [...queryKeys.details(), id] as const,
  comments: (todoId: number) =>
    [...queryKeys.detail(todoId), 'comments'] as const,
  comment: (todoId: number, commentId: number) =>
    [...queryKeys.comments(todoId), commentId] as const,
};

// Usage
useQuery({
  queryKey: queryKeys.list('active'),
  queryFn: () => fetchTodos({ status: 'active' }),
});

useQuery({
  queryKey: queryKeys.detail(1),
  queryFn: () => fetchTodo(1),
});

// Invalidation
queryClient.invalidateQueries({
  queryKey: queryKeys.lists(),
});
```

### Advantages

- 📍 **Centralized** — Single source of truth
- 🎯 **Type-safe** — TypeScript catches typos
- 🔗 **Consistent** — No duplicate key definitions
- 🔄 **Maintainable** — Easy to refactor

---

## Real-World Example: E-Commerce App

```typescript
// lib/queryKeys.ts
export const queryKeys = {
  // Products
  products: {
    all: ['products'] as const,
    lists: () => [...queryKeys.products.all, 'list'] as const,
    list: (filters: ProductFilters) =>
      [...queryKeys.products.lists(), filters] as const,
    details: () => [...queryKeys.products.all, 'detail'] as const,
    detail: (id: number) =>
      [...queryKeys.products.details(), id] as const,
    reviews: (id: number) =>
      [...queryKeys.products.detail(id), 'reviews'] as const,
  },

  // Cart
  cart: {
    all: ['cart'] as const,
    lists: () => [...queryKeys.cart.all, 'list'] as const,
    detail: () => [...queryKeys.cart.all, 'detail'] as const,
    items: () => [...queryKeys.cart.detail(), 'items'] as const,
  },

  // User
  users: {
    all: ['users'] as const,
    profile: (id: number) =>
      [...queryKeys.users.all, 'profile', id] as const,
    orders: (id: number) =>
      [...queryKeys.users.profile(id), 'orders'] as const,
  },
};

// hooks/useProducts.ts
export function useProducts(filters: ProductFilters) {
  return useQuery({
    queryKey: queryKeys.products.list(filters),
    queryFn: () => fetchProducts(filters),
  });
}

// hooks/useProduct.ts
export function useProduct(id: number) {
  return useQuery({
    queryKey: queryKeys.products.detail(id),
    queryFn: () => fetchProduct(id),
  });
}

// hooks/useCreateProduct.ts
export function useCreateProduct() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createProduct,
    onSuccess: () => {
      // Invalidate all product lists
      queryClient.invalidateQueries({
        queryKey: queryKeys.products.lists(),
      });
    },
  });
}
```

---

## Invalidation Patterns

### Invalidate Single Query

```typescript
queryClient.invalidateQueries({
  queryKey: ['users', userId],
  exact: true,
});
```

### Invalidate All Related Queries

```typescript
// Invalidate user and all related data
queryClient.invalidateQueries({
  queryKey: ['users', userId],
});
// Matches:
// - ['users', userId]
// - ['users', userId, 'posts']
// - ['users', userId, 'profile', 'settings']
```

### Invalidate by Prefix

```typescript
// Invalidate all user queries
queryClient.invalidateQueries({
  queryKey: ['users'],
});
// Matches anything starting with ['users']
```

### Conditional Invalidation

```typescript
queryClient.invalidateQueries({
  predicate: (query) => {
    // Only invalidate user queries for users over 18
    return (
      query.queryKey[0] === 'users' &&
      query.queryKey[1] > 18
    );
  },
});
```

---

## Anti-Patterns to Avoid

### ❌ Anti-Pattern 1: String Keys

```typescript
// DON'T - Hard to match, easy to mistype
useQuery({
  queryKey: 'get-user-1',
  queryFn: fetchUser,
});

queryClient.invalidateQueries({
  queryKey: 'get-user',  // Won't match 'get-user-1'!
});
```

### ❌ Anti-Pattern 2: Forgetting Variables

```typescript
// DON'T - Won't differentiate by userId
useQuery({
  queryKey: ['user'],
  queryFn: () => fetchUser(userId),
});

// Both userId 1 and 2 share same cache!
```

### ❌ Anti-Pattern 3: Order-Dependent Objects

```typescript
// DON'T - Order matters, hard to maintain
const filters1 = { status: 'active', sort: 'date' };
const filters2 = { sort: 'date', status: 'active' };

useQuery({ queryKey: ['todos', filters1] });
useQuery({ queryKey: ['todos', filters2] });
// Different keys! Cache misses!

// ✅ Better - Normalize object keys
const normalizeFilters = (f) => ({
  sort: f.sort,
  status: f.status,
});

useQuery({
  queryKey: ['todos', normalizeFilters(filters)],
});
```

---

## TypeScript: Query Key Types

```typescript
// Define type-safe query keys
export const queryKeys = {
  users: {
    all: () => ['users'] as const,
    detail: (id: number) => ['users', id] as const,
    posts: (id: number) => ['users', id, 'posts'] as const,
  },
} as const;

// Extract key type
type UserQueryKey = typeof queryKeys.users[keyof typeof queryKeys.users];

// Use in function
function fetchData(queryKey: UserQueryKey) {
  // queryKey is properly typed!
}
```

---

## Summary

✅ **DO:**
- Use hierarchical, array-based keys
- Include all variables in the key
- Use objects for complex filters
- Implement query key factory pattern
- Keep keys simple and readable

❌ **DON'T:**
- Use string keys
- Forget variables
- Make keys order-dependent
- Create overly nested structures
- Mix concerns

---

**Source Documentation:**
- [Important Defaults | TanStack Query](https://tanstack.com/query/v5/docs/react/guides/important-defaults)
- [Query Keys Documentation](https://tanstack.com/query/latest/docs/guides/query-keys)