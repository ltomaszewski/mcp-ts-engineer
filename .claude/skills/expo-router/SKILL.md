---
name: expo-router
description: Expo Router v7 (~55.0.7) file-based navigation - routes, layouts, tabs, stacks, drawers, typed navigation, modals, error boundaries. Use when implementing navigation, creating screens, handling deep links, or building auth flows in Expo apps.
---

# Expo Router

File-based routing for React Native and web with Expo SDK 55. Routes are files in the `app/` directory.

---

## When to Use

LOAD THIS SKILL when user is:
- Creating navigation structure or adding new screens
- Implementing tab, stack, or drawer navigation
- Setting up deep linking or universal links
- Handling authentication redirects and protected routes
- Working with dynamic routes `[param].tsx` or typed navigation

---

## Critical Rules

**ALWAYS:**
1. Place route files in `app/` directory -- file path becomes URL path
2. Use `_layout.tsx` for navigation containers -- wraps child routes with Stack/Tabs/Drawer
3. Use `<Link>` for declarative navigation -- better accessibility and web support than imperative `router.push`
4. Type route params with `useLocalSearchParams<T>()` -- ensures compile-time type safety
5. Wrap `useFocusEffect` callbacks in `useCallback` -- prevents infinite re-render loops

**NEVER:**
1. Put screens outside `app/` directory -- they will not be recognized as routes
2. Name layout files without underscore prefix -- `layout.tsx` is ignored, must be `_layout.tsx`
3. Use `router.push` for static links -- prefer `<Link href="...">` for accessibility and web SEO
4. Pass non-serializable values in route params -- all URL params are strings, convert manually

---

## Core Patterns

### Root Layout with Stack

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Screen name="index" options={{ title: 'Home' }} />
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal' }} />
    </Stack>
  );
}
```

### Tab Navigation

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

export default function TabLayout() {
  return (
    <Tabs screenOptions={{ tabBarActiveTintColor: '#0a7ea4' }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home" color={color} size={size} />
          ),
        }}
      />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
```

### Dynamic Route with Typed Params

```typescript
// app/profile/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text>Profile {id}</Text>
    </View>
  );
}
```

### Navigation Methods

```typescript
import { Link, router } from 'expo-router';

// Declarative (preferred for static links)
<Link href="/profile/123">View Profile</Link>
<Link href={{ pathname: '/profile/[id]', params: { id: '123' } }}>Profile</Link>

// Imperative (for conditional/async logic)
router.push('/profile/123');
router.replace('/login');   // No back button
router.back();
router.dismiss();           // Pop current screen
router.dismissTo('/home');  // Dismiss until reaching /home
```

### Auth with Stack.Protected

```typescript
// app/_layout.tsx
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

## Anti-Patterns

**BAD** -- Using index.tsx in nested folder without layout:
```
app/settings/index.tsx  // Won't render properly without _layout.tsx in settings/
```

**GOOD** -- Either add layout or use direct file:
```
app/settings/_layout.tsx + app/settings/index.tsx
// OR simply:
app/settings.tsx
```

**BAD** -- Infinite loop in useFocusEffect:
```typescript
useFocusEffect(() => { fetchData(); }); // Re-runs infinitely
```

**GOOD** -- Wrap in useCallback:
```typescript
useFocusEffect(useCallback(() => { fetchData(); }, []));
```

---

## Quick Reference

| Task | API | Example |
|------|-----|---------|
| Static route | `app/about.tsx` | URL: `/about` |
| Dynamic route | `app/user/[id].tsx` | URL: `/user/123` |
| Catch-all | `app/[...rest].tsx` | URL: `/a/b/c` |
| Optional segment | `app/feed/[[filter]].tsx` | URL: `/feed` or `/feed/trending` |
| Route group | `app/(tabs)/_layout.tsx` | Groups routes, hidden from URL |
| Get params | `useLocalSearchParams<T>()` | `const { id } = useLocalSearchParams<{ id: string }>()` |
| Get pathname | `usePathname()` | Returns `/user/123` |
| Get segments | `useSegments()` | Returns `['user', '123']` |
| Navigate push | `router.push(href)` | `router.push('/home')` |
| Navigate replace | `router.replace(href)` | Replaces current, no back |
| Go back | `router.back()` | Previous screen |
| Dismiss screens | `router.dismiss(count?)` | Pop N screens from stack |
| Prefetch route | `router.prefetch(href)` | Preload route bundle |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Initial setup and app.json config | [01-setup-guide.md](01-setup-guide.md) |
| Route file naming and structure | [02-routing-basics.md](02-routing-basics.md) |
| useRouter, router methods, Href type | [03-api-navigation.md](03-api-navigation.md) |
| useLocalSearchParams, useSegments, useFocusEffect | [04-api-hooks.md](04-api-hooks.md) |
| Stack, Tabs, Drawer, Link, Redirect, Slot, ErrorBoundary | [05-api-components.md](05-api-components.md) |
| Auth redirects, Stack.Protected, role-based access | [06-auth-protected-routes.md](06-auth-protected-routes.md) |

---

**Version:** v7 (~55.0.7, SDK 55) | React Native 0.83.4, React 19.2.0 | **Source:** https://docs.expo.dev/router/introduction/
