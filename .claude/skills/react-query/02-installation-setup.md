# Installation & Setup

**Module:** `02-installation-setup.md` | **Version:** 5.96.2

---

## Requirements

- React 18.0 or later (uses `useSyncExternalStore`)
- TypeScript 4.7+ recommended

---

## Installation

```bash
npm install @tanstack/react-query
```

Optional DevTools:

```bash
npm install @tanstack/react-query-devtools
```

Optional ESLint plugin:

```bash
npm install @tanstack/eslint-plugin-query
```

---

## Basic Setup

### 1. Create QueryClient

```typescript
import { QueryClient } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,   // 5 minutes
      gcTime: 1000 * 60 * 10,      // 10 minutes
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 0,
    },
  },
})
```

### 2. Wrap with QueryClientProvider

```typescript
import { QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      {__DEV__ && <ReactQueryDevtools initialIsOpen={false} />}
    </QueryClientProvider>
  )
}
```

### 3. Use Hooks

```typescript
import { useQuery } from '@tanstack/react-query'

function TodoList() {
  const { data, isPending, error } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then(r => r.json()),
  })

  if (isPending) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <div>{JSON.stringify(data)}</div>
}
```

---

## QueryClient Default Options

### Query Defaults

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `staleTime` | `number` | `0` | Duration (ms) data stays fresh |
| `gcTime` | `number` | `300000` (5 min) | Duration (ms) before unused cache GC |
| `retry` | `boolean \| number \| RetryFn` | `3` | Retry count on failure |
| `retryDelay` | `number \| RetryDelayFn` | Exponential | Delay between retries |
| `refetchOnMount` | `boolean \| 'always'` | `true` | Refetch on component mount if stale |
| `refetchOnWindowFocus` | `boolean \| 'always'` | `true` | Refetch on window focus if stale |
| `refetchOnReconnect` | `boolean \| 'always'` | `true` | Refetch on network reconnect if stale |
| `networkMode` | `'online' \| 'always' \| 'offlineFirst'` | `'online'` | Network behavior mode |
| `throwOnError` | `boolean` | `false` | Throw to error boundary |
| `structuralSharing` | `boolean \| (old, new) => T` | `true` | Enable structural sharing for referential stability |

### Mutation Defaults

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `retry` | `boolean \| number \| RetryFn` | `0` | Retry count (default: no retry) |
| `retryDelay` | `number \| RetryDelayFn` | Exponential | Delay between retries |
| `networkMode` | `'online' \| 'always' \| 'offlineFirst'` | `'online'` | Network behavior |
| `gcTime` | `number` | `300000` (5 min) | GC time for mutation cache |
| `throwOnError` | `boolean` | `false` | Throw to error boundary |

---

## Production Setup

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query'

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 15,
      retry: 1,
      retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 30000),
      refetchOnWindowFocus: 'always',
      refetchOnReconnect: 'always',
    },
    mutations: {
      retry: 1,
    },
  },
})
```

---

## TypeScript Support

```typescript
import { useQuery } from '@tanstack/react-query'

interface User {
  id: number
  name: string
  email: string
}

function UserProfile({ userId }: { userId: number }) {
  const { data, error } = useQuery<User, Error>({
    queryKey: ['users', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
  })
  // data: User | undefined
  // error: Error | null
  return <div>{data?.name}</div>
}
```

### Recommended: `queryOptions` for Type Inference

```typescript
import { queryOptions, useQuery } from '@tanstack/react-query'

function userQueryOptions(userId: number) {
  return queryOptions({
    queryKey: ['users', userId] as const,
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json() as Promise<User>
    },
    staleTime: 5 * 60 * 1000,
  })
}

// Type-safe everywhere -- queryKey and queryFn co-located
useQuery(userQueryOptions(1))
queryClient.prefetchQuery(userQueryOptions(1))
queryClient.ensureQueryData(userQueryOptions(1))
const cached = queryClient.getQueryData(userQueryOptions(1).queryKey) // User | undefined
```

---

## DevTools

```typescript
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'

// In QueryClientProvider children:
<ReactQueryDevtools initialIsOpen={false} />
```

Features: Query explorer, status inspector, manual invalidation, mock offline mode.

---

## ESLint Plugin

```typescript
// eslint.config.js
import pluginQuery from '@tanstack/eslint-plugin-query'

export default [
  ...pluginQuery.configs['flat/recommended'],
]
```

Rules include: `exhaustive-deps` (ensure queryKey includes all queryFn variables), `no-rest-destructuring`, `stable-query-client`, `no-unstable-deps`.

---

## Environment Manager (v5.91+)

The `environmentManager` provides explicit control over server-detection behavior. Useful for non-standard environments like browser extensions, VSCode extensions, or Electron apps where automatic detection may fail.

```typescript
import { environmentManager } from '@tanstack/react-query'

// Check if running on server
const isServer = environmentManager.isServer()

// Override server detection (e.g., in browser extensions)
environmentManager.setIsServer(false)
```

Use `setIsServer(false)` when queries fail to refetch in environments where `typeof window === 'undefined'` incorrectly returns `true` (e.g., service workers, VSCode webviews).

---

## Common Setup Issues

| Issue | Solution |
|-------|----------|
| "useQuery not defined inside Provider" | Ensure component is wrapped by `QueryClientProvider` |
| Multiple QueryClient instances | Export single instance from shared module |
| Queries pending despite cache | Check `staleTime` and `refetchOnMount` |
| `onSuccess` callback not working | Removed in v5 -- use `useEffect` for side effects |
| `cacheTime` not recognized | Renamed to `gcTime` in v5 |
| `isLoading` behaves differently | `isLoading` = `isPending && isFetching` in v5; use `isPending` for first-load check |
| Queries don't refetch in extensions | Use `environmentManager.setIsServer(false)` for browser/VSCode extensions |

---

**Source:** https://tanstack.com/query/v5/docs/framework/react/installation | https://tanstack.com/query/v5/docs/reference/QueryClient
**Version:** 5.96.2
