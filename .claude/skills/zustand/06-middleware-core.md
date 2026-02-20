# Middleware: Core Features
**Module:** `06-middleware-core.md` | **Version:** 4.x | **Status:** Complete

**Source:** [https://zustand.docs.pmnd.rs/middlewares/combine](https://zustand.docs.pmnd.rs/middlewares/combine)

---

## Table of Contents
1. [combine() Middleware](#combine-middleware)
2. [subscribeWithSelector() Middleware](#subscribewithselector-middleware)
3. [Middleware Composition](#middleware-composition)
4. [TypeScript Mutators](#typescript-mutators)
5. [Best Practices](#best-practices)

---

## `combine()` Middleware

### Description
Merges an initial state object with a state creator function. Automatically infers types, eliminating need for explicit type annotations. Simplifies store creation and makes curried versions unnecessary.

### Type Signature
```typescript
combine<T, U>(
  initialState: T,
  additionalStateCreatorFn: StateCreator<T, [], [], U>
): StateCreator<Omit<T, keyof U> & U, [], []>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialState` | `T` | Object with initial state values. Cannot be a function. |
| `additionalStateCreatorFn` | `StateCreator<T, [], [], U>` | Function receiving `(set, get, store)` that returns actions/methods |

### Return Value
| Type | Description |
|------|-------------|
| `StateCreator` | A state creator function ready for `create()` or `createStore()` |

### Code Example: Basic combine()

```typescript
import { createStore } from 'zustand/vanilla'
import { combine } from 'zustand/middleware'

// No need for explicit types - they're inferred!
const positionStore = createStore(
  combine(
    { position: { x: 0, y: 0 } }, // Initial state
    (set) => ({
      setPosition: (position) => set({ position }),
    })
  )
)

// Types automatically inferred
const pos = positionStore.getState().position // ✓ Type: { x: number; y: number }
positionStore.getState().setPosition({ x: 10, y: 20 }) // ✓ Type-safe
```

### Code Example: With React Hook

```typescript
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

const useStore = create(
  combine(
    {
      count: 0,
      user: { name: '', email: '' },
      todos: [] as string[],
    },
    (set, get) => ({
      increment: () => set((state) => ({ count: state.count + 1 })),
      setUser: (user) => set({ user }),
      addTodo: (todo) => set((state) => ({
        todos: [...state.todos, todo],
      })),
      // Access other values via get()
      getFullState: () => get(),
    })
  )
)

// Usage
function App() {
  const { count, increment, user } = useStore((state) => ({
    count: state.count,
    increment: state.increment,
    user: state.user,
  }))
  
  return <div>{count} - {user.name}</div>
}
```

### Code Example: Nested State with combine()

```typescript
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

const useAppStore = create(
  combine(
    {
      auth: {
        isLoggedIn: false,
        user: null as { id: string; email: string } | null,
      },
      ui: {
        sidebarOpen: true,
        theme: 'light' as 'light' | 'dark',
      },
      data: {
        items: [] as Array<{ id: string; title: string }>,
      },
    },
    (set, get) => ({
      login: (user) => set((state) => ({
        auth: { ...state.auth, isLoggedIn: true, user },
      })),
      logout: () => set((state) => ({
        auth: { ...state.auth, isLoggedIn: false, user: null },
      })),
      toggleSidebar: () => set((state) => ({
        ui: { ...state.ui, sidebarOpen: !state.ui.sidebarOpen },
      })),
      addItem: (item) => set((state) => ({
        data: { ...state.data, items: [...state.data.items, item] },
      })),
    })
  )
)
```

---

## `subscribeWithSelector()` Middleware

### Description
Adds selective subscription capability to stores. Allows subscribing to specific state slices rather than entire state. Enables fine-grained reactivity outside components.

### Type Signature
```typescript
subscribeWithSelector<T>(
  stateCreator: StateCreator<T, [], []>
): StateCreator<T, [['zustand/subscribeWithSelector', never]], []>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `stateCreator` | `StateCreator<T, [], []>` | Your store's state creator function |

### Return Value
| Type | Description |
|------|-------------|\n| `StateCreator` | Enhanced state creator with selective subscription |

### Code Example: Selective Subscription

```typescript
import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'

type PositionState = {
  position: { x: number; y: number }
  setPosition: (pos: { x: number; y: number }) => void
}

const positionStore = createStore<PositionState>()(
  subscribeWithSelector((set) => ({
    position: { x: 0, y: 0 },
    setPosition: (position) => set({ position }),
  }))
)

// Subscribe to entire state
positionStore.subscribe((state) => {
  console.log('State changed:', state)
})

// Subscribe to specific slice
positionStore.subscribe(
  (state) => state.position,
  (position) => {
    console.log('Position changed:', position)
  }
)

// Subscribe to nested value
positionStore.subscribe(
  (state) => state.position.x,
  (x) => {
    console.log('X coordinate changed:', x)
  }
)

// Update state
positionStore.setState({ position: { x: 100, y: 200 } })
// Logs: "Position changed: {x:100,y:200}"
// Logs: "X coordinate changed: 100"
```

### Code Example: DOM Integration

```typescript
import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'

const store = createStore()(
  subscribeWithSelector((set) => ({
    color: 'red',
    size: 10,
    setColor: (color) => set({ color }),
    setSize: (size) => set({ size }),
  }))
)

const element = document.getElementById('box')

// React to color changes
store.subscribe(
  (state) => state.color,
  (color) => {
    element.style.backgroundColor = color
  }
)

// React to size changes
store.subscribe(
  (state) => state.size,
  (size) => {
    element.style.width = `${size}px`
    element.style.height = `${size}px`
  }
)

// Initial render
const initialState = store.getState()
element.style.backgroundColor = initialState.color
element.style.width = `${initialState.size}px`
```

---

## Middleware Composition

### Basic Composition

```typescript
import { create } from 'zustand'
import { persist, combine, subscribeWithSelector } from 'zustand/middleware'

const useStore = create(
  persist(
    subscribeWithSelector(
      combine(
        { count: 0 },
        (set) => ({ increment: () => set((s) => ({ count: s.count + 1 })) })
      )
    ),
    { name: 'store' }
  )
)
```

**Middleware Order:** The order of middleware wrapping is important!

| Position | Middleware | Effect |
|----------|-----------|--------|
| **Outermost** | `persist` | Persists/rehydrates state |
| **Middle** | `subscribeWithSelector` | Enables selective subscriptions |
| **Inner** | `combine` | Type inference and initial state |

### ❌ WRONG Order

```typescript
// DON'T: persist inside subscribeWithSelector
create(subscribeWithSelector(persist((set) => ({...}))))
// DevTools won't see persisted state properly
```

### ✅ RIGHT Order

```typescript
// DO: persist outside other middleware
create(persist(subscribeWithSelector((set) => ({...}))))
// DevTools sees full lifecycle including persistence
```

---

## TypeScript Mutators

When composing middleware, TypeScript needs to understand the mutator chain:

### Mutator Type Pattern

```typescript
import { create, Mutate, StoreApi } from 'zustand'
import { persist, subscribeWithSelector, combine } from 'zustand/middleware'

type State = {
  count: number
  increment: () => void
}

type Store = Mutate<
  StoreApi<State>,
  [
    ['zustand/persist', unknown],
    ['zustand/subscribeWithSelector', never],
  ]
>

const useStore: Store = create(
  persist(
    subscribeWithSelector((set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    })),
    { name: 'store' }
  )
)
```

### Simpler Alternative with combine()

```typescript
import { create } from 'zustand'
import { persist, subscribeWithSelector, combine } from 'zustand/middleware'

// combine automatically infers types
const useStore = create(
  persist(
    subscribeWithSelector(
      combine(
        { count: 0 },
        (set) => ({ increment: () => set((s) => ({ count: s.count + 1 })) })
      )
    ),
    { name: 'store' }
  )
)

// Types work perfectly without explicit annotations!
```

---

## Best Practices

### ✅ DO

- **Use `combine()` for automatic type inference**
```typescript
create(
  combine(
    { initial: 'state' },
    (set) => ({ action: () => {} })
  )
)
```

- **Compose middleware intentionally**
- **Use `subscribeWithSelector` for DOM reactivity**
- **Test middleware composition** - order matters!

### ❌ DON'T

- **Don't randomly change middleware order** - it affects behavior
- **Don't nest persist** inside other middleware
- **Don't mix manual types with combine()** - let it infer types
- **Don't forget mutator types** when manually composing

---

## Comparison: combine() Patterns

| Pattern | Type Safety | Boilerplate | Inference |
|---------|-------------|------------|-----------|
| Manual types | Excellent | High | Manual |
| `combine()` | Excellent | Low | Automatic |
| No types | Poor | Low | None |

---

## Cross-Module References

- **Store Creation:** [API Reference: Store Creation](02-api-store-creation.md)
- **Persistence:** [Middleware: Persistence](05-middleware-persist.md)
- **Advanced Patterns:** [Advanced Patterns](07-advanced-patterns.md)
- **Selectors:** [API Reference: Selectors](04-api-selectors.md)

---

**Official Sources:**
- [https://zustand.docs.pmnd.rs/middlewares/combine](https://zustand.docs.pmnd.rs/middlewares/combine)
- [https://zustand.docs.pmnd.rs/middlewares/subscribe-with-selector](https://zustand.docs.pmnd.rs/middlewares/subscribe-with-selector)