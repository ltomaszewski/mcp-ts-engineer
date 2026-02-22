# MMKV: Encryption, Listeners & Utilities

**Encryption management, value change listeners, and storage utilities.**

---

## Encryption

### Initial Encryption via Constructor

```typescript
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({
  id: 'secure-storage',
  encryptionKey: 'my-secret-key',
});

// All data is automatically encrypted/decrypted
storage.set('password', 'secret123'); // Stored as encrypted bytes
storage.getString('password');         // Returns "secret123"
```

### Runtime Encryption Management (v4 API)

| Method | Description |
|--------|-------------|
| `recrypt(key)` | Encrypt or re-encrypt all data (key max 16 bytes) |
| `recrypt(undefined)` | Remove encryption from all data |

```typescript
const storage = createMMKV({ id: 'my-data' });

// Encrypt existing unencrypted data
storage.recrypt('hunter2');

// Remove encryption (data becomes plaintext)
storage.recrypt(undefined);
```

### Key Rotation

```typescript
// Re-encrypt with a new key
storage.recrypt('old-key');        // Initially encrypted
storage.recrypt('new-key');        // Re-encrypts with new key
```

### Secure Key Management

Never hardcode encryption keys. Use platform-specific secure storage. Keys must be 16 bytes or fewer.

```typescript
import * as SecureStore from 'expo-secure-store';
import { createMMKV } from 'react-native-mmkv';

async function initSecureStorage() {
  let key = await SecureStore.getItemAsync('mmkv-encryption-key');
  if (!key) {
    key = generateRandomKey(); // Your key generation function (max 16 bytes)
    await SecureStore.setItemAsync('mmkv-encryption-key', key);
  }
  return createMMKV({ id: 'secure', encryptionKey: key });
}
```

---

## Value Change Listeners

### addOnValueChangedListener

Listen for any value change on an MMKV instance.

```typescript
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'app' });

const listener = storage.addOnValueChangedListener((changedKey) => {
  const newValue = storage.getString(changedKey);
  console.log(`"${changedKey}" changed to: ${newValue}`);
});

// Clean up when done
listener.remove();
```

### In React Components

```typescript
import { useEffect } from 'react';
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'app' });

function StorageMonitor() {
  useEffect(() => {
    const listener = storage.addOnValueChangedListener((key) => {
      console.log(`Key changed: ${key}`);
    });
    return () => listener.remove();
  }, []);

  return null;
}
```

### useMMKVListener Hook

Declarative listener hook for React components:

```typescript
import { useMMKVListener } from 'react-native-mmkv';

function ChangeTracker() {
  useMMKVListener((key) => {
    console.log(`Value for "${key}" changed!`);
  });

  return null;
}
```

With a specific instance:

```typescript
useMMKVListener((key) => {
  console.log(`Value for "${key}" changed!`);
}, storage);
```

---

## Storage Utilities

### isReadOnly (read-only)

Returns whether this MMKV instance was created in read-only mode.

```typescript
const storage = createMMKV({ id: 'config', readOnly: true });
console.log(storage.isReadOnly); // true
```

### size

Returns total storage size in bytes.

```typescript
const bytes = storage.size;
console.log(`Storage: ${(bytes / 1024).toFixed(1)} KB`);
```

### trim()

Optimizes storage file size and clears internal cache.

```typescript
storage.trim();
```

### importAllFrom(source): number

Copy all data from another MMKV instance. Returns the count of imported entries. Added in v4.1.0.

```typescript
const oldStorage = createMMKV({ id: 'v1.data' });
const newStorage = createMMKV({ id: 'v2.data' });

const count = newStorage.importAllFrom(oldStorage);
console.log(`Imported ${count} entries`);
```

### existsMMKV(id) / deleteMMKV(id)

Check existence or permanently delete an instance and its file. Both return `boolean`. Added in v4.1.0.

```typescript
import { existsMMKV, deleteMMKV } from 'react-native-mmkv';

const exists: boolean = existsMMKV('temp.cache');
if (exists) {
  const wasDeleted: boolean = deleteMMKV('temp.cache');
  console.log('Deleted:', wasDeleted); // true
}
```

---

## iOS App Groups (Multi-Process)

Share data between your app and extensions (widgets, share extensions):

```typescript
const sharedStorage = createMMKV({
  id: 'group.com.myapp.shared',
  mode: 'multi-process',
  path: '/path/to/app-group/container', // App Group container path
});
```

Update `Info.plist`:
```xml
<key>AppGroupIdentifier</key>
<string>group.com.myapp.shared</string>
```

---

## Complete MMKV Type Interface (v4.1.x)

```typescript
interface MMKV {
  // Instance identifier (read-only, added v4.0.1)
  readonly id: string;
  readonly size: number;
  readonly isReadOnly: boolean;

  // Write
  set(key: string, value: string | number | boolean | ArrayBuffer): void;

  // Read
  getString(key: string): string | undefined;
  getNumber(key: string): number | undefined;
  getBoolean(key: string): boolean | undefined;
  getBuffer(key: string): ArrayBuffer | undefined;

  // Key management
  contains(key: string): boolean;
  getAllKeys(): string[];
  remove(key: string): boolean;  // returns true if key existed
  clearAll(): void;

  // Storage utilities
  trim(): void;
  importAllFrom(source: MMKV): number;  // returns count of imported entries

  // Encryption (key max 16 bytes, undefined to remove)
  recrypt(key: string | undefined): void;

  // Listeners
  addOnValueChangedListener(
    listener: (changedKey: string) => void
  ): { remove: () => void };
}

// Global functions (added v4.1.0)
declare function existsMMKV(id: string): boolean;
declare function deleteMMKV(id: string): boolean;
```

---

**Version:** 4.1.x | **Source:** https://github.com/mrousavy/react-native-mmkv
