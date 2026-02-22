# Keyboard Controller: Master Index

**Complete Knowledge Base for react-native-keyboard-controller v1.19.x**

---

## Overview

Universal keyboard handling for React Native. Maps keyboard movement to animated values, enables interactive dismissal, and provides prebuilt components for forms and chat UIs.

**Key Features:**
- Cross-platform consistency (iOS + Android)
- Smooth native animations via Reanimated SharedValues
- Rich keyboard event metadata (height, progress, duration, target)
- Prebuilt components: KeyboardToolbar, KeyboardAwareScrollView, KeyboardStickyView
- Interactive keyboard dismiss (iOS native, Android 11+)
- OverKeyboardView and KeyboardExtender for custom keyboard UI

## Module Summary

| Module | Purpose | Key Concepts |
|--------|---------|--------------|
| **01 Setup** | Installation | npm, KeyboardProvider, Expo, Reanimated peer dep |
| **02 Core API** | Basic hooks and module | useKeyboardAnimation, KeyboardController, KeyboardEvents |
| **03 Advanced API** | Lifecycle events and input tracking | useKeyboardHandler, useFocusedInputHandler, worklets |
| **04 Components** | UI components | KeyboardToolbar, KeyboardAwareScrollView, KeyboardStickyView, KeyboardAvoidingView |
| **05 Extensions** | Custom keyboard UI and gestures | KeyboardExtender, OverKeyboardView, KeyboardGestureArea, KeyboardBackgroundView |
| **06 Guides** | Implementation patterns | Animations, forms, chat, performance |
| **07 Android** | Android config | Manifest, soft input modes, dynamic mode switching |
| **08 iOS** | iOS config | Podfile, ProMotion 120Hz, safe area |
| **09 Migration** | Upgrading from other libs | keyboard-aware-scroll-view, Reanimated useAnimatedKeyboard |
| **10 Troubleshooting** | Debugging | Performance, build issues, common problems |

## Quick Start

```bash
# Install (Reanimated is a required peer dependency)
npm install react-native-keyboard-controller react-native-reanimated
cd ios && pod install && cd ..

# Expo
npx expo install react-native-keyboard-controller react-native-reanimated
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

| Hook | Purpose | Returns |
|------|---------|---------|
| `useKeyboardAnimation` | Animated.Value for height/progress | `{ height, progress }` |
| `useReanimatedKeyboardAnimation` | SharedValue for Reanimated | `{ height, progress }` |
| `useKeyboardHandler` | Lifecycle callbacks with worklets | void |
| `useKeyboardController` | Module enabled state | `{ enabled, setEnabled }` |
| `useFocusedInputHandler` | Text/selection events from focused input | void |

### Components

| Component | Purpose |
|-----------|---------|
| `KeyboardProvider` | Root wrapper (required) |
| `KeyboardToolbar` | Navigation and done buttons |
| `KeyboardAwareScrollView` | Auto-scroll to focused input |
| `KeyboardStickyView` | Sticky positioning above keyboard |
| `KeyboardAvoidingView` | Avoid keyboard overlap (padding/height/position/translate) |

### Views

| View | Purpose |
|------|---------|
| `OverKeyboardView` | Content displayed above keyboard |
| `KeyboardExtender` | Content rendered inside keyboard area |
| `KeyboardBackgroundView` | Matches keyboard background color |
| `KeyboardGestureArea` | Interactive dismiss gestures (Android 11+) |

### Module

| API | Purpose |
|-----|---------|
| `KeyboardController.dismiss()` | Hide keyboard programmatically |
| `KeyboardController.setInputMode()` | Set Android soft input mode at runtime |
| `KeyboardController.setDefaultMode()` | Restore manifest default mode |
| `KeyboardController.preload()` | Preload keyboard to eliminate first-focus lag |
| `KeyboardController.isVisible()` | Check keyboard visibility |
| `KeyboardController.setFocusTo()` | Focus prev/current/next input |
| `KeyboardEvents` | Event listener API (keyboardWillShow/Hide/DidShow/DidHide) |

## Source Links

- Docs: https://kirillzyusko.github.io/react-native-keyboard-controller/
- GitHub: https://github.com/kirillzyusko/react-native-keyboard-controller
- npm: https://www.npmjs.com/package/react-native-keyboard-controller

---

**Version**: 1.19.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/
