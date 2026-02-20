# Setup & Basic Concepts
**Module:** `01-setup-basic.md` | **Version:** 4.x | **Status:** Complete

**Source:** [https://zustand.docs.pmnd.rs/getting-started/introduction](https://zustand.docs.pmnd.rs/getting-started/introduction)

---

## Table of Contents
1. [Installation](#installation)
2. [Your First Store](#your-first-store)
3. [Using Stores in Components](#using-stores-in-components)
4. [Selection Patterns](#selection-patterns)
5. [Key Concepts](#key-concepts)

---

## Installation

### Package Installation
```bash
# NPM
npm install zustand

# Yarn
yarn add zustand

# PNPM
pnpm add zustand
```

### TypeScript Support
Zustand has first-class TypeScript support. Type your stores for full IDE intellisense:

```typescript
import { create } from 'zustand'

interface BearState {
  bears: number
  increasePopulation: () => void
  removeAllBears: () => void
}

const useBear = create<BearState>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))
```

---

## Your First Store

### Creating a Store (React Hook)

The `create` function returns a **React hook** that acts as your store:

```typescript
import { create } from 'zustand'

const useBear = create((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
  updateBears: (newBears) => set({ bears: newBears }),
}))
```

**Key Points:**
- `set` function **merges** state (shallow merge by default)
- State can hold primitives, objects, and functions
- Actions are methods that modify state using `set`
- Return type is automatically inferred

### What is the `set` Function?

`set` is a function passed to your state creator that updates state. It accepts either:

| Form | Description | Example |
|------|-------------|---------|
| **Object** | Direct state merge | `set({ bears: 0 })` |
| **Function** | Receives current state | `set((state) => ({ bears: state.bears + 1 }))` |
| **Replace Flag** | Complete state replacement (optional 2nd param) | `set({ data: newData }, true)` |

---

## Using Stores in Components

### Basic Component Usage

```typescript
import React from 'react'
import { useBear } from './store'

function BearCounter() {
  // Subscribe to specific state slice
  const bears = useBear((state) => state.bears)
  return <h1>{bears} bears around here...</h1>
}

function Controls() {
  // Subscribe to action
  const increasePopulation = useBear((state) => state.increasePopulation)
  return <button onClick={increasePopulation}>one up</button>
}

function RemoveButton() {
  // Subscribe to multiple values with shallow equality
  const { removeAllBears, bears } = useBear(
    (state) => ({ removeAllBears: state.removeAllBears, bears: state.bears }),
    shallow // See API: Selectors for details
  )
  
  return (
    <button onClick={removeAllBears} disabled={bears === 0}>
      Remove All
    </button>
  )
}
```

### Key Rendering Behavior

- Component **re-renders only when selected state changes**
- Fine-grained subscriptions prevent unnecessary renders
- Zustand handles React concurrency properly
- No provider wrapper needed

---

## Selection Patterns

### Pattern 1: Single Value Selection
Most efficient - component only re-renders when `bears` changes:

```typescript
const bears = useBear((state) => state.bears)
```

### Pattern 2: Multiple Values (Requires shallow equality)
Prevents re-render when multiple values don't change:

```typescript
import { shallow } from 'zustand'

const { bears, increasePopulation } = useBear(
  (state) => ({
    bears: state.bears,
    increasePopulation: state.increasePopulation,
  }),
  shallow // Critical: Use shallow for multi-property selects
)
```

❌ **Without `shallow`** - Component re-renders every state change (new object identity)
✅ **With `shallow`** - Component re-renders only when selected values actually change

### Pattern 3: Entire State (Not Recommended)
Only use when you need complete state and can afford frequent re-renders:

```typescript
const state = useBear() // Gets entire state object
```

---

## Key Concepts

### Difference: `create` vs `createStore`

| Feature | `create()` | `createStore()` |
|---------|-----------|-----------------|
| **Returns** | React hook | Vanilla store API |
| **Best for** | React components | Non-React code, vanilla JS |
| **Requires** | React context provider? | No - direct import |
| **Usage in Components** | Hook call | Manual subscription |
| **TypeScript** | Full support | Full support |

**See Also:** [API Reference: Store Creation](02-api-store-creation.md) for detailed comparison

### State Immutability Requirements

Zustand expects **immutable updates**:

```typescript
// ❌ DON'T: Mutate nested objects directly
const store = create((set) => ({
  user: { name: 'John', age: 30 },
  updateAge: () => {
    const state = store.getState()
    state.user.age = 31 // WRONG - mutation!
  },
}))

// ✅ DO: Create new objects
const store = create((set) => ({
  user: { name: 'John', age: 30 },
  updateAge: () => set((state) => ({
    user: { ...state.user, age: 31 } // New object
  })),
}))

// ✅ OR: Use immer middleware for automatic immutability
// See Middleware: Core Features module
```

### The `set` Shallow Merge Behavior

By default, `set` performs **shallow merge**:

```typescript
const store = create((set) => ({
  nested: { a: 1, b: 2 },
  updateNested: () => set({
    nested: { ...store.getState().nested, a: 2 }
  }),
}))

// ✅ This works - new nested object
// ❌ This would NOT work if just: set({ nested: { a: 2 } })
//    because { b: 2 } would be lost in shallow merge
```

---

## Common Patterns

### Pattern: Actions Updating Related State

```typescript
const useStore = create((set, get) => ({
  firstName: 'John',
  lastName: 'Doe',
  fullName: () => `${get().firstName} ${get().lastName}`,
  
  setFirstName: (name) => set({ firstName: name }),
  setLastName: (name) => set({ lastName: name }),
}))
```

### Pattern: Accessing State Outside Components

```typescript
// Direct state access via hook
const currentBears = useBear.getState().bears

// Or subscribe to changes
const unsubscribe = useBear.subscribe(
  (state) => state.bears,
  (bears) => console.log(`Bears: ${bears}`)
)

// Clean up subscription
unsubscribe()
```

**See Also:** [API Reference: State Management](03-api-state-management.md) for full details

### Pattern: TypeScript Type-Safe Store

```typescript
interface BearStore {
  bears: number
  increasePopulation: () => void
  removeAllBears: () => void
}

const useBear = create<BearStore>((set) => ({
  bears: 0,
  increasePopulation: () => set((state) => ({ bears: state.bears + 1 })),
  removeAllBears: () => set({ bears: 0 }),
}))

// TypeScript catches errors:
useBear((state) => state.nonExistent) // Error!
```

---

## Troubleshooting

### "Component not re-rendering when state changes"

**Cause:** Missing `shallow` equality on multi-value selectors
```typescript
// ❌ Wrong
const obj = useBear((state) => ({
  bears: state.bears,
  increasePopulation: state.increasePopulation,
}))

// ✅ Correct
import { shallow } from 'zustand'
const obj = useBear((state) => ({...}), shallow)
```

**See Also:** [API Reference: Selectors](04-api-selectors.md)

### "State mutations not persisting"

**Cause:** Direct mutation instead of new object
```typescript
// ❌ Wrong
state.user.name = 'Jane' // Zustand doesn't detect changes

// ✅ Correct
set((state) => ({ user: { ...state.user, name: 'Jane' } }))
```

### "Multiple stores interfering with each other"

Each `create()` call is **independent**:
```typescript
const useBearStore = create((set) => ({...}))
const useFoxStore = create((set) => ({...}))
// These are completely separate
```

---

## Next Steps

- **Learn State Management API:** [API Reference: State Management](03-api-state-management.md)
- **Optimize Selectors:** [API Reference: Selectors](04-api-selectors.md)
- **Add Persistence:** [Middleware: Persistence](05-middleware-persist.md)
- **Advanced Patterns:** [Advanced Patterns](07-advanced-patterns.md)

---

**Source:** [https://zustand.docs.pmnd.rs/getting-started/introduction](https://zustand.docs.pmnd.rs/getting-started/introduction)