# Animation Modifiers: withSequence, withRepeat, withDelay, withDecay

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/animations/withSequence/ | https://docs.swmansion.com/react-native-reanimated/docs/animations/withRepeat/ | https://docs.swmansion.com/react-native-reanimated/docs/animations/withDelay/ | https://docs.swmansion.com/react-native-reanimated/docs/animations/withDecay/

---

## Overview

Modifier functions combine and chain animations:
- **`withSequence`** -- run animations one after another
- **`withRepeat`** -- loop animations with optional reversal
- **`withDelay`** -- add a delay before an animation starts
- **`withDecay`** -- physics-based momentum (gesture fling)

---

## withSequence

Run multiple animations sequentially. Each completes before the next begins.

```typescript
function withSequence(...animations: AnimationObject[]): AnimationObject;
```

### Basic Usage

```typescript
import { withSequence, withTiming, withSpring, useSharedValue } from 'react-native-reanimated';

const scale = useSharedValue(1);

const handlePress = () => {
  scale.value = withSequence(
    withTiming(0.9, { duration: 100 }),   // Step 1: scale down
    withSpring(1.1, { damping: 8 }),      // Step 2: bounce up
    withTiming(1, { duration: 200 })      // Step 3: settle
  );
};
```

### Shake Animation

```typescript
const offsetX = useSharedValue(0);

const shake = () => {
  offsetX.value = withSequence(
    withTiming(-10, { duration: 50 }),
    withRepeat(withTiming(10, { duration: 100 }), 3, true),
    withTiming(0, { duration: 50 })
  );
};
```

---

## withRepeat

Repeat an animation multiple times with optional direction reversal.

```typescript
function withRepeat(
  animation: AnimationObject,
  numberOfReps?: number,
  reverse?: boolean,
  callback?: (finished?: boolean, current?: AnimatableValue) => void
): AnimationObject;
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `animation` | `AnimationObject` | Required | Animation to repeat |
| `numberOfReps` | `number` | `-1` | Repetition count. `-1` = infinite |
| `reverse` | `boolean` | `false` | Reverse direction each repetition |
| `callback` | `(finished?, current?) => void` | `undefined` | Called after all repetitions complete |

### Infinite Pulse

```typescript
import { withRepeat, withTiming, useSharedValue, useEffect } from 'react-native-reanimated';

const opacity = useSharedValue(1);

useEffect(() => {
  opacity.value = withRepeat(
    withTiming(0.3, { duration: 1000 }),
    -1,   // Infinite
    true   // Reverse (pulse effect)
  );
}, []);
```

### Finite Rotation

```typescript
const rotation = useSharedValue(0);

rotation.value = withRepeat(
  withTiming(360, { duration: 1000, easing: Easing.linear }),
  5,      // 5 times
  false,  // No reverse (continuous spin)
  (finished) => {
    'worklet';
    if (finished) console.log('Rotation complete');
  }
);
```

### Combined with withSequence

```typescript
const scale = useSharedValue(1);

// Heartbeat: grow-shrink repeated infinitely
scale.value = withRepeat(
  withSequence(
    withTiming(1.2, { duration: 300 }),
    withTiming(1, { duration: 300 })
  ),
  -1 // Infinite
);
```

---

## withDelay

Add a delay before an animation starts.

```typescript
function withDelay<T extends AnimatableValue>(
  delayMs: number,
  delayedAnimation: T,
  reduceMotion?: ReduceMotion
): T;
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `delayMs` | `number` | Required | Delay in milliseconds before animation starts |
| `delayedAnimation` | `T` | Required | The animation to delay |
| `reduceMotion` | `ReduceMotion` | `System` | Accessibility setting |

### Basic Delay

```typescript
import { withDelay, withTiming } from 'react-native-reanimated';

// Fade in after 500ms
opacity.value = withDelay(500, withTiming(1, { duration: 300 }));
```

### Staggered Entrance

```typescript
function StaggeredList({ items }: { items: Item[] }) {
  return items.map((item, index) => {
    const opacity = useSharedValue(0);

    useEffect(() => {
      opacity.value = withDelay(
        index * 100, // Each item delayed by 100ms more
        withTiming(1, { duration: 300 })
      );
    }, []);

    const animatedStyle = useAnimatedStyle(() => ({
      opacity: opacity.value,
    }));

    return <Animated.View key={item.id} style={animatedStyle} />;
  });
}
```

---

## withDecay

Physics-based decay animation for momentum/fling gestures. The value decelerates from an initial velocity.

```typescript
function withDecay(
  config: WithDecayConfig,
  callback?: (finished?: boolean, current?: AnimatableValue) => void
): number;

interface WithDecayConfig {
  velocity?: number;           // default: 0
  deceleration?: number;       // default: 0.998
  clamp?: [number, number];    // optional bounds
  velocityFactor?: number;     // default: 1
  rubberBandEffect?: boolean;  // default: false
  rubberBandFactor?: number;   // default: 0.6
  reduceMotion?: ReduceMotion; // default: System
}
```

### Config Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `velocity` | `number` | `0` | Initial velocity (pixels/second) |
| `deceleration` | `number` | `0.998` | Friction factor (0-1). Lower = faster stop |
| `clamp` | `[min, max]` | `[]` | Boundary limits. Required for `rubberBandEffect` |
| `velocityFactor` | `number` | `1` | Velocity multiplier |
| `rubberBandEffect` | `boolean` | `false` | Bounce over clamp limits |
| `rubberBandFactor` | `number` | `0.6` | Rubber band strength (0 = hard stop, 1 = no resistance) |
| `reduceMotion` | `ReduceMotion` | `System` | Accessibility setting |

### Pan Gesture with Decay

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withDecay,
} from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function DraggableWithDecay() {
  const translateX = useSharedValue(0);
  const contextX = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => {
      contextX.value = translateX.value;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
    })
    .onEnd((event) => {
      translateX.value = withDecay({
        velocity: event.velocityX,
        deceleration: 0.998,
        clamp: [-200, 200],
      });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.box, animatedStyle]} />
    </GestureDetector>
  );
}
```

### With Rubber Band Effect

```typescript
translateX.value = withDecay({
  velocity: event.velocityX,
  clamp: [-200, 200],
  rubberBandEffect: true,   // Bounce at boundaries
  rubberBandFactor: 0.6,    // Moderate resistance
});
```

### Deceleration Tuning

| Value | Behavior |
|---|---|
| `0.95` | Rapid stop |
| `0.998` | Natural deceleration (default) |
| `0.999` | Very slow, extended coast |

---

## Common Animation Patterns

### Bounce Enter + Exit

```typescript
const scale = useSharedValue(0);

const enter = () => {
  scale.value = withSequence(
    withTiming(0, { duration: 0 }),
    withSpring(1.1, { damping: 8 }),
    withTiming(1, { duration: 100 })
  );
};

const exit = () => {
  scale.value = withSequence(
    withTiming(0.8, { duration: 100 }),
    withTiming(0, { duration: 200 })
  );
};
```

### Shimmer Loading

```typescript
const shimmer = useSharedValue(0);

useEffect(() => {
  shimmer.value = withRepeat(
    withTiming(1, { duration: 1500, easing: Easing.linear }),
    -1,
    false
  );
}, []);
```

### Cancelable Infinite Animation

```typescript
import { cancelAnimation, withRepeat, withTiming, useSharedValue } from 'react-native-reanimated';

const rotation = useSharedValue(0);

const start = () => {
  rotation.value = withRepeat(
    withTiming(360, { duration: 2000, easing: Easing.linear }),
    -1
  );
};

const stop = () => {
  cancelAnimation(rotation);
};

// Cleanup on unmount
useEffect(() => {
  return () => cancelAnimation(rotation);
}, []);
```

---

## Important Notes

- **Callback semantics:** `withRepeat` callback fires after ALL repetitions. `withTiming`/`withSpring` callbacks fire after each individual animation.
- **Memory:** Infinite loops (`-1`) continue until the component unmounts or animation is reassigned/cancelled. Always clean up in `useEffect` return.
- **Chaining depth:** Deeply nested sequences (>10) may impact performance on older devices.

---

## Cross-References

- **Core animations:** [04-animations-timing-spring.md](04-animations-timing-spring.md)
- **useAnimatedStyle:** [03-core-animated-style.md](03-core-animated-style.md)
- **Gestures:** [07-gestures-events.md](07-gestures-events.md)
- **Layout animations:** [08-layout-animations.md](08-layout-animations.md)

---
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/animations/withSequence/ | https://docs.swmansion.com/react-native-reanimated/docs/animations/withRepeat/ | https://docs.swmansion.com/react-native-reanimated/docs/animations/withDelay/ | https://docs.swmansion.com/react-native-reanimated/docs/animations/withDecay/
