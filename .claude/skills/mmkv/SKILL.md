---
name: mmkv
description: MMKV fast key-value storage - initialization, CRUD, encryption. Use when implementing fast local storage, replacing AsyncStorage, or storing user preferences.
---

# MMKV

> Ultra-fast key-value storage for React Native — 30x faster than AsyncStorage.

**Package:** `react-native-mmkv`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Setting up local key-value storage
- Replacing AsyncStorage with faster alternative
- Storing user preferences or app state
- Implementing encrypted local storage
- Creating Zustand persist storage adapter

---

## Critical Rules

**ALWAYS:**
1. Use typed getter methods (`getString`, `getNumber`, `getBoolean`) — type safety and correct return types
2. Use encryption for sensitive data — MMKV supports AES encryption natively
3. Create separate instances for different data domains — better organization and isolation
4. Use Zustand storage adapter pattern — cleanest integration with state management

**NEVER:**
1. Store sensitive tokens without encryption — MMKV is fast but not secure by default
2. Use `get()` without type method — returns Buffer, not the expected type
3. Forget to run `pod install` after adding — native module requires linking
4. Store large blobs (>1MB) — MMKV is optimized for small key-value pairs

---

## Core Patterns

### Basic Storage Instance (v4.x API)

```typescript
import { createMMKV, type MMKV } from 'react-native-mmkv';

// Create default storage instance
export const storage: MMKV = createMMKV({
  id: 'app-storage',
});

// Create encrypted storage for sensitive data
export const secureStorage: MMKV = createMMKV({
  id: 'secure-storage',
  encryptionKey: 'your-encryption-key-here',
});
```

### CRUD Operations

```typescript
import { storage } from './storage';

// SET - type is inferred from value
storage.set('user.name', 'John Doe');
storage.set('user.age', 30);
storage.set('user.premium', true);
storage.set('user.data', JSON.stringify({ theme: 'dark' }));

// GET - use typed methods
const name = storage.getString('user.name');      // string | undefined
const age = storage.getNumber('user.age');        // number | undefined
const isPremium = storage.getBoolean('user.premium'); // boolean | undefined
const data = JSON.parse(storage.getString('user.data') ?? '{}');

// DELETE
storage.delete('user.name');

// CHECK existence
if (storage.contains('user.age')) {
  // key exists
}

// GET all keys
const allKeys = storage.getAllKeys(); // string[]

// CLEAR all data
storage.clearAll();
```

### Zustand Storage Adapter

```typescript
import { createMMKV } from 'react-native-mmkv';
import type { StateStorage } from 'zustand/middleware';

const storage = createMMKV({ id: 'zustand-storage' });

export const zustandStorage: StateStorage = {
  getItem: (name) => storage.getString(name) ?? null,
  setItem: (name, value) => storage.set(name, value),
  removeItem: (name) => storage.delete(name),
};

// Usage in Zustand store
import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

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

// Listen to changes
const listener = storage.addOnValueChangedListener((changedKey) => {
  const newValue = storage.getString(changedKey);
  console.log(`${changedKey} changed to: ${newValue}`);
});

// Remove listener when done
listener.remove();
```

### Migration from AsyncStorage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'app-storage' });

async function migrateFromAsyncStorage() {
  const keys = await AsyncStorage.getAllKeys();

  for (const key of keys) {
    const value = await AsyncStorage.getItem(key);
    if (value !== null) {
      storage.set(key, value);
    }
  }

  // Clear AsyncStorage after migration
  await AsyncStorage.clear();
}
```

---

## Anti-Patterns

**BAD** — Storing sensitive data without encryption:
```typescript
const storage = createMMKV({ id: 'tokens' });
storage.set('authToken', token); // Unencrypted!
```

**GOOD** — Use encryption for sensitive data:
```typescript
const storage = createMMKV({
  id: 'tokens',
  encryptionKey: 'secure-key-from-keychain',
});
storage.set('authToken', token); // Encrypted
```

**BAD** — Using wrong getter type:
```typescript
const age = storage.getString('user.age'); // Returns "30" not 30
const count = Number(storage.getString('count')); // Manual conversion
```

**GOOD** — Use typed getters:
```typescript
const age = storage.getNumber('user.age');    // Returns 30
const isPremium = storage.getBoolean('premium'); // Returns true/false
```

**BAD** — Storing large objects directly:
```typescript
storage.set('allUsers', JSON.stringify(hugeArray)); // Slow for large data
```

**GOOD** — Store references, use DB for large data:
```typescript
storage.set('lastUserId', userId); // Store small reference
// Use SQLite/WatermelonDB for large datasets
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Create instance | `createMMKV()` | `const storage = createMMKV({ id: 'app' })` |
| Set value | `set()` | `storage.set('key', value)` |
| Get string | `getString()` | `const val = storage.getString('key')` |
| Get number | `getNumber()` | `const num = storage.getNumber('key')` |
| Get boolean | `getBoolean()` | `const bool = storage.getBoolean('key')` |
| Delete key | `delete()` | `storage.delete('key')` |
| Check exists | `contains()` | `if (storage.contains('key'))` |
| Get all keys | `getAllKeys()` | `const keys = storage.getAllKeys()` |
| Clear all | `clearAll()` | `storage.clearAll()` |
| Listen changes | `addOnValueChangedListener()` | `storage.addOnValueChangedListener(cb)` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Installation and native setup | [setup-installation.md](setup-installation.md) |
| Storage concepts and encryption | [core-concepts.md](core-concepts.md) |
| Full API reference | [api-initialization.md](api-initialization.md) |

---

**Version:** 4.x | **Source:** https://github.com/mrousavy/react-native-mmkv
