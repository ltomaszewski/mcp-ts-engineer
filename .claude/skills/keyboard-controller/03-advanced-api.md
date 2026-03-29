# Keyboard Controller: Advanced API Reference

**useKeyboardHandler, useFocusedInputHandler, lifecycle events, worklet integration**

---

## useKeyboardHandler

Low-level access to keyboard lifecycle events. All callbacks run as Reanimated worklets on the UI thread.

### Signature

```typescript
useKeyboardHandler(
  handlers: {
    onStart?: (e: NativeEvent) => void;
    onMove?: (e: NativeEvent) => void;
    onInteractive?: (e: NativeEvent) => void;
    onEnd?: (e: NativeEvent) => void;
  },
  dependencies: any[]
);
```

### Event Payload

```typescript
interface NativeEvent {
  height: number;      // Keyboard height in pixels
  progress: number;    // 0 (closed) to 1 (opened)
  duration: number;    // Animation duration in ms
  target: number;      // Focused TextInput tag
}
```

### Handler Callbacks

| Callback | When | Receives |
|----------|------|----------|
| `onStart` | Animation begins | Destination values (where keyboard is going) |
| `onMove` | Every animation frame | Current intermediate values |
| `onInteractive` | User dragging keyboard (swipe dismiss) | Current drag position |
| `onEnd` | Animation completes | Final resting values |

### Critical Rule

All handlers **must** include the `'worklet'` directive:

```typescript
import { useKeyboardHandler } from 'react-native-keyboard-controller';
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

function AnimatedKeyboard() {
  const height = useSharedValue(0);
  const isOpening = useSharedValue(false);

  useKeyboardHandler(
    {
      onStart: (e) => {
        'worklet';
        // e contains destination values
        isOpening.value = e.progress > 0;
      },
      onMove: (e) => {
        'worklet';
        height.value = e.height;
      },
      onInteractive: (e) => {
        'worklet';
        // Fired during user swipe-to-dismiss
        height.value = e.height;
      },
      onEnd: (e) => {
        'worklet';
        height.value = e.height;
      },
    },
    []
  );

  const style = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value * -1 }],
  }));

  return <Animated.View style={style}>{/* content */}</Animated.View>;
}
```

### Event Lifecycle

```
Keyboard Appearance:
[User taps TextInput]
    |
    v
  onStart (destination values known)
    |
    v
  onMove (called every frame during animation)
    |
    v
  onEnd (animation complete, final values)

Interactive Dismiss (iOS / Android 11+):
[User swipes keyboard down]
    |
    v
  onInteractive (called each frame as user drags)
    |
    v
  onStart -> onEnd (snaps to rest position)
```

### Requirements

- `react-native-reanimated` must be installed and babel plugin configured
- `'worklet'` directive required in all callbacks
- For 120 FPS on iOS ProMotion: add `CADisableMinimumFrameDurationOnPhone` to Info.plist
- `onInteractive` requires Android 11+ or iOS ScrollView with `keyboardDismissMode="interactive"`

---

## useFocusedInputHandler

Intercept events from the currently focused TextInput without needing a direct reference to it. Runs as worklets on the UI thread.

### Signature

```typescript
useFocusedInputHandler(
  handlers: {
    onChangeText?: (e: FocusedInputTextChangedEvent) => void;
    onSelectionChange?: (e: FocusedInputSelectionChangedEvent) => void;
  },
  dependencies: any[]
);
```

### Event Types

```typescript
interface FocusedInputTextChangedEvent {
  text: string;
}

interface FocusedInputSelectionChangedEvent {
  target: number;
  selection: {
    start: { x: number; y: number; position: number };
    end: { x: number; y: number; position: number };
  };
}
```

### Usage

```typescript
import { useFocusedInputHandler } from 'react-native-keyboard-controller';
import { useSharedValue } from 'react-native-reanimated';

function useGlobalInputTracker() {
  const currentText = useSharedValue('');

  useFocusedInputHandler(
    {
      onChangeText: ({ text }) => {
        'worklet';
        currentText.value = text;
      },
      onSelectionChange: ({ selection }) => {
        'worklet';
        // Track caret position globally
        console.log('Caret at:', selection.start.position);
      },
    },
    []
  );

  return currentText;
}
```

### Use Cases

| Use Case | Handler |
|----------|---------|
| Global text tracking without ref | `onChangeText` |
| Inactivity detection / auto-logout timer | `onChangeText` |
| Custom caret position UI | `onSelectionChange` |
| Building custom avoidance components | `onChangeText` + `onSelectionChange` |

---

## Combining Hooks

### Keyboard Height + Input Text Tracking

```typescript
import { useKeyboardHandler, useFocusedInputHandler } from 'react-native-keyboard-controller';
import { useSharedValue, useAnimatedStyle, runOnJS } from 'react-native-reanimated';
import { useState } from 'react';

function useSmartKeyboard() {
  const keyboardHeight = useSharedValue(0);
  const [inputText, setInputText] = useState('');

  useKeyboardHandler(
    {
      onMove: (e) => {
        'worklet';
        keyboardHeight.value = e.height;
      },
    },
    []
  );

  useFocusedInputHandler(
    {
      onChangeText: ({ text }) => {
        'worklet';
        runOnJS(setInputText)(text);
      },
    },
    []
  );

  return { keyboardHeight, inputText };
}
```

---

## Worklet Best Practices

### Do

```typescript
// Lightweight operations only
onMove: (e) => {
  'worklet';
  height.value = e.height;
},
```

### Do Not

```typescript
// Heavy computation blocks the UI thread
onMove: (e) => {
  'worklet';
  const result = expensiveCalculation(e.height); // Bad
  height.value = result;
},
```

### Calling JS from Worklets

```typescript
import { runOnJS } from 'react-native-reanimated';

onEnd: (e) => {
  'worklet';
  runOnJS(handleKeyboardClosed)(e.height);
},
```

---

**Version:** 1.21.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/docs/api/hooks/
