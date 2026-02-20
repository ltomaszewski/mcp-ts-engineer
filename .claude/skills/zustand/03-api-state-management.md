# API Reference: State Management
**Module:** `03-api-state-management.md` | **Version:** 4.x | **Status:** Complete

**Source:** [https://zustand.docs.pmnd.rs/apis/create-store](https://zustand.docs.pmnd.rs/apis/create-store)

---

## Table of Contents
1. [getState()](#getstate)
2. [setState()](#setstate)
3. [subscribe()](#subscribe)
4. [Mutation Patterns](#mutation-patterns)
5. [Performance Considerations](#performance-considerations)

---

## `getState()`

### Description
Returns a synchronous snapshot of the current state. Can be called outside React components, in event handlers, or anywhere else in your code.

### Type Signature
```typescript
getState(): T
```

### Parameters
None

### Return Value
| Type | Description |
|------|-------------|
| `T` | Current complete state object |

### Code Example: Basic Access

```typescript
import { create } from 'zustand'

const useBear = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
}))

// Access state outside React
const currentBears = useBear.getState().bears
console.log(currentBears) // 0

// Use in event handlers
document.getElementById('btn').addEventListener('click', () => {
  const { bears } = useBear.getState()
  console.log(`Current bears: ${bears}`)
})

// Use in async operations
async function checkBears() {
  const { bears } = useBear.getState()
  const response = await fetch(`/api/bears/${bears}`)
  return response.json()
}
```

### Code Example: Computed Values

```typescript
const useStore = create((set, get) => ({
  firstName: 'John',
  lastName: 'Doe',
  
  // Get computed value
  getFullName: () => {
    const state = get()
    return `${state.firstName} ${state.lastName}`
  },
  
  // Or use in actions
  updateFirstName: (firstName) => {
    set({ firstName })
    console.log(`Welcome ${get().firstName}!`)
  },
}))

// Access computed value
console.log(useStore.getState().getFullName()) // "John Doe"
```

---

## `setState()`

### Description
Updates store state. Performs **shallow merge** by default, but can completely replace state with the `replace` flag. Can be called from anywhere.

### Type Signature
```typescript
setState(
  state: T | Partial<T> | ((state: T) => T | Partial<T>),
  replace?: boolean
): void
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `T \| Partial<T> \| (state: T) => T \| Partial<T>` | New state or updater function |
| `replace` | `boolean` (optional) | If `true`, completely replace state instead of merging. Default: `false` |

### Return Value
| Type | Description |
|------|-------------|
| `void` | No return value |

### Code Example: Direct Object Update

```typescript
const useCounter = create((set) => ({
  count: 0,
  nested: { value: 0 },
}))

// Merge update
useCounter.setState({ count: 5 })
// State: { count: 5, nested: { value: 0 } } - nested preserved

// Merge nested object
useCounter.setState({
  nested: { ...useCounter.getState().nested, value: 10 }
})
// State: { count: 5, nested: { value: 10 } }
```

### Code Example: Updater Function

```typescript
const useAge = create((set) => ({
  age: 25,
  birthday: () => set((state) => ({ age: state.age + 1 })),
}))

// Function form - receives current state
useAge.setState((state) => ({ age: state.age + 10 }))
console.log(useAge.getState().age) // 35
```

### Code Example: Replace Flag

```typescript
const useStore = create((set) => ({
  count: 0,
  user: { name: 'John' },
  theme: 'dark',
}))

// ❌ DON'T: Lose data
useStore.setState({ count: 1 }, true)
// Now state is ONLY { count: 1 } - everything else gone!

// ✅ DO: Replace only when needed
const state = useStore.getState()
useStore.setState({
  ...state, // Preserve everything
  count: 1, // Override specific value
}, false) // or just use default
```

### Code Example: Primitive Values

```typescript
// Store holding primitive
const useX = create((set) => (() => 0))

// Update with replace flag
useX.setState(100, true) // Complete replacement for primitives

// Or updater function
useX.setState((x) => x + 1)
```

---

## `subscribe()`

### Description
Register a listener that fires whenever state changes. Returns an unsubscribe function. Can be called outside React for custom subscription logic.

### Type Signature (Vanilla Store)
```typescript
subscribe(
  listener: (state: T, previousState: T) => void
): () => void
```

### Type Signature (React Hook)
```typescript
subscribe(
  listener: (state: T) => void
): () => void
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `listener` | `(state: T, previousState: T?) => void` | Callback fired on any state change |

### Return Value
| Type | Description |
|------|-------------|
| `() => void` | Unsubscribe function - call to stop listening |

### Code Example: Basic Subscription

```typescript
import { createStore } from 'zustand/vanilla'

const positionStore = createStore((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (position) => set({ position }),
}))

// Subscribe to all changes
const unsubscribe = positionStore.subscribe(
  (state, previousState) => {
    console.log('Position changed:', state.position)
    console.log('Was:', previousState.position)
  }
)

// Update state
positionStore.setState({ position: { x: 10, y: 20 } })
// Logs: Position changed: {x:10,y:20}, Was: {x:0,y:0}

// Stop listening
unsubscribe()
```

### Code Example: DOM Integration

```typescript
const positionStore = createStore((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (position) => set({ position }),
}))

const $dot = document.getElementById('dot')

// Render on every state change
positionStore.subscribe((state) => {
  $dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`
})

// Initial render
const state = positionStore.getState()
$dot.style.transform = `translate(${state.position.x}px, ${state.position.y}px)`

// Listen to user input
document.addEventListener('mousemove', (e) => {
  positionStore.setState({
    position: { x: e.clientX, y: e.clientY }
  })
})
```

### Code Example: Selective Subscription

```typescript
const useStore = create((set) => ({
  count: 0,
  user: { name: 'John' },
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// Subscribe to entire state
const unsubAll = useStore.subscribe(
  (state) => console.log('Full state:', state)
)

// Subscribe with middleware for selective listening
// See subscribeWithSelector middleware in Middleware: Core Features
```

---

## Mutation Patterns

### Pattern 1: Primitives - Replace Entire State

```typescript
const useX = create(() => 0)

// ✅ Correct - use replace flag for primitives
useX.setState(5, true)

// ❌ Wrong - won't work for primitive
useX.setState({ x: 5 })
```

### Pattern 2: Objects - Immutable Spread

```typescript
const useUser = create((set) => ({
  user: { name: 'John', age: 30 },
  setAge: (age) => set((state) => ({
    user: { ...state.user, age } // New object via spread
  })),
}))
```

### Pattern 3: Arrays - Immutable Operations

```typescript
const useList = create((set) => ({
  items: [1, 2, 3],
  
  addItem: (item) => set((state) => ({
    items: [...state.items, item] // New array
  })),
  
  removeItem: (index) => set((state) => ({
    items: state.items.filter((_, i) => i !== index)
  })),
  
  updateItem: (index, value) => set((state) => ({
    items: state.items.map((item, i) => i === index ? value : item)
  })),
}))

// ❌ DON'T: Mutable operations
useList.getState().items.push(4) // WRONG!

// ✅ DO: Immutable operations
useList.setState((state) => ({
  items: [...state.items, 4]
}))
```

### Pattern 4: Nested Objects - Shallow Merge Caveat

```typescript
const useStore = create((set) => ({
  deeply: {
    nested: {
      object: { value: 1 }
    }
  },
}))

// ❌ WRONG - shallow merge, nested gets replaced entirely
set({ deeply: { nested: { object: { value: 2 } } } })
// Missing other properties in 'deeply'

// ✅ RIGHT - spread to preserve structure
set((state) => ({
  deeply: {
    ...state.deeply,
    nested: {
      ...state.deeply.nested,
      object: {
        ...state.deeply.nested.object,
        value: 2
      }
    }
  }
}))

// ✅ OR: Use immer middleware for automatic immutability
// See Middleware: Core Features
```

---

## Performance Considerations

### Avoiding Excessive Renders

```typescript
const useStore = create((set) => ({
  count: 0,
  user: { name: 'John' },
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

// ❌ Component re-renders on ANY state change
function Component() {
  const store = useStore() // Gets entire state
  return <div>{store.count}</div>
}

// ✅ Component only re-renders when count changes
function Component() {
  const count = useStore((state) => state.count) // Selective
  return <div>{count}</div>
}
```

### Batch Updates

```typescript
const useStore = create((set) => ({
  count: 0,
  user: { name: '' },
  
  batchUpdate: (count, name) => set({
    count,
    user: { name },
  }), // Single render trigger
}))

// Better than:
useStore.setState({ count: 5 })
useStore.setState({ user: { name: 'Jane' } })
// Would trigger TWO renders

// Do this:
useStore.getState().batchUpdate(5, 'Jane')
// Single render
```

---

## Cross-Module References

- **Selector Patterns:** [API Reference: Selectors](04-api-selectors.md)
- **Store Creation:** [API Reference: Store Creation](02-api-store-creation.md)
- **Middleware:** [Middleware: Core Features](06-middleware-core.md)

---

**Official Source:** [https://zustand.docs.pmnd.rs/apis/create-store](https://zustand.docs.pmnd.rs/apis/create-store)