# 04 — API Reference: Data Storage & Persistence

**Module Summary**: Complete reference for data persistence options: AsyncStorage for simple key-value, Firebase JS SDK for Firestore/Realtime Database, and React Native Firebase for native performance. Includes comparison, setup, and production patterns.

---

## Overview

Expo supports three data persistence approaches:

1. **AsyncStorage** — Simple key-value store, recommended for < 10MB data
2. **Firebase JS SDK** — Firestore, Realtime Database, Storage (web-compatible)
3. **React Native Firebase** — Native bindings for maximum performance and features

Choose based on your needs:

| Feature | AsyncStorage | Firebase JS SDK | React Native Firebase |
|---------|--------------|-----------------|----------------------|
| **Data Type** | Key-value strings | Firestore / Realtime DB / Storage | Any Firebase service |
| **Use Case** | Settings, tokens, simple data | Cross-platform, web compatibility | Performance-critical, all features |
| **Expo Go** | ✅ Yes | ✅ Yes | ⚠️ Prebuild required |
| **Offline Support** | ✅ Local only | ✅ Offline persistence | ✅ Offline persistence |
| **Realtime Sync** | ❌ No | ✅ Yes | ✅ Yes |
| **File Storage** | ❌ No | ✅ Cloud Storage | ✅ Cloud Storage |
| **When to Use** | Settings, tokens, cache | Universal apps, startups | Production apps, native features |

**Source**: https://docs.expo.dev/guides/using-firebase/

---

## AsyncStorage

### Installation

```bash
npx expo install @react-native-async-storage/async-storage
```

### Core API

#### Method: `getItem(key: string, callback?: ErrorCallback)`

**Description**: Retrieve a stored value by key.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | ✅ | Storage key |
| `callback` | (error?: Error, result?: string) => void | ❌ | Legacy callback (use Promise) |

**Return Type**: `Promise<string | null>` — Stored value or null if not found

**Code Example**:

```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';

const authToken = await AsyncStorage.getItem('authToken');
if (authToken) {
  console.log('Token:', authToken);
} else {
  console.log('No token stored');
}

// Parse JSON
const userJson = await AsyncStorage.getItem('user');
const user = userJson ? JSON.parse(userJson) : null;
```

---

#### Method: `setItem(key: string, value: string, callback?: ErrorCallback)`

**Description**: Store or update a value.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | ✅ | Storage key |
| `value` | string | ✅ | Value to store (must be string; JSON.stringify objects) |
| `callback` | (error?: Error) => void | ❌ | Legacy callback (use Promise) |

**Return Type**: `Promise<void>`

**Code Example**:

```typescript
// Store string
await AsyncStorage.setItem('theme', 'dark');

// Store JSON object
const user = { id: 1, name: 'John', email: 'john@example.com' };
await AsyncStorage.setItem('user', JSON.stringify(user));

// Store array
const favorites = ['item1', 'item2', 'item3'];
await AsyncStorage.setItem('favorites', JSON.stringify(favorites));
```

---

#### Method: `removeItem(key: string, callback?: ErrorCallback)`

**Description**: Delete a stored key-value pair.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `key` | string | ✅ | Key to delete |
| `callback` | (error?: Error) => void | ❌ | Legacy callback |

**Return Type**: `Promise<void>`

**Code Example**:

```typescript
await AsyncStorage.removeItem('authToken');
```

---

#### Method: `getAllKeys(callback?: ErrorCallback)`

**Description**: Get all stored keys.

**Return Type**: `Promise<string[]>`

**Code Example**:

```typescript
const keys = await AsyncStorage.getAllKeys();
console.log('Stored keys:', keys);
// → ['authToken', 'user', 'theme', 'favorites']
```

---

#### Method: `multiGet(keys: string[], callback?: ErrorCallback)`

**Description**: Retrieve multiple values in one call (more efficient).

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keys` | string[] | ✅ | Keys to retrieve |
| `callback` | (errors?: Error[], result?: [string, string][]) => void | ❌ | Legacy callback |

**Return Type**: `Promise<[string, string][]>` — Array of [key, value] tuples

**Code Example**:

```typescript
const [authToken, theme, user] = await AsyncStorage.multiGet([
  'authToken',
  'theme',
  'user',
]);

// Returns: [
//   ['authToken', 'token123'],
//   ['theme', 'dark'],
//   ['user', '{"id":1,"name":"John"}'],
// ]
```

---

#### Method: `multiSet(keyValuePairs: [string, string][], callback?: ErrorCallback)`

**Description**: Store multiple values in one call.

**Parameters**:

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `keyValuePairs` | [string, string][] | ✅ | Array of [key, value] tuples |
| `callback` | (errors?: Error[]) => void | ❌ | Legacy callback |

**Return Type**: `Promise<void>`

**Code Example**:

```typescript
await AsyncStorage.multiSet([
  ['authToken', 'token123'],
  ['theme', 'dark'],
  ['user', JSON.stringify({ id: 1, name: 'John' })],
]);
```

---

#### Method: `clear(callback?: ErrorCallback)`

**Description**: Delete all stored data (use with caution).

**Return Type**: `Promise<void>`

**Code Example**:

```typescript
// Clear all storage (e.g., on logout)
await AsyncStorage.clear();
```

---

### AsyncStorage Best Practices

### ✅ Do's

- **Stringify objects** — AsyncStorage only stores strings
- **Use `multiGet`/`multiSet`** — More efficient than individual calls
- **Store non-sensitive data** — Not cryptographically secure
- **Cache frequently accessed data** — Reduce reads from disk
- **Use try-catch** — Handle storage errors gracefully
- **Version your storage schema** — For migrations when changing structure

### ❌ Don'ts

- **Don't store sensitive tokens** — Use `expo-secure-store` instead
- **Don't store large files** — AsyncStorage is for small data (< 10MB)
- **Don't block UI during storage** — Run off main thread with `useAsyncStorage`
- **Don't assume keys exist** — Always check for `null`

### Custom Hook: `useAsyncStorage`

```typescript
import { useAsyncStorage } from '@react-native-async-storage/async-storage';

function UserProfile() {
  const { getItem, setItem, removeItem } = useAsyncStorage('user');

  const [user, setUser] = React.useState(null);

  React.useEffect(() => {
    getItem().then((data) => {
      if (data) setUser(JSON.parse(data));
    });
  }, []);

  const updateUser = async (newUser: User) => {
    await setItem(JSON.stringify(newUser));
    setUser(newUser);
  };

  const clearUser = async () => {
    await removeItem();
    setUser(null);
  };

  return { user, updateUser, clearUser };
}
```

---

## Firebase JS SDK

### Installation

```bash
npx expo install firebase
```

### Setup

**Create `firebaseConfig.ts`**:

```typescript
// firebaseConfig.ts
import { initializeApp } from 'firebase/app';
import { getAuth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, connectFirestoreEmulator } from 'firebase/firestore';
import { getStorage, connectStorageEmulator } from 'firebase/storage';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

// Optional: Enable emulator for local development
if (__DEV__) {
  try {
    connectAuthEmulator(auth, 'http://127.0.0.1:9099', {
      disableWarnings: true,
    });
    connectFirestoreEmulator(db, '127.0.0.1', 8080);
    connectStorageEmulator(storage, '127.0.0.1', 9199);
  } catch (error) {
    // Emulator already initialized
  }
}
```

### Firestore CRUD Operations

#### Create Document

```typescript
import { collection, addDoc, setDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Auto-generate document ID
const newPost = await addDoc(collection(db, 'posts'), {
  title: 'My Post',
  content: 'Post content',
  userId: 'user123',
  createdAt: new Date(),
});
console.log('Document ID:', newPost.id);

// Set document with custom ID
await setDoc(doc(db, 'users', 'user123'), {
  name: 'John Doe',
  email: 'john@example.com',
  createdAt: new Date(),
});
```

#### Read Document

```typescript
import { getDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Get single document
const userRef = doc(db, 'users', 'user123');
const userSnap = await getDoc(userRef);
if (userSnap.exists()) {
  console.log('User:', userSnap.data());
}

// Get all documents
const postsSnap = await getDocs(collection(db, 'posts'));
const posts = postsSnap.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));

// Query with filter
const q = query(
  collection(db, 'posts'),
  where('userId', '==', 'user123')
);
const querySnap = await getDocs(q);
const userPosts = querySnap.docs.map((doc) => ({
  id: doc.id,
  ...doc.data(),
}));
```

#### Update Document

```typescript
import { updateDoc, doc, increment } from 'firebase/firestore';
import { db } from './firebaseConfig';

// Partial update
await updateDoc(doc(db, 'users', 'user123'), {
  name: 'Jane Doe',
  updatedAt: new Date(),
});

// Increment counter
await updateDoc(doc(db, 'posts', 'post123'), {
  likes: increment(1),
});
```

#### Delete Document

```typescript
import { deleteDoc, doc } from 'firebase/firestore';
import { db } from './firebaseConfig';

await deleteDoc(doc(db, 'users', 'user123'));
```

### Real-time Listening

```typescript
import { onSnapshot, collection, query, where } from 'firebase/firestore';
import { db } from './firebaseConfig';
import { useState, useEffect } from 'react';

function UserPostsScreen() {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    // Subscribe to real-time updates
    const q = query(
      collection(db, 'posts'),
      where('userId', '==', 'user123')
    );

    const unsubscribe = onSnapshot(q, (querySnap) => {
      const updatedPosts = querySnap.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
      setPosts(updatedPosts);
    });

    return unsubscribe; // Cleanup
  }, []);

  return (
    // Render posts (re-renders as data updates)
  );
}
```

---

## React Native Firebase

### Installation (Requires Prebuild)

```bash
npx expo install @react-native-firebase/app @react-native-firebase/auth @react-native-firebase/firestore

# Generate native code
npx expo prebuild --clean

# Build for development
eas build --platform ios --profile development
eas build --platform android --profile development
```

### Setup with Firebase Config

```typescript
// firebaseConfig.ts
import firebase from '@react-native-firebase/app';
import '@react-native-firebase/auth';
import '@react-native-firebase/firestore';

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

if (!firebase.apps.length) {
  firebase.initializeApp(firebaseConfig);
}

export default firebase;
```

### Authentication

```typescript
import auth from '@react-native-firebase/auth';

// Sign up
const newUser = await auth().createUserWithEmailAndPassword(
  'user@example.com',
  'password123'
);

// Sign in
const user = await auth().signInWithEmailAndPassword(
  'user@example.com',
  'password123'
);

// Real-time auth state
auth().onAuthStateChanged((user) => {
  if (user) {
    console.log('Logged in:', user.uid);
  } else {
    console.log('Logged out');
  }
});

// Sign out
await auth().signOut();
```

### Firestore (Native API)

```typescript
import firestore from '@react-native-firebase/firestore';

// Create
await firestore().collection('users').add({
  name: 'John',
  email: 'john@example.com',
});

// Read (real-time)
firestore()
  .collection('posts')
  .where('userId', '==', 'user123')
  .onSnapshot((querySnap) => {
    const posts = querySnap.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    }));
    console.log('Posts updated:', posts);
  });

// Update
await firestore().collection('users').doc('user123').update({
  name: 'Jane',
});

// Delete
await firestore().collection('users').doc('user123').delete();
```

---

## Firebase vs. React Native Firebase Comparison

| Aspect | Firebase JS SDK | React Native Firebase |
|--------|-----------------|----------------------|
| **Installation** | `npm install firebase` | Requires prebuild |
| **Expo Go Support** | ✅ Yes | ❌ No (native required) |
| **Performance** | Good | Excellent (native) |
| **Firestore** | ✅ Yes | ✅ Yes |
| **Real-time Sync** | ✅ Yes | ✅ Yes |
| **Offline Persistence** | ✅ Yes | ✅ Yes |
| **Analytics** | ❌ Not on mobile | ✅ Yes |
| **Crash Reporting** | ❌ Not on mobile | ✅ Yes |
| **Dynamic Links** | ❌ Not on mobile | ✅ Yes |
| **Use Case** | MVP, learning, web compatibility | Production apps |

**Decision**: Start with Firebase JS SDK. Migrate to React Native Firebase if you need Analytics, Crash Reporting, or max performance.

---

## Cross-References

- **Authentication**: [03-api-auth.md](03-api-auth.md) — Token storage in SecureStore
- **Firebase Complete**: [09-guide-firebase-integration.md](09-guide-firebase-integration.md) — Full integration guide
- **Security**: [13-best-practices-security.md](13-best-practices-security.md) — Data security practices

---

**Source Attribution**: https://docs.expo.dev/guides/using-firebase/  
**Last Updated**: December 2024
