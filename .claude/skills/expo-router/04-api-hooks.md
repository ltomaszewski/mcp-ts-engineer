# Hooks Reference — Expo Router 6.0.19

All navigation and state hooks with typed return values and practical examples.

**Module Summary:** Hook functions for accessing route parameters, pathname, focus events, and navigation state.

**🔗 Cross-References:**
- Imperative navigation → `03-api-navigation.md`
- Components and Slot → `05-api-components.md`
- Routing fundamentals → `02-routing-basics.md`

---

## Parameter Extraction Hooks

### useLocalSearchParams()

Get search parameters for the **currently focused route** only.

**Signature:**

```typescript
function useLocalSearchParams<T = UnknownOutputParams>(): T extends AllRoutes
  ? SearchParams<T>
  : T;
```

**Return Type:**

```typescript
Record<string, string | string[]>
```

(All parameters are strings because they come from URLs)

**When to Use:**
- ✅ You're in a Stack and need local params
- ✅ Params should only update when THIS route is focused
- ✅ Working with dynamic route segments

**Example:**

```typescript
// app/users/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function UserDetail() {
  // TypeScript is smart about route params
  const { id } = useLocalSearchParams<{ id: string }>();
  
  return (
    <View>
      <Text>User ID: {id}</Text>
    </View>
  );
}
```

**With Multiple Parameters:**

```typescript
// URL: /products?category=electronics&sort=price&limit=10
const { category, sort, limit } = useLocalSearchParams<{
  category: string;
  sort: 'price' | 'rating';
  limit: string;
}>();

// Convert to appropriate type when needed
const pageLimit = parseInt(limit, 10);
```

**Example with Dynamic Segment:**

```typescript
// app/feed/[[filter]].tsx - Optional segment
const { filter } = useLocalSearchParams<{ filter?: string }>();

const feedData = filter === 'trending'
  ? getTrendingPosts()
  : getAllPosts();
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#uselocalsearchparams

---

### useGlobalSearchParams()

Get search parameters for the **entire app**, even when route is not focused.

**Signature:**

```typescript
function useGlobalSearchParams<T = UnknownOutputParams>(): T extends AllRoutes
  ? SearchParams<T>
  : T;
```

**Return Type:**

```typescript
Record<string, string | string[]>
```

**When to Use:**
- ✅ Route is not focused but you need current params (background operations)
- ✅ Analytics tracking with current route info
- ✅ Global state updates based on URL
- ✅ Cross-route parameter sharing

**Difference Example:**

```typescript
// Stack: Home → Profile → Details

// In Details component (focused route):
const params1 = useLocalSearchParams();   // Only updates for Details
const params2 = useGlobalSearchParams();  // Updates even if Details not focused

// If user navigates away and back:
// useLocalSearchParams resets
// useGlobalSearchParams preserves values
```

**Example: Background Analytics**

```typescript
import { useGlobalSearchParams } from 'expo-router';
import { useEffect } from 'react';
import * as Analytics from './services/analytics';

export default function AnalyticsTracker() {
  const { userId, campaignId } = useGlobalSearchParams<{
    userId?: string;
    campaignId?: string;
  }>();

  useEffect(() => {
    if (userId && campaignId) {
      // Track even if this component is not visible
      Analytics.logCampaignImpression(userId, campaignId);
    }
  }, [userId, campaignId]);

  return null;
}
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#useglobalsearchparams

---

## Route State Hooks

### usePathname()

Get the current route path **without search parameters**.

**Signature:**

```typescript
function usePathname(): string
```

**Return Type:**

```typescript
string  // e.g., "/users/123", "/profile"
```

**Example:**

```typescript
import { usePathname } from 'expo-router';
import { Text } from 'react-native';

export default function Header() {
  const pathname = usePathname();

  return <Text>Current Page: {pathname}</Text>;
  // If URL is "/profile?theme=dark"
  // Shows: "Current Page: /profile"
}
```

**Practical Use: Active Tab Indicator**

```typescript
import { usePathname } from 'expo-router';
import { View, Text, Pressable } from 'react-native';
import { Link } from 'expo-router';

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

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#usepathname

---

### useSegments()

Get the route segments array (file path breakdown).

**Signature:**

```typescript
function useSegments<T = string[]>(): T
```

**Return Type:**

```typescript
string[]  // e.g., ["users", "[id]"], ["feed"]
```

**Example:**

```typescript
import { useSegments } from 'expo-router';
import { Text } from 'react-native';

export default function BreadcrumbNav() {
  const segments = useSegments();

  return (
    <Text>
      Path: /{segments.join('/')}
    </Text>
    // If URL is "/users/123"
    // Shows: "Path: /users/123"
  );
}
```

**With TypeScript:**

```typescript
type RootSegments = ['home'] | ['users', '[id]'] | ['settings'];

const segments = useSegments<RootSegments>();

// TypeScript knows segments is one of the three tuples above
if (segments[0] === 'users' && segments[1]) {
  console.log('User ID:', segments[1]);
}
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#usesegments

---

### useRootNavigationState()

Get the navigation state tree of the root navigator.

**Signature:**

```typescript
function useRootNavigationState(): Readonly<NavigationState | undefined>
```

**Return Type:**

```typescript
{
  index: number;
  routes: Array<{
    key: string;
    name: string;
    params?: any;
  }>;
  type: 'stack' | 'tab' | 'drawer';
  // ... additional properties
}
```

**Use Case:** Accessing raw navigation state for advanced routing logic.

**Example:**

```typescript
import { useRootNavigationState } from 'expo-router';
import { Text, View } from 'react-native';

export default function NavigationDebugger() {
  const state = useRootNavigationState();

  return (
    <View>
      <Text>Current Route: {state?.routes[state.index]?.name}</Text>
      <Text>Total Screens: {state?.routes.length}</Text>
    </View>
  );
}
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#userootnavigationstate

---

## Focus & Lifecycle Hooks

### useFocusEffect()

Run side effects when a route is focused/unfocused.

**Signature:**

```typescript
function useFocusEffect(
  effect: EffectCallback,
  deps?: DependencyList
): void
```

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `effect` | `() => void \| (() => void)` | Function to run on focus, optionally returns cleanup |
| `deps` | `any[]` | Dependencies array (optional) |

**Returns:** `void`

**When to Use:**
- ✅ Refresh data when route is focused
- ✅ Start/stop background tasks (timers, subscriptions)
- ✅ Track route visibility
- ✅ Clear state on unfocus

**Example: Refresh Data on Focus**

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

      // Return cleanup function (runs on unfocus)
      return () => {
        console.log('Messages route unfocused');
        // Could cancel requests, stop timers, etc.
      };
    }, []) // Empty deps = runs every focus
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

**Example: Timer on Focus**

```typescript
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { Text, View } from 'react-native';

export default function Timer() {
  const [seconds, setSeconds] = useState(0);

  useFocusEffect(
    useCallback(() => {
      // Start timer when focused
      const interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);

      // Cleanup on unfocus
      return () => clearInterval(interval);
    }, [])
  );

  return <Text>Elapsed: {seconds}s</Text>;
}
```

**⚠️ Important:**

```typescript
// ✅ CORRECT: Wrap effect in useCallback
useFocusEffect(
  useCallback(() => {
    // effect code
  }, [])
);

// ❌ WRONG: Direct function causes infinite reruns
useFocusEffect(() => {
  // effect code—avoid this!
});
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#usefocuseffect

---

## Navigation Control Hooks

### useNavigation()

Access the parent layout's navigation object for layout-specific methods.

**Signature:**

```typescript
function useNavigation<T = any>(parent?: string | HrefObject): T
```

**Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| `parent` | `string` | Optional: path to specific parent layout |

**Return Type:**

React Navigation navigation object with layout-specific methods like `openDrawer()`.

**Example: Open Drawer from Nested Route**

```typescript
import { useNavigation } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function NestedRoute() {
  const navigation = useNavigation();

  return (
    <Pressable onPress={() => navigation.openDrawer()}>
      <Text>Open Drawer Menu</Text>
    </Pressable>
  );
}
```

**Accessing Specific Parent Layout:**

```typescript
// For nested layouts: /app/orders/menu/
// Current file is menu/index.tsx

// Get navigation from different parent levels
const rootNavigation = useNavigation('/');
const ordersNavigation = useNavigation('/orders');
const currentNavigation = useNavigation('/orders/menu');
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#usenavigation

---

### useNavigationContainerRef()

Get the root navigation container ref.

**Signature:**

```typescript
function useNavigationContainerRef(): NavigationContainerRefWithCurrent<RootParamList>
```

**Use Case:** Advanced navigation control, access to root navigation methods.

**Example:**

```typescript
import { useNavigationContainerRef } from 'expo-router';
import { useEffect } from 'react';

export default function App() {
  const navigationRef = useNavigationContainerRef();

  useEffect(() => {
    // Access ref if available
    if (navigationRef.current) {
      console.log('Navigation ready');
    }
  }, [navigationRef]);

  return null;
}
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#usenavigationcontainerref

---

## Preview Hook

### useIsPreview()

Determine if the current route is rendered in a preview context.

**Signature:**

```typescript
function useIsPreview(): boolean
```

**Return Type:**

```typescript
boolean  // true if in preview, false otherwise
```

**When to Use:**
- ✅ Show preview-specific UI (e.g., "Preview" badge)
- ✅ Skip expensive operations in preview
- ✅ Different behavior for preview vs. normal rendering

**Example:**

```typescript
import { useIsPreview } from 'expo-router';
import { Text, View } from 'react-native';

export default function Post({ id }) {
  const isPreview = useIsPreview();

  return (
    <View>
      {isPreview && <Text style={{ color: 'orange' }}>Preview</Text>}
      <Text>Post {id}</Text>
    </View>
  );
}
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/

---

## Hook Combinations (Real-World Patterns)

### Pattern 1: Breadcrumb Navigation

```typescript
import { useSegments, usePathname } from 'expo-router';
import { Text, View, Pressable } from 'react-native';
import { Link } from 'expo-router';

export default function Breadcrumbs() {
  const segments = useSegments();
  const pathname = usePathname();

  return (
    <View style={{ flexDirection: 'row' }}>
      <Link href="/" asChild>
        <Pressable>
          <Text>Home</Text>
        </Pressable>
      </Link>
      
      {segments.map((segment, index) => (
        <Text key={index}>
          {' '} / {segment}
        </Text>
      ))}
    </View>
  );
}
```

---

### Pattern 2: Route-Specific Header

```typescript
import { usePathname, useLocalSearchParams } from 'expo-router';
import { Text } from 'react-native';

export default function Header() {
  const pathname = usePathname();
  const params = useLocalSearchParams<{ title?: string }>();

  const getTitle = () => {
    if (pathname === '/home') return 'Home';
    if (pathname === '/search') return params.title || 'Search';
    if (pathname.startsWith('/users/')) return 'User Profile';
    return 'App';
  };

  return <Text>{getTitle()}</Text>;
}
```

---

### Pattern 3: Data Refresh on Focus

```typescript
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';

export default function RefreshOnFocus() {
  const [data, setData] = useState(null);

  useFocusEffect(
    useCallback(() => {
      const loadData = async () => {
        const fresh = await fetchData();
        setData(fresh);
      };

      loadData();
      
      return () => {
        // Optional cleanup
      };
    }, [])
  );

  return null;
}
```

---

## Common Mistakes & Solutions

### Issue: Infinite loop in useFocusEffect

```typescript
// ❌ WRONG
useFocusEffect(() => {
  setData(fetchData());
});

// ✅ CORRECT
useFocusEffect(
  useCallback(() => {
    setData(fetchData());
  }, [])
);
```

---

### Issue: Parameters are always strings

```typescript
// ❌ These won't parse automatically
const { count } = useLocalSearchParams<{ count: number }>();
const total = count + 5;  // ❌ count is string "5", not number

// ✅ Convert manually
const count = parseInt(useLocalSearchParams().count as string, 10);
const total = count + 5;  // ✅ Now works
```

---

## Key Takeaways

- 📍 **useLocalSearchParams()** = Route-focused params (Stack)
- 🌍 **useGlobalSearchParams()** = App-wide params (always current)
- 📄 **usePathname()** = Current route without query string
- 📑 **useSegments()** = Route path as array
- 👀 **useFocusEffect()** = Run effects when route focused
- ☝️ **Always wrap useFocusEffect effect in useCallback**
- 🔗 **All URL parameters are strings**

---

**Next Module:** `05-api-components.md` — Link, Redirect, Stack, Tabs components

**Source Documentation:** https://docs.expo.dev/versions/latest/sdk/router/
