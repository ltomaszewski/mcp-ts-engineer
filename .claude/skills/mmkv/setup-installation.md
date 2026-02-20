# Setup & Installation

**Complete installation guide for react-native-mmkv across React Native, Expo, and platform-specific configurations.**

---

## Overview

react-native-mmkv requires installation of both the npm package and native dependencies. The installation process differs slightly between React Native (bare) and Expo projects. V4+ uses Nitro modules, which requires modern React Native architecture.

**Source**: https://github.com/mrousavy/react-native-mmkv

---

## Prerequisites

### Minimum Requirements

- **React Native**: 0.74 or higher
- **New Architecture**: Enabled (TurboModules/Fabric)
- **Node.js**: 16+
- **npm** or **yarn**

### Check React Native Version

```bash
npx react-native --version
```

### Enable New Architecture (if not already enabled)

For bare React Native projects, the new architecture may require additional setup. Consult your project's `package.json` and native build configuration.

---

## Installation: React Native (Bare)

### Step 1: Install npm Packages

```bash
npm install react-native-mmkv react-native-nitro-modules
# or
yarn add react-native-mmkv react-native-nitro-modules
```

### Step 2: Install iOS Dependencies

```bash
cd ios && pod install && cd ..
```

### Step 3: Verify Installation

**iOS:**
```bash
cd ios && pod install && cd ..
xcodebuild -workspace ios/YourApp.xcworkspace -scheme YourApp -configuration Debug
```

**Android:**
```bash
cd android
./gradlew assembleDebug
cd ..
```

### Step 4: Test Integration

Create a test file `storage.ts`:

```typescript
import { createMMKV } from 'react-native-mmkv'

export const storage = createMMKV()

// Quick test
storage.set('test-key', 'Hello MMKV!')
console.log(storage.getString('test-key')) // Output: "Hello MMKV!"
```

---

## Installation: Expo

### Step 1: Install Package

```bash
npx expo install react-native-mmkv react-native-nitro-modules
```

### Step 2: Prebuild (Required for Nitro Modules)

```bash
npx expo prebuild --clean
```

The `--clean` flag ensures a fresh build with all new architecture features.

### Step 3: Run on Device/Simulator

```bash
# iOS
npx expo run:ios

# Android
npx expo run:android
```

### Step 4: Custom Development Client (Optional)

For development, you can create a custom Expo development client:

```bash
eas build --platform ios --profile preview
eas build --platform android --profile preview
```

**Note**: Expo Go does not support native modules, so you must use `expo run:ios`/`expo run:android` or a custom development client.

---

## Post-Installation Verification

### 1. Import Test

Create `app.tsx`:

```typescript
import React from 'react'
import { View, Text } from 'react-native'
import { createMMKV } from 'react-native-mmkv'

const storage = createMMKV()

export default function App() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>MMKV Installation: ✓</Text>
    </View>
  )
}
```

### 2. Run Application

```bash
npx react-native run-ios
# or
npx react-native run-android
```

If no errors appear in the console, installation is successful.

### 3. Check Native Binding

In your app's console:

```typescript
import { createMMKV } from 'react-native-mmkv'

const storage = createMMKV()
console.log(storage) // Should show MMKV object with methods
console.log(typeof storage.set) // Should output: "function"
```

---

## Platform-Specific Notes

### iOS

- **Pod Install**: Always run `pod install` after adding the dependency
- **CocoaPods**: Ensure your Podfile is up to date (`pod repo update`)
- **Xcode**: Project must have new architecture enabled in Podfile:
  ```ruby
  post_install do |installer|
    react_native_post_install(installer)
  end
  ```

### Android

- **Gradle**: Ensure your `android/build.gradle` uses a recent Gradle version (7.5+)
- **API Level**: Minimum 21 (Android 5.0)
- **NDK**: May require NDK installation for native compilation
- **Check**: Verify in `android/app/build.gradle`:
  ```gradle
  android {
    compileSdkVersion 34
    ...
  }
  ```

### Web (Expo/React Native Web)

- Falls back to `localStorage` if available
- Provides in-memory storage if `localStorage` is disabled
- **Limitation**: Data does not persist if localStorage is disabled

---

## Troubleshooting Installation

### Error: "cannot find module 'react-native-mmkv'"

**Cause**: npm package installed but native dependencies not linked

**Solution**:
```bash
npm install
cd ios && pod install && cd ..
# Clear cache
rm -rf node_modules
npm install
```

### Error: "Nitro modules not available"

**Cause**: New architecture not enabled

**Solution**:
- Ensure `react-native >= 0.74`
- Check if new architecture is enabled in your project
- Run `npx react-native run-ios --newArchitecture` for testing

### Error: "Pod install fails"

**Cause**: Cached CocoaPods or incompatible versions

**Solution**:
```bash
cd ios
rm Podfile.lock
pod repo update
pod install
cd ..
```

### Error: "Gradle build fails on Android"

**Cause**: NDK or build tools missing

**Solution**:
```bash
# Update Android SDK
# In Android Studio: Tools → SDK Manager → SDK Tools
# Install: Android NDK, CMake

# Or via command line:
sdkmanager "ndk;25.1.8937393"
```

---

## Minimal Working Example

`storage.ts`:
```typescript
import { createMMKV } from 'react-native-mmkv'

export const storage = createMMKV({
  id: 'app.storage',
  encryptionKey: 'encryption-key-here' // Optional
})
```

`App.tsx`:
```typescript
import React, { useState } from 'react'
import { View, Text, Button, TextInput } from 'react-native'
import { storage } from './storage'

export default function App() {
  const [count, setCount] = useState(storage.getNumber('count') || 0)

  const increment = () => {
    const newCount = count + 1
    storage.set('count', newCount)
    setCount(newCount)
  }

  return (
    <View style={{ flex: 1, justifyContent: 'center', padding: 16 }}>
      <Text>Counter: {count}</Text>
      <Button title="Increment" onPress={increment} />
    </View>
  )
}
```

---

## Version Management

### Check Installed Version

```bash
npm list react-native-mmkv
```

### Upgrade to Latest

```bash
npm install react-native-mmkv@latest
# Then reinstall pods/rebuild native
cd ios && pod install && cd ..
npx react-native run-ios
```

### Use Specific Version

```bash
npm install react-native-mmkv@4.0.0
```

---

## Environment-Specific Configurations

### Development

Use default settings with optional logging:

```typescript
const storage = createMMKV({ id: 'dev.storage' })
console.log('Storage initialized:', storage.getAllKeys())
```

### Staging/Production

Include encryption and custom path:

```typescript
const storage = createMMKV({
  id: 'prod.storage',
  encryptionKey: process.env.MMKV_ENCRYPTION_KEY || 'default-key',
  path: `${USER_DIRECTORY}/secure-storage`,
  readOnly: false
})
```

---

## Next Steps

→ **core-concepts.md** — Understand MMKV architecture  
→ **api-initialization.md** — Advanced initialization options  
→ **api-read-write.md** — Start using the API  

---

## Quick Reference

| Task | Command |
|------|---------|
| Install npm packages | `npm install react-native-mmkv react-native-nitro-modules` |
| Install iOS deps | `cd ios && pod install && cd ..` |
| Expo prebuild | `npx expo prebuild --clean` |
| Run iOS | `npx react-native run-ios` |
| Run Android | `npx react-native run-android` |
| Check version | `npm list react-native-mmkv` |
| Upgrade | `npm install react-native-mmkv@latest` |

---

**Source**: https://github.com/mrousavy/react-native-mmkv  
**Last Updated**: December 2025

