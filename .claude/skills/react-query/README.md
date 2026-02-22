# TanStack React Query v5 -- Knowledge Base

> Server state management with automatic caching, background refetching, deduplication, and stale-while-revalidate.

**Version:** 5.x (^5.62.11) | **Source:** https://tanstack.com/query/latest

---

## Module Index

| # | File | Topic |
|---|------|-------|
| -- | [SKILL.md](SKILL.md) | Quick reference, rules, core patterns |
| 01 | [01-overview.md](01-overview.md) | Philosophy, server vs client state, architecture |
| 02 | [02-installation-setup.md](02-installation-setup.md) | Installation, QueryClient, QueryClientProvider, defaults |
| 03 | [03-api-usequery.md](03-api-usequery.md) | useQuery all options, useSuspenseQuery |
| 04 | [04-api-usemutation.md](04-api-usemutation.md) | useMutation all options, optimistic update |
| 05 | [05-api-infinitequery.md](05-api-infinitequery.md) | useInfiniteQuery, cursor/offset pagination, maxPages |
| 06 | [06-api-queryclient.md](06-api-queryclient.md) | QueryClient methods: fetch, prefetch, invalidate, set/get |
| 07 | [07-guide-query-keys.md](07-guide-query-keys.md) | Query key design, factories, invalidation strategies |
| 08 | [08-guide-advanced.md](08-guide-advanced.md) | Dependent queries, parallel, retry, Suspense, performance |

---

## Quick Start

```typescript
import { QueryClient, QueryClientProvider, useQuery } from '@tanstack/react-query'

const queryClient = new QueryClient({
  defaultOptions: { queries: { staleTime: 5 * 60 * 1000 } },
})

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TodoList />
    </QueryClientProvider>
  )
}

function TodoList() {
  const { data, isPending, error } = useQuery({
    queryKey: ['todos'],
    queryFn: () => fetch('/api/todos').then(r => r.json()),
  })

  if (isPending) return <div>Loading...</div>
  if (error) return <div>Error: {error.message}</div>
  return <ul>{data.map((t: any) => <li key={t.id}>{t.title}</li>)}</ul>
}
```

---

## When to Load Which File

| Task | Load |
|------|------|
| Fetch data with caching | 03-api-usequery.md |
| Create/update/delete data | 04-api-usemutation.md |
| Infinite scroll or pagination | 05-api-infinitequery.md |
| Cache manipulation (invalidate, set, prefetch) | 06-api-queryclient.md |
| Design query keys for app | 07-guide-query-keys.md |
| Suspense, optimistic updates, polling | 08-guide-advanced.md |
| Project setup | 02-installation-setup.md |
