# Setup Guide -- Expo Router 6.x

Complete initialization and configuration for Expo Router projects with SDK 54.

---

## Quick Start (New Project)

```bash
npx create-expo-app@latest my-app
cd my-app
npm start
```

This creates a new Expo project with Expo Router pre-installed, `app/_layout.tsx` as root layout, and all required peer dependencies.

---

## Manual Installation (Existing Projects)

### Step 1: Install Dependencies

```bash
npx expo install expo-router react-native-safe-area-context \
  react-native-screens expo-linking expo-constants expo-status-bar
```

| Dependency | Purpose |
|------------|---------|
| `expo-router` | Core routing library |
| `react-native-safe-area-context` | Safe area padding on notch devices |
| `react-native-screens` | Native screen management |
| `expo-linking` | Deep linking support |
| `expo-constants` | App constants (scheme, name, version) |
| `expo-status-bar` | Status bar styling |

### Step 2: Update Entry Point

```json
{
  "main": "expo-router/entry"
}
```

### Step 3: Create Root Layout

```typescript
// app/_layout.tsx
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
```

### Step 4: Create Home Screen

```typescript
// app/index.tsx
import { Text, View } from 'react-native';

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>Home Screen</Text>
    </View>
  );
}
```

### Step 5: Babel Configuration

Ensure `babel.config.js` uses the Expo preset:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

### Step 6: Clear Cache and Start

```bash
npx expo start --clear
```

---

## Deep Linking Configuration

### Configure Scheme in app.json

```json
{
  "expo": {
    "scheme": "myapp",
    "plugins": ["expo-router"]
  }
}
```

Deep link examples: `myapp://home`, `myapp://profile/123`, `myapp://feed?sort=latest`.

### Web Platform Setup

```json
{
  "expo": {
    "web": {
      "bundler": "metro"
    }
  }
}
```

Install web dependencies:

```bash
npx expo install react-native-web react-dom
```

### Custom Entry Point (Optional)

For initializing global services before app load, create `index.js` in project root:

```javascript
import * as Analytics from './services/analytics';
Analytics.initialize();

// MUST be last import
import 'expo-router/entry';
```

Update `package.json`:

```json
{
  "main": "index.js"
}
```

---

## TypeScript Setup

Expo Router generates automatic type definitions. No additional setup required.

```typescript
// app/[id].tsx
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function Details() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View>
      <Text>ID: {id}</Text>
    </View>
  );
}
```

TypeScript automatically suggests valid route names in `href`, types route parameters correctly, and catches broken links at compile time.

---

## Verify Installation

Create `app/about.tsx`:

```typescript
import { useRouter } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

export default function About() {
  const router = useRouter();
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text>About Screen</Text>
      <Pressable onPress={() => router.back()}>
        <Text style={{ color: '#0a7ea4', marginTop: 16 }}>Go Back</Text>
      </Pressable>
    </View>
  );
}
```

Expected behavior:
1. App launches to Home screen at `/`
2. Navigate to `/about` renders About screen
3. `router.back()` returns to Home
4. Deep link `myapp://about` opens About directly

---

## Common Setup Issues

### "Cannot find module 'expo-router'"

```bash
npx expo install expo-router
npx expo start --clear
```

### Blank white screen

Ensure `app/_layout.tsx` exists and exports a valid component:

```typescript
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
```

Clear cache: `rm -rf .expo && npx expo start --clear`

### Deep links not working

1. `scheme` is set in `app.json`
2. Route file exists (e.g., `app/about.tsx` for `/about`)
3. Project rebuilt after config changes: `npx expo start --clear`
4. On native: app reinstalled after scheme change

---

## Verification Checklist

- [ ] `package.json` main field is `expo-router/entry` or custom entry file
- [ ] `app/_layout.tsx` exists and exports a React component
- [ ] `babel.config.js` uses `babel-preset-expo`
- [ ] All dependencies installed via `npx expo install` (not `npm install`)
- [ ] Cache cleared: `npx expo start --clear`

---

**Version:** 6.x (~6.0.23, SDK 54) | **Source:** https://docs.expo.dev/router/installation/
