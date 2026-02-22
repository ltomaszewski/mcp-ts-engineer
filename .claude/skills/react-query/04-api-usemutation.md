# useMutation: Data Mutation Hook

**Module:** `04-api-usemutation.md` | **Version:** 5.x (^5.62.11)

---

## Function Signature

```typescript
function useMutation<
  TData = unknown,
  TError = DefaultError,
  TVariables = void,
  TContext = unknown,
>(
  options: UseMutationOptions<TData, TError, TVariables, TContext>,
): UseMutationResult<TData, TError, TVariables, TContext>
```

---

## All Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `mutationFn` | `(variables: TVariables) => Promise<TData>` | Yes | -- | Async function that performs the mutation |
| `mutationKey` | `MutationKey` | No | -- | Optional key for mutation deduplication |
| `onMutate` | `(variables: TVariables) => Promise<TContext> \| TContext` | No | -- | Called before mutation (optimistic updates) |
| `onSuccess` | `(data: TData, variables: TVariables, context: TContext) => void` | No | -- | Called on success |
| `onError` | `(error: TError, variables: TVariables, context: TContext) => void` | No | -- | Called on error |
| `onSettled` | `(data: TData \| undefined, error: TError \| null, variables: TVariables, context: TContext) => void` | No | -- | Called after success or error |
| `retry` | `boolean \| number \| RetryFn` | No | `0` | Retry count (default: no retry) |
| `retryDelay` | `number \| RetryDelayFn` | No | Exponential | Delay between retries |
| `networkMode` | `'online' \| 'always' \| 'offlineFirst'` | No | `'online'` | Network behavior |
| `gcTime` | `number` | No | `300000` (5 min) | GC time for mutation result |
| `throwOnError` | `boolean \| (error) => boolean` | No | `false` | Throw to error boundary |
| `meta` | `Record<string, unknown>` | No | -- | Metadata |

---

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| `data` | `TData \| undefined` | Data from mutationFn |
| `error` | `TError \| null` | Error if mutation failed |
| `variables` | `TVariables \| undefined` | Variables passed to mutate() |
| `status` | `'idle' \| 'pending' \| 'error' \| 'success'` | Mutation status |
| `isPending` | `boolean` | Currently executing |
| `isError` | `boolean` | Mutation errored |
| `isSuccess` | `boolean` | Mutation succeeded |
| `isIdle` | `boolean` | Not yet called |
| `mutate` | `(variables, options?) => void` | Fire mutation (void return) |
| `mutateAsync` | `(variables, options?) => Promise<TData>` | Fire mutation (Promise return) |
| `reset` | `() => void` | Reset state to idle |
| `submittedAt` | `number` | Timestamp of last mutate call |
| `failureCount` | `number` | Consecutive failure count |
| `failureReason` | `TError \| null` | Reason for last failure |

---

## Code Examples

### Basic Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface Todo {
  id: number
  title: string
  completed: boolean
}

function CreateTodo() {
  const queryClient = useQueryClient()

  const mutation = useMutation({
    mutationFn: async (newTodo: Omit<Todo, 'id'>) => {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      })
      if (!res.ok) throw new Error('Failed to create')
      return res.json() as Promise<Todo>
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })

  return (
    <button
      onClick={() => mutation.mutate({ title: 'New Todo', completed: false })}
      disabled={mutation.isPending}
    >
      {mutation.isPending ? 'Creating...' : 'Create Todo'}
    </button>
  )
}
```

### Optimistic Update with Rollback

```typescript
function useUpdateTodo(todoId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (updatedTitle: string) =>
      fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: updatedTitle }),
      }).then(r => r.json()),

    onMutate: async (newTitle) => {
      // 1. Cancel outgoing refetches
      await queryClient.cancelQueries({ queryKey: ['todos', todoId] })

      // 2. Snapshot previous value
      const previousTodo = queryClient.getQueryData<Todo>(['todos', todoId])

      // 3. Optimistically update
      queryClient.setQueryData<Todo>(['todos', todoId], (old) =>
        old ? { ...old, title: newTitle } : old
      )

      // 4. Return context for rollback
      return { previousTodo }
    },

    onError: (_err, _newTitle, context) => {
      // Rollback on failure
      if (context?.previousTodo) {
        queryClient.setQueryData(['todos', todoId], context.previousTodo)
      }
    },

    onSettled: () => {
      // Refetch to confirm server state
      queryClient.invalidateQueries({ queryKey: ['todos', todoId] })
    },
  })
}
```

### Delete with List Rollback

```typescript
function useDeleteTodo(todoId: number) {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: () =>
      fetch(`/api/todos/${todoId}`, { method: 'DELETE' }),

    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey: ['todos'] })
      const previousTodos = queryClient.getQueryData<Todo[]>(['todos'])

      queryClient.setQueryData<Todo[]>(['todos'], (old) =>
        old?.filter((t) => t.id !== todoId)
      )

      return { previousTodos }
    },

    onError: (_err, _vars, context) => {
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos)
      }
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] })
    },
  })
}
```

### Using mutateAsync for Promise Flow

```typescript
async function handleSubmit(data: FormData) {
  try {
    const result = await mutation.mutateAsync(data)
    console.log('Created:', result)
    navigation.navigate('Success')
  } catch (error) {
    console.error('Failed:', error)
  }
}
```

### Per-Mutation Callbacks

```typescript
const mutation = useMutation({ mutationFn: createTodo })

// Callbacks can be passed to mutate() too (run AFTER hook-level callbacks)
mutation.mutate(newTodo, {
  onSuccess: (data) => {
    console.log('This specific call succeeded:', data)
  },
  onError: (error) => {
    console.log('This specific call failed:', error)
  },
})
```

---

## Mutation vs Query

| Aspect | Query | Mutation |
|--------|-------|----------|
| Purpose | Fetch/read data | Modify/write data |
| Trigger | Automatic (mount, stale) | Manual (`mutate()`) |
| Caching | Cached by queryKey | Not cached by default |
| Retries | Default: 3 | Default: 0 |
| Lifecycle | Continuous | One-time event |
| Use for | GET requests | POST, PUT, PATCH, DELETE |

---

## TypeScript: Explicit Type Parameters

```typescript
const mutation = useMutation<
  TodoResponse,      // TData - return type
  Error,             // TError
  CreateTodoInput,   // TVariables - input type
  { previousTodos: Todo[] } // TContext - optimistic update context
>({
  mutationFn: (input) => createTodo(input),
  onMutate: async (input) => {
    const previousTodos = queryClient.getQueryData<Todo[]>(['todos']) ?? []
    return { previousTodos }
  },
})
```

---

**Source:** https://tanstack.com/query/v5/docs/react/reference/useMutation | https://tanstack.com/query/v5/docs/react/guides/mutations
**Version:** 5.x (^5.62.11)
