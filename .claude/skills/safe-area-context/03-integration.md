# Integration

NativeWind safe area utilities, Expo Router, platform-specific handling, testing, and troubleshooting.

---

## NativeWind Safe Area Utilities

NativeWind v5 provides Tailwind-style utility classes that map to `react-native-safe-area-context` insets via the CSS `env()` function. Requires `react-native-safe-area-context` as a peer dependency.

### Setup

NativeWind safe area utilities require `SafeAreaProvider` wrapping your app. Expo Router adds it automatically -- no extra setup needed.

For non-Expo Router apps:

```typescript
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      {/* NativeWind safe area classes work here */}
    </SafeAreaProvider>
  );
}
```

### Padding and Margin Utilities

| Utility | CSS Equivalent | Description |
|---------|---------------|-------------|
| `p-safe` | `padding: env(safe-area-inset-*)` | All sides |
| `px-safe` | `padding-left/right: env(...)` | Horizontal |
| `py-safe` | `padding-top/bottom: env(...)` | Vertical |
| `pt-safe` | `padding-top: env(safe-area-inset-top)` | Top only |
| `pr-safe` | `padding-right: env(safe-area-inset-right)` | Right only |
| `pb-safe` | `padding-bottom: env(safe-area-inset-bottom)` | Bottom only |
| `pl-safe` | `padding-left: env(safe-area-inset-left)` | Left only |
| `m-safe` | `margin: env(safe-area-inset-*)` | Margin equivalent |
| `mt-safe` | `margin-top: env(safe-area-inset-top)` | Margin top |
| `mb-safe` | `margin-bottom: env(safe-area-inset-bottom)` | Margin bottom |
| `ps-safe` / `pe-safe` | Logical padding (start/end) | RTL-aware |
| `ms-safe` / `me-safe` | Logical margin (start/end) | RTL-aware |

### Positioning Utilities

| Utility | Description |
|---------|-------------|
| `inset-safe` | All position edges |
| `inset-x-safe` / `inset-y-safe` | Horizontal / vertical |
| `top-safe` / `bottom-safe` | Individual edges |
| `left-safe` / `right-safe` | Individual edges |
| `start-safe` / `end-safe` | RTL-aware positioning |

### Height Utilities

| Utility | Description |
|---------|-------------|
| `h-screen-safe` | `height: 100vh - top - bottom` |
| `min-h-screen-safe` | Minimum height minus safe areas |
| `max-h-screen-safe` | Maximum height minus safe areas |

### Safe Area with Offset

Adds spacing **on top of** the safe area inset:

```typescript
// mt-safe-offset-4 = calc(env(safe-area-inset-top) + 1rem)
<View className="mt-safe-offset-4">
  <Text>16px below the safe area top</Text>
</View>

// Arbitrary value
<View className="mt-safe-offset-[8px]">
  <Text>8px below the safe area top</Text>
</View>
```

### Safe Area with Or (Fallback)

Uses the **larger of** safe area or the fallback value:

```typescript
// mt-safe-or-4 = max(env(safe-area-inset-top), 1rem)
<View className="mt-safe-or-4">
  <Text>At least 16px from top, or safe area if larger</Text>
</View>

// Arbitrary value
<View className="pb-safe-or-[20px]">
  <Text>At least 20px from bottom, or safe area if larger</Text>
</View>
```

### Complete NativeWind Screen Example

```typescript
import { View, Text, ScrollView, Pressable } from 'react-native';

function NativeWindScreen(): React.JSX.Element {
  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      {/* Header with safe area top */}
      <View className="pt-safe px-4 bg-blue-500">
        <View className="h-11 justify-center">
          <Text className="text-white text-lg font-semibold">My App</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView className="flex-1 px-4">
        <Text className="text-gray-900 dark:text-white mt-4">
          Content area
        </Text>
      </ScrollView>

      {/* Bottom action with safe area */}
      <View className="pb-safe-offset-4 px-4">
        <Pressable className="bg-blue-500 py-4 rounded-xl active:opacity-70">
          <Text className="text-white text-center font-semibold">
            Continue
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
```

### When to Use NativeWind vs SafeAreaView

| Approach | Best For |
|----------|----------|
| NativeWind `pt-safe` | Projects already using NativeWind; consistent with Tailwind styling patterns |
| `SafeAreaView` component | Simple wrapping; native performance; no NativeWind dependency |
| `useSafeAreaInsets` hook | Custom calculations; animated values; conditional logic |

---

## Expo Router Integration

Expo Router automatically adds `SafeAreaProvider` to every route. No manual provider setup needed.

| Screen Type | Safe Area Strategy |
|-------------|-------------------|
| Stack (header shown) | Header handles top; use `edges={['bottom', 'left', 'right']}` |
| Tabs (header + tab bar) | Both handle safe areas; no `SafeAreaView` needed in screen content |
| Headerless (`headerShown: false`) | Use `SafeAreaView` with all edges (no `edges` prop) |
| Modal | Add explicit `SafeAreaProvider` at modal root (see 01-setup-provider.md) |

```typescript
// app/onboarding.tsx -- Headerless screen needs all edges
import { Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

export default function Onboarding(): React.JSX.Element {
  return (
    <>
      <Stack.Screen options={{ headerShown: false }} />
      <SafeAreaView style={{ flex: 1 }}>
        <Text>Full-screen with all safe areas</Text>
      </SafeAreaView>
    </>
  );
}
```

---

## Platform-Specific Behavior

### iOS

| Feature | Inset Source | Typical Values |
|---------|-------------|----------------|
| Status bar | `top` | 44-59px (Dynamic Island: 59px) |
| Home indicator | `bottom` | 34px (Face ID devices) |
| Landscape notch | `left` or `right` | ~44px on notch side |
| No notch (SE) | `top` | 20px (status bar only) |

iOS insets are provided by the system `UIView.safeAreaInsets` API and are always accurate.

### Android

| Feature | Inset Source | Notes |
|---------|-------------|-------|
| Status bar | `top` | 24-48px depending on device |
| Navigation bar | `bottom` | 0px (gesture nav) or 48px (button nav) |
| Display cutout | `top` | Added to status bar height |
| Edge-to-edge (API 35+) | All edges | Android 15 enforces edge-to-edge |

### Android 15 Edge-to-Edge

Android 15 (API 35) enforces edge-to-edge display. Content renders behind status bar and navigation bar by default. `react-native-safe-area-context` handles this automatically when properly configured.

```typescript
// Works correctly on Android 15 with edge-to-edge
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

function Screen(): React.JSX.Element {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Content avoids status bar and nav bar</Text>
    </SafeAreaView>
  );
}
```

### Web

| Feature | Notes |
|---------|-------|
| Insets | Usually all zeros (no notch) |
| `env()` | CSS `env(safe-area-inset-*)` supported in modern browsers |
| PWA / fullscreen | Insets may apply for camera cutouts |
| SSR | Use `initialMetrics` to prevent hydration mismatch |

### Platform-Conditional Insets

```typescript
import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

function PlatformAwareHeader(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  // Android may need extra spacing for certain OEM skins
  const topPadding = Platform.select({
    ios: insets.top,
    android: Math.max(insets.top, 24),
    default: 0,
  });

  return (
    <View style={{ paddingTop: topPadding }}>
      <Text>Platform-aware header</Text>
    </View>
  );
}
```

---

## Testing

### Jest Mock (Built-in)

The library provides a built-in mock with default zero insets:

```typescript
// jest.setup.ts or test setup file
import mockSafeAreaContext from 'react-native-safe-area-context/jest/mock';

jest.mock('react-native-safe-area-context', () => mockSafeAreaContext);
```

Default mock metrics:
```typescript
{
  frame: { width: 320, height: 640, x: 0, y: 0 },
  insets: { left: 0, right: 0, bottom: 0, top: 0 },
}
```

### Custom Test Values

Wrap components with `SafeAreaProvider` and custom `initialMetrics`:

```typescript
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { render } from '@testing-library/react-native';

const TEST_METRICS = {
  frame: { x: 0, y: 0, width: 390, height: 844 },
  insets: { top: 47, right: 0, bottom: 34, left: 0 },
};

function renderWithSafeArea(ui: React.ReactElement) {
  return render(
    <SafeAreaProvider initialMetrics={TEST_METRICS}>
      {ui}
    </SafeAreaProvider>,
  );
}

// Usage in tests
it('applies bottom padding', () => {
  const { getByText } = renderWithSafeArea(<BottomBar />);
  // Assert bottom padding is at least 34px
});
```

### Test Wrapper Component

```typescript
import { SafeAreaProvider } from 'react-native-safe-area-context';

interface TestSafeAreaProviderProps {
  children: React.ReactNode;
  insets?: { top?: number; right?: number; bottom?: number; left?: number };
}

export function TestSafeAreaProvider({
  children,
  insets = {},
}: TestSafeAreaProviderProps): React.JSX.Element {
  return (
    <SafeAreaProvider
      initialMetrics={{
        frame: { x: 0, y: 0, width: 390, height: 844 },
        insets: {
          top: insets.top ?? 0,
          right: insets.right ?? 0,
          bottom: insets.bottom ?? 0,
          left: insets.left ?? 0,
        },
      }}
    >
      {children}
    </SafeAreaProvider>
  );
}
```

### Jest transformIgnorePatterns

If you encounter "Cannot use import statement outside a module":

```javascript
// jest.config.js
module.exports = {
  transformIgnorePatterns: [
    'node_modules/(?!((jest-)?react-native|@react-native(-community)?|react-native-safe-area-context)/)',
  ],
};
```

---

## Troubleshooting

### "No safe area value available"

**Cause:** Component uses `useSafeAreaInsets` or `SafeAreaView` without a parent `SafeAreaProvider`.

**Fix:** Ensure `SafeAreaProvider` wraps the component tree. With Expo Router this is automatic. For bare RN apps, add it at the app root.

### Double Padding on Nested SafeAreaViews

**Cause:** Multiple `SafeAreaView` components applying insets for the same edge.

**Fix:** Use `edges` prop to specify which edges each view handles:

```typescript
// Outer handles top, inner handles bottom
<SafeAreaView edges={['top']} style={{ flex: 1 }}>
  <Content />
  <SafeAreaView edges={['bottom']}>
    <Footer />
  </SafeAreaView>
</SafeAreaView>
```

### Insets Return Zero on Android

**Cause:** App is not rendering edge-to-edge, so system bars are opaque and content does not extend behind them.

**Fix:** Enable edge-to-edge display. On Android 15+ (API 35) this is enforced automatically. For older versions, configure via `react-native-edge-to-edge` or set `android:windowTranslucentStatus` in styles.xml.

### Layout Flash on App Startup

**Cause:** Insets are measured asynchronously after the first render.

**Fix:** Use `initialWindowMetrics`:

```typescript
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';

<SafeAreaProvider initialMetrics={initialWindowMetrics}>
  {/* No flash */}
</SafeAreaProvider>
```

### Safe Area Does Not Include Keyboard

**Expected behavior.** Safe area insets represent physical device features (notch, home indicator), not the software keyboard.

**Fix:** Use `react-native-keyboard-controller` for keyboard-aware layouts:

```typescript
import { KeyboardAwareScrollView } from 'react-native-keyboard-controller';
import { SafeAreaView } from 'react-native-safe-area-context';

function FormScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <KeyboardAwareScrollView>
        {/* Form fields */}
      </KeyboardAwareScrollView>
    </SafeAreaView>
  );
}
```

### Rotation Flicker with useSafeAreaInsets

**Cause:** Hook values update asynchronously via the JS bridge.

**Fix:** Use `SafeAreaView` component instead -- it applies insets natively without bridge delay.

---

## Related Skills

| Skill | Relationship |
|-------|-------------|
| `nativewind` | NativeWind v5 safe area utility classes (`pt-safe`, `pb-safe`, etc.) |
| `expo-router` | Expo Router automatically adds `SafeAreaProvider` to routes |
| `keyboard-controller` | Keyboard handling (safe area does not include keyboard) |
| `react-native-core` | Core RN components and platform differences |
| `expo-core` | Expo SDK setup and configuration |

---

## Exports Quick Reference

| Export | Type | Description |
|--------|------|-------------|
| `SafeAreaProvider` | Component | Root provider for inset measurement |
| `SafeAreaView` | Component | View with native inset padding/margin |
| `SafeAreaListener` | Component | Inset change listener without re-renders |
| `SafeAreaInsetsContext` | React Context | Direct context for insets |
| `SafeAreaFrameContext` | React Context | Direct context for frame |
| `useSafeAreaInsets` | Hook | Returns `EdgeInsets` |
| `useSafeAreaFrame` | Hook | Returns `Rect` |
| `withSafeAreaInsets` | HOC | Injects `insets` prop |
| `initialWindowMetrics` | Static object | Pre-measured startup metrics |
| `EdgeInsets` | Type | `{ top, right, bottom, left }` |
| `Rect` | Type | `{ x, y, width, height }` |
| `Metrics` | Type | `{ insets: EdgeInsets, frame: Rect }` |
| `Edge` | Type | `'top' \| 'right' \| 'bottom' \| 'left'` |
| `EdgeMode` | Type | `'off' \| 'additive' \| 'maximum'` |
| `Edges` | Type | `readonly Edge[] \| Readonly<EdgeRecord>` |

---

**Version:** 5.x (^5.6.2) | **Source:** https://github.com/AppAndFlow/react-native-safe-area-context
