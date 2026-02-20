# Components Reference — Expo Router 6.0.19

Navigation and layout components for building app structure.

**Module Summary:** Stack, Tabs, Link, Redirect, Slot, and ErrorBoundary components with full props documentation and composition patterns.

**🔗 Cross-References:**
- Imperative navigation → `03-api-navigation.md`
- Hooks for state → `04-api-hooks.md`
- Routing fundamentals → `02-routing-basics.md`
- Authentication → `06-auth-protected-routes.md`

---

## Stack Component

The Stack component creates a native-style navigation stack (like browser history).

**Signature:**

```typescript
<Stack screenOptions={screenOptions}>
  <Stack.Screen name="routeName" options={screenOptions} />
  <Stack.Protected guard={boolean}>
    {/* Protected content */}
  </Stack.Protected>
</Stack>
```

### Stack.Screen

Defines a single screen in the stack.

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `name` | `string` | Route file name (required) |
| `options` | `StackScreenOptions` | Screen configuration |
| `listeners` | `ScreenListeners` | Navigation event listeners |

**Common Options:**

```typescript
<Stack.Screen
  name="profile"
  options={{
    title: 'User Profile',                    // Header title
    headerShown: true,                        // Show header
    headerBackVisible: true,                  // Show back button
    headerStyle: { backgroundColor: '#f4511e' },
    headerTintColor: '#fff',
    headerTitleStyle: { fontWeight: 'bold' },
    presentation: 'card' | 'modal' | 'transparentModal',
    gestureEnabled: true,
  }}
/>
```

**Example:**

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0a7ea4',
        },
        headerTintColor: '#fff',
        headerTitleStyle: {
          fontWeight: '600',
        },
      }}
    >
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
      <Stack.Screen name="[...]" options={{ title: 'Not Found' }} />
    </Stack>
  );
}
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#stack

---

### Stack.Group

Groups screens with shared options without adding navigation structure.

**Example: Modal Presentation**

```typescript
<Stack>
  {/* Regular screens */}
  <Stack.Group>
    <Stack.Screen name="home" />
    <Stack.Screen name="profile" />
  </Stack.Group>

  {/* Modal group */}
  <Stack.Group screenOptions={{ presentation: 'modal' }}>
    <Stack.Screen name="settings-modal" options={{ title: 'Settings' }} />
    <Stack.Screen name="share-modal" options={{ title: 'Share' }} />
  </Stack.Group>
</Stack>
```

---

### Stack.Protected

Conditionally shows or hides screens based on a guard condition (SDK 53+).

**Props:**

| Prop | Type | Description |
|------|------|-------------|
| `guard` | `boolean` | If true, content is accessible |
| `children` | `ReactNode` | Routes to protect |

**Example: Authentication Guard**

```typescript
<Stack>
  <Stack.Protected guard={!isLoggedIn}>
    {/* Show login if NOT logged in */}
    <Stack.Screen name="(auth)/login" />
  </Stack.Protected>

  <Stack.Protected guard={isLoggedIn}>
    {/* Show app if logged in */}
    <Stack.Screen name="(app)/home" />
  </Stack.Protected>
</Stack>
```

**Official Source:** https://docs.expo.dev/router/basics/common-navigation-patterns/

---

## Tabs Component

Creates a bottom tab navigation.

**Signature:**

```typescript
<Tabs screenOptions={screenOptions}>
  <Tabs.Screen name="routeName" options={screenOptions} />
</Tabs>
```

### Basic Tabs Example

```typescript
// app/(app)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { MaterialBottomTabNavigationOptions } from '@react-navigation/material-bottom-tabs';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#0a7ea4',
      }}
    >
      <Tabs.Screen
        name="home"
        options={{
          title: 'Home',
          tabBarLabel: 'Home',
          tabBarIcon: ({ color }) => <HomeIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarLabel: 'Explore',
          tabBarIcon: ({ color }) => <ExploreIcon color={color} />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarLabel: 'Profile',
          tabBarIcon: ({ color }) => <ProfileIcon color={color} />,
        }}
      />
    </Tabs>
  );
}
```

### Tabs.Screen Options

| Prop | Type | Description |
|------|------|-------------|
| `title` | `string` | Screen title |
| `tabBarLabel` | `string \| function` | Tab label text |
| `tabBarIcon` | `function` | Icon component (receives `color`, `size`, `focused`) |
| `tabBarBadge` | `string \| number` | Badge number/text |
| `tabBarButton` | `function` | Custom tab button |

**Custom Tab Icon:**

```typescript
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

<Tabs.Screen
  name="home"
  options={{
    tabBarIcon: ({ color, size }) => (
      <MaterialCommunityIcons name="home" color={color} size={size} />
    ),
  }}
/>
```

**Badge Example:**

```typescript
<Tabs.Screen
  name="messages"
  options={{
    tabBarBadge: 3,  // Shows "3" on tab
  }}
/>
```

---

### Conditional Tabs (Protected)

```typescript
// app/(app)/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import { useAuth } from '../../../ctx/auth';

export default function TabsLayout() {
  const { user } = useAuth();
  const isAdmin = user?.role === 'admin';

  return (
    <Tabs>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      
      {/* Only show admin tab if user is admin */}
      <Tabs.Protected guard={isAdmin}>
        <Tabs.Screen name="admin" options={{ title: 'Admin' }} />
      </Tabs.Protected>
      
      <Tabs.Screen name="profile" options={{ title: 'Profile' }} />
    </Tabs>
  );
}
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#tabs

---

## Link Component

Navigation component that wraps children and handles navigation on press.

**Signature:**

```typescript
<Link href={href} asChild={false} {...props}>
  {children}
</Link>
```

### Link Props

| Prop | Type | Description |
|------|------|-------------|
| `href` | `string \| HrefObject` | Route destination |
| `asChild` | `boolean` | Forward props to child component |
| `push` | `boolean` | Always push (add to history) |
| `replace` | `boolean` | Replace current route |
| `dismissTo` | `string` | Dismiss to route |
| `onPress` | `function` | Custom press handler |
| `prefetch` | `boolean` | Prefetch on mount |

### Basic Usage

```typescript
import { Link } from 'expo-router';
import { Text } from 'react-native';

export default function Home() {
  return (
    <Link href="/about">
      <Text>Go to About</Text>
    </Link>
  );
}
```

### With Parameters

```typescript
<Link
  href={{
    pathname: '/users/[id]',
    params: { id: '123' },
  }}
>
  <Text>View User 123</Text>
</Link>
```

### Custom Child Component (asChild)

```typescript
import { Link } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function Home() {
  return (
    <Link href="/profile" asChild>
      <Pressable>
        <Text>Go to Profile</Text>
      </Pressable>
    </Link>
  );
}
```

**Benefits of asChild:**
- ✅ Access Pressable props (onLongPress, onPressIn, etc.)
- ✅ Custom styling on Pressable directly
- ✅ No nested Text required

### Push vs Navigate

```typescript
// Always add to history—can go back multiple times
<Link push href="/feed">
  <Text>View Feed</Text>
</Link>

// Replace current—no back to here
<Link replace href="/home">
  <Text>Go Home</Text>
</Link>
```

### Link.Menu (iOS Only)

Context menu on long-press.

```typescript
<Link href="/post/123">
  <Link.Trigger>
    <Text>Open Post</Text>
  </Link.Trigger>
  
  <Link.Menu>
    <Link.MenuAction title="Save" onPress={() => savePost(123)} />
    <Link.MenuAction title="Share" onPress={() => sharePost(123)} />
    <Link.MenuAction title="Copy Link" onPress={() => copyLink()} />
  </Link.Menu>
</Link>
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#link

---

## Redirect Component

Immediately navigate to a different route when mounted.

**Signature:**

```typescript
<Redirect href={href} />
```

### Basic Usage

```typescript
// app/admin.tsx - Redirect if not admin
import { Redirect } from 'expo-router';
import { useAuth } from './ctx/auth';

export default function AdminScreen() {
  const { user } = useAuth();

  if (user?.role !== 'admin') {
    return <Redirect href="/unauthorized" />;
  }

  return (/* Admin UI */);
}
```

### Redirect on Auth State Change

```typescript
// app/index.tsx - Splash/Router screen
import { Redirect } from 'expo-router';
import { useAuth } from './ctx/auth';
import { Text, View } from 'react-native';

export default function Index() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center' }}>
        <Text>Loading...</Text>
      </View>
    );
  }

  if (user) {
    return <Redirect href="/home" />;
  }

  return <Redirect href="/login" />;
}
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#redirect

---

## Slot Component

Renders the current route without a Navigator wrapper.

**Use Cases:**
- Root layout to render child routes
- Shared layout for multiple route groups
- Layout composition

### Basic Usage

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

### Shared Header with Slot

```typescript
// app/(app)/_layout.tsx
import { Slot } from 'expo-router';
import { View, Text } from 'react-native';

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      {/* Shared header */}
      <View style={{ backgroundColor: '#0a7ea4', padding: 10 }}>
        <Text style={{ color: '#fff', fontSize: 18, fontWeight: 'bold' }}>
          My App
        </Text>
      </View>
      
      {/* Route content */}
      <Slot />
    </View>
  );
}
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#slot

---

## ErrorBoundary Component

Catches errors in route components and displays fallback UI.

**Signature:**

```typescript
export function ErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <View>
      <Text>Error: {props.error.message}</Text>
      <Button onPress={props.retry} title="Retry" />
    </View>
  );
}
```

### ErrorBoundaryProps

| Prop | Type | Description |
|------|------|-------------|
| `error` | `Error` | The thrown error |
| `retry` | `() => Promise<void>` | Function to retry |

### Example: Route Error Boundary

```typescript
// app/profile/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

export default function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  
  if (!id) {
    throw new Error('User ID is required');
  }

  return <Text>Profile: {id}</Text>;
}

export function ErrorBoundary(props: ErrorBoundaryProps) {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 16, marginBottom: 10 }}>
        {props.error.message}
      </Text>
      <Pressable onPress={props.retry} style={{ backgroundColor: '#0a7ea4' }}>
        <Text style={{ color: '#fff', padding: 10 }}>Try Again</Text>
      </Pressable>
    </View>
  );
}
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/

---

## Component Composition Patterns

### Pattern 1: Layout with Tabs and Modals

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Group screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack.Group>

      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="settings-modal" />
        <Stack.Screen name="share-modal" />
      </Stack.Group>

      <Stack.Group>
        <Stack.Screen name="[...]" />
      </Stack.Group>
    </Stack>
  );
}
```

---

### Pattern 2: Auth Conditional Navigation

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';
import { useAuth } from './ctx/auth';

export default function RootLayout() {
  const { user } = useAuth();

  return (
    <Stack>
      <Stack.Protected guard={!user}>
        <Stack.Screen name="(auth)" options={{ headerShown: false }} />
      </Stack.Protected>

      <Stack.Protected guard={!!user}>
        <Stack.Screen name="(app)" options={{ headerShown: false }} />
      </Stack.Protected>
    </Stack>
  );
}
```

---

### Pattern 3: Nested Layouts with Shared Header

```typescript
// app/(app)/_layout.tsx
import { Stack } from 'expo-router';
import { View, Text } from 'react-native';

export default function AppLayout() {
  return (
    <View style={{ flex: 1 }}>
      <View style={{ backgroundColor: '#f5f5f5', padding: 10 }}>
        <Text style={{ fontSize: 14, color: '#666' }}>
          Connected as: user@example.com
        </Text>
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

## Best Practices

### ✅ DO:

- ✅ Use **Link** for simple navigation (better for web)
- ✅ Use **useRouter()** for conditional logic
- ✅ Protect routes with **Stack.Protected**
- ✅ Use **ErrorBoundary** on error-prone routes
- ✅ Organize with **route groups** and **layouts**
- ✅ Use **asChild** on Link for custom styling

### ❌ DON'T:

- ❌ Nest multiple Stack navigators deeply
- ❌ Use Redirect in every route (performance)
- ❌ Forget ErrorBoundary on dynamic routes
- ❌ Mix imperative and declarative navigation unnecessarily

---

## Troubleshooting

### Issue: Link not navigating

**Check:**
- ✅ `href` points to existing route
- ✅ Route file exists in `app/` directory
- ✅ Link not wrapped in another navigation component

---

### Issue: Tab bar not showing

**Verify:**
- ✅ Using `<Tabs>` component
- ✅ Screen names match route files
- ✅ `screenOptions={{ headerShown: false }}` if needed

---

## Key Takeaways

- 📚 **Stack** = Native back-button navigation (Android, iOS)
- 📑 **Tabs** = Bottom or top navigation
- 🔗 **Link** = Safe, web-friendly navigation
- ↪️ **Redirect** = Conditional navigation on mount
- 📍 **Slot** = Render current route
- 🛡️ **Protected** = Guard routes with conditions
- ⚠️ **ErrorBoundary** = Catch route errors

---

**Next Module:** `06-auth-protected-routes.md` — Authentication and route protection

**Source Documentation:** https://docs.expo.dev/versions/latest/sdk/router/
