# Keyboard Controller: Core API Reference

**KeyboardProvider, useKeyboardAnimation, useKeyboardController**

---

## KeyboardProvider

Root wrapper for keyboard event tracking. **Required**.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `children` | `ReactNode` | — | Child components |
| `statusBarTranslucent` | `boolean` | `false` | For translucent status bar |

### Example

```typescript
import { KeyboardProvider } from 'react-native-keyboard-controller';

export default function App() {
  return (
    <KeyboardProvider statusBarTranslucent={false}>
      <YourApp />
    </KeyboardProvider>
  );
}
```

---

## useKeyboardAnimation

Simple hook for keyboard animation values.

### Return Type
```typescript
interface KeyboardAnimationValues {
  height: Animated.Value;   // 0 to keyboardHeight
  progress: Animated.Value; // 0 to 1
}
```

### Basic Animation
```typescript
import { Animated } from 'react-native';
import { useKeyboardAnimation } from 'react-native-keyboard-controller';

function TranslatingView() {
  const { height } = useKeyboardAnimation();

  const animatedStyle = {
    transform: [{ translateY: Animated.multiply(height, -1) }],
  };

  return (
    <Animated.View style={[styles.container, animatedStyle]}>
      {/* Content moves with keyboard */}
    </Animated.View>
  );
}
```

### Opacity Animation
```typescript
function FadingOverlay() {
  const { progress } = useKeyboardAnimation();

  const opacity = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Animated.View style={[styles.overlay, { opacity }]}>
      {/* Fades in with keyboard */}
    </Animated.View>
  );
}
```

---

## useKeyboardController

Access and control module state.

### Return Type
```typescript
interface KeyboardControllerState {
  enabled: boolean;
  setEnabled: (enabled: boolean) => void;
}
```

### Example
```typescript
import { useKeyboardController } from 'react-native-keyboard-controller';

function SettingsScreen() {
  const { enabled, setEnabled } = useKeyboardController();

  return (
    <Switch
      value={enabled}
      onValueChange={setEnabled}
    />
  );
}
```

---

## KeyboardController Module

Imperative API for keyboard control.

### dismiss(options?)
```typescript
import { KeyboardController } from 'react-native-keyboard-controller';

await KeyboardController.dismiss();
await KeyboardController.dismiss({ animated: false }); // Android only
```

### setInputMode(mode)
```typescript
import { KeyboardController, AndroidSoftInputModes } from 'react-native-keyboard-controller';

await KeyboardController.setInputMode(
  AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE
);
```

### setDefaultMode()
```typescript
await KeyboardController.setDefaultMode();
```

### AndroidSoftInputModes
```typescript
type AndroidSoftInputModes =
  | 'adjustResize'      // Resize content
  | 'adjustPan'         // Pan view
  | 'adjustNothing'     // No adjustment
  | 'adjustUnspecified' // System default
```

---

**See Also**: [Advanced API](03-advanced-api.md) | [UI Components](04-ui-components.md)
