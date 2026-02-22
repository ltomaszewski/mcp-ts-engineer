# Gesture Handler: Composed Gestures

**Race, Simultaneous, and Exclusive gesture compositions for multi-gesture interactions.**

---

## Overview

Composed gestures define relationships between multiple gestures attached to the same `GestureDetector`. They control which gestures can activate concurrently and how conflicts are resolved.

All composed gestures accept any combination of base gestures (`Tap`, `Pan`, `LongPress`, `Fling`, `Pinch`, `Rotation`, `ForceTouch`) and other composed gestures (nesting is supported).

---

## Gesture.Race

Only one gesture can become active. The first gesture to activate cancels all others.

### Behavior

1. All provided gestures begin tracking touches simultaneously
2. When any gesture's activation criteria are met, it transitions to ACTIVE
3. All other gestures are immediately CANCELLED

### When to Use

- Tap vs LongPress on the same element (whichever triggers first wins)
- Pan vs Fling (swipe detection vs continuous drag)
- Any scenario where gestures are mutually exclusive but have different activation timing

### Example: Tap vs LongPress Race

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { View } from 'react-native';

function TapOrLongPress(): JSX.Element {
  const tap = Gesture.Tap()
    .onActivate(() => {
      console.log('Quick tap -- navigate');
    });

  const longPress = Gesture.LongPress()
    .minDuration(600)
    .onActivate(() => {
      console.log('Long press -- show context menu');
    });

  const composed = Gesture.Race(tap, longPress);

  return (
    <GestureDetector gesture={composed}>
      <View style={{ width: 200, height: 100, backgroundColor: '#3498DB' }} />
    </GestureDetector>
  );
}
```

### Example: Pan vs Fling Race

```typescript
import { Gesture, GestureDetector, Directions } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

function PanOrFling(): JSX.Element {
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd(() => {
      translateX.value = withTiming(0);
    });

  const fling = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onActivate(() => {
      translateX.value = withTiming(300, { duration: 200 });
    });

  const composed = Gesture.Race(pan, fling);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width: 100, height: 100, backgroundColor: '#E74C3C' }, animatedStyle]} />
    </GestureDetector>
  );
}
```

---

## Gesture.Simultaneous

All provided gestures can be active at the same time. Activation of one does not cancel the others.

### Behavior

1. All gestures begin tracking touches
2. Each gesture activates independently when its criteria are met
3. Multiple gestures can be in the ACTIVE state concurrently

### When to Use

- Pinch + Rotation for image manipulation
- Pinch + Rotation + Pan for full transform control
- Any scenario where gestures must operate together on the same view

### Example: Simultaneous Pinch + Pan

```typescript
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

function ZoomAndPan(): JSX.Element {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const pan = Gesture.Pan()
    .onBegin(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    });

  const composed = Gesture.Simultaneous(pinch, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[{ width: 200, height: 200, backgroundColor: '#2ECC71' }, animatedStyle]} />
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
```

---

## Gesture.Exclusive

Only one gesture can become active, with priority determined by argument order (first argument = highest priority). Lower-priority gestures wait for higher-priority ones to fail before activating.

### Behavior

1. All gestures begin tracking touches
2. When a lower-priority gesture's activation criteria are met, it waits (instead of activating)
3. It waits until the higher-priority gesture either:
   - **Fails** -- then the lower-priority gesture activates
   - **Activates** -- then the lower-priority gesture is cancelled

### When to Use

- Single tap vs double tap (double tap has higher priority)
- Tap vs triple tap vs double tap (ascending priority)
- Any scenario with overlapping activation criteria where one gesture must take precedence

### Example: Single Tap vs Double Tap

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function ExclusiveTaps(): JSX.Element {
  const scale = useSharedValue(1);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(300)
    .onActivate(() => {
      // Toggle between 1x and 2x zoom
      scale.value = scale.value > 1 ? withSpring(1) : withSpring(2);
    });

  const singleTap = Gesture.Tap()
    .onActivate(() => {
      console.log('Single tap -- toggle controls');
    });

  // doubleTap has highest priority; singleTap waits for doubleTap to fail
  const composed = Gesture.Exclusive(doubleTap, singleTap);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width: 200, height: 200, backgroundColor: '#9B59B6' }, animatedStyle]} />
    </GestureDetector>
  );
}
```

**Gotcha**: Without `Gesture.Exclusive`, the single tap would fire on the first tap of a double-tap sequence, because its activation criteria are met first.

### Example: Triple, Double, and Single Tap

```typescript
const tripleTap = Gesture.Tap()
  .numberOfTaps(3)
  .maxDelay(300)
  .onActivate(() => { console.log('Triple tap -- select paragraph'); });

const doubleTap = Gesture.Tap()
  .numberOfTaps(2)
  .maxDelay(300)
  .onActivate(() => { console.log('Double tap -- select word'); });

const singleTap = Gesture.Tap()
  .onActivate(() => { console.log('Single tap -- place cursor'); });

// Priority order: triple > double > single
const composed = Gesture.Exclusive(tripleTap, doubleTap, singleTap);
```

---

## Nesting Composed Gestures

Composed gestures can be nested to build complex interaction patterns:

```typescript
// Pinch + Rotation happen simultaneously
const pinchRotate = Gesture.Simultaneous(pinch, rotate);

// Pan competes with pinch-rotate (first to activate wins)
const full = Gesture.Race(pan, pinchRotate);

// Or the inverse: all three simultaneous
const allSimultaneous = Gesture.Simultaneous(pinch, rotate, pan);
```

---

## Cross-Component Gesture Relations

For gestures on **different** `GestureDetector` components (or in different components entirely), use relation methods instead of composed gestures:

### simultaneousWith

Both gestures can be active at the same time across different detectors.

```typescript
const innerPan = Gesture.Pan().onUpdate((e) => { /* ... */ });
const outerPan = Gesture.Pan()
  .simultaneousWith(innerPan)
  .onUpdate((e) => { /* ... */ });
```

### requireToFail

This gesture waits for the specified gesture to fail before activating. Establishes a one-to-many relationship.

```typescript
const doubleTap = Gesture.Tap().numberOfTaps(2).onActivate(() => { /* ... */ });
const singleTap = Gesture.Tap()
  .requireToFail(doubleTap)
  .onActivate(() => { /* ... */ });
```

### block

Prevents the specified gesture from activating while this gesture has not yet failed. Reverse of `requireToFail` (many-to-one).

```typescript
const pinch = Gesture.Pinch()
  .block(scrollGesture)
  .onUpdate((e) => { /* ... */ });
```

### When to Use Which

| Scenario | Use |
|----------|-----|
| Gestures on same `GestureDetector` | `Gesture.Race`, `Gesture.Simultaneous`, `Gesture.Exclusive` |
| Gestures on different `GestureDetector`s | `.simultaneousWith()`, `.requireToFail()`, `.block()` |
| Gestures in different components | `.simultaneousWith()`, `.requireToFail()`, `.block()` |

---

## Common Composition Patterns

| Pattern | Composition | Use Case |
|---------|------------|----------|
| Single vs double tap | `Exclusive(doubleTap, singleTap)` | Photo viewer toggle/zoom |
| Tap vs long press | `Race(tap, longPress)` | List item action |
| Pinch + rotate | `Simultaneous(pinch, rotate)` | Image editor |
| Pinch + rotate + pan | `Simultaneous(pinch, rotate, pan)` | Map/photo manipulation |
| Left fling vs right fling | `Race(flingLeft, flingRight)` | Card dismiss |
| Drag vs fling | `Race(pan, fling)` | Swipeable row |

---

## Gotchas

- **Argument order matters for Exclusive**: First argument has highest priority, last has lowest
- **Argument order does NOT matter for Race or Simultaneous**: All gestures are treated equally
- **Nesting depth**: Deeply nested compositions work but are harder to debug -- keep it flat when possible
- **Each gesture instance is single-use**: Never share the same gesture object across multiple composed gestures or detectors
- **State propagation**: When a composed gesture cancels a child gesture, the child receives `onFinalize(e, false)`

---

**See Also**: `01-setup-and-basics.md`, `04-pinch-rotation-gestures.md`, `06-reanimated-integration.md`
**Source**: https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/gesture-composition/
**Version**: 2.x
