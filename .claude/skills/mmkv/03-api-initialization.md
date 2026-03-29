# MMKV: Initialization & Configuration

**createMMKV options, multiple instances, and initialization patterns.**

---

## createMMKV()

Factory function to create an MMKV storage instance (v4 API).

### Constructor Options

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `id` | `string` | `'mmkv.default'` | Unique identifier for the storage file |
| `encryptionKey` | `string` | `undefined` | AES encryption key for data at rest (max 16 bytes) |
| `path` | `string` | Platform default | Custom root directory for storage files |
| `mode` | `'single-process' \| 'multi-process'` | `'single-process'` | Multi-process sync for app groups/extensions |
| `encryptionType` | `'AES-128' \| 'AES-256'` | `'AES-128'` | Encryption algorithm (v4.2.0+) |
| `readOnly` | `boolean` | `false` | Prevent write operations |
| `compareBeforeSet` | `boolean` | `false` | Compare values before persisting; skip disk write if unchanged (v4.3.0+) |

### Default Paths

- **iOS:** `$(Documents)/mmkv/`
- **Android:** `$(getFilesDir())/mmkv/`

### Basic Usage

```typescript
import { createMMKV } from 'react-native-mmkv';

// Default instance
const storage = createMMKV();

// Named instance
const storage = createMMKV({ id: 'app.storage' });

// Encrypted instance
const storage = createMMKV({
  id: 'secure.storage',
  encryptionKey: 'my-secret-key',
});

// Multi-process (for iOS App Groups / Android shared containers)
const storage = createMMKV({
  id: 'shared.storage',
  mode: 'multi-process',
});

// Read-only
const storage = createMMKV({
  id: 'config.storage',
  readOnly: true,
});

// AES-256 encryption (v4.2.0+)
const storage = createMMKV({
  id: 'high-security',
  encryptionKey: 'my-secret-key',
  encryptionType: 'AES-256',
});

// Compare before set -- skip redundant writes (v4.3.0+)
const storage = createMMKV({
  id: 'frequent-writes',
  compareBeforeSet: true,
});
```

---

## Multiple Instances

Each instance maps to a separate file on disk. Use different `id` values to separate concerns.

```typescript
// storage.ts
import { createMMKV } from 'react-native-mmkv';

export const appStorage = createMMKV({ id: 'app.config' });
export const authStorage = createMMKV({
  id: 'auth.tokens',
  encryptionKey: keyFromSecureStore,
});
export const cacheStorage = createMMKV({ id: 'cache.api' });

// Usage
appStorage.set('theme', 'dark');
authStorage.set('accessToken', jwt);
cacheStorage.set('users', JSON.stringify(users));

// Clear only auth data on logout
authStorage.clearAll();
```

### Per-User Instances

```typescript
function createUserStorage(userId: string) {
  return createMMKV({
    id: `user.${userId}`,
    encryptionKey: `key-for-${userId}`,
  });
}

const user1Storage = createUserStorage('abc123');
const user2Storage = createUserStorage('def456');
```

---

## Initialization Patterns

### Singleton Export (Recommended)

```typescript
// storage.ts
import { createMMKV } from 'react-native-mmkv';

export const storage = createMMKV({ id: 'app.default' });
```

```typescript
// anywhere.ts
import { storage } from './storage';
storage.set('key', 'value');
```

### Factory Function

```typescript
import { createMMKV, type MMKV } from 'react-native-mmkv';

interface StorageConfig {
  namespace: string;
  encrypted?: boolean;
}

export function createStorage(config: StorageConfig): MMKV {
  return createMMKV({
    id: config.namespace,
    encryptionKey: config.encrypted ? `${config.namespace}-secret` : undefined,
  });
}
```

### Lazy Initialization

```typescript
import { createMMKV, type MMKV } from 'react-native-mmkv';

let instance: MMKV | null = null;

export function getStorage(): MMKV {
  if (!instance) {
    instance = createMMKV({ id: 'app.lazy' });
  }
  return instance;
}
```

---

## Instance Properties

### id (read-only)

Returns the identifier string for this MMKV instance. Added in v4.0.1.

```typescript
const storage = createMMKV({ id: 'app.config' });
console.log(storage.id); // "app.config"

const defaultStorage = createMMKV();
console.log(defaultStorage.id); // "mmkv.default"
```

### isReadOnly (read-only)

Returns whether this instance was created with `readOnly: true`.

```typescript
const readOnlyStorage = createMMKV({ id: 'config', readOnly: true });
console.log(readOnlyStorage.isReadOnly); // true
```

---

## Global Utilities

Functions added in v4.1.0 for managing MMKV instances at the file level.

| Function | Returns | Description |
|----------|---------|-------------|
| `existsMMKV(id)` | `boolean` | Check if an MMKV instance file exists on disk |
| `deleteMMKV(id)` | `boolean` | Permanently delete an MMKV instance and its data file |

```typescript
import { existsMMKV, deleteMMKV } from 'react-native-mmkv';

if (existsMMKV('user.old-data')) {
  const wasDeleted = deleteMMKV('user.old-data');
  console.log('Deleted:', wasDeleted); // true
}
```

---

## Common Mistakes

### Same ID, multiple instances

```typescript
// Bad: both point to the same file
const a = createMMKV({ id: 'app' });
const b = createMMKV({ id: 'app' });
// Changes in one affect the other
```

Export and reuse a single instance instead.

### Hardcoded encryption key

```typescript
// Bad
const s = createMMKV({ encryptionKey: 'hardcoded-secret' });

// Good: key from secure storage
import * as SecureStore from 'expo-secure-store';
const key = await SecureStore.getItemAsync('mmkv-key');
const s = createMMKV({ encryptionKey: key ?? undefined });
```

---

**Version:** 4.3.0 | **Source:** https://github.com/mrousavy/react-native-mmkv
