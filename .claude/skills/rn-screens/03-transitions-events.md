# Transitions & Events

useTransitionProgress, useReanimatedTransitionProgress, screen lifecycle events, animation configuration, and scroll edge effects.

---

## useTransitionProgress

Hook that provides animated values tracking the current screen's transition progress. Uses React Native's `Animated` API.

### Import

```typescript
import { useTransitionProgress } from 'react-native-screens';
```

### Return Value

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `progress` | `Animated.Value` | 0.0 - 1.0 | Current transition progress |
| `closing` | `Animated.Value` | 0 or 1 | `1` if screen is being navigated away from |
| `goingForward` | `Animated.Value` | 0 or 1 | `1` if transition is pushing (forward navigation) |

### Basic Usage

```typescript
import { Animated, View, Text, StyleSheet } from 'react-native';
import { useTransitionProgress } from 'react-native-screens';

function FadingScreen() {
  const { progress } = useTransitionProgress();

  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1.0, 0.0, 1.0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      <Text>This screen fades during transitions</Text>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### Directional Animation

```typescript
import { Animated, View, StyleSheet } from 'react-native';
import { useTransitionProgress } from 'react-native-screens';

function DirectionalFadeScreen() {
  const { progress, closing, goingForward } = useTransitionProgress();

  // Fade out only when closing
  const opacity = Animated.multiply(
    progress,
    Animated.subtract(1, closing)
  ).interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={[styles.container, { opacity }]}>
      {/* Content */}
    </Animated.View>
  );
}
```

### Scale Animation on Transition

```typescript
import { Animated, StyleSheet } from 'react-native';
import { useTransitionProgress } from 'react-native-screens';

function ScalingScreen() {
  const { progress } = useTransitionProgress();

  const scale = progress.interpolate({
    inputRange: [0, 1],
    outputRange: [0.85, 1],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View
      style={[
        styles.container,
        { transform: [{ scale }] },
      ]}
    >
      {/* Content scales from 85% to 100% during push */}
    </Animated.View>
  );
}
```

### Rules

- Must be called inside a screen rendered within a `ScreenStack` or native stack navigator
- Values update during the native transition animation on every frame
- Uses React Native `Animated` API -- for Reanimated, use `useReanimatedTransitionProgress`
- Available on iOS and Android

---

## useReanimatedTransitionProgress

Reanimated-compatible version of transition progress tracking. Returns shared values that run on the UI thread for smoother animations.

### Import

```typescript
import { useReanimatedTransitionProgress } from 'react-native-screens/reanimated';
```

### Setup

Wrap your app (or navigator) with `ReanimatedScreenProvider`:

```typescript
import { ReanimatedScreenProvider } from 'react-native-screens/reanimated';

function App() {
  return (
    <ReanimatedScreenProvider>
      <NavigationContainer>
        {/* navigators */}
      </NavigationContainer>
    </ReanimatedScreenProvider>
  );
}
```

### Return Value

| Property | Type | Range | Description |
|----------|------|-------|-------------|
| `progress` | `SharedValue<number>` | 0.0 - 1.0 | Transition progress (shared value) |
| `closing` | `SharedValue<number>` | 0 or 1 | Closing state (shared value) |
| `goingForward` | `SharedValue<number>` | 0 or 1 | Forward navigation (shared value) |

### Usage with Reanimated

```typescript
import Animated, {
  useAnimatedStyle,
  useDerivedValue,
  interpolate,
} from 'react-native-reanimated';
import { useReanimatedTransitionProgress } from 'react-native-screens/reanimated';

function ReanimatedTransitionScreen() {
  const { progress } = useReanimatedTransitionProgress();

  const animatedStyle = useAnimatedStyle(() => {
    const scale = interpolate(
      progress.value,
      [0, 1],
      [0.8, 1],
    );

    const opacity = interpolate(
      progress.value,
      [0, 0.5, 1],
      [0, 0, 1],
    );

    return {
      transform: [{ scale }],
      opacity,
    };
  });

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      {/* Content */}
    </Animated.View>
  );
}
```

### Requirements

- `react-native-reanimated` must be installed
- App must be wrapped with `ReanimatedScreenProvider`
- Shared values run on the UI thread for smooth 60/120fps animations

---

## Screen Lifecycle Events

Events fired during screen transitions and state changes. Available on `ScreenStackItem` and through navigation library screen options.

### Event Order

**Push (screen appearing):**
```
onWillAppear → [transition animation] → onAppear → onTransitionProgress(1.0)
```

**Pop (screen disappearing):**
```
onWillDisappear → [transition animation] → onDisappear → onDismissed
```

### Event Callbacks

| Event | When Fired | Platform | Notes |
|-------|-----------|----------|-------|
| `onWillAppear` | Transition to appear starts | All | Before animation begins |
| `onAppear` | Screen fully appeared | All | Transition complete |
| `onWillDisappear` | Transition to disappear starts | All | Before animation begins |
| `onDisappear` | Screen fully disappeared | All | Transition complete |
| `onDismissed` | Screen dismissed by gesture/back | All | Includes `dismissCount` |
| `onHeaderBackButtonClicked` | Native header back pressed | Android | Before navigation |
| `onNativeDismissCancelled` | Dismissal prevented | iOS | With `preventNativeDismiss` |
| `onFinishTransitioning` | Stack transition completed | All | On `ScreenStack` |
| `onTransitionProgress` | Each frame of transition | All | `{ progress, closing, goingForward }` |
| `onSheetDetentChanged` | Sheet resting point changed | All | `{ index, isStable }` |
| `onHeaderHeightChange` | Header height changed | All | `{ headerHeight }` |

### Event Usage in Expo Router

```typescript
import { Stack, useNavigation } from 'expo-router';
import { useEffect } from 'react';

export default function DetailScreen() {
  return (
    <>
      <Stack.Screen
        listeners={{
          transitionStart: (e) => {
            console.log('Transition started', e.data.closing);
          },
          transitionEnd: (e) => {
            console.log('Transition ended', e.data.closing);
          },
          beforeRemove: (e) => {
            // Prevent going back
            if (hasUnsavedChanges) {
              e.preventDefault();
            }
          },
        }}
      />
      {/* Screen content */}
    </>
  );
}
```

### Handling Gesture Dismissal

```typescript
import { ScreenStackItem } from 'react-native-screens';

function DismissableScreen({ onDismiss }: { onDismiss: () => void }) {
  return (
    <ScreenStackItem
      stackPresentation="modal"
      gestureEnabled={true}
      onDismissed={(e) => {
        const { dismissCount } = e.nativeEvent;
        console.log(`Dismissed ${dismissCount} screen(s)`);
        onDismiss();
      }}
    >
      {/* Modal content */}
    </ScreenStackItem>
  );
}
```

### Preventing Dismissal

```typescript
import { ScreenStackItem } from 'react-native-screens';

function UnsavedChangesScreen() {
  return (
    <ScreenStackItem
      stackPresentation="formSheet"
      preventNativeDismiss={true}
      onNativeDismissCancelled={(e) => {
        // Show confirmation dialog
        Alert.alert(
          'Unsaved Changes',
          'Discard changes?',
          [
            { text: 'Keep Editing', style: 'cancel' },
            { text: 'Discard', style: 'destructive', onPress: goBack },
          ]
        );
      }}
    >
      {/* Form content */}
    </ScreenStackItem>
  );
}
```

---

## Stack Animation Configuration

### Per-Screen Animation

```typescript
// Expo Router
<Stack.Screen
  name="details"
  options={{
    animation: 'slide_from_right',    // Push animation
    animationDuration: 350,            // iOS only, in ms
    customAnimationOnSwipe: true,      // Use same animation on swipe dismiss (iOS)
  }}
/>

// React Navigation
<Stack.Screen
  name="Details"
  component={DetailsScreen}
  options={{
    animation: 'fade_from_bottom',
  }}
/>
```

### Animation Types with Visual Descriptions

| Animation | iOS | Android | Description |
|-----------|-----|---------|-------------|
| `default` | Standard push | Standard push | Platform-native animation |
| `fade` | Cross-fade | Cross-fade | Opacity transition |
| `fade_from_bottom` | Slide + fade | Slide + fade | Slides up while fading in |
| `flip` | Card flip | -- | Requires modal presentation, iOS only |
| `simple_push` | Push, no header | -- | Content pushes, header doesn't animate |
| `slide_from_bottom` | Slide up | Slide up | Full slide from bottom edge |
| `slide_from_right` | Slide right | Slide right | Standard horizontal push |
| `slide_from_left` | Slide left | Slide left | Reverse horizontal push |
| `ios_from_right` | -- | iOS-style right | iOS push feel on Android |
| `ios_from_left` | -- | iOS-style left | iOS push feel, reversed |
| `none` | No animation | No animation | Instant transition |

### Custom Transition Duration (iOS)

```typescript
<Stack.Screen
  name="slow-transition"
  options={{
    animation: 'slide_from_right',
    transitionDuration: 500, // milliseconds, iOS only
  }}
/>
```

---

## FormSheet Detent Configuration

### Detent Types

```typescript
// Numeric fractions (recommended for precision)
sheetAllowedDetents: [0.25, 0.5, 1.0]  // 25%, 50%, 100% of screen

// Fit to content size
sheetAllowedDetents: 'fitToContents'

// Legacy string values
sheetAllowedDetents: 'medium'  // ~50%
sheetAllowedDetents: 'large'   // ~100%
sheetAllowedDetents: 'all'     // medium + large
```

### Complete FormSheet Example

```typescript
import { Stack } from 'expo-router';

export default function ModalLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="sheet-modal"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.3, 0.6, 1.0],
          sheetInitialDetentIndex: 0,
          sheetCornerRadius: 24,
          sheetGrabberVisible: true,
          sheetLargestUndimmedDetentIndex: 0,
          sheetExpandsWhenScrolledToEdge: true,
          gestureEnabled: true,
          headerShown: false,
        }}
      />
    </Stack>
  );
}
```

### Responding to Detent Changes

```typescript
// Via onSheetDetentChanged on ScreenStackItem
<ScreenStackItem
  stackPresentation="formSheet"
  sheetAllowedDetents={[0.5, 1.0]}
  onSheetDetentChanged={(e) => {
    const { index, isStable } = e.nativeEvent;
    if (isStable) {
      console.log(`Sheet settled at detent ${index}`);
    }
  }}
>
  {/* Content */}
</ScreenStackItem>
```

---

## Scroll Edge Effects (iOS 26+)

Configure edge effects for the primary ScrollView in a screen:

```typescript
type ScrollEdgeEffect = 'automatic' | 'hard' | 'soft' | 'hidden';

// Per-edge configuration
<Stack.Screen
  options={{
    scrollEdgeEffects: {
      top: 'automatic',
      bottom: 'soft',
      left: 'hidden',
      right: 'hidden',
    },
  }}
/>
```

| Effect | Behavior |
|--------|----------|
| `automatic` | System decides based on context |
| `hard` | Sharp bounce/edge effect |
| `soft` | Gentle rubber-band effect |
| `hidden` | No edge effect |

---

## Screen Orientation

Lock orientation per screen:

```typescript
type ScreenOrientationTypes =
  | 'default'         // Follow system setting
  | 'all'             // Allow all orientations
  | 'portrait'        // Portrait up and down
  | 'portrait_up'     // Portrait up only
  | 'portrait_down'   // Portrait down only
  | 'landscape'       // Landscape left and right
  | 'landscape_left'  // Landscape left only
  | 'landscape_right'; // Landscape right only
```

```typescript
<Stack.Screen
  name="video-player"
  options={{
    screenOrientation: 'landscape',
  }}
/>
```

---

**Source:** https://github.com/software-mansion/react-native-screens | **Version:** 4.x (^4.23.0)
