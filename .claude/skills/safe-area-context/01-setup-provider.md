# Setup and SafeAreaProvider

Installation, provider configuration, initial metrics, and Expo integration.

---

## Installation

### Expo (Recommended)

```bash
npx expo install react-native-safe-area-context
```

This installs the version compatible with your Expo SDK. Pre-installed in default Expo templates.

### Bare React Native

```bash
npm install react-native-safe-area-context
# or
yarn add react-native-safe-area-context
```

After installing, run `pod install` for iOS:

```bash
cd ios && pod install
```

### Version Compatibility

| Library Version | React Native Support |
|-----------------|---------------------|
| 5.x | >= 0.74 |
| 4.x | 0.64 - 0.74 |

v5.x has experimental support for the new React Native architecture. Breaking changes are possible between minor versions for new architecture support.

---

## SafeAreaProvider

The root component that measures safe area insets and provides them to all descendant consumers. It is a `View` from where insets are relative to -- if it overlaps with system elements (status bar, notches, home indicator), those values are provided to consumers.

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialMetrics` | `Metrics \| null` | `null` | Pre-populates frame and insets for immediate rendering without waiting for native measurement |
| `style` | `ViewStyle` | `{ flex: 1 }` | Standard View style; defaults to flex: 1 |
| `children` | `ReactNode` | -- | App content |
| *...ViewProps* | -- | -- | All standard React Native `View` props |

### Basic Setup

```typescript
import { SafeAreaProvider } from 'react-native-safe-area-context';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      {/* Your app content */}
    </SafeAreaProvider>
  );
}
```

### With initialWindowMetrics (Recommended)

Provides startup values so the first render can immediately use inset data without waiting for the async native measurement. Prevents layout flash on app launch.

```typescript
import {
  SafeAreaProvider,
  initialWindowMetrics,
} from 'react-native-safe-area-context';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      {/* Content renders immediately with correct insets */}
    </SafeAreaProvider>
  );
}
```

**Caveat:** Cannot be used if the provider remounts during app lifecycle or with `react-native-navigation` (Wix).

---

## Expo Router Integration

Expo Router automatically wraps every route with `SafeAreaProvider`. You do **not** need to add it manually in your root layout.

```typescript
// app/_layout.tsx -- No SafeAreaProvider needed with Expo Router
import { Stack } from 'expo-router';

export default function RootLayout(): React.JSX.Element {
  return <Stack />;
}
```

```typescript
// app/index.tsx -- SafeAreaView works directly
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

export default function HomeScreen(): React.JSX.Element {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Text>Content respects safe areas</Text>
    </SafeAreaView>
  );
}
```

### When You Still Need SafeAreaProvider with Expo Router

Add an explicit `SafeAreaProvider` at the root of:
- **Modals** presented via `react-native-screens`
- **Native screen boundaries** where a new native container is created

```typescript
// app/modal.tsx
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native';

export default function ModalScreen(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={{ flex: 1 }}>
        <Text>Modal content with correct insets</Text>
      </SafeAreaView>
    </SafeAreaProvider>
  );
}
```

---

## Provider Placement Rules

### Single Provider (Most Apps)

For apps with a single navigation tree:

```typescript
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <NavigationContainer>
        {/* Navigation tree */}
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
```

### Multiple Providers (Modals, react-native-screens)

When using `react-native-screens`, each native screen container needs its own provider because inset measurement is relative to the provider view:

```typescript
import { SafeAreaProvider } from 'react-native-safe-area-context';

function ModalRoute(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      {/* Modal content with its own inset context */}
    </SafeAreaProvider>
  );
}
```

---

## TypeScript Types

### Core Types

```typescript
// Inset measurements for each edge
interface EdgeInsets {
  top: number;
  right: number;
  bottom: number;
  left: number;
}

// Provider frame dimensions
interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Combined metrics (used by initialMetrics)
interface Metrics {
  insets: EdgeInsets;
  frame: Rect;
}

// Edge identifiers
type Edge = 'top' | 'right' | 'bottom' | 'left';

// How insets are applied per edge
type EdgeMode = 'off' | 'additive' | 'maximum';

// Object form of edges prop
type EdgeRecord = Partial<Record<Edge, EdgeMode>>;

// Edges prop accepts array or object
type Edges = readonly Edge[] | Readonly<EdgeRecord>;
```

### SafeAreaProviderProps

```typescript
interface SafeAreaProviderProps extends ViewProps {
  children?: React.ReactNode;
  initialMetrics?: Metrics | null;
}
```

---

## initialWindowMetrics Deep Dive

The `initialWindowMetrics` export provides pre-measured values from the native layer at app startup. This is a static snapshot taken before React renders.

### What It Contains

```typescript
// Typical values on iPhone 15 Pro
{
  frame: { x: 0, y: 0, width: 393, height: 852 },
  insets: { top: 59, right: 0, bottom: 34, left: 0 }
}

// Typical values on standard Android device
{
  frame: { x: 0, y: 0, width: 411, height: 891 },
  insets: { top: 24, right: 0, bottom: 0, left: 0 }
}
```

### When Not to Use

| Scenario | Reason |
|----------|--------|
| Provider remounts | Static values may be stale |
| `react-native-navigation` (Wix) | Different screen lifecycle |
| Web SSR | No native layer at build time; use custom `initialMetrics` |

### Web SSR Fallback

For server-side rendering, inject reasonable defaults to prevent broken layouts:

```typescript
import { SafeAreaProvider } from 'react-native-safe-area-context';

const webSSRMetrics = {
  frame: { x: 0, y: 0, width: 0, height: 0 },
  insets: { top: 0, right: 0, bottom: 0, left: 0 },
};

export default function App(): React.JSX.Element {
  return (
    <SafeAreaProvider initialMetrics={webSSRMetrics}>
      {/* Content */}
    </SafeAreaProvider>
  );
}
```

---

## Context Exports

The library exports React contexts for direct consumption:

```typescript
import {
  SafeAreaInsetsContext,
  SafeAreaFrameContext,
} from 'react-native-safe-area-context';

// Context consumer pattern (class components)
function LegacyComponent(): React.JSX.Element {
  return (
    <SafeAreaInsetsContext.Consumer>
      {(insets) => (
        <View style={{ paddingTop: insets?.top ?? 0 }}>
          <Text>Content</Text>
        </View>
      )}
    </SafeAreaInsetsContext.Consumer>
  );
}
```

### Deprecated Exports

| Deprecated | Replacement |
|------------|-------------|
| `SafeAreaContext` | `SafeAreaInsetsContext` |
| `SafeAreaConsumer` | `SafeAreaInsetsContext.Consumer` |
| `useSafeArea()` | `useSafeAreaInsets()` |
| `initialSafeAreaInsets` prop | `initialMetrics` prop |

---

## Performance Optimization Checklist

1. Use `initialWindowMetrics` on the root provider
2. Prefer `SafeAreaView` component over `useSafeAreaInsets` hook
3. Never place provider inside `Animated.View` or `ScrollView`
4. Add provider at modal/screen boundaries only when using native screens
5. Use `SafeAreaListener` when you need inset changes without re-renders

---

**Version:** 5.x (^5.6.2) | **Source:** https://appandflow.github.io/react-native-safe-area-context/
