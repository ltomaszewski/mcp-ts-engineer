# Components Reference -- Expo Router v7 (~55.0.7)

Navigation and layout components for building app structure: Stack, Tabs, Drawer, Link, Redirect, Slot, ErrorBoundary.

---

## Stack Component

Creates a native-style navigation stack (push/pop history).

### Stack.Screen Props

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Route file name (required) |
| `options` | `NativeStackNavigationOptions` | Screen configuration |
| `getId` | `function` | Custom ID for managing duplicate screens |
| `listeners` | `ScreenListeners` | Navigation event listeners |

### Common Screen Options

| Option | Type | Description |
|--------|------|-------------|
| `title` | `string` | Fallback for headerTitle |
| `headerShown` | `boolean` | Show/hide header (default: true) |
| `headerTitle` | `string \| function` | Header title text or component |
| `headerStyle` | `object` | Supports `backgroundColor` |
| `headerTintColor` | `string` | Back button and title color |
| `headerTitleStyle` | `object` | Title font styling |
| `headerTitleAlign` | `'left' \| 'center'` | Title alignment |
| `headerLeft` | `function` | Custom left component |
| `headerRight` | `function` | Custom right component |
| `headerBackVisible` | `boolean` | Show back button |
| `headerTransparent` | `boolean` | Float header over content |
| `headerBlurEffect` | `string` | iOS blur (extraLight, light, dark) |
| `headerSearchBarOptions` | `object` | iOS native search bar |
| `presentation` | `string` | Screen presentation mode |
| `animation` | `string` | Android transition animation |
| `gestureEnabled` | `boolean` | Swipe-to-dismiss (iOS, default: true) |
| `contentStyle` | `object` | Scene content styling |
| `freezeOnBlur` | `boolean` | Prevent re-renders when inactive |
| `statusBarStyle` | `string` | auto, inverted, dark, light |

### Presentation Modes

| Mode | Description |
|------|-------------|
| `card` | Standard card (default) |
| `modal` | Modal presentation |
| `transparentModal` | Transparent overlay |
| `containedModal` | Contained modal |
| `containedTransparentModal` | Transparent contained |
| `fullScreenModal` | Covers entire screen |
| `formSheet` | Sheet with configurable detents |

### Animation Options (Android)

`default`, `fade`, `fade_from_bottom`, `flip`, `simple_push`, `slide_from_bottom`, `slide_from_right`, `slide_from_left`, `none`

### Example

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0a7ea4' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: '600' },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="+not-found" options={{ title: 'Not Found' }} />
    </Stack>
  );
}
```

---

### Stack.Group

Groups screens with shared options without adding navigation structure.

```typescript
<Stack>
  <Stack.Group>
    <Stack.Screen name="home" />
    <Stack.Screen name="profile" />
  </Stack.Group>

  <Stack.Group screenOptions={{ presentation: 'modal' }}>
    <Stack.Screen name="settings-modal" />
    <Stack.Screen name="share-modal" />
  </Stack.Group>
</Stack>
```

---

### Stack.Protected

Conditionally show/hide screens based on a guard condition.

| Prop | Type | Description |
|------|------|-------------|
| `guard` | `boolean` | If true, enclosed content is accessible |

```typescript
import { Stack } from 'expo-router';
import { useAuth } from '../ctx/auth';

export default function RootLayout() {
  const { user } = useAuth();
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" />
      </Stack.Protected>
    </Stack>
  );
}
```

---

## Tabs Component

Creates bottom tab navigation.

### Tabs.Screen Options

| Option | Type | Description |
|--------|------|-------------|
| `title` | `string` | Screen title |
| `tabBarLabel` | `string \| function` | Tab label |
| `tabBarIcon` | `function` | Icon: `({ color, size, focused }) => ReactNode` |
| `tabBarBadge` | `string \| number` | Badge on tab |
| `tabBarButton` | `function` | Custom tab button component |
| `tabBarActiveTintColor` | `string` | Active tab color |

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0a7ea4',
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="compass" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarBadge: 3,
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account" color={color} size={size} />
          ),
        }}
      />
    </Tabs>
  );
}
```

---

## Drawer Component

Drawer navigation (slide-in side menu). Requires additional dependencies.

### Installation

```bash
npx expo install @react-navigation/drawer react-native-reanimated react-native-worklets
```

### Import

```typescript
import { Drawer } from 'expo-router/drawer';
```

### Example

```typescript
// app/_layout.tsx
import { Drawer } from 'expo-router/drawer';

export default function Layout() {
  return (
    <Drawer>
      <Drawer.Screen
        name="index"
        options={{ drawerLabel: 'Home', title: 'Home' }}
      />
      <Drawer.Screen
        name="settings"
        options={{ drawerLabel: 'Settings', title: 'Settings' }}
      />
    </Drawer>
  );
}
```

Open/close drawer programmatically:

```typescript
import { useNavigation } from 'expo-router';

const navigation = useNavigation();
navigation.openDrawer();
navigation.closeDrawer();
navigation.toggleDrawer();
```

---

## Link Component

Declarative navigation component. Renders as `<a>` on web, `Text` on native.

### Link Props

| Prop | Type | Description |
|------|------|-------------|
| `href` | `Href` | Route destination (required) |
| `asChild` | `boolean` | Forward props to first child |
| `push` | `boolean` | Always push (add to history) |
| `replace` | `boolean` | Replace current route |
| `dismissTo` | `boolean` | Dismiss to route |
| `prefetch` | `boolean` | Prefetch route when rendered |
| `onPress` | `function` | Custom press handler |
| `className` | `string` | CSS class (web) or NativeWind (native) |
| `relativeToDirectory` | `boolean` | Relative path resolution |
| `withAnchor` | `boolean` | Replace initial screen |

```typescript
import { Link } from 'expo-router';
import { Pressable, Text } from 'react-native';

// Basic
<Link href="/about">About</Link>

// With params
<Link href={{ pathname: '/users/[id]', params: { id: '123' } }}>
  View User
</Link>

// Custom child (asChild)
<Link href="/profile" asChild>
  <Pressable>
    <Text>Go to Profile</Text>
  </Pressable>
</Link>

// Always push
<Link push href="/feed">Feed</Link>

// Replace
<Link replace href="/home">Home</Link>
```

### Link.Menu (iOS Context Menu)

```typescript
<Link href="/post/123">
  <Link.Trigger>
    <Text>Open Post</Text>
  </Link.Trigger>
  <Link.Menu>
    <Link.MenuAction title="Save" onPress={() => savePost(123)} />
    <Link.MenuAction title="Share" onPress={() => sharePost(123)} />
  </Link.Menu>
</Link>
```

---

## Redirect Component

Navigate to a different route immediately when mounted.

| Prop | Type | Description |
|------|------|-------------|
| `href` | `Href` | Target route (required) |
| `relativeToDirectory` | `boolean` | Relative path resolution |
| `withAnchor` | `boolean` | Replace initial screen |

```typescript
import { Redirect } from 'expo-router';
import { useAuth } from './ctx/auth';

export default function AdminScreen() {
  const { user } = useAuth();
  if (user?.role !== 'admin') {
    return <Redirect href="/unauthorized" />;
  }
  return <Text>Admin Panel</Text>;
}
```

Auth redirect pattern:

```typescript
import { Redirect } from 'expo-router';
import { useAuth } from './ctx/auth';

export default function Index() {
  const { user, isLoading } = useAuth();
  if (isLoading) return <Text>Loading...</Text>;
  if (user) return <Redirect href="/home" />;
  return <Redirect href="/login" />;
}
```

---

## Slot Component

Renders the currently selected content. Use in `_layout` files for custom layouts without navigation chrome.

```typescript
// app/_layout.tsx
import { Slot } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RootLayout() {
  return (
    <SafeAreaView style={{ flex: 1 }}>
      <Slot />
    </SafeAreaView>
  );
}
```

Shared header pattern:

```typescript
import { Slot } from 'expo-router';
import { View, Text } from 'react-native';

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: '#0a7ea4', padding: 10 }}>
        <Text style={{ color: '#fff', fontSize: 18 }}>My App</Text>
      </View>
      <Slot />
    </View>
  );
}
```

---

## ErrorBoundary

Catches errors in route components and displays fallback UI. Export a named `ErrorBoundary` from any route file.

| Prop | Type | Description |
|------|------|-------------|
| `error` | `Error` | The thrown error |
| `retry` | `() => Promise<void>` | Function to retry rendering |

```typescript
// app/profile/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

export default function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  if (!id) throw new Error('User ID is required');
  return <Text>Profile: {id}</Text>;
}

export function ErrorBoundary({ error, retry }: { error: Error; retry: () => Promise<void> }) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>{error.message}</Text>
      <Pressable onPress={retry}>
        <Text style={{ color: '#0a7ea4', marginTop: 10 }}>Try Again</Text>
      </Pressable>
    </View>
  );
}
```

---

## Composition Patterns

### Layout with Tabs and Modals

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="settings-modal" />
        <Stack.Screen name="share-modal" />
      </Stack.Group>
    </Stack>
  );
}
```

### Nested Stack with Shared Header

```typescript
// app/(app)/_layout.tsx
import { Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: '#f5f5f5', padding: 10 }}>
        <Text style={{ fontSize: 14, color: '#666' }}>user@example.com</Text>
      </View>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen name="details" options={{ title: 'Details' }} />
      </Stack>
    </View>
  );
}
```

---

**Version:** v7 (~55.0.7, SDK 55) | **Source:** https://docs.expo.dev/versions/latest/sdk/router/
