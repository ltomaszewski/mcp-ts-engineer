# Worklets and Threading Model

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets/

---

## Overview

Worklets are JavaScript functions that execute on the UI Runtime (native thread) instead of the JS Runtime. This enables 60/120 fps animations without blocking React renders. In Reanimated 4, worklet compilation moved from a Babel plugin to the `react-native-worklets` package.

---

## Defining Worklets

Mark any function with the `'worklet'` directive at the very beginning of the function body:

```typescript
function myWorklet(a: number, b: number): number {
  'worklet';
  return a + b;
}
```

### Automatic Workletization

Most Reanimated hooks auto-workletize their callbacks. The `'worklet'` directive is implicit:

```typescript
// useAnimatedStyle callback runs on UI thread automatically
const animatedStyle = useAnimatedStyle(() => {
  return { opacity: 0.5 }; // UI thread, no explicit 'worklet' needed
});

// Gesture Handler v2 callbacks are auto-workletized
const pan = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX; // UI thread automatically
  });
```

### Manual Worklets

Custom functions need the explicit directive:

```typescript
function clampValue(value: number, min: number, max: number): number {
  'worklet';
  return Math.min(Math.max(value, min), max);
}

// Can be called from other worklets
const animatedStyle = useAnimatedStyle(() => {
  return { opacity: clampValue(progress.value, 0, 1) };
});
```

---

## scheduleOnUI (was runOnUI in v3)

Execute a worklet on the UI thread from the JS thread.

```typescript
import { scheduleOnUI } from 'react-native-reanimated';

function myWorklet(name: string) {
  'worklet';
  console.log('Running on UI thread:', name);
}

// v4 syntax: arguments passed directly
function onButtonPress() {
  scheduleOnUI(myWorklet, 'John');
}

// v3 syntax (removed): runOnUI(myWorklet)('John')
```

---

## scheduleOnRN (was runOnJS in v3)

Execute a regular JS function from a worklet (switch from UI thread to JS thread).

```typescript
import { scheduleOnRN } from 'react-native-reanimated';
import { router } from 'expo-router';

function handleNavigation() {
  'worklet';
  // Cannot call router.back() directly on UI thread
  scheduleOnRN(() => {
    router.back();
  });
}
```

### Gesture Handler with Navigation

```typescript
import { Gesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-reanimated';

function SwipeToDismiss({ onDismiss }: { onDismiss: () => void }) {
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      if (Math.abs(e.translationX) > 150) {
        // Switch to JS thread for navigation/state update
        scheduleOnRN(onDismiss);
      } else {
        translateX.value = withSpring(0);
      }
    });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={animatedStyle} />
    </GestureDetector>
  );
}
```

### Critical Constraint

Functions passed to `scheduleOnRN` must be defined in JS thread scope:

```typescript
function Component() {
  // GOOD: Function defined in component scope (JS thread)
  const handleDismiss = () => {
    router.back();
  };

  const pan = Gesture.Pan().onEnd(() => {
    'worklet';
    scheduleOnRN(handleDismiss); // OK: JS-scope function
  });

  // BAD: Function defined inside worklet
  const badPan = Gesture.Pan().onEnd(() => {
    'worklet';
    const localFn = () => console.log('bad');
    scheduleOnRN(localFn); // CRASH: not in JS scope
  });
}
```

---

## Closure Capturing

Worklets capture variables referenced in their body. Only referenced variables are copied to the UI thread.

### Selective Capture

```typescript
const width = 135.5;        // Captured (referenced)
const height = 200;         // NOT captured (not referenced)
const color = 'red';        // Captured (referenced)

function myWorklet() {
  'worklet';
  console.log('Width:', width);
  console.log('Color:', color);
  // height not accessed, not captured
}
```

### Performance: Extract Properties

```typescript
const theme = {
  color: 'red',
  fontSize: 16,
  padding: 10,
  // ... 50 more properties
};

// BAD: Captures entire theme object
function badWorklet() {
  'worklet';
  console.log(theme.color); // All of theme copied to UI thread
}

// GOOD: Extract only needed value
const themeColor = theme.color;
function goodWorklet() {
  'worklet';
  console.log(themeColor); // Only string 'red' captured
}
```

---

## useFrameCallback

Execute code on every frame (60/120 fps).

```typescript
function useFrameCallback(
  callback: (info: FrameInfo) => void,
  autostart?: boolean
): FrameCallback;

interface FrameInfo {
  timestamp: number;               // ms since start
  timeSincePreviousFrame: number;  // ms since last frame
}

interface FrameCallback {
  setActive: (active: boolean) => void;
}
```

```typescript
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

const position = useSharedValue(0);
const velocity = useSharedValue(100); // pixels per second

useFrameCallback(({ timeSincePreviousFrame }) => {
  'worklet';
  position.value += velocity.value * (timeSincePreviousFrame / 1000);
}, true); // autostart = true
```

---

## Thread Comparison

| Aspect | JS Runtime | UI Runtime (Worklet) |
|---|---|---|
| Thread | JavaScript thread | Native/UI thread |
| FPS impact | Can block renders | Never blocks React |
| React access | Full (state, context, hooks) | None |
| setState | Yes | No (use scheduleOnRN) |
| Navigation | Direct | Via scheduleOnRN |
| Available APIs | All JS APIs | Limited (no setTimeout, fetch, etc.) |
| Use case | Event handlers, state management | Animation calculations |

---

## Hoisting Rules

Worklet functions are NOT hoisted:

```typescript
// GOOD: Define before use
function myWorklet() {
  'worklet';
  return 42;
}
useAnimatedStyle(() => myWorklet()); // Works

// BAD: Use before definition
useAnimatedStyle(() => laterWorklet()); // ReferenceError
function laterWorklet() {
  'worklet';
  return 42;
}
```

---

## Custom Worklet Runtimes

For advanced use cases (e.g., camera frame processing):

```typescript
import { createWorkletRuntime } from 'react-native-worklets';

const customRuntime = createWorkletRuntime('CustomRuntime');

function processFrame() {
  'worklet';
  // Runs in custom runtime, not UI runtime
}
```

---

## Web Support

On web, there is no separate UI thread. Worklets execute as regular JavaScript functions. The `'worklet'` directive is still required for dependency tracking by the Worklets plugin.

```typescript
function myWorklet() {
  'worklet';
  // Native: executes on UI thread
  // Web: executes as regular JS function
  return 42;
}
```

---

## Worklet Anti-Patterns

| Anti-Pattern | Problem | Solution |
|---|---|---|
| Accessing React context | Not available on UI thread | Use shared values |
| Calling setState | Cannot update React state | Use scheduleOnRN |
| Using setTimeout | Not available on UI Runtime | Use withTiming or useFrameCallback |
| Large object capture | Memory overhead | Extract properties first |
| Mutating shared value in useAnimatedStyle | Infinite loop risk | Mutate only in event handlers |
| Using before definition | Worklets not hoisted | Define before use |
| Defining scheduleOnRN callback inside worklet | Function not in JS scope | Define in component scope |

---

## Cross-References

- **useAnimatedStyle:** [03-core-animated-style.md](03-core-animated-style.md)
- **Gesture handlers:** [07-gestures-events.md](07-gestures-events.md)
- **Shared values:** [02-core-shared-values.md](02-core-shared-values.md)
- **Best practices:** [09-best-practices.md](09-best-practices.md)

---
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets/ | https://docs.swmansion.com/react-native-reanimated/docs/core/useFrameCallback/
