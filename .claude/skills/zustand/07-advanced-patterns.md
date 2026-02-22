# Advanced Patterns & Best Practices

**Module:** `07-advanced-patterns.md` | **Version:** 5.x (^5.0.2)

---

## Store Slicing (Modular Stores)

### Typed Slices Pattern

Organize large stores into typed slices using `StateCreator`:

```typescript
import { create, StateCreator } from 'zustand'

// Define slice interfaces
interface AuthSlice {
  user: { id: string; email: string } | null
  isAuthenticated: boolean
  login: (user: AuthSlice['user']) => void
  logout: () => void
}

interface UISlice {
  theme: 'light' | 'dark'
  sidebarOpen: boolean
  toggleTheme: () => void
  toggleSidebar: () => void
}

interface DataSlice {
  items: Array<{ id: string; title: string }>
  addItem: (item: DataSlice['items'][number]) => void
}

// Combined store type
type AppStore = AuthSlice & UISlice & DataSlice

// Create typed slices with StateCreator
const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set({ user, isAuthenticated: true }),
  logout: () => set({ user: null, isAuthenticated: false }),
})

const createUISlice: StateCreator<AppStore, [], [], UISlice> = (set) => ({
  theme: 'light',
  sidebarOpen: true,
  toggleTheme: () =>
    set((s) => ({ theme: s.theme === 'light' ? 'dark' : 'light' })),
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
})

const createDataSlice: StateCreator<AppStore, [], [], DataSlice> = (set) => ({
  items: [],
  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
})

// Compose slices
const useAppStore = create<AppStore>()((...a) => ({
  ...createAuthSlice(...a),
  ...createUISlice(...a),
  ...createDataSlice(...a),
}))
```

### Cross-Slice Access

Slices can access other slices via `get()`:

```typescript
const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (
  set,
  get,
) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => {
    set({ user, isAuthenticated: true })
    // Access UISlice
    const { theme } = get()
    console.log(`Logged in with ${theme} theme`)
  },
  logout: () => set({ user: null, isAuthenticated: false }),
})
```

### Slices with Middleware

```typescript
import { devtools } from 'zustand/middleware'
import { immer } from 'zustand/middleware/immer'

// Middleware mutators must be declared in each slice type
const createAuthSlice: StateCreator<
  AppStore,
  [['zustand/devtools', never], ['zustand/immer', never]],
  [],
  AuthSlice
> = (set) => ({
  user: null,
  isAuthenticated: false,
  login: (user) => set((s) => { s.user = user; s.isAuthenticated = true }),
  logout: () => set((s) => { s.user = null; s.isAuthenticated = false }),
})

const useAppStore = create<AppStore>()(
  devtools(
    immer((...a) => ({
      ...createAuthSlice(...a),
      ...createUISlice(...a),
    })),
    { name: 'AppStore' }
  )
)
```

---

## Multiple Specialized Stores

For large applications with independent concerns:

```typescript
// stores/auth.ts
export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  isLoading: false,
  login: async (email: string, password: string) => {
    set({ isLoading: true })
    const user = await authenticate(email, password)
    set({ user, isLoading: false })
  },
  logout: () => set({ user: null }),
}))

// stores/ui.ts
export const useUIStore = create<UIState>((set) => ({
  sidebarOpen: true,
  theme: 'light' as const,
  toggleSidebar: () => set((s) => ({ sidebarOpen: !s.sidebarOpen })),
}))

// In components: use only what you need
function Dashboard() {
  const user = useAuthStore((s) => s.user)
  const sidebarOpen = useUIStore((s) => s.sidebarOpen)
  // ...
}
```

**When to use multiple stores:**
- State domains are independent (auth, UI, data)
- Different update frequencies (mouse position vs config)
- Easier testing and code splitting

---

## Async Operations

### Loading/Error State Pattern

```typescript
import { create } from 'zustand'

interface AsyncState<T> {
  data: T | null
  isLoading: boolean
  error: string | null
}

interface DataStore extends AsyncState<User[]> {
  fetchData: () => Promise<void>
}

const useDataStore = create<DataStore>((set) => ({
  data: null,
  isLoading: false,
  error: null,
  fetchData: async () => {
    set({ isLoading: true, error: null })
    try {
      const response = await fetch('/api/users')
      if (!response.ok) throw new Error('Failed to fetch')
      const data = await response.json()
      set({ data, isLoading: false })
    } catch (error) {
      set({
        error: error instanceof Error ? error.message : 'Unknown error',
        isLoading: false,
      })
    }
  },
}))
```

### AbortController for Cleanup

```typescript
const useSearchStore = create<SearchState>((set, get) => {
  let controller: AbortController | null = null

  return {
    results: [],
    isLoading: false,
    search: async (query: string) => {
      controller?.abort()
      controller = new AbortController()
      set({ isLoading: true })
      try {
        const res = await fetch(`/api/search?q=${query}`, {
          signal: controller.signal,
        })
        const results = await res.json()
        set({ results, isLoading: false })
      } catch (error) {
        if (error instanceof Error && error.name !== 'AbortError') {
          set({ isLoading: false })
        }
      }
    },
    cancel: () => controller?.abort(),
  }
})
```

---

## Transient Updates (Subscribe for DOM)

Use `subscribe` for high-frequency updates that bypass React:

```typescript
import { createStore } from 'zustand/vanilla'
import { subscribeWithSelector } from 'zustand/middleware'

const cursorStore = createStore(
  subscribeWithSelector((set) => ({
    x: 0,
    y: 0,
    setPosition: (x: number, y: number) => set({ x, y }),
  }))
)

// Direct DOM update -- no React re-renders
const $cursor = document.getElementById('cursor')!
cursorStore.subscribe(
  (state) => ({ x: state.x, y: state.y }),
  ({ x, y }) => {
    $cursor.style.transform = `translate(${x}px, ${y}px)`
  },
)

document.addEventListener('mousemove', (e) => {
  cursorStore.getState().setPosition(e.clientX, e.clientY)
})
```

---

## Store Reset Pattern

```typescript
interface BearState {
  bears: number
  fish: number
  addBear: () => void
  addFish: () => void
  reset: () => void
}

const initialState = {
  bears: 0,
  fish: 0,
}

const useBearStore = create<BearState>((set) => ({
  ...initialState,
  addBear: () => set((s) => ({ bears: s.bears + 1 })),
  addFish: () => set((s) => ({ fish: s.fish + 1 })),
  reset: () => set(initialState),
}))
```

Or using the `store` argument:

```typescript
const useBearStore = create<BearState>((set, get, store) => ({
  bears: 0,
  fish: 0,
  addBear: () => set((s) => ({ bears: s.bears + 1 })),
  reset: () => set(store.getInitialState()),
}))
```

---

## Debugging with DevTools

```typescript
import { create } from 'zustand'
import { devtools } from 'zustand/middleware'

const useStore = create<State>()(
  devtools(
    (set) => ({
      count: 0,
      // Named actions appear in DevTools
      increment: () =>
        set((s) => ({ count: s.count + 1 }), undefined, 'count/increment'),
      decrement: () =>
        set((s) => ({ count: s.count - 1 }), undefined, 'count/decrement'),
    }),
    {
      name: 'CounterStore',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
)
```

---

## Common Pitfalls

### Pitfall 1: Direct Mutation

```typescript
// WRONG
store.getState().items.push(item)

// CORRECT
set((s) => ({ items: [...s.items, item] }))
// Or with immer: set(s => { s.items.push(item) })
```

### Pitfall 2: Missing useShallow

```typescript
// WRONG: new object every render
const { a, b } = useStore((s) => ({ a: s.a, b: s.b }))

// CORRECT
import { useShallow } from 'zustand/react/shallow'
const { a, b } = useStore(useShallow((s) => ({ a: s.a, b: s.b })))
```

### Pitfall 3: Middleware Ordering

```typescript
// WRONG: devtools inside immer loses action names
create(immer(devtools((set) => ({...}))))

// CORRECT: devtools wraps immer
create(devtools(immer((set) => ({...}))))
```

### Pitfall 4: Storing High-Frequency State Together

```typescript
// WRONG: mouse position in same store as config
const useStore = create((set) => ({
  mouseX: 0,
  mouseY: 0,
  appConfig: {},
}))

// CORRECT: separate stores by update frequency
const useMouseStore = create((set) => ({
  x: 0, y: 0,
  setPos: (x: number, y: number) => set({ x, y }),
}))
const useConfigStore = create((set) => ({
  config: {},
  setConfig: (c: Config) => set({ config: c }),
}))
```

---

## Quick Reference: When to Use What

| Need | Solution |
|------|----------|
| Simple store | `create<T>((set) => ({...}))` |
| Auto type inference | `combine(initialState, (set) => ({...}))` |
| Persistence | `persist(...)` middleware |
| Selective subscription | `subscribeWithSelector()` middleware |
| Mutable-style updates | `immer()` middleware |
| DevTools debugging | `devtools()` middleware |
| Non-React usage | `createStore()` from `zustand/vanilla` |
| Custom equality | `createWithEqualityFn()` from `zustand/traditional` |
| Multiple stores | Separate `create()` calls |
| Large store organization | Slices pattern with `StateCreator` |
| Reset to initial | `store.getInitialState()` or custom `reset` action |
| DOM transient updates | `subscribe()` with vanilla store |

---

**Source:** https://zustand.docs.pmnd.rs/guides/slices-pattern | https://zustand.docs.pmnd.rs/guides/updating-state
**Version:** 5.x (^5.0.2)
