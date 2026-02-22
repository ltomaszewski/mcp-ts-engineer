# Gesture Handler: Reanimated Integration

**Worklet callbacks, shared values, animated gesture-driven interactions at 60-120fps.**

---

## Overview

React Native Gesture Handler integrates tightly with React Native Reanimated to enable gesture-driven animations that run entirely on the UI thread. When Reanimated is installed, gesture callbacks are **automatically workletized** -- no manual `'worklet'` directive needed.

### Prerequisites

```bash
# Install both packages
npx expo install react-native-gesture-handler react-native-reanimated
```

Both require native modules. For Expo, run `npx expo prebuild` after installing.

---

## Automatic Workletization

When `react-native-reanimated` is installed, all gesture callbacks (`onBegin`, `onActivate`, `onUpdate`, `onEnd`, `onFinalize`, etc.) run on the UI thread as worklets by default.

```typescript
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

// These callbacks run on the UI thread automatically
const pan = Gesture.Pan()
  .onBegin(() => {
    // UI thread -- safe to access shared values directly
  })
  .onUpdate((e) => {
    // UI thread -- e.translationX is available synchronously
  })
  .onEnd((e) => {
    // UI thread -- can call withSpring, withTiming, etc.
  });
```

### runOnJS -- Force JS Thread Execution

Set `runOnJS(true)` when callbacks need to:
- Call React state setters (`useState`)
- Invoke JS-only APIs (haptics, navigation, analytics)
- Access non-worklet functions

```typescript
import { runOnJS } from 'react-native-reanimated';

// Option 1: Set globally on the gesture
const tap = Gesture.Tap()
  .runOnJS(true)
  .onActivate(() => {
    // Runs on JS thread -- can call setState, navigation, etc.
    setTapped(true);
  });

// Option 2: Call specific functions from worklet context
const pan = Gesture.Pan()
  .onEnd((e) => {
    // Still on UI thread, but bridge to JS for specific calls
    if (e.translationX > 200) {
      runOnJS(navigateToNext)();
    }
  });
```

**Performance rule**: Prefer keeping callbacks on the UI thread (default). Only use `runOnJS` when accessing JS-only APIs.

---

## Shared Values with Gestures

`useSharedValue` from Reanimated provides thread-safe mutable values accessible from both UI and JS threads.

### Basic Pattern

```typescript
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function AnimatedGesture(): JSX.Element {
  const pressed = useSharedValue(false);
  const offset = useSharedValue(0);

  const tap = Gesture.Tap()
    .onBegin(() => {
      pressed.value = true;
    })
    .onFinalize(() => {
      pressed.value = false;
    });

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: pressed.value ? '#FFE04B' : '#B58DF1',
    transform: [
      { scale: pressed.value ? 1.2 : 1 },
    ],
  }));

  return (
    <GestureHandlerRootView style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <GestureDetector gesture={tap}>
        <Animated.View style={[{ width: 100, height: 100, borderRadius: 20 }, animatedStyle]} />
      </GestureDetector>
    </GestureHandlerRootView>
  );
}
```

### BAD vs GOOD: React State vs Shared Values

```typescript
// BAD: React state in gesture callback -- JS bridge roundtrip every frame
const [x, setX] = useState(0);
const pan = Gesture.Pan().onUpdate((e) => {
  setX(e.translationX);
});

// GOOD: Shared value for UI-thread performance
const x = useSharedValue(0);
const pan = Gesture.Pan().onUpdate((e) => {
  x.value = e.translationX;
});
```

### Context Pattern (Saving State Between Gestures)

Store the gesture start position to accumulate translations across multiple drag sessions:

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function DragWithContext(): JSX.Element {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onBegin(() => {
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((e) => {
      translateX.value = contextX.value + e.translationX;
      translateY.value = contextY.value + e.translationY;
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
      <Animated.View style={[{ width: 80, height: 80, backgroundColor: '#E74C3C', borderRadius: 40 }, animatedStyle]} />
    </GestureDetector>
  );
}
```

---

## Callback Reference

### State Callbacks (UI Thread by Default)

| Callback | Fires When | Typical Use |
|----------|-----------|-------------|
| `onBegin(e)` | UNDETERMINED -> BEGAN | Save initial state / context |
| `onActivate(e)` | BEGAN -> ACTIVE | Start visual feedback |
| `onUpdate(e)` | While ACTIVE (continuous) | Apply accumulated transform values |
| `onChange(e)` | While ACTIVE (continuous) | Apply incremental deltas |
| `onEnd(e, success)` | ACTIVE -> END | Trigger animations, side effects |
| `onFinalize(e, success)` | Any terminal state | Cleanup, reset |

### Touch Callbacks (Low-Level)

| Callback | Fires When |
|----------|-----------|
| `onTouchesDown(e, stateManager)` | Each finger placed |
| `onTouchesMove(e, stateManager)` | Each finger moved |
| `onTouchesUp(e, stateManager)` | Each finger lifted |
| `onTouchesCancel(e, stateManager)` | Tracking interrupted |

### onUpdate vs onChange

For continuous gestures (Pan, Pinch, Rotation):

- **`onUpdate`** provides **accumulated** values from gesture start (e.g., `translationX` = total distance)
- **`onChange`** provides **incremental** deltas since last event (e.g., `changeX` = pixels since last frame)

```typescript
// onUpdate: use with saved base value
const pan = Gesture.Pan()
  .onBegin(() => { savedX.value = translateX.value; })
  .onUpdate((e) => {
    translateX.value = savedX.value + e.translationX;
  });

// onChange: apply deltas directly
const pan = Gesture.Pan()
  .onChange((e) => {
    translateX.value += e.changeX;
  });
```

---

## Animation Functions in Gesture Callbacks

### withSpring -- Spring Physics

```typescript
import { withSpring } from 'react-native-reanimated';

const pan = Gesture.Pan()
  .onEnd(() => {
    translateX.value = withSpring(0, {
      damping: 15,
      stiffness: 150,
      mass: 1,
    });
  });
```

### withTiming -- Timed Transitions

```typescript
import { withTiming, Easing } from 'react-native-reanimated';

const tap = Gesture.Tap()
  .onActivate(() => {
    scale.value = withTiming(1.5, {
      duration: 300,
      easing: Easing.bezierFn(0.25, 0.1, 0.25, 1),
    });
  });
```

### withDecay -- Velocity-Based Momentum

Preserves gesture velocity and decelerates naturally (e.g., scrolling momentum):

```typescript
import { withDecay } from 'react-native-reanimated';

const pan = Gesture.Pan()
  .onUpdate((e) => {
    translateX.value = e.translationX;
  })
  .onEnd((e) => {
    translateX.value = withDecay({
      velocity: e.velocityX,       // Pass gesture velocity
      deceleration: 0.998,         // Friction factor (0-1)
      clamp: [-200, 200],          // Optional bounds
      rubberBandEffect: true,      // Bounce at bounds
      rubberBandFactor: 0.6,       // Bounce intensity
    });
  });
```

### Chaining Animations with Callbacks

```typescript
const tap = Gesture.Tap()
  .onActivate(() => {
    scale.value = withSpring(1.5, {}, (finished) => {
      if (finished) {
        scale.value = withTiming(1, { duration: 200 });
      }
    });
  });
```

---

## SharedValue Configuration Properties

Several gesture configuration properties accept `SharedValue` for dynamic updates without re-renders:

| Property | Accepts SharedValue | Use Case |
|----------|-------------------|----------|
| `enabled` | Yes | Conditionally enable/disable gesture |
| `minDistance` (Pan) | Yes | Dynamic activation threshold |
| `minDuration` (LongPress) | Yes | Dynamic timing |
| `numberOfTaps` (Tap) | Yes | Dynamic tap count |
| `hitSlop` | Yes | Dynamic touch area |
| `activeOffsetX/Y` (Pan) | Yes | Dynamic directional constraints |
| `failOffsetX/Y` (Pan) | Yes | Dynamic failure constraints |
| `manualActivation` | Yes | Dynamic manual control |

---

## Manual Activation with GestureStateManager

Use `manualActivation(true)` to control gesture activation programmatically from touch callbacks:

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

function ManualPan(): JSX.Element {
  const translateX = useSharedValue(0);

  const pan = Gesture.Pan()
    .manualActivation(true)
    .onTouchesDown((e, stateManager) => {
      if (e.numberOfTouches >= 2) {
        stateManager.activate();
      }
    })
    .onTouchesUp((e, stateManager) => {
      if (e.numberOfTouches < 2) {
        stateManager.deactivate();
      }
    })
    .onUpdate((e) => {
      translateX.value = e.translationX;
    });

  // ... return with GestureDetector
}
```

### GestureStateManager Methods

| Method | Description |
|--------|-------------|
| `activate()` | Transition gesture to ACTIVE state |
| `deactivate()` | Transition gesture from ACTIVE to END |
| `fail()` | Transition gesture to FAILED state |
| `begin()` | Transition gesture to BEGAN state |

---

## Gesture.Manual -- Full Custom Control

For fully custom gesture logic where no built-in gesture type fits:

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';

function MultiTouchTracker(): JSX.Element {
  const pointerCount = useSharedValue(0);

  const manual = Gesture.Manual()
    .onTouchesDown((e, stateManager) => {
      pointerCount.value = e.numberOfTouches;
      if (e.numberOfTouches >= 3) {
        stateManager.activate();
      }
    })
    .onTouchesMove((e) => {
      pointerCount.value = e.numberOfTouches;
    })
    .onTouchesUp((e, stateManager) => {
      pointerCount.value = e.numberOfTouches;
      if (e.numberOfTouches === 0) {
        stateManager.deactivate();
      }
    });

  // ... return with GestureDetector
}
```

Key differences from other gestures:
- No specific activation criteria -- state must be managed manually
- Does not auto-fail when pointers lift from the screen
- All state transitions are explicit via `stateManager`

---

## Performance Tips

1. **Always use shared values** in gesture callbacks -- never `useState` or `useRef` for frequently changing data
2. **Minimize `runOnJS` calls** -- each call crosses the bridge. Batch side effects when possible
3. **Avoid `runOnJS` in `onUpdate`** -- `onUpdate` fires every frame; bridging causes frame drops
4. **Use `onChange` for direct deltas** -- avoids the need to track saved base values
5. **Keep `useAnimatedStyle` bodies simple** -- minimize recalculations
6. **Use `withSpring`/`withTiming` in `onEnd`** -- not during `onUpdate` (overwrites each frame)
7. **Batch shared value updates** -- multiple `.value =` assignments in the same callback are batched automatically

---

**See Also**: `01-setup-and-basics.md`, `03-pan-gesture.md`, `04-pinch-rotation-gestures.md`
**Source**: https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/handling-gestures/, https://docs.swmansion.com/react-native-gesture-handler/docs/
**Version**: 2.x (Gesture Handler) + Reanimated 3.x/4.x
