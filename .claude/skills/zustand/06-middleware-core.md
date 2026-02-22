# Middleware: devtools, immer, combine, subscribeWithSelector

**Module:** `06-middleware-core.md` | **Version:** 5.x (^5.0.11)

---

## `devtools()` Middleware

### Description

Enables Redux DevTools Extension integration for time-travel debugging, action history, and state inspection.

### Import

```typescript
import { devtools } from 'zustand/middleware'
```

### Type Signature

```typescript
devtools<T>(
  stateCreator: StateCreator<T, [], []>,
  devtoolsOptions?: DevtoolsOptions,
): StateCreator<T, [['zustand/devtools', never]], []>
```

### Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `name` | `string` | -- | Custom connection name in DevTools |
| `enabled` | `boolean` | `true` in dev, `false` in prod | Enable/disable DevTools |
| `anonymousActionType` | `string` | `'anonymous'` | Label for unnamed actions |
| `store` | `string` | -- | Store identifier for multi-store setups |

### Code Example

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useStore = create<CountState>()(
  devtools(
    (set) => ({
      count: 0,
      increment: () =>
        set((s) => ({ count: s.count + 1 }), undefined, 'increment'),
      decrement: () =>
        set((s) => ({ count: s.count - 1 }), undefined, 'decrement'),
    }),
    { name: 'CountStore', enabled: process.env.NODE_ENV === 'development' }
  )
)
```

The third argument to `set` is the action name visible in DevTools:

```typescript
set(newState, replace?, actionName?)
```

### Cleanup (v5.0.5+)

Disconnect from DevTools and clean up resources:

```typescript
// Clean up devtools connection when done
useStore.devtools?.cleanup()
```

### Middleware Ordering

**devtools must be the outermost middleware** (except persist):

```typescript
// CORRECT
create(persist(devtools(immer((set) => ({...})))))

// CORRECT (devtools outermost when no persist)
create(devtools(immer(subscribeWithSelector((set) => ({...})))))

// WRONG: devtools inside immer
create(immer(devtools((set) => ({...}))))
```

**Recommended order (outermost to innermost):**
1. `persist` (outermost)
2. `devtools`
3. `subscribeWithSelector`
4. `immer` (innermost)
5. `combine` (innermost)

---

## `immer()` Middleware

### Description

Enables mutable-style state updates using Immer. Write mutations that look like direct changes; Immer produces immutable updates under the hood.

### Import

```typescript
import { immer } from 'zustand/middleware/immer'
```

### Peer Dependency

```bash
npm install immer
```

### Type Signature

```typescript
immer<T>(
  stateCreator: StateCreator<T, [], []>,
): StateCreator<T, [['zustand/immer', never]], []>
```

### Code Example: Basic

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface CountState {
  count: number
  increment: (qty: number) => void
  decrement: (qty: number) => void
}

const useCountStore = create<CountState>()(
  immer((set) => ({
    count: 0,
    increment: (qty) =>
      set((state) => {
        state.count += qty  // Direct mutation -- immer handles immutability
      }),
    decrement: (qty) =>
      set((state) => {
        state.count -= qty
      }),
  }))
)
```

### Code Example: Nested State

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

interface Todo {
  id: string
  title: string
  done: boolean
}

interface TodoState {
  todos: Record<string, Todo>
  toggleTodo: (id: string) => void
  addTodo: (todo: Todo) => void
  removeTodo: (id: string) => void
}

const useTodoStore = create<TodoState>()(
  immer((set) => ({
    todos: {},
    toggleTodo: (id) =>
      set((state) => {
        state.todos[id].done = !state.todos[id].done
      }),
    addTodo: (todo) =>
      set((state) => {
        state.todos[todo.id] = todo
      }),
    removeTodo: (id) =>
      set((state) => {
        delete state.todos[id]
      }),
  }))
)
```

### When to Use immer

| Scenario | Without immer | With immer |
|----------|--------------|------------|
| Shallow update | `set({ count: 1 })` | Same |
| Nested object | `set(s => ({ user: { ...s.user, name: 'Jane' } }))` | `set(s => { s.user.name = 'Jane' })` |
| Array push | `set(s => ({ items: [...s.items, item] }))` | `set(s => { s.items.push(item) })` |
| Deep nested | Multi-level spread chain | Direct mutation |

**Use immer when:** Deeply nested state, frequent array/object mutations, complex state shapes.
**Skip immer when:** Simple flat state, few nested updates.

---

## `combine()` Middleware

### Description

Merges initial state with a state creator function. Automatically infers types from the initial state object, eliminating explicit type annotations.

### Import

```typescript
import { combine } from 'zustand/middleware'
```

### Type Signature

```typescript
combine<T, U>(
  initialState: T,
  additionalStateCreator: StateCreator<T, [], [], U>,
): StateCreator<Omit<T, keyof U> & U, [], []>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialState` | `T` | Object with initial values (not a function) |
| `additionalStateCreator` | `(set, get, store) => U` | Returns actions/methods |

### Code Example

```typescript
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

// No explicit type annotation needed -- types inferred from initial state
const useStore = create(
  combine(
    {
      count: 0,
      user: { name: '', email: '' },
      todos: [] as string[],
    },
    (set, get) => ({
      increment: () => set((s) => ({ count: s.count + 1 })),
      setUser: (user: { name: string; email: string }) => set({ user }),
      addTodo: (todo: string) =>
        set((s) => ({ todos: [...s.todos, todo] })),
    })
  )
)

// Types are automatically inferred
const count = useStore.getState().count       // number
const name = useStore.getState().user.name    // string
```

### When to Use combine

- When you want automatic TypeScript inference without interfaces
- For simpler stores where explicit types are overhead
- As the innermost middleware in a composition

---

## `subscribeWithSelector()` Middleware

### Description

Adds selective subscription capability to stores. Subscribe to specific state slices outside React -- only fires when the selected value changes.

### Import

```typescript
import { subscribeWithSelector } from 'zustand/middleware'
```

### Type Signature

```typescript
subscribeWithSelector<T>(
  stateCreator: StateCreator<T, [], []>,
): StateCreator<T, [['zustand/subscribeWithSelector', never]], []>
```

### Enhanced `subscribe` Signature

```typescript
// Full state subscription (same as default)
subscribe(listener: (state: T, prev: T) => void): () => void

// Selective subscription (added by middleware)
subscribe<U>(
  selector: (state: T) => U,
  listener: (selected: U, previousSelected: U) => void,
  options?: {
    equalityFn?: (a: U, b: U) => boolean
    fireImmediately?: boolean
  },
): () => void
```

### Code Example

```typescript
import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'

interface PositionState {
  position: { x: number; y: number }
  setPosition: (pos: { x: number; y: number }) => void
}

const store = createStore<PositionState>()(
  subscribeWithSelector((set) => ({
    position: { x: 0, y: 0 },
    setPosition: (position) => set({ position }),
  }))
)

// Subscribe to specific slice
const unsub1 = store.subscribe(
  (state) => state.position,
  (position) => console.log('Position changed:', position),
)

// Subscribe to nested value
const unsub2 = store.subscribe(
  (state) => state.position.x,
  (x) => console.log('X changed:', x),
)

// With custom equality
const unsub3 = store.subscribe(
  (state) => state.position,
  (pos) => console.log('Position changed significantly:', pos),
  {
    equalityFn: (a, b) =>
      Math.abs(a.x - b.x) < 5 && Math.abs(a.y - b.y) < 5,
  },
)

// Fire immediately on subscribe
const unsub4 = store.subscribe(
  (state) => state.position,
  (pos) => console.log('Current position:', pos),
  { fireImmediately: true },
)
```

---

## Middleware Composition

### Full Stack Example

```typescript
import { create } from 'zustand'
import { persist, devtools, subscribeWithSelector } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

interface AppState {
  count: number
  user: { name: string }
  increment: () => void
  setUser: (name: string) => void
}

const useAppStore = create<AppState>()(
  persist(
    devtools(
      subscribeWithSelector(
        immer((set) => ({
          count: 0,
          user: { name: '' },
          increment: () =>
            set((state) => { state.count += 1 }, undefined, 'increment'),
          setUser: (name) =>
            set((state) => { state.user.name = name }, undefined, 'setUser'),
        }))
      ),
      { name: 'AppStore' }
    ),
    {
      name: 'app-storage',
      partialize: (state) => ({ count: state.count, user: state.user }),
    }
  )
)
```

### TypeScript with Middleware Mutators

When composing middleware, TypeScript tracks the mutator chain:

```typescript
import { create, StateCreator } from 'zustand'
import { persist, devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Use combine for automatic inference (recommended)
import { combine } from 'zustand/middleware'

const useStore = create(
  persist(
    devtools(
      combine(
        { count: 0 },
        (set) => ({
          increment: () => set((s) => ({ count: s.count + 1 })),
        })
      ),
      { name: 'Store' }
    ),
    { name: 'store-key' }
  )
)
// Types inferred automatically -- no explicit annotation needed
```

---

**Source:**
- https://zustand.docs.pmnd.rs/middlewares/devtools
- https://zustand.docs.pmnd.rs/middlewares/immer
- https://zustand.docs.pmnd.rs/middlewares/combine
- https://zustand.docs.pmnd.rs/middlewares/subscribe-with-selector

**Version:** 5.x (^5.0.11)
