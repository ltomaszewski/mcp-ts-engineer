# Gesture Handler: Tap, LongPress, and Fling Gestures

**Discrete gesture types for taps, long presses, and swipe/fling detection.**

---

## Tap Gesture

Recognizes one or more fingers briefly touching the screen without significant movement.

### Creation

```typescript
import { Gesture } from 'react-native-gesture-handler';

const tap = Gesture.Tap();
```

### Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `numberOfTaps` | `number \| SharedValue<number>` | `1` | Number of taps required to activate |
| `maxDuration` | `number \| SharedValue<number>` | `500` | Max time (ms) a finger can be held down |
| `maxDelay` | `number \| SharedValue<number>` | `500` | Max time (ms) between successive taps |
| `maxDistance` | `number \| SharedValue<number>` | -- | Max distance finger can travel |
| `maxDeltaX` | `number \| SharedValue<number>` | -- | Max horizontal travel distance |
| `maxDeltaY` | `number \| SharedValue<number>` | -- | Max vertical travel distance |
| `minPointers` | `number \| SharedValue<number>` | `1` | Min number of fingers required |

### Event Data

| Property | Type | Description |
|----------|------|-------------|
| `x` | `number` | X position relative to attached view |
| `y` | `number` | Y position relative to attached view |
| `absoluteX` | `number` | X position relative to window |
| `absoluteY` | `number` | Y position relative to window |
| `numberOfPointers` | `number` | Current finger count on screen |
| `pointerType` | `PointerType` | TOUCH, STYLUS, MOUSE, KEY, or OTHER |

### Single Tap Example

```typescript
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import { View, Text, StyleSheet } from 'react-native';
import { useSharedValue } from 'react-native-reanimated';

function SingleTapExample(): JSX.Element {
  const tapCount = useSharedValue(0);

  const singleTap = Gesture.Tap()
    .maxDuration(250)
    .onActivate((e) => {
      tapCount.value += 1;
      console.log(`Tap at (${e.x}, ${e.y}), total: ${tapCount.value}`);
    });

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={singleTap}>
        <View style={styles.box}>
          <Text>Tap Me</Text>
        </View>
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  box: { width: 150, height: 150, backgroundColor: '#4A90D9', justifyContent: 'center', alignItems: 'center' },
});
```

### Double Tap Example

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function DoubleTapZoom(): JSX.Element {
  const scale = useSharedValue(1);

  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(300)
    .onActivate(() => {
      scale.value = scale.value === 1 ? withSpring(2) : withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={doubleTap}>
      <Animated.View style={[{ width: 200, height: 200, backgroundColor: '#50C878' }, animatedStyle]} />
    </GestureDetector>
  );
}
```

### Two-Finger Tap

```typescript
const twoFingerTap = Gesture.Tap()
  .minPointers(2)
  .onActivate(() => {
    console.log('Two-finger tap detected');
  });
```

---

## LongPress Gesture

Activates when a view is pressed for a sufficiently long duration without significant movement.

### Creation

```typescript
const longPress = Gesture.LongPress();
```

### Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `minDuration` | `number \| SharedValue<number>` | `500` | Minimum press duration in ms |
| `maxDistance` | `number \| SharedValue<number>` | `10` | Max finger travel distance (points) |

### Event Data

| Property | Type | Description |
|----------|------|-------------|
| `x`, `y` | `number` | Position relative to attached view |
| `absoluteX`, `absoluteY` | `number` | Position relative to window |
| `duration` | `number` | Milliseconds elapsed since press start |
| `numberOfPointers` | `number` | Active finger count |
| `pointerType` | `PointerType` | Device type |

### LongPress Example

```typescript
import { GestureDetector, Gesture, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

function LongPressExample(): JSX.Element {
  const bgColor = useSharedValue('#3498DB');
  const scaleVal = useSharedValue(1);

  const longPress = Gesture.LongPress()
    .minDuration(800)
    .maxDistance(15)
    .onBegin(() => {
      scaleVal.value = withTiming(1.1, { duration: 200 });
    })
    .onActivate((e) => {
      bgColor.value = '#E74C3C';
      console.log(`Long pressed for ${e.duration}ms`);
    })
    .onFinalize((_e, success) => {
      scaleVal.value = withTiming(1, { duration: 200 });
      if (!success) {
        bgColor.value = '#3498DB';
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: bgColor.value,
    transform: [{ scale: scaleVal.value }],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <GestureDetector gesture={longPress}>
        <Animated.View style={[styles.box, animatedStyle]} />
      </GestureDetector>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  box: { width: 150, height: 150, borderRadius: 12 },
});
```

### LongPress with Haptic Feedback Pattern

```typescript
import * as Haptics from 'expo-haptics';

const longPress = Gesture.LongPress()
  .minDuration(500)
  .runOnJS(true)  // Haptics must run on JS thread
  .onActivate(() => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    // Show context menu or perform action
  });
```

---

## Fling Gesture

Detects a quick, sufficiently long movement in a specified direction. Discrete gesture -- activates once upon recognition, ends when finger lifts.

### Creation

```typescript
import { Gesture, Directions } from 'react-native-gesture-handler';

const fling = Gesture.Fling();
```

### Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `direction` | `Directions \| SharedValue<Directions>` | -- | Required movement direction(s) |
| `numberOfPointers` | `number \| SharedValue<number>` | `1` | Exact finger count required |

### Directions Enum

```typescript
import { Directions } from 'react-native-gesture-handler';

Directions.RIGHT  // 1
Directions.LEFT   // 2
Directions.UP     // 4
Directions.DOWN   // 8

// Combine with bitwise OR
const horizontalFling = Directions.RIGHT | Directions.LEFT;
```

### Event Data

| Property | Type | Description |
|----------|------|-------------|
| `x`, `y` | `number` | Position relative to attached view |
| `absoluteX`, `absoluteY` | `number` | Position relative to window |
| `numberOfPointers` | `number` | Finger count |
| `pointerType` | `PointerType` | Device type |

### Fling to Dismiss Example

```typescript
import { GestureDetector, Gesture, Directions, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  runOnJS,
} from 'react-native-reanimated';

function FlingDismissCard(): JSX.Element {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const flingRight = Gesture.Fling()
    .direction(Directions.RIGHT)
    .onActivate(() => {
      translateX.value = withTiming(400, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    });

  const flingLeft = Gesture.Fling()
    .direction(Directions.LEFT)
    .onActivate(() => {
      translateX.value = withTiming(-400, { duration: 300 });
      opacity.value = withTiming(0, { duration: 300 });
    });

  const composed = Gesture.Race(flingRight, flingLeft);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <GestureDetector gesture={composed}>
        <Animated.View
          style={[
            { width: 300, height: 200, backgroundColor: '#9B59B6', borderRadius: 12 },
            animatedStyle,
          ]}
        />
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
```

### Multi-Direction Fling

```typescript
const anyHorizontalFling = Gesture.Fling()
  .direction(Directions.LEFT | Directions.RIGHT)
  .onActivate(() => {
    console.log('Horizontal fling detected');
  });
```

---

## Combining Tap Gestures: Exclusive Composition

The most common pattern for handling both single and double taps on the same view:

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function TapCombination(): JSX.Element {
  const doubleTap = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(300)
    .onActivate(() => {
      console.log('Double tap');
    });

  const singleTap = Gesture.Tap()
    .onActivate(() => {
      console.log('Single tap');
    });

  // doubleTap checked first; singleTap fires only after doubleTap fails
  const exclusive = Gesture.Exclusive(doubleTap, singleTap);

  return (
    <GestureDetector gesture={exclusive}>
      <View style={{ width: 200, height: 200, backgroundColor: '#2ECC71' }} />
    </GestureDetector>
  );
}
```

**Gotcha**: Without `Gesture.Exclusive`, both gestures would race and single tap would fire on the first tap of a double-tap sequence.

---

## Tap + LongPress on Same View

```typescript
const tap = Gesture.Tap().onActivate(() => {
  console.log('Quick tap');
});

const longPress = Gesture.LongPress()
  .minDuration(600)
  .onActivate(() => {
    console.log('Long press -- show context menu');
  });

// Race: whichever activates first wins; the other is cancelled
const composed = Gesture.Race(longPress, tap);
```

---

**See Also**: `03-pan-gesture.md`, `05-composed-gestures.md`
**Source**: https://docs.swmansion.com/react-native-gesture-handler/docs/gestures/use-tap-gesture/
**Version**: 2.x
