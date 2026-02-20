# 02 — Installation & Setup

**Module Summary**: Step-by-step installation instructions, QueryClient configuration with default options, QueryClientProvider setup, TypeScript support, ESLint plugin configuration, and production setup patterns.

**Source:** [https://tanstack.com/query/v5/docs/react/installation](https://tanstack.com/query/v5/docs/react/installation)

---

## Table of Contents
1. [Installation](#installation)
2. [Browser Compatibility](#browser-compatibility)
3. [Basic Setup](#basic-setup)
4. [Default Options Reference](#default-options-reference)
5. [TypeScript Support](#typescript-support)
6. [ESLint Plugin](#eslint-plugin-recommended)
7. [DevTools](#devtools-development)
8. [Production Setup Example](#production-setup-example)
9. [Common Setup Issues](#common-setup-issues)
10. [Next Steps](#next-steps)

---

## Installation

### Package Managers

**NPM:**
```bash
npm i @tanstack/react-query
```

**Yarn:**
```bash
yarn add @tanstack/react-query
```

**PNPM:**
```bash
pnpm add @tanstack/react-query
```

**Bun:**
```bash
bun add @tanstack/react-query
```

**ESM Browser (CDN):**
```html
<script type="module">
  import React from 'https://esm.sh/react@18.2.0'
  import ReactDOM from 'https://esm.sh/react-dom@18.2.0'
  import { QueryClient, QueryClientProvider, useQuery } 
    from 'https://esm.sh/@tanstack/react-query@5'
</script>
```

**Source:** [Installation | TanStack Query](https://tanstack.com/query/v5/docs/react/installation)

---

## Browser Compatibility

TanStack Query v5 is optimized for modern browsers:

| Browser | Minimum Version |
|---------|-----------------|
| Chrome | ≥ 91 |
| Firefox | ≥ 90 |
| Edge | ≥ 91 |
| Safari | ≥ 15 |
| iOS Safari | ≥ 15 |
| Opera | ≥ 77 |

**Legacy Browser Support:** If you need to support older browsers, you'll need to transpile the library from `node_modules` yourself.

---

## Basic Setup

### 1. Create QueryClient Instance

The `QueryClient` is the core manager for all cached data, queries, and mutations.

```typescript
import { QueryClient } from '@tanstack/react-query';

// Create with default options
const queryClient = new QueryClient();

// Or create with custom default options
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes
      gcTime: 1000 * 60 * 10,    // 10 minutes
      retry: 1,
      refetchOnWindowFocus: true,
    },
    mutations: {
      retry: 1,
    },
  },
});
```

---

### 2. Wrap Application with QueryClientProvider

The `QueryClientProvider` is a React Context Provider that makes the `QueryClient` available to your entire application.

```typescript
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';

const queryClient = new QueryClient();

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

### 3. Use Hooks in Components

Once wrapped, you can use TanStack Query hooks anywhere in your component tree:

```typescript
import { useQuery } from '@tanstack/react-query';

function MyComponent() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then(res => res.json()),
  });

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error.message}</div>;
  return <div>{data}</div>;
}
```

---

## Default Options Reference

### Query Default Options

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Time in ms after data is considered "stale"
      staleTime: 0,
      
      // Time in ms before unused query is garbage collected
      gcTime: 1000 * 60 * 5, // 5 minutes
      
      // Number of retry attempts on failure
      retry: 3,
      
      // Retry delay function
      retryDelay: (attemptIndex) => 
        Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Refetch when component mounts if stale
      refetchOnMount: true,
      
      // Refetch when window regains focus
      refetchOnWindowFocus: true,
      
      // Refetch when network connection is restored
      refetchOnReconnect: true,
      
      // Network mode: 'always' | 'online' | 'offlineFirst'
      networkMode: 'online',
      
      // Throw errors to nearest error boundary
      useErrorBoundary: false,
      
      // Enable suspense (React 18+)
      suspense: false,
    },
  },
});
```

### Mutation Default Options

```typescript
const queryClient = new QueryClient({
  defaultOptions: {
    mutations: {
      // Number of retry attempts
      retry: 0,
      
      // Retry delay function
      retryDelay: (attemptIndex) => 
        Math.min(1000 * 2 ** attemptIndex, 30000),
      
      // Network mode
      networkMode: 'online',
      
      // Throw errors to nearest error boundary
      useErrorBoundary: false,
      
      // Garbage collection time
      gcTime: 1000 * 60 * 5, // 5 minutes
    },
  },
});
```

---

## TypeScript Support

TanStack Query v5 provides excellent TypeScript support with full type inference:

```typescript
import { useQuery } from '@tanstack/react-query';

interface User {
  id: number;
  name: string;
  email: string;
}

interface ErrorResponse {
  message: string;
  code: string;
}

function UserProfile({ userId }: { userId: number }) {
  const { data, error } = useQuery<User, ErrorResponse>({
    queryKey: ['users', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.message);
      }
      return res.json();
    },
  });

  // data is typed as User | undefined
  // error is typed as ErrorResponse | null
  
  return <div>{data?.name}</div>;
}
```

---

## ESLint Plugin (Recommended)

The ESLint plugin helps catch bugs and inconsistencies while coding:

### Installation

```bash
npm i -D @tanstack/eslint-plugin-query
```

### Configuration

**.eslintrc.json:**
```json
{
  "plugins": ["@tanstack/query"],
  "rules": {
    "@tanstack/query/exhaustive-deps": "error",
    "@tanstack/query/prefer-query-object-syntax": "error",
    "@tanstack/query/no-rest-destructuring": "warn"
  }
}
```

### Useful Rules

| Rule | Purpose |
|------|---------|
| `exhaustive-deps` | Warn if query dependencies are missing from queryKey |
| `prefer-query-object-syntax` | Enforce single-object parameter syntax (v5 standard) |
| `no-rest-destructuring` | Prevent accidental destructuring of internal state |

---

## DevTools (Development)

TanStack Query provides powerful DevTools for debugging queries and mutations:

### Installation

```bash
npm i @tanstack/react-query-devtools
```

### Setup

```typescript
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <YourApp />
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
}
```

### Features

- **Query Explorer** — Browse all cached queries and their states
- **Query Detail Inspector** — View query data, cache time, status, etc.
- **Mock Offline** — Test offline behavior
- **Refetch/Invalidate** — Manually trigger cache operations
- **Mutation Tracker** — Monitor all active mutations

---

## Production Setup Example

### Complete Setup for Production

```typescript
// lib/queryClient.ts
import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,        // 5 minutes
      gcTime: 1000 * 60 * 15,           // 15 minutes
      retry: 1,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: 'stale',
      refetchOnReconnect: 'stale',
    },
    mutations: {
      retry: 1,
      retryDelay: (attemptIndex) =>
        Math.min(1000 * 2 ** attemptIndex, 30000),
    },
  },
});
```

```typescript
// main.tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import App from './App';
import { queryClient } from './lib/queryClient';

const root = ReactDOM.createRoot(
  document.getElementById('root')!
);

root.render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
      {import.meta.env.DEV && (
        <ReactQueryDevtools initialIsOpen={false} />
      )}
    </QueryClientProvider>
  </React.StrictMode>
);
```

---

## Common Setup Issues

### Issue: "useQuery is not defined inside Provider"
**Solution:** Ensure component is wrapped by `QueryClientProvider`

### Issue: "Multiple QueryClient instances"
**Solution:** Export single `queryClient` instance from a shared module (don't create new instances in multiple places)

### Issue: "Queries in pending state after mount despite having cache"
**Solution:** Check `staleTime` and `refetchOnMount` options; data may be stale

---

## Next Steps

1. ✅ Installation & QueryClient setup (you are here)
2. [03-api-usequery.md](./03-api-usequery.md) — Learn to fetch data
3. [04-api-usemutation.md](./04-api-usemutation.md) — Learn to modify data
4. [09-guide-query-keys.md](./09-guide-query-keys.md) — Master query key design

---

**Source Documentation:**
- [Installation | TanStack Query](https://tanstack.com/query/v5/docs/react/installation)
- [QueryClientProvider | TanStack Query](https://tanstack.com/query/v5/docs/react/reference/QueryClientProvider)