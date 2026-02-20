# Best Practices, Performance & Security

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/  
**Version:** 4.2.1  
**Category:** Optimization | Patterns | Architecture

---

## 📋 Overview

This module covers performance optimization, security considerations, accessibility, and common pitfalls across all Reanimated features.

---

## 🚀 Performance Optimization

### 1. Minimize Shared Value Mutations

**Problem:** Unnecessary mutations trigger style updates.

```javascript
// ❌ BAD: Multiple mutations per frame
const handleScroll = (event) => {
  offset.value = event.nativeEvent.contentOffset.y;
  opacity.value = offset.value / 100;
  scale.value = 1 + (offset.value / 1000);
};

// ✅ GOOD: Single mutation, compute in useAnimatedStyle
const handleScroll = (event) => {
  offset.value = event.nativeEvent.contentOffset.y;
};

const animatedStyle = useAnimatedStyle(() => ({
  opacity: offset.value / 100,
  transform: [{ scale: 1 + (offset.value / 1000) }],
}));
```

### 2. Optimize Closure Capture in Worklets

**Problem:** Large objects captured in worklets increase memory.

```javascript
// ❌ BAD: Captures entire config object
const config = {
  colors: { primary: 'red', secondary: 'blue' },
  sizes: { small: 10, large: 20 },
  spacing: { xs: 4, sm: 8, md: 16 },
  // ... 50 more properties
};

const animatedStyle = useAnimatedStyle(() => {
  return { color: config.colors.primary }; // Captures all
});

// ✅ GOOD: Extract property first
const primaryColor = config.colors.primary;

const animatedStyle = useAnimatedStyle(() => {
  return { color: primaryColor }; // Captures only color
});
```

### 3. Avoid Expensive Computations in Worklets

**Problem:** Complex calculations on every frame drop FPS.

```javascript
// ❌ BAD: Expensive computation every frame
const animatedStyle = useAnimatedStyle(() => {
  const complexValue = JSON.parse(JSON.stringify(largeObject)); // Slow!
  return { opacity: offset.value };
});

// ✅ GOOD: Precompute outside worklet
const processedData = useMemo(() => {
  return JSON.parse(JSON.stringify(largeObject));
}, [largeObject]);

const animatedStyle = useAnimatedStyle(() => {
  return { opacity: offset.value };
});
```

### 4. Use Dependencies Wisely

```javascript
// ✅ GOOD: Specify dependencies only when needed
const animatedStyle = useAnimatedStyle(
  () => ({
    opacity: opacity.value,
  }),
  [externalVariable] // Only if truly needed
);

// Reanimated auto-tracks shared value dependencies
```

### 5. Batch Gesture Updates

```javascript
// ❌ BAD: Multiple gesture handlers on same element
<PanGestureHandler onGestureEvent={handler1}>
  <PinchGestureHandler onGestureEvent={handler2}>
    <RotationGestureHandler onGestureEvent={handler3}>
      <Animated.View />
    </RotationGestureHandler>
  </PinchGestureHandler>
</PanGestureHandler>

// ✅ GOOD: Use GestureDetector with combined gestures
const combined = Gesture.Pan()
  .onUpdate((e) => { /* handle */ })
  .simultaneously(Gesture.Pinch().onUpdate((e) => { /* handle */ }));

<GestureDetector gesture={combined}>
  <Animated.View />
</GestureDetector>
```

---

## 🔐 Security Considerations

### 1. No Browser Storage in Animated Components

**Problem:** `localStorage`, `sessionStorage`, `document.cookie` throw SecurityError.

```javascript
// ❌ WRONG: Will crash in sandbox
function AnimatedComponent() {
  useEffect(() => {
    localStorage.setItem('key', 'value'); // SecurityError
  }, []);
}

// ✅ CORRECT: Use shared value for animation state
const animatedValue = useSharedValue(0);
```

### 2. Input Validation in Gesture Handlers

```javascript
// ✅ GOOD: Validate gesture data
const handler = useAnimatedGestureHandler({
  onActive: (event, context) => {
    'worklet';
    // Clamp translation to safe range
    const safeX = Math.max(-100, Math.min(100, event.translationX));
    position.value = safeX;
  },
});
```

### 3. URL Prevention in String Animations

```javascript
// ❌ WRONG: Untrusted user input in animation
const dynamicColor = useSharedValue(userInputColor); // ⚠️ XSS risk

// ✅ CORRECT: Validate or use predefined values
const SAFE_COLORS = { red: '#ff0000', blue: '#0000ff' };
const safeColor = SAFE_COLORS[userInputColor] || 'blue';
const animatedColor = useSharedValue(safeColor);
```

---

## ♿ Accessibility (Reduce Motion)

### 1. Respect Device Reduce Motion Setting

```javascript
import { useReducedMotion } from 'react-native-reanimated';

function ResponsiveAnimation() {
  const reduceMotion = useReducedMotion();

  const animationDuration = reduceMotion ? 0 : 300;

  const opacity = useSharedValue(1);
  opacity.value = withTiming(0, { duration: animationDuration });

  return null;
}
```

### 2. Provide Non-Animated Alternatives

```javascript
// ✅ GOOD: Still functional without animations
function Button() {
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    // Return non-animated version
    return <TouchableOpacity onPress={handlePress} />;
  }

  // Return animated version
  return (
    <PressableWithAnimation onPress={handlePress} />
  );
}
```

### 3. Configuration for Reduce Motion

```javascript
import { ReduceMotion, withTiming } from 'react-native-reanimated';

opacity.value = withTiming(0, {
  duration: 300,
  reduceMotion: ReduceMotion.System, // Respects device setting (default)
  // ReduceMotion.Always, ReduceMotion.Never
});
```

---

## ⚠️ Common Pitfalls & Solutions

| Pitfall | Symptom | Fix |
|---|---|---|
| **Mutating nested objects** | Animations stop updating | Use object spread: `sv.value = { ...sv.value, x: 10 }` |
| **Reading shared value in render** | Stale values, no updates | Read in `useAnimatedStyle`, `useEffect`, or callbacks |
| **Large closure capture** | Memory leaks, crashes | Extract properties before worklet: `const color = config.color` |
| **scheduleOnRN in worklet scope** | Function undefined crash | Define function in JS thread scope, not inside worklet |
| **Animating inside useAnimatedStyle** | Infinite loops | Move mutations to event handlers or callbacks |
| **Missing GestureHandlerRootView** | Gestures not recognized (Android) | Wrap app with `GestureHandlerRootView` |
| **Hoisting worklets** | ReferenceError | Define worklets before use (no hoisting) |
| **Accessing React state in worklet** | Stale values | Use shared values for animation state |
| **Using setTimeout in worklet** | Not available on UI Runtime | Use `withTiming` or `useFrameCallback` |

---

## 📊 Performance Profiling

### Using React Native Profiler

```javascript
import { InteractionManager } from 'react-native';

function ProfileAnimation() {
  const handlePress = () => {
    InteractionManager.createInteractionHandle();
    
    opacity.value = withTiming(0, { duration: 500 }, (finished) => {
      if (finished) {
        InteractionManager.clearInteractionHandle(handle);
      }
    });
  };

  return null;
}
```

### Monitoring Frame Rate

```javascript
import { FpsInspector } from 'react-native-reanimated';

// Dev tool to monitor FPS
<FpsInspector />
```

---

## 🎨 Animation Best Practices

### 1. Choose Animation Type Wisely

```javascript
// Use withTiming for:
// - Fade in/out
// - Scale transitions
// - Color changes
opacity.value = withTiming(0, { duration: 300 });

// Use withSpring for:
// - Button presses
// - Draggable objects
// - Interactive elements
scale.value = withSpring(1, { stiffness: 150 });
```

### 2. Match Duration to Content

```javascript
// Short animations (200-300ms): Small elements, quick feedback
withTiming(target, { duration: 250 });

// Medium animations (300-500ms): Normal UI transitions
withTiming(target, { duration: 400 });

// Long animations (500ms+): Modal opens, page transitions
withTiming(target, { duration: 800 });
```

### 3. Use Easing for Natural Motion

```javascript
// Natural: Start slow, finish fast
Easing.out(Easing.cubic)

// Bouncy: Spring-like but timing-based
Easing.out(Easing.elastic)

// Linear: Rotation, looping animations
Easing.linear
```

---

## 🌐 Web Support Considerations

### 1. No UI Thread on Web

```javascript
function myWorklet() {
  'worklet';
  // On web: Runs as regular JavaScript
  // On native: Runs on native UI thread
}
```

### 2. Browser Compatibility

```javascript
// Some features limited on web:
// - Gesture detection
// - WebGL animations
// - Custom worklet runtimes

// Test thoroughly on both web and native
```

### 3. Performance on Web

Web animations are CPU-intensive. Limit concurrent animations:

```javascript
// ✅ GOOD: Few animations
opacity.value = withTiming(0);

// ❌ BAD: Too many simultaneous animations
for (let i = 0; i < 1000; i++) {
  values[i].value = withTiming(1); // Will be slow on web
}
```

---

## 📋 Code Organization

### Reusable Animation Hooks

```javascript
// hooks/useScaleAnimation.js
export function useScaleAnimation(initialScale = 1) {
  const scale = useSharedValue(initialScale);

  const animateScale = (targetScale, duration = 300) => {
    scale.value = withTiming(targetScale, { duration });
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return { scale, animateScale, animatedStyle };
}

// Usage
function Button() {
  const { animateScale, animatedStyle } = useScaleAnimation();

  const handlePress = () => animateScale(0.9);

  return <Animated.View style={animatedStyle} />;
}
```

### Gesture Handler Factories

```javascript
// utils/gestureHandlers.js
export function createPanHandler(position) {
  return useAnimatedGestureHandler({
    onStart: (event, context) => {
      'worklet';
      context.startX = position.value;
    },
    onActive: (event, context) => {
      'worklet';
      position.value = context.startX + event.translationX;
    },
  });
}
```

---

## 🔗 Cross-References

- **Shared Values:** See [02-core-shared-values.md](./02-core-shared-values.md) for mutation patterns
- **Animations:** See [04-animations-timing-spring.md](./04-animations-timing-spring.md) for timing choices
- **Worklets:** See [06-worklets-guide.md](./06-worklets-guide.md) for closure optimization
- **Gestures:** See [07-gestures-events.md](./07-gestures-events.md) for gesture patterns

---

## 📚 Official Documentation

- **Best Practices:** https://docs.swmansion.com/react-native-reanimated/docs/guides/best-practices/
- **Web Support:** https://docs.swmansion.com/react-native-reanimated/docs/guides/web-support/
- **Accessibility:** https://docs.swmansion.com/react-native-reanimated/docs/guides/accessibility/

---

**Last Updated:** December 2024  
**Verified For:** Reanimated 4.2.1
