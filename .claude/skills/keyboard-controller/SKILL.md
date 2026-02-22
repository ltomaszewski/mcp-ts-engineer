---
name: keyboard-controller
description: React Native Keyboard Controller - keyboard animations, KeyboardToolbar, KeyboardAwareScrollView, interactive dismiss. Use when handling keyboard in React Native apps.
---

# Keyboard Controller

Universal keyboard handling for React Native with smooth native animations and Reanimated integration.

---

## When to Use

LOAD THIS SKILL when user is:
- Building forms that need keyboard-aware layouts
- Implementing smooth keyboard show/hide animations
- Adding keyboard toolbars with prev/next field navigation
- Creating interactive keyboard dismiss gestures (iOS / Android 11+)
- Replacing KeyboardAvoidingView with a more reliable solution

---

## Critical Rules

**ALWAYS:**
1. Wrap app root with `KeyboardProvider` -- required for all hooks and components to work
2. Install `react-native-reanimated` as a peer dependency -- mandatory for the library
3. Add `'worklet'` directive in `useKeyboardHandler` callbacks -- required for Reanimated worklets
4. Use `KeyboardAwareScrollView` instead of `KeyboardAvoidingView` for scrollable forms -- smoother animations, fewer bugs

**NEVER:**
1. Mix `KeyboardAvoidingView` with `KeyboardAwareScrollView` -- causes layout conflicts
2. Forget `KeyboardProvider` at root -- hooks will throw or return undefined
3. Omit the `'worklet'` directive in `useKeyboardHandler` callbacks -- will crash at runtime
4. Use `KeyboardGestureArea` on Android < 11 -- renders as empty fragment, no-op

---

## Core Patterns

### App Setup with KeyboardProvider

```typescript
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function App() {
  return (
    <KeyboardProvider>
      <NavigationContainer>
        <YourApp />
      </NavigationContainer>
    </KeyboardProvider>
  );
}
```

### KeyboardAwareScrollView for Forms

```typescript
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { TextInput, View } from 'react-native';

export function FormScreen() {
  return (
    <KeyboardAwareScrollView bottomOffset={20}>
      <View style={{ padding: 16 }}>
        <TextInput placeholder="Email" />
        <TextInput placeholder="Password" secureTextEntry />
      </View>
    </KeyboardAwareScrollView>
  );
}
```

### Keyboard Animation with Reanimated

```typescript
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';
import Animated, { useAnimatedStyle } from 'react-native-reanimated';

export function AnimatedInput() {
  const { height, progress } = useReanimatedKeyboardAnimation();

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value * -1 }],
    opacity: 1 - progress.value * 0.3,
  }));

  return (
    <Animated.View style={style}>
      <TextInput placeholder="Type here..." />
    </Animated.View>
  );
}
```

### useKeyboardHandler for Custom Logic

```typescript
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { useSharedValue } from 'react-native-reanimated';

export function useCustomKeyboard() {
  const height = useSharedValue(0);

  useKeyboardHandler({
    onMove: (e) => {
      'worklet';
      height.value = e.height;
    },
    onEnd: (e) => {
      'worklet';
      height.value = e.height;
    },
  }, []);

  return height;
}
```

### KeyboardToolbar with Navigation

```typescript
import { KeyboardToolbar, KeyboardAwareScrollView } from 'react-native-keyboard-controller';

export function FormWithToolbar() {
  return (
    <>
      <KeyboardAwareScrollView bottomOffset={62}>
        <TextInput placeholder="First Name" />
        <TextInput placeholder="Last Name" />
        <TextInput placeholder="Email" />
      </KeyboardAwareScrollView>

      <KeyboardToolbar>
        <KeyboardToolbar.Prev />
        <KeyboardToolbar.Next />
        <KeyboardToolbar.Done text="Submit" />
      </KeyboardToolbar>
    </>
  );
}
```

### Interactive Dismiss (Android 11+)

```typescript
import { KeyboardGestureArea } from 'react-native-keyboard-controller';

export function ChatScreen() {
  return (
    <KeyboardGestureArea interpolator="ios" style={{ flex: 1 }}>
      <FlatList data={messages} renderItem={renderMessage} />
      <TextInput placeholder="Type a message..." />
    </KeyboardGestureArea>
  );
}
```

---

## Anti-Patterns

**BAD** -- Missing KeyboardProvider:
```typescript
export default function App() {
  return <YourApp />;
}
```

**GOOD** -- KeyboardProvider at root:
```typescript
export default function App() {
  return (
    <KeyboardProvider>
      <YourApp />
    </KeyboardProvider>
  );
}
```

**BAD** -- Missing worklet directive:
```typescript
useKeyboardHandler({
  onMove: (e) => {
    keyboardHeight.value = e.height; // crashes
  },
}, []);
```

**GOOD** -- Include worklet directive:
```typescript
useKeyboardHandler({
  onMove: (e) => {
    'worklet';
    keyboardHeight.value = e.height;
  },
}, []);
```

**BAD** -- Mixing avoiding views:
```typescript
<KeyboardAvoidingView>
  <KeyboardAwareScrollView>
    <TextInput />
  </KeyboardAwareScrollView>
</KeyboardAvoidingView>
```

**GOOD** -- Use only one:
```typescript
<KeyboardAwareScrollView bottomOffset={20}>
  <TextInput />
</KeyboardAwareScrollView>
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Wrap app | `KeyboardProvider` | `<KeyboardProvider>...</KeyboardProvider>` |
| Keyboard-aware scroll | `KeyboardAwareScrollView` | `<KeyboardAwareScrollView bottomOffset={20}>` |
| Animate with keyboard (Reanimated) | `useReanimatedKeyboardAnimation()` | `const { height, progress } = useReanimatedKeyboardAnimation()` |
| Animate with keyboard (Animated) | `useKeyboardAnimation()` | `const { height, progress } = useKeyboardAnimation()` |
| Custom keyboard logic | `useKeyboardHandler()` | `useKeyboardHandler({ onMove: (e) => { 'worklet'; ... } }, [])` |
| Focused input events | `useFocusedInputHandler()` | `useFocusedInputHandler({ onChangeText: (e) => { 'worklet'; ... } }, [])` |
| Field navigation toolbar | `KeyboardToolbar` | `<KeyboardToolbar><KeyboardToolbar.Prev /><KeyboardToolbar.Next /><KeyboardToolbar.Done /></KeyboardToolbar>` |
| Sticky view above keyboard | `KeyboardStickyView` | `<KeyboardStickyView offset={{ opened: 10 }}>` |
| Interactive dismiss (Android) | `KeyboardGestureArea` | `<KeyboardGestureArea interpolator="ios">` |
| Display over keyboard | `OverKeyboardView` | `<OverKeyboardView visible={true}>` |
| Dismiss keyboard | `KeyboardController.dismiss()` | `await KeyboardController.dismiss()` |
| Toggle module | `useKeyboardController()` | `const { enabled, setEnabled } = useKeyboardController()` |
| Listen to events | `KeyboardEvents` | `KeyboardEvents.addListener('keyboardWillShow', cb)` |
| Set Android input mode | `KeyboardController.setInputMode()` | `KeyboardController.setInputMode(AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE)` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and KeyboardProvider setup | [01-setup.md](01-setup.md) |
| useKeyboardAnimation, KeyboardController module | [02-core-api.md](02-core-api.md) |
| useKeyboardHandler, useFocusedInputHandler, worklets | [03-advanced-api.md](03-advanced-api.md) |
| KeyboardToolbar, KeyboardAwareScrollView, KeyboardStickyView | [04-ui-components.md](04-ui-components.md) |
| KeyboardExtender, OverKeyboardView, KeyboardGestureArea | [05-extensions.md](05-extensions.md) |
| Form patterns, animation guides, chat UI | [06-implementation-guides.md](06-implementation-guides.md) |
| Android manifest, soft input modes | [07-android-config.md](07-android-config.md) |
| iOS ProMotion, safe area integration | [08-ios-config.md](08-ios-config.md) |
| Migration from other keyboard libraries | [09-migration.md](09-migration.md) |
| Debugging and troubleshooting | [10-troubleshooting.md](10-troubleshooting.md) |

---

**Version:** 1.19.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/
