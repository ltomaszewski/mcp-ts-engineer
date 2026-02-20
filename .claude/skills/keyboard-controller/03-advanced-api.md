# Keyboard Controller: Advanced API Reference

**useKeyboardHandler, Reanimated integration, lifecycle events**

---

## useKeyboardHandler

Low-level access to keyboard lifecycle events. Requires **worklet directives**.

### Syntax
```typescript
useKeyboardHandler(
  {
    onStart?: (e: KeyboardAnimationEventPayload) => void,
    onMove?: (e: KeyboardAnimationEventPayload) => void,
    onInteractive?: (e: KeyboardAnimationEventPayload) => void,
    onEnd?: (e: KeyboardAnimationEventPayload) => void,
  },
  dependencies?: any[]
);
```

### Event Payload
```typescript
interface KeyboardAnimationEventPayload {
  height: number;      // Keyboard height in pixels
  progress: number;    // 0 (closed) to 1 (opened)
  duration?: number;   // Animation duration (ms)
  target?: number;     // Focused TextInput tag
}
```

### Handler Callbacks

| Callback | When | Values |
|----------|------|--------|
| `onStart` | Animation begins | Destination |
| `onMove` | Every frame | Current |
| `onInteractive` | User dragging | Current |
| `onEnd` | Animation complete | Final |

### Example
```typescript
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { useKeyboardHandler } from 'react-native-keyboard-controller';

function KeyboardLifecycle() {
  const height = useSharedValue(0);

  useKeyboardHandler(
    {
      onStart: (e) => {
        'worklet';
        console.log('Animation starting');
      },
      onMove: (e) => {
        'worklet';
        height.value = e.height;
      },
      onEnd: (e) => {
        'worklet';
        console.log('Animation complete');
      },
    },
    []
  );

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value * -1 }],
  }));

  return <Animated.View style={animatedStyle} />;
}
```

---

## useReanimatedKeyboardAnimation

Keyboard values as Reanimated SharedValues. **Better performance**.

### Return Type
```typescript
interface ReanimatedKeyboardAnimation {
  height: SharedValue<number>;
  progress: SharedValue<number>;
}
```

### Example
```typescript
import Animated, { useAnimatedStyle } from 'react-native-reanimated';
import { useReanimatedKeyboardAnimation } from 'react-native-keyboard-controller';

function ReanimatedView() {
  const { height } = useReanimatedKeyboardAnimation();

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: height.value * -1 }],
  }));

  return <Animated.View style={animatedStyle} />;
}
```

---

## Event Lifecycle Timing

```
Keyboard Appearance:
[User taps TextInput]
    │
    ▼
┌─────────────────────────────────────┐
│ onStart (destination values known)  │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ onMove (every frame)                │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ onEnd (animation complete)          │
└─────────────────────────────────────┘

Interactive Dismiss (iOS, Android 11+):
[User swipes keyboard]
    │
    ▼
┌─────────────────────────────────────┐
│ onInteractive (user dragging)       │
└─────────────────────────────────────┘
    │
    ▼
┌─────────────────────────────────────┐
│ onStart → onEnd (to rest position)  │
└─────────────────────────────────────┘
```

---

## Performance Comparison

```typescript
// ❌ Less efficient: Animated.Value
const { height } = useKeyboardAnimation();
const animatedStyle = {
  transform: [{ translateY: Animated.multiply(height, -1) }],
};

// ✅ More efficient: Reanimated SharedValue
const { height } = useReanimatedKeyboardAnimation();
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: height.value * -1 }],
}));
```

---

**See Also**: [Core API](02-core-api.md) | [Implementation Guides](06-implementation-guides.md)
