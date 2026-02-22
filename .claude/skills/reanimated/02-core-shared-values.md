# Core: Shared Values

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/

---

## Overview

`useSharedValue` creates a mutable value accessible from both the JavaScript Runtime (JS thread) and UI Runtime (UI thread). It is the foundational primitive for storing animated state. Unlike React state, changing a shared value does not trigger component re-renders.

---

## useSharedValue

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

| Parameter | Type | Required | Description |
|---|---|---|---|
| `initialValue` | `Value` | Yes | Initial value (number, string, object, array, boolean) |

**Returns:** `SharedValue<Value>` -- mutable object synchronized between JS and UI threads.

### Basic Usage

```typescript
import { useSharedValue } from 'react-native-reanimated';

function App() {
  const opacity = useSharedValue(1);
  const position = useSharedValue({ x: 0, y: 0 });
  const colors = useSharedValue<string[]>(['red', 'blue']);

  // Read
  console.log(opacity.value); // 1

  // Write
  opacity.value = 0.5;

  return null;
}
```

---

## .value Property

Direct read/write access to the shared value.

```typescript
const sv = useSharedValue(100);

// Read
const current = sv.value; // 100

// Write
sv.value = 200;
```

**Caveat -- nested mutation loses reactivity:**

```typescript
const pos = useSharedValue({ x: 0, y: 0 });

// BAD: Loses reactivity
pos.value.x = 50;

// GOOD: Create new object
pos.value = { x: 50, y: pos.value.y };

// GOOD: Use .modify() for in-place updates
pos.modify((value) => {
  'worklet';
  value.x = 50;
  return value;
});
```

---

## .get() and .set() (React Compiler Compatible)

Type-safe alternative to `.value`. Required when using React Compiler.

```typescript
const sv = useSharedValue(100);

// Read
const value = sv.get(); // 100

// Write (direct)
sv.set(200);

// Write (updater function)
sv.set((prev) => prev + 50);
```

### Full Example with React Compiler

```typescript
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

function App() {
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

## .modify()

Update shared value while preserving object identity. Efficient for large arrays and complex objects.

```typescript
function modify(
  modifier?: <T extends Value>(value: T) => T,
  forceUpdate?: boolean
): void;
```

| Parameter | Type | Default | Description |
|---|---|---|---|
| `modifier` | `(value: T) => T` | -- | Function that mutates and returns the value |
| `forceUpdate` | `boolean` | `false` | Force UI update even if value unchanged |

```typescript
const items = useSharedValue([1, 2, 3]);

// Without .modify(): creates new array
items.value = [...items.value, 4]; // Memory allocation

// With .modify(): mutates in place
items.modify((value) => {
  'worklet';
  value.push(4);
  return value;
});
```

---

## .addListener() and .removeListener()

Register callbacks when shared value changes.

```typescript
const rotation = useSharedValue(0);

useEffect(() => {
  const listenerID = 42;

  rotation.addListener(listenerID, (newValue) => {
    console.log('Rotation changed to:', newValue);
  });

  return () => rotation.removeListener(listenerID);
}, []);
```

---

## useDerivedValue

Compute a derived shared value that updates when dependencies change.

```typescript
function useDerivedValue<T>(
  processor: () => T,
  dependencies?: DependencyList
): SharedValue<T>;
```

```typescript
import { useSharedValue, useDerivedValue } from 'react-native-reanimated';

const width = useSharedValue(100);
const height = useSharedValue(50);

const area = useDerivedValue(() => {
  return width.value * height.value;
});

const animatedStyle = useAnimatedStyle(() => ({
  opacity: area.value / 10000,
}));
```

---

## Thread Safety Rules

### Read/Write in Correct Context

```typescript
function App() {
  const sv = useSharedValue(0);

  // OK: Read/write in useEffect
  useEffect(() => {
    sv.value = 10;
    console.log(sv.value);
  }, []);

  // OK: Read in useAnimatedStyle (worklet context)
  const animatedStyle = useAnimatedStyle(() => {
    return { opacity: sv.value };
  });

  // AVOID: Read during render (stale value, no updates)
  console.log(sv.value);
}
```

### Closure Capture Optimization

Worklets capture referenced variables. Avoid capturing large objects:

```typescript
const theme = { color: 'red', fontSize: 16, /* 50 more props */ };

// BAD: Captures entire theme object
function badWorklet() {
  'worklet';
  console.log(theme.color);
}

// GOOD: Extract property first
const themeColor = theme.color;
function goodWorklet() {
  'worklet';
  console.log(themeColor);
}
```

---

## Common Patterns

### Animation State Container

```typescript
function useAnimationState() {
  const isAnimating = useSharedValue(false);
  const progress = useSharedValue(0);
  const startTime = useSharedValue(0);
  return { isAnimating, progress, startTime };
}
```

### Multi-Value Synchronization

```typescript
const opacity = useSharedValue(1);
const scale = useSharedValue(1);

const handlePress = () => {
  opacity.value = withTiming(0.5);
  scale.value = withTiming(0.9);
};
```

---

## Common Pitfalls

| Pitfall | Problem | Solution |
|---|---|---|
| `sv.value.x = 10` | Loses reactivity | Use spread: `sv.value = { ...sv.value, x: 10 }` |
| Reading `.value` in render | Stale value, no re-renders | Read in `useAnimatedStyle`, `useEffect`, or callbacks |
| Capturing large objects | Memory overhead in worklets | Extract needed properties before capture |
| Not using `.get()`/`.set()` with React Compiler | Incompatible | Switch to `.get()`/`.set()` methods |
| Mutating arrays in worklets | Loses reactivity | Use `.modify()` for complex updates |

---

## Cross-References

- **useAnimatedStyle:** [03-core-animated-style.md](03-core-animated-style.md)
- **Worklets:** [06-worklets-guide.md](06-worklets-guide.md)
- **Animations:** [04-animations-timing-spring.md](04-animations-timing-spring.md)
- **Gestures:** [07-gestures-events.md](07-gestures-events.md)

---
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/ | https://docs.swmansion.com/react-native-reanimated/docs/core/useDerivedValue/
