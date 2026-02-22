# Gesture Handler: Pinch and Rotation Gestures

**Multi-touch gestures for scaling, zooming, and rotating elements with two-finger interactions.**

---

## Pinch Gesture

Recognizes a pinch/zoom gesture by tracking the distance between two fingers. The scale factor starts at `1.0` and adjusts proportionally as finger distance changes.

### Creation

```typescript
import { Gesture } from 'react-native-gesture-handler';

const pinch = Gesture.Pinch();
```

### Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean \| SharedValue<boolean>` | `true` | Enable/disable gesture analysis |
| `manualActivation` | `boolean \| SharedValue<boolean>` | `false` | Prevent auto-activation; use state manager |
| `shouldCancelWhenOutside` | `boolean \| SharedValue<boolean>` | `false` | Stop recognition when fingers leave view |
| `hitSlop` | `HitSlop \| SharedValue<HitSlop>` | -- | Expand activation boundary |
| `cancelsTouchesInView` | `boolean \| SharedValue<boolean>` | `true` | Cancel native UI touches on activation (iOS) |
| `runOnJS` | `boolean \| SharedValue<boolean>` | `false` | Execute callbacks on JS thread |
| `simultaneousWith` | `Gesture \| Gesture[]` | -- | Gestures that can activate simultaneously |
| `requireToFail` | `Gesture \| Gesture[]` | -- | Require other gestures to fail first |
| `block` | `Gesture \| Gesture[]` | -- | Block other gestures until this fails |
| `activeCursor` | `ActiveCursor \| SharedValue<ActiveCursor>` | `'auto'` | CSS cursor during activation (Web) |
| `testID` | `string` | -- | Identifier for testing |

### Event Data

| Property | Type | Description |
|----------|------|-------------|
| `scale` | `number` | Scale factor relative to initial finger distance (starts at 1.0) |
| `scaleChange` | `number` | Incremental scale change since last frame |
| `velocity` | `number` | Rate of scale change (factor per second) |
| `focalX` | `number` | X coordinate of center point between fingers |
| `focalY` | `number` | Y coordinate of center point between fingers |
| `numberOfPointers` | `number` | Active finger count |
| `pointerType` | `PointerType` | Device type (TOUCH, STYLUS, MOUSE, KEY, OTHER) |

### Basic Pinch-to-Zoom

```typescript
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

function PinchZoomBox(): JSX.Element {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={pinch}>
        <Animated.View style={[styles.box, animatedStyle]} />
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  box: { width: 200, height: 200, backgroundColor: '#3498DB', borderRadius: 12 },
});
```

### Pinch with Clamped Scale

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, clamp } from 'react-native-reanimated';

const MIN_SCALE = 0.5;
const MAX_SCALE = 4;

function ClampedPinchZoom(): JSX.Element {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = clamp(savedScale.value * e.scale, MIN_SCALE, MAX_SCALE);
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={pinch}>
      <Animated.View style={[{ width: 200, height: 200, backgroundColor: '#E74C3C' }, animatedStyle]} />
    </GestureDetector>
  );
}
```

### Focal-Point Aware Pinch

Use `focalX`/`focalY` to zoom toward the pinch center point (e.g., for image viewers):

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

function FocalPointZoom(): JSX.Element {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const focalX = useSharedValue(0);
  const focalY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
      focalX.value = e.focalX;
      focalY.value = e.focalY;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: focalX.value },
      { translateY: focalY.value },
      { translateX: -200 / 2 },
      { translateY: -200 / 2 },
      { scale: scale.value },
      { translateX: -focalX.value },
      { translateY: -focalY.value },
      { translateX: 200 / 2 },
      { translateY: 200 / 2 },
    ],
  }));

  return (
    <GestureDetector gesture={pinch}>
      <Animated.View style={[{ width: 200, height: 200, backgroundColor: '#9B59B6' }, animatedStyle]} />
    </GestureDetector>
  );
}
```

**Gotcha**: Only use focal point data after activation (in `onUpdate` or `onActivate`). Values in `onBegin` may be unreliable.

---

## Rotation Gesture

Recognizes a two-finger rotation gesture, tracking the angular movement between two pointers in radians from the gesture's focal point.

### Creation

```typescript
import { Gesture } from 'react-native-gesture-handler';

const rotation = Gesture.Rotation();
```

### Configuration Properties

Same as Pinch gesture (see table above). Both inherit from the base continuous gesture configuration.

### Event Data

| Property | Type | Description |
|----------|------|-------------|
| `rotation` | `number` | Accumulated rotation in radians from start |
| `rotationChange` | `number` | Incremental rotation change since last frame (radians) |
| `velocity` | `number` | Instantaneous angular velocity (radians per second) |
| `anchorX` | `number` | X coordinate of rotation center (focal point) |
| `anchorY` | `number` | Y coordinate of rotation center (focal point) |
| `numberOfPointers` | `number` | Active finger count |
| `pointerType` | `PointerType` | Device type (TOUCH, STYLUS, MOUSE, KEY, OTHER) |

### Basic Rotation

```typescript
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

function RotatableBox(): JSX.Element {
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  const rotateGesture = Gesture.Rotation()
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotateZ: `${(rotation.value / Math.PI) * 180}deg` }],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={rotateGesture}>
        <Animated.View style={[styles.box, animatedStyle]} />
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  box: { width: 150, height: 150, backgroundColor: '#2ECC71', borderRadius: 8 },
});
```

### Rotation with Snap-to-Grid

```typescript
const SNAP_ANGLE = Math.PI / 4; // 45 degrees

const rotateGesture = Gesture.Rotation()
  .onUpdate((e) => {
    rotation.value = savedRotation.value + e.rotation;
  })
  .onEnd(() => {
    // Snap to nearest 45-degree increment
    const snapped = Math.round(rotation.value / SNAP_ANGLE) * SNAP_ANGLE;
    rotation.value = withSpring(snapped);
    savedRotation.value = snapped;
  });
```

---

## Simultaneous Pinch + Rotation

The most common multi-touch pattern -- allows users to zoom and rotate at the same time (e.g., photo editors, map views).

```typescript
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

function PinchRotateView(): JSX.Element {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => {
      scale.value = savedScale.value * e.scale;
    })
    .onEnd(() => {
      savedScale.value = scale.value;
    });

  const rotate = Gesture.Rotation()
    .onUpdate((e) => {
      rotation.value = savedRotation.value + e.rotation;
    })
    .onEnd(() => {
      savedRotation.value = rotation.value;
    });

  const composed = Gesture.Simultaneous(pinch, rotate);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${(rotation.value / Math.PI) * 180}deg` },
    ],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[styles.box, animatedStyle]} />
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  box: { width: 200, height: 200, backgroundColor: '#007AFF', borderRadius: 12 },
});
```

---

## Simultaneous Pinch + Rotation + Pan (Full Transform)

Complete image manipulation with zoom, rotate, and drag:

```typescript
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
} from 'react-native-reanimated';

function FullTransformView(): JSX.Element {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const savedTranslateX = useSharedValue(0);
  const savedTranslateY = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = savedScale.value * e.scale; })
    .onEnd(() => { savedScale.value = scale.value; });

  const rotate = Gesture.Rotation()
    .onUpdate((e) => { rotation.value = savedRotation.value + e.rotation; })
    .onEnd(() => { savedRotation.value = rotation.value; });

  const pan = Gesture.Pan()
    .minPointers(2)
    .onBegin(() => {
      savedTranslateX.value = translateX.value;
      savedTranslateY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = savedTranslateX.value + e.translationX;
      translateY.value = savedTranslateY.value + e.translationY;
    });

  const composed = Gesture.Simultaneous(pinch, rotate, pan);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { scale: scale.value },
      { rotateZ: `${(rotation.value / Math.PI) * 180}deg` },
    ],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <GestureDetector gesture={composed}>
        <Animated.View style={[{ width: 250, height: 250, backgroundColor: '#E67E22' }, animatedStyle]} />
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
```

---

## Gotchas and Edge Cases

- **Pinch scale is multiplicative**: Always multiply by the saved base scale (`savedScale * e.scale`), never add
- **Rotation is in radians**: Convert to degrees for `rotateZ` with `(radians / Math.PI) * 180`
- **Focal point data**: Only reliable in `onUpdate`/`onActivate`, not in `onBegin`
- **Two fingers required**: Both Pinch and Rotation require exactly 2 pointers; they will not activate with a single finger
- **Simultaneous composition**: When combining Pinch + Rotation, always use `Gesture.Simultaneous()` -- otherwise they will race and only one will activate
- **Transform order matters**: In `useAnimatedStyle`, the order of transforms affects the visual result (translate before scale/rotate vs after gives different outcomes)

---

**See Also**: `03-pan-gesture.md`, `05-composed-gestures.md`, `06-reanimated-integration.md`
**Source**: https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/use-pinch-gesture/, https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/use-rotation-gesture/
**Version**: 2.x
