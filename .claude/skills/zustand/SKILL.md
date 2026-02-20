---
name: zustand
description: Zustand state management - store creation, selectors, persist middleware, subscriptions. Use when implementing state management, creating stores, or handling global state in React Native.
---

# Zustand

> Lightweight state management with a hook-based API. Eliminates boilerplate and context provider complexity.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Creating or modifying Zustand stores
- Implementing state management patterns
- Adding persistence to stores (MMKV, AsyncStorage)
- Optimizing component re-renders with selectors
- Debugging state reactivity issues

---

## Critical Rules

**ALWAYS:**
1. Use selectors to subscribe only to needed state slices — prevents unnecessary re-renders
2. Use `useShallow()` for multi-property selections — ensures shallow equality comparison
3. Persist only essential state with `partialize` — reduces storage size and hydration time
4. Define TypeScript interface for store state — enables type inference across components

**NEVER:**
1. Mutate nested objects directly — breaks reactivity; always create new objects
2. Select entire store without selector — causes re-render on any state change
3. Put DevTools inside persist — wrap persist with devtools, not vice versa

---

## Core Patterns

### Basic Store with Types

```typescript
import { create } from 'zustand';

interface AuthState {
  user: User | null;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
}

const useAuthStore = create<AuthState>()((set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
}));
```

### Persisted Store with MMKV

```typescript
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { zustandStorage } from '@/utils/mmkv-storage';

const useSettingsStore = create<SettingsState>()(
  persist(
    (set) => ({
      theme: 'light',
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: 'settings-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ theme: state.theme }), // Only persist theme
    }
  )
);
```

### Selector Pattern for Performance

```typescript
// Component only re-renders when `bears` changes
const bears = useBearStore((state) => state.bears);

// Multiple properties with shallow comparison
import { useShallow } from 'zustand/react/shallow';

const { bears, fish } = useBearStore(
  useShallow((state) => ({ bears: state.bears, fish: state.fish }))
);
```

---

## Anti-Patterns

**BAD** — Selecting entire store causes re-render on any change:
```typescript
const state = useStore(); // Re-renders on ANY state change
return <div>{state.count}</div>;
```

**GOOD** — Select only what you need:
```typescript
const count = useStore((state) => state.count); // Only re-renders when count changes
return <div>{count}</div>;
```

**BAD** — Mutating nested state:
```typescript
set((state) => {
  state.user.name = 'New Name'; // Direct mutation - won't trigger re-render
  return state;
});
```

**GOOD** — Creating new objects:
```typescript
set((state) => ({
  user: { ...state.user, name: 'New Name' },
}));
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Create store | `create<T>()` | `create<State>()((set) => ({...}))` |
| Update state | `set()` | `set({ count: 1 })` or `set((s) => ({ count: s.count + 1 }))` |
| Read outside React | `getState()` | `useStore.getState().count` |
| Subscribe | `subscribe()` | `useStore.subscribe((state) => console.log(state))` |
| Shallow select | `useShallow()` | `useShallow((s) => ({ a: s.a, b: s.b }))` |
| Persist | `persist()` | `persist((set) => ({...}), { name: 'storage-key' })` |
| Reset store | custom action | `reset: () => set(initialState)` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Initial setup and installation | [01-setup-basic.md](01-setup-basic.md) |
| Store creation patterns and TypeScript | [02-api-store-creation.md](02-api-store-creation.md) |
| setState, getState, subscribe details | [03-api-state-management.md](03-api-state-management.md) |
| Selector optimization and useShallow | [04-api-selectors.md](04-api-selectors.md) |
| Persistence with MMKV/AsyncStorage | [05-middleware-persist.md](05-middleware-persist.md) |
| Middleware composition patterns | [06-middleware-core.md](06-middleware-core.md) |
| Store splitting, debugging, security | [07-advanced-patterns.md](07-advanced-patterns.md) |

---

**Version:** 4.x | **Source:** https://zustand.docs.pmnd.rs/
