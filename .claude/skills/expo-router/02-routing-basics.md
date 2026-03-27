# Routing Fundamentals -- Expo Router v7 (~55.0.7)

File-based routing conventions, directory structure, and core routing concepts.

---

## Core Concept: File-Based Routing

Expo Router automatically generates routes from the `app/` directory structure. File path becomes URL path.

```
app/
├── index.tsx              -> /
├── about.tsx              -> /about
├── profile.tsx            -> /profile
└── settings.tsx           -> /settings
```

---

## Directory Structure and Naming Conventions

### Standard Routes

```
app/
├── _layout.tsx           // Root layout (required)
├── index.tsx             // Home page: /
├── feed.tsx              // Feed page: /feed
└── profile.tsx           // Profile page: /profile
```

### Nested Routes

```
app/
├── _layout.tsx
├── index.tsx                    // /
├── users/
│   ├── _layout.tsx              // Users layout
│   ├── index.tsx                // /users
│   └── [id].tsx                 // /users/123
└── posts/
    ├── index.tsx                // /posts
    └── [id].tsx                 // /posts/456
```

---

## Route Groups

Folders wrapped in parentheses `(name)` organize routes without affecting the URL.

```
app/
├── (auth)/                      // Auth group (invisible in URL)
│   ├── _layout.tsx              // Auth layout
│   ├── login.tsx                // /login
│   └── signup.tsx               // /signup
├── (app)/                       // App group (invisible in URL)
│   ├── _layout.tsx              // App layout (tabs/nav)
│   ├── home.tsx                 // /home
│   └── profile.tsx              // /profile
└── _layout.tsx                  // Root layout
```

Benefits:
- Different layouts for auth vs. authenticated users
- Cleaner folder structure without affecting URLs
- Conditional visibility via `Stack.Protected`

---

## Dynamic Routes

### Single Parameter: `[param]`

```
app/users/[id].tsx               // /users/123, /users/abc
```

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

### Navigating with Parameters

```typescript
import { Link } from 'expo-router';

<Link href={{ pathname: '/users/[id]', params: { id: '123' } }}>
  View User 123
</Link>
```

---

## Catch-All Routes

Match any remaining path segments with `[...param]`.

```
app/[...rest].tsx                // /anything, /some/nested/path
```

```typescript
// app/+not-found.tsx -- Built-in 404 handler
import { Link, Stack } from 'expo-router';
import { Text, View } from 'react-native';

export default function NotFound() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Stack.Screen options={{ title: 'Not Found' }} />
      <Text>This screen does not exist.</Text>
      <Link href="/" style={{ color: '#0a7ea4', marginTop: 16 }}>
        Go to Home
      </Link>
    </View>
  );
}
```

---

## Optional Segments

Double brackets `[[param]]` make a segment optional. Route matches with or without the segment.

```
app/feed/[[filter]].tsx          // /feed or /feed/trending
```

```typescript
// app/feed/[[filter]].tsx
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function Feed() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  return (
    <View>
      <Text>Filter: {filter || 'All'}</Text>
    </View>
  );
}
```

Navigation:

```typescript
router.push('/feed');              // filter = undefined
router.push('/feed/trending');     // filter = 'trending'
```

---

## Layouts

Layouts define the navigation structure for child routes. Every folder with routes should have a `_layout.tsx`.

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: { backgroundColor: '#0a7ea4' },
        headerTintColor: '#fff',
        headerTitleStyle: { fontWeight: 'bold' },
      }}
    >
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="about" options={{ title: 'About' }} />
    </Stack>
  );
}
```

### Nested Layouts

```typescript
// app/profile/_layout.tsx
import { Stack } from 'expo-router';

export default function ProfileLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Profile' }} />
      <Stack.Screen name="[id]" options={{ title: 'User Profile' }} />
      <Stack.Screen name="settings" options={{ title: 'Settings' }} />
    </Stack>
  );
}
```

If a folder has routes but no `_layout.tsx`, Expo Router creates an implicit layout. Best practice: always create `_layout.tsx` for explicit control.

---

## Modals

Modals overlay existing content. Set `presentation: 'modal'` in screen options.

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', title: 'Modal' }} />
    </Stack>
  );
}
```

Navigate to modal: `router.push('/modal');`

---

## Search Parameters (Query Strings)

```
/profile?theme=dark&notifications=true
```

### Accessing Search Params

```typescript
import { useLocalSearchParams } from 'expo-router';

export default function Profile() {
  const { theme, notifications } = useLocalSearchParams<{
    theme?: string;
    notifications?: string;
  }>();
  return <Text>Theme: {theme || 'light'}</Text>;
}
```

### Setting Search Params

```typescript
// Via Link
<Link href={{ pathname: '/profile', params: { theme: 'dark' } }}>
  Dark Mode
</Link>

// Via router
router.push({ pathname: '/profile', params: { theme: 'dark' } });

// Update current route params
router.setParams({ theme: 'dark' });
```

---

## Naming Conventions

| Convention | Example | URL | Notes |
|-----------|---------|-----|-------|
| Kebab case | `user-profile.tsx` | `/user-profile` | Consistent, readable |
| Dynamic | `[id].tsx` | `/123` | Required syntax |
| Catch-all | `[...rest].tsx` | `/path/to/page` | Fallback handler |
| Optional | `[[filter]].tsx` | `/` or `/trending` | Zero or one param |
| Groups | `(auth)` | Hidden in URL | Organizing only |
| Not found | `+not-found.tsx` | 404 fallback | Built-in convention |

---

## Recommended Folder Structure

```
app/
├── _layout.tsx              // Root layout (Stack)
├── index.tsx                // Home: /
├── +not-found.tsx           // 404 fallback
├── (auth)/                  // Auth routes
│   ├── _layout.tsx
│   ├── login.tsx
│   └── signup.tsx
├── (app)/                   // Protected app routes
│   ├── _layout.tsx          // Stack or Tabs
│   ├── (tabs)/              // Tab group
│   │   ├── _layout.tsx      // Tab navigation
│   │   ├── home.tsx
│   │   ├── explore.tsx
│   │   └── profile.tsx
│   └── settings.tsx
└── modal.tsx                // Modal screen
```

---

**Version:** v7 (~55.0.7, SDK 55) | **Source:** https://docs.expo.dev/router/basics/common-navigation-patterns/
