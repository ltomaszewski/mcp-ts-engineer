# 03 — useQuery: Data Fetching Hook

**Module Summary**: Complete `useQuery` hook reference including all parameters (queryKey, queryFn, staleTime, gcTime, etc.), return object properties, status/fetchStatus states, refetch mechanics, selection patterns, and 8+ practical code examples.

**Source:** [https://tanstack.com/query/v5/docs/react/reference/useQuery](https://tanstack.com/query/v5/docs/react/reference/useQuery)

---

## Table of Contents
1. [Function Signature](#function-signature)
2. [Parameters](#parameters)
3. [Return Value Properties](#return-value-properties)
4. [Code Examples](#code-examples)
5. [TypeScript Best Practices](#typescript-best-practices)
6. [Next Steps](#next-steps)

---

## Function Signature

```typescript
function useQuery<
  TQueryFnData = unknown,
  TError = DefaultError,
  TData = TQueryFnData,
>(
  options: UseQueryOptions<TQueryFnData, TError, TData>,
  queryClient?: QueryClient,
): UseQueryResult<TData, TError>
```

---

## Parameters

### Parameter 1: Options Object

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| **queryKey** | `QueryKey` | ✅ Yes | — | Unique identifier for this query (array-based) |
| **queryFn** | `QueryFn<TQueryFnData>` | ✅ Yes | — | Async function that fetches/returns data |
| **enabled** | `boolean` | ❌ No | `true` | Enable/disable automatic fetching |
| **staleTime** | `number` | ❌ No | `0` | Duration (ms) data is fresh before becoming stale |
| **gcTime** | `number` | ❌ No | `5 * 60 * 1000` | Duration (ms) before unused query is garbage collected |
| **initialData** | `TQueryFnData \| (() => TQueryFnData)` | ❌ No | — | Initial data before first fetch |
| **placeholderData** | `TData \| (() => TData)` | ❌ No | — | Placeholder while query is pending |
| **select** | `(data: TQueryFnData) => TData` | ❌ No | — | Transform/select portion of data |
| **retry** | `boolean \| number \| RetryFn` | ❌ No | `3` | Retry count or function |
| **retryDelay** | `number \| RetryDelayFn` | ❌ No | Exponential | Delay between retries (ms) |
| **refetchInterval** | `number \| false` | ❌ No | `false` | Auto-refetch interval (ms) |
| **refetchIntervalInBackground** | `boolean` | ❌ No | `false` | Continue refetch interval when page is hidden |
| **refetchOnMount** | `'stale' \| 'always' \| boolean` | ❌ No | `true` | Refetch when component mounts |
| **refetchOnWindowFocus** | `'stale' \| 'always' \| boolean` | ❌ No | `true` | Refetch when window regains focus |
| **refetchOnReconnect** | `'stale' \| 'always' \| boolean` | ❌ No | `true` | Refetch when network reconnects |
| **networkMode** | `'always' \| 'online' \| 'offlineFirst'` | ❌ No | `'online'` | Network mode behavior |

---

## Return Value Properties

### Data & Status

| Property | Type | Description |
|----------|------|-------------|
| **data** | `TData \| undefined` | The fetched data (undefined if pending/error) |
| **error** | `TError \| null` | The error object if query failed |
| **status** | `'pending' \| 'error' \| 'success'` | Overall query status |
| **isLoading** | `boolean` | True if pending and no data yet |
| **isPending** | `boolean` | True if currently in pending state |
| **isError** | `boolean` | True if query errored |
| **isSuccess** | `boolean` | True if query succeeded |
| **fetchStatus** | `'fetching' \| 'idle' \| 'paused'` | Current network state |
| **isFetching** | `boolean` | True if currently fetching (includes refetches) |
| **refetch** | `(options?: RefetchOptions) => Promise<QueryObserverResult>` | Manually refetch this query |

---

## Code Examples

### 1. Basic Query

```typescript
import { useQuery } from '@tanstack/react-query';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

function TodoList() {
  const { data: todos, isLoading, error } = useQuery<Todo[]>({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await fetch('/api/todos');
      if (!res.ok) throw new Error('Failed to fetch todos');
      return res.json();
    },
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;

  return (
    <ul>
      {todos?.map(todo => (
        <li key={todo.id}>{todo.title}</li>
      ))}
    </ul>
  );
}
```

### 2. Query with Variables (Dependent Query)

```typescript
interface User {
  id: number;
  name: string;
}

function UserProfile({ userId }: { userId: number }) {
  const { data: user, isLoading } = useQuery<User>({
    queryKey: ['users', userId], // Include variable in key
    queryFn: () =>
      fetch(`/api/users/${userId}`).then(res => res.json()),
    enabled: !!userId, // Disable if userId is null
  });

  if (isLoading) return <div>Loading...</div>;
  return <div>{user?.name}</div>;
}
```

### 3. Conditional/Dependent Queries

```typescript
function UserPosts({ userId }: { userId: number | null }) {
  // Only fetch if userId is available
  const { data: user } = useQuery<User>({
    queryKey: ['users', userId],
    queryFn: () =>
      fetch(`/api/users/${userId}`).then(res => res.json()),
    enabled: !!userId, // Pause if userId is null
  });

  // Dependent query: only fetch after user is loaded
  const { data: posts } = useQuery<Post[]>({
    queryKey: ['users', userId, 'posts'],
    queryFn: () =>
      fetch(`/api/users/${userId}/posts`).then(res => res.json()),
    enabled: !!user?.id, // Wait for user data first
  });

  return <div>{posts?.length} posts</div>;
}
```

### 4. Query with Data Selection

```typescript
interface Post {
  id: number;
  title: string;
  body: string;
  author: { id: number; name: string };
}

function PostTitle({ postId }: { postId: number }) {
  const { data: title } = useQuery({
    queryKey: ['posts', postId],
    queryFn: () =>
      fetch(`/api/posts/${postId}`).then(res => res.json()),
    select: (data: Post) => data.title, // Only select title
  });

  return <h1>{title}</h1>;
}
```

### 5. Query with Error Handling & Retries

```typescript
function TodoList() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['todos'],
    queryFn: async () => {
      const res = await fetch('/api/todos');
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message || 'Failed to fetch');
      }
      return res.json();
    },
    retry: 3,
    retryDelay: (attemptIndex) =>
      Math.min(1000 * 2 ** attemptIndex, 30000), // Exponential backoff
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) {
    return (
      <div>
        Error: {error.message}
        <button onClick={() => refetch()}>Retry</button>
      </div>
    );
  }

  return <div>{data}</div>;
}
```

### 6. Query with Placeholder Data

```typescript
function SearchPosts({ searchTerm }: { searchTerm: string }) {
  const { data: posts, isPending } = useQuery({
    queryKey: ['posts', 'search', searchTerm],
    queryFn: () =>
      fetch(`/api/posts/search?q=${searchTerm}`).then(res => res.json()),
    placeholderData: [], // Show empty array while loading
  });

  return (
    <ul>
      {posts?.map(post => (
        <li key={post.id}>{post.title}</li>
      ))}
    </ul>
  );
}
```

### 7. Manual Refetch

```typescript
function TodoList() {
  const { data, refetch, isFetching } = useQuery({
    queryKey: ['todos'],
    queryFn: () =>
      fetch('/api/todos').then(res => res.json()),
    refetchOnWindowFocus: false, // Disable auto-refetch
  });

  return (
    <div>
      <button onClick={() => refetch()} disabled={isFetching}>
        {isFetching ? 'Refreshing...' : 'Refresh'}
      </button>
      {/* Display data */}
    </div>
  );
}
```

### 8. Background Refetch Interval

```typescript
function LiveDataDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['dashboard', 'stats'],
    queryFn: () =>
      fetch('/api/stats').then(res => res.json()),
    refetchInterval: 5000, // Refetch every 5 seconds
    refetchIntervalInBackground: true, // Continue even if tab is hidden
  });

  return <div>{stats}</div>;
}
```

---

## TypeScript Best Practices

```typescript
interface TodoResponse {
  id: number;
  title: string;
}

interface ErrorResponse {
  message: string;
  code: string;
}

// Explicit type parameters
const { data } = useQuery<TodoResponse, ErrorResponse>({
  queryKey: ['todos'],
  queryFn: async () => {
    const res = await fetch('/api/todos');
    if (!res.ok) {
      throw new Error('Failed');
    }
    return res.json();
  },
});

// data: TodoResponse | undefined
// Hover shows exact type information
```

---

## Next Steps

1. [04-api-usemutation.md](./04-api-usemutation.md) — Mutating data with useMutation
2. [09-guide-query-keys.md](./09-guide-query-keys.md) — Designing query keys
3. [09-guide-caching.md](./10-guide-caching.md) — Understanding cache behavior
4. [11-guide-error-handling.md](./11-guide-error-handling.md) — Error handling strategies

---

**Source Documentation:**
- [useQuery | TanStack Query](https://tanstack.com/query/v5/docs/react/reference/useQuery)
- [Queries Guide | TanStack Query](https://tanstack.com/query/v5/docs/react/guides/queries)