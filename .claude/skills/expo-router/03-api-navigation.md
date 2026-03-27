# Navigation API Reference -- Expo Router v7 (~55.0.7)

Complete imperative navigation API with typed parameters.

---

## useRouter Hook

Returns a `Router` object for imperative navigation control.

```typescript
import { useRouter } from 'expo-router';

export default function Home() {
  const router = useRouter();
  return (
    <Pressable onPress={() => router.push('/profile')}>
      <Text>Go to Profile</Text>
    </Pressable>
  );
}
```

---

## Router Methods

### push(href, options?)

Add a new route to the history stack. Users can navigate back.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `href` | `Href` | Yes | Route path string or `{ pathname, params }` object |
| `options` | `NavigationOptions` | No | Additional navigation configuration |

**Returns:** `void`

```typescript
// String navigation
router.push('/profile');
router.push('/users/123');

// Object with dynamic segment
router.push({ pathname: '/users/[id]', params: { id: '123' } });

// With search parameters
router.push({ pathname: '/search', params: { q: 'expo', sort: 'recent' } });
```

---

### replace(href, options?)

Replace the current route without adding to history. Users cannot navigate back.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `href` | `Href` | Yes | Route path or object |
| `options` | `NavigationOptions` | No | Navigation configuration |

**Returns:** `void`

Use case: redirects after login (prevent returning to login screen).

```typescript
const handleLogin = async (credentials: Credentials) => {
  const success = await authenticate(credentials);
  if (success) {
    router.replace('/home'); // Can't go back to login
  }
};
```

---

### navigate(href, options?)

Navigate to a route. In Expo Router v7, `navigate()` always pushes a new route onto the stack (same behavior as `push()`).

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `href` | `Href` | Yes | Route path or object |
| `options` | `NavigationOptions` | No | Navigation configuration |

**Returns:** `void`

To pop back to an existing route in the stack, use `router.dismissTo()` instead.

```typescript
// History: Home -> Profile -> Settings
router.navigate('/profile');
// Result: Home -> Profile -> Settings -> Profile (new entry)

// To pop back instead:
router.dismissTo('/profile');
// Result: Home -> Profile (Settings removed)
```

---

### back()

Go back one screen in the navigation stack.

**Returns:** `void`

```typescript
<Pressable onPress={() => router.back()}>
  <Text>Back</Text>
</Pressable>
```

---

### canGoBack()

Check if the user can navigate back.

**Returns:** `boolean`

```typescript
const canGoBack = router.canGoBack();
if (canGoBack) {
  router.back();
}
```

---

### dismiss(count?)

Pop N screens from the current stack.

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `count` | `number` | `1` | Number of screens to dismiss |

**Returns:** `void`

```typescript
router.dismiss();    // Dismiss 1 screen
router.dismiss(2);   // Dismiss 2 screens
```

---

### dismissAll()

Return to the first screen in the closest stack.

**Returns:** `void`

```typescript
router.dismissAll(); // Reset to first screen in stack
```

---

### dismissTo(href, options?)

Dismiss screens until reaching the specified route. If route not found, replaces current screen.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `href` | `Href` | Yes | Target route |
| `options` | `NavigationOptions` | No | Navigation configuration |

**Returns:** `void`

```typescript
router.dismissTo('/home'); // Close screens until /home reached
```

---

### canDismiss()

Check if the current screen can be dismissed.

**Returns:** `boolean`

```typescript
if (router.canDismiss()) {
  router.dismiss();
}
```

---

### setParams(params)

Update the current route's search parameters without navigating.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `params` | `Partial<RouteInputParams>` | Yes | Params to update |

**Returns:** `void`

```typescript
router.setParams({ theme: 'dark', page: '2' });
```

---

### prefetch(href)

Preload a route bundle in the background before navigation.

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `href` | `Href` | Yes | Route to prefetch |

**Returns:** `void`

```typescript
// Prefetch on hover (web) or on mount
router.prefetch('/profile');

// Then navigate instantly
router.push('/profile');
```

---

## Href Type

Routes can be specified as strings or objects.

```typescript
// String format
router.push('/home');
router.push('/users/123');
router.push('/search?query=expo');

// Object format
router.push({
  pathname: '/users/[id]',
  params: { id: '123' },
});

// Typed routes -- TypeScript validates at compile time
router.push('/users/123');  // Valid
router.push('/invalid');     // TypeScript error if route doesn't exist
```

---

## Imperative vs. Declarative Navigation

### Imperative (useRouter)

Best for conditional logic, async operations, form submissions.

```typescript
const router = useRouter();

const handleSubmit = async () => {
  try {
    const response = await submitForm(data);
    router.push({
      pathname: '/confirmation',
      params: { orderId: response.id },
    });
  } catch (error) {
    showError(error.message);
  }
};
```

### Declarative (Link Component)

Best for static navigation, accessibility, web SEO.

```typescript
<Link href="/about">
  <Text>About</Text>
</Link>
```

---

## Common Patterns

### Navigation After Async Operation

```typescript
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, ActivityIndicator } from 'react-native';

export default function SubmitScreen() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const result = await submitData(formData);
      router.push({
        pathname: '/confirmation',
        params: { id: result.id },
      });
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Pressable onPress={handleSubmit} disabled={loading}>
      {loading ? <ActivityIndicator /> : <Text>Submit</Text>}
    </Pressable>
  );
}
```

### Preventing Back to Auth Screen

```typescript
// After successful login -- replace, don't push
router.replace('/home');
```

### Conditional Auth Redirect

```typescript
import { useEffect } from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '../ctx/auth';

export default function SplashScreen() {
  const router = useRouter();
  const { user, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading) {
      router.replace(user ? '/home' : '/login');
    }
  }, [isLoading, user]);

  return <Text>Loading...</Text>;
}
```

---

## Troubleshooting

### Router methods not working

- `useRouter()` must be called inside a component rendered within a layout
- App must have a valid `app/_layout.tsx`
- Target route must exist in `app/` directory

### Parameters not passed through

- Use object format: `{ pathname, params }`
- All params must be serializable (strings, numbers, booleans)
- Dynamic segments require matching file: `[id].tsx` for `id` param

---

**Version:** v7 (~55.0.7, SDK 55) | **Source:** https://docs.expo.dev/versions/latest/sdk/router/
