---
name: rn-screens
description: "React Native Screens v4.x - native screen containers, transitions, enableScreens, enableFreeze, formSheet, SearchBar."
when_to_use: "Use when optimizing navigation performance, configuring screen transitions, or working with native stack navigation."
---

# React Native Screens

> Native navigation primitives for React Native. Replaces plain React Native Views with native screen containers (UINavigationController on iOS, Fragment on Android) for platform-native transitions, memory optimization, and OS-level screen management.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Installing or configuring react-native-screens in an Expo or bare RN project
- Optimizing navigation performance with native screen containers
- Configuring screen transition animations (fade, slide, flip, push)
- Using formSheet / modal presentation with sheet detents
- Implementing native search bars in stack headers
- Working with screen lifecycle events (onAppear, onDisappear, onDismissed)
- Using `useTransitionProgress` for transition-aware animations
- Configuring `FullWindowOverlay` for overlays rendered above everything
- Enabling `enableFreeze` to prevent inactive screen re-renders
- Building custom navigation libraries on top of screen primitives

---

## Critical Rules

**ALWAYS:**
1. Call `enableScreens()` once at the app entry point before any navigation renders -- required to activate native screen containers
2. Use `npx expo install react-native-screens` in Expo projects -- ensures SDK-compatible version
3. Use `ScreenStackItem` (not raw `Screen`) as direct children of `ScreenStack` -- handles header display, LogBox, and modal integration correctly
4. Set `contentInsetAdjustmentBehavior="automatic"` on ScrollViews inside native stack screens -- prevents content being hidden behind translucent headers
5. Use `activityState={2}` for the active screen in `ScreenContainer` -- value `2` means fully interactive and signals transition completion
6. Handle `onDismissed` callback for gesture-dismissed screens -- sync navigation state with native dismissal

**NEVER:**
1. Use the deprecated `react-native-screens/native-stack` import -- native stack v5 is removed; use `@react-navigation/native-stack` v7 or Expo Router instead
2. Decrease `activityState` on a screen already displayed in `ScreenStack` -- native checks prevent removal of already-displayed screens
3. Skip Android `MainActivity` setup for `RNScreensFragmentFactory` in bare RN projects -- required for fragment restoration on Android
4. Use `enableFreeze(true)` without testing thoroughly -- can cause unresponsive tabs or stale state in some navigation patterns
5. Mix `ScreenContainer` and `ScreenStack` children -- they are separate container types with different behavior models

---

## Core Patterns

### Enable Screens at App Entry

```typescript
import { enableScreens, enableFreeze } from 'react-native-screens';

// Call once before any navigation renders
enableScreens(true);

// Optional: freeze inactive screens to prevent unnecessary re-renders
// Test thoroughly before enabling in production
enableFreeze(true);
```

### FormSheet Modal with Sheet Detents

```typescript
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack>
      <Stack.Screen name="index" />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 1.0],
          sheetCornerRadius: 20,
          sheetGrabberVisible: true,
          sheetLargestUndimmedDetentIndex: 0,
          sheetExpandsWhenScrolledToEdge: true,
        }}
      />
    </Stack>
  );
}
```

### Transition Progress Animation

```typescript
import { Animated } from 'react-native';
import { useTransitionProgress } from 'react-native-screens';

function AnimatedScreen() {
  const { progress } = useTransitionProgress();

  const opacity = progress.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [1.0, 0.0, 1.0],
    extrapolate: 'clamp',
  });

  return (
    <Animated.View style={{ flex: 1, opacity }}>
      {/* Screen content fades during transition */}
    </Animated.View>
  );
}
```

### Native Search Bar in Stack Header

```typescript
import { Stack } from 'expo-router';
import { SearchBarProps } from 'react-native-screens';

export default function SearchScreen() {
  return (
    <Stack.Screen
      options={{
        headerSearchBarOptions: {
          placeholder: 'Search items...',
          onChangeText: (e) => {
            const query = e.nativeEvent.text;
            // Filter results
          },
          hideWhenScrolling: true,
          autoCapitalize: 'none',
        },
      }}
    />
  );
}
```

---

## Anti-Patterns

**BAD** -- Using deprecated native-stack import:
```typescript
import { createNativeStackNavigator } from 'react-native-screens/native-stack';
// Removed in v4. Will error.
```
**GOOD** -- Use React Navigation or Expo Router:
```typescript
import { createNativeStackNavigator } from '@react-navigation/native-stack';
// Or with Expo Router: import { Stack } from 'expo-router';
```

**BAD** -- Forgetting enableScreens:
```typescript
// App renders but uses plain RN Views instead of native containers
// No native transitions, no memory optimization
export default function App() {
  return <NavigationContainer>...</NavigationContainer>;
}
```
**GOOD** -- Enable at entry point:
```typescript
import { enableScreens } from 'react-native-screens';
enableScreens(true);

export default function App() {
  return <NavigationContainer>...</NavigationContainer>;
}
```

**BAD** -- Using React state for transition-synced animations:
```typescript
const [opacity, setOpacity] = useState(1);
// Runs on JS thread, causes jank during native transitions
```
**GOOD** -- Use useTransitionProgress:
```typescript
const { progress } = useTransitionProgress();
const opacity = progress.interpolate({
  inputRange: [0, 1],
  outputRange: [0, 1],
});
```

**BAD** -- Hardcoding sheet detent as legacy string:
```typescript
sheetAllowedDetents: 'medium' // Legacy, imprecise
```
**GOOD** -- Use numeric fractions for precise control:
```typescript
sheetAllowedDetents: [0.25, 0.5, 1.0] // 25%, 50%, 100% of screen
```

---

## Quick Reference

| Task | API / Option | Example |
|------|-------------|---------|
| Enable native screens | `enableScreens(true)` | Call once at entry |
| Freeze inactive screens | `enableFreeze(true)` | Call once at entry |
| Stack animation | `stackAnimation` | `'fade'`, `'slide_from_right'`, `'none'` |
| Modal presentation | `stackPresentation` | `'modal'`, `'formSheet'`, `'transparentModal'` |
| Sheet stop points | `sheetAllowedDetents` | `[0.5, 1.0]` or `'fitToContents'` |
| Sheet corner radius | `sheetCornerRadius` | `20` |
| Sheet grabber | `sheetGrabberVisible` | `true` |
| Dimming control | `sheetLargestUndimmedDetentIndex` | `0`, `'none'`, `'last'` |
| Gesture back | `gestureEnabled` | `true` (iOS, default) |
| Full-screen swipe | `fullScreenSwipeEnabled` | `true` (iOS) |
| Screen orientation | `screenOrientation` | `'portrait'`, `'landscape'` |
| Transition progress | `useTransitionProgress()` | Returns `{ progress, closing, goingForward }` |
| Native search bar | `headerSearchBarOptions` | `{ placeholder, onChangeText }` |
| Overlay above all | `<FullWindowOverlay>` | iOS only, renders under Window |
| Screen appear event | `onAppear` | Callback when screen appears |
| Screen dismiss event | `onDismissed` | Callback when gesture/back dismisses |
| Prevent dismiss | `preventNativeDismiss` | `true` (iOS) |
| Hide home indicator | `homeIndicatorHidden` | `true` (iOS) |
| Status bar style | `statusBarStyle` | `'light'`, `'dark'`, `'auto'` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation, enableScreens, Expo config, Android setup | [01-setup-config.md](01-setup-config.md) |
| Screen, ScreenContainer, ScreenStack, ScreenStackItem props | [02-screen-components.md](02-screen-components.md) |
| useTransitionProgress, lifecycle events, animations | [03-transitions-events.md](03-transitions-events.md) |
| Expo Router integration, React Navigation, performance | [04-integration.md](04-integration.md) |

---

## Related Skills

| When you need | Load |
|---------------|------|
| Expo Router file-based navigation | `expo-router` |
| Reanimated transition animations | `reanimated` |
| Gesture-driven interactions | `gesture-handler` |
| Keyboard handling with native stack | `keyboard-controller` |

---

**Version:** 4.x (^4.23.0) | **Source:** https://github.com/software-mansion/react-native-screens
