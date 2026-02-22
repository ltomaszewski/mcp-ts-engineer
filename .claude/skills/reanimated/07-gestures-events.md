# Gesture Handler Integration

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/scroll/useAnimatedScrollHandler/

---

## Overview

Reanimated integrates with `react-native-gesture-handler` v2 for performant gesture-driven animations. In Reanimated 4, `useAnimatedGestureHandler` is removed. Use the Gesture Handler v2 API (`Gesture.Pan()`, `Gesture.Tap()`, etc.) instead.

---

## Setup: GestureHandlerRootView

Required on Android. Harmless on iOS.

```typescript
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* App content */}
    </GestureHandlerRootView>
  );
}
```

---

## Pan Gesture (Draggable)

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';

function DraggableBox() {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const contextX = useSharedValue(0);
  const contextY = useSharedValue(0);

  const pan = Gesture.Pan()
    .onStart(() => {
      // Save starting position
      contextX.value = translateX.value;
      contextY.value = translateY.value;
    })
    .onUpdate((event) => {
      translateX.value = contextX.value + event.translationX;
      translateY.value = contextY.value + event.translationY;
    })
    .onEnd(() => {
      // Snap back to origin
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

## Tap Gesture

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';

function TapButton() {
  const scale = useSharedValue(1);

  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withTiming(0.9, { duration: 100 });
    })
    .onFinalize(() => {
      scale.value = withSpring(1);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.button, animatedStyle]} />
    </GestureDetector>
  );
}
```

---

## Pinch to Zoom

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function PinchToZoom() {
  const scale = useSharedValue(1);
  const savedScale = useSharedValue(1);

  const pinch = Gesture.Pinch()
    .onUpdate((event) => {
      scale.value = savedScale.value * event.scale;
    })
    .onEnd(() => {
      // Clamp between 1x and 4x
      savedScale.value = Math.min(Math.max(scale.value, 1), 4);
      scale.value = withTiming(savedScale.value);
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <GestureDetector gesture={pinch}>
      <Animated.View style={[styles.image, animatedStyle]} />
    </GestureDetector>
  );
}
```

---

## Combined Gestures

Use `.simultaneous()`, `.exclusive()`, or `.race()` to combine gestures.

```typescript
const pan = Gesture.Pan().onUpdate((e) => {
  translateX.value = e.translationX;
  translateY.value = e.translationY;
});

const pinch = Gesture.Pinch().onUpdate((e) => {
  scale.value = e.scale;
});

// Both gestures active simultaneously
const combined = Gesture.Simultaneous(pan, pinch);

return (
  <GestureDetector gesture={combined}>
    <Animated.View style={animatedStyle} />
  </GestureDetector>
);
```

---

## Swipe to Dismiss

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withSpring,
  scheduleOnRN,
} from 'react-native-reanimated';

function SwipeToDismiss({ onDismiss }: { onDismiss: () => void }) {
  const translateX = useSharedValue(0);
  const opacity = useSharedValue(1);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      opacity.value = 1 - Math.abs(event.translationX) / 300;
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > 150) {
        const direction = event.translationX > 0 ? 500 : -500;
        translateX.value = withTiming(direction, { duration: 200 });
        opacity.value = withTiming(0, { duration: 200 }, () => {
          scheduleOnRN(onDismiss);
        });
      } else {
        translateX.value = withSpring(0);
        opacity.value = withTiming(1);
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.card, animatedStyle]} />
    </GestureDetector>
  );
}
```

---

## Pan with Decay (Momentum)

```typescript
import { withDecay } from 'react-native-reanimated';

const pan = Gesture.Pan()
  .onStart(() => {
    contextX.value = translateX.value;
  })
  .onUpdate((event) => {
    translateX.value = contextX.value + event.translationX;
  })
  .onEnd((event) => {
    // Apply momentum from gesture velocity
    translateX.value = withDecay({
      velocity: event.velocityX,
      clamp: [-200, 200],
    });
  });
```

---

## useAnimatedScrollHandler

Handle scroll events on the UI thread.

```typescript
function useAnimatedScrollHandler<Context extends Record<string, unknown>>(
  handlers: ScrollHandler<Context> | ScrollHandlers<Context>,
  dependencies?: DependencyList
): ScrollHandlerProcessed<Context>;
```

### Event Types

| Event | When Fired |
|---|---|
| `onScroll` | During scrolling |
| `onBeginDrag` | User starts dragging |
| `onEndDrag` | User stops dragging |
| `onMomentumBegin` | Momentum scrolling begins |
| `onMomentumEnd` | Momentum scrolling ends |

**Web limitation:** Only `onScroll` is supported on web.

### Simple Scroll Handler

```typescript
import Animated, {
  useSharedValue,
  useAnimatedScrollHandler,
  useAnimatedStyle,
} from 'react-native-reanimated';

function ScrollHeader() {
  const scrollY = useSharedValue(0);

  const scrollHandler = useAnimatedScrollHandler((event) => {
    scrollY.value = event.contentOffset.y;
  });

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollY.value, [0, 100], [1, 0], Extrapolation.CLAMP),
    transform: [
      { translateY: interpolate(scrollY.value, [0, 100], [0, -50], Extrapolation.CLAMP) },
    ],
  }));

  return (
    <>
      <Animated.View style={headerStyle}>{/* Header */}</Animated.View>
      <Animated.ScrollView onScroll={scrollHandler} scrollEventThrottle={16}>
        {/* Content */}
      </Animated.ScrollView>
    </>
  );
}
```

### Advanced Scroll Handler with Context

```typescript
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (event, context) => {
    scrollY.value = event.contentOffset.y;
  },
  onBeginDrag: (event, context) => {
    context.startY = event.contentOffset.y;
    isScrolling.value = true;
  },
  onEndDrag: (event, context) => {
    isScrolling.value = false;
  },
  onMomentumEnd: (event, context) => {
    // Scroll fully stopped
  },
});
```

---

## useScrollOffset

Track scroll position with a shared value (simplified alternative to `useAnimatedScrollHandler`).

```typescript
import { useAnimatedRef, useScrollOffset } from 'react-native-reanimated';

function ScrollTracker() {
  const animatedRef = useAnimatedRef();
  const scrollOffset = useScrollOffset(animatedRef);

  const headerStyle = useAnimatedStyle(() => ({
    opacity: interpolate(scrollOffset.value, [0, 100], [1, 0]),
  }));

  return <Animated.ScrollView ref={animatedRef}>{/* content */}</Animated.ScrollView>;
}
```

---

## v4 Migration: useAnimatedGestureHandler Removal

`useAnimatedGestureHandler` was removed in Reanimated 4. Migrate to Gesture Handler v2:

```typescript
// OLD (v3) - REMOVED
const handler = useAnimatedGestureHandler({
  onStart: (event, context) => {
    context.startX = translateX.value;
  },
  onActive: (event, context) => {
    translateX.value = context.startX + event.translationX;
  },
});
return (
  <PanGestureHandler onGestureEvent={handler}>
    <Animated.View />
  </PanGestureHandler>
);

// NEW (v4) - Gesture Handler v2 API
const contextX = useSharedValue(0);
const pan = Gesture.Pan()
  .onStart(() => {
    contextX.value = translateX.value;
  })
  .onUpdate((event) => {
    translateX.value = contextX.value + event.translationX;
  });
return (
  <GestureDetector gesture={pan}>
    <Animated.View />
  </GestureDetector>
);
```

Key differences:
- Use `Gesture.Pan()` instead of `PanGestureHandler` component
- Use `GestureDetector` wrapper instead of gesture handler components
- Store context in shared values instead of context object parameter
- Callbacks are chained methods, not object properties

---

## Cross-References

- **Shared values:** [02-core-shared-values.md](02-core-shared-values.md)
- **Animations:** [04-animations-timing-spring.md](04-animations-timing-spring.md)
- **Worklets:** [06-worklets-guide.md](06-worklets-guide.md)
- **withDecay:** [05-animations-modifiers.md](05-animations-modifiers.md)

---
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/scroll/useAnimatedScrollHandler/ | https://docs.swmansion.com/react-native-reanimated/docs/scroll/scrollTo/ | https://docs.swmansion.com/react-native-reanimated/docs/scroll/useScrollOffset/
