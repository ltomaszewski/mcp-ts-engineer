# Gesture Handler: Setup and Basics

**Installation, GestureHandlerRootView, gesture states, callback lifecycle, and GestureDetector fundamentals.**

---

## Installation

### Expo Projects

```bash
npx expo install react-native-gesture-handler
```

### Bare React Native

```bash
npm install react-native-gesture-handler
# or
yarn add react-native-gesture-handler
```

### Platform Setup

**iOS/macOS** -- install CocoaPods:

```bash
cd ios && bundle install && bundle exec pod install && cd ..
```

**Android** -- no additional setup required. For Kotlin version control:

```gradle
// android/build.gradle
ext {
    kotlinVersion = "2.1.20"
}
```

**Web** -- no additional configuration needed.

**Expo Development Builds:**

```bash
npx expo prebuild
```

---

## GestureHandlerRootView

The root entry point for all gestures. Gestures do not function outside this view, and gesture relations only work between gestures mounted under the same root.

```typescript
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App(): JSX.Element {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* All app content here */}
    </GestureHandlerRootView>
  );
}
```

### Rules

- Place `GestureHandlerRootView` as close to the actual root of the app as possible
- For modals on Android, wrap modal content with a separate `GestureHandlerRootView`
- When using React Native Navigation (wix/react-native-navigation), wrap each registered screen with `GestureHandlerRootView`
- React Navigation wraps screens automatically -- no extra root view needed per screen

---

## GestureDetector

The primary component for attaching gestures to views. Accepts a single gesture or a composed gesture.

### Props

| Property | Type | Platform | Description |
|----------|------|----------|-------------|
| `gesture` | `SingleGesture \| ComposedGesture` | All | Gesture configuration and callbacks |
| `userSelect` | `'none' \| 'auto' \| 'text'` | Web | Controls text selection; default: `'none'` |
| `touchAction` | `TouchAction` | Web | CSS touch-action value; default: `'none'` |
| `enableContextMenu` | `boolean` | Web | Enable right-click context menu; default: `false` |

### Basic Usage

```typescript
import { GestureDetector, Gesture } from 'react-native-gesture-handler';
import { View } from 'react-native';

function MyComponent(): JSX.Element {
  const gesture = Gesture.Tap().onActivate(() => {
    console.log('Tapped');
  });

  return (
    <GestureDetector gesture={gesture}>
      <View style={{ width: 100, height: 100, backgroundColor: 'coral' }} />
    </GestureDetector>
  );
}
```

### Virtual Detectors

For scenarios where the host component disrupts view hierarchy interactions (e.g., SVG elements):

- **`InterceptingGestureDetector`** -- acts as a proxy for virtual detectors; `gesture` prop is optional
- **`VirtualGestureDetector`** -- not a host component, does not interfere with the view hierarchy

```typescript
import {
  InterceptingGestureDetector,
  VirtualGestureDetector,
  Gesture,
} from 'react-native-gesture-handler';
import Svg, { Circle } from 'react-native-svg';

function SvgGestureExample(): JSX.Element {
  const tap = Gesture.Tap().onActivate(() => {
    console.log('Circle tapped');
  });

  return (
    <InterceptingGestureDetector>
      <Svg height="200" width="200">
        <VirtualGestureDetector gesture={tap}>
          <Circle cx="100" cy="100" r="50" fill="blue" />
        </VirtualGestureDetector>
      </Svg>
    </InterceptingGestureDetector>
  );
}
```

### Limitations

- Never reuse the same gesture instance across multiple `GestureDetector` components
- Avoid nesting detectors that use different APIs (hooks vs builder) -- causes undefined behavior

---

## Gesture States

Gestures are state machines that transition through states based on touch events.

### State Definitions

| State | Value | Description |
|-------|-------|-------------|
| `UNDETERMINED` | 0 | Initial state before any interaction |
| `BEGAN` | 2 | Handler started receiving touches; activation criteria not yet met |
| `ACTIVE` | 4 | Gesture recognized and activation criteria met |
| `END` | 5 | User completed the gesture successfully |
| `FAILED` | 1 | Handler failed to recognize the gesture |
| `CANCELLED` | 3 | System interrupted the gesture |

### State Transitions

```
UNDETERMINED -> BEGAN -> ACTIVE -> END -> UNDETERMINED     (success)
UNDETERMINED -> BEGAN -> FAILED -> UNDETERMINED             (recognition failed)
UNDETERMINED -> BEGAN -> ACTIVE -> CANCELLED -> UNDETERMINED (interrupted)
UNDETERMINED -> BEGAN -> UNDETERMINED                       (touch released without activation)
```

### Importing State Constants

```typescript
import { State } from 'react-native-gesture-handler';

// State.UNDETERMINED, State.BEGAN, State.ACTIVE, State.END, State.FAILED, State.CANCELLED
```

---

## Callback Lifecycle

All gesture types share a common set of callbacks that fire during state transitions.

### State Callbacks

| Callback | When It Fires | Event Data |
|----------|---------------|------------|
| `onBegin(e)` | UNDETERMINED -> BEGAN | Position data |
| `onActivate(e)` | BEGAN -> ACTIVE | Position + gesture-specific data |
| `onUpdate(e)` | While ACTIVE (continuous gestures) | Accumulated gesture data |
| `onChange(e)` | While ACTIVE (continuous gestures) | Incremental change data since last event |
| `onEnd(e, success)` | ACTIVE -> END | Final data + success boolean |
| `onFinalize(e, success)` | Handler finishes (any terminal state) | Final data + success boolean |

### Touch Callbacks (Low-Level)

| Callback | When It Fires |
|----------|---------------|
| `onTouchesDown(e)` | Each time a finger touches the screen |
| `onTouchesMove(e)` | Each time a finger moves |
| `onTouchesUp(e)` | Each time a finger lifts |
| `onTouchesCancel(e)` | When finger tracking stops |

### Callback Order Example

For a successful Pan gesture:

```
onBegin -> onTouchesDown -> onTouchesMove -> onActivate -> onUpdate/onChange (repeated)
-> onTouchesMove -> onTouchesUp -> onEnd(success=true) -> onFinalize(success=true)
```

---

## Common Gesture Configuration

Properties shared across all gesture types:

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | `boolean \| SharedValue<boolean>` | `true` | Enable/disable gesture analysis |
| `shouldCancelWhenOutside` | `boolean \| SharedValue<boolean>` | varies | Cancel when finger leaves view bounds |
| `hitSlop` | `HitSlop \| SharedValue<HitSlop>` | -- | Expand touchable area beyond view |
| `manualActivation` | `boolean \| SharedValue<boolean>` | `false` | Prevent auto-activation; use state manager |
| `runOnJS` | `boolean \| SharedValue<boolean>` | `false` | Force callbacks on JS thread (requires Reanimated) |
| `testID` | `string` | -- | Identifier for Jest testing |
| `cancelsTouchesInView` | `boolean \| SharedValue<boolean>` | `true` | Cancel native UI touches on activation (iOS) |
| `mouseButton` | `MouseButton \| SharedValue<MouseButton>` | `LEFT` | Which mouse button triggers (Android/Web) |
| `activeCursor` | `ActiveCursor \| SharedValue<ActiveCursor>` | `'auto'` | CSS cursor during activation (Web) |

### hitSlop Configuration

```typescript
// Expand touch area by 20 points on all sides
const tap = Gesture.Tap().hitSlop(20);

// Expand asymmetrically
const tap2 = Gesture.Tap().hitSlop({
  top: 10,
  bottom: 20,
  left: 15,
  right: 15,
});
```

---

## Common Event Data

Properties present in all gesture events:

| Property | Type | Description |
|----------|------|-------------|
| `x` | `number` | X coordinate relative to the attached view |
| `y` | `number` | Y coordinate relative to the attached view |
| `absoluteX` | `number` | X coordinate relative to the window |
| `absoluteY` | `number` | Y coordinate relative to the window |
| `numberOfPointers` | `number` | Number of fingers currently on screen |
| `pointerType` | `PointerType` | `TOUCH`, `STYLUS`, `MOUSE`, `KEY`, or `OTHER` |

### PointerType Enum

```typescript
import { PointerType } from 'react-native-gesture-handler';

// PointerType.TOUCH, PointerType.STYLUS, PointerType.MOUSE, PointerType.KEY, PointerType.OTHER
```

---

## Gesture Relations (Cross-Detector)

For gestures on different components or different detectors:

| Method | Description |
|--------|-------------|
| `simultaneousWith(gesture)` | Both gestures can activate at the same time |
| `requireToFail(gesture)` | This gesture waits for the other to fail before activating |
| `block(gesture)` | Blocks the other gesture until this one fails |

```typescript
const innerTap = Gesture.Tap().onActivate(() => console.log('Inner'));
const outerTap = Gesture.Tap()
  .requireToFail(innerTap)
  .onActivate(() => console.log('Outer'));
```

---

**See Also**: `02-tap-and-press-gestures.md`, `03-pan-gesture.md`, `05-composed-gestures.md`
**Source**: https://docs.swmansion.com/react-native-gesture-handler/docs/fundamentals/installation/
**Version**: 2.x
