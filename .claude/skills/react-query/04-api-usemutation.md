# 04 — useMutation: Data Mutation Hook

**Module Summary**: Complete `useMutation` hook reference including mutationFn patterns, lifecycle callbacks (onMutate, onSuccess, onError, onSettled), return value properties, mutation states, variables tracking, and 5+ real-world examples (basic, optimistic update, rollback, error handling).

**Source:** [https://tanstack.com/query/v5/docs/react/reference/useMutation](https://tanstack.com/query/v5/docs/react/reference/useMutation)

---

## Table of Contents
1. [Function Signature](#function-signature)
2. [Parameters](#parameters)
3. [Return Value](#return-value)
4. [Code Examples](#code-examples)
5. [Mutation vs Query](#mutation-vs-query)
6. [TypeScript Best Practices](#typescript-best-practices)
7. [Next Steps](#next-steps)

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
  queryClient?: QueryClient,
): UseMutationResult<TData, TError, TVariables, TContext>
```

---

## Parameters

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| **mutationFn** | `(variables: TVariables) => Promise<TData>` | ✅ Yes | — | Async function that performs the mutation |
| **onMutate** | `(variables: TVariables) => TContext \| void` | ❌ No | — | Called before mutation (for optimistic updates) |
| **onSuccess** | `(data: TData, variables: TVariables, context: TContext) => void` | ❌ No | — | Called when mutation succeeds |
| **onError** | `(error: TError, variables: TVariables, context: TContext) => void` | ❌ No | — | Called when mutation fails |
| **onSettled** | `(data: TData \| undefined, error: TError \| null, variables: TVariables, context: TContext) => void` | ❌ No | — | Called regardless of success/failure |
| **retry** | `boolean \| number \| RetryFn` | ❌ No | `0` | Retry count or function (default: no retry) |
| **retryDelay** | `number \| RetryDelayFn` | ❌ No | Exponential | Delay between retries (ms) |
| **networkMode** | `'always' \| 'online' \| 'offlineFirst'` | ❌ No | `'online'` | Network mode behavior |

---

## Return Value

| Property | Type | Description |
|----------|------|-------------|
| **data** | `TData \| undefined` | The data returned from mutationFn |
| **error** | `TError \| null` | The error object if mutation failed |
| **variables** | `TVariables \| undefined` | The variables passed to mutate() |
| **status** | `'idle' \| 'pending' \| 'error' \| 'success'` | Current mutation status |
| **isPending** | `boolean` | True if mutation is currently executing |
| **isError** | `boolean` | True if mutation errored |
| **isSuccess** | `boolean` | True if mutation succeeded |
| **isIdle** | `boolean` | True if mutation has not been called yet |
| **mutate** | `(variables: TVariables, options?: MutateOptions) => void` | Call mutation (no return value) |
| **mutateAsync** | `(variables: TVariables, options?: MutateOptions) => Promise<TData>` | Call mutation and get Promise |
| **reset** | `() => void` | Reset mutation state to idle |

---

## Code Examples

### 1. Basic Mutation

```typescript
import { useMutation, useQueryClient } from '@tanstack/react-query';

interface Todo {
  id: number;
  title: string;
  completed: boolean;
}

function CreateTodo() {
  const queryClient = useQueryClient();

  const createTodoMutation = useMutation({
    mutationFn: async (newTodo: Omit<Todo, 'id'>) => {
      const res = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newTodo),
      });
      if (!res.ok) throw new Error('Failed to create');
      return res.json();
    },
    onSuccess: () => {
      // Refetch todos list after creating
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <button
      onClick={() =>
        createTodoMutation.mutate({
          title: 'New Todo',
          completed: false,
        })
      }
      disabled={createTodoMutation.isPending}
    >
      {createTodoMutation.isPending ? 'Creating...' : 'Create Todo'}
    </button>
  );
}
```

### 2. Optimistic Update

```typescript
function UpdateTodo({ todoId }: { todoId: number }) {
  const queryClient = useQueryClient();

  const updateMutation = useMutation({
    mutationFn: (updatedTitle: string) =>
      fetch(`/api/todos/${todoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: updatedTitle }),
      }).then(res => res.json()),

    onMutate: (newTitle) => {
      // Cancel outgoing refetches
      queryClient.cancelQueries({ queryKey: ['todos', todoId] });

      // Snapshot old data
      const previousTodo = queryClient.getQueryData(['todos', todoId]);

      // Optimistically update cache
      queryClient.setQueryData(['todos', todoId], (old: Todo) => ({
        ...old,
        title: newTitle,
      }));

      return { previousTodo };
    },

    onError: (err, newTitle, context) => {
      // Rollback on failure
      if (context?.previousTodo) {
        queryClient.setQueryData(['todos', todoId], context.previousTodo);
      }
    },

    onSuccess: () => {
      // Refetch to confirm server state
      queryClient.invalidateQueries({ queryKey: ['todos', todoId] });
    },
  });

  return (
    <button
      onClick={() => updateMutation.mutate('Updated Title')}
      disabled={updateMutation.isPending}
    >
      Update
    </button>
  );
}
```

### 3. Delete with Rollback

```typescript
function DeleteTodo({ todoId }: { todoId: number }) {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: () =>
      fetch(`/api/todos/${todoId}`, { method: 'DELETE' }),

    onMutate: () => {
      // Snapshot current todos list
      const previousTodos = queryClient.getQueryData(['todos']);

      // Optimistically remove from list
      queryClient.setQueryData(['todos'], (old: Todo[]) =>
        old.filter(t => t.id !== todoId)
      );

      return { previousTodos };
    },

    onError: (err, variables, context) => {
      // Restore on failure
      if (context?.previousTodos) {
        queryClient.setQueryData(['todos'], context.previousTodos);
      }
    },

    onSuccess: () => {
      // Confirm deletion
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });

  return (
    <button
      onClick={() => deleteMutation.mutate()}
      disabled={deleteMutation.isPending}
    >
      {deleteMutation.isPending ? 'Deleting...' : 'Delete'}
    </button>
  );
}
```

### 4. Mutation with Error Handling

```typescript
function SignUp() {
  const signUpMutation = useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
      });

      if (!res.ok) {
        const error = await res.json();
        throw new Error(error.message || 'Signup failed');
      }

      return res.json();
    },

    onError: (error: Error) => {
      // Show error to user
      alert('Signup failed: ' + error.message);
    },

    onSuccess: (data) => {
      // Store token, redirect, etc.
      localStorage.setItem('token', data.token);
    },
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        signUpMutation.mutate({
          email: 'user@example.com',
          password: 'pass123',
        });
      }}
    >
      {signUpMutation.isError && (
        <div>Error: {signUpMutation.error?.message}</div>
      )}
      <button type="submit" disabled={signUpMutation.isPending}>
        {signUpMutation.isPending ? 'Signing up...' : 'Sign Up'}
      </button>
    </form>
  );
}
```

### 5. Using mutateAsync for Promise-based Flow

```typescript
function FormWithValidation() {
  const mutation = useMutation({
    mutationFn: (data: FormData) =>
      fetch('/api/submit', { method: 'POST', body: JSON.stringify(data) })
        .then(res => res.json()),
  });

  const handleSubmit = async (formData: FormData) => {
    try {
      const result = await mutation.mutateAsync(formData);
      console.log('Success:', result);
    } catch (error) {
      console.error('Failed:', error);
    }
  };

  return (
    <form onSubmit={(e) => {
      e.preventDefault();
      handleSubmit(new FormData(e.currentTarget));
    }}>
      {/* form fields */}
    </form>
  );
}
```

---

## Mutation vs Query

| Aspect | Query | Mutation |
|--------|-------|----------|
| **Purpose** | Fetch/read data | Modify/write data |
| **Trigger** | Automatic (on mount, stale, etc.) | Manual (`mutate()`) |
| **Caching** | Cached automatically | Not cached (by default) |
| **Retries** | Yes (default: 3) | No (default: 0) |
| **Lifecycle** | Continuous | One-time event |
| **Use For** | GET requests | POST, PUT, PATCH, DELETE |

---

## TypeScript Best Practices

```typescript
interface CreateTodoInput {
  title: string;
  completed: boolean;
}

interface TodoResponse {
  id: number;
  title: string;
  completed: boolean;
}

const mutation = useMutation<
  TodoResponse,           // TData
  Error,                  // TError
  CreateTodoInput,        // TVariables
  undefined               // TContext
>({
  mutationFn: (input) => {
    // input is typed as CreateTodoInput
    return fetch('/api/todos', { method: 'POST', body: JSON.stringify(input) })
      .then(res => res.json());
  },
});

// mutation.mutate expects CreateTodoInput
mutation.mutate({ title: 'Test', completed: false });
```

---

## Next Steps

1. [13-guide-mutations-workflows.md](./13-guide-mutations-workflows.md) — Advanced mutation patterns
2. [10-guide-caching.md](./10-guide-caching.md) — Cache invalidation strategies
3. [11-guide-error-handling.md](./11-guide-error-handling.md) — Error recovery patterns

---

**Source Documentation:**
- [useMutation | TanStack Query](https://tanstack.com/query/v5/docs/react/reference/useMutation)
- [Mutations Guide | TanStack Query](https://tanstack.com/query/v5/docs/react/guides/mutations)