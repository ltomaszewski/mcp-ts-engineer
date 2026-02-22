# API Reference: State Management

**Module:** `03-api-state-management.md` | **Version:** 5.x (^5.0.11)

---

## `getState()`

### Description

Returns a synchronous snapshot of the current state. Can be called outside React components, in event handlers, middleware, or anywhere.

### Type Signature

```typescript
getState(): T
```

### Code Example

```typescript
import { create } from 'zustand'

const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((s) => ({ bears: s.bears + 1 })),
}))

// Access state outside React
const currentBears = useBearStore.getState().bears

// In event handlers
document.getElementById('btn')?.addEventListener('click', () => {
  const { bears } = useBearStore.getState()
  console.log(`Current bears: ${bears}`)
})

// In async operations
async function checkBears(): Promise<Response> {
  const { bears } = useBearStore.getState()
  return fetch(`/api/bears/${bears}`)
}
```

### Computed Values with `get`

```typescript
const useStore = create<State>((set, get) => ({
  firstName: 'John',
  lastName: 'Doe',
  getFullName: () => `${get().firstName} ${get().lastName}`,
  updateFirstName: (name: string) => {
    set({ firstName: name })
    console.log(`Welcome ${get().firstName}!`)
  },
}))
```

---

## `setState()`

### Description

Updates store state. Performs shallow merge by default. Can replace entire state with the `replace` flag. Callable from anywhere.

### Type Signature

```typescript
setState(
  state: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean,
): void
```

### Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `state` | `T \| Partial<T> \| (state: T) => T \| Partial<T>` | -- | New state or updater function |
| `replace` | `boolean` | `false` | If `true`, replace entire state instead of merging |

### Code Examples

#### Direct Object Update (Shallow Merge)

```typescript
const useStore = create<State>((set) => ({
  count: 0,
  nested: { value: 0 },
}))

// Merge update -- nested preserved
useStore.setState({ count: 5 })
// State: { count: 5, nested: { value: 0 } }

// Update nested -- must spread
useStore.setState((state) => ({
  nested: { ...state.nested, value: 10 },
}))
```

#### Updater Function

```typescript
useStore.setState((state) => ({ count: state.count + 1 }))
```

#### Replace Flag

```typescript
// DANGER: replaces entire state
useStore.setState({ count: 1 }, true)
// State is now ONLY { count: 1 } -- everything else gone

// Safe: preserve other state
const current = useStore.getState()
useStore.setState({ ...current, count: 1 })
```

---

## `subscribe()`

### Description

Register a listener that fires on every state change. Returns an unsubscribe function. For selective subscription (subscribe to a slice), use `subscribeWithSelector` middleware.

### Type Signature

```typescript
subscribe(
  listener: (state: T, previousState: T) => void,
): () => void
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `listener` | `(state: T, previousState: T) => void` | Callback on any state change |

### Return Value

| Type | Description |
|------|-------------|
| `() => void` | Unsubscribe function |

### Code Example: Basic Subscription

```typescript
import { createStore } from 'zustand/vanilla'

const store = createStore<PositionState>((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (pos: { x: number; y: number }) => set({ position: pos }),
}))

const unsubscribe = store.subscribe((state, prev) => {
  console.log('Position:', prev.position, '->', state.position)
})

store.setState({ position: { x: 10, y: 20 } })
// Logs: Position: {x:0,y:0} -> {x:10,y:20}

unsubscribe()
```

### Code Example: Transient Updates (DOM)

Subscribe to state for DOM manipulation without React re-renders:

```typescript
const store = createStore<State>((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (pos: { x: number; y: number }) => set({ position: pos }),
}))

const $dot = document.getElementById('dot')!

// Transient update -- bypasses React entirely
store.subscribe((state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
})

// Listen to user input
document.addEventListener('mousemove', (e) => {
  store.getState().setPosition({ x: e.clientX, y: e.clientY })
})
```

---

## Mutation Patterns

### Primitives

```typescript
set({ count: 5 })               // Merge
set((s) => ({ count: s.count + 1 }))  // Updater
```

### Objects -- Immutable Spread

```typescript
set((state) => ({
  user: { ...state.user, age: 31 },
}))
```

### Arrays -- Immutable Operations

```typescript
const useListStore = create<ListState>((set) => ({
  items: [1, 2, 3],
  addItem: (item: number) =>
    set((s) => ({ items: [...s.items, item] })),
  removeItem: (index: number) =>
    set((s) => ({ items: s.items.filter((_, i) => i !== index) })),
  updateItem: (index: number, value: number) =>
    set((s) => ({ items: s.items.map((item, i) => (i === index ? value : item)) })),
}))
```

### Deeply Nested -- Spread Chain

```typescript
set((state) => ({
  deeply: {
    ...state.deeply,
    nested: {
      ...state.deeply.nested,
      object: {
        ...state.deeply.nested.object,
        value: 2,
      },
    },
  },
}))

// Or use immer middleware for cleaner syntax
// See 06-middleware-core.md
```

---

## Performance Considerations

### Batch Updates

```typescript
const useStore = create<State>((set) => ({
  count: 0,
  user: { name: '' },
  batchUpdate: (count: number, name: string) =>
    set({ count, user: { name } }), // Single render
}))

// BAD: Two separate updates = two renders
useStore.setState({ count: 5 })
useStore.setState({ user: { name: 'Jane' } })

// GOOD: Single update = one render
useStore.getState().batchUpdate(5, 'Jane')
```

### Avoiding Excessive Renders

```typescript
// BAD: re-renders on ANY state change
function Component() {
  const store = useStore()
  return <div>{store.count}</div>
}

// GOOD: re-renders only when count changes
function Component() {
  const count = useStore((s) => s.count)
  return <div>{count}</div>
}
```

---

**Source:** https://zustand.docs.pmnd.rs/apis/create-store
**Version:** 5.x (^5.0.11)
