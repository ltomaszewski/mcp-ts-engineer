# API Reference: Store Creation

**Module:** `02-api-store-creation.md` | **Version:** 5.x (^5.0.11)

---

## `create()` -- React Hook Factory

### Description

Returns a React hook that allows components to subscribe to specific slices of state. Automatically handles component re-rendering when selected state changes.

### Type Signature

```typescript
function create<T>(stateCreator: StateCreator<T, [], []>): UseBoundStore<StoreApi<T>>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `stateCreator` | `StateCreator<T, [], []>` | Function receiving `(set, get, store)` that returns state object |

### Return Value

| Type | Description |
|------|-------------|
| `UseBoundStore<StoreApi<T>>` | React hook with attached store API utilities |

### Hook Properties

```typescript
interface UseBoundStore<S extends StoreApi<T>> {
  (): T                                        // Get full state (triggers re-render on any change)
  <U>(selector: (state: T) => U): U           // Subscribe to slice
  getState: () => T                            // Sync state snapshot
  setState: SetState<T>                        // Update state
  subscribe: (listener: (state: T, prev: T) => void) => () => void
  getInitialState: () => T                     // Initial state snapshot
}
```

### Code Example

```typescript
import { create } from 'zustand'

interface CountStore {
  count: number
  increment: () => void
  decrement: () => void
  reset: () => void
}

const useCountStore = create<CountStore>((set) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
  decrement: () => set((state) => ({ count: state.count - 1 })),
  reset: () => set({ count: 0 }),
}))

// In component
function Counter() {
  const count = useCountStore((state) => state.count)
  const increment = useCountStore((state) => state.increment)
  return <button onClick={increment}>{count}</button>
}

// Outside component
console.log(useCountStore.getState().count)
useCountStore.setState({ count: 10 })
```

---

## `createStore()` -- Vanilla Store Factory

### Description

Creates a framework-agnostic store without React hooks. Returns a store object with `getState()`, `setState()`, and `subscribe()`. For non-React applications or manual subscription patterns.

### Type Signature

```typescript
function createStore<T>(stateCreator: StateCreator<T, [], []>): StoreApi<T>
```

### Import

```typescript
import { createStore } from 'zustand/vanilla'
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `stateCreator` | `StateCreator<T, [], []>` | Function receiving `(set, get, store)` that returns state object |

### Return Value

| Property | Type | Description |
|----------|------|-------------|
| `getState` | `() => T` | Get current state snapshot |
| `setState` | `SetState<T>` | Update state (shallow merge by default) |
| `subscribe` | `(listener: (state: T, prevState: T) => void) => () => void` | Subscribe to changes, returns unsubscribe |
| `getInitialState` | `() => T` | Get initial state as defined |

### Code Example

```typescript
import { createStore } from 'zustand/vanilla'

interface PositionState {
  position: { x: number; y: number }
  setPosition: (pos: { x: number; y: number }) => void
}

const positionStore = createStore<PositionState>((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (position) => set({ position }),
}))

// Get state
const pos = positionStore.getState().position

// Update state
positionStore.setState({ position: { x: 100, y: 200 } })

// Subscribe
const unsub = positionStore.subscribe((state, prev) => {
  console.log('Changed:', prev.position, '->', state.position)
})

// DOM integration
const $dot = document.getElementById('dot')!
positionStore.subscribe((state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
})
```

---

## `createWithEqualityFn()` -- Custom Equality

### Description

Creates a React hook with a custom default equality function for comparing selected state. Useful when you need non-strict equality (e.g., `shallow`) as the default comparison.

### Import

```typescript
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'
```

### Type Signature

```typescript
function createWithEqualityFn<T>(
  stateCreator: StateCreator<T, [], []>,
  defaultEqualityFn?: (a: T, b: T) => boolean,
): UseBoundStoreWithEqualityFn<StoreApi<T>>
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `stateCreator` | `StateCreator<T>` | -- | State creator function |
| `defaultEqualityFn` | `(a: T, b: T) => boolean` | `Object.is` | Default equality function |

### Code Example

```typescript
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

const useBearStore = createWithEqualityFn<BearState>(
  (set) => ({
    bears: 0,
    fish: 0,
    addBear: () => set((s) => ({ bears: s.bears + 1 })),
  }),
  shallow, // All selectors use shallow comparison by default
)

// No need for useShallow wrapper when store uses shallow default
const { bears, fish } = useBearStore((s) => ({ bears: s.bears, fish: s.fish }))
```

**Note:** Requires `use-sync-external-store` as a peer dependency because `zustand/traditional` relies on `useSyncExternalStoreWithSelector`.

---

## `ExtractState` Type Utility (v5.0.3+)

Extract the state type from a store hook or store API:

```typescript
import { create, ExtractState } from 'zustand'

const useBearStore = create<BearState>((set) => ({
  bears: 0,
  addBear: () => set((s) => ({ bears: s.bears + 1 })),
}))

// Extract state type from hook
type BearStoreState = ExtractState<typeof useBearStore>
// { bears: number; addBear: () => void }
```

---

## Type Definitions

### StateCreator

```typescript
type StateCreator<
  T,
  Mis extends [StoreMutatorIdentifier, unknown][] = [],
  Mos extends [StoreMutatorIdentifier, unknown][] = [],
  U = T,
> = (
  set: (
    state: T | Partial<T> | ((state: T) => T | Partial<T>),
    replace?: boolean,
  ) => void,
  get: () => T,
  store: Mutate<StoreApi<T>, Mis>,
) => U
```

### State Creator Arguments

| Argument | Type | Description |
|----------|------|-------------|
| `set` | `SetState<T>` | Updates state. Shallow merge by default, replace with 2nd param `true` |
| `get` | `() => T` | Synchronous current state access |
| `store` | `StoreApi<T>` | Underlying store API (getState, setState, subscribe) |

### Using `get` for Computed Values

```typescript
const useStore = create<State>((set, get) => ({
  firstName: 'John',
  lastName: 'Doe',
  getFullName: () => `${get().firstName} ${get().lastName}`,
  updateFirst: (name: string) => {
    set({ firstName: name })
    console.log(`Now: ${get().firstName}`)
  },
}))
```

### Using `store` for Reset Pattern

```typescript
const useStore = create<State>((set, get, store) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
  reset: () => store.setState(store.getInitialState()),
}))
```

---

## Comparison Table

| Aspect | `create()` | `createStore()` | `createWithEqualityFn()` |
|--------|-----------|-----------------|--------------------------|
| Returns | React hook | Store API object | React hook (custom eq) |
| Import | `zustand` | `zustand/vanilla` | `zustand/traditional` |
| React integration | Built-in | None | Built-in |
| Default equality | `Object.is` | N/A | Configurable |
| Use case | React components | Non-React, Node.js | Custom comparison needs |
| Middleware | Full support | Full support | Full support |

---

**Source:** https://zustand.docs.pmnd.rs/apis/create | https://zustand.docs.pmnd.rs/apis/create-store | https://zustand.docs.pmnd.rs/apis/create-with-equality-fn
**Version:** 5.x (^5.0.11)
