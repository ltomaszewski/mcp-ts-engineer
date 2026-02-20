---
name: expo-core
description: Expo framework core - project setup, app.json config, authentication, data storage, device access. Use when working with Expo projects, configuring apps, or using Expo SDK modules.
---

# Expo Core

> Managed React Native workflow with Expo SDK modules for rapid mobile development.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Setting up or configuring Expo projects
- Working with app.json or app.config.js
- Implementing authentication flows (OAuth, Apple Sign-In)
- Using device features (camera, location, sensors)
- Storing data with AsyncStorage or SecureStore

---

## Critical Rules

**ALWAYS:**
1. Use expo-* packages over community alternatives — better maintained, tested with managed workflow
2. Store sensitive tokens in SecureStore — AsyncStorage is unencrypted and readable
3. Request permissions before accessing device features — crash prevention and UX
4. Use environment variables for API keys — never hardcode secrets in source

**NEVER:**
1. Hardcode API keys or secrets in app.json — exposed in app bundle
2. Use AsyncStorage for tokens/passwords — unencrypted storage is insecure
3. Skip permission checks — causes crashes on permission denial
4. Eject unnecessarily — use config plugins and prebuild instead

---

## Core Patterns

### App Configuration (app.json)

```json
{
  "expo": {
    "name": "MyApp",
    "slug": "my-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain"
    },
    "ios": {
      "bundleIdentifier": "com.company.myapp",
      "supportsTablet": true
    },
    "android": {
      "package": "com.company.myapp",
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png"
      }
    },
    "plugins": ["expo-router", "expo-secure-store"]
  }
}
```

### Authentication with AuthSession

```typescript
import * as AuthSession from 'expo-auth-session';
import * as SecureStore from 'expo-secure-store';
import { useAuthRequest } from 'expo-auth-session';

const discovery = {
  authorizationEndpoint: 'https://accounts.google.com/o/oauth2/v2/auth',
  tokenEndpoint: 'https://oauth2.googleapis.com/token',
};

export function useGoogleAuth() {
  const [request, response, promptAsync] = useAuthRequest(
    {
      clientId: process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID,
      scopes: ['openid', 'profile', 'email'],
      redirectUri: AuthSession.makeRedirectUri({ scheme: 'myapp' }),
    },
    discovery
  );

  useEffect(() => {
    if (response?.type === 'success') {
      const { access_token } = response.params;
      SecureStore.setItemAsync('accessToken', access_token);
    }
  }, [response]);

  return { request, promptAsync };
}
```

### Secure Token Storage

```typescript
import * as SecureStore from 'expo-secure-store';

// Store token (encrypted, keychain/keystore backed)
await SecureStore.setItemAsync('authToken', token);

// Retrieve token
const token = await SecureStore.getItemAsync('authToken');

// Delete token
await SecureStore.deleteItemAsync('authToken');

// Check availability (some devices don't support)
const available = await SecureStore.isAvailableAsync();
```

### Permission Request Pattern

```typescript
import * as Location from 'expo-location';

async function requestLocationPermission() {
  const { status: existingStatus } = await Location.getForegroundPermissionsAsync();

  if (existingStatus !== 'granted') {
    const { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      return null; // Handle denial gracefully
    }
  }

  return Location.getCurrentPositionAsync({});
}
```

---

## Anti-Patterns

**BAD** — Hardcoding secrets:
```typescript
const API_KEY = 'sk-1234567890abcdef'; // Exposed in bundle!
```

**GOOD** — Using environment variables:
```typescript
const API_KEY = process.env.EXPO_PUBLIC_API_KEY;
// Or for secrets (not prefixed): use EAS secrets or .env.local
```

**BAD** — Storing tokens in AsyncStorage:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('authToken', token); // Unencrypted!
```

**GOOD** — Using SecureStore for sensitive data:
```typescript
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('authToken', token); // Encrypted
```

**BAD** — Accessing features without permission check:
```typescript
const location = await Location.getCurrentPositionAsync(); // May crash!
```

**GOOD** — Always check/request permissions first:
```typescript
const { status } = await Location.requestForegroundPermissionsAsync();
if (status === 'granted') {
  const location = await Location.getCurrentPositionAsync();
}
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Store secure data | `SecureStore.setItemAsync()` | `await SecureStore.setItemAsync('key', value)` |
| Get secure data | `SecureStore.getItemAsync()` | `const val = await SecureStore.getItemAsync('key')` |
| OAuth flow | `useAuthRequest()` | `const [req, res, prompt] = useAuthRequest(config, discovery)` |
| Check permission | `*.getPermissionsAsync()` | `const { status } = await Camera.getPermissionsAsync()` |
| Request permission | `*.requestPermissionsAsync()` | `const { status } = await Camera.requestPermissionsAsync()` |
| Environment var | `process.env.EXPO_PUBLIC_*` | `process.env.EXPO_PUBLIC_API_URL` |
| Run prebuild | `npx expo prebuild` | `npx expo prebuild --clean` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Architecture overview and mental model | [01-framework-overview.md](01-framework-overview.md) |
| Project setup and app.json config | [02-quickstart-setup.md](02-quickstart-setup.md) |
| OAuth and authentication patterns | [03-api-auth.md](03-api-auth.md) |
| AsyncStorage and data persistence | [04-api-data-storage.md](04-api-data-storage.md) |
| Camera, location, sensors access | [05-api-device-access.md](05-api-device-access.md) |

---

**Version:** SDK 52 | **Source:** https://docs.expo.dev/
