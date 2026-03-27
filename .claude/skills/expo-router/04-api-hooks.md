# Hooks Reference -- Expo Router v7 (~55.0.7)

All navigation and state hooks with typed return values and practical examples.

---

## Parameter Extraction Hooks

### useLocalSearchParams()

Get search parameters for the currently focused route only. Updates only when this route is focused.

**Returns:** `RouteParams<T> & TParams` (Record of string keys to `string | string[]` values)

```typescript
// app/users/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function UserDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text>User ID: {id}</Text>
    </View>
  );
}
```

With multiple parameters:

```typescript
// URL: /products?category=electronics&sort=price&limit=10
const { category, sort, limit } = useLocalSearchParams<{
  category: string;
  sort: 'price' | 'rating';
  limit: string;
}>();

// All URL parameters are strings -- convert manually
const pageLimit = parseInt(limit, 10);
```

When to use:
- Working with dynamic route segments in a Stack
- Params should only update when THIS route is focused
- Most common hook for reading route params

---

### useGlobalSearchParams()

Get search parameters across the entire app, even when route is not focused. Re-renders on every URL change.

**Returns:** `RouteParams<T> & TParams`

```typescript
import { useGlobalSearchParams } from 'expo-router';

export default function AnalyticsTracker() {
  const { userId, campaignId } = useGlobalSearchParams<{
    userId?: string;
    campaignId?: string;
  }>();

  useEffect(() => {
    if (userId && campaignId) {
      Analytics.logCampaignImpression(userId, campaignId);
    }
  }, [userId, campaignId]);

  return null;
}
```

When to use:
- Background operations that need current URL params
- Analytics tracking across all routes
- Global state updates based on URL

**Difference from useLocalSearchParams:**

```typescript
// Stack: Home -> Profile -> Details
// In Home component (not focused):
const params1 = useLocalSearchParams();   // Does NOT update when Details changes
const params2 = useGlobalSearchParams();  // DOES update when Details changes
```

---

## Route State Hooks

### usePathname()

Get the current route path without search parameters.

**Returns:** `string`

```typescript
import { usePathname } from 'expo-router';
import { Text } from 'react-native';

export default function Header() {
  const pathname = usePathname();
  // URL: "/profile?theme=dark" -> pathname: "/profile"
  return <Text>Current: {pathname}</Text>;
}
```

Active tab indicator pattern:

```typescript
import { usePathname, Link } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

export default function TabBar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <View style={{ flexDirection: 'row' }}>
      <Link href="/home" asChild>
        <Pressable style={isActive('/home') && { backgroundColor: '#0a7ea4' }}>
          <Text>Home</Text>
        </Pressable>
      </Link>
      <Link href="/explore" asChild>
        <Pressable style={isActive('/explore') && { backgroundColor: '#0a7ea4' }}>
          <Text>Explore</Text>
        </Pressable>
      </Link>
    </View>
  );
}
```

---

### useSegments()

Get the route segments array (file path breakdown). Returns non-normalized segments.

**Returns:** `RouteSegments<T>` (default `string[]`)

```typescript
import { useSegments } from 'expo-router';

export default function Breadcrumbs() {
  const segments = useSegments();
  // URL: "/users/123" -> segments: ["users", "123"]
  return <Text>Path: /{segments.join('/')}</Text>;
}
```

With TypeScript narrowing:

```typescript
type RootSegments = ['home'] | ['users', '[id]'] | ['settings'];

const segments = useSegments<RootSegments>();

if (segments[0] === 'users' && segments[1]) {
  console.log('User ID:', segments[1]);
}
```

---

### useRootNavigationState()

Get the navigation state tree of the root navigator.

**Returns:** `Readonly<NavigationState | undefined>`

```typescript
import { useRootNavigationState } from 'expo-router';

export default function DebugInfo() {
  const state = useRootNavigationState();
  return (
    <View>
      <Text>Current Route: {state?.routes[state.index]?.name}</Text>
      <Text>Total Screens: {state?.routes.length}</Text>
    </View>
  );
}
```

Use case: advanced routing logic, debugging navigation state.

---

### useRootNavigation()

Access the root navigation container reference.

**Returns:** `null | NavigationContainerRef<RootParamList>`

Returns `null` until navigation is ready. Use `useNavigationContainerRef()` for a ref-based approach instead.

---

## Focus and Lifecycle Hooks

### useFocusEffect(effect)

Run side effects when a route gains or loses focus. Similar to `useEffect` but tied to route focus state.

| Parameter | Type | Description |
|-----------|------|-------------|
| `effect` | `EffectCallback` | Function to run on focus; optionally returns cleanup |

**Returns:** `void`

**IMPORTANT:** Always wrap the effect in `useCallback` to prevent infinite loops.

```typescript
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View, FlatList } from 'react-native';

export default function Messages() {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(false);

  useFocusEffect(
    useCallback(() => {
      // Runs when route is focused
      const fetchMessages = async () => {
        setLoading(true);
        const data = await getMessages();
        setMessages(data);
        setLoading(false);
      };
      fetchMessages();

      // Cleanup runs on unfocus
      return () => {
        console.log('Messages route unfocused');
      };
    }, [])
  );

  return (
    <View>
      <Text>Messages {loading && '(Loading...)'}</Text>
      <FlatList
        data={messages}
        renderItem={({ item }) => <Text>{item.text}</Text>}
      />
    </View>
  );
}
```

Timer example:

```typescript
useFocusEffect(
  useCallback(() => {
    const interval = setInterval(() => {
      setSeconds((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [])
);
```

---

## Navigation Control Hooks

### useNavigation(parent?)

Access the parent layout's navigation object for layout-specific methods.

| Parameter | Type | Description |
|-----------|------|-------------|
| `parent` | `string \| HrefObject` | Optional path to specific parent layout |

**Returns:** React Navigation navigation object with layout-specific methods.

```typescript
import { useNavigation } from 'expo-router';

export default function NestedRoute() {
  const navigation = useNavigation();
  return (
    <Pressable onPress={() => navigation.openDrawer()}>
      <Text>Open Drawer</Text>
    </Pressable>
  );
}
```

Accessing specific parent layout:

```typescript
const rootNavigation = useNavigation('/');
const ordersNavigation = useNavigation('/orders');
```

---

### useNavigationContainerRef()

Get the root navigation container ref.

**Returns:** `NavigationContainerRefWithCurrent<RootParamList>`

```typescript
import { useNavigationContainerRef } from 'expo-router';

export default function App() {
  const navigationRef = useNavigationContainerRef();
  useEffect(() => {
    if (navigationRef.current) {
      console.log('Navigation ready');
    }
  }, [navigationRef]);
  return null;
}
```

---

## Common Mistakes and Solutions

### Infinite loop in useFocusEffect

```typescript
// BAD -- direct function causes infinite reruns
useFocusEffect(() => {
  fetchData();
});

// GOOD -- wrap in useCallback
useFocusEffect(
  useCallback(() => {
    fetchData();
  }, [])
);
```

### Parameters are always strings

```typescript
// BAD -- TypeScript may say number but runtime value is string
const { count } = useLocalSearchParams<{ count: number }>();
const total = count + 5;  // "5" + 5 = "55" (string concatenation!)

// GOOD -- parse explicitly
const params = useLocalSearchParams<{ count: string }>();
const count = parseInt(params.count, 10);
const total = count + 5;  // 10 (correct math)
```

### Local vs. Global confusion

```typescript
// Use LOCAL for route-specific params (most cases)
const { id } = useLocalSearchParams<{ id: string }>();

// Use GLOBAL only when you need params from unfocused routes
const { userId } = useGlobalSearchParams<{ userId?: string }>();
```

---

## Hook Combinations Pattern

### Route-Specific Header

```typescript
import { usePathname, useLocalSearchParams } from 'expo-router';

export default function DynamicHeader() {
  const pathname = usePathname();
  const params = useLocalSearchParams<{ title?: string }>();

  const getTitle = () => {
    if (pathname === '/home') return 'Home';
    if (pathname === '/search') return params.title || 'Search';
    if (pathname.startsWith('/users/')) return 'User Profile';
    return 'App';
  };

  return <Text style={{ fontSize: 18, fontWeight: 'bold' }}>{getTitle()}</Text>;
}
```

---

**Version:** v7 (~55.0.7, SDK 55) | **Source:** https://docs.expo.dev/versions/latest/sdk/router/
