# Middleware: Persistence & Storage

**Module:** `05-middleware-persist.md` | **Version:** 5.x (^5.0.11)

---

## `persist()` Middleware

### Description

Enables automatic state persistence across page reloads and app restarts. Persists to `localStorage` by default. Supports any storage backend (AsyncStorage, MMKV, IndexedDB, sessionStorage, custom).

### Import

```typescript
import { persist, createJSONStorage } from 'zustand/middleware'
```

### Type Signature

```typescript
persist<T, U = T>(
  stateCreator: StateCreator<T, [], []>,
  options: PersistOptions<T, U>,
): StateCreator<T, [['zustand/persist', U]], []>
```

---

## Configuration Options

### All Options

| Option | Type | Required | Default | Description |
|--------|------|----------|---------|-------------|
| `name` | `string` | Yes | -- | Unique storage key |
| `storage` | `PersistStorage<T>` | No | `createJSONStorage(() => localStorage)` | Storage backend |
| `partialize` | `(state: T) => Partial<T>` | No | identity | Select which state to persist |
| `version` | `number` | No | `0` | Schema version for migrations |
| `migrate` | `(persisted: any, version: number) => T` | No | -- | Transform state on version change |
| `merge` | `(persisted: any, current: T) => T` | No | shallow merge | Custom rehydration merge logic |
| `onRehydrateStorage` | `(state: T) => ((state?: T, error?: Error) => void) \| void` | No | -- | Hook into rehydration lifecycle |
| `skipHydration` | `boolean` | No | `false` | Skip automatic rehydration (for SSR) |

---

### `name` (Required)

Unique identifier for the storage item:

```typescript
persist(stateCreator, { name: 'auth-storage' })
```

### `storage` (Optional)

```typescript
import { persist, createJSONStorage } from 'zustand/middleware'

// localStorage (default)
{ storage: createJSONStorage(() => localStorage) }

// sessionStorage
{ storage: createJSONStorage(() => sessionStorage) }

// React Native AsyncStorage
import AsyncStorage from '@react-native-async-storage/async-storage'
{ storage: createJSONStorage(() => AsyncStorage) }

// React Native MMKV
import { MMKV } from 'react-native-mmkv'
const mmkv = new MMKV()
const mmkvStorage = {
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.delete(name),
}
{ storage: createJSONStorage(() => mmkvStorage) }
```

### `partialize` (Optional)

Persist only specific state slices:

```typescript
const useStore = create<AppState>(
  persist(
    (set) => ({
      theme: 'dark',
      user: { name: 'John' },
      tempInput: '',        // Don't persist
      isLoading: false,     // Don't persist
      setTheme: (theme: string) => set({ theme }),
    }),
    {
      name: 'user-prefs',
      partialize: (state) => ({
        theme: state.theme,
        user: state.user,
      }),
    }
  )
)
```

### `version` and `migrate` (Optional)

Handle schema evolution:

```typescript
const useStore = create<ProfileState>(
  persist(
    (set) => ({
      profile: { firstName: '', lastName: '', email: '' },
      setProfile: (p: Profile) => set({ profile: p }),
    }),
    {
      name: 'user-profile',
      version: 2,
      migrate: (persistedState: unknown, version: number) => {
        const state = persistedState as Record<string, unknown>

        if (version === 0) {
          // v0 -> v1: fields were at root level
          return {
            profile: {
              firstName: state.firstName,
              lastName: state.lastName,
              email: state.email,
            },
          }
        }

        if (version === 1) {
          // v1 -> v2: email moved into profile
          return {
            profile: {
              ...(state.profile as Record<string, unknown>),
              email: state.email,
            },
          }
        }

        return state as ProfileState
      },
    }
  )
)
```

### `merge` (Optional)

Custom merge logic on rehydration:

```typescript
import deepMerge from 'lodash-es/merge'

{
  name: 'store',
  merge: (persisted, current) => deepMerge(current, persisted),
}
```

### `onRehydrateStorage` (Optional)

Hook into rehydration lifecycle:

```typescript
{
  name: 'user-store',
  onRehydrateStorage: () => {
    console.log('Rehydration starting...')
    return (state, error) => {
      if (error) {
        console.error('Rehydration failed:', error)
      } else {
        console.log('Rehydration complete')
      }
    }
  },
}
```

### `skipHydration` (Optional)

For SSR environments -- manually trigger rehydration:

```typescript
const useStore = create(
  persist(
    (set) => ({ user: null }),
    { name: 'user-store', skipHydration: true }
  )
)

// Trigger manually (e.g., in useEffect)
await useStore.persist.rehydrate()
```

---

## Persist API

The persist middleware attaches a `.persist` property to the store:

| Method | Description |
|--------|-------------|
| `useStore.persist.rehydrate()` | Manually trigger rehydration |
| `useStore.persist.hasHydrated()` | Check if hydration is complete |
| `useStore.persist.onHydrate(fn)` | Register hydration start listener |
| `useStore.persist.onFinishHydration(fn)` | Register hydration complete listener |
| `useStore.persist.getOptions()` | Get current persist options |
| `useStore.persist.setOptions(opts)` | Update persist options |
| `useStore.persist.clearStorage()` | Clear persisted data |

### Hydration-Aware Component

```typescript
function App() {
  const hasHydrated = useStore.persist.hasHydrated()

  if (!hasHydrated) {
    return <LoadingScreen />
  }

  return <MainApp />
}
```

---

## Storage Strategies

### React Native with MMKV (Recommended)

```typescript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { MMKV } from 'react-native-mmkv'

const mmkv = new MMKV()

const zustandStorage = {
  getItem: (name: string) => mmkv.getString(name) ?? null,
  setItem: (name: string, value: string) => mmkv.set(name, value),
  removeItem: (name: string) => mmkv.delete(name),
}

const useAuthStore = create<AuthState>(
  persist(
    (set) => ({
      token: null,
      user: null,
      login: (token: string, user: User) => set({ token, user }),
      logout: () => set({ token: null, user: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => zustandStorage),
      partialize: (state) => ({ token: state.token, user: state.user }),
    }
  )
)
```

### Custom URL Storage

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
```

---

## Best Practices

**DO:**
- Use `partialize` to persist only essential state
- Implement `migrate` when changing schema
- Use unique `name` keys to avoid conflicts
- Use MMKV for React Native (synchronous, fast)
- Test persistence on page/app reload

**DON'T:**
- Persist sensitive data (auth tokens in localStorage -- use SecureStore/Keychain)
- Persist frequently-changing data (loading states, form inputs)
- Assume persisted data is valid -- validate on rehydration
- Forget error handling in migrations

---

**Source:** https://zustand.docs.pmnd.rs/middlewares/persist
**Version:** 5.x (^5.0.11)
