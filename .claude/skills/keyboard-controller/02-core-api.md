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
| `preload` | `() => void` | Preload keyboard to eliminate first-focus lag |
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
  height: number;       // Keyboard height in px
  duration: number;     // Animation duration in ms
  timestamp: number;    // Event time from native thread
  target: number;       // Focused TextInput tag
  type: string;         // keyboardType of focused input
  appearance: string;   // keyboardAppearance of focused input
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

**Version:** 1.19.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/
