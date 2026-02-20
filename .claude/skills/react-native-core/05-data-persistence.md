# React Native 0.83 - Data Persistence & Storage

**AsyncStorage, Secure Storage, and SQLite solutions**

---

## 📊 Storage Options Comparison

| Solution | Use Case | Size | Encryption | Speed | Best For |
|----------|----------|------|-----------|-------|----------|
| **AsyncStorage** | Simple key-value | ~10MB | No | Medium | Preferences, tokens (if not sensitive) |
| **SecureStore** | Sensitive data | ~5MB | Yes (encrypted) | Medium | Auth tokens, passwords, API keys |
| **SQLite** | Complex data | Unlimited | Optional | Fast | Relations, queries, large datasets |

---

## 🔑 AsyncStorage (Simple Key-Value)

### Installation

AsyncStorage is built-in. No additional installation needed.

### Core Methods

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

// Store string value
const storeData = async (key: string, value: string) => {
  try {
    await AsyncStorage.setItem(key, value);
  } catch (e) {
    console.error('Failed to save:', e);
  }
};

// Retrieve value
const getData = async (key: string): Promise<string | null> => {
  try {
    const value = await AsyncStorage.getItem(key);
    return value ?? null;
  } catch (e) {
    console.error('Failed to read:', e);
    return null;
  }
};

// Remove value
const removeData = async (key: string) => {
  try {
    await AsyncStorage.removeItem(key);
  } catch (e) {
    console.error('Failed to remove:', e);
  }
};

// Clear all
const clearAll = async () => {
  try {
    await AsyncStorage.clear();
  } catch (e) {
    console.error('Failed to clear:', e);
  }
};

// Get multiple items
const getMultiple = async (keys: string[]): Promise<[string, string | null][]> => {
  try {
    return await AsyncStorage.multiGet(keys);
  } catch (e) {
    console.error('Failed to get multiple:', e);
    return [];
  }
};

// Set multiple items
const setMultiple = async (items: [string, string][]) => {
  try {
    await AsyncStorage.multiSet(items);
  } catch (e) {
    console.error('Failed to set multiple:', e);
  }
};
```

### Real-World Hook Example

```typescript
import { useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface UseStorageOptions {
  defaultValue?: string;
}

export const useStorage = (
  key: string,
  { defaultValue = '' }: UseStorageOptions = {}
) => {
  const [value, setValue] = useState(defaultValue);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadValue = async () => {
      try {
        const stored = await AsyncStorage.getItem(key);
        if (stored !== null) {
          setValue(stored);
        }
      } finally {
        setLoading(false);
      }
    };
    loadValue();
  }, [key]);

  const updateValue = async (newValue: string) => {
    setValue(newValue);
    try {
      await AsyncStorage.setItem(key, newValue);
    } catch (e) {
      console.error('Failed to update:', e);
    }
  };

  const removeValue = async () => {
    setValue(defaultValue);
    try {
      await AsyncStorage.removeItem(key);
    } catch (e) {
      console.error('Failed to remove:', e);
    }
  };

  return { value, setValue: updateValue, removeValue, loading };
};

// Usage
const MyComponent = () => {
  const { value, setValue } = useStorage('user-preference', { defaultValue: 'light' });

  return (
    <Button
      title={`Theme: ${value}`}
      onPress={() => setValue(value === 'light' ? 'dark' : 'light')}
    />
  );
};
```

### Limitations

⚠️ **Important:**
- ~10MB max (varies by platform)
- No encryption (don't store sensitive data)
- Key-value only (no queries)
- Synchronous operations can block

---

## 🔒 SecureStore (Encrypted Storage)

For sensitive data like authentication tokens.

### Installation

```bash
npm install expo-secure-store
# or
npm install react-native-keychain
```

### Core Methods (expo-secure-store)

```typescript
import * as SecureStore from 'expo-secure-store';

// Store encrypted
const storeToken = async (key: string, value: string) => {
  try {
    await SecureStore.setItemAsync(key, value);
  } catch (e) {
    console.error('Failed to store:', e);
  }
};

// Retrieve encrypted
const getToken = async (key: string): Promise<string | null> => {
  try {
    const value = await SecureStore.getItemAsync(key);
    return value ?? null;
  } catch (e) {
    console.error('Failed to get:', e);
    return null;
  }
};

// Delete
const removeToken = async (key: string) => {
  try {
    await SecureStore.deleteItemAsync(key);
  } catch (e) {
    console.error('Failed to delete:', e);
  }
};
```

### Platform Implementation

**iOS**: Uses Keychain
- Hardware-backed AES encryption
- Device-locked when locked
- Survives app uninstall in iCloud backup

**Android**: Uses EncryptedSharedPreferences
- AES-256-GCM encryption
- Hardware-backed when available
- Standard app storage

### Real-World Auth Token Storage

```typescript
import * as SecureStore from 'expo-secure-store';

const AUTH_TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';

interface StoredAuth {
  accessToken: string;
  refreshToken: string;
}

export const authTokenStorage = {
  save: async (auth: StoredAuth) => {
    try {
      await Promise.all([
        SecureStore.setItemAsync(AUTH_TOKEN_KEY, auth.accessToken),
        SecureStore.setItemAsync(REFRESH_TOKEN_KEY, auth.refreshToken),
      ]);
    } catch (e) {
      console.error('Failed to save auth:', e);
      throw e;
    }
  },

  load: async (): Promise<StoredAuth | null> => {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        SecureStore.getItemAsync(AUTH_TOKEN_KEY),
        SecureStore.getItemAsync(REFRESH_TOKEN_KEY),
      ]);

      if (accessToken && refreshToken) {
        return { accessToken, refreshToken };
      }
      return null;
    } catch (e) {
      console.error('Failed to load auth:', e);
      return null;
    }
  },

  clear: async () => {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(AUTH_TOKEN_KEY),
        SecureStore.deleteItemAsync(REFRESH_TOKEN_KEY),
      ]);
    } catch (e) {
      console.error('Failed to clear auth:', e);
    }
  },
};
```

---

## 🗄️ SQLite (Complex Data)

For structured data with relationships and queries.

### Installation

```bash
npm install expo-sqlite
# or for raw SQLite
npm install react-native-sqlite-storage
```

### Core Methods (expo-sqlite)

```typescript
import * as SQLite from 'expo-sqlite';

// Open/create database
const db = await SQLite.openDatabaseAsync('myapp.db');

// Create table
await db.execAsync(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL
  );
`);

// Insert
const insertUser = async (name: string, email: string) => {
  const result = await db.runAsync(
    'INSERT INTO users (name, email) VALUES (?, ?)',
    [name, email]
  );
  return result.lastInsertRowId;
};

// Query (get one)
const getUser = async (id: number) => {
  const result = await db.getFirstAsync<{
    id: number;
    name: string;
    email: string;
  }>('SELECT * FROM users WHERE id = ?', [id]);
  return result;
};

// Query (get all)
const getAllUsers = async () => {
  const result = await db.getAllAsync<{
    id: number;
    name: string;
    email: string;
  }>('SELECT * FROM users ORDER BY id');
  return result;
};

// Update
const updateUser = async (id: number, name: string) => {
  await db.runAsync(
    'UPDATE users SET name = ? WHERE id = ?',
    [name, id]
  );
};

// Delete
const deleteUser = async (id: number) => {
  await db.runAsync('DELETE FROM users WHERE id = ?', [id]);
};

// Execute multiple statements
await db.execAsync(`
  DELETE FROM users WHERE id > 10;
  INSERT INTO users (name, email) VALUES ('John', 'john@example.com');
`);
```

### Real-World Data Access Pattern

```typescript
import * as SQLite from 'expo-sqlite';
import { useEffect, useState } from 'react';

interface User {
  id: number;
  name: string;
  email: string;
}

class UserRepository {
  private db: SQLite.SQLiteDatabase | null = null;

  async initialize() {
    this.db = await SQLite.openDatabaseAsync('app.db');
    await this.db.execAsync(`
      CREATE TABLE IF NOT EXISTS users (
        id INTEGER PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT UNIQUE NOT NULL
      );
    `);
  }

  async create(name: string, email: string): Promise<User> {
    if (!this.db) throw new Error('Database not initialized');
    const result = await this.db.runAsync(
      'INSERT INTO users (name, email) VALUES (?, ?)',
      [name, email]
    );
    return { id: result.lastInsertRowId as number, name, email };
  }

  async read(id: number): Promise<User | null> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getFirstAsync<User>(
      'SELECT * FROM users WHERE id = ?',
      [id]
    ) ?? null;
  }

  async readAll(): Promise<User[]> {
    if (!this.db) throw new Error('Database not initialized');
    return await this.db.getAllAsync<User>('SELECT * FROM users');
  }

  async update(id: number, name: string): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync(
      'UPDATE users SET name = ? WHERE id = ?',
      [name, id]
    );
  }

  async delete(id: number): Promise<void> {
    if (!this.db) throw new Error('Database not initialized');
    await this.db.runAsync('DELETE FROM users WHERE id = ?', [id]);
  }
}

// Hook for using repository
export const useUserRepository = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [repo] = useState(() => new UserRepository());

  useEffect(() => {
    const initialize = async () => {
      try {
        await repo.initialize();
        const allUsers = await repo.readAll();
        setUsers(allUsers);
      } finally {
        setLoading(false);
      }
    };
    initialize();
  }, []);

  return { users, loading, repo };
};
```

---

## 🎯 Choosing Storage

**Use AsyncStorage when:**
- Storing simple preferences (theme, language)
- Caching non-sensitive data
- Small amounts of data (< 1MB)
- No complex queries needed

**Use SecureStore when:**
- Storing authentication tokens
- Storing passwords or sensitive credentials
- Storing API keys
- Data must survive app uninstall (iOS iCloud)

**Use SQLite when:**
- Storing structured data with relationships
- Need to query (WHERE, JOIN, ORDER BY)
- Large amounts of data (> 1MB)
- Frequently updated data
- Offline-first capabilities

---

## 🔐 Security Best Practices

✅ **DO:**
- Store tokens in SecureStore, never AsyncStorage
- Never hardcode secrets
- Clear sensitive data on logout
- Validate data from storage before use
- Use HTTPS for API calls

❌ **DON'T:**
- Store passwords in AsyncStorage
- Transmit unencrypted sensitive data
- Trust data from AsyncStorage as trusted input
- Forget to clear sensitive data on logout

---

**Source**: https://reactnative.dev/docs/asyncstorage
**Version**: React Native 0.83
**Last Updated**: December 2025
