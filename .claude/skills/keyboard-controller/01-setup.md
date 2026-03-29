# Keyboard Controller: Setup & Installation

**Installation, KeyboardProvider configuration, and platform requirements.**

---

## Installation

### npm / yarn

```bash
npm install react-native-keyboard-controller react-native-reanimated
cd ios && pod install && cd ..

# or
yarn add react-native-keyboard-controller react-native-reanimated
cd ios && pod install && cd ..
```

### Expo

```bash
npx expo install react-native-keyboard-controller react-native-reanimated
```

**Note:** react-native-keyboard-controller is NOT compatible with Expo Go. You must use a custom dev client (`npx expo run:ios` / `npx expo run:android`).

## Peer Dependency

`react-native-reanimated` is a **mandatory** peer dependency. Install it first and ensure the Reanimated babel plugin is configured:

```javascript
// babel.config.js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: ['react-native-reanimated/plugin'],
};
```

## TypeScript

Types are included. No additional `@types` packages needed.

```typescript
import {
  KeyboardProvider,
  KeyboardAwareScrollView,
  KeyboardToolbar,
  useKeyboardAnimation,
  useReanimatedKeyboardAnimation,
  useKeyboardHandler,
  useKeyboardController,
  useFocusedInputHandler,
  KeyboardController,
  KeyboardEvents,
} from 'react-native-keyboard-controller';
```

---

## KeyboardProvider Setup (Required)

Wrap your entire app with `KeyboardProvider`. Place it near the root, above navigation.

### Basic Setup

```typescript
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function App() {
  return (
    <KeyboardProvider>
      <YourAppContent />
    </KeyboardProvider>
  );
}
```

### With Navigation

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function App() {
  return (
    <KeyboardProvider>
      <NavigationContainer>
        <RootNavigator />
      </NavigationContainer>
    </KeyboardProvider>
  );
}
```

### With Expo Router

```typescript
// app/_layout.tsx
import { Slot } from 'expo-router';
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function RootLayout() {
  return (
    <KeyboardProvider>
      <Slot />
    </KeyboardProvider>
  );
}
```

---

## KeyboardProvider Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `statusBarTranslucent` | `boolean` | `true` | Whether StatusBar is translucent on Android. Library enables edge-to-edge by default. |
| `navigationBarTranslucent` | `boolean` | `true` | Whether NavigationBar is translucent on Android. |
| `preserveEdgeToEdge` | `boolean` | `false` | Keep edge-to-edge mode always enabled even when module is disabled. Useful with `react-native-edge-to-edge`. |
| `preload` | `boolean` | `true` | Preload keyboard to eliminate initial focus lag (iOS only). Calls `KeyboardController.preload()` internally. |
| `enabled` | `boolean` | `true` | Whether the module is enabled. Controls initial state; use `useKeyboardController` hook to change at runtime. |

### Prevent Keyboard Flash on Launch

If the keyboard briefly appears on app launch, disable preloading:

```typescript
<KeyboardProvider preload={false}>
  <YourApp />
</KeyboardProvider>
```

Then manually preload later:

```typescript
KeyboardController.preload();
```

---

## Platform Requirements

### React Native Compatibility

| RN Version | Keyboard Controller | Notes |
|------------|-------------------|-------|
| 0.81+ | 1.21+ | Recommended, Fabric default |
| 0.73+ | 1.21+ | Supported |
| 0.70+ | 1.20.5+ | Compatibility patch |
| 0.72 | 1.18.x | Legacy |

### iOS

- Minimum: iOS 12.4+
- Pod install required after adding dependency
- Fabric support: Yes (default in RN 0.81+)

### Android

- Minimum: API 21 (Android 5.0)
- Interactive dismiss requires API 30 (Android 11+)
- AndroidManifest.xml configuration recommended (see [07-android-config.md](07-android-config.md))

---

## Verification

```bash
npm list react-native-keyboard-controller
npm list react-native-reanimated
```

### Checklist

- [ ] `react-native-keyboard-controller` installed
- [ ] `react-native-reanimated` installed and babel plugin configured
- [ ] iOS: `pod install` succeeded
- [ ] App wrapped with `KeyboardProvider`
- [ ] No TypeScript errors on import
- [ ] Keyboard animates when focusing a TextInput

---

**Version:** 1.21.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/docs/installation
