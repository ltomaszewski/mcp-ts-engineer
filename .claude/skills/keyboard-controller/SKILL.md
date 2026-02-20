---
name: keyboard-controller
description: React Native Keyboard Controller - keyboard animations, KeyboardToolbar, KeyboardAwareScrollView, interactive dismiss. Use when handling keyboard in React Native apps.
---

# Keyboard Controller

> Universal keyboard handling for React Native with smooth animations and Reanimated support.

**Package:** `react-native-keyboard-controller`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Building forms that need keyboard-aware layouts
- Implementing smooth keyboard animations
- Adding keyboard toolbars with prev/next navigation
- Creating interactive keyboard dismiss gestures
- Replacing KeyboardAvoidingView with better solution

---

## Critical Rules

**ALWAYS:**
1. Wrap app root with `KeyboardProvider` — required for all hooks and components to work
2. Use `KeyboardAwareScrollView` instead of `KeyboardAvoidingView` — smoother animations, fewer bugs
3. Add `'worklet'` directive in `useKeyboardHandler` callbacks — required for Reanimated worklets
4. Configure Android `windowSoftInputMode` in AndroidManifest — affects keyboard behavior

**NEVER:**
1. Mix `KeyboardAvoidingView` with `KeyboardAwareScrollView` — causes layout conflicts
2. Forget KeyboardProvider at root — hooks will throw or return undefined
3. Use `useKeyboardAnimation` in scroll containers — use `useReanimatedKeyboardAnimation` instead
4. Skip platform testing — keyboard behavior differs between iOS and Android

---

## Core Patterns

### App Setup with KeyboardProvider

```typescript
// App.tsx or _layout.tsx
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
    <KeyboardAwareScrollView
      bottomOffset={20}
      keyboardShouldPersistTaps="handled"
    >
      <View style={styles.container}>
        <TextInput placeholder="Email" />
        <TextInput placeholder="Password" secureTextEntry />
        <Button title="Submit" onPress={handleSubmit} />
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

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -height.value }],
    opacity: 1 - progress.value * 0.5,
  }));

  return (
    <Animated.View style={animatedStyle}>
      <TextInput placeholder="Type here..." />
    </Animated.View>
  );
}
```

### Keyboard Handler for Custom Logic

```typescript
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { useSharedValue } from 'react-native-reanimated';

export function useCustomKeyboardHandler() {
  const keyboardHeight = useSharedValue(0);

  useKeyboardHandler({
    onStart: (e) => {
      'worklet';
      console.log('Keyboard starting:', e.height);
    },
    onMove: (e) => {
      'worklet';
      keyboardHeight.value = e.height;
    },
    onEnd: (e) => {
      'worklet';
      keyboardHeight.value = e.height;
    },
  });

  return keyboardHeight;
}
```

### KeyboardToolbar with Navigation

```typescript
import { KeyboardToolbar } from 'react-native-keyboard-controller';

export function FormWithToolbar() {
  return (
    <>
      <KeyboardAwareScrollView>
        <TextInput placeholder="First Name" />
        <TextInput placeholder="Last Name" />
        <TextInput placeholder="Email" keyboardType="email-address" />
      </KeyboardAwareScrollView>

      <KeyboardToolbar
        content={<Text>Navigate between fields</Text>}
        showArrows={true}
        opacity="faded" // or "opaque"
      />
    </>
  );
}
```

### Interactive Dismiss (iOS)

```typescript
import { KeyboardGestureArea } from 'react-native-keyboard-controller';

export function ChatScreen() {
  return (
    <KeyboardGestureArea interpolator="ios">
      <FlatList
        data={messages}
        renderItem={renderMessage}
        keyboardDismissMode="interactive"
      />
      <TextInput placeholder="Type a message..." />
    </KeyboardGestureArea>
  );
}
```

---

## Anti-Patterns

**BAD** — Missing KeyboardProvider:
```typescript
// App without KeyboardProvider - hooks won't work!
export default function App() {
  return <YourApp />;
}
```

**GOOD** — KeyboardProvider at root:
```typescript
export default function App() {
  return (
    <KeyboardProvider>
      <YourApp />
    </KeyboardProvider>
  );
}
```

**BAD** — Mixing KeyboardAvoidingView with KeyboardAwareScrollView:
```typescript
<KeyboardAvoidingView>
  <KeyboardAwareScrollView> {/* Conflict! */}
    <TextInput />
  </KeyboardAwareScrollView>
</KeyboardAvoidingView>
```

**GOOD** — Use only KeyboardAwareScrollView:
```typescript
<KeyboardAwareScrollView>
  <TextInput />
</KeyboardAwareScrollView>
```

**BAD** — Missing worklet directive:
```typescript
useKeyboardHandler({
  onMove: (e) => {
    // Missing 'worklet' - will crash!
    keyboardHeight.value = e.height;
  },
});
```

**GOOD** — Include worklet directive:
```typescript
useKeyboardHandler({
  onMove: (e) => {
    'worklet';
    keyboardHeight.value = e.height;
  },
});
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Wrap app | `KeyboardProvider` | `<KeyboardProvider>...</KeyboardProvider>` |
| Keyboard-aware scroll | `KeyboardAwareScrollView` | `<KeyboardAwareScrollView bottomOffset={20}>` |
| Animate with keyboard | `useReanimatedKeyboardAnimation()` | `const { height } = useReanimatedKeyboardAnimation()` |
| Custom keyboard logic | `useKeyboardHandler()` | `useKeyboardHandler({ onMove: (e) => {...} })` |
| Field navigation toolbar | `KeyboardToolbar` | `<KeyboardToolbar showArrows />` |
| Interactive dismiss | `KeyboardGestureArea` | `<KeyboardGestureArea interpolator="ios">` |
| Dismiss keyboard | `KeyboardController.dismiss()` | `KeyboardController.dismiss()` |
| Get keyboard state | `useKeyboardController()` | `const { enabled } = useKeyboardController()` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Installation and KeyboardProvider setup | [01-setup.md](01-setup.md) |
| useKeyboardAnimation, KeyboardController | [02-core-api.md](02-core-api.md) |
| useKeyboardHandler, worklets | [03-advanced-api.md](03-advanced-api.md) |
| KeyboardToolbar, KeyboardAwareScrollView | [04-ui-components.md](04-ui-components.md) |
| KeyboardExtender, BackgroundView | [05-extensions.md](05-extensions.md) |
| First animation, form patterns | [06-implementation-guides.md](06-implementation-guides.md) |
| Android manifest configuration | [07-android-config.md](07-android-config.md) |
| iOS ProMotion, safe area | [08-ios-config.md](08-ios-config.md) |
| Migration from other libraries | [09-migration.md](09-migration.md) |
| Debugging and troubleshooting | [10-troubleshooting.md](10-troubleshooting.md) |

---

**Version:** 1.19.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/
