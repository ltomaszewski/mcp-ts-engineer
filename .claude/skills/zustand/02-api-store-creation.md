# API Reference: Store Creation
**Module:** `02-api-store-creation.md` | **Version:** 4.x | **Status:** Complete

**Source:** [https://zustand.docs.pmnd.rs/apis/create-store](https://zustand.docs.pmnd.rs/apis/create-store)

---

## Table of Contents
1. [create() - React Hook Factory](#create---react-hook-factory)
2. [createStore() - Vanilla Store Factory](#createstore---vanilla-store-factory)
3. [Type Definitions](#type-definitions)
4. [State Creator Function](#state-creator-function)
5. [Comparison Table](#comparison-table)

---

## `create()` - React Hook Factory

### Description
Returns a React hook that allows components to subscribe to specific slices of state. Automatically handles component re-rendering when selected state changes. The most common way to create stores in React applications.

### Type Signature
```typescript
create<T>(stateCreator: StateCreator<T, [], []>): UseBoundStore<T>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `stateCreator` | `StateCreator<T, [], []>` | Function receiving `(set, get, store)` that returns state object |

### Return Value

| Type | Description |
|------|-------------|
| `UseBoundStore<T>` | React hook function that can be called in components or standalone |

**Hook Properties:**
```typescript
interface UseBoundStore<T> {
  // Call in component to subscribe to state
  (selector: (state: T) => U): U
  
  // Standalone access methods
  getState: () => T
  setState: (state: Partial<T> | ((state: T) => Partial<T>), replace?: boolean) => void
  subscribe: (listener: (state: T) => void) => () => void
  
  // For middleware
  [Symbol.observable]: () => any
}
```

### Code Example: Basic React Store

```typescript
import { create } from 'zustand'

interface CountStore {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const useCount = create<CountStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))

// In component:
function Counter() {
  const { count, increment, decrement } = useCount((state) => ({
    count: state.count,
    increment: state.increment,
    decrement: state.decrement,
  }))
  
  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={increment}>+</button>
      <button onClick={decrement}>-</button>
    </div>
  )
}

// Outside component:
console.log(useCount.getState().count) // Direct access
useCount.setState({ count: 10 }) // Direct update
```

### Code Example: With TypeScript Strict Types

```typescript
import { create, StateCreator } from 'zustand'

type UserStore = {
  user: { id: string; name: string; email: string }
  setUser: (user: UserStore['user']) => void
  clearUser: () => void
}

const useUser = create<UserStore>((set) => ({
  user: { id: '', name: '', email: '' },
  setUser: (user) => set({ user }),
  clearUser: () => set({
    user: { id: '', name: '', email: '' }
  }),
}))

export default useUser
```

---

## `createStore()` - Vanilla Store Factory

### Description
Creates a framework-agnostic store without React hooks. Returns a store object with methods like `getState()`, `setState()`, and `subscribe()`. Perfect for non-React applications, Node.js, or complex subscription patterns.

### Type Signature
```typescript
createStore<T>(stateCreator: StateCreator<T, [], []>): StoreApi<T>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `stateCreator` | `StateCreator<T, [], []>` | Function receiving `(set, get, store)` that returns state object |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `getState` | `() => T` | Get current state snapshot |
| `setState` | `(state: Partial<T> \| ((state: T) => Partial<T>), replace?: boolean) => void` | Update state |
| `subscribe` | `(listener: (state: T, prevState: T) => void) => () => void` | Subscribe to all changes, returns unsubscribe function |
| `getInitialState` | `() => T` | Get the initial state as it was defined |

### Code Example: Vanilla Store (Non-React)

```typescript
import { createStore } from 'zustand/vanilla'

interface PositionState {
  position: { x: number; y: number }
  setPosition: (position: { x: number; y: number }) => void
}

const positionStore = createStore<PositionState>()((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (position) => set({ position }),
}))

// Get current state
const currentPos = positionStore.getState().position
console.log(currentPos) // { x: 0, y: 0 }

// Update state
positionStore.setState({ position: { x: 100, y: 200 } })

// Subscribe to changes
const unsubscribe = positionStore.subscribe(
  (state, prevState) => {
    console.log('Position changed:', state.position)
  }
)

// Handle DOM
const $dot = document.getElementById('dot')
positionStore.subscribe((state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
})

// Clean up
unsubscribe()
```

### Code Example: Updater Functions Pattern

```typescript
import { createStore } from 'zustand/vanilla'

interface AgeStore {
  age: number
  setAge: (
    nextAge: number | ((currentAge: number) => number)
  ) => void
}

const ageStore = createStore<AgeStore>()((set) => ({
  age: 42,
  setAge: (nextAge) =>
    set((state) => ({
      age: typeof nextAge === 'function'
        ? nextAge(state.age)
        : nextAge,
    })),
}))

// Direct value
ageStore.getState().setAge(50)

// Or updater function
ageStore.getState().setAge((age) => age + 1)
```

---

## Type Definitions

### StateCreator Type

The function signature all stores follow:

```typescript
type StateCreator<
  T,                          // State type
  Mus extends [any, ...any[]] = [],  // Middleware mutators
  Mu extends [any, ...any[]] = [],   // Current middleware
> = (
  set: (
    state: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean
  ) => void,
  get: () => T,
  store: StoreApi<T>
) => T
```

### StoreApi Type

```typescript
interface StoreApi<T> {
  getState: () => T
  setState: (
    state: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean
  ) => void
  subscribe: (
    listener: (state: T, previousState: T) => void
  ) => () => void
  getInitialState: () => T
  destroy: () => void
}
```

### UseBoundStore Type

```typescript
interface UseBoundStore<T> extends StoreApi<T> {
  (selector?: (state: T) => any, equals?: (a: any, b: any) => boolean): any
  [Symbol.observable]: () => { subscribe: (observer: any) => () => void }
}
```

---

## State Creator Function

### The `set` Parameter

Updates state, performing shallow merge by default:

```typescript
// Direct object merge
set({ count: 1 })

// Function form - receives current state
set((state) => ({ count: state.count + 1 }))

// Replace entire state (second param)
set({ count: 0 }, true) // Completely replaces state
```

### The `get` Parameter

Access current state synchronously:

```typescript
create((set, get) => ({
  count: 0,
  increment: () => set({ count: get().count + 1 }),
  doubleCount: () => get().count * 2,
}))
```

### The `store` Parameter

Access the underlying store API:

```typescript
create((set, get, store) => ({
  count: 0,
  reset: () => {
    store.setState(store.getInitialState())
  },
  subscribe: (listener) => store.subscribe(listener),
}))
```

---

## Comparison Table

| Aspect | `create()` | `createStore()` |
|--------|-----------|-----------------|
| **Returns** | React hook | Store API object |
| **React Integration** | Built-in | None - manual subscription |
| **Component Re-renders** | Automatic | Manual via subscribe |
| **Usage Context** | React components only | Non-React, Node.js, vanilla JS |
| **Import** | `zustand` | `zustand/vanilla` |
| **Middleware Support** | Full | Full |
| **getState Access** | `hook.getState()` | `store.getState()` |
| **State Update** | `hook.setState()` | `store.setState()` |
| **Subscription** | `hook.subscribe()` | `store.subscribe()` |

---

## Best Practices

### ✅ DO

- **Type your stores** for better IDE support:
  ```typescript
  const useStore = create<MyStoreType>((set) => ({...}))
  ```

- **Use `createStore` for non-React** scenarios
- **Export hooks directly** for clean imports:
  ```typescript
  export const useAuth = create(...)
  ```

- **Separate concerns** - keep unrelated state in different stores

### ❌ DON'T

- **Over-type simple stores**:
  ```typescript
  // Too verbose for simple cases
  const useBear = create<{ count: number }>((set) => ({ count: 0 }))
  // Just let inference work when obvious
  ```

- **Mix create() and createStore()** in the same app unnecessarily
- **Store mutable references** that change frequently

---

## Cross-Module References

- **Selection Patterns:** [API Reference: Selectors](04-api-selectors.md)
- **State Mutations:** [API Reference: State Management](03-api-state-management.md)
- **Middleware:** [Middleware: Core Features](06-middleware-core.md)
- **Advanced Patterns:** [Advanced Patterns](07-advanced-patterns.md)

---

**Official Source:** [https://zustand.docs.pmnd.rs/apis/create-store](https://zustand.docs.pmnd.rs/apis/create-store)