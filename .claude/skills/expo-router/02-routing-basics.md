# Routing Fundamentals — Expo Router 6.0.19

File-based routing conventions, directory structure, and core routing concepts.

**Module Summary:** How file-based routing works, naming conventions, directory structures, dynamic routes, optional segments, and route organization patterns.

**🔗 Cross-References:**
- Setup & installation → `01-setup-guide.md`
- Navigation implementation → `03-api-navigation.md`
- Parameter handling → `04-api-hooks.md`

---

## Core Concept: File-Based Routing

Expo Router **automatically generates routes** from your `app/` directory structure.

### Basic Mapping

```
app/
├── index.tsx              → /
├── about.tsx              → /about
├── profile.tsx            → /profile
└── settings.tsx           → /settings
```

**Navigation Examples:**

```typescript
// Navigate to route
router.push('/about');        // → app/about.tsx
router.push('/profile');      // → app/profile.tsx
router.push('/settings');     // → app/settings.tsx
```

**Official Source:** https://docs.expo.dev/router/introduction/

---

## Directory Structure & Naming Conventions

### Standard Routes

Files become routes based on their path:

```
app/
├── _layout.tsx           // Root layout (required)
├── index.tsx             // Home page: /
├── feed.tsx              // Feed page: /feed
└── profile.tsx           // Profile page: /profile
```

### Nested Routes (Stack Navigation)

Create folders to organize related routes:

```
app/
├── _layout.tsx
├── index.tsx                    // /
├── (auth)/
│   ├── _layout.tsx              // Auth group layout
│   ├── login.tsx                // /login
│   ├── signup.tsx               // /signup
│   └── forgot-password.tsx       // /forgot-password
└── (app)/
    ├── _layout.tsx              // App group layout
    ├── home.tsx                 // /home
    ├── profile.tsx              // /profile
    └── settings.tsx             // /settings
```

**Navigation:**

```typescript
router.push('/login');          // From (auth) group
router.push('/home');           // From (app) group
router.push('/profile');
```

---

## Route Groups

Route groups are folders wrapped in **parentheses** `(name)`. They organize routes **without affecting the URL**.

### Example: Authentication Separation

```
app/
├── (auth)/                      // Auth group (invisible in URL)
│   ├── _layout.tsx              // Auth layout (login UI)
│   ├── login.tsx                // /login
│   └── signup.tsx               // /signup
├── (app)/                       // App group (invisible in URL)
│   ├── _layout.tsx              // App layout (tabs/nav)
│   ├── home.tsx                 // /home
│   └── profile.tsx              // /profile
└── _layout.tsx                  // Root layout
```

**Benefits:**
- ✅ Different layouts for auth vs. authenticated users
- ✅ Cleaner folder structure without affecting URLs
- ✅ Easier to conditionally show/hide route groups

**Code Example:**

```typescript
// app/_layout.tsx - Root layout with auth check
import { SessionProvider, useSession } from '../ctx';
import { Slot, Redirect } from 'expo-router';

export default function RootLayout() {
  return (
    <SessionProvider>
      <RootNavigator />
    </SessionProvider>
  );
}

function RootNavigator() {
  const { session, isLoading } = useSession();

  if (isLoading) {
    return <Text>Loading...</Text>;
  }

  return !session ? (
    // Show (auth) routes if not logged in
    <Slot />
  ) : (
    // Show (app) routes if logged in
    <Slot />
  );
}
```

**Official Source:** https://docs.expo.dev/router/basics/common-navigation-patterns/

---

## Dynamic Routes

Dynamic segments create routes with parameters.

### Syntax: `[param]`

```
app/
├── index.tsx                    // /
├── users/
│   ├── index.tsx                // /users
│   └── [id].tsx                 // /users/123, /users/abc
└── posts/
    ├── index.tsx                // /posts
    └── [id].tsx                 // /posts/123
```

### Accessing Parameters

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
import { Pressable, Text } from 'react-native';

export default function UsersList() {
  return (
    <Link href={{ pathname: '/users/[id]', params: { id: '123' } }} asChild>
      <Pressable>
        <Text>View User 123</Text>
      </Pressable>
    </Link>
  );
}
```

---

## Catch-All Routes

Catch-all segments match **any remaining path**.

### Syntax: `[...param]`

```
app/
├── index.tsx                    // /
└── [...]tsx                     // /anything, /some/nested/path
```

### Example: 404 Page

```typescript
// app/[...].tsx - Catch-all for unknown routes
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';
import { Link } from 'expo-router';

export default function NotFound() {
  const { rest } = useLocalSearchParams();
  
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 18, marginBottom: 16 }}>
        Page not found: /{rest}
      </Text>
      <Link href="/" style={{ color: '#0a7ea4' }}>
        <Text>Return Home</Text>
      </Link>
    </View>
  );
}
```

---

## Optional Segments

Segments wrapped in **double brackets** are optional.

### Syntax: `[[param]]`

```
app/
├── [user].tsx                   // /user or [[user]].tsx?
└── feed/
    └── [[filter]].tsx           // /feed or /feed/trending
```

### Example: Optional Filtering

```typescript
// app/feed/[[filter]].tsx
import { useLocalSearchParams } from 'expo-router';
import { FlatList, Text, View } from 'react-native';

export default function Feed() {
  const { filter } = useLocalSearchParams<{ filter?: string }>();
  
  const posts = filter === 'trending'
    ? getTrendingPosts()
    : getAllPosts();
  
  return (
    <View>
      <Text>Filter: {filter || 'All'}</Text>
      <FlatList data={posts} renderItem={renderPost} />
    </View>
  );
}
```

**Navigation:**

```typescript
router.push('/feed');              // filter = undefined
router.push('/feed/trending');     // filter = 'trending'
router.push('/feed/recent');       // filter = 'recent'
```

---

## Layouts

Layouts are special files that define the **navigation structure** for child routes.

### Syntax: `_layout.tsx`

```
app/
├── _layout.tsx                  // Root layout (Stack)
├── index.tsx                    // / (rendered by root layout)
├── about.tsx                    // /about
└── profile/
    ├── _layout.tsx              // Profile group layout (Stack)
    ├── index.tsx                // /profile
    ├── [id].tsx                 // /profile/[id]
    └── settings.tsx             // /profile/settings
```

### Layout Example

```typescript
// app/_layout.tsx - Root layout
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: true,
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

**Nested Layout Example:**

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

---

## Implicit Layout Nesting

If a folder has routes but no `_layout.tsx`, Expo Router creates an implicit layout.

```
app/
├── _layout.tsx              // Root layout
├── index.tsx
├── about.tsx
└── profile/
    └── [id].tsx             // ← No _layout.tsx here
```

**Result:** Routes in `profile/` are rendered without additional layout wrapper.

**✅ Best Practice:** Always create `_layout.tsx` for explicit control over navigation structure.

---

## Modals

Modals are **full-screen overlays** over existing content.

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return (
    <Stack>
      <Stack.Group>
        <Stack.Screen name="(tabs)" />
      </Stack.Group>
      
      {/* Modal presentation */}
      <Stack.Group screenOptions={{ presentation: 'modal' }}>
        <Stack.Screen name="modal" options={{ title: 'Modal' }} />
      </Stack.Group>
    </Stack>
  );
}
```

**Navigate to modal:**

```typescript
router.push('/modal');
```

---

## Search Parameters (Query Strings)

Search params are key-value pairs in the URL.

```
/profile?theme=dark&notifications=true
/products?category=electronics&sort=price
```

### Accessing Search Params

```typescript
// app/profile.tsx
import { useLocalSearchParams } from 'expo-router';

export default function Profile() {
  const { theme, notifications } = useLocalSearchParams<{
    theme?: string;
    notifications?: string;
  }>();
  
  return (
    <Text>Theme: {theme || 'light'}</Text>
  );
}
```

### Setting Search Params

```typescript
import { Link } from 'expo-router';

// Via Link component
<Link href={{ pathname: '/profile', params: { theme: 'dark' } }}>
  <Text>Dark Mode</Text>
</Link>

// Via router imperative API
router.push({
  pathname: '/profile',
  params: { theme: 'dark', notifications: 'true' },
});

// Via setParams (update current route)
router.setParams({ theme: 'dark' });
```

---

## Naming Conventions & Best Practices

### ✅ File Naming Best Practices

| Convention | Example | URL | Notes |
|-----------|---------|-----|-------|
| Kebab case for multi-word | `user-profile.tsx` | `/user-profile` | Consistent, readable |
| Dynamic brackets | `[id].tsx` | `/123` | Required syntax |
| Catch-all | `[...rest].tsx` | `/path/to/page` | Fallback handler |
| Optional | `[[filter]].tsx` | `/` or `/trending` | Zero or one param |
| Groups | `(auth)` | Hidden in URL | Organizing tool only |

### ✅ Folder Structure Best Practices

```
app/
├── _layout.tsx              // Root layout
├── index.tsx                // Home
├── (auth)/                  // Auth routes
│   ├── _layout.tsx
│   ├── login.tsx
│   ├── signup.tsx
│   └── forgot-password.tsx
├── (app)/                   // App routes (protected)
│   ├── _layout.tsx          // Tabs or Stack
│   ├── (tabs)/              // Tab group
│   │   ├── _layout.tsx      // Tab navigation
│   │   ├── home.tsx
│   │   ├── explore.tsx
│   │   └── profile.tsx
│   └── settings.tsx
├── [...]tsx                 // 404 fallback
└── api/                     // API routes (if using)
    ├── users.ts
    └── posts.ts
```

---

## Troubleshooting

### Issue: Route not found

**Check:**
1. File is in `app/` directory
2. File extension is `.tsx` or `.ts` (or `.jsx`/`.js`)
3. Path matches file structure (e.g., `app/users/[id].tsx` → `/users/[id]`)
4. App rebuilt: `npm start -- --clear`

---

### Issue: Unexpected layout behavior

**Verify:**
1. Each folder with routes has a `_layout.tsx`
2. Layout exports a valid navigation component (`Stack`, `Tabs`, etc.)
3. Layout includes `<Stack.Screen>` definitions for child routes

---

## Key Takeaways

- 📁 **File structure = URL structure**
- 🔤 **Dynamic `[param]` creates parameterized routes**
- 🗂️ **Groups `(name)` organize without affecting URLs**
- 📋 **Layouts define navigation structure**
- 🔎 **Search params pass query data**
- 🎯 **Modals overlay existing content**

---

**Next Module:** `03-api-navigation.md` — Imperative navigation with `useRouter()`

**Source Documentation:** https://docs.expo.dev/router/basics/common-navigation-patterns/
