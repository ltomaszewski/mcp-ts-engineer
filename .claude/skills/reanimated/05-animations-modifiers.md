# Animation Modifiers: withSequence, withRepeat, withDecay

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/animations/
**Version:** 4.2.1
**Category:** Animation Modifiers | Combinators

---

## 📋 Overview

Reanimated provides modifier functions that combine and chain animations:

1. **`withSequence`** — Run animations sequentially
2. **`withRepeat`** — Repeat animations with optional delay
3. **`withDecay`** — Physics-based decay for gesture-driven interactions

These modifiers enable complex animation patterns by chaining `withTiming`, `withSpring`, and each other.

---

## 🔗 withSequence - Animation Chaining

### API Reference

**Signature:**
```typescript
function withSequence(
  ...animations: AnimationObject[]
): AnimationObject;
```

**Description:** Runs multiple animations in sequence, each completing before the next begins.

---

### Basic Usage

```typescript
import { useSharedValue, withSequence, withTiming, withSpring } from 'react-native-reanimated';

const animatedValue = useSharedValue(0);

// Sequence: Timing → Spring → Timing
const animate = () => {
  animatedValue.value = withSequence(
    withTiming(100, { duration: 500 }),  // First animation
    withSpring(0, { damping: 5 }),       // Second animation
    withTiming(50, { duration: 300 })    // Third animation
  );
};
```

---

### Parameters

| Property | Type | Description |
|---|---|---|
| `animations` | `...AnimationObject[]` | Variable number of animation objects (withTiming, withSpring, withDecay) |

---

### Return Value

Returns an `AnimationObject` that represents the entire sequence. When assigned to a shared value, all animations run in order.

---

### Practical Example: Bounce & Settle

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { View } from 'react-native';

export const BounceComponent = () => {
  const scale = useSharedValue(1);

  const handlePress = () => {
    scale.value = withSequence(
      // Scale up quickly
      withSpring(1.2, { damping: 3, mass: 1, stiffness: 100 }),
      // Scale down to 1.05 (overshoot)
      withSpring(1.05, { damping: 8 }),
      // Final settle
      withTiming(1, { duration: 200 })
    );
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[animatedStyle, { width: 50, height: 50, backgroundColor: 'blue' }]}
      onTouchStart={handlePress}
    />
  );
};
```

---

## 🔄 withRepeat - Animation Looping

### API Reference

**Signature:**
```typescript
function withRepeat(
  animation: AnimationObject,
  numberOfReps?: number,
  reverse?: boolean,
  callback?: (finished: boolean) => void
): AnimationObject;
```

**Description:** Repeats an animation multiple times, with optional reversal and delay between repetitions.

---

### Configuration

| Property | Type | Default | Description |
|---|---|---|---|
| `animation` | `AnimationObject` | **Required** | The animation to repeat (withTiming, withSpring) |
| `numberOfReps` | `number` | `-1` | Number of repetitions (-1 = infinite) |
| `reverse` | `boolean` | `false` | Reverse direction on each repetition |
| `callback` | `(finished: boolean) => void` | `undefined` | Called when repetition completes |

---

### Basic Usage

```typescript
import { useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

const opacity = useSharedValue(1);

// Infinite fade in/out
const startPulse = () => {
  opacity.value = withRepeat(
    withTiming(0.3, { duration: 1000 }),
    -1,  // Infinite repetitions
    true // Reverse on each rep
  );
};
```

---

### Combining withSequence & withRepeat

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSequence,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';
import { View } from 'react-native';

export const PulseAnimation = () => {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const startAnimation = () => {
    // Create a sequence: grow → shrink → pause
    const sequence = withSequence(
      withTiming(1.2, { duration: 300 }),
      withTiming(1, { duration: 300 })
    );

    // Repeat the sequence infinitely
    scale.value = withRepeat(sequence, -1);
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View
      style={[animatedStyle, { width: 60, height: 60, backgroundColor: 'green' }]}
      onTouchStart={startAnimation}
    />
  );
};
```

---

### With Callback

```typescript
const rotation = useSharedValue(0);

rotation.value = withRepeat(
  withTiming(360, { duration: 1000 }),
  5,      // Repeat 5 times
  false,  // Don't reverse
  (finished) => {
    if (finished) {
      console.log('Animation completed');
    }
  }
);
```

---

## 📉 withDecay - Gesture Physics

### API Reference

**Signature:**
```typescript
function withDecay(
  config: WithDecayConfig,
  callback?: (finished: boolean) => void
): AnimationObject;

interface WithDecayConfig {
  velocity: number;          // Starting velocity (pixels/ms)
  deceleration?: number;    // Friction (0-1, default: 0.998)
  velocityFactor?: number;  // Scale velocity (default: 1)
}
```

**Description:** Physics-based decay animation for natural gesture-driven interactions (scrolling, flinging).

---

### Configuration

| Property | Type | Default | Description |
|---|---|---|---|
| `velocity` | `number` | **Required** | Initial velocity (pixels/millisecond) |
| `deceleration` | `number` | `0.998` | Friction factor (0-1). Lower = faster stop |
| `velocityFactor` | `number` | `1` | Multiplier for velocity (useful for scaling) |

---

### Pan Gesture with Decay

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  useAnimatedGestureHandler,
  withDecay,
} from 'react-native-reanimated';
import { GestureHandlerRootView, PanGestureHandler } from 'react-native-gesture-handler';
import { View } from 'react-native';

export const DraggableWithDecay = () => {
  const translationX = useSharedValue(0);
  const translationY = useSharedValue(0);

  const gestureHandler = useAnimatedGestureHandler({
    onStart: (event, context) => {
      context.startX = translationX.value;
      context.startY = translationY.value;
    },
    onActive: (event, context) => {
      translationX.value = context.startX + event.translationX;
      translationY.value = context.startY + event.translationY;
    },
    onEnd: (event) => {
      // Apply decay with gesture velocity
      translationX.value = withDecay({
        velocity: event.velocityX,
        deceleration: 0.98,
      });
      translationY.value = withDecay({
        velocity: event.velocityY,
        deceleration: 0.98,
      });
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translationX.value },
      { translateY: translationY.value },
    ],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <PanGestureHandler onGestureEvent={gestureHandler}>
        <Animated.View
          style={[
            animatedStyle,
            {
              width: 80,
              height: 80,
              backgroundColor: 'purple',
              borderRadius: 40,
            },
          ]}
        />
      </PanGestureHandler>
    </GestureHandlerRootView>
  );
};
```

---

### Scroll Deceleration

```typescript
// Mimicking natural scroll deceleration
const scrollPosition = useSharedValue(0);

const handleScrollEnd = (event: any) => {
  scrollPosition.value = withDecay({
    velocity: event.velocity,
    deceleration: 0.996, // Slightly slower deceleration for smooth scrolling
  });
};
```

---

## ♿ Reduce Motion & Accessibility

### Detecting Reduce Motion

```typescript
import { useWindowDimensions } from 'react-native';
import { useSharedValue, withTiming } from 'react-native-reanimated';

// In React Native, detect via AccessibilityInfo (platform-specific)
import { AccessibilityInfo } from 'react-native';

export const useReduceMotion = () => {
  const [reduceMotion, setReduceMotion] = React.useState(false);

  React.useEffect(() => {
    AccessibilityInfo.isScreenReaderEnabled().then((enabled) => {
      setReduceMotion(enabled);
    });
  }, []);

  return reduceMotion;
};
```

### Conditional Animation Durations

```typescript
import { useSharedValue, withTiming, withRepeat } from 'react-native-reanimated';

export const AccessibleAnimation = () => {
  const reduceMotion = useReduceMotion();
  const opacity = useSharedValue(1);

  const startAnimation = () => {
    const duration = reduceMotion ? 100 : 1000; // Instant vs normal

    opacity.value = withRepeat(
      withTiming(0.5, { duration }),
      -1,
      true
    );
  };

  return null; // Component logic...
};
```

---

## 🎯 Common Animation Patterns

### Bounce Enter + Exit

```typescript
const scale = useSharedValue(0);

// Enter animation
const enter = () => {
  scale.value = withSequence(
    withTiming(0.5, { duration: 0 }),
    withSpring(1.1, { damping: 3 }),
    withTiming(1, { duration: 100 })
  );
};

// Exit animation
const exit = () => {
  scale.value = withSequence(
    withTiming(0.8, { duration: 100 }),
    withSpring(0, { damping: 5 })
  );
};
```

### Shimmer Loading Effect

```typescript
const shimmer = useSharedValue(0);

const startShimmer = () => {
  shimmer.value = withRepeat(
    withTiming(100, { duration: 1500 }),
    -1,
    true
  );
};
```

### Cancelable Animation with Cleanup

```typescript
const rotation = useSharedValue(0);

const startRotation = () => {
  rotation.value = withRepeat(
    withTiming(360, { duration: 2000 }),
    -1
  );
};

const stopRotation = () => {
  // Reset and stop
  rotation.value = 0;
};

// Cleanup on unmount
React.useEffect(() => {
  return () => {
    stopRotation();
  };
}, []);
```

---

## ⚠️ Important Notes

### Chaining Limits

While `withSequence` can chain unlimited animations, deeply nested sequences (>10) may impact performance on older devices.

### Callback Semantics

- **`withRepeat` callback**: Called after ALL repetitions complete
- **`withTiming`/`withSpring` callbacks**: Called after the individual animation completes (not each repeat)

### Memory Management

- Infinite loops (`numberOfReps: -1`) continue until component unmounts or animation is reassigned
- Always clean up animations in `useEffect` cleanup functions to prevent memory leaks

### Deceleration Tuning

- `deceleration: 0.998` = natural, long deceleration
- `deceleration: 0.95` = rapid stop
- `deceleration: 0.999` = very slow, extended deceleration

---

## 🔗 Cross-References

- **Core Animations:** See [04-animations-timing-spring.md](./04-animations-timing-spring.md)
- **Animation Styles:** See [03-core-animated-style.md](./03-core-animated-style.md)
- **Gesture Integration:** See [07-gestures-events.md](./07-gestures-events.md)
- **Best Practices:** See [09-best-practices.md](./09-best-practices.md)

---

**Last Updated:** December 2024
**Version Aligned:** Reanimated 4.2.1 (React Native New Architecture)
