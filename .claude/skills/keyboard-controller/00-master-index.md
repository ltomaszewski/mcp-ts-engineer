# Keyboard Controller: Master Index

**Complete Knowledge Base for react-native-keyboard-controller v1.19.5**

---

## Overview

Universal keyboard handling for React Native. Maps keyboard movement to animated values, enables interactive dismissal, and provides prebuilt components.

**Key Features:**
- Cross-platform consistency
- Smooth native animations
- Rich keyboard event metadata
- Prebuilt components (KeyboardToolbar, KeyboardAwareScrollView)
- Reanimated integration

## Module Summary

| Module | Purpose | Key Concepts |
|--------|---------|--------------|
| **01 Setup** | Installation | npm, KeyboardProvider, Expo |
| **02 Core API** | Basic hooks & module | useKeyboardAnimation, KeyboardController |
| **03 Advanced API** | Lifecycle events | useKeyboardHandler, worklets, Reanimated |
| **04 Components** | UI components | KeyboardToolbar, KeyboardAwareScrollView |
| **05 Extensions** | Custom keyboard UI | KeyboardExtender, BackgroundView |
| **06 Guides** | Implementation patterns | Animations, forms, performance |
| **07 Android** | Android config | Manifest, soft input modes |
| **08 iOS** | iOS config | Podfile, ProMotion, safe area |
| **09 Migration** | Upgrading from other libs | keyboard-aware-scroll-view |
| **10 Troubleshooting** | Debugging | Performance, common issues |

## Quick Start

```bash
npm install react-native-keyboard-controller
# Expo
npx expo install react-native-keyboard-controller
```

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

## API Overview

### Hooks

| Hook | Purpose |
|------|---------|
| `useKeyboardAnimation` | Animated.Value for height/progress |
| `useKeyboardController` | Module state (enabled/disabled) |
| `useKeyboardHandler` | Lifecycle callbacks with worklets |
| `useReanimatedKeyboardAnimation` | SharedValue for Reanimated |

### Components

| Component | Purpose |
|-----------|---------|
| `KeyboardProvider` | Root wrapper (required) |
| `KeyboardToolbar` | Navigation & done buttons |
| `KeyboardAwareScrollView` | Auto-scroll to focused input |
| `KeyboardStickyView` | Sticky positioning |
| `OverKeyboardView` | Content above keyboard |
| `KeyboardExtender` | Custom keyboard UI |

## Source Links

- Docs: https://kirillzyusko.github.io/react-native-keyboard-controller/
- GitHub: https://github.com/kirillzyusko/react-native-keyboard-controller
- npm: https://www.npmjs.com/package/react-native-keyboard-controller
- Expo: https://docs.expo.dev/versions/latest/sdk/keyboard-controller/

---

**Version**: 1.19.5 | **Status**: Production Ready
