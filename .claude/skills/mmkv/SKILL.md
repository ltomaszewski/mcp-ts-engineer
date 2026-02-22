---
name: mmkv
description: MMKV fast key-value storage - initialization, CRUD, encryption, hooks, listeners. Use when implementing fast local storage, replacing AsyncStorage, or storing user preferences.
---

# MMKV

Ultra-fast synchronous key-value storage for React Native -- 30x faster than AsyncStorage.

---

## When to Use

LOAD THIS SKILL when user is:
- Setting up local key-value storage in React Native
- Replacing AsyncStorage with a faster synchronous alternative
- Storing user preferences, auth tokens, or app state
- Implementing encrypted local storage
- Creating Zustand/Redux persist storage adapters

---

## Critical Rules

**ALWAYS:**
1. Use typed getter methods (`getString`, `getNumber`, `getBoolean`) -- type safety and correct return types
2. Use `createMMKV()` factory function (v4 API) -- `new MMKV()` class constructor was removed in v4
3. Use `remove()` to delete keys (v4 API) -- `delete()` was renamed due to C++ keyword conflict
4. Use encryption for sensitive data (tokens, PII) -- MMKV files are readable without encryption
5. Install `react-native-nitro-modules` alongside MMKV -- required runtime dependency for v4

**NEVER:**
1. Store sensitive tokens without encryption -- MMKV storage files are accessible on rooted devices
2. Hardcode encryption keys in source -- store keys in Keychain/SecureStore
3. Store large blobs (>1MB) -- MMKV is optimized for small key-value pairs; use SQLite for large data
4. Create multiple instances with the same `id` -- they share the same underlying file, causing confusion
5. Wrap synchronous calls in async/await -- MMKV is fully synchronous by design

---

## Core Patterns

### Basic Storage Instance (v4 API)

```typescript
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'app-storage' });

export const secureStorage = createMMKV({
  id: 'secure-storage',
  encryptionKey: 'your-encryption-key',
});
```

### CRUD Operations

```typescript
import { storage } from './storage';

// SET - type inferred from value
storage.set('user.name', 'John Doe');
storage.set('user.age', 30);
storage.set('user.premium', true);
storage.set('user.data', new ArrayBuffer(8));

// GET - use typed methods
const name = storage.getString('user.name');       // string | undefined
const age = storage.getNumber('user.age');          // number | undefined
const isPremium = storage.getBoolean('user.premium'); // boolean | undefined
const data = storage.getBuffer('user.data');        // ArrayBuffer | undefined

// DELETE (v4: remove, not delete)
storage.remove('user.name');

// CHECK existence
if (storage.contains('user.age')) { /* key exists */ }

// LIST all keys
const allKeys = storage.getAllKeys(); // string[]

// CLEAR everything
storage.clearAll();
```

### React Hooks

```typescript
import { useMMKVString, useMMKVNumber, useMMKVBoolean, useMMKVObject } from 'react-native-mmkv';

function ProfileScreen() {
  const [name, setName] = useMMKVString('user.name');
  const [age, setAge] = useMMKVNumber('user.age');
  const [premium, setPremium] = useMMKVBoolean('user.premium');
  const [settings, setSettings] = useMMKVObject<{ theme: string }>('user.settings');

  // Set to undefined to delete
  const clearName = () => setName(undefined);

  return (/* render with reactive values */);
}
```

### Zustand Storage Adapter

```typescript
import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

const mmkv = createMMKV({ id: 'zustand-storage' });

const zustandStorage: StateStorage = {
  getItem: (name) => mmkv.getString(name) ?? null,
  setItem: (name, value) => mmkv.set(name, value),
  removeItem: (name) => mmkv.remove(name),
};

const useStore = create(
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

### Value Change Listener

```typescript
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'app-storage' });

const listener = storage.addOnValueChangedListener((changedKey) => {
  const newValue = storage.getString(changedKey);
  console.log(`${changedKey} changed to: ${newValue}`);
});

// Remove when done
listener.remove();
```

### Encryption Management (v4 API)

```typescript
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'my-storage' });

// Encrypt all data with AES-128
storage.encrypt('hunter2');

// Encrypt with AES-256
storage.encrypt('hunter2', 'AES-256');

// Remove encryption
storage.decrypt();
```

---

## Anti-Patterns

**BAD** -- Storing sensitive data without encryption:
```typescript
const storage = createMMKV({ id: 'tokens' });
storage.set('authToken', token); // Unencrypted!
```

**GOOD** -- Use encryption for sensitive data:
```typescript
const storage = createMMKV({
  id: 'tokens',
  encryptionKey: keyFromKeychain,
});
storage.set('authToken', token); // Encrypted at rest
```

**BAD** -- Using old v3 API:
```typescript
const storage = new MMKV(); // v3 class removed in v4
storage.delete('key');       // renamed to remove() in v4
```

**GOOD** -- Using v4 factory function:
```typescript
const storage = createMMKV(); // v4 factory
storage.remove('key');         // v4 method name
```

**BAD** -- Using wrong getter type:
```typescript
const age = storage.getString('user.age'); // Returns "30" not 30
```

**GOOD** -- Use typed getters:
```typescript
const age = storage.getNumber('user.age'); // Returns 30
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Create instance | `createMMKV()` | `const s = createMMKV({ id: 'app' })` |
| Set value | `set()` | `s.set('key', value)` |
| Get string | `getString()` | `s.getString('key')` |
| Get number | `getNumber()` | `s.getNumber('key')` |
| Get boolean | `getBoolean()` | `s.getBoolean('key')` |
| Get buffer | `getBuffer()` | `s.getBuffer('key')` |
| Delete key | `remove()` | `s.remove('key')` |
| Check exists | `contains()` | `s.contains('key')` |
| Get all keys | `getAllKeys()` | `s.getAllKeys()` |
| Clear all | `clearAll()` | `s.clearAll()` |
| Storage size | `size` | `s.size` |
| Trim/optimize | `trim()` | `s.trim()` |
| Encrypt | `encrypt()` | `s.encrypt('key')` |
| Decrypt | `decrypt()` | `s.decrypt()` |
| Import data | `importAllFrom()` | `s.importAllFrom(otherInstance)` |
| Listen changes | `addOnValueChangedListener()` | `s.addOnValueChangedListener(cb)` |
| Check exists (global) | `existsMMKV()` | `existsMMKV('id')` |
| Delete instance | `deleteMMKV()` | `deleteMMKV('id')` |
| Hook: string | `useMMKVString()` | `const [v, set] = useMMKVString('key')` |
| Hook: number | `useMMKVNumber()` | `const [v, set] = useMMKVNumber('key')` |
| Hook: boolean | `useMMKVBoolean()` | `const [v, set] = useMMKVBoolean('key')` |
| Hook: object | `useMMKVObject<T>()` | `const [v, set] = useMMKVObject<T>('key')` |
| Hook: buffer | `useMMKVBuffer()` | `const [v, set] = useMMKVBuffer('key')` |
| Hook: instance | `useMMKV()` | `const s = useMMKV({ id: 'my-id' })` |
| Hook: listener | `useMMKVListener()` | `useMMKVListener((key) => {})` |
| Hook: keys | `useMMKVKeys()` | `const keys = useMMKVKeys(storage)` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and native setup | [01-setup-installation.md](01-setup-installation.md) |
| Architecture and concepts | [02-core-concepts.md](02-core-concepts.md) |
| Constructor options and multiple instances | [03-api-initialization.md](03-api-initialization.md) |
| Read/write methods and data types | [04-api-read-write.md](04-api-read-write.md) |
| React hooks for components | [05-api-hooks.md](05-api-hooks.md) |
| Encryption, listeners, utilities | [06-api-advanced.md](06-api-advanced.md) |
| Zustand/Redux integration, AsyncStorage migration | [07-integrations.md](07-integrations.md) |

---

**Version:** 4.x | **Source:** https://github.com/mrousavy/react-native-mmkv
