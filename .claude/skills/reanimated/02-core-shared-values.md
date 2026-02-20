# Core: useSharedValue Hook

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/  
**Version:** 4.2.1  
**Category:** Core Hooks | State Management

---

## 📋 Overview

`useSharedValue` creates a mutable value accessible from both the **JavaScript Runtime** (JS thread) and **UI Runtime** (UI thread). It's the foundational primitive for storing animated state in Reanimated.

**Key Characteristics:**
- Thread-safe synchronization between JS and UI threads
- Reactive updates (triggers style/props updates when changed in animation contexts)
- NOT a React state (doesn't trigger component re-renders)
- Works with `useAnimatedStyle`, `useAnimatedProps`, gesture handlers

---

## 🔧 Type Definition

```typescript
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

function useSharedValue<Value>(initialValue: Value): SharedValue<Value>;
```

---

## 📖 Full API Reference

### `useSharedValue(initialValue)`

**Description:** Creates a shared value that can be read and modified from both JS and UI threads.

**Parameters:**

| Parameter | Type | Required | Description |
|---|---|---|---|
| `initialValue` | `Value` | ✅ Yes | Initial value (any type: number, string, object, array) |

**Returns:** `SharedValue<Value>` — An object with `.value` property and utility methods.

**Example:**

```javascript
import { useSharedValue } from 'react-native-reanimated';

function App() {
  // Create a shared value with initial value of 0
  const opacity = useSharedValue(1);
  
  // Read the value
  console.log(opacity.value); // 1
  
  // Modify the value
  opacity.value = 0.5;
  
  return null;
}
```

---

### `.value` Property (Direct Access)

**Description:** Read or write the shared value directly.

**Syntax:**
```javascript
const sv = useSharedValue(100);

// Read
const currentValue = sv.value; // 100

// Write (simple)
sv.value = 200;

// Write (with function updater)
sv.value = (prev) => prev + 50;
```

**⚠️ Caveat — React Compiler:** When using React Compiler, avoid direct `.value` access. Use `.get()` and `.set()` instead (see below).

**⚠️ Caveat — Mutations:** Direct mutation of nested objects loses reactivity:

```javascript
const pos = useSharedValue({ x: 0, y: 0 });

// ❌ WRONG: Loses reactivity
pos.value.x = 50;

// ✅ CORRECT: Create new object
pos.value = { x: 50, y: pos.value.y };

// ✅ CORRECT: Use .modify() for large objects
pos.modify((value) => {
  'worklet';
  value.x = 50;
  return value;
});
```

---

### `.get()` & `.set()` Methods (React Compiler Compatible)

**Description:** Type-safe alternative to direct `.value` access, compatible with React Compiler.

**When to Use:** Always, if using React Compiler; optional otherwise.

**Syntax:**

```javascript
const sv = useSharedValue(100);

// Read
const value = sv.get(); // 100

// Write (direct)
sv.set(200);

// Write (with updater function)
sv.set((prev) => prev + 50);
```

**Example with React Compiler:**

```javascript
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

function App() {
  const width = useSharedValue(100);

  const animatedStyle = useAnimatedStyle(() => ({
    width: width.get() * 2, // Use .get() instead of .value
  }));

  const handlePress = () => {
    width.set((prev) => prev + 10); // Use .set() instead of .value =
  };

  return null;
}
```

---

### `.modify(modifier, forceUpdate?)`

**Description:** Update shared value while preserving object identity. Useful for large arrays or complex objects.

**Parameters:**

| Parameter | Type | Default | Description |
|---|---|---|---|
| `modifier` | `(value: T) => T` | — | Function that modifies and returns the value |
| `forceUpdate` | `boolean` | `false` | Force UI thread update even if value unchanged |

**Returns:** `void`

**Example:**

```javascript
const items = useSharedValue([1, 2, 3]);

// Without .modify(): creates new array (less efficient for large arrays)
items.value = [...items.value, 4]; // ⚠️ Memory allocation

// With .modify(): mutates in place (more efficient)
items.modify((value) => {
  'worklet';
  value.push(4);
  return value;
});
```

---

### `.addListener()` & `.removeListener()`

**Description:** Register callbacks when shared value changes.

**Parameters:**

| Parameter | Type | Description |
|---|---|---|
| `listenerID` | `number` | Unique identifier for the listener |
| `listener` | `(value: Value) => void` | Callback function |

**Example:**

```javascript
const rotation = useSharedValue(0);

useEffect(() => {
  const listenerID = 0;
  
  rotation.addListener(listenerID, (newValue) => {
    console.log('Rotation changed to:', newValue);
  });
  
  return () => rotation.removeListener(listenerID);
}, []);
```

---

## 🧠 Thread Safety & Reactivity Rules

### Rule 1: Read/Write in Correct Context

```javascript
function App() {
  const sv = useSharedValue(0);

  // ✅ OK: Read/write in JS context
  useEffect(() => {
    sv.value = 10;
    console.log(sv.value);
  }, []);

  // ✅ OK: Read/write in worklet context
  const animatedStyle = useAnimatedStyle(() => {
    sv.value += 1; // Worklet context
    return { opacity: sv.value };
  });

  // ❌ WRONG: Read during render
  console.log(sv.value); // Stale value, doesn't trigger updates
}
```

### Rule 2: Updates in useAnimatedStyle Trigger Redraws

```javascript
const opacity = useSharedValue(1);

const style = useAnimatedStyle(() => {
  return { opacity: opacity.value }; // Triggers style update
});

// Changing the value updates the style
opacity.value = withTiming(0); // Style re-renders automatically
```

### Rule 3: Closure Capture

Worklets capture variables referenced in their body. For efficiency, avoid capturing large objects:

```javascript
const theme = { color: 'red', size: 100, /* ... 50 more props */ };

// ❌ WRONG: Captures entire theme object
function myWorklet() {
  'worklet';
  console.log(theme.color);
}

// ✅ CORRECT: Extract property first, capture only what's needed
const themeColor = theme.color;
function myWorklet() {
  'worklet';
  console.log(themeColor);
}
```

---

## 📋 Best Practices

### 1. Initialize with Correct Type

```javascript
// ✅ Good: Type inference from initial value
const count = useSharedValue(0); // number
const name = useSharedValue(''); // string
const position = useSharedValue({ x: 0, y: 0 }); // object

// ✅ Good: Explicit typing (TypeScript)
const count = useSharedValue<number>(0);
const colors = useSharedValue<string[]>(['red', 'blue']);
```

### 2. Avoid Mutating Nested Objects

```javascript
const userData = useSharedValue({ name: 'John', age: 30 });

// ❌ WRONG: Loses reactivity
userData.value.age = 31;

// ✅ CORRECT: Replace entire object
userData.value = { ...userData.value, age: 31 };

// ✅ CORRECT: Use .modify() for better performance
userData.modify((value) => {
  'worklet';
  value.age = 31;
  return value;
});
```

### 3. Use .get()/.set() with React Compiler

```javascript
// If React Compiler enabled:
const value = useSharedValue(0);

// ❌ AVOID
value.value = 10;
const x = value.value;

// ✅ PREFERRED
value.set(10);
const x = value.get();
```

### 4. Handle Large Objects Efficiently

```javascript
const largeArray = useSharedValue([1, 2, 3]);

// For push/pop operations, use .modify()
largeArray.modify((arr) => {
  'worklet';
  arr.push(4);
  return arr;
});

// Avoid creating new arrays for large data
```

---

## 🔗 Common Patterns

### Animation State Container

```javascript
function useAnimationState() {
  const isAnimating = useSharedValue(false);
  const progress = useSharedValue(0);
  const startTime = useSharedValue(0);

  return { isAnimating, progress, startTime };
}
```

### Multi-Value Synchronization

```javascript
function App() {
  const opacity = useSharedValue(1);
  const scale = useSharedValue(1);

  const handlePress = () => {
    opacity.value = withTiming(0.5);
    scale.value = withTiming(0.9);
  };

  return null;
}
```

### Conditional Reactivity

```javascript
const sv = useSharedValue(0);

const style = useAnimatedStyle(() => {
  if (sv.value > 50) {
    return { color: 'red' };
  } else {
    return { color: 'blue' };
  }
});
```

---

## ⚠️ Common Pitfalls

| Pitfall | Problem | Solution |
|---|---|---|
| **Direct nested mutation** | `sv.value.x = 10` loses reactivity | Use object spread or `.modify()` |
| **Reading in render** | `console.log(sv.value)` during JSX | Read in `useEffect`, `useAnimatedStyle`, or callbacks |
| **Capturing large objects** | Worklet memory overhead | Extract property before capturing in worklet |
| **Not using React Compiler API** | Incompatible with React Compiler | Use `.get()` and `.set()` methods |
| **Mutating arrays/objects in worklets** | Loses reactivity | Use `.modify()` for complex updates |

---

## 🔗 Cross-References

- **useAnimatedStyle:** See [03-core-animated-style.md](./03-core-animated-style.md) to bind shared values to styles
- **Worklets:** See [06-worklets-guide.md](./06-worklets-guide.md) to understand UI thread execution
- **Animations:** See [04-animations-timing-spring.md](./04-animations-timing-spring.md) for animation functions
- **Gesture Integration:** See [07-gestures-events.md](./07-gestures-events.md) to use shared values with gestures
- **Performance:** See [09-best-practices.md](./09-best-practices.md) for optimization strategies

---

## 📚 Official Documentation

- **useSharedValue Reference:** https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/
- **Shared Values Glossary:** https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/glossary/#shared-value
- **React Compiler Support:** https://docs.swmansion.com/react-native-reanimated/docs/guides/react-compiler/

---

**Last Updated:** December 2024  
**Verified For:** Reanimated 4.2.1
