# 01 — Core Philosophy & Overview

**Module Summary**: Comprehensive introduction to TanStack Query as a framework, server state vs client state distinctions, core concepts (queries, mutations, invalidation), and the problems it solves. Foundation for understanding the entire library.

**Source:** [https://tanstack.com/query/v5/docs/react/overview](https://tanstack.com/query/v5/docs/react/overview)

---

## Table of Contents
1. [What is TanStack Query?](#what-is-tanstack-query)
2. [The Problem It Solves](#the-problem-it-solves)
3. [Core Concepts](#core-concepts)
4. [Why TanStack Query Matters](#why-tanstack-query-matters)
5. [Key Benefits](#key-benefits)
6. [Architecture Overview](#architecture-overview)
7. [When to Use TanStack Query](#when-to-use-tanstack-query)
8. [Next Steps](#next-steps)

---

## What is TanStack Query?

TanStack Query is a **powerful, unopinionated server state management library** that handles the complex problems surrounding fetching, caching, synchronizing, and updating server state in modern web applications.

---

## The Problem It Solves

### Server State vs Client State

Most developers conflate **server state** with **client state**, but they are fundamentally different:

| Aspect | Client State | Server State |
|--------|-------------|--------------|
| **Ownership** | Your app | Remote server |
| **Mutability** | Synchronous, deterministic | Asynchronous, unpredictable |
| **Staleness** | Always fresh | Can become stale |
| **Lifespan** | Lives in memory | Persists independently |

### Unique Challenges of Server State

Without proper management, server state introduces:

1. **Caching Problems** — How long is fetched data valid before it's "stale"?
2. **Deduplication** — Multiple components requesting same data = multiple network requests
3. **Background Synchronization** — Keeping UI in sync with server changes
4. **Request Cancellation** — Abort in-flight requests when components unmount
5. **Memory Management** — Garbage collect unused cache entries
6. **Retry Logic** — How to handle failed requests?
7. **Pagination/Infinite Queries** — Complex cursor/offset management
8. **Mutations** — Coordinating data updates and cache invalidation
9. **Offline Support** — What happens when network is unavailable?

TanStack Query abstracts away all of this complexity.

---

## Core Concepts

### 1. Queries (Data Fetching)

A **query** is a declarative dependency on an asynchronous data source tied to a **unique key**.

```typescript
import { useQuery } from '@tanstack/react-query';

function UserProfile({ userId }: { userId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['users', userId], // Unique identifier
    queryFn: () => fetch(`/api/users/${userId}`).then(res => res.json()), // Async function
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{data.name}</div>;
}
```

**Key Properties:**
- **queryKey** — Unique identifier for the query (array-based for hierarchical structure)
- **queryFn** — Async function that fetches and returns data
- **staleTime** — Duration before data is considered "stale"
- **gcTime** — Duration before unused query is garbage collected

---

### 2. Mutations (Data Modification)

A **mutation** is a mechanism for performing side effects and updating server state (CREATE, UPDATE, DELETE).

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

function CreateUser() {
  const queryClient = useQueryClient();

  const createUserMutation = useMutation({
    mutationFn: (newUser: User) =>
      fetch('/api/users', { 
        method: 'POST', 
        body: JSON.stringify(newUser) 
      }).then(res => res.json()),
    onSuccess: () => {
      // Invalidate the users query to refetch
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });

  return (
    <button onClick={() => createUserMutation.mutate({ name: 'John' })}>
      Create User
    </button>
  );
}
```

**Key Differences from Queries:**
- No automatic refetching
- Manual trigger via `mutate()` or `mutateAsync()`
- Lifecycle callbacks: `onMutate`, `onSuccess`, `onError`, `onSettled`
- Excellent for optimistic updates

---

### 3. Query Invalidation (Cache Invalidation)

**Query invalidation** marks cached data as stale and triggers background refetching.

```typescript
const queryClient = useQueryClient();

// Invalidate a specific query
queryClient.invalidateQueries({ queryKey: ['users', userId] });

// Invalidate all queries matching a partial key
queryClient.invalidateQueries({ queryKey: ['users'] });

// Invalidate with predicate function
queryClient.invalidateQueries({
  predicate: (query) => query.queryKey[0] === 'users',
});
```

This is typically done in `useMutation` callbacks to keep UI in sync after data modifications.

---

### 4. Query Keys (The Foundation)

Query keys are **unique identifiers** for caching and invalidation. They follow a hierarchical array structure:

```typescript
// Simple key
['users']

// Key with variables (user-specific)
['users', userId]

// Nested hierarchical key
['users', userId, 'posts']

// Key with complex filters
['posts', { status: 'published', sortBy: 'date' }]
```

Key matching supports:
- **Exact match** — `['users', userId]` matches only that exact key
- **Partial match** — `['users']` matches `['users']`, `['users', 1]`, `['users', 1, 'posts']`, etc.
- **Predicate function** — Custom matching logic

---

## Why TanStack Query Matters

### Before TanStack Query
```typescript
// Manual management hell
const [users, setUsers] = useState([]);
const [loading, setLoading] = useState(false);
const [error, setError] = useState(null);
const [lastFetch, setLastFetch] = useState(0);

useEffect(() => {
  if (Date.now() - lastFetch < 60000) return; // Manual staleness check
  
  setLoading(true);
  fetch('/api/users')
    .then(res => res.json())
    .then(data => {
      setUsers(data);
      setLastFetch(Date.now());
      setLoading(false);
    })
    .catch(err => {
      setError(err);
      setLoading(false);
    });
}, []);
```

### With TanStack Query
```typescript
const { data: users, isLoading, error } = useQuery({
  queryKey: ['users'],
  queryFn: () => fetch('/api/users').then(res => res.json()),
  staleTime: 60 * 1000, // 1 minute
});
```

**Automatic handling:**
- ✅ Staleness detection
- ✅ Cache management
- ✅ Request deduplication
- ✅ Background refetching
- ✅ Automatic retries
- ✅ Offline support
- ✅ Memory cleanup

---

## Key Benefits

| Feature | Benefit |
|---------|---------|
| **Zero-Config** | Works perfectly out-of-the-box with sensible defaults |
| **Declarative** | Query dependencies are explicit and co-located |
| **Powerful** | Extensive customization for advanced use cases |
| **TypeScript First** | Full type safety across all APIs |
| **Developer Experience** | Excellent DevTools for debugging |
| **Performance** | Automatic deduplication, pagination, infinite queries |
| **Offline-Ready** | Built-in network awareness |

---

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│         Your React Application                  │
├─────────────────────────────────────────────────┤
│  useQuery()  useMutation()  useQueryClient()    │
├─────────────────────────────────────────────────┤
│        QueryClientProvider                      │
├─────────────────────────────────────────────────┤
│           QueryClient                           │
│  ┌──────────────────────────────────────────┐  │
│  │  QueryCache (In-Memory)                  │  │
│  │  ┌─────────────────────────────────────┐ │  │
│  │  │ ['users'] → {data, status, ...}    │ │  │
│  │  │ ['posts'] → {data, status, ...}    │ │  │
│  │  │ ['users', 1] → {data, status, ...} │ │  │
│  │  └─────────────────────────────────────┘ │  │
│  │                                          │  │
│  │  Cache Lifecycle Manager                │  │
│  │  - Staleness tracking                   │  │
│  │  - Garbage collection                   │  │
│  │  - Background refetches                 │  │
│  └──────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
         ↓
  Remote Data Source
  (API, Database, etc.)
```

---

## When to Use TanStack Query

### ✅ Perfect For
- Fetching and caching remote data
- Synchronizing UI with server state
- Pagination and infinite scrolling
- Background synchronization
- Optimistic updates
- Complex cache invalidation strategies

### ❌ Not For
- Pure client-side state (Redux/Zustand better fit)
- Real-time streaming (though can be combined with WebSockets)
- Offline-first applications needing persistent storage (use SQLite/IndexedDB alongside TQ)

---

## Next Steps

1. **Install & Setup** → [02-installation-setup.md](./02-installation-setup.md)
2. **Learn useQuery** → [03-api-usequery.md](./03-api-usequery.md)
3. **Learn useMutation** → [04-api-usemutation.md](./04-api-usemutation.md)
4. **Master Query Keys** → [09-guide-query-keys.md](./09-guide-query-keys.md)

---

**Source Documentation:**
- [TanStack Query v5 Overview](https://tanstack.com/query/v5/docs/react/overview)
- [Why You Want React Query](https://tanstack.com/query/latest/docs/philosophy)