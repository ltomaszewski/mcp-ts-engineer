# Hooks and Components

useSafeAreaInsets, useSafeAreaFrame, SafeAreaView, SafeAreaListener, edges, modes, and the HOC pattern.

---

## useSafeAreaInsets

Returns the safe area insets from the nearest `SafeAreaProvider`. Use when you need fine-grained control over how insets are applied.

### Signature

```typescript
function useSafeAreaInsets(): EdgeInsets;

// Return type
interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}
```

### Important Notes

- Insets are **not updated synchronously** -- slight delay when rotating the screen
- Returns `{ top: 0, right: 0, bottom: 0, left: 0 }` if `initialMetrics` is set and native values have not yet arrived
- Throws if no `SafeAreaProvider` ancestor exists

### Basic Usage

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

function HeaderBar(): React.JSX.Element {
  const insets = useSafeAreaInsets();

  return (
    <View
      style={{
        paddingTop: insets.top,
        paddingLeft: Math.max(insets.left, 16),
        paddingRight: Math.max(insets.right, 16),
        backgroundColor: '#007AFF',
      }}
    >
      <Text style={{ color: 'white', fontSize: 17, paddingVertical: 12 }}>
        Header
      </Text>
    </View>
  );
}
```

### Minimum Padding Pattern

Use `Math.max()` to ensure minimum spacing even on devices without notches:

```typescript
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { View } from 'react-native';

function BottomBar({ children }: { children: React.ReactNode }): React.JSX.Element {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ paddingBottom: Math.max(insets.bottom, 16) }}>
      {children}
    </View>
  );
}
```

---

## useSafeAreaFrame

Returns the frame (dimensions and position) of the nearest `SafeAreaProvider`. Alternative to React Native's `Dimensions` module with the benefit of being relative to the provider view.

### Signature

```typescript
function useSafeAreaFrame(): Rect;

// Return type
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### Usage

```typescript
import { useSafeAreaFrame, useSafeAreaInsets } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

function ResponsiveLayout(): React.JSX.Element {
  const frame = useSafeAreaFrame();
  const insets = useSafeAreaInsets();

  const usableHeight = frame.height - insets.top - insets.bottom;
  const isCompact = usableHeight < 500;

  return (
    <View style={{ flex: 1 }}>
      <Text>
        Screen: {frame.width}x{frame.height}, Usable: {usableHeight}px
      </Text>
      {isCompact ? <CompactView /> : <FullView />}
    </View>
  );
}
```

---

## SafeAreaView

A native `View` with safe area insets applied as extra padding or margin. Preferred over `useSafeAreaInsets` because:
- Implemented natively -- no async bridge delay during rotation
- No layout flicker from asynchronous inset updates
- Simpler API for common use cases

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `edges` | `Edge[] \| EdgeRecord` | All edges, `'additive'` | Which edges receive safe area insets |
| `mode` | `'padding' \| 'margin'` | `'padding'` | Apply insets as padding or margin |
| *...ViewProps* | -- | -- | All standard React Native `View` props |

### Edge Types

```typescript
type Edge = 'top' | 'right' | 'bottom' | 'left';
type EdgeMode = 'off' | 'additive' | 'maximum';
type EdgeRecord = Partial<Record<Edge, EdgeMode>>;
type Edges = readonly Edge[] | Readonly<EdgeRecord>;
```

---

## Edges Prop: Array Format

When using an array, listed edges use `'additive'` mode. Unlisted edges receive no insets (`'off'`).

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

// Only top edge -- common for screens with navigation tabs at bottom
function ScreenWithTabs(): React.JSX.Element {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top']}>
      <Text>Tab screen content</Text>
    </SafeAreaView>
  );
}

// Top, left, right -- bottom handled by tab bar
function TabScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['top', 'left', 'right']}>
      <Text>Content avoids notch and landscape edges</Text>
    </SafeAreaView>
  );
}

// Only bottom -- header handled by navigation
function ScreenWithHeader(): React.JSX.Element {
  return (
    <SafeAreaView style={{ flex: 1 }} edges={['bottom', 'left', 'right']}>
      <Text>Content avoids home indicator</Text>
    </SafeAreaView>
  );
}
```

---

## Edges Prop: Object Format

The object format provides per-edge control over how insets combine with existing padding/margin.

### EdgeMode Values

| Mode | Formula | Use Case |
|------|---------|----------|
| `'off'` | No inset applied | Edge handled elsewhere |
| `'additive'` | `finalPadding = safeArea + existingPadding` | Default; stacks inset on top of padding |
| `'maximum'` | `finalPadding = max(safeArea, existingPadding)` | Ensures minimum spacing without over-padding |

### Additive vs Maximum

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

function AdditiveExample(): React.JSX.Element {
  // Device has bottom inset of 34px
  // Final bottom padding: 34 + 24 = 58px
  return (
    <SafeAreaView
      style={{ flex: 1, paddingBottom: 24 }}
      edges={['bottom']} // defaults to 'additive'
    >
      <Text>Additive: 34 + 24 = 58px bottom padding</Text>
    </SafeAreaView>
  );
}

function MaximumExample(): React.JSX.Element {
  // Device has bottom inset of 34px
  // Final bottom padding: max(34, 24) = 34px
  return (
    <SafeAreaView
      style={{ flex: 1, paddingBottom: 24 }}
      edges={{ bottom: 'maximum' }}
    >
      <Text>Maximum: max(34, 24) = 34px bottom padding</Text>
    </SafeAreaView>
  );
}
```

### Mixed Edge Configuration

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

function MixedEdges(): React.JSX.Element {
  return (
    <SafeAreaView
      style={{ flex: 1, paddingTop: 16, paddingBottom: 24 }}
      edges={{
        top: 'additive',    // top = safeArea + 16
        bottom: 'maximum',  // bottom = max(safeArea, 24)
        left: 'off',        // no left inset
        right: 'off',       // no right inset
      }}
    >
      <Text>Mixed edge modes</Text>
    </SafeAreaView>
  );
}
```

---

## Mode Prop: Padding vs Margin

Controls whether insets are applied as `padding` (default) or `margin`.

```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
import { View } from 'react-native';

// Default: padding mode
function PaddingMode(): React.JSX.Element {
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: 'white' }}>
      {/* Background extends behind notch, content is padded */}
      <View style={{ flex: 1 }} />
    </SafeAreaView>
  );
}

// Margin mode: useful for separators or elements that should not stretch
function MarginMode(): React.JSX.Element {
  return (
    <SafeAreaView
      mode="margin"
      style={{ height: 1, backgroundColor: '#eee' }}
    />
  );
}
```

| Mode | Visual Effect |
|------|--------------|
| `'padding'` | Background color extends behind notch; content is inset |
| `'margin'` | Entire view (including background) is pushed away from edges |

---

## SafeAreaListener

A component that monitors safe area changes without triggering re-renders. Introduced in v5.5.0.

### Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `onChange` | `(data: { insets: EdgeInsets; frame: Rect }) => void` | Yes | Callback when insets or frame change |
| *...ViewProps* | -- | No | All standard View props |

### Usage

```typescript
import { SafeAreaListener } from 'react-native-safe-area-context';
import type { EdgeInsets, Rect } from 'react-native-safe-area-context';
import { useCallback } from 'react';

function InsetMonitor(): React.JSX.Element {
  const handleChange = useCallback(
    ({ insets, frame }: { insets: EdgeInsets; frame: Rect }) => {
      // Update Reanimated shared values, log analytics, etc.
      console.log('Insets changed:', insets);
      console.log('Frame changed:', frame);
    },
    [],
  );

  return <SafeAreaListener onChange={handleChange} />;
}
```

### When to Use SafeAreaListener vs Hooks

| Approach | Re-renders | Use Case |
|----------|-----------|----------|
| `useSafeAreaInsets()` | Yes, on every change | Standard UI that reacts to inset changes |
| `SafeAreaListener` | No | Logging, analytics, Reanimated shared values |

---

## withSafeAreaInsets HOC

Higher-order component for class components or when hook pattern is not suitable.

### Signature

```typescript
function withSafeAreaInsets<T>(
  WrappedComponent: React.ComponentType<T & WithSafeAreaInsetsProps>,
): React.ForwardRefExoticComponent<T>;

type WithSafeAreaInsetsProps = {
  insets: EdgeInsets;
};
```

### Usage

```typescript
import { withSafeAreaInsets, WithSafeAreaInsetsProps } from 'react-native-safe-area-context';
import { View, Text } from 'react-native';

interface MyComponentProps extends WithSafeAreaInsetsProps {
  title: string;
}

function MyComponent({ title, insets }: MyComponentProps): React.JSX.Element {
  return (
    <View style={{ paddingTop: insets.top }}>
      <Text>{title}</Text>
    </View>
  );
}

export default withSafeAreaInsets(MyComponent);

// Usage: <WrappedMyComponent title="Hello" />
// insets prop is injected automatically
```

---

## Common Screen Patterns

| Scenario | Edges to Apply | Reason |
|----------|---------------|--------|
| Tab screen (header shown) | `edges={['top', 'left', 'right']}` | Tab bar handles bottom |
| Stack screen (header shown) | `edges={['bottom', 'left', 'right']}` | Header handles top |
| Headerless full-screen | No `edges` prop (all edges) | Nothing else handles safe areas |
| Modal with bottom button | Outer: `edges={['top']}`, inner footer: `edges={['bottom']}` | Split responsibility |

---

## Decision Guide: SafeAreaView vs useSafeAreaInsets

| Criteria | SafeAreaView | useSafeAreaInsets |
|----------|-------------|------------------|
| Performance | Native, no bridge delay | JS-based, slight async delay |
| Rotation handling | Instant | May flicker briefly |
| Custom padding logic | Limited (additive/maximum) | Full control with Math.max, etc. |
| Animated layouts | Not suitable | Can combine with Animated/Reanimated |
| Background behind notch | Use mode="padding" | Manual style composition |
| Multiple edges with different logic | Use object edges | Individual edge handling |
| Simplicity | Simpler API | More boilerplate |

**Rule of thumb:** Start with `SafeAreaView`. Switch to `useSafeAreaInsets` when you need custom padding calculations, animated values, or conditional inset application.

---

**Version:** 5.x (^5.6.2) | **Source:** https://appandflow.github.io/react-native-safe-area-context/
