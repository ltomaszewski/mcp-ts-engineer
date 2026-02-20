# Core Concepts

**Understanding MMKV architecture, design principles, and why it exists as a React Native storage solution.**

---

## Overview

react-native-mmkv is a JavaScript binding to the MMKV mobile key-value storage framework, originally developed by WeChat. It replaces traditional async storage systems with a high-performance, synchronous C++ native implementation. Understanding MMKV's architecture is essential for using it effectively.

**Source**: https://github.com/mrousavy/react-native-mmkv

---

## What is MMKV?

### Definition

**MMKV** (Memory Mapped Key-Value) is an efficient mobile key-value storage framework developed by Tencent (WeChat). It uses:
- **Memory mapping** — Direct memory access to file-based storage
- **Protocol buffers** — Compact binary serialization
- **C++** — Native performance implementation

### Why MMKV for React Native?

React Native originally used **AsyncStorage**, which has limitations:

| Aspect | AsyncStorage | MMKV |
|--------|--------------|------|
| **Execution** | Asynchronous (promises, async/await) | Synchronous (direct calls) |
| **Performance** | Slower (queued thread pool) | ~30x faster |
| **Encryption** | No built-in support | Native encryption |
| **Data Types** | Strings only (JSON serialization) | Native: strings, numbers, booleans, buffers |
| **Thread Safety** | Complex (async operations) | Atomic operations |
| **Library Size** | Lightweight | ~200KB |

---

## Technical Architecture

### The Stack

```
┌──────────────────────────────────┐
│  JavaScript/TypeScript Layer     │
│  (React Native App Code)         │
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│  JavaScript Bindings (JSI/Nitro) │
│  Direct native method invocation │
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│  React Native C++ Bridge         │
│  (No React Native Bridge overhead)
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│  MMKV C++ Native Library         │
│  Memory-mapped file I/O          │
└──────────────┬───────────────────┘
               │
┌──────────────▼───────────────────┐
│  File System / Encrypted Storage │
│  iOS Keychain / Android Storage  │
└──────────────────────────────────┘
```

### JSI vs. Nitro Modules

**V4+ uses Nitro modules** (modern approach):
- **Nitro Modules** — Compiled C++ native modules with zero-copy direct JS binding
- **No React Native Bridge** — Eliminates serialization overhead
- **Fully synchronous** — Direct memory access

**V3 used JSI**:
- JSI (JavaScript Interface) provided direct C++ bindings
- Still required custom bridge setup
- V4 improves this with Nitro standardization

---

## Execution Model: Synchronous vs. Asynchronous

### AsyncStorage (Traditional)

```typescript
// Asynchronous pattern
async function getUser() {
  const user = await AsyncStorage.getItem('user')
  // Must wait for I/O
  console.log(user)
}
```

**Problems**:
- Slow I/O waiting
- Complex async/await chains
- Race conditions possible
- Waterfall effect in component rendering

### MMKV (Synchronous)

```typescript
// Synchronous pattern
function getUser() {
  const user = storage.getString('user')
  // Instant retrieval (memory-mapped)
  console.log(user) // No await needed
}
```

**Advantages**:
- Instant access (no I/O wait)
- No async/await boilerplate
- Predictable execution order
- No promise chains

### Why Synchronous is Safe

Memory-mapped I/O is safe for mobile storage because:
1. **File-backed** — Data persists, not just in memory
2. **Atomic operations** — Individual operations are thread-safe
3. **Low latency** — Millisecond-level access (vs. AsyncStorage: 100-500ms)
4. **No blocking** — Reads are nearly instant due to OS file caching

---

## Data Storage Mechanism

### Memory-Mapped File I/O

```
┌─────────────────────────────────┐
│  MMKV Storage File              │
│  (mmkv.default on disk)         │
└─────────────────────────────────┘
        │
        │ Memory-mapped
        ▼
┌─────────────────────────────────┐
│  Process Memory Space           │
│  (Direct memory access)         │
└─────────────────────────────────┘
        │
        │ Native C++ methods
        ▼
┌─────────────────────────────────┐
│  React Native JavaScript        │
│  (Instant results)              │
└─────────────────────────────────┘
```

**Key Difference**:
- **AsyncStorage**: Read disk → deserialize JSON → return (100-500ms)
- **MMKV**: Access memory-mapped file → return (1-5ms)

---

## Data Types Supported

### Native Types (No Serialization Needed)

```typescript
// Strings
storage.set('name', 'John')
storage.getString('name') // 'John'

// Numbers
storage.set('count', 42)
storage.getNumber('count') // 42

// Booleans
storage.set('isLoggedIn', true)
storage.getBoolean('isLoggedIn') // true

// ArrayBuffers (binary data)
const buffer = new ArrayBuffer(3)
storage.set('data', buffer)
storage.getBuffer('data') // ArrayBuffer
```

### Complex Types (Serialization Required)

```typescript
// Objects - must serialize manually
const user = { name: 'John', age: 30 }
storage.set('user', JSON.stringify(user))
const storedUser = JSON.parse(storage.getString('user'))

// Arrays - same approach
const items = ['apple', 'banana']
storage.set('items', JSON.stringify(items))
const storedItems = JSON.parse(storage.getString('items'))
```

---

## Key Characteristics

### 1. Fully Synchronous

```typescript
// No async/await required
storage.set('token', jwt)
const token = storage.getString('token') // Available immediately
```

### 2. Encryption Support

```typescript
// Built-in encryption
const storage = createMMKV({
  encryptionKey: 'my-secret-key'
})
// All data automatically encrypted/decrypted
storage.set('password', 'secret123')
```

### 3. Multiple Instances

```typescript
// Separate storage for different concerns
const appStorage = createMMKV({ id: 'app.global' })
const userStorage = createMMKV({ id: `user.${userId}` })

appStorage.set('theme', 'dark')
userStorage.set('preferences', 'settings...')
```

### 4. High Performance

```
Performance Benchmark (1000 reads, iPhone 11 Pro):
─────────────────────────────────────────────────
MMKV:            ~40ms ⚡
AsyncStorage:  ~1000ms 🐢
SQLite:        ~150ms
```

### 5. Thread Safety

MMKV handles thread safety automatically:
- Atomic operations on individual keys
- Safe for multi-threaded access
- No need for manual locking

---

## Limitations & Trade-offs

### 1. No Remote Debugging

```typescript
// ❌ Chrome DevTools NOT supported
// Use Flipper or React DevTools instead
```

**Reason**: Synchronous native calls cannot be bridged to remote debuggers

### 2. Requires New Architecture

```typescript
// V4+ requires:
// - React Native 0.74+
// - New Architecture enabled (TurboModules/Fabric)
```

### 3. Storage Size Consideration

```typescript
// For very large datasets:
// - Keep individual values reasonable
// - Use separate instances per concern
// - Consider SQLite for massive data
```

### 4. Initial Setup Required

```typescript
// Unlike AsyncStorage (automatic), MMKV requires explicit:
// - Package installation
// - Native dependency linking
// - Encryption key management (if using encryption)
```

---

## Comparison Matrix

| Feature | MMKV | AsyncStorage | SQLite |
|---------|------|--------------|--------|
| **Speed** | ⚡⚡⚡ (30x faster) | ⚡ (baseline) | ⚡⚡ (complex queries) |
| **Sync API** | ✅ Yes | ❌ No | ❌ No (Async) |
| **Encryption** | ✅ Native | ❌ No | ❌ No |
| **Setup** | Medium | Easy | Hard |
| **Type Support** | Good | Strings only | Excellent |
| **Multi-instance** | ✅ Yes | ❌ Single | ✅ Yes |
| **Query Language** | No | No | ✅ Yes (SQL) |
| **Best For** | General storage | Legacy code | Relational data |

---

## When to Use MMKV

### ✅ Good Use Cases

- **User preferences** (theme, language, settings)
- **Auth tokens** (JWT, refresh tokens)
- **UI state** (last selected tab, scroll position)
- **Session data** (temporary user info)
- **User data** (profile, preferences, metadata)
- **Cache** (API responses, computed values)

### ⚠️ Consider Alternatives For

- **Large relational datasets** → Use SQLite
- **Complex queries** → Use SQLite + query language
- **Synchronous debugging** → Add logging layer
- **Offline-first apps with sync** → Use WatermelonDB or similar

---

## Key Principles

### 1. Instance Reuse

```typescript
// ✅ Good: Create once, export, reuse
export const storage = createMMKV({ id: 'app.default' })

// ❌ Bad: Creating new instances repeatedly
for (let i = 0; i < 100; i++) {
  const s = createMMKV() // Don't do this
}
```

### 2. Synchronous by Default

```typescript
// ✅ Good: Use synchronous calls
const value = storage.getString('key')

// ❌ Avoid: Wrapping in promises unnecessarily
const value = await Promise.resolve(storage.getString('key'))
```

### 3. Proper Encryption Key Management

```typescript
// ✅ Good: Use environment variables or secure storage
const key = process.env.MMKV_ENCRYPTION_KEY

// ❌ Bad: Hardcoding keys
const key = 'hardcoded-secret'
```

### 4. Listener Cleanup

```typescript
// ✅ Good: Remove listeners when done
const listener = storage.addOnValueChangedListener((key) => {
  // Handle change
})
// Later...
listener.remove()

// ❌ Bad: Leaving listeners registered (memory leaks)
```

---

## Next Steps

→ **setup-installation.md** — Install MMKV  
→ **api-initialization.md** — Create and configure instances  
→ **api-read-write.md** — Perform read/write operations  

---

## Summary

| Key Point | Detail |
|-----------|--------|
| **Speed** | ~30x faster than AsyncStorage via memory-mapped I/O |
| **Model** | Fully synchronous, no async/await required |
| **Architecture** | C++ native with JSI/Nitro, no React Native Bridge overhead |
| **Types** | Native: strings, numbers, booleans, buffers |
| **Encryption** | Built-in, optional key-based encryption |
| **Instances** | Multiple instances for different data concerns |
| **Limitations** | No remote debugging, requires new architecture, not for huge datasets |

---

**Source**: https://github.com/mrousavy/react-native-mmkv  
**Official Upstream**: https://github.com/Tencent/MMKV  
**Last Updated**: December 2025

