# Core: useAnimatedStyle, useAnimatedProps, useAnimatedRef

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedStyle/

---

## Overview

These hooks bridge animated state (shared values) to visual output. `useAnimatedStyle` creates reactive style objects, `useAnimatedProps` animates non-style props, and `useAnimatedRef` provides references for measurement and scrolling.

---

## useAnimatedStyle

Creates a reactive style object that automatically updates on the UI thread when shared values change.

```typescript
function useAnimatedStyle<T extends ViewStyle>(
  styleUpdater: () => T,
  dependencies?: DependencyList
): AnimatedStyleProp<T>;
```

| Parameter | Type | Required | Description |
|---|---|---|---|
| `styleUpdater` | `() => T` | Yes | Function returning style object, executes on UI thread |
| `dependencies` | `DependencyList` | No | External dependencies (Reanimated auto-tracks shared values) |

**Returns:** Animated style object to pass to `Animated.View`, `Animated.Text`, etc.

### Basic Usage

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';
import { StyleSheet, Pressable } from 'react-native';

function FadeAnimation() {
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  const handlePress = () => {
    opacity.value = withTiming(0, { duration: 500 });
  };

  return (
    <Pressable onPress={handlePress}>
      <Animated.View style={[styles.box, animatedStyle]} />
    </Pressable>
  );
}
```

### Transform Properties

```typescript
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

### Combining with Static Styles

```typescript
return (
  <Animated.View
    style={[
      styles.staticBox,   // Static styles (StyleSheet)
      animatedStyle,       // Animated styles
      { marginTop: 20 },  // Inline static styles
    ]}
  />
);
```

### Interpolation Inside Style

```typescript
import { interpolate, Extrapolation } from 'react-native-reanimated';

const scrollOffset = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => {
  const opacity = interpolate(
    scrollOffset.value,
    [0, 100, 200],
    [0, 0.5, 1],
    Extrapolation.CLAMP
  );
  return { opacity };
});
```

### Color Interpolation

```typescript
import { interpolateColor } from 'react-native-reanimated';

const progress = useSharedValue(0);

const animatedStyle = useAnimatedStyle(() => ({
  backgroundColor: interpolateColor(
    progress.value,
    [0, 1],
    ['#FF0000', '#00FF00']
  ),
}));
```

---

## useAnimatedProps

Animates non-style props (e.g., SVG attributes, text content). Same API as `useAnimatedStyle`.

```typescript
function useAnimatedProps<T extends Record<string, any>>(
  updater: () => T,
  dependencies?: DependencyList,
  adapters?: PropAdapter[]
): AnimatedProps<T>;
```

### SVG Example

```typescript
import Animated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import Svg, { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle);

function AnimatedSVG() {
  const radius = useSharedValue(50);

  const animatedProps = useAnimatedProps(() => ({
    r: radius.value,
  }));

  return (
    <Svg>
      <AnimatedCircle cx="100" cy="100" animatedProps={animatedProps} />
    </Svg>
  );
}
```

### CSS SVG Animations (v4.3.0+)

Reanimated 4.3.0 added CSS animation support for SVG components including Path, Image, LinearGradient, RadialGradient, Pattern, Text, Polyline, and Polygon. This includes special handling for path morphing via the `d` property.

```typescript
import Animated, { useAnimatedProps, useSharedValue, withTiming } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

const AnimatedPath = Animated.createAnimatedComponent(Path);

function MorphingPath() {
  const progress = useSharedValue(0);

  const animatedProps = useAnimatedProps(() => ({
    d: progress.value === 0
      ? 'M10 80 C 40 10, 65 10, 95 80 S 150 150, 180 80'
      : 'M10 80 Q 95 10 180 80',
    fill: 'none',
    stroke: 'blue',
    strokeWidth: 2,
  }));

  const toggle = () => {
    progress.value = withTiming(progress.value === 0 ? 1 : 0, { duration: 600 });
  };

  return (
    <Svg viewBox="0 0 200 200">
      <AnimatedPath animatedProps={animatedProps} />
    </Svg>
  );
}
```

Supported SVG components for CSS animations:
- `Path` (including `d` property morphing)
- `Image`, `Text`
- `LinearGradient`, `RadialGradient`
- `Pattern`
- `Polyline`, `Polygon`
- Percentage-based length values supported

---

## useAnimatedRef

Returns a ref for use with `measure()` and `scrollTo()`.

```typescript
function useAnimatedRef<T extends Component>(): AnimatedRef<T>;
```

Takes no arguments. Returns an object with `current` property available after mount.

```typescript
import Animated, { useAnimatedRef } from 'react-native-reanimated';

function App() {
  const animatedRef = useAnimatedRef();

  return <Animated.View ref={animatedRef} />;
}
```

**Platform support:** Android, iOS, Web.

---

## measure()

Retrieve component dimensions and position. Must be called from the UI thread.

```typescript
function measure<T extends Component>(
  animatedRef: AnimatedRef<T>
): MeasuredDimensions | null;

interface MeasuredDimensions {
  x: number;      // Relative to parent
  y: number;      // Relative to parent
  width: number;
  height: number;
  pageX: number;  // Relative to screen
  pageY: number;  // Relative to screen
}
```

Returns `null` if component is not yet rendered. Always check for null.

```typescript
import { useAnimatedRef, measure, runOnUI } from 'react-native-reanimated';

const animatedRef = useAnimatedRef();

const handlePress = () => {
  runOnUI(() => {
    'worklet';
    const measurement = measure(animatedRef);
    if (measurement === null) return;
    console.log('Width:', measurement.width);
    console.log('Page position:', measurement.pageX, measurement.pageY);
  })();
};
```

---

## scrollTo()

Programmatically scroll a scrollable component. Must be called from the UI thread.

```typescript
function scrollTo<T extends Component>(
  animatedRef: AnimatedRef<T>,
  x: number,
  y: number,
  animated: boolean
): void;
```

| Parameter | Type | Description |
|---|---|---|
| `animatedRef` | `AnimatedRef<T>` | Ref connected to a ScrollView or FlatList |
| `x` | `number` | Horizontal offset in pixels |
| `y` | `number` | Vertical offset in pixels |
| `animated` | `boolean` | `true` for smooth scroll, `false` for instant |

```typescript
import Animated, {
  useAnimatedRef,
  useDerivedValue,
  scrollTo,
} from 'react-native-reanimated';

function ScrollExample() {
  const animatedRef = useAnimatedRef();
  const scrollOffset = useSharedValue(0);

  useDerivedValue(() => {
    scrollTo(animatedRef, 0, scrollOffset.value, true);
  });

  return <Animated.ScrollView ref={animatedRef}>{/* content */}</Animated.ScrollView>;
}
```

---

## useAnimatedReaction

React to changes in computed values. Similar to `useEffect` for worklets.

```typescript
function useAnimatedReaction<T>(
  prepare: () => T,
  react: (current: T, previous: T | null) => void,
  dependencies?: DependencyList
): void;
```

```typescript
import { useAnimatedReaction, useSharedValue } from 'react-native-reanimated';

const scrollOffset = useSharedValue(0);
const isScrolledDown = useSharedValue(false);

useAnimatedReaction(
  () => scrollOffset.value > 100,
  (current, previous) => {
    if (current !== previous) {
      isScrolledDown.value = current;
    }
  }
);
```

---

## Animated Components

### Built-in

```typescript
import Animated from 'react-native-reanimated';

<Animated.View style={animatedStyle} />
<Animated.Text style={animatedStyle} />
<Animated.Image style={animatedStyle} />
<Animated.ScrollView style={animatedStyle} />
<Animated.FlatList style={animatedStyle} />
```

### Custom Components

```typescript
import Animated from 'react-native-reanimated';
import { TextInput } from 'react-native';

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
```

---

## Critical Rules

1. **Pass animated styles only to Animated components** -- regular `View` ignores them
2. **Do not mutate shared values inside styleUpdater** -- causes infinite loops
3. **Reanimated auto-tracks shared value dependencies** -- manual deps rarely needed
4. **Avoid expensive computations in styleUpdater** -- runs on every frame

---

## interpolate()

Map input ranges to output ranges.

```typescript
function interpolate(
  value: number,
  inputRange: number[],
  outputRange: (number | string)[],
  extrapolation?: Extrapolation | { extrapolateLeft?: Extrapolation; extrapolateRight?: Extrapolation }
): number;

enum Extrapolation {
  EXTEND = 'extend',
  CLAMP = 'clamp',
  IDENTITY = 'identity',
}
```

```typescript
const opacity = interpolate(
  scrollOffset.value,
  [0, 100, 200],
  [0, 0.5, 1],
  Extrapolation.CLAMP
);
```

---

## interpolateColor()

Interpolate between colors.

```typescript
function interpolateColor(
  value: number,
  inputRange: number[],
  outputRange: string[],
  colorSpace?: 'RGB' | 'HSV' | 'LAB'
): string;
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `value` | `number` | -- | Input value |
| `inputRange` | `number[]` | -- | Ascending array of input breakpoints |
| `outputRange` | `string[]` | -- | Color strings (named, hex, rgba) |
| `colorSpace` | `'RGB' \| 'HSV' \| 'LAB'` | `'RGB'` | Interpolation color model |

Returns interpolated color as `rgba(r, g, b, a)` string.

```typescript
const backgroundColor = interpolateColor(
  progress.value,
  [0, 0.5, 1],
  ['red', '#FFD700', 'green'],
  'RGB'
);
```

---

## Cross-References

- **Shared values:** [02-core-shared-values.md](02-core-shared-values.md)
- **Animations:** [04-animations-timing-spring.md](04-animations-timing-spring.md)
- **Gestures:** [07-gestures-events.md](07-gestures-events.md)
- **Best practices:** [09-best-practices.md](09-best-practices.md)

---
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedStyle/ | https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedProps/ | https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedRef/ | https://docs.swmansion.com/react-native-reanimated/docs/utilities/interpolateColor/
