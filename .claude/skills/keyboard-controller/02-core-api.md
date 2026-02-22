# Keyboard Controller: Core API Reference

**useKeyboardAnimation, useKeyboardController, KeyboardController module, KeyboardEvents**

---

## useKeyboardAnimation

Returns `Animated.Value` instances for keyboard height and progress. Use when you need RN Animated API integration. For better performance, prefer `useReanimatedKeyboardAnimation`.

### Return Type

```typescript
interface KeyboardAnimationValues {
  height: Animated.Value;   // 0 to keyboard height in px
  progress: Animated.Value; // 0 (closed) to 1 (open)
}
```

### Basic Usage

```typescript
import { Animated, TextInput } from 'react-native';
import { useKeyboardAnimation } from 'react-native-keyboard-controller';

function TranslatingView() {
  const { height, progress } = useKeyboardAnimation();

  const translateY = Animated.multiply(height, -1);
  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.5, 1],
  });

  return (
    <Animated.View style={{ transform: [{ translateY }], opacity }}>
      <TextInput placeholder="Type here..." />
    </Animated.View>
  );
}
```

### Class Component Alternative

Use `KeyboardContext` for class-based components:

```typescript
import { KeyboardContext } from 'react-native-keyboard-controller';

class MyComponent extends React.PureComponent {
  static contextType = KeyboardContext;

  render() {
    const { animated } = this.context;
    const { height, progress } = animated;
    // use height and progress Animated.Values
  }
}
```

---

## useReanimatedKeyboardAnimation

Returns Reanimated `SharedValue` instances. **Preferred over `useKeyboardAnimation`** -- runs on the UI thread for better performance.

### Return Type

```typescript
interface ReanimatedKeyboardAnimation {
  height: SharedValue<number>;   // 0 to keyboard height in px
  progress: SharedValue<number>; // 0 (closed) to 1 (open)
}
```

### Basic Usage

```typescript
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';

function ReanimatedView() {
  const { height, progress } = useReanimatedKeyboardAnimation();

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value * -1 }],
    opacity: progress.value,
  }));

  return <Animated.View style={style}>{/* content */}</Animated.View>;
}
```

### Class Component Alternative

```typescript
import { KeyboardContext } from 'react-native-keyboard-controller';

class MyComponent extends React.PureComponent {
  static contextType = KeyboardContext;

  render() {
    const { reanimated } = this.context;
    const { height, progress } = reanimated;
    // use SharedValues
  }
}
```

---

## useKeyboardController

Access and control the module enabled state at runtime.

### Return Type

```typescript
interface KeyboardControllerHook {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}
```

### Usage

```typescript
import { useKeyboardController } from 'react-native-keyboard-controller';

function SettingsScreen() {
  const { enabled, setEnabled } = useKeyboardController();

  // Disable temporarily to fall back to default Android adjustResize
  const handleToggle = () => setEnabled(!enabled);

  return <Switch value={enabled} onValueChange={handleToggle} />;
}
```

---

## KeyboardController Module

Imperative API for keyboard control.

### Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `dismiss` | `(options?) => Promise<void>` | Hide keyboard. Options: `{ keepFocus?: boolean, animated?: boolean }` |
| `setInputMode` | `(mode: AndroidSoftInputModes) => void` | Set Android soft input mode at runtime |
| `setDefaultMode` | `() => void` | Restore mode from AndroidManifest.xml |
| `preload` | `() => void` | Preload keyboard to eliminate first-focus lag (iOS only) |
| `isVisible` | `() => boolean` | Check current keyboard visibility |
| `state` | `() => KeyboardEventData` | Get current keyboard state (height, duration, etc.) |
| `setFocusTo` | `(direction: 'prev' \| 'current' \| 'next') => void` | Move focus between inputs |

### dismiss()

```typescript
import { KeyboardController } from 'react-native-keyboard-controller';

// Basic dismiss
await KeyboardController.dismiss();

// Keep focus on input (hides keyboard but input stays focused)
await KeyboardController.dismiss({ keepFocus: true });

// Dismiss without animation
await KeyboardController.dismiss({ animated: false });
```

### setInputMode() / setDefaultMode()

```typescript
import { KeyboardController, AndroidSoftInputModes } from 'react-native-keyboard-controller';
import { useEffect } from 'react';

function FormScreen() {
  useEffect(() => {
    KeyboardController.setInputMode(
      AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE
    );
    return () => {
      KeyboardController.setDefaultMode();
    };
  }, []);

  return (/* form content */);
}
```

### setFocusTo()

```typescript
// Move focus to next field
KeyboardController.setFocusTo('next');

// Move focus to previous field
KeyboardController.setFocusTo('prev');
```

---

## KeyboardEvents

Event listener API for keyboard show/hide lifecycle. Emits four events on all platforms.

### Events

| Event | When |
|-------|------|
| `keyboardWillShow` | Before keyboard appears |
| `keyboardWillHide` | Before keyboard disappears |
| `keyboardDidShow` | After keyboard animation completes (visible) |
| `keyboardDidHide` | After keyboard animation completes (hidden) |

### Event Payload

```typescript
interface KeyboardEventData {
  height: number;              // Keyboard height in px
  duration: number;            // Animation duration in ms
  timestamp: number;           // Event time from native thread
  target: number;              // Focused TextInput tag
  type: TextInputProps['keyboardType']; // keyboardType of focused input
  appearance: 'dark' | 'light'; // keyboardAppearance of focused input
}
```

### Usage

```typescript
import { KeyboardEvents } from 'react-native-keyboard-controller';
import { useEffect } from 'react';

function useKeyboardVisibility() {
  useEffect(() => {
    const showSub = KeyboardEvents.addListener('keyboardWillShow', (e) => {
      console.log('Keyboard height:', e.height);
    });
    const hideSub = KeyboardEvents.addListener('keyboardWillHide', (e) => {
      console.log('Keyboard hiding');
    });

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);
}
```

---

## useAnimatedKeyboard (v1.20.0+)

Compatibility hook for migrating from `react-native-reanimated`'s deprecated `useAnimatedKeyboard`. Drop-in replacement -- just change the import.

### Return Type

```typescript
interface AnimatedKeyboardResult {
  height: SharedValue<number>;              // 0 to keyboard height in px
  state: SharedValue<number>;               // KeyboardState: UNKNOWN, OPENING, OPEN, CLOSING, CLOSED
}
```

### Migration from Reanimated

```typescript
// Before (deprecated in reanimated 4.2.0)
import { useAnimatedKeyboard } from 'react-native-reanimated';

// After (v1.20.0+) -- just change the import
import { useAnimatedKeyboard } from 'react-native-keyboard-controller';

function MyComponent() {
  const { height, state } = useAnimatedKeyboard();

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: -height.value }],
  }));

  return <Animated.View style={style}>{/* content */}</Animated.View>;
}
```

**Note:** Requires `KeyboardProvider` at root (unlike the reanimated version).

---

## useKeyboardState

Reactive access to current keyboard state. Accepts an optional selector function to prevent unnecessary re-renders.

### Signature

```typescript
function useKeyboardState(): KeyboardState;
function useKeyboardState<T>(selector: (state: KeyboardState) => T): T;
```

### Return Type

```typescript
type KeyboardState = {
  isVisible: boolean;
  height: number;
  duration: number;                        // animation duration in ms
  timestamp: number;                       // native thread event timestamp
  target: number;                          // focused TextInput tag
  type: TextInputProps['keyboardType'];    // keyboardType from focused TextInput
  appearance: 'dark' | 'light';            // keyboardAppearance from focused TextInput
};
```

### Usage

```typescript
import { useKeyboardState } from 'react-native-keyboard-controller';
import { View, Text, StyleSheet } from 'react-native';

function KeyboardInfo() {
  // Select only what you need to minimize re-renders
  const isVisible = useKeyboardState((state) => state.isVisible);
  const height = useKeyboardState((state) => state.height);

  if (!isVisible) return null;

  return (
    <View style={styles.info}>
      <Text>Keyboard height: {height}px</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  info: { padding: 8, backgroundColor: '#f0f0f0' },
});
```

### Best Practices

- **Use selectors** to pick only needed fields -- prevents re-renders on irrelevant changes
- **Do not use for animations** -- use `useReanimatedKeyboardAnimation` instead
- **Do not read in event handlers** -- use `KeyboardController.isVisible()` or `KeyboardController.state()` directly

---

## Performance: Animated vs Reanimated

```typescript
// Animated.Value -- bridge thread, less efficient
const { height } = useKeyboardAnimation();
const style = {
  transform: [{ translateY: Animated.multiply(height, -1) }],
};

// SharedValue -- UI thread, more efficient
const { height } = useReanimatedKeyboardAnimation();
const style = useAnimatedStyle(() => ({
  transform: [{ translateY: height.value * -1 }],
}));
```

**Recommendation:** Always prefer `useReanimatedKeyboardAnimation` unless you specifically need RN Animated API compatibility.

---

**Version:** 1.20.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/
