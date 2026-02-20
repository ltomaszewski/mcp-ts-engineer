# API Reference: Selectors & Performance
**Module:** `04-api-selectors.md` | **Version:** 4.x | **Status:** Complete

**Source:** [https://zustand.docs.pmnd.rs/guides/slicing-the-store](https://zustand.docs.pmnd.rs/)

---

## Table of Contents
1. [Selection Fundamentals](#selection-fundamentals)
2. [shallow() - Multi-Value Equality](#shallow---multi-value-equality)
3. [useShallow() - Hook Helper](#useshallow---hook-helper)
4. [Custom Equality Functions](#custom-equality-functions)
5. [Performance Best Practices](#performance-best-practices)

---

## Selection Fundamentals

### Why Selectors Matter

Without selectors, components receive entire state object and re-render on any change:

```typescript
// ❌ BAD: Re-renders on ANY state change
function Counter() {
  const state = useStore() // Gets entire state
  return <div>{state.count}</div> // Re-renders even if only `user` changed
}

// ✅ GOOD: Re-renders only when `count` changes
function Counter() {
  const count = useStore((state) => state.count) // Selector
  return <div>{count}</div> // Re-renders only if count changes
}
```

### How Selection Works

```typescript
useStore((state) => selectedValue)
```

Zustand compares selected values between renders:
1. State updates
2. Selector function runs with new state
3. Result compared to previous result (strict equality `===` by default)
4. If different: component re-renders
5. If same: component stays in place

---

## `shallow()` - Multi-Value Equality

### Description
Equality function that compares objects shallowly. Returns `true` if all properties are strictly equal, allowing multi-value selections without unnecessary re-renders.

### Type Signature
```typescript
shallow<T>(a: T, b: T): boolean
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `a` | `T` | Previous selected value |
| `b` | `T` | Current selected value |

### Return Value
| Type | Description |
|------|-------------|
| `boolean` | `true` if all properties are strictly equal, `false` otherwise |

### Code Example: Multi-Value Selection

```typescript
import { create, shallow } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  user: { name: 'John' },
  items: [],
  increment: () => set((state) => ({ count: state.count + 1 })),
  setUser: (user) => set({ user }),
}))

// ❌ WITHOUT shallow - re-renders even if data hasn't changed
function Component() {
  // New object created every render
  const { count, user } = useStore((state) => ({
    count: state.count,
    user: state.user,
  }))
  // Re-renders whenever ANY state changes
  return <div>{count} {user.name}</div>
}

// ✅ WITH shallow - only re-renders when selected values change
function Component() {
  const { count, user } = useStore(
    (state) => ({
      count: state.count,
      user: state.user,
    }),
    shallow // ← Critical
  )
  // Re-renders only when count OR user actually changes
  return <div>{count} {user.name}</div>
}
```

### Code Example: Comparing Selection

```typescript
import { shallow } from 'zustand'

// Without shallow (default strict equality):
shallow(
  { a: 1, b: 2 },
  { a: 1, b: 2 }
) // Returns true - properties are equal

// Default === comparison:
{ a: 1, b: 2 } === { a: 1, b: 2 } // Returns false - different objects!

// So use shallow for object selections
```

### Shallow vs Deep

```typescript
const useStore = create((set) => ({
  nested: {
    deeply: {
      value: 1
    }
  }
}))

// ❌ shallow comparison doesn't help with deep changes
const obj = useStore(
  (state) => ({
    nested: state.nested
  }),
  shallow
)
// If nested.deeply.value changes, shallow still detects it
// because nested object identity changed

// ✅ But shallow helps prevent unnecessary re-renders
// when you're selecting multiple properties
const { count, user } = useStore(
  (state) => ({ count: state.count, user: state.user }),
  shallow
)
```

---

## `useShallow()` - Hook Helper

### Description
React hook that returns a shallow equality function, useful for selecting multiple values with automatic comparison.

### Type Signature
```typescript
useShallow<T>(state: T): T
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `state` | `T` | Object to compare shallowly |

### Return Value
| Type | Description |
|------|-------------|
| `T` | The same object (memoized for identity) |

### Code Example: useShallow Hook

```typescript
import { create, useShallow } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  user: { name: 'John' },
  increment: () => set((state) => ({ count: state.count + 1 })),
}))

function Component() {
  // useShallow memoizes the object
  const { count, user } = useStore(useShallow)
  // Same as:
  // const { count, user } = useStore(
  //   (state) => ({ count: state.count, user: state.user }),
  //   shallow
  // )
  
  return <div>{count} {user.name}</div>
}
```

---

## Custom Equality Functions

### Pattern: Custom Comparator

```typescript
import { create } from 'zustand'

const useStore = create((set) => ({
  position: { x: 0, y: 0 },
  tolerance: 5,
  setPosition: (pos) => set({ position: pos }),
}))

// Custom equality: positions are equal if within tolerance
function positionEquality(a, b) {
  if (!a || !b) return false
  const tolerance = 5
  return (
    Math.abs(a.position.x - b.position.x) < tolerance &&
    Math.abs(a.position.y - b.position.y) < tolerance
  )
}

function Component() {
  const position = useStore(
    (state) => ({ x: state.position.x, y: state.position.y }),
    positionEquality
  )
  // Only re-renders if position changes by more than 5 pixels
  return <div>Position: {position.x}, {position.y}</div>
}
```

### Pattern: Deep Equality

```typescript
import { create } from 'zustand'
import isEqual from 'lodash-es/isEqual'

const useStore = create((set) => ({
  deeply: {
    nested: {
      data: [{ id: 1, name: 'John' }]
    }
  }
}))

function Component() {
  const data = useStore(
    (state) => state.deeply.nested.data,
    isEqual // Deep equality from lodash
  )
  // Only re-renders if array structure actually changes
  return <div>{data.map(item => <p key={item.id}>{item.name}</p>)}</div>
}
```

---

## Performance Best Practices

### ✅ DO: Single Property Selection

Most efficient for simple values:

```typescript
// Perfect for single values
const count = useStore((state) => state.count)
const isLoading = useStore((state) => state.isLoading)
```

### ✅ DO: Use shallow for Multiple Properties

```typescript
import { shallow } from 'zustand'

const { count, user } = useStore(
  (state) => ({ count: state.count, user: state.user }),
  shallow
)
```

### ✅ DO: Separate Components for Different State Slices

```typescript
function CountComponent() {
  const count = useStore((state) => state.count)
  return <div>{count}</div>
}

function UserComponent() {
  const user = useStore((state) => state.user)
  return <div>{user.name}</div>
}

// CountComponent won't re-render when user changes
```

### ❌ DON'T: Select Entire State

```typescript
// DON'T - re-renders on any state change
const state = useStore()
```

### ❌ DON'T: Create New Objects in Selectors

```typescript
// DON'T - creates new object every time
useStore((state) => ({
  count: state.count,
  user: state.user,
}))
// Always a different object → always re-renders

// DO
useStore(
  (state) => ({ count: state.count, user: state.user }),
  shallow // Compare properties, not object identity
)
```

### ❌ DON'T: Forget shallow for Objects

```typescript
// DON'T - missing shallow
const props = useStore((state) => ({
  count: state.count,
  user: state.user,
}))
// Re-renders even if count and user haven't changed

// DO
import { shallow } from 'zustand'
const props = useStore((state) => ({...}), shallow)
```

---

## Selection Patterns Summary

| Pattern | Use Case | Performance |
|---------|----------|-------------|
| Single value | `useStore((s) => s.count)` | Optimal - only re-renders when value changes |
| Multiple values with shallow | `useStore(s => ({...}), shallow)` | Good - skips re-renders when properties unchanged |
| Entire state | `useStore()` | Poor - re-renders on any state change |
| Custom equality | `useStore(s => s.pos, customEq)` | Good - when default comparisons don't work |

---

## Cross-Module References

- **Store Creation:** [API Reference: Store Creation](02-api-store-creation.md)
- **State Management:** [API Reference: State Management](03-api-state-management.md)
- **Middleware:** [Middleware: Core Features](06-middleware-core.md)

---

**Performance Optimization Guide:** https://zustand.docs.pmnd.rs/guides/slicing-the-store