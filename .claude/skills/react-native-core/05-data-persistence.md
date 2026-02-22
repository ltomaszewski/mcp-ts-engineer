# React Native 0.81.5 -- Data Persistence & Storage

AsyncStorage, SecureStore, and SQLite solutions with comparison and security guidance.

---

## Storage Comparison

| Solution | Use Case | Max Size | Encrypted | Speed | Best For |
|----------|----------|----------|-----------|-------|----------|
| AsyncStorage | Key-value pairs | ~6 MB (varies) | No | Medium | Preferences, caches |
| SecureStore | Sensitive data | ~2 KB per item | Yes | Medium | Tokens, passwords |
| SQLite | Structured data | Unlimited | Optional | Fast | Relations, queries |
| MMKV | High-perf key-value | Unlimited | Optional | Very fast | All non-sensitive storage |

---

## AsyncStorage

Unencrypted, asynchronous, persistent key-value storage. Community-maintained package.

### Installation

```bash
npm install @react-native-async-storage/async-storage
```

### Core Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setItem` | `(key: string, value: string) => Promise<void>` | Store value |
| `getItem` | `(key: string) => Promise<string \| null>` | Retrieve value |
| `removeItem` | `(key: string) => Promise<void>` | Delete value |
| `clear` | `() => Promise<void>` | Remove all keys |
| `getAllKeys` | `() => Promise<readonly string[]>` | List all keys |
| `multiGet` | `(keys: string[]) => Promise<readonly [string, string \| null][]>` | Batch read |
| `multiSet` | `(kvPairs: [string, string][]) => Promise<void>` | Batch write |
| `multiRemove` | `(keys: string[]) => Promise<void>` | Batch delete |
| `mergeItem` | `(key: string, value: string) => Promise<void>` | Merge JSON value |

### Usage

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store a value
async function savePreference(key: string, value: string): Promise<void> {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (error) {
    console.error('Failed to save preference:', error);
  }
}

// Retrieve a value
async function getPreference(key: string): Promise<string | null> {
  try {
    return await AsyncStorage.getItem(key);
  } catch (error) {
    console.error('Failed to read preference:', error);
    return null;
  }
}

// Store JSON object
async function saveObject<T>(key: string, value: T): Promise<void> {
  await AsyncStorage.setItem(key, JSON.stringify(value));
}

// Retrieve JSON object
async function getObject<T>(key: string): Promise<T | null> {
  const json = await AsyncStorage.getItem(key);
  return json ? (JSON.parse(json) as T) : null;
}
```

### Custom Hook

```typescript
import { useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

export function useAsyncStorage(key: string, defaultValue = ''): {
  value: string;
  setValue: (v: string) => Promise<void>;
  loading: boolean;
} {
  const [value, setValueState] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(key).then((stored) => {
      if (stored !== null) setValueState(stored);
      setLoading(false);
    });
  }, [key]);

  const setValue = useCallback(async (newValue: string) => {
    setValueState(newValue);
    await AsyncStorage.setItem(key, newValue);
  }, [key]);

  return { value, setValue, loading };
}
```

### Limitations

- Not encrypted -- never store tokens or passwords
- ~6 MB limit varies by platform
- Key-value only -- no queries or indexing
- Async only -- slight overhead for simple reads

---

## SecureStore (expo-secure-store)

Encrypted storage backed by iOS Keychain and Android EncryptedSharedPreferences.

### Installation

```bash
npx expo install expo-secure-store
```

### Core Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `setItemAsync` | `(key: string, value: string, options?) => Promise<void>` | Store encrypted |
| `getItemAsync` | `(key: string, options?) => Promise<string \| null>` | Retrieve encrypted |
| `deleteItemAsync` | `(key: string, options?) => Promise<void>` | Delete encrypted |
| `isAvailableAsync` | `() => Promise<boolean>` | Check hardware support |

### Options

| Option | Type | Description |
|--------|------|-------------|
| `keychainAccessible` | `SecureStore.AFTER_FIRST_UNLOCK` etc. | iOS: when accessible |
| `keychainService` | `string` | iOS: keychain service name |
| `requireAuthentication` | `boolean` | Require biometric/passcode |

### Platform Backends

| Platform | Backend | Encryption |
|----------|---------|------------|
| iOS | Keychain Services | AES-256, hardware-backed |
| Android | EncryptedSharedPreferences | AES-256-GCM via AndroidX Security |

### Auth Token Storage Pattern

```typescript
import * as SecureStore from 'expo-secure-store';

const TOKEN_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

export const tokenStorage = {
  save: async (tokens: AuthTokens): Promise<void> => {
    await Promise.all([
      SecureStore.setItemAsync(TOKEN_KEY, tokens.accessToken),
      SecureStore.setItemAsync(REFRESH_KEY, tokens.refreshToken),
    ]);
  },

  load: async (): Promise<AuthTokens | null> => {
    const [accessToken, refreshToken] = await Promise.all([
      SecureStore.getItemAsync(TOKEN_KEY),
      SecureStore.getItemAsync(REFRESH_KEY),
    ]);
    if (accessToken && refreshToken) {
      return { accessToken, refreshToken };
    }
    return null;
  },

  clear: async (): Promise<void> => {
    await Promise.all([
      SecureStore.deleteItemAsync(TOKEN_KEY),
      SecureStore.deleteItemAsync(REFRESH_KEY),
    ]);
  },
};
```

---

## SQLite (expo-sqlite)

Relational database for structured data with SQL queries.

### Installation

```bash
npx expo install expo-sqlite
```

### Core API

| Method | Signature | Description |
|--------|-----------|-------------|
| `openDatabaseAsync` | `(name: string) => Promise<SQLiteDatabase>` | Open/create database |
| `db.execAsync` | `(sql: string) => Promise<void>` | Execute raw SQL (no results) |
| `db.runAsync` | `(sql: string, params?) => Promise<SQLiteRunResult>` | Execute with result metadata |
| `db.getFirstAsync` | `(sql: string, params?) => Promise<T \| null>` | Query single row |
| `db.getAllAsync` | `(sql: string, params?) => Promise<T[]>` | Query all rows |
| `db.withTransactionAsync` | `(fn: () => Promise<void>) => Promise<void>` | Transaction wrapper |

### SQLiteRunResult

| Property | Type | Description |
|----------|------|-------------|
| `lastInsertRowId` | `number` | ID of last inserted row |
| `changes` | `number` | Number of rows affected |

### Repository Pattern

```typescript
import * as SQLite from 'expo-sqlite';

interface User {
  id: number;
  name: string;
  email: string;
}

class UserRepository {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize(): Promise<void> {
    this.db = await SQLite.openDatabaseAsync('app.db');
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL,
        created_at TEXT DEFAULT (datetime('now'))
      );
    `);
  }

  async create(name: string, email: string): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email],
    );
    return { id: result.lastInsertRowId, name, email };
  }

  async findById(id: number): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getFirstAsync<User>('SELECT * FROM users WHERE id = ?', [id]);
  }

  async findAll(): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');
    return this.db.getAllAsync<User>('SELECT * FROM users ORDER BY id');
  }

  async update(id: number, name: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('UPDATE users SET name = ? WHERE id = ?', [name, id]);
  }

  async delete(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM users WHERE id = ?', [id]);
  }

  async withTransaction(fn: () => Promise<void>): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.withTransactionAsync(fn);
  }
}
```

---

## Choosing the Right Storage

```
Need to store data?
├── Is it sensitive (tokens, passwords)?
│   └── YES → SecureStore (expo-secure-store)
├── Is it structured with relationships?
│   └── YES → SQLite (expo-sqlite)
├── Need high-performance key-value?
│   └── YES → MMKV (react-native-mmkv)
└── Simple preferences/cache?
    └── YES → AsyncStorage
```

---

## Security Rules

**DO:**
- Store auth tokens in SecureStore, never AsyncStorage
- Clear sensitive data on logout
- Validate data read from storage before using
- Use parameterized queries with SQLite (prevent SQL injection)
- Encrypt SQLite databases if storing sensitive records

**DO NOT:**
- Store passwords or API keys in AsyncStorage
- Trust data from AsyncStorage as validated input
- Use string concatenation in SQL queries
- Forget to handle storage errors (device may be full)

---

**Version:** React Native 0.81.5
**Source:** https://reactnative.dev/docs/asyncstorage | https://docs.expo.dev/versions/latest/sdk/secure-store/ | https://docs.expo.dev/versions/latest/sdk/sqlite/
