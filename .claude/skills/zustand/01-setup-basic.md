# Setup & Basic Concepts

**Module:** `01-setup-basic.md` | **Version:** 5.x (^5.0.11)

---

## Installation

```bash
npm install zustand
```

### Requirements

- **React 18+** (minimum, React 19 supported)
- **TypeScript 4.5+** (minimum)
- No additional peer dependencies

---

## Your First Store

### Creating a Store (React Hook)

`create` returns a React hook that acts as your store:

```typescript
import { create } from 'zustand'

interface BearState {
  bears: number
  increasePopulation: () => void
  removeAllBears: () => void
  updateBears: (newBears: number) => void
}

// v5: NOT curried. create<T>((set) => ...) -- no extra ()
const useBearStore = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}))
```

### The `set` Function

| Form | Description | Example |
|------|-------------|---------|
| Object | Direct state merge (shallow) | `set({ bears: 0 })` |
| Function | Receives current state, return partial | `set((state) => ({ bears: state.bears + 1 }))` |
| Replace flag | Complete state replacement (2nd param) | `set({ data: newData }, true)` |

---

## Using Stores in Components

```typescript
import { useShallow } from 'zustand/react/shallow'

function BearCounter() {
  const bears = useBearStore((state) => state.bears)
  return <h1>{bears} bears around here</h1>
}

function Controls() {
  const increasePopulation = useBearStore((state) => state.increasePopulation)
  return <button onPress={increasePopulation}>one up</button>
}

function RemoveButton() {
  const { removeAllBears, bears } = useBearStore(
    useShallow((state) => ({
      removeAllBears: state.removeAllBears,
      bears: state.bears,
    }))
  )
  return (
    <button onPress={removeAllBears} disabled={bears === 0}>
      Remove All
    </button>
  )
}
```

### Rendering Behavior

- Component re-renders only when selected state changes
- Fine-grained subscriptions prevent unnecessary renders
- No provider wrapper needed
- Works with React Suspense and concurrent mode

---

## Selection Patterns

### Single Value (Optimal)

```typescript
const bears = useBearStore((state) => state.bears)
```

### Multiple Values (Requires useShallow)

```typescript
import { useShallow } from 'zustand/react/shallow'

const { bears, fish } = useBoundStore(
  useShallow((state) => ({
    bears: state.bears,
    fish: state.fish,
  }))
)
```

Without `useShallow`: new object every render, component always re-renders.
With `useShallow`: re-renders only when selected values change.

### Entire State (Avoid)

```typescript
const state = useBearStore() // Gets entire state, re-renders on ANY change
```

---

## Key Concepts

### `create` vs `createStore`

| Feature | `create()` | `createStore()` |
|---------|-----------|-----------------|
| Returns | React hook | Vanilla store API |
| Import | `zustand` | `zustand/vanilla` |
| Best for | React components | Non-React, Node.js, vanilla JS |
| Re-renders | Automatic via hook | Manual via subscribe |

### State Immutability

```typescript
// WRONG: mutation
set((state) => {
  state.user.name = 'New Name' // Direct mutation -- won't trigger re-render
  return state
})

// CORRECT: new reference
set((state) => ({
  user: { ...state.user, name: 'New Name' },
}))

// CORRECT: immer middleware for automatic immutability
// See 06-middleware-core.md
```

### Shallow Merge Behavior

`set` performs shallow merge by default:

```typescript
// State: { nested: { a: 1, b: 2 }, count: 0 }
set({ count: 1 })
// Result: { nested: { a: 1, b: 2 }, count: 1 } -- nested preserved

// WRONG: this loses property b
set({ nested: { a: 2 } })
// Result: { nested: { a: 2 }, count: 1 } -- b is gone!

// CORRECT: spread nested
set((state) => ({
  nested: { ...state.nested, a: 2 },
}))
```

---

## Accessing State Outside Components

```typescript
// Direct state access
const currentBears = useBearStore.getState().bears

// Subscribe to all changes
const unsubscribe = useBearStore.subscribe(
  (state) => console.log(`Bears: ${state.bears}`)
)

// Clean up
unsubscribe()

// For selective subscription, use subscribeWithSelector middleware
// See 06-middleware-core.md
```

---

## Troubleshooting

### "Component not re-rendering when state changes"

**Cause:** Direct state mutation or missing `useShallow`.

```typescript
// WRONG: mutation
state.user.name = 'Jane'

// CORRECT: new reference
set((state) => ({ user: { ...state.user, name: 'Jane' } }))
```

### "Object selector causes infinite re-renders"

**Cause:** Missing `useShallow` on multi-value selector.

```typescript
// WRONG
const obj = useStore((s) => ({ a: s.a, b: s.b }))

// CORRECT
import { useShallow } from 'zustand/react/shallow'
const obj = useStore(useShallow((s) => ({ a: s.a, b: s.b })))
```

### "Multiple stores interfering"

Each `create()` call is independent:

```typescript
const useBearStore = create((set) => ({...}))
const useFoxStore = create((set) => ({...}))
// Completely separate stores
```

---

**Source:** https://zustand.docs.pmnd.rs/getting-started/introduction
**Version:** 5.x (^5.0.11) | React 18+ | TypeScript 4.5+
