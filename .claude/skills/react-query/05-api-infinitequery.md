# useInfiniteQuery: Pagination & Infinite Scroll

**Module:** `05-api-infinitequery.md` | **Version:** 5.96.2

---

## Function Signature

```typescript
function useInfiniteQuery<
  TQueryFnData,
  TError = DefaultError,
  TData = InfiniteData<TQueryFnData>,
  TQueryKey extends QueryKey = QueryKey,
  TPageParam = unknown,
>(
  options: UseInfiniteQueryOptions<TQueryFnData, TError, TData, TQueryFnData, TQueryKey, TPageParam>,
): UseInfiniteQueryResult<TData, TError>
```

---

## Key Options (in addition to useQuery options)

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `initialPageParam` | `TPageParam` | Yes | -- | Page param for the first page (required in v5) |
| `getNextPageParam` | `(lastPage, allPages, lastPageParam, allPageParams) => TPageParam \| undefined \| null` | Yes | -- | Return next page param or undefined/null for no more pages |
| `getPreviousPageParam` | `(firstPage, allPages, firstPageParam, allPageParams) => TPageParam \| undefined \| null` | No | -- | Return previous page param for bi-directional |
| `maxPages` | `number` | No | `Infinity` | Max pages to store in cache (older pages evicted) |

The `queryFn` receives `pageParam` in its context:

```typescript
queryFn: ({ pageParam }) => fetchPage(pageParam)
```

**Note:** `initialPageParam` is required in v5 (was optional in v4). The `getNextPageParam` function now receives all four arguments: `lastPage`, `allPages`, `lastPageParam`, `allPageParams`.

---

## Return Value (additions to useQuery)

| Property | Type | Description |
|----------|------|-------------|
| `data.pages` | `TQueryFnData[]` | Array of all fetched pages |
| `data.pageParams` | `TPageParam[]` | Array of all page params used |
| `fetchNextPage` | `(options?) => Promise<InfiniteQueryObserverResult>` | Fetch next page |
| `fetchPreviousPage` | `(options?) => Promise<InfiniteQueryObserverResult>` | Fetch previous page |
| `hasNextPage` | `boolean` | True if `getNextPageParam` returned a value |
| `hasPreviousPage` | `boolean` | True if `getPreviousPageParam` returned a value |
| `isFetchingNextPage` | `boolean` | Currently fetching next page |
| `isFetchingPreviousPage` | `boolean` | Currently fetching previous page |

---

## Code Examples

### Cursor-Based Pagination

```typescript
import { useInfiniteQuery } from '@tanstack/react-query'

interface PostsPage {
  posts: Post[]
  nextCursor: string | null
}

function useInfinitePosts() {
  return useInfiniteQuery<PostsPage>({
    queryKey: ['posts'],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(`/api/posts?cursor=${pageParam}&limit=20`)
      if (!res.ok) throw new Error('Failed to fetch')
      return res.json()
    },
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}

function PostList() {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isPending,
  } = useInfinitePosts()

  if (isPending) return <div>Loading...</div>

  return (
    <div>
      {data?.pages.map((page, i) => (
        <div key={i}>
          {page.posts.map((post) => (
            <div key={post.id}>{post.title}</div>
          ))}
        </div>
      ))}
      <button
        onClick={() => fetchNextPage()}
        disabled={!hasNextPage || isFetchingNextPage}
      >
        {isFetchingNextPage
          ? 'Loading more...'
          : hasNextPage
            ? 'Load More'
            : 'No more posts'}
      </button>
    </div>
  )
}
```

### Offset-Based Pagination

```typescript
interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

function useInfiniteUsers() {
  return useInfiniteQuery<PaginatedResponse<User>>({
    queryKey: ['users'],
    queryFn: async ({ pageParam }) => {
      const res = await fetch(`/api/users?page=${pageParam}&pageSize=20`)
      return res.json()
    },
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const totalPages = Math.ceil(lastPage.total / lastPage.pageSize)
      return lastPage.page < totalPages ? lastPage.page + 1 : undefined
    },
  })
}
```

### Bi-Directional Infinite Query

```typescript
function useChatMessages(chatId: string) {
  return useInfiniteQuery({
    queryKey: ['chats', chatId, 'messages'],
    queryFn: ({ pageParam }) =>
      fetch(`/api/chats/${chatId}/messages?cursor=${pageParam}`).then(r => r.json()),
    initialPageParam: 'latest',
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    getPreviousPageParam: (firstPage) => firstPage.prevCursor ?? undefined,
  })
}

// Usage
const { fetchNextPage, fetchPreviousPage, hasNextPage, hasPreviousPage } =
  useChatMessages('chat-1')
```

### With maxPages (Limit Memory)

```typescript
function useInfiniteTimeline() {
  return useInfiniteQuery({
    queryKey: ['timeline'],
    queryFn: ({ pageParam }) =>
      fetch(`/api/timeline?cursor=${pageParam}`).then(r => r.json()),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    getPreviousPageParam: (firstPage) => firstPage.prevCursor ?? undefined,
    maxPages: 5, // Only keep 5 pages in cache
  })
}
```

**Note:** When using `maxPages`, both `getNextPageParam` and `getPreviousPageParam` should be defined to allow re-fetching pages in both directions. When the max is reached, fetching a new page evicts the first or last page from cache depending on the fetch direction.

### Flattening Pages for Display

```typescript
const { data } = useInfinitePosts()

// Flatten all pages into a single array
const allPosts = data?.pages.flatMap((page) => page.posts) ?? []
```

### Type-Safe infiniteQueryOptions Helper

```typescript
import { infiniteQueryOptions, useInfiniteQuery } from '@tanstack/react-query'

function postsInfiniteOptions() {
  return infiniteQueryOptions({
    queryKey: ['posts'] as const,
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}

// Type-safe across hooks and QueryClient methods
useInfiniteQuery(postsInfiniteOptions())
queryClient.prefetchInfiniteQuery(postsInfiniteOptions())
```

---

## `useSuspenseInfiniteQuery`

Same as `useInfiniteQuery` but with Suspense integration. `data` is guaranteed defined.

```typescript
import { useSuspenseInfiniteQuery } from '@tanstack/react-query'

function PostList() {
  const { data, fetchNextPage, hasNextPage } = useSuspenseInfiniteQuery({
    queryKey: ['posts'],
    queryFn: ({ pageParam }) => fetchPosts(pageParam),
    initialPageParam: '',
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })

  // data is guaranteed defined
  const allPosts = data.pages.flatMap((p) => p.posts)
  return <div>{allPosts.map(/* ... */)}</div>
}
```

---

## Prefetching Infinite Queries

```typescript
// Prefetch first page
await queryClient.prefetchInfiniteQuery({
  queryKey: ['posts'],
  queryFn: ({ pageParam }) => fetchPosts(pageParam),
  initialPageParam: '',
  pages: 3, // Prefetch first 3 pages
  getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
})
```

---

## Invalidation Notes

When invalidating infinite queries, all pages are refetched. This is by design to ensure data consistency:

```typescript
// This refetches ALL pages of the infinite query
queryClient.invalidateQueries({ queryKey: ['posts'] })
```

If you want to refetch only a single page, use `refetchPage` in the refetch options:

```typescript
const { refetch } = useInfiniteQuery({ ... })

refetch({
  refetchPage: (page, index) => index === 0, // Only refetch first page
})
```

---

**Source:** https://tanstack.com/query/v5/docs/framework/react/reference/useInfiniteQuery | https://tanstack.com/query/v5/docs/framework/react/guides/infinite-queries
**Version:** 5.96.2
