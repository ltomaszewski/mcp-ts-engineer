# 01 -- Framework Overview & SDK 55

Expo is a framework built on React Native for developing universal iOS, Android, and web apps from a single TypeScript codebase. SDK 55 ships with React Native 0.83.4, React 19.2, New Architecture MANDATORY, and React Compiler enabled by default.

---

## What is Expo?

Expo provides:
1. **Single codebase** -- Write TypeScript once, run on iOS, Android, and web
2. **100+ SDK modules** -- Camera, location, file system, secure storage, notifications
3. **Managed builds** -- EAS Build handles code signing, provisioning, native compilation
4. **OTA updates** -- Push JS/asset updates without app store review via EAS Update
5. **File-based routing** -- Expo Router brings Next.js-style routing to React Native

---

## SDK 55 Release Highlights

### Version Matrix

| Dependency | Version |
|------------|---------|
| Expo SDK | ~55.0.8 |
| React Native | 0.83.4 |
| React | 19.2.0 |
| Hermes | Default JS engine (JSC removed) |
| Minimum Node | 20.19.4 |
| Minimum Xcode | 16.1 (Xcode 26 recommended) |
| Android target | API 36 (Android 16) |
| expo-splash-screen | ~55.0.12 |
| expo-constants | ~55.0.9 |
| expo-font | ~55.0.4 |
| expo-linking | ~55.0.8 |
| expo-system-ui | ~55.0.10 (NEW) |
| expo-router | ~55.0.7 (versioned with SDK) |

### Breaking Changes

| Change | Migration |
|--------|-----------|
| **New Architecture MANDATORY** | `newArchEnabled: false` no longer works; all code must be New Architecture compatible |
| **React Compiler default** | `experiments.reactCompiler: true` in app.config.ts; avoid manual `useMemo`/`useCallback` |
| `expo-av` removed | Migrate to `expo-audio` and `expo-video` (deprecated since SDK 54) |
| `expo-file-system` OOP API is default | Legacy API still at `expo-file-system/legacy` |
| Android edge-to-edge mandatory | Cannot disable; use `react-native-safe-area-context` |
| React Native `<SafeAreaView>` deprecated | Use `<SafeAreaView>` from `react-native-safe-area-context` |
| expo-router versioning | Now `~55.0.7` instead of `~6.x` semver |
| headless tabs `reset` prop | Renamed to `resetOnFocus` |
| `ExpoRequest`/`ExpoResponse` | Removed from expo-router server exports |

### New and Stabilized APIs

| API | Status | Description |
|-----|--------|-------------|
| `expo-system-ui` | New (55.0.10) | Manage system UI background color and navigation bar styling |
| `expo-file-system` (OOP) | Stable | Object-oriented File/Directory/Paths API |
| `expo-glass-effect` | Stable | `<GlassView>` and `<GlassContainer>` for iOS Liquid Glass |
| `expo-app-integrity` | Stable | DeviceCheck (iOS) and Play Integrity (Android) |
| `expo/blob` | Stable | W3C-compliant binary object handling |

### React Compiler (New Default)

SDK 55 enables React Compiler by default for automatic memoization:

```typescript
// app.config.ts — already included in new projects
export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  experiments: {
    reactCompiler: true, // enabled by default in SDK 55
  },
});
```

With React Compiler active: avoid manual `useMemo`, `useCallback`, and `memo()` unless profiling shows a need. The compiler handles memoization automatically.

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

### File-Based Routing (Expo Router ~55.0.7 / v7)

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

Each file in `app/` automatically becomes a route. Expo Router v7 (SDK 55) adds:
- Declarative `<Stack.Header>` and `<Stack.Screen.Title>` components
- Native tabs with Material Design 3 (Android) and SF Symbols (iOS)
- Apple Zoom transition via `withAppleZoom`
- `typedRoutes: true` enabled by default
- `reset` prop on headless tabs renamed to `resetOnFocus`
- `ExpoRequest`/`ExpoResponse` removed from server exports

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
  // newArchEnabled: true is no longer needed — New Architecture is MANDATORY in SDK 55
  plugins: ['expo-router', 'expo-secure-store', 'expo-system-ui'],
  experiments: { reactCompiler: true, typedRoutes: true }, // both enabled by default in SDK 55
});
```

Dynamic configs cannot use Promises -- all resolution must be synchronous.

### New Architecture (MANDATORY in SDK 55)

SDK 55 makes New Architecture **mandatory**. `newArchEnabled: false` is no longer supported. This includes:
- **TurboModules**: Lazy-loaded native modules with JSI (no bridge)
- **Fabric Renderer**: Concurrent rendering with React 19.2
- **Codegen**: Type-safe native module interfaces from TypeScript specs

Impact:
- Reanimated v4 is required (v3 only supports old architecture)
- JSC is no longer bundled -- Hermes is the only JS engine
- All Expo SDK modules support New Architecture
- Third-party libraries that haven't migrated will not work
- React Compiler (`experiments.reactCompiler: true`) is enabled by default alongside New Architecture

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

**Version:** Expo SDK 55 (~55.0.8) | React Native 0.83.4 | React 19.2.0 | **Source:** https://docs.expo.dev/get-started/introduction/, https://expo.dev/changelog/sdk-55
