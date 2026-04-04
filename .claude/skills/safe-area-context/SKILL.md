---
name: safe-area-context
description: "React Native Safe Area Context v5.x - SafeAreaView, useSafeAreaInsets, useSafeAreaFrame, SafeAreaProvider, edges prop, insets handling, platform-specific safe areas."
when_to_use: "Use when handling notches, status bars, home indicators, or safe area insets."
---

# Safe Area Context

> Flexible safe area inset handling for React Native across iOS, Android, and Web with native performance.

**Package:** `react-native-safe-area-context`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Adding safe area padding for notches, status bars, or home indicators
- Setting up `SafeAreaProvider` at the app root or modal boundaries
- Using `useSafeAreaInsets` for custom inset-aware layouts
- Configuring `SafeAreaView` with specific edges or modes
- Handling Android 15 edge-to-edge display with safe area insets
- Optimizing initial render with `initialWindowMetrics`

---

## Critical Rules

**ALWAYS:**
1. Wrap app root with `SafeAreaProvider` -- all consumers require a parent provider (Expo Router adds it automatically)
2. Prefer `SafeAreaView` over `useSafeAreaInsets` when possible -- native implementation avoids async bridge delays during rotation
3. Specify only needed edges via `edges` prop -- applying all edges when only top is needed wastes space
4. Add `SafeAreaProvider` at modal and route roots when using `react-native-screens` -- each native screen needs its own provider
5. Use `initialWindowMetrics` for faster initial render -- prevents layout flash on app startup

**NEVER:**
1. Place `SafeAreaProvider` inside `Animated.View` or `ScrollView` -- causes very frequent re-renders and performance issues
2. Use deprecated `SafeAreaView` from `react-native` core -- it only works on iOS and is unmaintained
3. Expect safe area insets to include the software keyboard -- use `react-native-keyboard-controller` for keyboard handling
4. Nest multiple `SafeAreaView` components for the same edge -- insets compound, creating excessive padding

---

## Core Patterns

### SafeAreaView with Specific Edges

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

function ScreenWithHeader(): React.JSX.Element {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Text>Header content avoids the notch</Text>
      <View style={{ flex: 1 }}>
        <Text>Body content</Text>
      </View>
    </SafeAreaView>
  );
}
```

### Custom Layout with useSafeAreaInsets

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

function CustomHeader(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingTop: insets.top, paddingHorizontal: Math.max(insets.left, 16) }}>
      <Text>Custom header with safe area awareness</Text>
    </View>
  );
}
```

### Bottom Action Bar with Minimum Padding

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Pressable, Text } from 'react-native';

function BottomActionBar(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, 16), paddingHorizontal: 16 }}>
      <Pressable style={{ backgroundColor: '#007AFF', padding: 16, borderRadius: 12 }}>
        <Text style={{ color: 'white', textAlign: 'center' }}>Continue</Text>
      </Pressable>
    </View>
  );
}
```

### Edge Mode: Maximum vs Additive

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';

function EdgeModes(): React.JSX.Element {
  return (
    <>
      {/* additive (default): finalPadding = safeArea + padding */}
      <SafeAreaView style={{ paddingBottom: 24 }} edges={['bottom']}>
        <View />
      </SafeAreaView>

      {/* maximum: finalPadding = max(safeArea, padding) */}
      <SafeAreaView style={{ paddingBottom: 24 }} edges={{ bottom: 'maximum' }}>
        <View />
      </SafeAreaView>
    </>
  );
}
```

---

## Anti-Patterns

**BAD** -- Using deprecated RN core SafeAreaView (iOS only):
```typescript
import { SafeAreaView } from 'react-native';
```

**GOOD** -- Using react-native-safe-area-context (cross-platform):
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
```

**BAD** -- Nesting SafeAreaView for the same edge (double padding):
```typescript
<SafeAreaView style={{ flex: 1 }}>
  <SafeAreaView style={{ flex: 1 }}>
    <Text>Double top/bottom padding!</Text>
  </SafeAreaView>
</SafeAreaView>
```

**GOOD** -- One SafeAreaView per edge boundary:
```typescript
<SafeAreaView style={{ flex: 1 }} edges={['top']}>
  <View style={{ flex: 1 }}>
    <Text>Content</Text>
  </View>
  <SafeAreaView edges={['bottom']}>
    <Text>Footer</Text>
  </SafeAreaView>
</SafeAreaView>
```

**BAD** -- Provider inside animated or scrollable view:
```typescript
<ScrollView>
  <SafeAreaProvider>
    <Content />
  </SafeAreaProvider>
</ScrollView>
```

**GOOD** -- Provider wraps the scroll container:
```typescript
<SafeAreaProvider>
  <ScrollView>
    <Content />
  </ScrollView>
</SafeAreaProvider>
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Wrap app root | `SafeAreaProvider` | `<SafeAreaProvider>{children}</SafeAreaProvider>` |
| Safe area padding | `SafeAreaView` | `<SafeAreaView edges={['top']}>{content}</SafeAreaView>` |
| Get inset values | `useSafeAreaInsets()` | `const insets = useSafeAreaInsets()` |
| Get provider frame | `useSafeAreaFrame()` | `const { width, height } = useSafeAreaFrame()` |
| Specific edges (array) | `edges` prop | `edges={['top', 'bottom']}` |
| Specific edges (object) | `edges` prop | `edges={{ top: 'additive', bottom: 'maximum' }}` |
| Margin mode | `mode` prop | `<SafeAreaView mode="margin" />` |
| Fast startup | `initialWindowMetrics` | `<SafeAreaProvider initialMetrics={initialWindowMetrics}>` |
| Listen without re-render | `SafeAreaListener` | `<SafeAreaListener onChange={cb} />` |
| Access context directly | `SafeAreaInsetsContext` | `<SafeAreaInsetsContext.Consumer>` |
| HOC pattern | `withSafeAreaInsets` | `withSafeAreaInsets(MyComponent)` |
| Testing mock | Jest mock | `jest.mock('...', () => mockSafeAreaContext)` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation, SafeAreaProvider setup, Expo config, initialWindowMetrics | [01-setup-provider.md](01-setup-provider.md) |
| useSafeAreaInsets, useSafeAreaFrame, SafeAreaView, edges, modes | [02-hooks-components.md](02-hooks-components.md) |
| NativeWind safe area utilities, Expo Router, platform handling, testing | [03-integration.md](03-integration.md) |

---

**Version:** 5.x (^5.6.2) | **Source:** https://github.com/AppAndFlow/react-native-safe-area-context
