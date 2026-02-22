# Gesture Handler: Pan Gesture

**Continuous gesture for drag interactions, swipe detection, and movement tracking.**

---

## Overview

The Pan gesture is a continuous gesture handler that recognizes panning (dragging) and tracks finger movement. It activates when a finger is placed on the screen and moved beyond a minimum distance threshold.

### Creation

```typescript
import { Gesture } from 'react-native-gesture-handler';

const pan = Gesture.Pan();
```

---

## Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `minDistance` | `number \| SharedValue<number>` | `10` | Min finger travel (points) before activation |
| `minPointers` | `number \| SharedValue<number>` | `1` | Min number of fingers required |
| `maxPointers` | `number \| SharedValue<number>` | -- | Max fingers allowed (gesture fails if exceeded) |
| `activeOffsetX` | `number \| [number, number]` | -- | X movement threshold that triggers activation |
| `activeOffsetY` | `number \| [number, number]` | -- | Y movement threshold that triggers activation |
| `failOffsetX` | `number \| [number, number]` | -- | X movement threshold that causes gesture to fail |
| `failOffsetY` | `number \| [number, number]` | -- | Y movement threshold that causes gesture to fail |
| `activateAfterLongPress` | `number \| SharedValue<number>` | -- | Duration (ms) requiring long press before pan activates |
| `averageTouches` | `boolean` | `false` | (Android) Use averaged position of all pointers |
| `enableTrackpadTwoFingerGesture` | `boolean` | `false` | (iOS/Web) Enable two-finger trackpad panning |

### activeOffset and failOffset

These control activation/failure thresholds directionally:

```typescript
// Activate only on horizontal drag (>20px horizontal before vertical gets to 10px)
const horizontalPan = Gesture.Pan()
  .activeOffsetX([-20, 20])  // Activate when X movement exceeds 20px in either direction
  .failOffsetY([-10, 10]);   // Fail if Y movement exceeds 10px first

// Activate only on vertical drag
const verticalPan = Gesture.Pan()
  .activeOffsetY([-20, 20])
  .failOffsetX([-10, 10]);

// Single value means symmetric threshold
const pan = Gesture.Pan()
  .activeOffsetX(20);  // Equivalent to activeOffsetX([-20, 20])
```

---

## Event Data

| Property | Type | Description |
|----------|------|-------------|
| `translationX` | `number` | Accumulated horizontal movement from start point |
| `translationY` | `number` | Accumulated vertical movement from start point |
| `changeX` | `number` | Incremental X movement since last frame |
| `changeY` | `number` | Incremental Y movement since last frame |
| `velocityX` | `number` | Instantaneous horizontal velocity (points/sec) |
| `velocityY` | `number` | Instantaneous vertical velocity (points/sec) |
| `x` | `number` | Current pointer X position relative to view |
| `y` | `number` | Current pointer Y position relative to view |
| `absoluteX` | `number` | Current pointer X position relative to window |
| `absoluteY` | `number` | Current pointer Y position relative to window |
| `numberOfPointers` | `number` | Active finger count |
| `pointerType` | `PointerType` | Device type (TOUCH, STYLUS, MOUSE, etc.) |
| `stylusData` | `StylusData \| undefined` | Stylus metrics (tiltX, tiltY, pressure, etc.) |

---

## Basic Drag Example

```typescript
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

function DraggableBox(): JSX.Element {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onBegin(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedX.value + e.translationX;
      translateY.value = savedY.value + e.translationY;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={pan}>
        <Animated.View style={[styles.box, animatedStyle]} />
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  box: { width: 100, height: 100, backgroundColor: '#E74C3C', borderRadius: 8 },
});
```

---

## Snap-Back Drag (Spring Return)

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function SnapBackDrag(): JSX.Element {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0, { damping: 15, stiffness: 150 });
      translateY.value = withSpring(0, { damping: 15, stiffness: 150 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ width: 80, height: 80, backgroundColor: '#3498DB', borderRadius: 40 }, animatedStyle]} />
    </GestureDetector>
  );
}
```

---

## Horizontal-Only Swipe Detection

Constrain pan to horizontal movement and detect swipe direction:

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

const SWIPE_VELOCITY_THRESHOLD = 500;
const SWIPE_TRANSLATION_THRESHOLD = 100;

function SwipeCard({ onSwipeLeft, onSwipeRight }: {
  onSwipeLeft: () => void;
  onSwipeRight: () => void;
}): JSX.Element {
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .failOffsetY([-10, 10])
    .onUpdate((e) => {
      translateX.value = e.translationX;
    })
    .onEnd((e) => {
      const isSwipeRight =
        e.velocityX > SWIPE_VELOCITY_THRESHOLD ||
        e.translationX > SWIPE_TRANSLATION_THRESHOLD;
      const isSwipeLeft =
        e.velocityX < -SWIPE_VELOCITY_THRESHOLD ||
        e.translationX < -SWIPE_TRANSLATION_THRESHOLD;

      if (isSwipeRight) {
        translateX.value = withTiming(400, { duration: 200 });
        runOnJS(onSwipeRight)();
      } else if (isSwipeLeft) {
        translateX.value = withTiming(-400, { duration: 200 });
        runOnJS(onSwipeLeft)();
      } else {
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        style={[
          { width: 300, height: 200, backgroundColor: '#8E44AD', borderRadius: 16 },
          animatedStyle,
        ]}
      />
    </GestureDetector>
  );
}
```

---

## Constrained Drag (Bounded Movement)

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, clamp } from 'react-native-reanimated';

const BOUNDS = { minX: -150, maxX: 150, minY: -200, maxY: 200 };

function BoundedDrag(): JSX.Element {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedX = useSharedValue(0);
  const savedY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onBegin(() => {
      savedX.value = translateX.value;
      savedY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = clamp(
        savedX.value + e.translationX,
        BOUNDS.minX,
        BOUNDS.maxX
      );
      translateY.value = clamp(
        savedY.value + e.translationY,
        BOUNDS.minY,
        BOUNDS.maxY
      );
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ width: 60, height: 60, backgroundColor: '#F39C12', borderRadius: 30 }, animatedStyle]} />
    </GestureDetector>
  );
}
```

---

## Drag After Long Press

Require a long press before pan activation (useful for reorderable lists):

```typescript
const dragAfterLongPress = Gesture.Pan()
  .activateAfterLongPress(400)
  .onUpdate((e) => {
    translateX.value = e.translationX;
    translateY.value = e.translationY;
  })
  .onEnd(() => {
    translateX.value = withSpring(0);
    translateY.value = withSpring(0);
  });
```

---

## Velocity-Based Animations (Fling Effect)

Use `onEnd` velocity data to create momentum-based animations:

```typescript
import { withDecay } from 'react-native-reanimated';

const pan = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX;
  })
  .onEnd((e) => {
    // Continue movement with deceleration based on release velocity
    translateX.value = withDecay({
      velocity: e.velocityX,
      deceleration: 0.998,
      clamp: [-200, 200],  // Optional bounds
    });
  });
```

---

## Pan vs Scroll Conflict Resolution

When using Pan inside a ScrollView, constrain the pan to prevent scroll conflicts:

```typescript
// Horizontal pan inside a vertical ScrollView
const horizontalPan = Gesture.Pan()
  .activeOffsetX([-15, 15])   // Need 15px horizontal movement to activate
  .failOffsetY([-5, 5]);      // Fail quickly on vertical movement (let scroll handle it)

// Vertical pan inside a horizontal ScrollView
const verticalPan = Gesture.Pan()
  .activeOffsetY([-15, 15])
  .failOffsetX([-5, 5]);
```

---

## Multi-Pointer Pan

Track pan with multiple fingers:

```typescript
const twoFingerPan = Gesture.Pan()
  .minPointers(2)
  .maxPointers(2)
  .onUpdate((e) => {
    // e.translationX/Y reflects averaged movement of both fingers
    translateX.value = e.translationX;
    translateY.value = e.translationY;
  });
```

---

**See Also**: `04-pinch-rotation-gestures.md`, `05-composed-gestures.md`, `06-reanimated-integration.md`
**Source**: https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/use-pan-gesture/
**Version**: 2.x
