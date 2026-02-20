---
name: reanimated
description: React Native Reanimated animations - shared values, animated styles, timing, spring, gestures. Use when implementing animations, gesture-driven interactions, or UI transitions.
---

# Reanimated

> High-performance animations running on the UI thread for smooth 60/120fps experiences.

**Package:** `react-native-reanimated`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Creating timing, spring, or decay animations
- Using shared values for animated state
- Implementing gesture-driven animations
- Building animated components with useAnimatedStyle
- Optimizing animation performance

---

## Critical Rules

**ALWAYS:**
1. Use `useSharedValue` for animated state — runs on UI thread, not React state
2. Add `'worklet'` directive in callbacks passed to animation functions — required for UI thread execution
3. Use `withTiming` for predictable UI animations — duration-based, consistent
4. Use `withSpring` for natural interactions — physics-based, feels responsive
5. Check `reduceMotion` accessibility setting — respect user preferences

**NEVER:**
1. Access `.value` in render (outside useAnimatedStyle) — causes re-renders, breaks performance
2. Forget `'worklet'` directive — code runs on JS thread instead of UI thread
3. Capture large objects in worklet closures — copied to UI thread, memory issues
4. Mix Animated and Reanimated components — use only `Animated.View` from reanimated

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

### Timing Animation with Easing

```typescript
import { withTiming, Easing } from 'react-native-reanimated';

// Smooth fade in
opacity.value = withTiming(1, {
  duration: 300,
  easing: Easing.bezier(0.25, 0.1, 0.25, 1),
});

// Slide in from right
translateX.value = withTiming(0, {
  duration: 250,
  easing: Easing.out(Easing.cubic),
});
```

### Sequence and Repeat

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
  -1, // infinite
  true // reverse
);

// Delayed animation
opacity.value = withDelay(500, withTiming(1));
```

### Worklet for Custom Logic

```typescript
import { useAnimatedStyle, interpolate } from 'react-native-reanimated';

const animatedStyle = useAnimatedStyle(() => {
  'worklet';
  return {
    opacity: interpolate(progress.value, [0, 1], [0.5, 1]),
    transform: [
      { scale: interpolate(progress.value, [0, 1], [0.8, 1]) },
      { rotate: `${progress.value * 360}deg` },
    ],
  };
});
```

### React Compiler Compatible Pattern

```typescript
// Use .get() and .set() instead of .value for React Compiler
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

// For large objects, use .modify() for in-place updates
const items = useSharedValue([1, 2, 3]);
items.modify((value) => {
  'worklet';
  value.push(4);
  return value;
});
```

### Gesture Integration

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

---

## Anti-Patterns

**BAD** — Accessing .value in render:
```typescript
function Component() {
  const offset = useSharedValue(0);
  return <Text>Value: {offset.value}</Text>; // Re-renders, breaks perf!
}
```

**GOOD** — Use useDerivedValue or keep in animatedStyle:
```typescript
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: offset.value }],
}));
```

**BAD** — Missing worklet directive:
```typescript
const pan = Gesture.Pan().onUpdate((e) => {
  translateX.value = e.translationX; // Runs on JS thread!
});
```

**GOOD** — Gesture handlers are worklets by default, but custom functions need it:
```typescript
function customAnimation(value: number) {
  'worklet';
  return value * 2;
}
```

**BAD** — Capturing large objects in closures:
```typescript
const bigData = useMemo(() => generateLargeArray(), []);
const style = useAnimatedStyle(() => ({
  // bigData copied to UI thread every frame!
  opacity: bigData.length > 0 ? 1 : 0,
}));
```

**GOOD** — Capture only primitives:
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
| Timing animation | `withTiming()` | `x.value = withTiming(100, { duration: 300 })` |
| Spring animation | `withSpring()` | `x.value = withSpring(100)` |
| Sequence | `withSequence()` | `withSequence(withTiming(1), withTiming(0))` |
| Repeat | `withRepeat()` | `withRepeat(animation, 3, true)` |
| Delay | `withDelay()` | `withDelay(500, withTiming(1))` |
| Interpolate | `interpolate()` | `interpolate(x.value, [0, 1], [0, 100])` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and babel plugin | [01-setup-installation.md](01-setup-installation.md) |
| useSharedValue, .get(), .set() | [02-core-shared-values.md](02-core-shared-values.md) |
| useAnimatedStyle patterns | [03-core-animated-style.md](03-core-animated-style.md) |
| withTiming, withSpring, easing | [04-animations-timing-spring.md](04-animations-timing-spring.md) |
| withSequence, withRepeat, withDelay | [05-animations-modifiers.md](05-animations-modifiers.md) |
| Worklets and UI thread | [06-worklets-guide.md](06-worklets-guide.md) |
| Gesture handler integration | [07-gestures-events.md](07-gestures-events.md) |
| Full API reference | [08-api-reference-core.md](08-api-reference-core.md) |
| Performance and accessibility | [09-best-practices.md](09-best-practices.md) |
| Debugging and common errors | [10-troubleshooting-faq.md](10-troubleshooting-faq.md) |

---

**Version:** 3.x | **Source:** https://docs.swmansion.com/react-native-reanimated/
