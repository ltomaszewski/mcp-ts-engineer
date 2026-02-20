---
name: expo-router
description: Expo Router file-based navigation - routes, layouts, tabs, stacks, linking. Use when implementing navigation, creating screens, or handling deep links in Expo apps.
---

# Expo Router

> File-based routing for React Native with Expo. Routes are files in `app/` directory.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Creating navigation structure or adding screens
- Implementing tab or stack navigation
- Setting up deep linking or universal links
- Handling authentication redirects
- Working with dynamic routes `[param].tsx`

---

## Critical Rules

**ALWAYS:**
1. Place route files in `app/` directory — file path becomes URL path
2. Use `_layout.tsx` for navigation containers — wraps child routes with Stack/Tabs
3. Use `<Link>` for declarative navigation — better than imperative `router.push`
4. Type route params with `useLocalSearchParams<T>()` — ensures type safety

**NEVER:**
1. Put screens outside `app/` directory — they won't be recognized as routes
2. Name layout files without underscore — `layout.tsx` won't work, must be `_layout.tsx`
3. Use `router.push` for static links — prefer `<Link href="...">` for accessibility

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
      <Stack.Screen name="profile/[id]" options={{ title: 'Profile' }} />
    </Stack>
  );
}
```

### Tab Navigation

```typescript
// app/(tabs)/_layout.tsx
import { Tabs } from 'expo-router';

export default function TabLayout() {
  return (
    <Tabs>
      <Tabs.Screen name="index" options={{ title: 'Home', tabBarIcon: HomeIcon }} />
      <Tabs.Screen name="settings" options={{ title: 'Settings' }} />
    </Tabs>
  );
}
```

### Dynamic Route with Typed Params

```typescript
// app/profile/[id].tsx
import { useLocalSearchParams } from 'expo-router';

export default function Profile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <Text>Profile {id}</Text>;
}
```

### Navigation Methods

```typescript
import { Link, router } from 'expo-router';

// Declarative (preferred)
<Link href="/profile/123">View Profile</Link>
<Link href={{ pathname: '/profile/[id]', params: { id: '123' } }}>View Profile</Link>

// Imperative
router.push('/profile/123');
router.replace('/login');  // No back button
router.back();
```

---

## Anti-Patterns

**BAD** — Using index.tsx in nested folder without layout:
```
app/
  settings/
    index.tsx  // Won't render without _layout.tsx in settings/
```

**GOOD** — Either add layout or use direct file:
```
app/
  settings/
    _layout.tsx  // Add layout
    index.tsx
// OR
app/
  settings.tsx  // Direct file route
```

---

## Quick Reference

| Task | Pattern | Example |
|------|---------|---------|
| Static route | `app/about.tsx` | URL: `/about` |
| Dynamic route | `app/user/[id].tsx` | URL: `/user/123` |
| Catch-all | `app/[...rest].tsx` | URL: `/a/b/c` |
| Tab group | `app/(tabs)/_layout.tsx` | Groups tabs, not in URL |
| Get params | `useLocalSearchParams()` | `{ id }` |
| Get pathname | `usePathname()` | `/user/123` |
| Get segments | `useSegments()` | `['user', '123']` |
| Navigate | `router.push(path)` | `router.push('/home')` |
| Replace | `router.replace(path)` | No back navigation |
| Go back | `router.back()` | Previous screen |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Initial setup and app.json config | [01-setup-guide.md](01-setup-guide.md) |
| Route file naming and structure | [02-routing-basics.md](02-routing-basics.md) |
| Link, router API details | [03-api-navigation.md](03-api-navigation.md) |
| useRouter, useSegments, usePathname | [04-api-hooks.md](04-api-hooks.md) |
| Stack, Tabs, Slot components | [05-api-components.md](05-api-components.md) |
| Auth redirects and protected routes | [06-auth-protected-routes.md](06-auth-protected-routes.md) |

---

**Version:** 3.x | **Source:** https://docs.expo.dev/router/introduction/
