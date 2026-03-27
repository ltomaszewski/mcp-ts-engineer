# 02 -- Project Setup & Configuration

Step-by-step project creation, app.json/app.config.ts configuration reference, environment variables, CLI commands, and development workflow for Expo SDK 55.

---

## Prerequisites

| Requirement | Version | Notes |
|-------------|---------|-------|
| Node.js | 20.19.4+ (24 recommended) | `node --version` to check |
| npm or yarn | Latest | Package manager |
| Xcode | 16.1+ (Xcode 26 recommended) | iOS builds only, macOS required |
| Android SDK | Platform 35+ | Via Android Studio SDK Manager |
| JDK | 17 (Azul Zulu recommended) | Android builds only |
| Watchman | Latest | Recommended for file watching performance |

---

## Create a Project

```bash
# Create with default template (includes Expo Router, TypeScript)
npx create-expo-app@latest my-app
cd my-app

# Install dependencies
npm install

# Start development server
npx expo start
```

### Project Structure

```
my-app/
  app/                         # File-based routing (Expo Router)
    _layout.tsx                # Root navigation layout
    index.tsx                  # Home screen (/)
    +not-found.tsx             # 404 screen
  assets/                      # Static assets (images, fonts)
  app.json                     # Expo configuration
  tsconfig.json                # TypeScript configuration
  package.json                 # Dependencies and scripts
```

---

## App Configuration Reference

### Static Config (app.json)

```json
{
  "expo": {
    "name": "My App",
    "slug": "my-app",
    "version": "1.0.0",
    "orientation": "portrait",
    "icon": "./assets/icon.png",
    "userInterfaceStyle": "automatic",
    "scheme": "myapp",
    "experiments": {
      "reactCompiler": true,
      "typedRoutes": true
    },
    "splash": {
      "image": "./assets/splash.png",
      "resizeMode": "contain",
      "backgroundColor": "#ffffff"
    },
    "ios": {
      "bundleIdentifier": "com.company.myapp",
      "buildNumber": "1",
      "supportsTablet": true,
      "infoPlist": {}
    },
    "android": {
      "package": "com.company.myapp",
      "versionCode": 1,
      "adaptiveIcon": {
        "foregroundImage": "./assets/adaptive-icon.png",
        "backgroundColor": "#ffffff"
      }
    },
    "web": {
      "bundler": "metro",
      "output": "single",
      "favicon": "./assets/favicon.png"
    },
    "plugins": ["expo-router", "expo-secure-store", "expo-system-ui"],
    "extra": {}
  }
}
```

### Top-Level Properties

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `name` | string | -- | App display name on home screen and Expo Go |
| `slug` | string | -- | URL-friendly unique identifier for Expo services |
| `version` | string | -- | Semantic version (also set `ios.buildNumber` / `android.versionCode`) |
| `orientation` | enum | `"default"` | `"portrait"`, `"landscape"`, or `"default"` |
| `icon` | string | -- | 1024x1024 PNG path for app icon |
| `userInterfaceStyle` | enum | `"light"` | `"light"`, `"dark"`, or `"automatic"` (follows system) |
| `scheme` | string/array | -- | URL scheme(s) for deep linking (e.g., `"myapp"` for `myapp://`) |
| `backgroundColor` | string | `"#ffffff"` | Root view background color (hex) |
| `newArchEnabled` | boolean | `true` | New Architecture is MANDATORY in SDK 55; this field is ignored — it cannot be disabled |
| `platforms` | array | `["ios","android"]` | Target platforms |
| `plugins` | array | -- | Config plugins for native module configuration |
| `extra` | object | -- | Custom data accessible via `Constants.expoConfig.extra` |

### iOS Properties (`ios`)

| Property | Type | Description |
|----------|------|-------------|
| `bundleIdentifier` | string | Unique bundle ID (e.g., `com.company.app`) |
| `buildNumber` | string | Corresponds to `CFBundleVersion` in Info.plist |
| `supportsTablet` | boolean | Enable iPad screen size support |
| `icon` | string/object | App icon or object with `light`/`dark`/`tinted` variants |
| `infoPlist` | object | Arbitrary Info.plist key-value pairs |
| `entitlements` | object | App entitlements (push, App Groups, etc.) |

### Android Properties (`android`)

| Property | Type | Description |
|----------|------|-------------|
| `package` | string | Unique package name for Play Store |
| `versionCode` | integer | Incremented integer for each Play Store release |
| `adaptiveIcon` | object | `foregroundImage`, `backgroundImage`, `monochromeImage`, `backgroundColor` |
| `permissions` | array | Permissions for AndroidManifest.xml (e.g., `["CAMERA"]`) |
| `googleServicesFile` | string | Path to `google-services.json` for Firebase |

### Web Properties (`web`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `bundler` | enum | `"metro"` | `"metro"` or `"webpack"` |
| `output` | enum | `"single"` | `"single"` (SPA), `"static"`, or `"server"` |
| `favicon` | string | -- | Path to favicon image |

### Splash Screen (`splash`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `image` | string | -- | Splash screen image path |
| `resizeMode` | enum | `"contain"` | `"contain"` or `"cover"` |
| `backgroundColor` | string | `"#ffffff"` | Background color (hex) |

### Updates (`updates`)

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| `enabled` | boolean | `true` | Enable OTA update system |
| `url` | string | -- | Update manifest URL (auto-set by EAS Update) |
| `checkAutomatically` | enum | `"ON_LOAD"` | `"ON_LOAD"`, `"ON_ERROR_RECOVERY"`, `"WIFI_ONLY"`, `"NEVER"` |
| `fallbackToCacheTimeout` | number | `0` | Ms to wait before falling back to cached update (0-300000) |

### Plugin Configuration

Plugins configure native settings declaratively:

```json
{
  "plugins": [
    "expo-camera",
    ["expo-location", {
      "locationAlwaysAndWhenInUsePermission": "Allow $(PRODUCT_NAME) to use your location"
    }],
    ["expo-secure-store", {
      "faceIDPermission": "Allow $(PRODUCT_NAME) to use Face ID"
    }]
  ]
}
```

---

## Dynamic Config (app.config.ts)

Use TypeScript for conditional, environment-aware configuration:

```typescript
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: process.env.APP_ENV === 'production' ? 'MyApp' : 'MyApp (Dev)',
  slug: 'my-app',
  version: '1.0.0',
  ios: {
    bundleIdentifier:
      process.env.APP_ENV === 'production'
        ? 'com.company.myapp'
        : 'com.company.myapp.dev',
  },
  android: {
    package:
      process.env.APP_ENV === 'production'
        ? 'com.company.myapp'
        : 'com.company.myapp.dev',
  },
  extra: {
    apiUrl: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3000',
  },
});
```

Key rules:
- Dynamic configs **cannot use Promises** -- all resolution is synchronous
- Static `app.json` is auto-updated by CLI tools; dynamic configs require manual changes
- Import `ExpoConfig` and `ConfigContext` from `'expo/config'` for type safety

---

## Environment Variables

### Setup

Create `.env` in project root (gitignored):

```bash
# Client-accessible (bundled into app)
EXPO_PUBLIC_API_URL=https://api.example.com
EXPO_PUBLIC_APP_ENV=development

# Server-only (API routes, build scripts)
SECRET_API_KEY=supersecret123
```

### Access in Code

```typescript
// Client code -- only EXPO_PUBLIC_ prefixed vars
const apiUrl = process.env.EXPO_PUBLIC_API_URL;

// API routes (Expo Router) -- all env vars available
export async function GET() {
  const secret = process.env.SECRET_API_KEY;
  return Response.json({ ok: true });
}
```

### Environment Files

| File | Purpose | Committed? |
|------|---------|------------|
| `.env` | Default values | No |
| `.env.local` | Local overrides | No |
| `.env.production` | Production values | Optional |
| `.env.development` | Development values | Optional |

---

## CLI Commands

### Development

| Command | Description |
|---------|-------------|
| `npx expo start` | Start dev server (Metro bundler) |
| `npx expo start --ios` | Start and open iOS Simulator |
| `npx expo start --android` | Start and open Android Emulator |
| `npx expo start --web` | Start and open web browser |
| `npx expo start --tunnel` | Use cloud relay (different networks) |
| `npx expo start --port 8081` | Custom port |
| `npx expo start --clear` | Clear Metro cache |

### Runtime Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `i` | Open iOS Simulator |
| `a` | Open Android Emulator |
| `w` | Open web browser |
| `r` | Reload app |
| `m` | Open Developer Menu |
| `j` | Open React DevTools |
| `q` | Quit |

### Build & Native

| Command | Description |
|---------|-------------|
| `npx expo prebuild` | Generate native iOS/Android directories |
| `npx expo prebuild --clean` | Regenerate native dirs from scratch |
| `npx expo install <package>` | Install with SDK-compatible version |
| `npx expo export` | Export static bundle for deployment |

### EAS CLI

| Command | Description |
|---------|-------------|
| `eas build --platform ios` | Cloud build for iOS |
| `eas build --platform android` | Cloud build for Android |
| `eas build --local` | Build on local machine |
| `eas submit --platform ios` | Submit to App Store |
| `eas submit --platform android` | Submit to Google Play |
| `eas update` | Push OTA update |

---

## Project Structure Best Practice

```
my-app/
  app/                         # Expo Router file-based routes
    _layout.tsx                # Root layout (navigation container)
    (auth)/                    # Auth route group
      _layout.tsx
      login.tsx
      signup.tsx
    (tabs)/                    # Tab route group
      _layout.tsx
      home.tsx
      profile.tsx
    [id].tsx                   # Dynamic route
  src/                         # Application source
    components/                # Reusable UI components
    hooks/                     # Custom React hooks
    services/                  # API clients, business logic
    stores/                    # Zustand/state stores
    types/                     # TypeScript type definitions
    constants/                 # App constants, theme tokens
  assets/                      # Static assets
    fonts/
    images/
  app.json                     # Expo configuration
  app.config.ts                # Dynamic config (optional)
  eas.json                     # EAS build profiles
  tsconfig.json
  package.json
  .env                         # Environment variables (gitignored)
```

---

## Troubleshooting

| Issue | Solution |
|-------|----------|
| Cannot connect to dev server | Try `npx expo start --tunnel` or ensure same network |
| Metro bundler timeout | `npx expo start --clear` to clear cache |
| Port already in use | `npx expo start --port 8081` |
| iOS Simulator not opening | Run `xcode-select --install` then press `i` |
| Android Emulator not found | Verify `emulator -list-avds` and start emulator first |
| Module not found after install | Run `npx expo start --clear` to reset Metro cache |
| Prebuild fails | `npx expo prebuild --clean` to regenerate native dirs |

---

**Version:** Expo SDK 55 (~55.0.8) | React Native 0.83.4 | React 19.2.0 | **Source:** https://docs.expo.dev/get-started/create-a-project/, https://docs.expo.dev/versions/latest/config/app/, https://docs.expo.dev/workflow/configuration/
