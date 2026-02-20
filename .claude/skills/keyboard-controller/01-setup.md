# Keyboard Controller: Setup & Installation

**Installation and initialization**

---

## Installation

### npm
```bash
npm install react-native-keyboard-controller
cd ios && pod install && cd ..
```

### yarn
```bash
yarn add react-native-keyboard-controller
cd ios && pod install && cd ..
```

### Expo
```bash
npx expo install react-native-keyboard-controller
```

## TypeScript

Types included. No additional packages needed.

```typescript
import {
  KeyboardProvider,
  useKeyboardAnimation,
  useKeyboardController,
} from 'react-native-keyboard-controller';
```

## Basic Setup (Required)

```typescript
// App.tsx
import { KeyboardProvider } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native';

export default function App() {
  return (
    <KeyboardProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <YourAppContent />
      </SafeAreaView>
    </KeyboardProvider>
  );
}
```

**Key Points:**
- Wrap entire app with `KeyboardProvider`
- Place near root, above navigation
- Only one `KeyboardProvider` per app

## With Navigation

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

## Platform Requirements

### iOS
- Minimum: iOS 12.4+
- Pod install required

### Android
- Minimum: API 21 (Android 5.0)
- AndroidManifest.xml configuration required

### React Native
| RN Version | Keyboard Controller |
|------------|-------------------|
| 0.73+ | 1.19+ (Recommended) |
| 0.72 | 1.18 |
| 0.71 | 1.17 |

**Fabric Support**: Yes (RN 0.73+)

## Verification

```bash
npm list react-native-keyboard-controller
```

Checklist:
- [ ] Package installed
- [ ] iOS: pod install succeeded
- [ ] App wrapped with KeyboardProvider
- [ ] No TypeScript errors
- [ ] Platform config applied

---

**See Also**: [Core API](02-core-api.md) | [Android Config](07-android-config.md) | [iOS Config](08-ios-config.md)
