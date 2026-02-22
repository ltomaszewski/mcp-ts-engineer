# MMKV: Core Concepts

**Architecture, performance model, and design principles.**

---

## What is MMKV?

**MMKV** (Memory Mapped Key-Value) is a high-performance key-value storage framework originally developed by Tencent (WeChat). `react-native-mmkv` is a JavaScript binding by Marc Rousavy.

**Core technology:**
- **Memory-mapped file I/O** -- direct memory access to file-backed storage
- **Protocol buffers** -- compact binary serialization
- **C++ native implementation** -- via Nitro Modules (v4)

---

## Architecture Stack

```
JavaScript/TypeScript Layer (your app code)
         |
Nitro Modules (zero-copy direct JS binding)
         |
MMKV C++ Native Library (memory-mapped I/O)
         |
File System (iOS Documents / Android getFilesDir)
```

**V4 uses Nitro Modules** -- compiled C++ with zero-copy direct JS binding. No React Native Bridge overhead. Fully synchronous.

---

## Synchronous vs Asynchronous

| Aspect | AsyncStorage | MMKV |
|--------|--------------|------|
| API | `await AsyncStorage.getItem()` | `storage.getString()` |
| Execution | Queued thread pool | Direct memory access |
| Latency | 100-500ms | 1-5ms |
| Boilerplate | async/await chains | Direct calls |
| Race conditions | Possible | Not applicable |

```typescript
// AsyncStorage (async)
async function getUser() {
  const user = await AsyncStorage.getItem('user');
  return user;
}

// MMKV (synchronous)
function getUser() {
  return storage.getString('user');
}
```

---

## Data Types

### Native Types (no serialization)

| Type | Set | Get | Returns |
|------|-----|-----|---------|
| String | `set('k', 'hello')` | `getString('k')` | `string \| undefined` |
| Number | `set('k', 42)` | `getNumber('k')` | `number \| undefined` |
| Boolean | `set('k', true)` | `getBoolean('k')` | `boolean \| undefined` |
| ArrayBuffer | `set('k', buffer)` | `getBuffer('k')` | `ArrayBuffer \| undefined` |

### Complex Types (manual serialization)

```typescript
// Objects
const user = { name: 'John', age: 30 };
storage.set('user', JSON.stringify(user));
const storedUser = JSON.parse(storage.getString('user') ?? '{}');

// Arrays
const items = ['apple', 'banana'];
storage.set('items', JSON.stringify(items));
const storedItems = JSON.parse(storage.getString('items') ?? '[]');
```

Or use the `useMMKVObject<T>()` hook which handles JSON serialization automatically.

---

## When to Use MMKV

### Good Use Cases
- User preferences (theme, language, settings)
- Auth tokens (JWT, refresh tokens) -- with encryption
- UI state (last selected tab, scroll position)
- Session data (temporary user info)
- API response cache (small payloads)
- Feature flags

### Consider Alternatives
- **Large relational datasets** -- use SQLite/WatermelonDB
- **Complex queries** -- use SQLite with SQL
- **Offline-first with sync** -- use WatermelonDB
- **Binary files/images** -- use file system directly

---

## Key Principles

1. **Create once, reuse:** Export singleton instances, do not recreate
2. **Synchronous by default:** Never wrap in async/await
3. **Typed getters:** Always use `getString`/`getNumber`/`getBoolean`, not a generic `get`
4. **Separate instances:** Use different `id` values for different data domains
5. **Clean up listeners:** Remove listeners when components unmount

---

**Version:** 4.x | **Source:** https://github.com/mrousavy/react-native-mmkv
