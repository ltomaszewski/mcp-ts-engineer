---
name: reanimated
description: React Native Reanimated 4.x animations - shared values, animated styles, timing, spring, decay, gestures, layout animations, entering/exiting transitions, keyframes. Use when implementing animations, gesture-driven interactions, or UI transitions.
---

# React Native Reanimated

High-performance animations running on the UI thread for smooth 60/120fps experiences in React Native.

---

## When to Use

LOAD THIS SKILL when user is:
- Creating timing, spring, decay, or layout animations
- Using shared values for animated state
- Implementing gesture-driven animations with react-native-gesture-handler
- Building entering/exiting transitions or layout transitions
- Optimizing animation performance on the UI thread
- Animating SVG components (Path morphing, gradients, patterns) with CSS animations

---

## Critical Rules

**ALWAYS:**
1. Use `useSharedValue` for animated state -- runs on UI thread, not React state
2. Pass animated styles only to `Animated.View`, `Animated.Text`, etc. -- regular components ignore them
3. Use `withTiming` for predictable UI transitions -- duration-based, easing-driven
4. Use `withSpring` for natural interactions -- physics-based, responsive feel
5. Respect `useReducedMotion()` or `ReduceMotion.System` -- accessibility requirement
6. Install both `react-native-reanimated` and `react-native-worklets` -- separate packages in v4
7. Place `react-native-worklets/plugin` **last** in Babel plugins array -- required ordering

**NEVER:**
1. Mutate shared values inside `useAnimatedStyle` -- causes infinite loops
2. Mutate nested object properties directly (`sv.value.x = 10`) -- loses reactivity, use spread or `.modify()`
3. Capture large objects in worklet closures -- copied to UI thread, memory overhead
4. Use `useAnimatedGestureHandler` -- removed in v4, use Gesture Handler v2 API (`Gesture.Pan()`)
5. Use `runOnJS`/`runOnUI` -- renamed to `scheduleOnRN`/`scheduleOnUI` in v4

---

## Core Patterns

### Basic Animation with useSharedValue

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

export function AnimatedBox() {
  const offset = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: offset.value }],
  }));

  const handlePress = () => {
    offset.value = withSpring(offset.value + 100);
  };

  return (
    <Animated.View style={[styles.box, animatedStyle]}>
      <Pressable onPress={handlePress}>
        <Text>Tap me</Text>
      </Pressable>
    </Animated.View>
  );
}
```

### Timing with Easing

```typescript
import { withTiming, Easing } from 'react-native-reanimated';

opacity.value = withTiming(1, {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
});

translateX.value = withTiming(0, {
  duration: 250,
  easing: Easing.out(Easing.cubic),
});
```

### Sequence, Repeat, and Delay

```typescript
import { withSequence, withRepeat, withDelay } from 'react-native-reanimated';

// Shake animation
offset.value = withSequence(
  withTiming(-10, { duration: 50 }),
  withRepeat(withTiming(10, { duration: 100 }), 3, true),
  withTiming(0, { duration: 50 })
);

// Pulse forever
scale.value = withRepeat(
  withSequence(
    withTiming(1.2, { duration: 500 }),
    withTiming(1, { duration: 500 })
  ),
  -1,
  true
);

// Delayed animation
opacity.value = withDelay(500, withTiming(1));
```

### Gesture Integration (Gesture Handler v2 API)

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

export function DraggableBox() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onUpdate((e) => {
      translateX.value = e.translationX;
      translateY.value = e.translationY;
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
      <Animated.View style={[styles.box, animatedStyle]} />
    </GestureDetector>
  );
}
```

### Entering/Exiting Layout Animations

```typescript
import Animated, { FadeIn, SlideOutLeft } from 'react-native-reanimated';

export function AnimatedItem({ visible }: { visible: boolean }) {
  if (!visible) return null;
  return (
    <Animated.View
      entering={FadeIn.duration(300).delay(100)}
      exiting={SlideOutLeft.duration(200)}
      style={styles.item}
    />
  );
}
```

### React Compiler Compatible Pattern (.get/.set)

```typescript
export function ReactCompilerSafe() {
  const width = useSharedValue(100);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.get() * 2,
  }));

  const handlePress = () => {
    width.set((prev) => prev + 10);
  };

  return <Animated.View style={animatedStyle} />;
}
```

---

## Anti-Patterns

**BAD** -- Mutating shared value inside useAnimatedStyle:
```typescript
const badStyle = useAnimatedStyle(() => {
  opacity.value = withTiming(0); // Infinite loop!
  return { opacity: opacity.value };
});
```
**GOOD** -- Mutate in event handlers, read in style:
```typescript
const goodStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));
const handlePress = () => { opacity.value = withTiming(0); };
```

**BAD** -- Passing animated style to regular View:
```typescript
<View style={animatedStyle} /> // No effect
```
**GOOD** -- Use Animated.View:
```typescript
<Animated.View style={animatedStyle} />
```

**BAD** -- Capturing large objects in closures:
```typescript
const bigData = useMemo(() => generateLargeArray(), []);
const style = useAnimatedStyle(() => ({
  opacity: bigData.length > 0 ? 1 : 0, // bigData copied to UI thread!
}));
```
**GOOD** -- Extract primitives:
```typescript
const hasData = bigData.length > 0;
const style = useAnimatedStyle(() => ({
  opacity: hasData ? 1 : 0,
}));
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Create animated value | `useSharedValue()` | `const x = useSharedValue(0)` |
| Animated styles | `useAnimatedStyle()` | `useAnimatedStyle(() => ({ opacity: x.value }))` |
| Derived value | `useDerivedValue()` | `useDerivedValue(() => x.value * 2)` |
| Timing animation | `withTiming()` | `x.value = withTiming(100, { duration: 300 })` |
| Spring animation | `withSpring()` | `x.value = withSpring(100)` |
| Decay animation | `withDecay()` | `withDecay({ velocity: e.velocityX })` |
| Sequence | `withSequence()` | `withSequence(withTiming(1), withTiming(0))` |
| Repeat | `withRepeat()` | `withRepeat(animation, -1, true)` |
| Delay | `withDelay()` | `withDelay(500, withTiming(1))` |
| Cancel | `cancelAnimation()` | `cancelAnimation(sharedValue)` |
| Interpolate | `interpolate()` | `interpolate(x.value, [0, 1], [0, 100])` |
| Color interpolate | `interpolateColor()` | `interpolateColor(x.value, [0, 1], ['red', 'blue'])` |
| Scroll handler | `useAnimatedScrollHandler()` | Pass to `Animated.ScrollView` `onScroll` |
| Animated ref | `useAnimatedRef()` | Use with `measure()` and `scrollTo()` |
| Entering animation | `entering` prop | `<Animated.View entering={FadeIn} />` |
| Layout transition | `layout` prop | `<Animated.View layout={LinearTransition} />` |
| Reduced motion | `useReducedMotion()` | `const reduced = useReducedMotion()` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation, Babel plugin, v3-to-v4 migration | [01-setup-installation.md](01-setup-installation.md) |
| useSharedValue, .get(), .set(), .modify() | [02-core-shared-values.md](02-core-shared-values.md) |
| useAnimatedStyle, useAnimatedProps, useDerivedValue | [03-core-animated-style.md](03-core-animated-style.md) |
| withTiming, withSpring, Easing, all config params | [04-animations-timing-spring.md](04-animations-timing-spring.md) |
| withSequence, withRepeat, withDelay, withDecay | [05-animations-modifiers.md](05-animations-modifiers.md) |
| Worklets, UI thread, scheduleOnUI/scheduleOnRN | [06-worklets-guide.md](06-worklets-guide.md) |
| Gesture handler v2 integration, pan/tap/pinch | [07-gestures-events.md](07-gestures-events.md) |
| Entering/exiting animations, layout transitions, keyframes | [08-layout-animations.md](08-layout-animations.md) |
| Performance, accessibility, code organization | [09-best-practices.md](09-best-practices.md) |
| Common errors, debugging, platform issues | [10-troubleshooting-faq.md](10-troubleshooting-faq.md) |

---

### v4 Migration Summary

Key changes from Reanimated 3.x:
- **New Architecture (Fabric) required** -- legacy architecture not supported
- **Separate worklets package**: Install `react-native-worklets` alongside `react-native-reanimated`
- **Babel plugin changed**: `react-native-reanimated/plugin` replaced by `react-native-worklets/plugin`
- **API renames**: `runOnJS` -> `scheduleOnRN`, `runOnUI` -> `scheduleOnUI`
- **Removed**: `useAnimatedGestureHandler` (use Gesture Handler v2 API)
- **Spring defaults changed**: `damping: 120`, `stiffness: 900`, `mass: 4` (use `Reanimated3DefaultSpringConfig` for old defaults)
- **React Compiler support**: `.get()`/`.set()` pattern recommended
- **CSS SVG Animations** (4.3.0): Animate SVG components (Path, Image, LinearGradient, RadialGradient, Pattern, Text) with CSS animations, including path morphing
- **Animated Styles type safety** (4.3.0): TypeScript compile-time checks prevent animated styles on non-animated components
- **Worklets 0.8.0**: `Shareable` type, `runOnRuntimeSync`, `runOnRuntimeAsync`, `strictGlobal` Babel option
- **Minimum versions**: React Native 0.80+, Expo SDK 54+

---
**Version:** Reanimated 4.x (^4.3.0) | **Source:** https://docs.swmansion.com/react-native-reanimated/
