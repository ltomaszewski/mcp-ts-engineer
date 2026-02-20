# API Reference: Core Hooks (Complete)

**Source:** https://www.jsdocs.io/package/react-native-reanimated (v4.2.1)  
**Version:** 4.2.1  
**Category:** API Reference

---

## 📋 Overview

Complete API reference for all core Reanimated hooks with typed parameters, return values, and real-world examples.

---

## useSharedValue

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/

```typescript
function useSharedValue<Value>(initialValue: Value): SharedValue<Value>;

interface SharedValue<Value = unknown> {
  value: Value;
  get(): Value;
  set(value: Value | ((value: Value) => Value)): void;
  addListener: (listenerID: number, listener: (value: Value) => void) => void;
  removeListener: (listenerID: number) => void;
  modify: (
    modifier?: <T extends Value>(value: T) => T,
    forceUpdate?: boolean
  ) => void;
}
```

**Parameters:**
- `initialValue: Value` — Any initial value (number, string, object, array)

**Returns:** `SharedValue<Value>` — Mutable object synchronized between threads

**Example:**
```javascript
const count = useSharedValue(0);
const position = useSharedValue({ x: 0, y: 0 });
const colors = useSharedValue(['red', 'blue']);

count.value = 10;
const current = count.get();
count.set((prev) => prev + 1);
```

---

## useAnimatedStyle

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedStyle/

```typescript
function useAnimatedStyle<T extends ViewStyle>(
  styleUpdater: () => T,
  dependencies?: DependencyList,
  adapters?: StyleAdapter
): Animated.AnimatedStyle<T>;
```

**Parameters:**
- `styleUpdater: () => T` — Function returning style object (executes on UI thread)
- `dependencies?: Dependency[]` — Optional external dependencies
- `adapters?: StyleAdapter` — Optional custom style adapters

**Returns:** `Animated.AnimatedStyle<T>` — Animated style object

**Example:**
```javascript
const opacity = useSharedValue(1);

const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
  transform: [{ scale: 1 + opacity.value }],
}));

return <Animated.View style={animatedStyle} />;
```

---

## useAnimatedProps

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedProps/

```typescript
function useAnimatedProps<T extends Record<string, any>>(
  updater: () => T,
  dependencies?: DependencyList,
  adapters?: PropAdapter[]
): Animated.AnimatedProps<T>;
```

**Description:** Similar to `useAnimatedStyle` but for non-style props.

**Parameters:**
- `updater: () => T` — Function returning props object
- `dependencies?: Dependency[]` — Optional dependencies
- `adapters?: PropAdapter[]` — Custom prop adapters

**Returns:** `Animated.AnimatedProps<T>` — Animated props

**Example:**
```javascript
const progress = useSharedValue(0);

const animatedProps = useAnimatedProps(() => ({
  strokeDashoffset: 100 - progress.value,
  opacity: progress.value,
}));

return <Animated.View animatedProps={animatedProps} />;
```

---

## useAnimatedReaction

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedReaction/

```typescript
function useAnimatedReaction<T>(
  prepare: () => T,
  react: (value: T) => void,
  dependencies?: DependencyList
): void;
```

**Description:** React to changes in a computed value. Similar to `useEffect` for worklets.

**Parameters:**
- `prepare: () => T` — Compute a value (on UI thread)
- `react: (value: T) => void` — Called when computed value changes
- `dependencies?: Dependency[]` — Optional dependencies

**Example:**
```javascript
const scrollOffset = useSharedValue(0);

useAnimatedReaction(
  () => scrollOffset.value > 100, // Prepare: condition
  (isScrolledDown) => {
    'worklet';
    if (isScrolledDown) {
      // Do something when scrolled past 100px
    }
  }
);
```

---

## useDerivedValue

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useDerivedValue/

```typescript
function useDerivedValue<T>(
  processor: () => T,
  dependencies?: DependencyList
): Animated.SharedValue<T>;
```

**Description:** Compute a derived shared value that updates whenever dependencies change.

**Parameters:**
- `processor: () => T` — Function returning derived value
- `dependencies?: Dependency[]` — Optional dependencies

**Returns:** `SharedValue<T>` — Shared value containing derived result

**Example:**
```javascript
const width = useSharedValue(100);
const height = useSharedValue(50);

const area = useDerivedValue(() => {
  return width.value * height.value;
});

const animatedStyle = useAnimatedStyle(() => ({
  opacity: area.value / 10000, // Use derived value
}));
```

---

## useFrameCallback

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useFrameCallback/

```typescript
function useFrameCallback(
  callback: (info: FrameInfo) => void,
  autostart?: boolean
): FrameCallback;

interface FrameInfo {
  timestamp: number; // Milliseconds since start
  timeSincePreviousFrame: number; // Time since last frame
}

interface FrameCallback {
  setActive: (active: boolean) => void;
}
```

**Description:** Execute code on every frame (60/120 fps).

**Parameters:**
- `callback: (info: FrameInfo) => void` — Function called each frame
- `autostart?: boolean` — Start automatically (default: true)

**Returns:** `FrameCallback` — Object with `setActive()` to pause/resume

**Example:**
```javascript
const position = useSharedValue(0);
const velocity = useSharedValue(0);

useFrameCallback(({ timeSincePreviousFrame }) => {
  'worklet';
  // Update position based on velocity each frame
  position.value += velocity.value * (timeSincePreviousFrame / 1000);
}, true);
```

---

## withTiming

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/animations/withTiming/

```typescript
function withTiming(
  targetValue: number,
  config?: WithTimingConfig,
  callback?: (finished: boolean) => void
): AnimationObject;

interface WithTimingConfig {
  duration?: number;  // milliseconds (default: 300)
  easing?: Easing;   // easing function
}
```

**Parameters:**
- `targetValue: number` — Animation target
- `config?: WithTimingConfig` — Duration and easing
- `callback?: (finished: boolean) => void` — Called on completion

**Example:**
```javascript
opacity.value = withTiming(0, {
  duration: 500,
  easing: Easing.inOut(Easing.quad),
}, (finished) => {
  if (finished) console.log('Done');
});
```

---

## withSpring

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/animations/withSpring/

```typescript
function withSpring(
  targetValue: number,
  config?: WithSpringConfig,
  callback?: (finished: boolean) => void
): AnimationObject;

interface WithSpringConfig {
  mass?: number;                      // default: 1
  damping?: number;                   // default: 10
  stiffness?: number;                 // default: 100
  overshootClamping?: boolean;        // default: false
  restSpeedThreshold?: number;        // default: 10
  restDisplacementThreshold?: number; // default: 10
}
```

**Example:**
```javascript
scale.value = withSpring(1.2, {
  mass: 1,
  stiffness: 100,
  damping: 10,
});
```

---

## withSequence

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/animations/withSequence/

```typescript
function withSequence(
  ...animations: AnimationObject[]
): AnimationObject;
```

**Description:** Chain animations sequentially.

**Example:**
```javascript
scale.value = withSequence(
  withTiming(0.9, { duration: 100 }),
  withSpring(1, { stiffness: 150 })
);
```

---

## withRepeat

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/animations/withRepeat/

```typescript
function withRepeat(
  animation: AnimationObject,
  numberOfReps?: number,
  reverse?: boolean,
  callback?: (finished: boolean) => void
): AnimationObject;
```

**Parameters:**
- `animation: AnimationObject` — Animation to repeat
- `numberOfReps?: number` — Number of repetitions (-1 = infinite)
- `reverse?: boolean` — Reverse direction each repeat
- `callback?: (finished: boolean) => void` — Called on completion

**Example:**
```javascript
opacity.value = withRepeat(
  withTiming(0.5, { duration: 500 }),
  -1,    // Infinite
  true   // Reverse each time (pulse effect)
);
```

---

## withDecay

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/animations/withDecay/

```typescript
function withDecay(
  config: WithDecayConfig,
  callback?: (finished: boolean) => void
): AnimationObject;

interface WithDecayConfig {
  velocity: number;              // Initial velocity
  clamp?: [min: number, max: number]; // Optional bounds
  velocityFactor?: number;       // default: 1
  deceleration?: number;         // default: 0.98
}
```

**Description:** Physics-based decay animation (momentum).

**Example:**
```javascript
position.value = withDecay({
  velocity: event.velocityX,
  clamp: [-100, 100], // Stop at bounds
  deceleration: 0.95,
});
```

---

## useAnimatedGestureHandler

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/advanced/useAnimatedGestureHandler/

```typescript
function useAnimatedGestureHandler<T, Context>(
  handlers: {
    onStart?: (event: T, context: Context) => void;
    onActive?: (event: T, context: Context) => void;
    onEnd?: (event: T, context: Context) => void;
    onFail?: (event: T, context: Context) => void;
    onCancel?: (event: T, context: Context) => void;
  },
  dependencies?: DependencyList
): AnimatedGestureHandler<T>;
```

**Example:**
```javascript
const handler = useAnimatedGestureHandler({
  onStart: (event, context) => {
    'worklet';
    context.startX = position.value;
  },
  onActive: (event, context) => {
    'worklet';
    position.value = context.startX + event.translationX;
  },
  onEnd: (event, context) => {
    'worklet';
    // Snap to position
  },
});
```

---

## interpolate

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/animations/interpolate/

```typescript
function interpolate(
  value: number | Animated.SharedValue<number>,
  inputRange: number[],
  outputRange: (number | string)[],
  type?: Extrapolate,
  options?: InterpolateOptions
): number | string;

enum Extrapolate {
  EXTEND = 'extend',    // Linear extrapolation
  CLAMP = 'clamp',      // Clamp to output range
  IDENTITY = 'identity', // Use input value
}
```

**Example:**
```javascript
const opacity = interpolate(
  scrollOffset.value,
  [0, 100, 200],
  [0, 0.5, 1],
  Extrapolate.CLAMP
);
```

---

## Easing

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/animations/easing/

```typescript
// Base functions
Easing.linear
Easing.quad
Easing.cubic
Easing.sin
Easing.exp
Easing.bounce

// Modifiers
Easing.in(fn)      // Slow start
Easing.out(fn)     // Slow finish
Easing.inOut(fn)   // Slow start and finish

// Example
Easing.inOut(Easing.cubic)
Easing.out(Easing.bounce)
```

---

## cancelAnimation

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/animations/cancelAnimation/

```typescript
function cancelAnimation(sharedValue: SharedValue<any>): void;
```

**Description:** Stop an animation running on a shared value.

**Example:**
```javascript
const opacity = useSharedValue(1);

const handlePress = () => {
  opacity.value = withTiming(0, { duration: 5000 });
};

const handleCancel = () => {
  cancelAnimation(opacity);
};
```

---

## createAnimatedComponent

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/createAnimatedComponent/

```typescript
function createAnimatedComponent<T>(
  Component: React.ComponentType<T>,
  options?: CreateAnimatedComponentOptions
): React.ComponentType<T>;
```

**Description:** Wrap custom components to accept animated styles/props.

**Example:**
```javascript
const AnimatedCustom = Animated.createAnimatedComponent(MyComponent);

return <AnimatedCustom style={animatedStyle} />;
```

---

## 🔗 Cross-References

- **Detailed Hooks:** See individual module files for deep dives
- **Usage Examples:** See [07-gestures-events.md](./07-gestures-events.md), [03-core-animated-style.md](./03-core-animated-style.md)
- **Performance:** See [09-best-practices.md](./09-best-practices.md)

---

## 📚 Official API Docs

- **Complete API:** https://docs.swmansion.com/react-native-reanimated/docs/core/
- **jsDocs Reference:** https://www.jsdocs.io/package/react-native-reanimated

---

**Last Updated:** December 2024  
**Verified For:** Reanimated 4.2.1
