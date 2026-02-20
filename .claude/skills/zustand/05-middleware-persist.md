# Middleware: Persistence & Storage
**Module:** `05-middleware-persist.md` | **Version:** 4.x | **Status:** Complete

**Source:** [https://zustand.docs.pmnd.rs/middlewares/persist](https://zustand.docs.pmnd.rs/middlewares/persist)

---

## Table of Contents
1. [persist() Middleware](#persist-middleware)
2. [Configuration Options](#configuration-options)
3. [Persistence Strategies](#persistence-strategies)
4. [Versioning & Migrations](#versioning--migrations)
5. [Best Practices](#best-practices)

---

## `persist()` Middleware

### Description
Enables automatic state persistence across page reloads and application restarts. Persists to localStorage by default but supports any storage backend (AsyncStorage, IndexedDB, custom storage, etc.).

### Type Signature
```typescript
persist<T, U>(
  stateCreator: StateCreator<T, [], []>,
  persistOptions?: PersistOptions<T, U>
): StateCreator<T, [['zustand/persist', U]], []>
```

### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `stateCreator` | `StateCreator<T, [], []>` | Your store's state creator function |
| `persistOptions` | `PersistOptions<T, U>` (optional) | Configuration for persistence behavior |

### Return Value
| Type | Description |
|------|-------------|
| `StateCreator` | A state creator function (used with `create()` or `createStore()`) |

### Code Example: Basic Persistence

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      login: (email, password) => {
        // Validate...
        set({ user: { email, id: '123' } })
      },
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-storage', // Storage key
    }
  )
)

// State automatically saves to localStorage['auth-storage']
// State automatically rehydrates on page reload
```

### Code Example: React Hook Usage

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface AuthStore {
  user: { email: string; id: string } | null
  login: (email: string, password: string) => void
  logout: () => void
}

const useAuth = create<AuthStore>(
  persist(
    (set) => ({
      user: null,
      login: (email, password) => set({ user: { email, id: '123' } }),
      logout: () => set({ user: null }),
    }),
    {
      name: 'auth-store',
    }
  )
)

// In component
function Profile() {
  const { user, logout } = useAuth()
  
  // Persisted: if user exists, it was loaded from storage
  if (!user) return <Login />
  
  return (
    <div>
      <p>Welcome {user.email}</p>
      <button onClick={logout}>Logout</button>
    </div>
  )
}
```

---

## Configuration Options

### name (Required)

```typescript
{
  name: 'my-store-key'
}
```

Unique identifier for storage item. Used as localStorage key or AsyncStorage key.

### storage (Optional)

```typescript
import { persist, createJSONStorage } from 'zustand/middleware'

// localStorage (default)
{
  name: 'my-store',
  storage: createJSONStorage(() => localStorage), // Default
}

// sessionStorage
{
  name: 'my-store',
  storage: createJSONStorage(() => sessionStorage),
}

// Custom storage (React Native example)
import AsyncStorage from '@react-native-async-storage/async-storage'

{
  name: 'my-store',
  storage: createJSONStorage(() => AsyncStorage),
}
```

### partialize (Optional)

Selectively persist only specific parts of state:

```typescript
const useStore = create(
  persist(
    (set) => ({
      theme: 'dark',
      user: { name: 'John' },
      tempInput: '', // Don't persist
      
      setTheme: (theme) => set({ theme }),
      setUser: (user) => set({ user }),
      setInput: (input) => set({ tempInput: input }),
    }),
    {
      name: 'user-prefs',
      // Only persist theme and user, not tempInput
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
      }),
    }
  )
)
```

### version (Optional)

Version number for handling state schema changes:

```typescript
{
  name: 'user-store',
  version: 2, // Current version
  migrate: (persistedState, version) => {
    // Handle migration logic below
  },
}
```

### migrate (Optional)

Transform persisted state when version changes:

```typescript
const useStore = create(
  persist(
    (set) => ({
      position: { x: 0, y: 0 }, // v1 and v2 structure
      setPosition: (pos) => set({ position: pos }),
    }),
    {
      name: 'position-store',
      version: 1,
      migrate: (persistedState: any, version) => {
        // v0 → v1: rename 'pos' to 'position'
        if (version === 0) {
          return {
            position: { x: persistedState.pos.x, y: persistedState.pos.y },
          }
        }
        return persistedState
      },
    }
  )
)
```

### merge (Optional)

Custom merge logic when rehydrating persisted state:

```typescript
import { persist } from 'zustand/middleware'
import deepMerge from 'lodash-es/merge'

const useStore = create(
  persist(
    (set) => ({
      nested: { a: 1, b: 2 },
    }),
    {
      name: 'store',
      merge: (persisted, current) => {
        // Deep merge instead of shallow
        return deepMerge(current, persisted)
      },
    }
  )
)
```

### onRehydrateStorage (Optional)

Execute custom logic before/after rehydration:

```typescript
const useStore = create(
  persist(
    (set) => ({
      user: null,
      isHydrated: false,
    }),
    {
      name: 'user-store',
      onRehydrateStorage: (state, version) => (
        persistedState,
        error
      ) => {
        if (error) {
          console.error('Failed to rehydrate:', error)
        } else {
          console.log('Rehydration complete')
          // Set flag after rehydration
          set({ isHydrated: true })
        }
      },
    }
  )
)
```

### skipHydration (Optional)

Skip automatic rehydration for SSR:

```typescript
const useStore = create(
  persist(
    (set) => ({
      user: null,
    }),
    {
      name: 'user-store',
      skipHydration: true, // Manual control
    }
  )
)

// Later, trigger rehydration manually
await useStore.persist.rehydrate()
```

---

## Persistence Strategies

### Strategy 1: Basic localStorage Persistence

```typescript
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

const useUserStore = create(
  persist(
    (set) => ({
      preferences: { theme: 'dark', language: 'en' },
      setPreferences: (prefs) => set({ preferences: prefs }),
    }),
    {
      name: 'user-prefs',
    }
  )
)

// Auto-persisted to localStorage['user-prefs']
// Auto-rehydrated on reload
```

### Strategy 2: Partial Persistence (Only What Matters)

```typescript
const useAppStore = create(
  persist(
    (set) => ({
      // Persistent data
      savedWorkspace: {},
      userSettings: {},
      
      // Temporary data (don't persist)
      isLoading: false,
      errorMessage: null,
      
      setSavedWorkspace: (ws) => set({ savedWorkspace: ws }),
      setIsLoading: (bool) => set({ isLoading: bool }),
    }),
    {
      name: 'app-workspace',
      partialize: (state) => ({
        savedWorkspace: state.savedWorkspace,
        userSettings: state.userSettings,
        // errorMessage and isLoading NOT persisted
      }),
    }
  )
)
```

### Strategy 3: Custom Storage Backend

```typescript
const urlStorage = {
  getItem: (key: string) => {
    const params = new URLSearchParams(window.location.search)
    return params.get(key)
  },
  setItem: (key: string, value: string) => {
    const params = new URLSearchParams(window.location.search)
    params.set(key, value)
    window.history.replaceState({}, '', `?${params.toString()}`)
  },
  removeItem: (key: string) => {
    const params = new URLSearchParams(window.location.search)
    params.delete(key)
    window.history.replaceState({}, '', `?${params.toString()}`)
  },
}

const useStore = create(
  persist(
    (set) => ({ data: '' }),
    {
      name: 'state-param',
      storage: createJSONStorage(() => urlStorage),
    }
  )
)

// State saved in URL query params: ?state-param=...
```

---

## Versioning & Migrations

### Migration Example: Schema Evolution

```typescript
const useStore = create(
  persist(
    (set) => ({
      // Current schema (v2)
      profile: { firstName: '', lastName: '', email: '' },
      setProfile: (p) => set({ profile: p }),
    }),
    {
      name: 'user-profile',
      version: 2,
      migrate: (persistedState: any, version) => {
        // v0 → v1: firstName and lastName were separate
        if (version === 0) {
          return {
            profile: {
              firstName: persistedState.firstName,
              lastName: persistedState.lastName,
              email: persistedState.email,
            },
          }
        }
        
        // v1 → v2: email moved from root to profile
        if (version === 1) {
          return {
            profile: {
              ...persistedState.profile,
              email: persistedState.email,
            },
          }
        }
        
        return persistedState
      },
    }
  )
)
```

---

## Best Practices

### ✅ DO

- **Persist user preferences and non-sensitive data**
```typescript
persist((set) => ({...}), {
  name: 'user-preferences',
  partialize: (state) => ({
    theme: state.theme,
    language: state.language,
    sidebarCollapsed: state.sidebarCollapsed,
  }),
})
```

- **Use unique storage keys** to avoid conflicts
- **Implement migrations** when schema changes
- **Test persistence** on page reload

### ❌ DON'T

- **Don't persist sensitive data**
```typescript
// DON'T: Security risk
partialize: (state) => ({
  user: state.user, // Contains auth token!
  apiKey: state.apiKey,
})
```

- **Don't persist frequently-changing data** (loading states, form inputs)
- **Don't forget error handling** in migrations
- **Don't assume persisted data is valid** - validate on rehydration

---

## Cross-Module References

- **Store Creation:** [API Reference: Store Creation](02-api-store-creation.md)
- **Middleware Composition:** [Middleware: Core Features](06-middleware-core.md)
- **Advanced Patterns:** [Advanced Patterns](07-advanced-patterns.md)

---

**Official Source:** [https://zustand.docs.pmnd.rs/middlewares/persist](https://zustand.docs.pmnd.rs/middlewares/persist)