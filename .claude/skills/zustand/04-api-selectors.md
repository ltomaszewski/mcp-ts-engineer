# API Reference: Selectors & Performance

**Module:** `04-api-selectors.md` | **Version:** 5.x (^5.0.2)

---

## Selection Fundamentals

### How Selection Works

```typescript
const value = useStore((state) => selectedValue)
```

1. State updates via `set` or `setState`
2. Selector function runs with new state
3. Result compared to previous (strict equality `===` by default)
4. If different: component re-renders
5. If same: skip re-render

### Why Selectors Matter

```typescript
// BAD: Re-renders on ANY state change
function Counter() {
  const state = useStore()
  return <div>{state.count}</div>
}

// GOOD: Re-renders only when count changes
function Counter() {
  const count = useStore((state) => state.count)
  return <div>{count}</div>
}
```

---

## `useShallow()` -- Hook Helper

### Description

Wraps a selector to use shallow equality comparison instead of strict reference equality. Essential when selecting multiple values as an object or array.

### Import

```typescript
import { useShallow } from 'zustand/react/shallow'
```

### Type Signature

```typescript
function useShallow<S, U>(selector: (state: S) => U): (state: S) => U
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `selector` | `(state: S) => U` | Selector function returning object/array |

### Return Value

| Type | Description |
|------|-------------|
| `(state: S) => U` | Memoized selector with shallow comparison |

### Code Example

```typescript
import { create } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

const useStore = create<State>((set) => ({
  count: 0,
  user: { name: 'John' },
  items: [],
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

// WITHOUT useShallow: re-renders even if count and user haven't changed
function BadComponent() {
  const { count, user } = useStore((state) => ({
    count: state.count,
    user: state.user,
  }))
  // New object every render -> always re-renders
  return <div>{count} {user.name}</div>
}

// WITH useShallow: only re-renders when selected values change
function GoodComponent() {
  const { count, user } = useStore(
    useShallow((state) => ({
      count: state.count,
      user: state.user,
    }))
  )
  return <div>{count} {user.name}</div>
}
```

### Array Selection with useShallow

```typescript
const [bears, fish] = useStore(
  useShallow((state) => [state.bears, state.fish])
)
```

---

## `shallow()` -- Equality Function

### Description

Standalone shallow equality function. Compares two values shallowly -- returns `true` if all top-level properties are strictly equal.

### Import

```typescript
import { shallow } from 'zustand/shallow'
```

### Type Signature

```typescript
function shallow<T>(a: T, b: T): boolean
```

### Usage

Used with `createWithEqualityFn` from `zustand/traditional`:

```typescript
import { createWithEqualityFn } from 'zustand/traditional'
import { shallow } from 'zustand/shallow'

const useStore = createWithEqualityFn<State>(
  (set) => ({ count: 0, name: '' }),
  shallow, // Default equality for all selectors
)

// No useShallow needed -- store uses shallow by default
const { count, name } = useStore((s) => ({ count: s.count, name: s.name }))
```

**v5 change:** `shallow` as second argument to `useStore(selector, shallow)` is removed. Use `useShallow` wrapper or `createWithEqualityFn` instead.

---

## Custom Equality Functions

### Pattern: Custom Comparator

```typescript
import { create } from 'zustand'

const useStore = create<State>((set) => ({
  position: { x: 0, y: 0 },
  setPosition: (pos: { x: number; y: number }) => set({ position: pos }),
}))

function positionEquality(
  a: { x: number; y: number },
  b: { x: number; y: number },
): boolean {
  const tolerance = 5
  return (
    Math.abs(a.x - b.x) < tolerance &&
    Math.abs(a.y - b.y) < tolerance
  )
}

// With createWithEqualityFn
import { createWithEqualityFn } from 'zustand/traditional'

const usePositionStore = createWithEqualityFn<PositionState>(
  (set) => ({
    position: { x: 0, y: 0 },
    setPosition: (pos) => set({ position: pos }),
  }),
  (a, b) => positionEquality(a.position, b.position),
)
```

### Pattern: Deep Equality

```typescript
import isEqual from 'lodash-es/isEqual'
import { createWithEqualityFn } from 'zustand/traditional'

const useStore = createWithEqualityFn<State>(
  (set) => ({
    deeply: { nested: { data: [{ id: 1, name: 'John' }] } },
  }),
  isEqual, // Deep equality
)
```

---

## Performance Best Practices

### Single Property Selection (Optimal)

```typescript
const count = useStore((state) => state.count)
const isLoading = useStore((state) => state.isLoading)
```

### Multiple Properties with useShallow

```typescript
import { useShallow } from 'zustand/react/shallow'

const { count, user } = useStore(
  useShallow((state) => ({ count: state.count, user: state.user }))
)
```

### Separate Components for Different Slices

```typescript
function CountDisplay() {
  const count = useStore((s) => s.count)
  return <div>{count}</div>
}

function UserDisplay() {
  const user = useStore((s) => s.user)
  return <div>{user.name}</div>
}
// CountDisplay won't re-render when user changes
```

### Actions Don't Need Selectors

Actions (functions) are stable references and won't cause re-renders:

```typescript
// GOOD: action reference is stable
const increment = useStore((s) => s.increment)
```

---

## Selection Patterns Summary

| Pattern | Code | Performance |
|---------|------|-------------|
| Single value | `useStore((s) => s.count)` | Optimal |
| Multiple with useShallow | `useStore(useShallow((s) => ({...})))` | Good |
| Array with useShallow | `useStore(useShallow((s) => [s.a, s.b]))` | Good |
| Entire state | `useStore()` | Poor -- re-renders on any change |
| Custom equality (store-level) | `createWithEqualityFn(creator, eq)` | Good |

---

**Source:** https://zustand.docs.pmnd.rs/hooks/use-shallow | https://zustand.docs.pmnd.rs/guides/prevent-rerenders-with-use-shallow
**Version:** 5.x (^5.0.2)
