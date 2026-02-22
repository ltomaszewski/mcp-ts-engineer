# Best Practices, Performance, and Accessibility

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/

---

## Overview

Performance optimization strategies, accessibility support, code organization patterns, and common pitfalls for Reanimated 4.x.

---

## Performance Optimization

### 1. Minimize Shared Value Mutations

Derive multiple style properties from a single shared value in `useAnimatedStyle` instead of creating multiple shared values.

```typescript
// BAD: Multiple mutations per gesture event
const onUpdate = (event) => {
  offset.value = event.contentOffset.y;
  opacity.value = offset.value / 100;
  scale.value = 1 + offset.value / 1000;
};

// GOOD: Single mutation, derive in useAnimatedStyle
const onScroll = (event) => {
  offset.value = event.contentOffset.y;
};

const animatedStyle = useAnimatedStyle(() => ({
  opacity: offset.value / 100,
  transform: [{ scale: 1 + offset.value / 1000 }],
}));
```

### 2. Optimize Closure Capture

Extract primitives before capturing in worklets. Large objects are serialized and copied to the UI thread.

```typescript
const config = { colors: { primary: 'red' }, sizes: { large: 20 }, /* 50+ props */ };

// BAD: Entire config copied to UI thread
const style = useAnimatedStyle(() => ({
  color: config.colors.primary, // All of config serialized
}));

// GOOD: Extract only what's needed
const primaryColor = config.colors.primary;
const style = useAnimatedStyle(() => ({
  color: primaryColor, // Only string 'red' captured
}));
```

### 3. Avoid Expensive Worklet Computations

```typescript
// BAD: JSON operations on every frame
const style = useAnimatedStyle(() => {
  const data = JSON.parse(JSON.stringify(largeObject)); // Slow!
  return { opacity: offset.value };
});

// GOOD: Precompute outside worklet
const processedData = useMemo(() => transform(largeObject), [largeObject]);
const style = useAnimatedStyle(() => ({
  opacity: offset.value,
}));
```

### 4. Use Gesture Composition Instead of Nesting

```typescript
// BAD: Nested gesture handler components
<PanGestureHandler>
  <PinchGestureHandler>
    <RotationGestureHandler>
      <Animated.View />
    </RotationGestureHandler>
  </PinchGestureHandler>
</PanGestureHandler>

// GOOD: Composed gestures
const pan = Gesture.Pan().onUpdate(/* ... */);
const pinch = Gesture.Pinch().onUpdate(/* ... */);
const combined = Gesture.Simultaneous(pan, pinch);

<GestureDetector gesture={combined}>
  <Animated.View />
</GestureDetector>
```

### 5. Limit Concurrent Animations

Especially important on web where there's no separate UI thread.

```typescript
// BAD: Too many simultaneous animations
items.forEach((item) => {
  item.value = withTiming(1); // 100+ animations
});

// GOOD: Stagger or limit count
items.forEach((item, i) => {
  item.value = withDelay(i * 50, withTiming(1));
});
```

---

## Accessibility: Reduce Motion

### useReducedMotion Hook

```typescript
import { useReducedMotion } from 'react-native-reanimated';

function AnimatedComponent() {
  const reducedMotion = useReducedMotion();
  const duration = reducedMotion ? 0 : 300;

  const opacity = useSharedValue(1);
  opacity.value = withTiming(0, { duration });
}
```

Note: `useReducedMotion` returns the value at app start time. Changing the device setting after launch does not cause re-renders.

### ReduceMotion Enum

All animation functions support a `reduceMotion` parameter:

```typescript
import { ReduceMotion, withTiming } from 'react-native-reanimated';

// Respects device setting (default)
opacity.value = withTiming(0, {
  duration: 300,
  reduceMotion: ReduceMotion.System,
});

// Always skip animation
opacity.value = withTiming(0, {
  duration: 300,
  reduceMotion: ReduceMotion.Always,
});

// Never skip (override device setting)
opacity.value = withTiming(0, {
  duration: 300,
  reduceMotion: ReduceMotion.Never,
});
```

| Value | Behavior |
|---|---|
| `ReduceMotion.System` | Respects device accessibility setting (default) |
| `ReduceMotion.Always` | Always disables animation |
| `ReduceMotion.Never` | Always enables animation |

### ReducedMotionConfig Component

Configure reduce motion behavior for an entire subtree:

```typescript
import { ReducedMotionConfig } from 'react-native-reanimated';

<ReducedMotionConfig mode={ReduceMotion.Never}>
  {/* Animations always play regardless of device settings */}
</ReducedMotionConfig>
```

### Provide Non-Animated Alternatives

```typescript
function AccessibleButton({ onPress }: { onPress: () => void }) {
  const reducedMotion = useReducedMotion();

  if (reducedMotion) {
    return <TouchableOpacity onPress={onPress}>{/* static */}</TouchableOpacity>;
  }

  return <AnimatedPressable onPress={onPress}>{/* animated */}</AnimatedPressable>;
}
```

---

## Animation Choice Guidelines

### When to Use Each Type

| Use Case | Recommended | Why |
|---|---|---|
| Fade in/out | `withTiming` | Predictable duration |
| Color transitions | `withTiming` | Smooth interpolation |
| Button press | `withSpring` | Natural rebound |
| Drag snap-back | `withSpring` | Physics-based snap |
| Fling/swipe momentum | `withDecay` | Velocity-based deceleration |
| List item enter | `FadeInDown` / `SlideInRight` | Declarative, automatic |
| Layout reorder | `LinearTransition` | Smooth repositioning |
| Screen transition | `SharedTransition` | Cross-screen continuity |

### Duration Guidelines

| Context | Duration | Example |
|---|---|---|
| Micro-interactions | 100-200ms | Button press feedback |
| Small elements | 200-300ms | Fade toggle, icon swap |
| Normal transitions | 300-500ms | Modal open, card expand |
| Page transitions | 400-700ms | Screen navigation |
| Complex sequences | 500ms+ | Multi-step onboarding |

### Easing Recommendations

| Animation Type | Recommended Easing |
|---|---|
| Enter/appear | `Easing.out(Easing.cubic)` -- fast start, gentle landing |
| Exit/disappear | `Easing.in(Easing.cubic)` -- gentle start, fast exit |
| Symmetric | `Easing.inOut(Easing.cubic)` -- smooth both ways |
| Continuous/loop | `Easing.linear` -- constant speed |
| Playful/bounce | `Easing.out(Easing.bounce)` or `withSpring` |

---

## Code Organization

### Reusable Animation Hooks

```typescript
// hooks/useScaleAnimation.ts
import { useSharedValue, useAnimatedStyle, withTiming, withSpring } from 'react-native-reanimated';

export function useScaleAnimation(initial = 1) {
  const scale = useSharedValue(initial);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const pressIn = () => {
    scale.value = withTiming(0.95, { duration: 100 });
  };

  const pressOut = () => {
    scale.value = withSpring(1);
  };

  return { animatedStyle, pressIn, pressOut };
}

// Usage
function Button() {
  const { animatedStyle, pressIn, pressOut } = useScaleAnimation();

  return (
    <Pressable onPressIn={pressIn} onPressOut={pressOut}>
      <Animated.View style={animatedStyle}>
        <Text>Press me</Text>
      </Animated.View>
    </Pressable>
  );
}
```

### Animation Constants

```typescript
// constants/animations.ts
import { Easing } from 'react-native-reanimated';

export const ANIMATION = {
  DURATION_FAST: 150,
  DURATION_NORMAL: 300,
  DURATION_SLOW: 500,
  EASING_ENTER: Easing.out(Easing.cubic),
  EASING_EXIT: Easing.in(Easing.cubic),
  EASING_SYMMETRIC: Easing.inOut(Easing.cubic),
  SPRING_BOUNCY: { damping: 8, stiffness: 100, mass: 1 },
  SPRING_SNAPPY: { damping: 20, stiffness: 300, mass: 0.5 },
} as const;
```

---

## Common Pitfalls

| Pitfall | Symptom | Fix |
|---|---|---|
| Mutating shared value in useAnimatedStyle | Infinite loop, frozen UI | Move mutations to event handlers |
| Passing animated style to regular View | No animation visible | Use `Animated.View` |
| Missing GestureHandlerRootView (Android) | Gestures not recognized | Wrap app root |
| Capturing large closures | Memory spikes, jank | Extract primitives before capture |
| Reading `.value` during render | Stale data, no updates | Read in effects/worklets/callbacks |
| Nested object mutation | Lost reactivity | Use spread or `.modify()` |
| Using v3 APIs (runOnJS, useAnimatedGestureHandler) | Deprecation warnings or errors | Migrate to v4 equivalents |
| Infinite withRepeat without cleanup | Memory leak on unmount | Cancel in useEffect cleanup |
| Too many concurrent animations on web | FPS drops | Limit count, stagger with withDelay |
| Hoisting worklets | ReferenceError | Define worklets before use |

---

## Web Considerations

- No separate UI thread on web; worklets run as regular JS functions
- `onBeginDrag`, `onEndDrag`, `onMomentumBegin`, `onMomentumEnd` scroll events not supported
- Custom entering/exiting animations not supported on web
- LayoutAnimationConfig (`skipEntering`/`skipExiting`) not supported on web
- Shared element transitions not supported on web
- Limit concurrent animations for acceptable performance

---

## Cross-References

- **Shared values:** [02-core-shared-values.md](02-core-shared-values.md)
- **Animations:** [04-animations-timing-spring.md](04-animations-timing-spring.md)
- **Worklets:** [06-worklets-guide.md](06-worklets-guide.md)
- **Troubleshooting:** [10-troubleshooting-faq.md](10-troubleshooting-faq.md)

---
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/ | https://docs.swmansion.com/react-native-reanimated/docs/device/useReducedMotion/ | https://docs.swmansion.com/react-native-reanimated/docs/device/ReducedMotionConfig/
