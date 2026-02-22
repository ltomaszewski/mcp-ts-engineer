---
name: gesture-handler
description: React Native Gesture Handler v2.x - Pan, Pinch, Tap, LongPress, Fling, Rotation, Hover, composed gestures, GestureDetector, Reanimated integration. Use when implementing touch gestures, swipe interactions, drag-and-drop, or gesture-driven animations.
---

# Gesture Handler

> Native-driven gesture recognition for React Native with declarative API and Reanimated integration.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Implementing touch gestures (tap, long press, swipe, drag, pinch, rotate)
- Building drag-and-drop or swipeable list interactions
- Composing multiple gestures (simultaneous pan+pinch, exclusive tap/double-tap)
- Integrating gesture callbacks with Reanimated shared values for smooth animations
- Replacing React Native core Touchable/Pressable with native gesture components

---

## Critical Rules

**ALWAYS:**
1. Wrap the app root with `GestureHandlerRootView` -- gestures will not work outside it, and gesture relations only function between gestures under the same root
2. Use `Gesture.Pan()` / `Gesture.Tap()` builder API with `GestureDetector` -- this is the v2 API; legacy handler components are deprecated
3. Pair gesture callbacks with Reanimated `useSharedValue` for UI-thread animations -- avoids JS bridge overhead for smooth 60fps interactions

**NEVER:**
1. Reuse the same gesture instance across multiple `GestureDetector` components -- causes undefined behavior per official docs
2. Use deprecated handler components (`PanGestureHandler`, `TapGestureHandler`) -- use `Gesture.Pan()`, `Gesture.Tap()` with `GestureDetector` instead

---

## Core Patterns

### Basic Tap Gesture

```typescript
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { View } from 'react-native';

function TapExample(): JSX.Element {
  const tap = Gesture.Tap().onActivate(() => {
    console.log('Tapped!');
  });

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={tap}>
        <View style={{ width: 100, height: 100, backgroundColor: 'blue' }} />
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
```

### Draggable Element with Pan + Reanimated

```typescript
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function DraggableBox(): JSX.Element {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const context = useSharedValue({ x: 0, y: 0 });

  const pan = Gesture.Pan()
    .onBegin(() => {
      context.value = { x: translateX.value, y: translateY.value };
    })
    .onUpdate((e) => {
      translateX.value = context.value.x + e.translationX;
      translateY.value = context.value.y + e.translationY;
    })
    .onEnd(() => {
      translateX.value = withSpring(0);
      translateY.value = withSpring(0);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
    ],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[{ width: 100, height: 100, backgroundColor: 'red' }, animatedStyle]} />
    </GestureDetector>
  );
}
```

### Simultaneous Pinch + Rotation

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

function PinchRotate(): JSX.Element {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);
  const rotation = useSharedValue(0);
  const savedRotation = useSharedValue(0);

  const pinch = Gesture.Pinch()
    .onUpdate((e) => { scale.value = savedScale.value * e.scale; })
    .onEnd(() => { savedScale.value = scale.value; });

  const rotate = Gesture.Rotation()
    .onUpdate((e) => { rotation.value = savedRotation.value + e.rotation; })
    .onEnd(() => { savedRotation.value = rotation.value; });

  const composed = Gesture.Simultaneous(pinch, rotate);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { scale: scale.value },
      { rotateZ: `${(rotation.value / Math.PI) * 180}deg` },
    ],
  }));

  return (
    <GestureDetector gesture={composed}>
      <Animated.View style={[{ width: 200, height: 200, backgroundColor: '#007AFF' }, animatedStyle]} />
    </GestureDetector>
  );
}
```

### Exclusive Single-Tap vs Double-Tap

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function TapPriority(): JSX.Element {
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .onActivate(() => { console.log('Double tap'); });

  const singleTap = Gesture.Tap()
    .onActivate(() => { console.log('Single tap'); });

  // doubleTap has higher priority; singleTap activates only after doubleTap fails
  const composed = Gesture.Exclusive(doubleTap, singleTap);

  return (
    <GestureDetector gesture={composed}>
      <View style={{ width: 100, height: 100, backgroundColor: 'green' }} />
    </GestureDetector>
  );
}
```

---

## Anti-Patterns

```typescript
// BAD: Reusing gesture instance across detectors
const tap = Gesture.Tap().onActivate(() => {});
<GestureDetector gesture={tap}><ViewA /></GestureDetector>
<GestureDetector gesture={tap}><ViewB /></GestureDetector>
// Undefined behavior -- each detector needs its own gesture instance

// GOOD: Create separate gesture instances
const tapA = Gesture.Tap().onActivate(() => {});
const tapB = Gesture.Tap().onActivate(() => {});
<GestureDetector gesture={tapA}><ViewA /></GestureDetector>
<GestureDetector gesture={tapB}><ViewB /></GestureDetector>
```

```typescript
// BAD: Missing GestureHandlerRootView
export default function App() {
  return <GestureDetector gesture={pan}><Animated.View /></GestureDetector>;
}

// GOOD: Root view wraps entire app
export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <GestureDetector gesture={pan}><Animated.View /></GestureDetector>
    </GestureHandlerRootView>
  );
}
```

```typescript
// BAD: Using React state in gesture callbacks (causes JS bridge overhead)
const [x, setX] = useState(0);
const pan = Gesture.Pan().onUpdate((e) => { setX(e.translationX); });

// GOOD: Using shared values for UI-thread performance
const x = useSharedValue(0);
const pan = Gesture.Pan().onUpdate((e) => { x.value = e.translationX; });
```

---

## Quick Reference

| Task | API | Key Config |
|------|-----|------------|
| Single tap | `Gesture.Tap()` | `numberOfTaps(1)` |
| Double tap | `Gesture.Tap().numberOfTaps(2)` | `maxDelay(500)` |
| Long press | `Gesture.LongPress()` | `minDuration(500)` |
| Drag / pan | `Gesture.Pan()` | `minDistance`, `activeOffsetX/Y` |
| Pinch zoom | `Gesture.Pinch()` | scale event data |
| Rotation | `Gesture.Rotation()` | rotation in radians |
| Swipe / fling | `Gesture.Fling()` | `direction(Directions.RIGHT)` |
| Hover (pointer/web) | `Gesture.Hover()` | `effect(HoverEffect.LIFT)` (iOS only) |
| Race (first wins) | `Gesture.Race(g1, g2)` | First to activate cancels others |
| Simultaneous | `Gesture.Simultaneous(g1, g2)` | All can be active at once |
| Exclusive (priority) | `Gesture.Exclusive(g1, g2)` | First arg = highest priority |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation, GestureHandlerRootView, states, callbacks | `01-setup-and-basics.md` |
| Tap, LongPress, Fling gesture details | `02-tap-and-press-gestures.md` |
| Pan gesture, drag, swipe detection | `03-pan-gesture.md` |
| Pinch zoom, Rotation, multi-touch | `04-pinch-rotation-gestures.md` |
| Race, Simultaneous, Exclusive compositions | `05-composed-gestures.md` |
| Reanimated integration, worklet callbacks | `06-reanimated-integration.md` |
| Pressable, Buttons, Swipeable, DrawerLayout, testing | `07-components-and-testing.md` |

---

**Version:** 2.x (^2.30.0) | **Source:** https://docs.swmansion.com/react-native-gesture-handler/
