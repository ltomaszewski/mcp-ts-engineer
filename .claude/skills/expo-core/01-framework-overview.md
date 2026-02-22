# 01 -- Framework Overview & SDK 54

Expo is a framework built on React Native for developing universal iOS, Android, and web apps from a single TypeScript codebase. SDK 54 ships with React Native 0.81.5, React 19.1, and New Architecture enabled by default.

---

## What is Expo?

Expo provides:
1. **Single codebase** -- Write TypeScript once, run on iOS, Android, and web
2. **100+ SDK modules** -- Camera, location, file system, secure storage, notifications
3. **Managed builds** -- EAS Build handles code signing, provisioning, native compilation
4. **OTA updates** -- Push JS/asset updates without app store review via EAS Update
5. **File-based routing** -- Expo Router brings Next.js-style routing to React Native

---

## SDK 54 Release Highlights

### Version Matrix

| Dependency | Version |
|------------|---------|
| Expo SDK | ~54.0.33 |
| React Native | 0.81.5 |
| React | 19.1.0 |
| Metro | 0.83 |
| Hermes | Default JS engine (JSC removed) |
| Minimum Node | 20.19.4 |
| Minimum Xcode | 16.1 (Xcode 26 recommended) |
| Android target | API 36 (Android 16) |

### Breaking Changes

| Change | Migration |
|--------|-----------|
| New Architecture default | Reanimated v4 required (v3 for legacy). JSC no longer built-in |
| `expo-file-system` default is new OOP API | Legacy API available via `expo-file-system/legacy` |
| Android edge-to-edge mandatory | Cannot disable; use `react-native-safe-area-context` |
| React Native `<SafeAreaView>` deprecated | Use `<SafeAreaView>` from `react-native-safe-area-context` |
| `expo-av` deprecated (removed in SDK 55) | Migrate to `expo-audio` and `expo-video` |
| Metro internal imports changed | `metro/src/..` becomes `metro/private/..` |
| `@expo/vector-icons` updated | May affect TypeScript type checks |

### New and Stabilized APIs

| API | Status | Description |
|-----|--------|-------------|
| `expo-file-system` (OOP) | Stable | Object-oriented File/Directory/Paths API, formerly `/next` |
| `expo-glass-effect` | New | `<GlassView>` and `<GlassContainer>` for iOS Liquid Glass |
| `expo-app-integrity` | New | DeviceCheck (iOS) and Play Integrity (Android) verification |
| `expo/blob` | Beta | W3C-compliant binary object handling |
| `expo-sqlite` extensions | New | `loadExtensionAsync()` for SQLite extensions |
| `expo-sqlite` localStorage | New | Drop-in `localStorage` web API implementation |
| `expo-maps` styling | New | JSON and Google Cloud map styling support |

### Performance Improvements

- **Precompiled XCFrameworks**: iOS clean build times reduced from ~120s to ~10s on M4 Max
- **React Compiler**: Enabled in default template for automatic memoization
- **Import stack traces**: Enabled by default for easier debugging
- **`experimentalImportSupport`**: Default on for tree-shaking and React Compiler

---

## Development Loop

```
Code (TypeScript)
  |
  +-> npx expo start (Expo CLI + Metro bundler)
  |     +-> Fast Refresh on file change
  |     +-> Preview in Expo Go, simulator, or dev client
  |
  +-> npx expo prebuild (generate native iOS/Android dirs)
  |     +-> Config plugins applied
  |     +-> Custom native code possible
  |
  +-> eas build (cloud) or eas build --local
  |     +-> Signed .ipa (iOS) or .aab/.apk (Android)
  |
  +-> eas submit (automated store submission)
  +-> eas update (OTA JS/asset updates)
```

---

## Core Concepts

### File-Based Routing (Expo Router v6)

```
app/
  _layout.tsx          # Root navigation container
  index.tsx            # Home screen (/)
  profile.tsx          # Profile screen (/profile)
  [id].tsx             # Dynamic route (/user/123)
  (auth)/
    _layout.tsx        # Auth group layout
    login.tsx          # /login
    signup.tsx         # /signup
```

Each file in `app/` automatically becomes a route. Expo Router v6 (SDK 54) adds:
- iOS view controller previews and context menus on `<Link>`
- Native tabs beta with Liquid Glass support
- Web modals emulating iPad/iPhone behavior
- Experimental server middleware

### App Configuration

Static `app.json` or dynamic `app.config.ts` for app metadata, plugins, and build settings.

```typescript
// app.config.ts -- dynamic configuration with TypeScript
import { ExpoConfig, ConfigContext } from 'expo/config';

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'MyApp',
  slug: 'my-app',
  version: '1.0.0',
  newArchEnabled: true, // default in SDK 54
  plugins: ['expo-router', 'expo-secure-store'],
});
```

Dynamic configs cannot use Promises -- all resolution must be synchronous.

### New Architecture (Default in SDK 54)

SDK 54 enables New Architecture by default (`newArchEnabled: true`). This includes:
- **TurboModules**: Lazy-loaded native modules with JSI (no bridge)
- **Fabric Renderer**: Concurrent rendering with React 19.1
- **Codegen**: Type-safe native module interfaces from TypeScript specs

Impact:
- Reanimated v4 is required (v3 only supports old architecture)
- JSC is no longer bundled -- Hermes is the only JS engine
- All Expo SDK modules support New Architecture

### Platform-Specific Code

```typescript
import { Platform } from 'react-native';

const styles = {
  padding: Platform.select({ ios: 20, android: 16, default: 24 }),
};

// Or file-based: Component.ios.tsx, Component.android.tsx, Component.web.tsx
```

---

## Expo Application Services (EAS)

| Service | Purpose |
|---------|---------|
| **EAS Build** | Cloud compilation, code signing, provisioning profiles |
| **EAS Submit** | Automated App Store and Google Play submission |
| **EAS Update** | OTA JavaScript and asset updates without store review |
| **EAS Metadata** | Centralized store listing management in JSON |
| **EAS Workflows** | YAML-based CI/CD with parallel builds and conditional steps |

---

## Key Project Files

```
my-app/
  app/                   # File-based routing (Expo Router)
    _layout.tsx
    index.tsx
  app.json               # Static config (or app.config.ts for dynamic)
  eas.json               # EAS build profiles
  metro.config.js        # Metro bundler configuration
  tsconfig.json          # TypeScript configuration
  package.json           # Dependencies and scripts
  .env                   # Environment variables (gitignored)
```

---

## When to Use Expo vs Plain React Native

| Use Expo (default choice) | Consider Plain RN |
|---------------------------|-------------------|
| Greenfield projects | Deeply custom native code not supported by Expo Modules API |
| Cross-platform (iOS + Android + Web) | Proprietary native SDKs with no Expo wrapper |
| Teams without native expertise | Existing plain RN project with heavy native dependencies |
| Rapid prototyping and MVPs | Performance-critical games (use game engines) |
| Need OTA updates and managed builds | |

---

## Terminology

| Term | Meaning |
|------|---------|
| **Expo Go** | Pre-built dev app for instant previewing on iOS/Android |
| **Dev Client** | Custom development build with your native modules |
| **Prebuild** | Generate native iOS/Android dirs from app.json + config plugins |
| **Config Plugin** | Declarative native configuration in app.json `plugins` array |
| **EAS Build** | Cloud build service producing signed binaries |
| **EAS Update** | Push JS/asset changes without app store review |

---

**Version:** Expo SDK 54 (~54.0.33) | React Native 0.81.5 | React 19.1.0 | **Source:** https://docs.expo.dev/get-started/introduction/, https://expo.dev/changelog/sdk-54
