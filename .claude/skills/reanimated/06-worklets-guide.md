# Worklets & UI Thread Execution

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets/  
**Version:** 4.2.1  
**Category:** Architecture | Advanced Concepts

---

## 📋 Overview

**Worklets** are JavaScript functions that execute on the **UI Runtime** (native thread) instead of the **JS Runtime** (JavaScript thread). This enables **60/120 fps animations without blocking React re-renders**.

**Key Characteristics:**
- Marked with `'worklet'` directive at function start
- Converted by Babel plugin into serializable objects
- Can access shared values directly
- Cannot access most JS Runtime features (console, setTimeout not available)
- Enable smooth animations by running on native thread

---

## 🔧 Type Definition

```typescript
// Worklet-marked functions have this type:
type Worklet<Args extends any[], Return> = {
  (...args: Args): Return;
  __worklet: true;
  __location: string;
};
```

---

## 📖 Defining Worklets

### Basic Syntax

Mark any function with `'worklet'` directive:

```javascript
function myWorklet() {
  'worklet';
  console.log('Hello from worklet');
}
```

**Critical:** The directive must be at the **very beginning** of the function body.

### Worklet with Parameters

```javascript
function addNumbers(a, b) {
  'worklet';
  return a + b;
}

function greet(name) {
  'worklet';
  console.log(`Hello, ${name}`);
  return `Greeted ${name}`;
}
```

### Worklet Return Values

Worklets can return data **within the same thread**:

```javascript
function calculateValue() {
  'worklet';
  return 42;
}

function useWorkletResult() {
  'worklet';
  const result = calculateValue(); // Still on UI thread
  console.log('Result:', result);
}
```

---

## 🔄 Workletization by Babel Plugin

The `react-native-worklets/plugin` Babel plugin automatically transforms worklet-marked functions:

### Before Transformation

```javascript
function myWorklet() {
  'worklet';
  return opacity.value * 2;
}
```

### After Transformation

```javascript
// Babel converts to serializable object
const myWorklet = {
  __worklet: true,
  __location: 'file.js:10',
  // ... serialization details
};
```

This allows worklets to be **copied and executed on the UI thread**.

---

## 🚀 Running Worklets on UI Runtime

### Automatic Workletization

Most Reanimated hooks automatically workletize their callbacks:

```javascript
import { useAnimatedStyle } from 'react-native-reanimated';

function App() {
  const animatedStyle = useAnimatedStyle(() => {
    // This entire callback runs on UI thread automatically
    return { opacity: 0.5 };
  });
}
```

### Manual Execution: scheduleOnUI

Use `scheduleOnUI` to explicitly run a worklet on the UI thread:

```javascript
import { scheduleOnUI } from 'react-native-reanimated';

function myWorklet() {
  'worklet';
  console.log('Running on UI thread');
}

function onButtonPress() {
  // Schedule the worklet to run on UI thread
  scheduleOnUI(myWorklet);
}
```

### Passing Arguments to scheduleOnUI

```javascript
import { scheduleOnUI } from 'react-native-reanimated';

function greetUser(name, age) {
  'worklet';
  console.log(`Hello ${name}, age ${age}`);
}

function handlePress() {
  // Pass arguments after the worklet function
  scheduleOnUI(greetUser, 'John', 30);
}
```

---

## 🔄 Running JS Runtime Functions from Worklets

Use `scheduleOnRN` to call **regular JavaScript functions** from a worklet:

```javascript
import { scheduleOnRN } from 'react-native-reanimated';
import { router } from 'expo-router';

function handleNavigation() {
  'worklet';
  // Can't call router.back() directly (not on JS thread)
  // Use scheduleOnRN to switch threads
  scheduleOnRN(() => {
    router.back();
  });
}
```

### Example: Gesture Handler with Navigation

```javascript
import { Gesture } from 'react-native-gesture-handler';
import { scheduleOnRN } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';

function useGestureWithNavigation() {
  const navigation = useNavigation();

  const tap = Gesture.Tap().onEnd(() => {
    'worklet'; // Gesture handlers are worklets by default
    
    // Can't call navigation directly
    scheduleOnRN(() => {
      navigation.goBack();
    });
  });

  return tap;
}
```

### ⚠️ Important Constraint

Functions passed to `scheduleOnRN` must be **defined in JS thread scope**:

```javascript
function App() {
  const onPress = () => {
    // ✅ Defined in component scope (JS thread)
    console.log('Pressed');
  };

  const tap = Gesture.Tap().onEnd(() => {
    'worklet';
    // ✅ CORRECT: onPress is defined in JS thread
    scheduleOnRN(onPress);
  });

  return null;
}

function BadExample() {
  const tap = Gesture.Tap().onEnd(() => {
    'worklet';

    // ❌ WRONG: myFunction defined inside worklet
    const myFunction = () => {
      console.log('This is a problem');
    };

    scheduleOnRN(myFunction); // 💥 CRASH
  });
}
```

---

## 📌 Hoisting Rules

Functions marked with `'worklet'` are **not hoisted**:

```javascript
// ✅ CORRECT: Define before use
function myWorklet() {
  'worklet';
  return 42;
}

useAnimatedStyle(() => myWorklet()); // Works

// ❌ WRONG: Use before declaration
useAnimatedStyle(() => undefinedWorklet()); // ReferenceError
function undefinedWorklet() {
  'worklet';
  return 42;
}
```

---

## 🔐 Closure Capturing

Worklets can access variables from outer scope (closures). Only referenced variables are captured:

### Selective Capturing

```javascript
const width = 135.5;      // Referenced in worklet
const height = 200;       // Not referenced
const theme = { color: 'red' }; // Referenced

function myWorklet() {
  'worklet';
  console.log('Width is', width);      // ✅ Captured
  console.log('Theme color:', theme.color); // ✅ Captured (but entire theme object)
  // height not accessed, not captured
}
```

### Performance Optimization: Extract Properties

```javascript
const theme = {
  color: 'red',
  fontSize: 16,
  padding: 10,
  // ... 50 more properties
};

// ❌ WRONG: Captures entire large theme object
function badWorklet() {
  'worklet';
  console.log(theme.color);
}

// ✅ CORRECT: Extract property first, capture only needed value
const themeColor = theme.color;
function goodWorklet() {
  'worklet';
  console.log(themeColor);
}
```

---

## 📊 Thread Comparison

| Aspect | **JS Runtime** | **UI Runtime (Worklet)** |
|---|---|---|
| **Thread** | JavaScript thread | Native/UI thread |
| **FPS** | Can drop below 60 | Consistent 60/120 fps |
| **Blocking** | React updates block animations | Animations never blocked |
| **Access to React** | ✅ Full access | ❌ No React access |
| **State Updates** | ✅ setState/hooks | ❌ Can't update React state |
| **Navigation** | ✅ Direct | ⚠️ Via scheduleOnRN |
| **Access to DOM** | ✅ In Web | ⚠️ Limited in Web |
| **Performance** | Slower for animation | Optimized for animation |
| **Use Case** | Event handlers, state | Animation calculations |

---

## 🌐 Web Support

On web (react-native-web), there's **no separate UI thread**. Worklets resolve to regular JavaScript functions:

```javascript
function myWorklet() {
  'worklet';
  // On web: Executes as regular JS function
  // On native: Executes on UI thread
  return 42;
}
```

**Important:** The `'worklet'` directive is still required on web because Reanimated uses the **Worklets Babel plugin to capture dependencies**.

---

## 🔧 Other Worklet Runtimes

Worklets aren't limited to Reanimated's UI Runtime. Other libraries create their own:

```javascript
// Vision Camera worklets
import { useFrameProcessor } from 'react-native-vision-camera';

useFrameProcessor((frame) => {
  'worklet';
  // Runs in Vision Camera's worklet runtime
}, []);
```

### Creating Custom Worklet Runtimes

For advanced use cases:

```javascript
import { createWorkletRuntime } from 'react-native-worklets';

const customRuntime = createWorkletRuntime('CustomRuntime');

function myCustomWorklet() {
  'worklet';
  // Runs in custom runtime
}
```

---

## 📋 Worklet Anti-Patterns

| Anti-Pattern | Problem | Solution |
|---|---|---|
| **Accessing React context** | Context not available on UI thread | Use shared values instead |
| **Calling setState** | Can't update React state | Use shared values or scheduleOnRN |
| **Using setTimeout** | Not available on UI Runtime | Use withTiming or frame callbacks |
| **Large object capture** | Memory overhead | Extract properties before capture |
| **Mutating shared value inside useAnimatedStyle** | Infinite loop risk | Mutate only in event handlers |
| **Hoisting before definition** | Hoisting not supported | Define worklets before use |

---

## 🔗 Cross-References

- **useAnimatedStyle:** See [03-core-animated-style.md](./03-core-animated-style.md) for automatic workletization
- **Gesture Handlers:** See [07-gestures-events.md](./07-gestures-events.md) for worklet event handlers
- **Shared Values:** See [02-core-shared-values.md](./02-core-shared-values.md) for thread-safe data passing
- **Best Practices:** See [09-best-practices.md](./09-best-practices.md) for performance tips

---

## 📚 Official Documentation

- **Worklets Guide:** https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets/
- **Worklets Babel Plugin:** https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets-babel-plugin/
- **Web Support:** https://docs.swmansion.com/react-native-reanimated/docs/guides/web-support/

---

**Last Updated:** December 2024  
**Verified For:** Reanimated 4.2.1
