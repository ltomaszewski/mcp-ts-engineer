# Advanced Patterns & Best Practices
**Module:** `07-advanced-patterns.md` | **Version:** 4.x | **Status:** Complete

**Source:** [https://zustand.docs.pmnd.rs/guides](https://zustand.docs.pmnd.rs/guides)

---

## Table of Contents
1. [Store Composition](#store-composition)
2. [Store Slicing (Modular Stores)](#store-slicing-modular-stores)
3. [Global Patterns](#global-patterns)
4. [Async Operations](#async-operations)
5. [Debugging & DevTools](#debugging--devtools)
6. [Performance Optimization](#performance-optimization)
7. [Common Pitfalls](#common-pitfalls)

---

## Store Composition

### Pattern: Single Unified Store

Best for small to medium applications with related state:

```typescript
import { create } from 'zustand'
import { persist, combine } from 'zustand/middleware'

const useAppStore = create(
  persist(
    combine(
      {
        // Auth
        user: null as { id: string; email: string } | null,
        isAuthenticated: false,
        
        // UI
        sidebarOpen: true,
        theme: 'light' as 'light' | 'dark',
        
        // Data
        items: [] as Array<{ id: string; title: string }>,
        selectedItem: null as string | null,
      },
      (set, get) => ({
        // Auth actions
        login: (user) => set({ user, isAuthenticated: true }),
        logout: () => set({ user: null, isAuthenticated: false }),
        
        // UI actions
        toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
        setTheme: (theme) => set({ theme }),
        
        // Data actions
        addItem: (item) => set((s) => ({ items: [...s.items, item] })),
        selectItem: (id) => set({ selectedItem: id }),
      })
    ),
    { name: 'app-store' }
  )
)
```

### Pattern: Multiple Specialized Stores

Best for large applications with independent concerns:

```typescript
// auth-store.ts
import { create } from 'zustand'

export const useAuth = create((set) => ({
  user: null,
  isLoading: false,
  login: async (email, password) => {
    set({ isLoading: true })
    const user = await authenticate(email, password)
    set({ user, isLoading: false })
  },
  logout: () => set({ user: null }),
}))

// ui-store.ts
export const useUI = create((set) => ({
  sidebarOpen: true,
  theme: 'light',
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))

// data-store.ts
export const useData = create((set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
}))

// In components: use only what you need
function Dashboard() {
  const user = useAuth((s) => s.user)
  const sidebarOpen = useUI((s) => s.sidebarOpen)
  const items = useData((s) => s.items)
}
```

**Advantages:**
- Stores evolve independently
- No unnecessary re-renders
- Easier testing
- Easier code-splitting

---

## Store Slicing (Modular Stores)

### Pattern: Slice Architecture

Organize related state and actions into logical slices:

```typescript
import { create } from 'zustand'
import { combine } from 'zustand/middleware'

// Create slices
const createAuthSlice = (set, get) => ({
  user: null,
  login: (user) => set({ user }),
  logout: () => set({ user: null }),
})

const createUISlice = (set, get) => ({
  theme: 'light',
  sidebarOpen: true,
  toggleTheme: () => set((s) => ({
    theme: s.theme === 'light' ? 'dark' : 'light'
  })),
})

const createDataSlice = (set, get) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
})

// Compose slices
const useStore = create((set, get) => ({
  ...createAuthSlice(set, get),
  ...createUISlice(set, get),
  ...createDataSlice(set, get),
}))

export default useStore
```

### Slice with Cross-Slice Access

```typescript
const createAuthSlice = (set, get) => ({
  user: null,
  login: (user) => {
    set({ user })
    // Access other slices via get()
    const isProUser = get().subscription === 'pro'
    if (isProUser) {
      // Do something special
    }
  },
})
```

---

## Global Patterns

### Pattern: Context Bridge (For Legacy React Apps)

If you need React Context compatibility:

```typescript
import { createContext, useContext } from 'react'
import { create } from 'zustand'

const useStore = create((set) => ({
  count: 0,
  increment: () => set((s) => ({ count: s.count + 1 })),
}))

const StoreContext = createContext(useStore)

export function StoreProvider({ children }) {
  return <StoreContext.Provider value={useStore}>{children}</StoreContext.Provider>
}

export function useAppStore() {
  return useContext(StoreContext)
}

// In components
function Counter() {
  const { count, increment } = useAppStore((s) => ({
    count: s.count,
    increment: s.increment,
  }))
  return <button onClick={increment}>{count}</button>
}
```

---

## Async Operations

### Pattern: Loading States

```typescript
const useAsyncStore = create((set) => ({
  data: null,
  isLoading: false,
  error: null,
  
  fetchData: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/data')
      const data = await response.json()
      set({ data, isLoading: false })
    } catch (error) {
      set({ error: error.message, isLoading: false })
    }
  },
}))

function DataComponent() {
  const { data, isLoading, error, fetchData } = useAsyncStore()
  
  useEffect(() => {
    fetchData()
  }, [fetchData])
  
  if (isLoading) return <div>Loading...</div>
  if (error) return <div>Error: {error}</div>
  return <div>{data}</div>
}
```

### Pattern: Abort Controller for Cleanup

```typescript
const useAbortStore = create((set, get) => {
  let abortController = null
  
  return {
    data: null,
    isLoading: false,
    
    fetchData: async () => {
      // Cancel previous request
      abortController?.abort()
      abortController = new AbortController()
      
      set({ isLoading: true })
      try {
        const response = await fetch('/api/data', {
          signal: abortController.signal,
        })
        const data = await response.json()
        set({ data, isLoading: false })
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error(error)
        }
      }
    },
    
    cancel: () => abortController?.abort(),
  }
})
```

---

## Debugging & DevTools

### Pattern: Redux DevTools Integration

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useStore = create(
  devtools((set) => ({
    count: 0,
    increment: () => set((s) => ({ count: s.count + 1 }), false, 'increment'),
  }))
)

// Action names appear in DevTools
// See time-travel debugging, action history
```

### Pattern: Console Logging Middleware

```typescript
const logger = (config) => (set, get, store) => {
  return config(
    (...args) => {
      console.log('SET', args)
      set(...args)
    },
    get,
    store
  )
}

const useStore = create(
  logger((set) => ({
    count: 0,
    increment: () => set({ count: get().count + 1 }),
  }))
)
```

---

## Performance Optimization

### ✅ Strategy 1: Selector Memoization

```typescript
import { shallow } from 'zustand'

// Selector function (memoized)
const selectCountAndStatus = (state) => ({
  count: state.count,
  status: state.status,
})

function Component() {
  const { count, status } = useStore(selectCountAndStatus, shallow)
  // Only re-renders if count or status changes
}
```

### ✅ Strategy 2: Split Stores by Update Frequency

```typescript
// Frequent changes - in separate store
const useUIStore = create((set) => ({
  mousePos: { x: 0, y: 0 },
  setMousePos: (pos) => set({ mousePos: pos }),
}))

// Infrequent changes
const useAppStore = create((set) => ({
  appConfig: {},
  setConfig: (config) => set({ appConfig: config }),
}))

// In component
function Tracker() {
  // Only subscribes to mousePos changes
  const mousePos = useUIStore((s) => s.mousePos)
  return <div>Position: {mousePos.x}, {mousePos.y}</div>
}
```

### ✅ Strategy 3: Batch Updates

```typescript
const useStore = create((set) => ({
  count: 0,
  user: null,
  
  // Batch multiple changes
  initialize: (count, user) => {
    set({ count, user }) // Single subscription notification
  },
}))

// Not:
useStore.setState({ count: 5 })
useStore.setState({ user: userData })
// Two subscription notifications!
```

---

## Common Pitfalls

### ❌ Pitfall 1: Mutating State Directly

```typescript
// WRONG
const store = create((set) => ({
  items: [1, 2, 3],
  addItem: (item) => {
    store.getState().items.push(item) // Direct mutation!
  },
}))

// CORRECT
const store = create((set) => ({
  items: [1, 2, 3],
  addItem: (item) => set((state) => ({
    items: [...state.items, item] // New array
  })),
}))
```

### ❌ Pitfall 2: Selecting Entire State Unnecessarily

```typescript
// WRONG - re-renders on ANY state change
function Component() {
  const state = useStore()
  return <div>{state.count}</div>
}

// CORRECT - re-renders only when count changes
function Component() {
  const count = useStore((s) => s.count)
  return <div>{count}</div>
}
```

### ❌ Pitfall 3: Middleware Order

```typescript
// WRONG - devtools won't see persistence properly
create(devtools(persist(...)))

// CORRECT - persist on outside
create(persist(devtools(...)))
```

### ❌ Pitfall 4: Missing shallow on Multi-Select

```typescript
// WRONG - new object every render = always re-renders
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }))

// CORRECT
import { shallow } from 'zustand'
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }), shallow)
```

### ❌ Pitfall 5: Storing Frequently-Changing Values

```typescript
// WRONG - causes unnecessary re-renders
const store = create((set) => ({
  mouseX: 0,
  mouseY: 0,
  appConfig: {}, // Rarely changes
  setMouse: (x, y) => set({ mouseX: x, mouseY: y }),
}))

// CORRECT - separate stores
const useMouseStore = create((set) => ({
  mouseX: 0,
  mouseY: 0,
  setMouse: (x, y) => set({ mouseX: x, mouseY: y }),
}))

const useAppStore = create((set) => ({
  appConfig: {},
  setConfig: (c) => set({ appConfig: c }),
}))
```

---

## Production Checklist

Before deploying your Zustand stores:

- [ ] All state changes are immutable (no direct mutations)
- [ ] Selectors are optimized (single values or `shallow`)
- [ ] Sensitive data isn't persisted
- [ ] Migrations handle schema changes
- [ ] DevTools enabled for debugging
- [ ] Error handling in async operations
- [ ] Performance tested with DevTools
- [ ] TypeScript types are correct
- [ ] No console warnings/errors

---

## Quick Reference: When to Use What

| Need | Solution |
|------|----------|
| Simple store | `create((set) => {...})` |
| Type inference | `combine(initialState, (set) => {...})` |
| Persistence | Add `persist(...)` middleware |
| Selective subscription | Add `subscribeWithSelector()` |
| Multiple stores | Separate `create()` calls |
| Store composition | Slice pattern or separate stores |
| Async operations | `async/await` in actions |
| Debugging | `devtools` middleware |

---

## Cross-Module References

- **Store Creation:** [API Reference: Store Creation](02-api-store-creation.md)
- **State Management:** [API Reference: State Management](03-api-state-management.md)
- **Selectors:** [API Reference: Selectors](04-api-selectors.md)
- **Persistence:** [Middleware: Persistence](05-middleware-persist.md)
- **Core Middleware:** [Middleware: Core Features](06-middleware-core.md)

---

**Documentation Reference:** [https://zustand.docs.pmnd.rs/guides](https://zustand.docs.pmnd.rs/guides)