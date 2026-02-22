---
name: zustand
description: Zustand v5 state management - store creation, selectors, useShallow, persist/devtools/immer middleware, slices pattern, subscriptions. Use when implementing global state, creating stores, adding persistence, or optimizing re-renders in React/React Native.
---

# Zustand v5

Lightweight, fast state management with a hook-based API. No providers, no boilerplate, no context wrappers.

---

## When to Use

LOAD THIS SKILL when user is:
- Creating or modifying Zustand stores
- Implementing global state management patterns
- Adding persistence to stores (MMKV, AsyncStorage, localStorage)
- Optimizing component re-renders with selectors or `useShallow`
- Composing middleware (persist, devtools, immer, subscribeWithSelector)

---

## Critical Rules

**ALWAYS:**
1. Use selectors to subscribe only to needed state slices -- prevents unnecessary re-renders
2. Use `useShallow()` from `zustand/react/shallow` for multi-property selections -- ensures shallow equality comparison
3. Persist only essential state with `partialize` -- reduces storage size and hydration time
4. Define TypeScript interface for store state -- enables type inference across components
5. Use `create<T>((set, get) => ({...}))` -- v5 is NOT curried

**NEVER:**
1. Use `create<T>()((set) => ...)` (curried form) -- removed in v5; causes type errors
2. Select entire store without selector (`useStore()`) -- causes re-render on any state change
3. Mutate nested objects directly in `set` -- breaks reactivity; always create new references
4. Put `devtools` inside `immer` -- devtools must wrap immer: `devtools(immer(...))`
5. Use `shallow` as second argument to hook -- removed in v5; use `useShallow` wrapper instead

---

## Core Patterns

### Basic Store with Types

```typescript
import { create } from 'zustand'

interface AuthState {
  user: User | null
  isAuthenticated: boolean
  login: (user: User) => void
  logout: () => void
}

const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}))
```

### Persisted Store with MMKV

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { zustandStorage } from '@/utils/mmkv-storage'

const useSettingsStore = create<SettingsState>(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme: string) => set({ theme }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ theme: state.theme }),
    }
  )
)
```

### Selector Pattern for Performance

```typescript
// Single value -- only re-renders when bears changes
const bears = useBearStore((state) => state.bears)

// Multiple values with shallow comparison
import { useShallow } from 'zustand/react/shallow'

const { bears, fish } = useBearStore(
  useShallow((state) => ({ bears: state.bears, fish: state.fish }))
)
```

### Immer Middleware for Nested Updates

```typescript
import { create } from 'zustand'
import { immer } from 'zustand/middleware/immer'

const useTodoStore = create<TodoState>()(
  immer((set) => ({
    todos: {},
    toggleTodo: (id: string) =>
      set((state) => { state.todos[id].done = !state.todos[id].done }),
  }))
)
```

---

## Anti-Patterns

**BAD** -- Selecting entire store causes re-render on any change:
```typescript
const state = useStore()
return <div>{state.count}</div>
```

**GOOD** -- Select only what you need:
```typescript
const count = useStore((state) => state.count)
return <div>{count}</div>
```

**BAD** -- Missing useShallow on multi-property selector:
```typescript
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }))
```

**GOOD** -- useShallow prevents unnecessary re-renders:
```typescript
import { useShallow } from 'zustand/react/shallow'
const { a, b } = useStore(useShallow((s) => ({ a: s.a, b: s.b })))
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Create store | `create<T>()` | `create<State>((set) => ({...}))` |
| Update state | `set()` | `set({ count: 1 })` or `set((s) => ({ count: s.count + 1 }))` |
| Read outside React | `getState()` | `useStore.getState().count` |
| Subscribe | `subscribe()` | `useStore.subscribe((state) => ...)` |
| Shallow select | `useShallow()` | `useShallow((s) => ({ a: s.a, b: s.b }))` |
| Persist | `persist()` | `persist((set) => ({...}), { name: 'key' })` |
| Devtools | `devtools()` | `devtools((set) => ({...}), { name: 'store' })` |
| Immer | `immer()` | `immer((set) => ({...}))` |
| Vanilla store | `createStore()` | `createStore<State>((set) => ({...}))` |
| Reset store | custom action | `reset: () => set(initialState)` |
| Type inference | `combine()` | `combine({ count: 0 }, (set) => ({...}))` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and first store | [01-setup-basic.md](01-setup-basic.md) |
| create, createStore, createWithEqualityFn | [02-api-store-creation.md](02-api-store-creation.md) |
| setState, getState, subscribe details | [03-api-state-management.md](03-api-state-management.md) |
| Selector optimization, useShallow, custom equality | [04-api-selectors.md](04-api-selectors.md) |
| persist middleware (all options, migrations, storage) | [05-middleware-persist.md](05-middleware-persist.md) |
| devtools, immer, combine, subscribeWithSelector | [06-middleware-core.md](06-middleware-core.md) |
| Slices pattern, async ops, debugging, large stores | [07-advanced-patterns.md](07-advanced-patterns.md) |

---

**Version:** 5.x (^5.0.2) | **Source:** https://zustand.docs.pmnd.rs/
