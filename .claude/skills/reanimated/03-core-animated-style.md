# Core: useAnimatedStyle Hook

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedStyle/  
**Version:** 4.2.1  
**Category:** Core Hooks | Style Binding

---

## 📋 Overview

`useAnimatedStyle` creates a **reactive style object** that automatically updates when shared values change. It's the bridge between animated state (shared values) and visual output (component styles).

**Key Characteristics:**
- Executes on UI thread (no re-renders needed)
- Returns plain style object compatible with `Animated.View`, `Animated.Text`, etc.
- Reactive to changes in shared values and dependencies
- Supports all React Native style properties
- Performance-optimized (only updates affected styles)

---

## 🔧 Type Definition

```typescript
function useAnimatedStyle<T extends ViewStyle>(
  styleUpdater: () => T,
  dependencies?: DependencyList,
  adapters?: StyleAdapter
): Animated.AnimatedStyle<T>;
```

---

## 📖 Full API Reference

### `useAnimatedStyle(styleUpdater, dependencies?, adapters?)`

**Description:** Creates a style object that updates reactively when shared values referenced in `styleUpdater` change.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `styleUpdater` | `() => StyleObject` | ✅ Yes | Function returning style object (executed on UI thread) |
| `dependencies` | `Dependency[]` | ❌ No | Array of external dependencies (rarely needed; Reanimated infers automatically) |
| `adapters` | `StyleAdapter` | ❌ No | Custom prop adapters for complex animations |

**Returns:** `Animated.AnimatedStyle<T>` — Style object to pass to Animated component's `style` prop

---

## 💻 Basic Example

```javascript
import { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { StyleSheet } from 'react-native';

function FadeAnimation() {
  const opacity = useSharedValue(1);

  // Create animated style
  const animatedStyle = useAnimatedStyle(() => {
    return {
      opacity: opacity.value,
    };
  });

  const handlePress = () => {
    opacity.value = withTiming(0, { duration: 500 });
  };

  return (
    <Animated.View style={[styles.box, animatedStyle]} />
  );
}

const styles = StyleSheet.create({
  box: {
    width: 100,
    height: 100,
    backgroundColor: 'blue',
  },
});
```

---

## 🎯 Style Properties

`useAnimatedStyle` supports all React Native style properties:

### Transform Properties

```javascript
const rotation = useSharedValue(0);
const scale = useSharedValue(1);
const translateX = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { rotate: `${rotation.value}deg` },
    { scale: scale.value },
    { translateX: translateX.value },
  ],
}));
```

### Color Properties

```javascript
const backgroundColor = useSharedValue('blue');

const animatedStyle = useAnimatedStyle(() => ({
  backgroundColor: backgroundColor.value,
  // Note: Reanimated has interpolateColor() for color transitions
}));
```

### Layout Properties

```javascript
const width = useSharedValue(100);
const height = useSharedValue(100);

const animatedStyle = useAnimatedStyle(() => ({
  width: width.value,
  height: height.value,
  marginTop: 10 * width.value,
}));
```

### Opacity & Filter

```javascript
const opacity = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));
```

---

## 🔄 Reactivity Behavior

### Automatic Dependency Tracking

Reanimated automatically tracks which shared values are referenced in the callback:

```javascript
const opacity = useSharedValue(1);
const scale = useSharedValue(1);
const unused = useSharedValue(999);

const animatedStyle = useAnimatedStyle(() => {
  return {
    opacity: opacity.value,     // ✅ Tracked
    transform: [{ scale: scale.value }], // ✅ Tracked
    // unused.value not referenced, so not tracked ✅
  };
});

// When opacity or scale change, style updates automatically
// Changes to unused don't trigger style updates
```

### Manual Dependencies (Advanced)

For external variables, specify dependencies manually:

```javascript
const animationDuration = 500; // External variable

const animatedStyle = useAnimatedStyle(
  () => {
    return {
      opacity: opacity.value,
      // duration is captured but...
    };
  },
  [animationDuration] // ...specify here to ensure updates
);
```

---

## 📋 Common Patterns

### Conditional Styling

```javascript
const isPressed = useSharedValue(false);

const animatedStyle = useAnimatedStyle(() => {
  return {
    backgroundColor: isPressed.value ? 'red' : 'blue',
    opacity: isPressed.value ? 0.8 : 1,
  };
});
```

### Multiple Transforms

```javascript
const rotation = useSharedValue(0);
const translateY = useSharedValue(0);
const scale = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  transform: [
    { rotate: `${rotation.value}deg` },
    { translateY: translateY.value },
    { scale: scale.value },
  ],
}));
```

### Combining with Static Styles

```javascript
const opacity = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));

return (
  <Animated.View
    style={[
      styles.staticBox,        // Static styles (StyleSheet)
      animatedStyle,           // Animated styles
      { marginTop: 20 },      // Inline static styles
    ]}
  />
);
```

### Interpolation

```javascript
import { Extrapolate, interpolate } from 'react-native-reanimated';

const scrollOffset = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => {
  const opacity = interpolate(
    scrollOffset.value,
    [0, 100, 200],        // Input range
    [0, 0.5, 1],          // Output range
    Extrapolate.CLAMP
  );

  return { opacity };
});
```

---

## ⚠️ Critical Rules

### Rule 1: Don't Mutate Shared Values in styleUpdater

```javascript
const opacity = useSharedValue(1);

// ❌ WRONG: Mutating inside styleUpdater
const badStyle = useAnimatedStyle(() => {
  opacity.value = withTiming(0); // DON'T DO THIS!
  return { opacity: opacity.value };
});

// ✅ CORRECT: Mutate outside, read inside
const goodStyle = useAnimatedStyle(() => {
  return { opacity: opacity.value };
});

// Then mutate in callbacks:
const handlePress = () => {
  opacity.value = withTiming(0);
};
```

### Rule 2: Pass to Animated Components Only

```javascript
import Animated from 'react-native-reanimated';
import { View } from 'react-native';

const animatedStyle = useAnimatedStyle(() => ({ opacity: opacity.value }));

// ✅ CORRECT: Pass to Animated.View
<Animated.View style={animatedStyle} />

// ❌ WRONG: Pass to regular View (no effect)
<View style={animatedStyle} />
```

### Rule 3: Animated Components Must Be Wrapped

```javascript
import Animated from 'react-native-reanimated';

// ✅ CORRECT: Use Animated.View
<Animated.View style={animatedStyle} />

// ✅ CORRECT: For custom components
const AnimatedCustom = Animated.createAnimatedComponent(CustomComponent);
<AnimatedCustom style={animatedStyle} />
```

---

## 🔗 Integration with Animated Components

### Built-in Animated Components

```javascript
import Animated from 'react-native-reanimated';

// All of these accept animated styles
<Animated.View style={animatedStyle} />
<Animated.Text style={animatedStyle} />
<Animated.Image style={animatedStyle} />
<Animated.ScrollView style={animatedStyle} />
<Animated.FlatList style={animatedStyle} />
```

### Custom Components

```javascript
import Animated from 'react-native-reanimated';
import { Button } from 'react-native';

const AnimatedButton = Animated.createAnimatedComponent(Button);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));

return <AnimatedButton style={animatedStyle} />;
```

---

## 📊 Example: Complete Button Animation

```javascript
import {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Animated from 'react-native-reanimated';
import { Pressable, StyleSheet } from 'react-native';

function AnimatedButton() {
  const scale = useSharedValue(1);
  const backgroundColor = useSharedValue('blue');

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    backgroundColor: backgroundColor.value,
  }));

  const handlePressIn = () => {
    scale.value = withTiming(0.9, { duration: 100 });
  };

  const handlePressOut = () => {
    scale.value = withTiming(1, {
      duration: 200,
      easing: Easing.out(Easing.quad),
    });
  };

  return (
    <Pressable onPressIn={handlePressIn} onPressOut={handlePressOut}>
      <Animated.View style={[styles.button, animatedStyle]}>
        <Animated.Text style={styles.text}>Press Me</Animated.Text>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 100,
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
  },
});
```

---

## 🎯 Performance Considerations

### Avoid Expensive Computations

```javascript
// ❌ AVOID: Expensive computation in every frame
const animatedStyle = useAnimatedStyle(() => {
  const complexCalculation = JSON.parse(JSON.stringify(largeObject)); // Slow!
  return { opacity: opacity.value };
});

// ✅ CORRECT: Compute outside, reference in worklet
const precomputed = useMemo(() => largeObject, []);
const animatedStyle = useAnimatedStyle(() => {
  return { opacity: opacity.value };
});
```

### Limit Recomputation with Dependencies

```javascript
// Only recompute when dependencies change
const animatedStyle = useAnimatedStyle(
  () => ({
    opacity: opacity.value,
  }),
  [someVariable] // Add dependency if external variable used
);
```

---

## 🔗 Cross-References

- **useSharedValue:** See [02-core-shared-values.md](./02-core-shared-values.md) to create animated state
- **Animations:** See [04-animations-timing-spring.md](./04-animations-timing-spring.md) to create animations
- **Gestures:** See [07-gestures-events.md](./07-gestures-events.md) to bind gestures to styles
- **useAnimatedProps:** For animating non-style properties (like text content)
- **Best Practices:** See [09-best-practices.md](./09-best-practices.md) for optimization

---

## 📚 Official Documentation

- **useAnimatedStyle Reference:** https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedStyle/
- **Animated Components:** https://docs.swmansion.com/react-native-reanimated/docs/core/createAnimatedComponent/
- **Interpolation:** https://docs.swmansion.com/react-native-reanimated/docs/animations/interpolate/

---

**Last Updated:** December 2024  
**Verified For:** Reanimated 4.2.1
