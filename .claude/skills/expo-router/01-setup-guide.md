# Setup Guide — Expo Router 6.0.19

Complete initialization and configuration for new Expo Router projects.

**Module Summary:** Initial project setup, dependency installation, entry point configuration, deep linking, and project verification.

**🔗 Cross-References:**
- Folder structure → `02-routing-basics.md`
- Navigation implementation → `03-api-navigation.md`
- Authentication setup → `06-auth-protected-routes.md`

---

## Quick Start (Recommended)

### Create New Project with Expo Router

```bash
npx create-expo-app@latest my-app
cd my-app
npm start
```

This command:
- ✅ Creates a new Expo project with Expo Router **pre-installed**
- ✅ Configures `package.json` entry point automatically
- ✅ Sets up `app/_layout.tsx` as root layout
- ✅ Includes all required peer dependencies

**Official Source:** https://docs.expo.dev/router/installation/

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

Modify `package.json`:

```json
{
  "main": "expo-router/entry"
}
```

This tells Expo to load Expo Router's entry point instead of the default.

### Step 3: Create Root Layout

Create `app/_layout.tsx`:

```typescript
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
```

Your project structure should now look like:

```
project-root/
├── app/
│   └── _layout.tsx        // Root layout
│   └── index.tsx          // Home screen
├── package.json
└── babel.config.js
```

### Step 4: Update Babel Configuration

Ensure `babel.config.js` uses the Expo preset:

```javascript
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
  };
};
```

If your file is missing, create it with the above content.

### Step 5: Clear Cache & Start

```bash
npx expo start --clear
```

Press:
- `w` for web
- `i` for iOS (requires macOS + Xcode)
- `a` for Android (requires Android Studio)

**Official Source:** https://docs.expo.dev/router/installation/

---

## Deep Linking Configuration

### Configure Scheme in app.json

Add a unique scheme that identifies your app in deep links:

```json
{
  "expo": {
    "scheme": "myapp",
    "plugins": ["expo-router"]
  }
}
```

**Examples of deep links with this scheme:**
- `myapp://home`
- `myapp://profile/123`
- `myapp://feed?sort=latest`

### Web Platform Setup

For web development, enable Metro bundler:

```json
{
  "expo": {
    "web": {
      "bundler": "metro"
    }
  }
}
```

Then install web dependencies:

```bash
npx expo install react-native-web react-dom
```

**⚠️ Note:** Web uses client-side routing. For server-side rendering or SSG, deploy to Vercel, Netlify, or Expo Static.

### Custom Entry Point (Optional)

For initializing global services before app load:

**Create `index.js` in project root:**

```javascript
// Initialize analytics
import * as Analytics from './services/analytics';
Analytics.initialize();

// Setup error tracking
import * as Sentry from '@sentry/react-native';
Sentry.init({
  dsn: process.env.SENTRY_DSN,
});

// ⚠️ MUST be last import
import 'expo-router/entry';
```

**Update `package.json`:**

```json
{
  "main": "index.js"
}
```

**Official Source:** https://docs.expo.dev/router/installation/

---

## Verify Installation

### Test Navigation

Create `app/index.tsx`:

```typescript
import { Link } from 'expo-router';
import { View, Text, Pressable } from 'react-native';

export default function Home() {
  return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <Text style={{ fontSize: 20, marginBottom: 16 }}>
        Expo Router Installed ✅
      </Text>
      <Link href="/about" asChild>
        <Pressable>
          <Text style={{ color: '#0a7ea4', fontSize: 16 }}>
            Go to About →
          </Text>
        </Pressable>
      </Link>
    </View>
  );
}
```

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
        <Text style={{ color: '#0a7ea4', marginTop: 16 }}>← Go Back</Text>
      </Pressable>
    </View>
  );
}
```

### Expected Behavior

1. App launches to Home screen
2. Click "Go to About" → navigates to `/about`
3. Click "Go Back" → returns to Home
4. Deep link test: `myapp://about` → should open About directly

**🎯 If all three work, installation is complete!**

---

## TypeScript Setup (Recommended)

Expo Router generates automatic type definitions. No additional setup required—types work out of the box.

### Verify TypeScript Types

Create `app/[id].tsx` (dynamic route):

```typescript
import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function Details() {
  // TypeScript automatically knows `id` is a string
  const { id } = useLocalSearchParams<{ id: string }>();
  
  return (
    <View>
      <Text>ID: {id}</Text>
    </View>
  );
}
```

**TypeScript automatically:**
- ✅ Suggests valid route names in `href`
- ✅ Types route parameters correctly
- ✅ Catches broken links at compile time

**Official Source:** https://github.com/expo/router#type-safety

---

## Common Setup Issues

### Issue: "Cannot find module 'expo-router'"

**Solution:**
```bash
npx expo install expo-router
npm start -- --clear
```

---

### Issue: App shows blank white screen

**Solution:**

Ensure `app/_layout.tsx` exists and exports a valid component:

```typescript
import { Stack } from 'expo-router';

export default function RootLayout() {
  return <Stack />;
}
```

Clear cache:
```bash
rm -rf .expo
npx expo start --clear
```

---

### Issue: Deep links not working

**Verify:**

1. ✅ `scheme` is set in `app.json`
2. ✅ Route file exists (e.g., `app/about.tsx` for `/about`)
3. ✅ Project rebuilt after config changes:
   ```bash
   npm start -- --clear
   ```
4. ✅ On native: app is installed (uninstall and reinstall)

---

### Issue: "LogBox" warnings about modules

**Solution:**

Suppress in custom entry point:

```javascript
import { LogBox } from 'react-native';

// Suppress specific warnings
LogBox.ignoreLogs([
  'Non-serializable values',
  'Encountered two children with the same key',
]);

import 'expo-router/entry';
```

---

## Next Steps

1. **Explore routing:** Read `routing-basics.md` for folder structure patterns
2. **Build navigation UI:** Review `api-components.md` for Stack, Tabs, Drawer
3. **Add authentication:** See `auth-protected-routes.md` for login flows
4. **Setup deep linking:** Reference `deep-linking.md` for external link handling

---

## Troubleshooting Checklist

- [ ] `package.json` main field is set to `expo-router/entry` or custom entry file
- [ ] `app/_layout.tsx` exists and exports a valid React component
- [ ] `babel.config.js` uses `babel-preset-expo`
- [ ] All dependencies installed: `npx expo install ...` (not `npm install`)
- [ ] Cache cleared: `npx expo start --clear`
- [ ] For native apps: app reinstalled after config changes
- [ ] For web: Metro bundler enabled if targeting web platform

---

## Verification Commands

```bash
# Check all required files exist
ls app/_layout.tsx
ls app/index.tsx

# Verify package.json configuration
grep '"main"' package.json

# Check dependencies installed
npm ls expo-router react-native-safe-area-context

# Start fresh for testing
rm -rf node_modules/.cache .expo
npx expo start --clear
```

---

**Next Module:** `02-routing-basics.md` — File structure and routing conventions

**Source Documentation:** https://docs.expo.dev/router/installation/
