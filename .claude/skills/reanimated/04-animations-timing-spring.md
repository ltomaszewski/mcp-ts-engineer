# Animations: withTiming and withSpring

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/animations/withTiming/ | https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/

---

## Overview

Reanimated provides two primary animation functions:
1. **`withTiming`** -- duration-based animations with easing curves
2. **`withSpring`** -- physics-based spring animations

Both accept an optional callback fired on completion.

---

## withTiming

```typescript
function withTiming<T extends AnimatableValue>(
  toValue: T,
  config?: WithTimingConfig,
  callback?: (finished?: boolean, current?: AnimatableValue) => void
): T;

type AnimatableValue = number | string | number[];

interface WithTimingConfig {
  duration?: number;         // default: 300
  easing?: EasingFunction;   // default: Easing.inOut(Easing.quad)
  reduceMotion?: ReduceMotion; // default: ReduceMotion.System
}
```

### Config Parameters

| Parameter | Type | Default | Description |
|---|---|---|---|
| `duration` | `number` | `300` | Animation length in milliseconds |
| `easing` | `EasingFunction` | `Easing.inOut(Easing.quad)` | Velocity curve over time |
| `reduceMotion` | `ReduceMotion` | `System` | Accessibility: `System`, `Always`, `Never` |

### Basic Examples

```typescript
import { withTiming, Easing, useSharedValue } from 'react-native-reanimated';

const opacity = useSharedValue(1);

// Default (300ms, inOut quad)
opacity.value = withTiming(0);

// Custom duration
opacity.value = withTiming(0, { duration: 500 });

// Quick animation
opacity.value = withTiming(1, { duration: 200 });

// With callback
opacity.value = withTiming(0, { duration: 500 }, (finished) => {
  'worklet';
  if (finished) {
    console.log('Animation completed');
  }
});
```

---

## Easing Functions

### Base Functions

| Function | Behavior | Use Case |
|---|---|---|
| `Easing.linear` | Constant velocity | Rotations, looping |
| `Easing.quad` | Quadratic curve | General purpose (default base) |
| `Easing.cubic` | Cubic curve | Smoother than quad |
| `Easing.sin` | Sine wave | Natural, organic |
| `Easing.exp` | Exponential | Fast acceleration |
| `Easing.circle` | Circular curve | Smooth start/end |
| `Easing.bounce` | Bounce effect | Playful interactions |
| `Easing.elastic(bounciness?)` | Elastic snap | Spring-like timing |
| `Easing.poly(n)` | Polynomial degree n | Custom curves |
| `Easing.back` | Slight overshoot | Anticipation effect |
| `Easing.ease` | CSS ease equivalent | Web-familiar curve |
| `Easing.bezier(x1, y1, x2, y2)` | Custom bezier | Precise control |

### Easing Modifiers

| Modifier | Effect | Example |
|---|---|---|
| `Easing.in(fn)` | Slow start, fast finish | `Easing.in(Easing.cubic)` |
| `Easing.out(fn)` | Fast start, slow finish | `Easing.out(Easing.cubic)` |
| `Easing.inOut(fn)` | Slow start and finish | `Easing.inOut(Easing.cubic)` |

### Easing Examples

```typescript
import { Easing, withTiming } from 'react-native-reanimated';

// Linear rotation
rotation.value = withTiming(360, {
  duration: 1000,
  easing: Easing.linear,
});

// Smooth cubic ease in-out
translateX.value = withTiming(100, {
  duration: 500,
  easing: Easing.inOut(Easing.cubic),
});

// Fast start, slow finish
opacity.value = withTiming(1, {
  duration: 400,
  easing: Easing.out(Easing.exp),
});

// Custom bezier (CSS transition equivalent)
scale.value = withTiming(1.2, {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
});

// Bounce effect
translateY.value = withTiming(0, {
  duration: 800,
  easing: Easing.out(Easing.bounce),
});

// Elastic snap
scale.value = withTiming(1, {
  duration: 600,
  easing: Easing.out(Easing.elastic(2)),
});
```

---

## withSpring

```typescript
function withSpring<T extends AnimatableValue>(
  toValue: T,
  config?: SpringConfig,
  callback?: (finished?: boolean, current?: AnimatableValue) => void
): T;
```

### Physics-Based Config (default mode)

| Parameter | Type | Default | Description |
|---|---|---|---|
| `damping` | `number` | `120` | How quickly spring slows down. Higher = faster settle |
| `stiffness` | `number` | `900` | How bouncy the spring is. Higher = tighter |
| `mass` | `number` | `4` | Weight of the spring. Lower = faster |
| `velocity` | `number` | `0` | Initial velocity |
| `overshootClamping` | `boolean` | `false` | Prevent bouncing past target |
| `energyThreshold` | `number` | `6e-9` | Energy level to snap to rest |
| `reduceMotion` | `ReduceMotion` | `System` | Accessibility setting |

### Duration-Based Config (alternative mode)

Mutually exclusive with physics-based parameters (damping/stiffness/mass).

| Parameter | Type | Default | Description |
|---|---|---|---|
| `duration` | `number` | `550` | Perceptual duration in ms (actual ~1.5x) |
| `dampingRatio` | `number` | `1` | `1` = critical, `<1` = underdamped (bouncy), `>1` = overdamped |
| `clamp` | `{ min?: number; max?: number }` | `undefined` | Limits movement scope |
| `reduceMotion` | `ReduceMotion` | `System` | Accessibility setting |

### Physics-Based Examples

```typescript
import { withSpring, useSharedValue } from 'react-native-reanimated';

const scale = useSharedValue(1);

// Default v4 spring (critically damped, fast)
scale.value = withSpring(1.2);

// Bouncy spring (low damping)
scale.value = withSpring(1.2, {
  damping: 8,
  stiffness: 100,
  mass: 1,
});

// Snappy spring (high stiffness, low mass)
scale.value = withSpring(1.2, {
  damping: 20,
  stiffness: 300,
  mass: 0.5,
});

// No overshoot
translateX.value = withSpring(100, {
  overshootClamping: true,
});

// With callback
scale.value = withSpring(1, { damping: 10 }, (finished) => {
  'worklet';
  if (finished) console.log('Spring settled');
});
```

### Duration-Based Examples

```typescript
// Critically damped (no bounce)
offset.value = withSpring(100, {
  duration: 300,
  dampingRatio: 1,
});

// Underdamped (bouncy)
offset.value = withSpring(100, {
  duration: 500,
  dampingRatio: 0.5,
});

// With bounds
offset.value = withSpring(100, {
  duration: 400,
  clamp: { min: 0, max: 200 },
});
```

### Using v3 Defaults for Backward Compatibility

```typescript
import { withSpring, Reanimated3DefaultSpringConfig } from 'react-native-reanimated';

// Uses v3 defaults: damping=10, stiffness=100, mass=1
offset.value = withSpring(100, Reanimated3DefaultSpringConfig);
```

---

## cancelAnimation

Stop a running animation on a shared value.

```typescript
function cancelAnimation(sharedValue: SharedValue<any>): void;
```

```typescript
import { cancelAnimation, useSharedValue, withTiming } from 'react-native-reanimated';

const opacity = useSharedValue(1);

const start = () => {
  opacity.value = withTiming(0, { duration: 5000 });
};

const stop = () => {
  cancelAnimation(opacity); // Stops at current value
};
```

---

## Comparison: withTiming vs withSpring

| Aspect | `withTiming` | `withSpring` |
|---|---|---|
| Type | Duration-based | Physics-based |
| Predictability | Exact duration | Variable (depends on physics) |
| Feel | Mechanical, controlled | Natural, organic |
| Easing | Full control via Easing | Determined by damping/stiffness/mass |
| Best for | UI transitions, fades, color changes | Button presses, drag snap-back, interactions |
| Overshoot | Never overshoots | Can bounce naturally |
| Config | `duration`, `easing` | `damping`, `stiffness`, `mass` or `duration`, `dampingRatio` |

---

## Common Patterns

### Fade In/Out

```typescript
// Fade in
opacity.value = withTiming(1, { duration: 300 });

// Fade out
opacity.value = withTiming(0, { duration: 300 });
```

### Button Press Effect

```typescript
const scale = useSharedValue(1);

const handlePressIn = () => {
  scale.value = withTiming(0.9, { duration: 100 });
};

const handlePressOut = () => {
  scale.value = withSpring(1);
};
```

### Slide Animation

```typescript
// Timing slide
translateX.value = withTiming(100, {
  duration: 500,
  easing: Easing.inOut(Easing.cubic),
});

// Spring slide
translateX.value = withSpring(100);
```

---

## Duration Guidelines

| Context | Recommended Duration |
|---|---|
| Small elements, quick feedback | 150-250ms |
| Normal UI transitions | 250-400ms |
| Modal opens, page transitions | 400-600ms |
| Complex multi-step animations | 600ms+ |

---

## Cross-References

- **Modifiers (sequence, repeat, decay):** [05-animations-modifiers.md](05-animations-modifiers.md)
- **useAnimatedStyle:** [03-core-animated-style.md](03-core-animated-style.md)
- **Gestures:** [07-gestures-events.md](07-gestures-events.md)
- **Layout animations:** [08-layout-animations.md](08-layout-animations.md)

---
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/animations/withTiming/ | https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/ | https://docs.swmansion.com/react-native-reanimated/docs/core/cancelAnimation/
