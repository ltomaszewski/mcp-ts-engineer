# Gesture Handler Integration & Events

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/2.x/fundamentals/events/  
**Version:** 4.2.1  
**Category:** User Interaction | Gestures

---

## 📋 Overview

Reanimated integrates tightly with **react-native-gesture-handler** for performant gesture-based interactions. Gesture events are handled as worklets, enabling **60 fps animations without blocking UI thread**.

**Key Concepts:**
- `useAnimatedGestureHandler` — Hook for handling gesture events
- **Worklet-based callbacks** — onStart, onActive, onEnd, onFail, onCancel
- **Context object** — Share state between gesture lifecycle events
- **Shared values** — Store gesture state for animations

---

## 🔧 Type Definitions

```typescript
interface AnimatedGestureHandlerEventPayload {
  x: number;
  y: number;
  absoluteX: number;
  absoluteY: number;
  translationX?: number;
  translationY?: number;
  velocityX?: number;
  velocityY?: number;
  // ... other gesture-specific properties
}

function useAnimatedGestureHandler<
  T extends Record<string, any>,
  Context extends Record<string, any>
>(
  handlers: {
    onStart?: (event: T, context: Context) => void;
    onActive?: (event: T, context: Context) => void;
    onEnd?: (event: T, context: Context) => void;
    onFail?: (event: T, context: Context) => void;
    onCancel?: (event: T, context: Context) => void;
  },
  dependencies?: DependencyList
): AnimatedGestureHandler<T>;
```

---

## 🎯 Setup: GestureHandlerRootView

On Android, wrap your app with `GestureHandlerRootView` to capture gesture events:

```javascript
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Your app content */}
    </GestureHandlerRootView>
  );
}
```

**iOS:** Not required, but doesn't hurt.  
**Android:** Required for proper gesture event capture.

---

## 📖 Full API Reference

### `useAnimatedGestureHandler(handlers, dependencies?)`

**Description:** Creates gesture event handlers that execute on the UI thread as worklets.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `handlers` | `Object<Worklet>` | ✅ Yes | Object with callback worklets (onStart, onActive, etc.) |
| `dependencies` | `Dependency[]` | ❌ No | External dependencies (rarely needed) |

**Returns:** `AnimatedGestureHandler<T>` — Pass to gesture handler's `onGestureEvent` prop

---

## 🔳 Gesture Handler Lifecycle

### Tap Gesture Handler

```javascript
import { Gesture } from 'react-native-gesture-handler';
import { useAnimatedGestureHandler, useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import Animated from 'react-native-reanimated';

function TapExample() {
  const isPressed = useSharedValue(false);

  const eventHandler = useAnimatedGestureHandler({
    onStart: (event, context) => {
      'worklet';
      isPressed.value = true;
    },
    onEnd: (event, context) => {
      'worklet';
      isPressed.value = false;
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: isPressed.value ? 0.9 : 1 }],
  }));

  return (
    <TapGestureHandler onGestureEvent={eventHandler}>
      <Animated.View style={[styles.button, animatedStyle]} />
    </TapGestureHandler>
  );
}
```

### Pan Gesture Handler

```javascript
import { PanGestureHandler } from 'react-native-gesture-handler';
import { useAnimatedGestureHandler, useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

function PanExample() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const eventHandler = useAnimatedGestureHandler({
    onStart: (event, context) => {
      'worklet';
      // Save starting position
      context.startX = translateX.value;
      context.startY = translateY.value;
    },
    onActive: (event, context) => {
      'worklet';
      // Update position based on translation
      translateX.value = context.startX + event.translationX;
      translateY.value = context.startY + event.translationY;
    },
    onEnd: (event, context) => {
      'worklet';
      // Handle gesture end (e.g., snap to position)
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <PanGestureHandler onGestureEvent={eventHandler}>
      <Animated.View style={[styles.box, animatedStyle]} />
    </PanGestureHandler>
  );
}
```

---

## 📋 Event Handlers Explained

### onStart

Fired when gesture begins. Used to initialize state.

```javascript
onStart: (event, context) => {
  'worklet';
  // event: Current gesture event data
  // context: Shared object for this gesture instance
  
  context.startValue = sharedValue.value;
  isAnimating.value = true;
}
```

### onActive

Fired continuously during gesture. Used for position tracking.

```javascript
onActive: (event, context) => {
  'worklet';
  // Called multiple times per second
  
  position.value = context.startValue + event.translationX;
}
```

### onEnd

Fired when gesture completes successfully.

```javascript
onEnd: (event, context) => {
  'worklet';
  // Use velocity for momentum animation
  
  const finalPosition = context.startValue + event.translationX;
  position.value = withSpring(finalPosition, { damping: event.velocityX });
}
```

### onFail & onCancel

Fired on gesture failure or cancellation.

```javascript
onFail: (event, context) => {
  'worklet';
  // Reset to previous state
  position.value = context.startValue;
}

onCancel: (event, context) => {
  'worklet';
  // Similar to onFail
  position.value = context.startValue;
}
```

---

## 🧩 Context Object

Share state between handler callbacks:

```javascript
const eventHandler = useAnimatedGestureHandler({
  onStart: (event, context) => {
    'worklet';
    // context is fresh object for each gesture
    context.startX = translateX.value;
    context.startOpacity = opacity.value;
    context.gestureStartTime = Date.now();
  },
  onActive: (event, context) => {
    'worklet';
    // Access previously stored context
    const elapsed = Date.now() - context.gestureStartTime;
    translateX.value = context.startX + event.translationX;
  },
  onEnd: (event, context) => {
    'worklet';
    // Context still available here
    console.log(`Gesture lasted ${Date.now() - context.gestureStartTime}ms`);
  },
});
```

---

## 📊 Common Gesture Patterns

### Swipe to Dismiss

```javascript
import { Gesture } from 'react-native-gesture-handler';
import { withTiming, useAnimatedReaction } from 'react-native-reanimated';

function SwipeToDismiss() {
  const translateX = useSharedValue(0);
  const isDismissed = useSharedValue(false);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      'worklet';
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      'worklet';
      // Dismiss if swiped more than 100 units
      if (Math.abs(event.translationX) > 100) {
        translateX.value = withTiming(
          event.translationX > 0 ? 500 : -500,
          { duration: 300 }
        );
        isDismissed.value = true;
      } else {
        // Snap back
        translateX.value = withTiming(0);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: isDismissed.value ? 0 : 1,
  }));

  return (
    <Gesture.Detector gesture={pan}>
      <Animated.View style={[styles.card, animatedStyle]} />
    </Gesture.Detector>
  );
}
```

### Pinch to Zoom

```javascript
function PinchToZoom() {
  const scale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const eventHandler = useAnimatedGestureHandler({
    onStart: (event, context) => {
      'worklet';
      context.startScale = scale.value;
    },
    onActive: (event, context) => {
      'worklet';
      scale.value = context.startScale * event.scale;
      focalX.value = event.focalX;
      focalY.value = event.focalY;
    },
    onEnd: (event) => {
      'worklet';
      // Clamp scale between 1 and 4
      scale.value = withTiming(
        Math.min(Math.max(scale.value, 1), 4)
      );
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: focalX.value },
      { translateY: focalY.value },
      { scale: scale.value },
      { translateX: -focalX.value },
      { translateY: -focalY.value },
    ],
  }));

  return (
    <PinchGestureHandler onGestureEvent={eventHandler}>
      <Animated.View style={[styles.image, animatedStyle]} />
    </PinchGestureHandler>
  );
}
```

---

## 🔗 Integration with Reanimated Animations

### Using Velocity for Momentum

```javascript
const pan = Gesture.Pan()
  .onEnd((event) => {
    'worklet';
    // Use gesture velocity in animation
    position.value = withSpring(0, {
      damping: 10 + Math.abs(event.velocityX) * 0.01,
      stiffness: 100,
    });
  });
```

### Callback on Gesture End

```javascript
const pan = Gesture.Pan()
  .onEnd((event, success) => {
    'worklet';
    
    opacity.value = withTiming(1, { duration: 300 }, (finished) => {
      if (finished) {
        scheduleOnRN(() => {
          // Update React state or call navigation
        });
      }
    });
  });
```

---

## ⚠️ Important Rules

### Rule 1: Worklet Context in Gesture Handlers

All gesture handler callbacks are automatically worklets:

```javascript
onGestureEvent={(event) => {
  'worklet'; // Optional to mark (already a worklet context)
  // This code runs on UI thread
}}
```

### Rule 2: Use Context for State Sharing

```javascript
// ❌ WRONG: Using external variables
let startX = 0;
const handler = useAnimatedGestureHandler({
  onStart: () => { startX = 10; }, // Unpredictable
  onActive: () => { console.log(startX); },
});

// ✅ CORRECT: Use context object
const handler = useAnimatedGestureHandler({
  onStart: (event, context) => {
    'worklet';
    context.startX = 10; // Reliable per gesture
  },
  onActive: (event, context) => {
    'worklet';
    console.log(context.startX);
  },
});
```

### Rule 3: Update Shared Values in Callbacks

```javascript
// ✅ CORRECT: Modify shared values
const position = useSharedValue(0);
const handler = useAnimatedGestureHandler({
  onActive: (event, context) => {
    'worklet';
    position.value = event.translationX; // Updates shared value
  },
});
```

---

## 🔗 Cross-References

- **Shared Values:** See [02-core-shared-values.md](./02-core-shared-values.md) for storing gesture state
- **useAnimatedStyle:** See [03-core-animated-style.md](./03-core-animated-style.md) to bind gesture data to styles
- **Animations:** See [04-animations-timing-spring.md](./04-animations-timing-spring.md) for momentum/decay
- **Worklets:** See [06-worklets-guide.md](./06-worklets-guide.md) for UI thread execution details

---

## 📚 Official Documentation

- **Events Guide:** https://docs.swmansion.com/react-native-reanimated/docs/2.x/fundamentals/events/
- **Gesture Handler Docs:** https://docs.react-native-gesture-handler.com/
- **useAnimatedGestureHandler Reference:** https://docs.swmansion.com/react-native-reanimated/docs/advanced/useAnimatedGestureHandler/

---

**Last Updated:** December 2024  
**Verified For:** Reanimated 4.2.1
