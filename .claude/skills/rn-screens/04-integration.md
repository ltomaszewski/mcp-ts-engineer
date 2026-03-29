# Integration & Performance

Expo Router integration, React Navigation usage, performance optimization, and common patterns.

---

## Expo Router Integration

Expo Router uses react-native-screens under the hood for its `Stack` navigator. Screen options map directly to react-native-screens props.

### Stack Navigator

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
        animation: 'slide_from_right',
        gestureEnabled: true,
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="details" options={{ title: 'Details' }} />
      <Stack.Screen
        name="modal"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
    </Stack>
  );
}
```

### FormSheet Modal in Expo Router

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="settings-sheet"
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: [0.5, 1.0],
          sheetCornerRadius: 20,
          sheetGrabberVisible: true,
          sheetLargestUndimmedDetentIndex: 0,
          headerShown: false,
        }}
      />
    </Stack>
  );
}
```

```typescript
// app/settings-sheet.tsx
import { View, Text, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function SettingsSheet() {
  return (
    <View style={styles.container}>
      <View style={styles.handle} />
      <Text style={styles.title}>Settings</Text>
      <Pressable onPress={() => router.back()}>
        <Text>Close</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#ccc',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 20,
  },
  title: { fontSize: 24, fontWeight: 'bold' },
});
```

### Native Search Bar in Expo Router

```typescript
// app/search.tsx
import { Stack } from 'expo-router';
import { useState, useCallback } from 'react';
import { FlatList, Text, View, StyleSheet } from 'react-native';

const DATA = ['Apple', 'Banana', 'Cherry', 'Date', 'Elderberry'];

export default function SearchScreen() {
  const [query, setQuery] = useState('');
  const filtered = DATA.filter((item) =>
    item.toLowerCase().includes(query.toLowerCase())
  );

  const handleSearch = useCallback((e: { nativeEvent: { text: string } }) => {
    setQuery(e.nativeEvent.text);
  }, []);

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Search',
          headerSearchBarOptions: {
            placeholder: 'Search fruits...',
            onChangeText: handleSearch,
            autoCapitalize: 'none',
            hideWhenScrolling: false,
          },
        }}
      />
      <FlatList
        data={filtered}
        keyExtractor={(item) => item}
        contentInsetAdjustmentBehavior="automatic"
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text>{item}</Text>
          </View>
        )}
      />
    </>
  );
}

const styles = StyleSheet.create({
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
});
```

### Preventing Back Navigation

```typescript
// app/checkout.tsx
import { Stack, router } from 'expo-router';
import { Alert } from 'react-native';

export default function CheckoutScreen() {
  return (
    <>
      <Stack.Screen
        options={{
          gestureEnabled: false,
          headerBackVisible: false,
          presentation: 'formSheet',
          preventNativeDismiss: true,
        }}
        listeners={{
          beforeRemove: (e) => {
            e.preventDefault();
            Alert.alert(
              'Cancel Checkout?',
              'Your cart will be preserved.',
              [
                { text: 'Stay', style: 'cancel' },
                {
                  text: 'Leave',
                  style: 'destructive',
                  onPress: () => router.back(),
                },
              ]
            );
          },
        }}
      />
      {/* Checkout form */}
    </>
  );
}
```

### Screen Option to react-native-screens Prop Mapping

| Expo Router / React Nav Option | react-native-screens Prop | Notes |
|-------------------------------|--------------------------|-------|
| `animation` | `stackAnimation` | Animation type |
| `animationDuration` | `transitionDuration` | iOS only, ms |
| `presentation` | `stackPresentation` | push/modal/formSheet |
| `gestureEnabled` | `gestureEnabled` | iOS back swipe |
| `fullScreenGestureEnabled` | `fullScreenSwipeEnabled` | iOS full swipe |
| `gestureResponseDistance` | `gestureResponseDistance` | Edge distance |
| `headerShown` | `ScreenStackHeaderConfig.hidden` (inverted) | Show/hide header |
| `headerLargeTitle` | `largeTitle` | iOS large title |
| `headerTranslucent` | `translucent` | Translucent header |
| `headerBlurEffect` | `blurEffect` | iOS blur |
| `headerSearchBarOptions` | `SearchBar` props | Native search |
| `freezeOnBlur` | `freezeOnBlur` | Freeze inactive |
| `orientation` | `screenOrientation` | Lock orientation |
| `statusBarStyle` | `statusBarStyle` | Status bar color |
| `statusBarHidden` | `statusBarHidden` | Hide status bar |
| `statusBarAnimation` | `statusBarAnimation` | Status bar anim |
| `sheetAllowedDetents` | `sheetAllowedDetents` | FormSheet stops |
| `sheetCornerRadius` | `sheetCornerRadius` | Sheet corners |
| `sheetGrabberVisible` | `sheetGrabberVisible` | Sheet grabber |
| `sheetLargestUndimmedDetentIndex` | `sheetLargestUndimmedDetentIndex` | Dimming control |
| `preventNativeDismiss` | `preventNativeDismiss` | Block dismiss |

---

## React Navigation Integration

react-native-screens v4 supports `@react-navigation/native-stack` v7.

### Setup

```typescript
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { enableScreens } from 'react-native-screens';

enableScreens(true);

const Stack = createNativeStackNavigator();

function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          animation: 'slide_from_right',
          gestureEnabled: true,
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} />
        <Stack.Screen
          name="Details"
          component={DetailsScreen}
          options={{
            animation: 'fade',
            headerLargeTitle: true,
          }}
        />
        <Stack.Screen
          name="Modal"
          component={ModalScreen}
          options={{
            presentation: 'modal',
            sheetAllowedDetents: [0.5, 1.0],
            sheetCornerRadius: 20,
          }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
```

### Native Stack vs JS Stack

| Feature | Native Stack (react-native-screens) | JS Stack (@react-navigation/stack) |
|---------|-------------------------------------|-------------------------------------|
| Performance | Native transitions, 60fps | JS-driven, may drop frames |
| Memory | Inactive screens detached | All screens in memory |
| Header | Native header component | JS-rendered header |
| Gestures | Native gesture recognizers | JS-based gesture handling |
| Customization | Limited to native options | Fully customizable |
| Modal support | Native modal presentation | JS overlay |
| Search bar | Native UISearchController | Custom implementation |
| Large titles | Native iOS large titles | Custom implementation |

### When to Use JS Stack Instead

- Need fully custom transition animations not available in native stack
- Need custom header with complex React components
- Need to render content behind the header with full control
- Need shared element transitions (use Reanimated Shared Transitions instead)

---

## Performance Optimization

### 1. Enable Native Screens

The primary performance benefit. Native containers manage screen lifecycle at the OS level:

```typescript
import { enableScreens } from 'react-native-screens';
enableScreens(true); // Default in React Navigation v6+
```

**Impact:**
- Inactive screens are detached from the native view hierarchy
- OS manages memory for off-screen content
- Native transition animations at consistent 60/120fps

### 2. Freeze Inactive Screens

Prevent React re-renders on inactive screens:

```typescript
// Global (use with caution)
import { enableFreeze } from 'react-native-screens';
enableFreeze(true);

// Per-screen (recommended)
<Stack.Screen options={{ freezeOnBlur: true }} />
```

**Impact:**
- Frozen screens skip React reconciliation entirely
- State is preserved (scroll position, input values)
- Reduces JS thread work during navigation

### 3. Optimize Heavy Screens

```typescript
import { useIsFocused } from '@react-navigation/native';

function HeavyScreen() {
  const isFocused = useIsFocused();

  return (
    <View style={{ flex: 1 }}>
      {/* Only render expensive content when focused */}
      {isFocused && <ExpensiveChart data={chartData} />}

      {/* Lightweight placeholder when not focused */}
      {!isFocused && <View style={styles.placeholder} />}
    </View>
  );
}
```

### 4. Minimize Header Re-renders

Native headers are efficient, but custom header components can cause unnecessary re-renders:

```typescript
// BAD: Inline function creates new reference each render
<Stack.Screen
  options={{
    headerRight: () => <Button onPress={handleSave} />, // New function each render
  }}
/>

// GOOD: Stable callback reference
const headerRight = useCallback(
  () => <Button onPress={handleSave} />,
  [handleSave]
);

<Stack.Screen options={{ headerRight }} />
```

### 5. Use contentInsetAdjustmentBehavior

Prevents layout jumps with translucent headers:

```typescript
<ScrollView contentInsetAdjustmentBehavior="automatic">
  {/* Content properly insets below header */}
</ScrollView>

// Or with FlatList
<FlatList
  contentInsetAdjustmentBehavior="automatic"
  data={items}
  renderItem={renderItem}
/>
```

---

## Common Patterns

### Transparent Modal Overlay

```typescript
// app/_layout.tsx
<Stack.Screen
  name="overlay"
  options={{
    presentation: 'transparentModal',
    animation: 'fade',
    headerShown: false,
    contentStyle: { backgroundColor: 'transparent' },
  }}
/>

// app/overlay.tsx
import { View, Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

export default function OverlayScreen() {
  return (
    <View style={styles.container}>
      <Pressable style={styles.backdrop} onPress={() => router.back()} />
      <View style={styles.content}>
        {/* Overlay content */}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  content: {
    width: '80%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
  },
});
```

### Full-Window Toast with FullWindowOverlay

```typescript
import { FullWindowOverlay } from 'react-native-screens';
import { View, Text, StyleSheet, Platform } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';

function Toast({ message, visible }: { message: string; visible: boolean }) {
  if (!visible) return null;

  const content = (
    <Animated.View
      entering={FadeIn.duration(200)}
      exiting={FadeOut.duration(200)}
      style={styles.toast}
    >
      <Text style={styles.toastText}>{message}</Text>
    </Animated.View>
  );

  // FullWindowOverlay is iOS only
  if (Platform.OS === 'ios') {
    return <FullWindowOverlay>{content}</FullWindowOverlay>;
  }

  // On Android, render at root level instead
  return content;
}

const styles = StyleSheet.create({
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    backgroundColor: '#333',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  toastText: { color: '#fff', fontSize: 14 },
});
```

### Conditional Header Configuration

```typescript
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function Layout() {
  return (
    <Stack
      screenOptions={{
        headerLargeTitle: Platform.OS === 'ios',
        animation: Platform.select({
          ios: 'default',
          android: 'slide_from_right',
        }),
        headerBlurEffect: Platform.OS === 'ios' ? 'regular' : undefined,
        headerTranslucent: Platform.OS === 'ios',
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Home' }} />
    </Stack>
  );
}
```

### Multi-Detent Sheet with Dynamic Content

```typescript
import { Stack } from 'expo-router';
import { View, Text, Pressable, StyleSheet, useWindowDimensions } from 'react-native';
import { useState } from 'react';

export default function DynamicSheet() {
  const [expanded, setExpanded] = useState(false);

  return (
    <>
      <Stack.Screen
        options={{
          presentation: 'formSheet',
          sheetAllowedDetents: expanded ? [1.0] : [0.3, 0.6, 1.0],
          sheetInitialDetentIndex: 0,
          sheetCornerRadius: 24,
          sheetGrabberVisible: true,
          sheetExpandsWhenScrolledToEdge: true,
          headerShown: false,
        }}
      />
      <View style={styles.container}>
        <Text style={styles.title}>Sheet Content</Text>
        <Pressable
          style={styles.button}
          onPress={() => setExpanded(!expanded)}
        >
          <Text>{expanded ? 'Allow resize' : 'Lock full screen'}</Text>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  button: { padding: 12, backgroundColor: '#007AFF', borderRadius: 8 },
});
```

---

## Custom Go-Back Gesture

Configure custom swipe directions for dismissal:

```typescript
// Swipe down to dismiss (useful for media viewers)
<Stack.Screen
  options={{
    gestureEnabled: true,
    goBackGesture: 'swipeDown',
  }}
/>

// Two-dimensional swipe (any direction dismisses)
<Stack.Screen
  options={{
    gestureEnabled: true,
    goBackGesture: 'twoDimensionalSwipe',
    screenEdgeGesture: false, // Allow gesture anywhere, not just edges
  }}
/>
```

### GoBackGesture Values

| Value | Direction | Use Case |
|-------|-----------|----------|
| `swipeRight` | Left to right | Standard back (default) |
| `swipeLeft` | Right to left | RTL layouts |
| `swipeUp` | Bottom to top | Dismiss upward |
| `swipeDown` | Top to bottom | Dismiss media/modals |
| `verticalSwipe` | Up or down | Flexible vertical dismiss |
| `horizontalSwipe` | Left or right | Flexible horizontal dismiss |
| `twoDimensionalSwipe` | Any direction | Gallery/media viewers |

---

## Library Author Guide

For building custom navigation libraries on react-native-screens primitives, see the official guide:
https://github.com/software-mansion/react-native-screens/blob/main/guides/GUIDE_FOR_LIBRARY_AUTHORS.md

Key principles:
- Use `ScreenContainer` for tab-style navigators (one active screen at a time)
- Use `ScreenStack` for stack-style navigators (last child is active)
- Always use `ScreenStackItem` instead of raw `Screen` inside `ScreenStack`
- Manage `activityState` to control screen visibility and interactivity
- Handle `onDismissed` to sync JS navigation state with native dismissals

---

**Source:** https://github.com/software-mansion/react-native-screens | **Version:** 4.x (^4.23.0)
