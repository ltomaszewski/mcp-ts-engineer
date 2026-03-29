# MMKV: Setup & Installation

**Installation for React Native bare and Expo projects.**

---

## Prerequisites

- **React Native:** 0.75 or higher (v4 requires Nitro Modules)
- **Architecture:** Both New Architecture and Old Architecture supported (via Nitro backwards compatibility)
- **Node.js:** 16+

---

## Installation: React Native (Bare)

### Step 1: Install Packages

```bash
npm install react-native-mmkv react-native-nitro-modules
# or
yarn add react-native-mmkv react-native-nitro-modules
```

### Step 2: iOS Pod Install

```bash
cd ios && pod install && cd ..
```

### Step 3: Rebuild

```bash
npx react-native run-ios
npx react-native run-android
```

---

## Installation: Expo

### Step 1: Install

```bash
npx expo install react-native-mmkv react-native-nitro-modules
```

### Step 2: Prebuild

```bash
npx expo prebuild --clean
```

### Step 3: Run

```bash
npx expo run:ios
npx expo run:android
```

**Note:** Expo Go does NOT support native modules. Use `expo run:ios`/`expo run:android` or a custom development client.

---

## Verification

```typescript
import { createMMKV } from 'react-native-mmkv';

const storage = createMMKV();

storage.set('test-key', 'Hello MMKV!');
console.log(storage.getString('test-key')); // "Hello MMKV!"
console.log(typeof storage.set);             // "function"
```

---

## Platform Notes

### iOS
- Run `pod install` after adding the dependency
- Ensure Podfile uses `react_native_post_install`
- Minimum iOS version depends on React Native version

### Android
- Minimum API 21 (Android 5.0)
- Gradle 7.5+ required
- NDK may be needed for native compilation

### Web (Expo/React Native Web)
- Falls back to `localStorage` if available
- In-memory storage if `localStorage` is disabled

---

## Troubleshooting

### "Cannot find module 'react-native-mmkv'"
```bash
rm -rf node_modules
npm install
cd ios && pod install && cd ..
```

### "Nitro modules not available"
- Ensure React Native >= 0.75
- Verify New Architecture is enabled
- Run `npx expo prebuild --clean` for Expo

### Pod install fails
```bash
cd ios
rm -rf Pods Podfile.lock
pod repo update
pod install
cd ..
```

### iOS build error: "Swift pods cannot be integrated as static libraries"
Ensure MMKVCore dependency is v2.2.4+ or add `:modular_headers => true` to Podfile.

---

**Version:** 4.3.0 | **Source:** https://github.com/mrousavy/react-native-mmkv
