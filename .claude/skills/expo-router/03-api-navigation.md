# Navigation API Reference — Expo Router 6.0.19

Complete imperative navigation API with typed parameters and real-world examples.

**Module Summary:** `useRouter()` hook, `router` object methods, navigation options, imperative vs. declarative navigation patterns.

**🔗 Cross-References:**
- Routing fundamentals → `02-routing-basics.md`
- Hook alternatives → `04-api-hooks.md`
- Component-based navigation → `05-api-components.md`
- Authentication flows → `06-auth-protected-routes.md`

---

## useRouter Hook

The `useRouter()` hook provides imperative navigation control.

### Basic Usage

```typescript
import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function Home() {
  const router = useRouter();

  return (
    <Pressable onPress={() => router.push('/profile')}>
      <Text>Go to Profile</Text>
    </Pressable>
  );
}
```

**Type Definition:**

```typescript
type useRouter = () => Router;

type Router = {
  push: (href: Href, options?: NavigationOptions) => void;
  replace: (href: Href, options?: NavigationOptions) => void;
  navigate: (href: Href, options?: NavigationOptions) => void;
  back: () => void;
  canGoBack: () => boolean;
  dismiss: (count?: number) => void;
  dismissAll: () => void;
  dismissTo: (href: Href, options?: NavigationOptions) => void;
  setParams: (params: Record<string, any>) => void;
  prefetch: (href: Href) => void;
  canDismiss: () => boolean;
};
```

**Official Source:** https://docs.expo.dev/versions/latest/sdk/router/#userouter

---

## Router Methods

### push()

Add a new route to the history stack. Users can go back.

**Signature:**

```typescript
router.push(href: Href, options?: NavigationOptions): void
```

**Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| `href` | `string` &#124; `HrefObject` | Yes | Route path or object with pathname + params |
| `options` | `NavigationOptions` | No | Navigation configuration |

**Examples:**

```typescript
// String navigation
router.push('/profile');

// With dynamic parameters
router.push('/users/123');

// With search parameters
router.push({
  pathname: '/search',
  params: { q: 'expo', category: 'docs' },
});

// Object with dynamic segment
router.push({
  pathname: '/users/[id]',
  params: { id: '123' },
});
```

**Code Example: Add to History**

```typescript
import { useRouter } from 'expo-router';
import { Pressable, Text, View, FlatList } from 'react-native';

export default function UsersList() {
  const router = useRouter();
  const users = [
    { id: '1', name: 'Alice' },
    { id: '2', name: 'Bob' },
  ];

  return (
    <FlatList
      data={users}
      keyExtractor={(item) => item.id}
      renderItem={({ item }) => (
        <Pressable onPress={() => router.push(`/users/${item.id}`)}>
          <Text>{item.name}</Text>
        </Pressable>
      )}
    />
  );
}
```

---

### replace()

Replace the current route without adding to history. Users cannot go back.

**Signature:**

```typescript
router.replace(href: Href, options?: NavigationOptions): void
```

**Use Case:** Redirects after login (don't want to return to login screen when back is pressed).

**Example:**

```typescript
export default function LoginScreen() {
  const router = useRouter();

  const handleLogin = async (credentials) => {
    const success = await authenticate(credentials);
    if (success) {
      // Replace login with home—user can't go back to login
      router.replace('/home');
    }
  };

  return (
    // Login form...
  );
}
```

**With Parameters:**

```typescript
router.replace({
  pathname: '/home',
  params: { userId: '123', onboarded: 'true' },
});
```

---

### navigate()

Navigate to a route, replacing intermediate routes if they exist in the stack.

**Signature:**

```typescript
router.navigate(href: Href, options?: NavigationOptions): void
```

**Behavior:**

- If route exists in stack → pops to that route
- If route doesn't exist → pushes new route

**Example: Back to Existing Route**

```typescript
// Navigation history: Home → Profile → Settings

router.navigate('/profile');
// Result: Home → Profile (Settings removed)
```

---

### back()

Go back one screen in the stack.

**Signature:**

```typescript
router.back(): void
```

**Example:**

```typescript
<Pressable onPress={() => router.back()}>
  <Text>← Back</Text>
</Pressable>
```

---

### canGoBack()

Check if the user can go back.

**Signature:**

```typescript
router.canGoBack(): boolean
```

**Example: Conditional Back Button**

```typescript
import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function Header() {
  const router = useRouter();
  const canGoBack = router.canGoBack();

  return (
    canGoBack && (
      <Pressable onPress={() => router.back()}>
        <Text>← Back</Text>
      </Pressable>
    )
  );
}
```

---

### dismiss()

Pop N screens from the stack.

**Signature:**

```typescript
router.dismiss(count?: number): void
```

**Parameters:**

| Param | Type | Default | Description |
|-------|------|---------|-------------|
| `count` | `number` | 1 | Number of screens to dismiss |

**Example: Close Modal**

```typescript
// Dismiss 1 screen (the modal)
router.dismiss();

// Dismiss 2 screens
router.dismiss(2);
```

---

### dismissAll()

Go back to the first screen in the closest stack.

**Signature:**

```typescript
router.dismissAll(): void
```

**Example: Reset to Home**

```typescript
<Pressable onPress={() => router.dismissAll()}>
  <Text>Close All and Return Home</Text>
</Pressable>
```

---

### dismissTo()

Dismiss screens until reaching the specified route. If route not found, replace current screen.

**Signature:**

```typescript
router.dismissTo(href: Href, options?: NavigationOptions): void
```

**Example: Close Modal and Navigate**

```typescript
// Close modals until reaching /home, or replace with /home
router.dismissTo('/home');
```

---

### setParams()

Update the current route's search parameters without navigating.

**Signature:**

```typescript
router.setParams(params: Partial<RouteInputParams<T>>): void
```

**Example: Update Theme Parameter**

```typescript
import { useRouter } from 'expo-router';
import { Switch, View } from 'react-native';
import { useState } from 'react';

export default function Settings() {
  const router = useRouter();
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = (value) => {
    setDarkMode(value);
    // Update route params without navigating
    router.setParams({ theme: value ? 'dark' : 'light' });
  };

  return (
    <View>
      <Switch value={darkMode} onValueChange={toggleDarkMode} />
    </View>
  );
}
```

---

### prefetch()

Preload a route in the background before navigation.

**Signature:**

```typescript
router.prefetch(href: Href): void
```

**Benefits:**
- ✅ Faster navigation when user actually navigates
- ✅ Loads route bundle in parallel
- ✅ Better perceived performance

**Example: Prefetch on Hover (Web)**

```typescript
import { useRouter } from 'expo-router';
import { Pressable, Text } from 'react-native';

export default function Home() {
  const router = useRouter();

  return (
    <Pressable
      onMouseEnter={() => router.prefetch('/profile')}
      onPress={() => router.push('/profile')}
    >
      <Text>Go to Profile</Text>
    </Pressable>
  );
}
```

---

### canDismiss()

Check if the current screen can be dismissed (if in a stack).

**Signature:**

```typescript
router.canDismiss(): boolean
```

**Example:**

```typescript
if (router.canDismiss()) {
  router.dismiss();
} else {
  // Can't dismiss—do nothing or show message
}
```

---

## NavigationOptions

Optional configuration for navigation methods.

**Type Definition:**

```typescript
type NavigationOptions = {
  // Additional platform-specific options
};
```

Currently, `NavigationOptions` is reserved for future use but can be extended with custom navigation behavior.

---

## Href Type

Routes can be specified as strings or objects.

### String Format

```typescript
router.push('/home');
router.push('/users/123');
router.push('/search?query=expo');
```

### Object Format

```typescript
router.push({
  pathname: '/users/[id]',
  params: { id: '123' },
});

router.push({
  pathname: '/search',
  params: { query: 'expo', sort: 'recent' },
});
```

**With TypeScript (Auto-Generated Types):**

```typescript
// Expo Router automatically generates Href type
// Routes are type-safe and validated at compile time

router.push('/users/123');  // ✅ Valid
router.push('/invalid');     // ❌ TypeScript error
```

---

## Practical Examples

### Example 1: Multi-Step Form with Navigation

```typescript
// app/(auth)/signup.tsx
import { useState } from 'react';
import { useRouter } from 'expo-router';
import { View, TextInput, Pressable, Text } from 'react-native';

export default function SignupScreen() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleSignup = async () => {
    const user = await createAccount(email, password);
    
    // Navigate with user data
    router.push({
      pathname: '/setup-profile',
      params: { userId: user.id },
    });
  };

  return (
    <View>
      <TextInput placeholder="Email" value={email} onChangeText={setEmail} />
      <TextInput placeholder="Password" value={password} onChangeText={setPassword} />
      <Pressable onPress={handleSignup}>
        <Text>Continue</Text>
      </Pressable>
    </View>
  );
}
```

---

### Example 2: Conditional Navigation Based on Auth

```typescript
// app/index.tsx
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../ctx/auth';
import { Text, View } from 'react-native';

export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      if (user) {
        // User authenticated—go to app
        router.replace('/home');
      } else {
        // Not authenticated—go to login
        router.replace('/login');
      }
    }
  }, [isLoading, user]);

  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Loading...</Text>
    </View>
  );
}
```

---

### Example 3: Browser History-Like Navigation

```typescript
// app/post/[id].tsx
import { useRouter, useLocalSearchParams } from 'expo-router';
import { View, Pressable, Text } from 'react-native';

export default function PostDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <View>
      <Pressable onPress={() => router.back()}>
        <Text>← Back to Posts</Text>
      </Pressable>
      
      <Text>Post {id}</Text>

      {router.canGoBack() && (
        <Pressable onPress={() => router.dismissAll()}>
          <Text>Close All</Text>
        </Pressable>
      )}
    </View>
  );
}
```

---

## Imperative vs. Declarative Navigation

### Imperative (useRouter)

```typescript
// Control navigation in code based on logic
const router = useRouter();

if (formValid) {
  router.push('/success');
} else {
  showError('Invalid form');
}
```

**Best for:**
- ✅ Complex conditional logic
- ✅ Data-dependent navigation
- ✅ Form submissions
- ✅ API responses

### Declarative (Link Component)

```typescript
// Define navigation in JSX (see api-components.md)
<Link href="/success">
  <Text>Continue</Text>
</Link>
```

**Best for:**
- ✅ Simple navigation
- ✅ Always navigate to same route
- ✅ User gestures (tap, click)

---

## Common Patterns

### Pattern 1: Navigation After Async Operation

```typescript
const handleSubmit = async () => {
  try {
    setLoading(true);
    const response = await submitForm(formData);
    
    // Navigate only after success
    router.push({
      pathname: '/confirmation',
      params: { orderId: response.id },
    });
  } catch (error) {
    showError(error.message);
  } finally {
    setLoading(false);
  }
};
```

---

### Pattern 2: Preventing Going Back to Auth Screen

```typescript
// After successful login
router.replace('/home');  // Don't push—replace, so back doesn't go to login
```

---

### Pattern 3: Handling Deep Links with Fallback

```typescript
const navigateToRoute = (route: string) => {
  try {
    router.push(route);
  } catch {
    // Route doesn't exist—navigate to home
    router.push('/home');
  }
};
```

---

## Troubleshooting

### Issue: Router methods not working

**Verify:**
- ✅ `useRouter()` called in a component inside a layout
- ✅ App has a valid `app/_layout.tsx`
- ✅ Route exists in the `app/` directory

---

### Issue: Parameters not passed through

**Check:**
- ✅ Using object format: `{ pathname, params }`
- ✅ Params are serializable (strings, numbers, booleans)
- ✅ Route accepts the params (e.g., `[id].tsx` for `id` param)

---

## Key Takeaways

- 🔗 `router.push()` adds to history (back available)
- 🔄 `router.replace()` replaces (no back)
- ⏪ `router.back()` goes to previous screen
- 🎯 `router.navigate()` is smart (reuses existing routes)
- 📦 Pass params via `{ pathname, params }` object
- ⚡ Prefetch routes for faster navigation

---

**Next Module:** `04-api-hooks.md` — Parameter extraction and focus effect hooks

**Source Documentation:** https://docs.expo.dev/versions/latest/sdk/router/
