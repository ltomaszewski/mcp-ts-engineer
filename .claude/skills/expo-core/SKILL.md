---
name: expo-core
description: Expo SDK 55 framework - project setup, app.json config, Constants, FileSystem, SecureStore, Linking, SplashScreen, Updates, Asset, Font. Use when creating Expo projects, configuring apps, or using Expo SDK modules.
---

# Expo Core

Managed React Native framework for building universal iOS, Android, and web apps from a single TypeScript codebase with Expo SDK 55.

---

## When to Use

LOAD THIS SKILL when user is:
- Creating or configuring Expo projects (app.json, app.config.ts, plugins)
- Using Expo SDK modules (Constants, FileSystem, SecureStore, Linking, SplashScreen, Updates, Asset, Font)
- Setting up project structure, environment variables, or build configuration
- Working with the New Architecture (now MANDATORY in SDK 55 — cannot be disabled)
- Managing OTA updates via expo-updates or EAS Update

---

## Critical Rules

**ALWAYS:**
1. Use `npx expo install` for Expo packages -- ensures version compatibility with current SDK
2. Store sensitive data in `expo-secure-store` -- AsyncStorage is unencrypted plaintext
3. Call `SplashScreen.preventAutoHideAsync()` at module scope -- not inside components or hooks
4. Use `EXPO_PUBLIC_` prefix for client-accessible env vars -- unprefixed vars are server-only

**NEVER:**
1. Hardcode API keys in app.json or source -- they ship in the app bundle and are extractable
2. Use the legacy `expo-file-system` import path for new code -- import from `expo-file-system` which is now the stable OOP API (formerly `/next`)
3. Skip permission checks before device access -- causes crashes or silent failures on iOS/Android
4. Attempt to disable New Architecture -- SDK 55 makes it MANDATORY; `newArchEnabled: false` is no longer supported

---

## Core Patterns

### Dynamic App Config (app.config.ts)

```typescript
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'MyApp',
  slug: 'my-app',
  version: '1.0.0',
  scheme: 'myapp',
  ios: { bundleIdentifier: 'com.company.myapp' },
  android: { package: 'com.company.myapp' },
  plugins: ['expo-router', 'expo-secure-store', 'expo-system-ui'],
  extra: { apiUrl: process.env.EXPO_PUBLIC_API_URL },
  experiments: { reactCompiler: true, typedRoutes: true }, // Both enabled by default in SDK 55
});
```

### Secure Token Storage

```typescript
import * as SecureStore from 'expo-secure-store';

await SecureStore.setItemAsync('authToken', token);
const token = await SecureStore.getItemAsync('authToken');
await SecureStore.deleteItemAsync('authToken');
// Sync variants available: setItem(), getItem()
```

### File Operations (New OOP API)

```typescript
import { File, Directory, Paths } from 'expo-file-system';

const file = new File(Paths.cache, 'data.json');
file.create();
file.write(JSON.stringify({ key: 'value' }));
const content = file.textSync();
```

### Font Loading with useFonts

```typescript
import { useFonts } from 'expo-font';

const [loaded, error] = useFonts({
  'Inter-Bold': require('./assets/fonts/Inter-Bold.otf'),
});
if (!loaded) return null;
```

---

## Anti-Patterns

**BAD** -- Storing tokens in AsyncStorage:
```typescript
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('authToken', token); // Unencrypted!
```

**GOOD** -- Using SecureStore for sensitive data:
```typescript
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('authToken', token); // Encrypted via Keychain/Keystore
```

**BAD** -- Using legacy FileSystem string-based API:
```typescript
import * as FileSystem from 'expo-file-system/legacy';
await FileSystem.writeAsStringAsync(FileSystem.documentDirectory + 'file.txt', 'data');
```

**GOOD** -- Using new OOP FileSystem API:
```typescript
import { File, Paths } from 'expo-file-system';
const file = new File(Paths.document, 'file.txt');
file.create();
file.write('data');
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Read app config | `Constants.expoConfig` | `Constants.expoConfig?.extra?.apiUrl` |
| Store secure data | `SecureStore.setItemAsync()` | `await SecureStore.setItemAsync('key', value)` |
| Read secure data | `SecureStore.getItemAsync()` | `const v = await SecureStore.getItemAsync('key')` |
| Write file | `File.write()` | `new File(Paths.cache, 'f.txt').write('data')` |
| Download file | `File.downloadFileAsync()` | `await File.downloadFileAsync(url, dir)` |
| Load fonts | `useFonts()` | `const [loaded] = useFonts({ name: src })` |
| Deep link URL | `Linking.createURL()` | `Linking.createURL('path', { queryParams })` |
| Hide splash | `SplashScreen.hideAsync()` | `await SplashScreen.hideAsync()` |
| Check updates | `Updates.checkForUpdateAsync()` | `const update = await Updates.checkForUpdateAsync()` |
| Load assets | `useAssets()` | `const [assets] = useAssets([require('./img.png')])` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Architecture, mental model, SDK 55 changes | [01-framework-overview.md](01-framework-overview.md) |
| Project setup, app.json/app.config.ts, env vars | [02-quickstart-setup.md](02-quickstart-setup.md) |
| Constants, SplashScreen, Linking, Updates APIs | [03-api-app-lifecycle.md](03-api-app-lifecycle.md) |
| FileSystem, SecureStore, Asset, Font APIs | [04-api-data-storage.md](04-api-data-storage.md) |
| Camera, Location, Sensors, Permissions patterns | [05-api-device-access.md](05-api-device-access.md) |

---

**Version:** Expo SDK 55 (~55.0.8) | React Native 0.83.4 | React 19.2.0 | **Source:** https://docs.expo.dev
