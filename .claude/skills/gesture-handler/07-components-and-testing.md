# Gesture Handler: Components, Touchables, and Testing

**Pressable, Buttons, Swipeable, DrawerLayout, Hover gesture, scroll integration, and testing patterns.**

---

## Hover Gesture

Desktop/pointer gesture that tracks cursor hovering over a view. Primarily useful for web and iPadOS with pointer support.

### Creation

```typescript
import { Gesture } from 'react-native-gesture-handler';

const hover = Gesture.Hover();
```

### Configuration Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `effect` | `HoverEffect \| SharedValue<HoverEffect>` | `HoverEffect.NONE` | Visual hover effect (iOS only) |

All common gesture configuration properties also apply (enabled, hitSlop, etc.).

### HoverEffect Enum (iOS Only)

```typescript
import { HoverEffect } from 'react-native-gesture-handler';

HoverEffect.NONE       // 0 -- no visual effect
HoverEffect.LIFT       // 1 -- lifts the view
HoverEffect.HIGHLIGHT  // 2 -- highlights the view
```

### Event Data

| Property | Type | Description |
|----------|------|-------------|
| `x` | `number` | Pointer X relative to view |
| `y` | `number` | Pointer Y relative to view |
| `absoluteX` | `number` | Pointer X relative to window |
| `absoluteY` | `number` | Pointer Y relative to window |
| `numberOfPointers` | `number` | Active pointer count |
| `pointerType` | `PointerType` | TOUCH, STYLUS, MOUSE, KEY, OTHER |

### Hover Example

```typescript
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
import { Text } from 'react-native';

function HoverButton(): JSX.Element {
  const bgOpacity = useSharedValue(0);

  const hover = Gesture.Hover()
    .onBegin(() => {
      bgOpacity.value = withTiming(1, { duration: 150 });
    })
    .onFinalize(() => {
      bgOpacity.value = withTiming(0, { duration: 150 });
    });

  const animatedStyle = useAnimatedStyle(() => ({
    backgroundColor: `rgba(0, 122, 255, ${bgOpacity.value * 0.1})`,
  }));

  return (
    <GestureDetector gesture={hover}>
      <Animated.View style={[{ padding: 16, borderRadius: 8 }, animatedStyle]}>
        <Text>Hover Me</Text>
      </Animated.View>
    </GestureDetector>
  );
}
```

**Note**: Do not rely on Hover gesture continuing after mouse click or stylus touch. Compose with Pan if you need both hover and press tracking.

---

## Pressable (Recommended)

Drop-in replacement for React Native's `Pressable`. Uses native touch system instead of JS responder system.

### Import

```typescript
import { Pressable } from 'react-native-gesture-handler';
```

### Properties

| Property | Type | Default | Platform | Description |
|----------|------|---------|----------|-------------|
| `onPress` | `(event) => void` | -- | All | Fires after `onPressOut` on single tap |
| `onPressIn` | `(event) => void` | -- | All | Fires when touch is engaged |
| `onPressOut` | `(event) => void` | -- | All | Fires when touch releases |
| `onLongPress` | `(event) => void` | -- | All | Fires after `delayLongPress` duration |
| `onHoverIn` | `(event) => void` | -- | Android, Web | Pointer enters element |
| `onHoverOut` | `(event) => void` | -- | Android, Web | Pointer leaves element |
| `delayLongPress` | `number \| null` | `500` | All | ms before `onLongPress` fires |
| `disabled` | `boolean \| null` | -- | All | Disables all interactions |
| `cancelable` | `boolean \| null` | `true` | All | Press can be interrupted by parent scroll |
| `hitSlop` | `Insets \| number \| null` | -- | Android, iOS | Extra press detection distance |
| `pressRetentionOffset` | `Insets \| number \| null` | -- | Android, iOS | Extra distance before `onPressOut` |
| `android_disableSound` | `boolean \| null` | -- | Android | Suppress system touch sound |
| `android_ripple` | `PressableAndroidRippleConfig \| null` | -- | Android | Ripple effect configuration |
| `children` | `ReactNode \| ((state) => ReactNode)` | -- | All | Render prop with `{ pressed }` state |
| `style` | `StyleProp \| ((state) => StyleProp)` | -- | All | Style or function of `{ pressed }` state |

### Pressable Example

```typescript
import { Pressable, GestureHandlerRootView } from 'react-native-gesture-handler';
import { Text, StyleSheet } from 'react-native';

function PressableButton(): JSX.Element {
  return (
    <GestureHandlerRootView style={styles.container}>
      <Pressable
        style={({ pressed }) => [
          styles.button,
          pressed && styles.buttonPressed,
        ]}
        hitSlop={20}
        onPress={() => console.log('Pressed!')}
        onLongPress={() => console.log('Long pressed!')}
      >
        {({ pressed }) => (
          <Text style={styles.text}>{pressed ? 'Pressing...' : 'Press Me'}</Text>
        )}
      </Pressable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  button: { paddingHorizontal: 24, paddingVertical: 12, backgroundColor: '#3498DB', borderRadius: 8 },
  buttonPressed: { backgroundColor: '#2980B9', opacity: 0.9 },
  text: { color: 'white', fontSize: 16, fontWeight: '600' },
});
```

---

## Button Components

Native button components with built-in feedback. Useful for list items, action buttons, and icon buttons.

### Import

```typescript
import { RectButton, BorderlessButton, BaseButton, RawButton } from 'react-native-gesture-handler';
```

### Component Hierarchy

```
RawButton (no feedback, base native handler)
  -> BaseButton (adds onPress, onLongPress, onActiveStateChange)
    -> RectButton (adds underlayColor, rectangular ripple on Android)
    -> BorderlessButton (adds borderless ripple on Android, dim on iOS)
```

### BaseButton Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `onPress` | `(pointerInside: boolean) => void` | -- | Fires on press |
| `onLongPress` | `() => void` | -- | Fires after `delayLongPress` |
| `onActiveStateChange` | `(active: boolean) => void` | -- | Fires on active/inactive transitions |
| `delayLongPress` | `number` | `600` | ms before `onLongPress` fires |

### RectButton Additional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `underlayColor` | `string` | -- | Background color when active |
| `activeOpacity` | `number` | -- | Opacity when active (iOS only) |

### BorderlessButton Additional Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `activeOpacity` | `number` | -- | Opacity when active (iOS only) |

### RectButton Example (List Item)

```typescript
import { RectButton } from 'react-native-gesture-handler';
import { Text, View, StyleSheet } from 'react-native';

function ListItem({ title, onPress }: { title: string; onPress: () => void }): JSX.Element {
  return (
    <RectButton
      style={styles.listItem}
      underlayColor="#E8E8E8"
      activeOpacity={0.7}
      onPress={() => onPress()}
    >
      <View accessible accessibilityRole="button">
        <Text style={styles.listItemText}>{title}</Text>
      </View>
    </RectButton>
  );
}

const styles = StyleSheet.create({
  listItem: { paddingHorizontal: 16, paddingVertical: 12, backgroundColor: 'white' },
  listItemText: { fontSize: 16 },
});
```

### Accessibility Requirement

Wrap button children in a `View` with `accessible` and `accessibilityRole="button"`:

```typescript
<RectButton onPress={handlePress}>
  <View accessible accessibilityRole="button">
    <Text>Accessible Button</Text>
  </View>
</RectButton>
```

---

## Touchable Components (Deprecated)

Drop-in replacements for React Native touchables. **Will be removed in a future version -- use Pressable instead.**

```typescript
import {
  TouchableOpacity,
  TouchableHighlight,
  TouchableWithoutFeedback,
  TouchableNativeFeedback,
} from 'react-native-gesture-handler';
```

### Key Differences

- Use native touch system instead of JS responder system
- `TouchableOpacity` uses native driver for animations by default (disable with `useNativeAnimations={false}`)
- All major properties supported **except** `pressRetentionOffset`

### Migration

Simply change the import path:

```typescript
// Before
import { TouchableOpacity } from 'react-native';
// After (interim)
import { TouchableOpacity } from 'react-native-gesture-handler';
// Best: replace with Pressable
import { Pressable } from 'react-native-gesture-handler';
```

---

## ReanimatedSwipeable

Swipeable row component built with Reanimated for smooth list item swipe actions.

### Import

```typescript
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
```

### Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `friction` | `number` | -- | Ratio of visual delay vs gesture distance |
| `leftThreshold` | `number` | Half panel width | Distance to trigger left open |
| `rightThreshold` | `number` | Half panel width | Distance to trigger right open |
| `dragOffsetFromLeftEdge` | `number` | `10` | Min drag distance from left edge |
| `dragOffsetFromRightEdge` | `number` | `10` | Min drag distance from right edge |
| `overshootLeft` | `boolean` | `true`* | Allow pulling beyond left actions width |
| `overshootRight` | `boolean` | `true`* | Allow pulling beyond right actions width |
| `overshootFriction` | `number` | `1` | Friction when overshooting |
| `containerStyle` | `StyleProp<ViewStyle>` | -- | Style for animated container |
| `childrenContainerStyle` | `StyleProp<ViewStyle>` | -- | Style for children container |

*When respective render function is provided.

### Callbacks

| Callback | Signature | Description |
|----------|-----------|-------------|
| `onSwipeableOpen` | `(direction: SwipeDirection) => void` | Row fully opened |
| `onSwipeableClose` | `(direction: SwipeDirection) => void` | Row fully closed |
| `onSwipeableWillOpen` | `(direction: SwipeDirection) => void` | Opening animation started |
| `onSwipeableWillClose` | `(direction: SwipeDirection) => void` | Closing animation started |
| `onSwipeableOpenStartDrag` | `(direction: SwipeDirection) => void` | User starts dragging to open |
| `onSwipeableCloseStartDrag` | `(direction: SwipeDirection) => void` | User starts dragging to close |

### Render Functions

```typescript
renderLeftActions?: (
  progress: SharedValue<number>,    // 0 = closed, 1 = fully open
  translation: SharedValue<number>, // Pixel offset
  swipeableMethods: SwipeableMethods
) => ReactNode;

renderRightActions?: (
  progress: SharedValue<number>,
  translation: SharedValue<number>,
  swipeableMethods: SwipeableMethods
) => ReactNode;
```

### Methods (via ref)

| Method | Description |
|--------|-------------|
| `close()` | Close the swipeable row |
| `openLeft()` | Open left actions programmatically |
| `openRight()` | Open right actions programmatically |
| `reset()` | Reset swiping state without animation |

### Gesture Relations

```typescript
<Swipeable
  simultaneousWithExternalGesture={otherGesture}
  requireExternalGestureToFail={otherGesture}
  blocksExternalGesture={otherGesture}
>
```

### Swipe-to-Delete Example

```typescript
import Swipeable from 'react-native-gesture-handler/ReanimatedSwipeable';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { SharedValue, useAnimatedStyle } from 'react-native-reanimated';
import { Text, View, StyleSheet } from 'react-native';
import { useRef } from 'react';
import type { SwipeableMethods } from 'react-native-gesture-handler/ReanimatedSwipeable';

function RightAction(
  progress: SharedValue<number>,
  drag: SharedValue<number>,
): JSX.Element {
  const styleAnimation = useAnimatedStyle(() => ({
    transform: [{ translateX: drag.value + 80 }],
  }));

  return (
    <Animated.View style={[styles.rightAction, styleAnimation]}>
      <Text style={styles.actionText}>Delete</Text>
    </Animated.View>
  );
}

function SwipeableRow(): JSX.Element {
  const swipeableRef = useRef<SwipeableMethods>(null);

  return (
    <GestureHandlerRootView>
      <Swipeable
        ref={swipeableRef}
        friction={2}
        rightThreshold={40}
        renderRightActions={RightAction}
        onSwipeableOpen={(direction) => console.log(`Opened ${direction}`)}
      >
        <View style={styles.row}>
          <Text>Swipe me left</Text>
        </View>
      </Swipeable>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  row: { padding: 16, backgroundColor: 'white' },
  rightAction: { width: 80, backgroundColor: '#E74C3C', justifyContent: 'center', alignItems: 'center' },
  actionText: { color: 'white', fontWeight: '600' },
});
```

---

## ReanimatedDrawerLayout

Cross-platform drawer component replacing `DrawerLayoutAndroid`.

### Import

```typescript
import ReanimatedDrawerLayout from 'react-native-gesture-handler/ReanimatedDrawerLayout';
```

### Key Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `drawerType` | `DrawerType` | `FRONT` | `FRONT`, `BACK`, or `SLIDE` |
| `edgeWidth` | `number` | -- | Width of draggable edge area |
| `overlayColor` | `string` | `rgba(0,0,0,0.7)` | Background overlay color |
| `renderNavigationView` | `(progress: SharedValue<number>) => ReactNode` | -- | Drawer content |
| `onDrawerOpen` | `() => void` | -- | Drawer fully opened |
| `onDrawerClose` | `() => void` | -- | Drawer fully closed |

### Methods (via ref)

| Method | Description |
|--------|-------------|
| `openDrawer(options?)` | Open drawer programmatically |
| `closeDrawer(options?)` | Close drawer programmatically |

---

## Gesture Handler ScrollView

Wrapped ScrollView that integrates with gesture handler's native touch system.

### Import

```typescript
import { ScrollView, FlatList } from 'react-native-gesture-handler';
```

### Available Wrapped Components

| Component | Description |
|-----------|-------------|
| `ScrollView` | Wrapped React Native ScrollView |
| `FlatList` | Wrapped React Native FlatList |
| `Switch` | Wrapped React Native Switch |
| `TextInput` | Wrapped React Native TextInput |

### Pan Inside ScrollView

When using a Pan gesture inside a ScrollView, set offsets to prevent conflicts:

```typescript
import { ScrollView, Gesture, GestureDetector } from 'react-native-gesture-handler';

const horizontalPan = Gesture.Pan()
  .activeOffsetX([-15, 15])   // Activate after 15px horizontal
  .failOffsetY([-5, 5]);      // Fail on vertical (let scroll handle)

// On web, add touchAction to allow vertical scrolling:
<GestureDetector gesture={horizontalPan} touchAction="pan-y">
  <Animated.View />
</GestureDetector>
```

---

## Choosing the Right Component

| Need | Component | Why |
|------|-----------|-----|
| General button/pressable | `Pressable` | Modern API, render props, cross-platform |
| List item with ripple | `RectButton` | Native rectangular ripple on Android |
| Icon-only button | `BorderlessButton` | Native borderless ripple on Android |
| Swipeable list row | `ReanimatedSwipeable` | Built-in swipe actions with Reanimated |
| Navigation drawer | `ReanimatedDrawerLayout` | Cross-platform drawer |
| ScrollView with gestures | `ScrollView` (from RNGH) | Better native gesture integration |

---

## Testing Gestures

### testID Property

All gestures support `testID` for identification in tests:

```typescript
const tap = Gesture.Tap()
  .testID('my-tap-gesture')
  .onActivate(() => { /* ... */ });
```

### Testing with fireGestureHandler (Jest)

For unit testing gesture callbacks, use `fireGestureHandler` from `react-native-gesture-handler/jest-utils`:

```typescript
import { fireGestureHandler, getByGestureTestId } from 'react-native-gesture-handler/jest-utils';
import { State } from 'react-native-gesture-handler';
import { render } from '@testing-library/react-native';

test('pan gesture updates position', () => {
  render(<DraggableBox />);

  fireGestureHandler(getByGestureTestId('drag-gesture'), [
    { state: State.BEGAN, translationX: 0, translationY: 0 },
    { state: State.ACTIVE, translationX: 50, translationY: 0 },
    { state: State.END, translationX: 100, translationY: 0 },
  ]);
});
```

### Maestro E2E Testing

For E2E tests, use Maestro's gesture commands that interact at the native level:

```yaml
# Tap gesture
- tapOn:
    id: "tap-target"

# Long press
- longPressOn:
    id: "long-press-target"

# Swipe gesture
- swipe:
    start: 90%, 50%
    end: 10%, 50%
    duration: 400
```

### Testing Tips

- Always wrap test components with `GestureHandlerRootView`
- Mock Reanimated shared values in unit tests
- Use `testID` on both the gesture and the view for reliable targeting
- For integration tests, prefer Maestro or Detox over simulated gesture events
- Remember to set up `jest.setup.js` with gesture handler mocks:

```typescript
// jest.setup.js
import 'react-native-gesture-handler/jestSetup';
```

---

**See Also**: `01-setup-and-basics.md`, `02-tap-and-press-gestures.md`, `06-reanimated-integration.md`
**Source**: https://docs.swmansion.com/react-native-gesture-handler/docs/components/pressable/, https://docs.swmansion.com/react-native-gesture-handler/docs/components/buttons/, https://docs.swmansion.com/react-native-gesture-handler/docs/components/reanimated_swipeable/
**Version**: 2.x
