# API Initialization & Configuration

**Complete guide to creating and configuring MMKV instances with all parameters, options, and patterns.**

---

## Overview

MMKV instances are the primary interface for storing and retrieving data. Each instance represents a separate key-value store that can be independently configured with encryption, custom paths, and multiple-access modes.

**Source**: https://github.com/mrousavy/react-native-mmkv

---

## Creating an Instance

### Basic Initialization

```typescript
import { createMMKV } from 'react-native-mmkv'

// Simplest possible instance
const storage = createMMKV()
```

This creates a default instance with:
- ID: `'default'`
- Path: Platform-specific default
- No encryption
- Multi-process safe

### With Configuration

```typescript
const storage = createMMKV({
  id: 'app.storage',
  encryptionKey: 'my-secret-encryption-key',
  path: '/custom/path' // Optional
})
```

---

## Configuration Parameters

### `id` (String)

**Purpose**: Unique identifier for the storage instance

**Default**: `'default'`

```typescript
// ✅ Good: Descriptive IDs
const appStorage = createMMKV({ id: 'app.global' })
const userStorage = createMMKV({ id: `user.${userId}` })
const cacheStorage = createMMKV({ id: 'cache.api' })
```

**Naming Convention**:
```typescript
// Pattern: [namespace].[concern]
const storage = createMMKV({
  id: 'app.preferences'      // app settings
  id: 'auth.tokens'          // authentication
  id: 'cache.api-responses'  // cached data
  id: 'user.profile'         // user-specific
})
```

### `encryptionKey` (String, Optional)

**Purpose**: Encryption key for data at rest

**Default**: `undefined` (no encryption)

```typescript
// Without encryption (data stored in plain text)
const storage = createMMKV({ id: 'app.public' })

// With encryption
const storage = createMMKV({
  id: 'app.secure',
  encryptionKey: 'my-encryption-key-min-16-chars'
})

// All data automatically encrypted/decrypted
storage.set('password', 'secret123')
// File contains encrypted bytes, not "secret123"
```

**Key Management**:
```typescript
import * as Crypto from 'expo-crypto'
import * as SecureStore from 'expo-secure-store'

// Generate random key
const generateKey = async (): Promise<string> => {
  return await Crypto.digestStringAsync(
    Crypto.CryptoDigestAlgorithm.SHA256,
    `${Date.now()}-${Math.random()}`
  )
}

// Store key securely
const storeKey = async (key: string): Promise<void> => {
  await SecureStore.setItemAsync('mmkv-key', key)
}

// Retrieve key
const retrieveKey = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync('mmkv-key')
}

// Usage
const key = await retrieveKey() || await generateKey()
await storeKey(key)

const storage = createMMKV({
  id: 'app.secure',
  encryptionKey: key
})
```

### `path` (String, Optional)

**Purpose**: Custom storage location

**Default**: Platform-specific:
- **iOS**: `$(Documents)/mmkv/`
- **Android**: `$(getFilesDir())/mmkv/`

```typescript
// Use default path
const storage = createMMKV()

// Use custom path (iOS example)
const storage = createMMKV({
  id: 'app.custom',
  path: '/custom/directory/path'
})
```

### `mode` (String, Optional)

**Purpose**: Multi-process synchronization mode

**Values**: `'multi-process'` | `'single-process'` (default)

```typescript
// Single process (default)
const storage = createMMKV({
  id: 'app.storage'
  // mode: 'single-process' (default)
})

// Multi-process (for shared containers, App Groups)
const storage = createMMKV({
  id: 'app.shared',
  mode: 'multi-process'
  // Synchronizes between app and extensions
})
```

### `readOnly` (Boolean, Optional)

**Purpose**: Prevent write operations

**Default**: `false`

```typescript
// Writable (default)
const storage = createMMKV({ id: 'app.storage' })

// Read-only
const storage = createMMKV({
  id: 'app.config',
  readOnly: true
})

storage.set('key', 'value') // ❌ Throws error
const value = storage.getString('key') // ✅ OK
```

---

## Complete Configuration Example

```typescript
interface MMKVConfig {
  id: string
  encryptionKey?: string
  path?: string
  mode?: 'multi-process' | 'single-process'
  readOnly?: boolean
}

const storage = createMMKV({
  id: 'app.production',
  encryptionKey: process.env.MMKV_KEY,
  path: `${USER_DIRECTORY}/app-data`,
  mode: 'multi-process',
  readOnly: false
} as MMKVConfig)
```

---

## Multiple Independent Instances

### Separate Concerns

```typescript
// Each instance has its own file
export const appStorage = createMMKV({ id: 'app.config' })
export const authStorage = createMMKV({ id: 'auth.tokens' })
export const cacheStorage = createMMKV({ id: 'cache.api' })

// Usage
appStorage.set('theme', 'dark')
authStorage.set('accessToken', jwt)
cacheStorage.set('users', JSON.stringify(users))
```

### Advantages

```typescript
// ✅ Separation of concerns
// ✅ Easier to clear specific data
// ✅ Different encryption per instance
// ✅ Better organization

// ✅ Clear data organization
authStorage.clearAll() // Only clears auth tokens
appStorage.getAllKeys() // Only app config keys
```

### Instance Per User

```typescript
// Switch user
const createUserStorage = (userId: string) => {
  return createMMKV({
    id: `user.${userId}`,
    encryptionKey: `key-${userId}` // Unique key per user
  })
}

// Usage
const user1Storage = createUserStorage('user-123')
const user2Storage = createUserStorage('user-456')

user1Storage.set('preferences', '...')
user2Storage.set('preferences', '...') // Different file
```

---

## Storage Initialization Patterns

### Pattern 1: Singleton Export

```typescript
// storage.ts
import { createMMKV } from 'react-native-mmkv'

export const storage = createMMKV({
  id: 'app.default',
  encryptionKey: 'your-encryption-key'
})

// Usage everywhere
import { storage } from './storage'

storage.set('key', 'value')
const value = storage.getString('key')
```

### Pattern 2: Lazy Initialization

```typescript
// storage.ts
import { createMMKV, MMKV } from 'react-native-mmkv'

let storageInstance: MMKV | null = null

export const getStorage = (): MMKV => {
  if (!storageInstance) {
    storageInstance = createMMKV({
      id: 'app.lazy'
    })
  }
  return storageInstance
}

// Usage
import { getStorage } from './storage'

const storage = getStorage()
storage.set('key', 'value')
```

### Pattern 3: Factory Function

```typescript
// storageFactory.ts
import { createMMKV, MMKV } from 'react-native-mmkv'
import { Platform } from 'react-native'

interface StorageConfig {
  namespace: string
  encrypted?: boolean
  readOnly?: boolean
}

export const createStorage = (config: StorageConfig): MMKV => {
  const encryptionKey = config.encrypted
    ? `${config.namespace}-secret-key`
    : undefined

  return createMMKV({
    id: config.namespace,
    encryptionKey,
    readOnly: config.readOnly,
    path: Platform.select({
      ios: `/documents/${config.namespace}`,
      android: `/files/${config.namespace}`,
      default: undefined
    })
  })
}

// Usage
const appStorage = createStorage({
  namespace: 'app',
  encrypted: false
})

const authStorage = createStorage({
  namespace: 'auth',
  encrypted: true
})
```

### Pattern 4: Context-Based (React)

```typescript
// StorageContext.tsx
import React, { createContext, useContext } from 'react'
import { createMMKV, MMKV } from 'react-native-mmkv'

const appStorage = createMMKV({ id: 'app.context' })

const StorageContext = createContext<MMKV>(appStorage)

export const StorageProvider: React.FC<{ children: React.ReactNode }> = ({
  children
}) => (
  <StorageContext.Provider value={appStorage}>
    {children}
  </StorageContext.Provider>
)

export const useStorage = (): MMKV => {
  return useContext(StorageContext)
}

// Usage in component
import { useStorage } from './StorageContext'

export function MyComponent() {
  const storage = useStorage()

  return (
    <Button
      onPress={() => storage.set('key', 'value')}
      title="Save"
    />
  )
}
```

---

## Environment-Specific Configuration

### Development

```typescript
const storage = createMMKV({
  id: 'dev.storage',
  // No encryption for easier debugging
  path: `${TEMP_DIR}/mmkv-dev`
})
```

### Staging

```typescript
const storage = createMMKV({
  id: 'staging.storage',
  encryptionKey: process.env.STAGING_ENCRYPTION_KEY,
  path: `${DOC_DIR}/mmkv-staging`
})
```

### Production

```typescript
const storage = createMMKV({
  id: 'prod.storage',
  encryptionKey: process.env.PROD_ENCRYPTION_KEY,
  path: undefined, // Use default secure path
  readOnly: false // Allow writes
})
```

---

## TypeScript Types

```typescript
interface MMKV {
  // Write operations
  set(key: string, value: string): void
  setNumber(key: string, value: number): void
  setBoolean(key: string, value: boolean): void
  setBuffer(key: string, value: ArrayBuffer): void

  // Read operations
  getString(key: string): string | undefined
  getNumber(key: string): number | undefined
  getBoolean(key: string): boolean | undefined
  getBuffer(key: string): ArrayBuffer | undefined

  // Key management
  getAllKeys(): string[]
  getSize(): number
  delete(key: string): void
  clearAll(): void

  // Listeners
  addOnValueChangedListener(listener: ValueChangedListener): Unsubscribe
  addOnMMKVWriteListener(listener: MMKVWriteListener): Unsubscribe

  // Encryption
  recrypt(encryptionKey?: string): void
}
```

---

## Common Mistakes

### ❌ Mistake 1: Creating Multiple Instances with Same ID

```typescript
// ❌ Bad: Different instances, same file
const storage1 = createMMKV({ id: 'app' })
const storage2 = createMMKV({ id: 'app' })

storage1.set('key', 'value-1')
storage2.set('key', 'value-2')
// Both instances share the same underlying file!
```

### ✅ Solution: Reuse Instances

```typescript
// ✅ Good: Single instance, exported and reused
export const storage = createMMKV({ id: 'app' })

// Import and use everywhere
import { storage } from './storage'
```

### ❌ Mistake 2: Missing Encryption Key

```typescript
// ❌ Bad: Encryption key hardcoded
const storage = createMMKV({
  encryptionKey: 'hardcoded-secret'
})
```

### ✅ Solution: Use Secure Storage

```typescript
// ✅ Good: Key from secure storage
import * as SecureStore from 'expo-secure-store'

const key = await SecureStore.getItemAsync('mmkv-key')
const storage = createMMKV({
  encryptionKey: key
})
```

### ❌ Mistake 3: Not Handling Initialization Errors

```typescript
// ❌ Bad: No error handling
const storage = createMMKV({ id: 'app' })
```

### ✅ Solution: Add Error Handling

```typescript
// ✅ Good: Error handling
try {
  const storage = createMMKV({ id: 'app' })
  // Initialize successful
} catch (error) {
  console.error('Failed to initialize MMKV:', error)
  // Fallback storage mechanism
}
```

---

## Next Steps

→ **api-read-write.md** — Store and retrieve data  
→ **api-hooks.md** — Bind to React components  
→ **best-practices-performance.md** — Architecture patterns  

---

## Quick Reference

| Parameter | Type | Default | Example |
|-----------|------|---------|---------|
| `id` | string | `'default'` | `'app.storage'` |
| `encryptionKey` | string | `undefined` | `'my-secret-key'` |
| `path` | string | Platform default | `'/custom/path'` |
| `mode` | string | `'single-process'` | `'multi-process'` |
| `readOnly` | boolean | `false` | `true` |

---

**Source**: https://github.com/mrousavy/react-native-mmkv  
**Last Updated**: December 2025

