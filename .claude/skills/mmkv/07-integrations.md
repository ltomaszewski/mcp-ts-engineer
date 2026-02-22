# MMKV: Integrations & Migration

**Zustand adapter, Redux Persist, AsyncStorage migration, and v3-to-v4 upgrade.**

---

## Zustand Persist Middleware

```typescript
import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const mmkv = createMMKV({ id: 'zustand-storage' });

export const zustandStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => mmkv.remove(name),
};

// Usage in store
interface CounterStore {
  count: number;
  increment: () => void;
}

export const useCounterStore = create<CounterStore>()(
  persist(
    (set) => ({
      count: 0,
      increment: () => set((s) => ({ count: s.count + 1 })),
    }),
    {
      name: 'counter-storage',
      storage: createJSONStorage(() => zustandStorage),
    }
  )
);
```

---

## Redux Persist

```typescript
import { createMMKV } from 'react-native-mmkv';
import type { Storage } from 'redux-persist';

const mmkv = createMMKV({ id: 'redux-storage' });

export const reduxStorage: Storage = {
  setItem: (key, value) => {
    mmkv.set(key, value);
    return Promise.resolve(true);
  },
  getItem: (key) => {
    const value = mmkv.getString(key);
    return Promise.resolve(value ?? null);
  },
  removeItem: (key) => {
    mmkv.remove(key);
    return Promise.resolve();
  },
};

// Usage in Redux persistConfig
const persistConfig = {
  key: 'root',
  storage: reduxStorage,
};
```

---

## Jotai Integration

```typescript
import { createMMKV } from 'react-native-mmkv';
import { atomWithStorage, createJSONStorage } from 'jotai/utils';

const mmkv = createMMKV({ id: 'jotai-storage' });

const jotaiStorage = createJSONStorage(() => ({
  getItem: (key: string) => mmkv.getString(key) ?? null,
  setItem: (key: string, value: string) => mmkv.set(key, value),
  removeItem: (key: string) => mmkv.remove(key),
}));

export const themeAtom = atomWithStorage('theme', 'light', jotaiStorage);
```

---

## Migration from AsyncStorage

### Migration Function

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'app-storage' });

export async function migrateFromAsyncStorage(): Promise<void> {
  // Check if already migrated
  if (storage.getBoolean('__migrated')) return;

  console.log('Starting AsyncStorage migration...');
  const start = Date.now();

  try {
    const keys = await AsyncStorage.getAllKeys();

    for (const key of keys) {
      try {
        const value = await AsyncStorage.getItem(key);
        if (value !== null) {
          // Detect booleans stored as strings
          if (value === 'true') {
            storage.set(key, true);
          } else if (value === 'false') {
            storage.set(key, false);
          } else {
            storage.set(key, value);
          }
        }
      } catch (err) {
        console.warn(`Failed to migrate key "${key}":`, err);
      }
    }

    // Mark migration complete
    storage.set('__migrated', true);
    storage.set('__migrated_at', Date.now());

    // Clear AsyncStorage
    await AsyncStorage.clear();

    console.log(`Migration complete in ${Date.now() - start}ms (${keys.length} keys)`);
  } catch (err) {
    console.error('Migration failed:', err);
    throw err;
  }
}
```

### Call During App Startup

```typescript
import { InteractionManager } from 'react-native';
import { migrateFromAsyncStorage } from './migration';

function App() {
  useEffect(() => {
    InteractionManager.runAfterInteractions(() => {
      migrateFromAsyncStorage().catch(console.error);
    });
  }, []);

  return <YourApp />;
}
```

---

## V3 to V4 Upgrade Guide

### Breaking Changes

| Change | V3 | V4 |
|--------|----|----|
| Constructor | `new MMKV()` | `createMMKV()` |
| Delete key | `storage.delete('key')` | `storage.remove('key')` |
| Encryption | `storage.recrypt('key')` | `storage.encrypt('key')` |
| Remove encryption | `storage.recrypt(undefined)` | `storage.decrypt()` |
| Runtime dep | JSI | `react-native-nitro-modules` |
| Min RN | 0.71+ | 0.75+ |
| iOS App Group key | `AppGroup` | `AppGroupIdentifier` |

### Migration Steps

1. Install Nitro Modules:
```bash
npm install react-native-nitro-modules
```

2. Update constructor calls:
```typescript
// Before
const storage = new MMKV({ id: 'app' });

// After
const storage = createMMKV({ id: 'app' });
```

3. Rename `delete` to `remove`:
```typescript
// Before
storage.delete('key');

// After
storage.remove('key');
```

4. Update encryption API:
```typescript
// Before
storage.recrypt('new-key');
storage.recrypt(undefined);

// After
storage.encrypt('new-key');
storage.decrypt();
```

5. Update Info.plist key (iOS App Groups):
```xml
<!-- Before -->
<key>AppGroup</key>
<!-- After -->
<key>AppGroupIdentifier</key>
```

6. Rebuild native:
```bash
cd ios && pod install && cd ..
npx react-native run-ios
npx react-native run-android
```

---

**Version:** 4.x | **Source:** https://github.com/mrousavy/react-native-mmkv
