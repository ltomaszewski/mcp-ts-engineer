# MMKV: Read/Write API

**All set/get methods, key management, and data type handling.**

---

## Write Operations

### set(key, value)

Stores a value. Type is inferred from the value argument.

```typescript
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV({ id: 'app' });

// Strings
storage.set('user.name', 'John Doe');

// Numbers
storage.set('user.age', 30);
storage.set('app.version', 2.5);

// Booleans
storage.set('user.premium', true);
storage.set('notifications.enabled', false);

// ArrayBuffer (binary data)
const buffer = new ArrayBuffer(16);
const view = new Uint8Array(buffer);
view[0] = 42;
storage.set('binary.data', buffer);
```

---

## Read Operations

### Typed Getter Methods

| Method | Returns | For |
|--------|---------|-----|
| `getString(key)` | `string \| undefined` | String values |
| `getNumber(key)` | `number \| undefined` | Number values |
| `getBoolean(key)` | `boolean \| undefined` | Boolean values |
| `getBuffer(key)` | `ArrayBuffer \| undefined` | Binary data |

```typescript
const name = storage.getString('user.name');       // "John Doe" | undefined
const age = storage.getNumber('user.age');          // 30 | undefined
const premium = storage.getBoolean('user.premium'); // true | undefined
const data = storage.getBuffer('binary.data');      // ArrayBuffer | undefined
```

**Always use the correct typed getter.** Using `getString` for a number key returns the string representation, not the number.

---

## Key Management

### contains(key)

```typescript
if (storage.contains('user.name')) {
  console.log('User name exists');
}
```

### getAllKeys()

```typescript
const keys: string[] = storage.getAllKeys();
// ["user.name", "user.age", "user.premium"]
```

### remove(key)

**Note:** In v4, `delete()` was renamed to `remove()`.

```typescript
storage.remove('user.name');
```

### clearAll()

Removes all keys and values from this instance.

```typescript
storage.clearAll();
```

---

## Storage Info

### size

Returns storage size in bytes.

```typescript
const bytes: number = storage.size;
console.log(`Storage size: ${bytes} bytes`);
```

### trim()

Optimizes storage file and clears internal cache.

```typescript
storage.trim();
```

---

## Object and Array Storage

MMKV does not natively store objects/arrays. Use JSON serialization.

### Manual Pattern

```typescript
// Write
const user = { name: 'John', age: 30, roles: ['admin'] };
storage.set('user', JSON.stringify(user));

// Read
const raw = storage.getString('user');
const user = raw ? JSON.parse(raw) as User : undefined;
```

### Type-Safe Wrapper

```typescript
function setObject<T>(key: string, value: T): void {
  storage.set(key, JSON.stringify(value));
}

function getObject<T>(key: string): T | undefined {
  const raw = storage.getString(key);
  return raw ? (JSON.parse(raw) as T) : undefined;
}

// Usage
interface UserPrefs { theme: 'light' | 'dark'; fontSize: number }
setObject<UserPrefs>('prefs', { theme: 'dark', fontSize: 16 });
const prefs = getObject<UserPrefs>('prefs');
```

Or use the `useMMKVObject<T>()` hook which handles this automatically (see [05-api-hooks.md](05-api-hooks.md)).

---

## Import Data Between Instances

```typescript
const source = createMMKV({ id: 'source' });
const target = createMMKV({ id: 'target' });

source.set('key1', 'value1');
source.set('key2', 'value2');

// Copy all data from source to target
target.importAllFrom(source);
```

---

## Best Practices

1. **Use typed getters** -- `getNumber` returns a number, `getString` for a number key returns a string
2. **Check for undefined** -- all getters return `undefined` if key does not exist
3. **Keep values small** -- MMKV is optimized for <1MB per value
4. **Use namespaced keys** -- `user.name`, `cache.apiResponse`, `settings.theme`
5. **Avoid storing derived data** -- compute from source values instead

---

**Version:** 4.x | **Source:** https://github.com/mrousavy/react-native-mmkv
