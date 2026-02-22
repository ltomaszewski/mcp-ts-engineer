# Expo Core: Master Index & Navigation Hub

Complete engineering reference for Expo SDK 54 (React Native 0.81.5, React 19.1.0). Load specific modules based on task requirements.

---

## Module Map

### Core Framework & Setup

| Module | Scope | When to Load |
|--------|-------|--------------|
| [01-framework-overview.md](01-framework-overview.md) | Architecture, SDK 54 changes, New Architecture, development loop | Understanding Expo's mental model or SDK 54 migration |
| [02-quickstart-setup.md](02-quickstart-setup.md) | Project creation, app.json config, env vars, CLI commands | Setting up projects or configuring app settings |

### SDK API References

| Module | Scope | When to Load |
|--------|-------|--------------|
| [03-api-app-lifecycle.md](03-api-app-lifecycle.md) | Constants, SplashScreen, Linking, Updates | App initialization, deep linking, OTA updates |
| [04-api-data-storage.md](04-api-data-storage.md) | FileSystem, SecureStore, Asset, Font | File I/O, encrypted storage, asset/font loading |
| [05-api-device-access.md](05-api-device-access.md) | Camera, ImagePicker, Location, Sensors, Permissions | Device hardware access and permission handling |

---

## Quick Reference by Task

### "I need to create or configure an Expo project"
1. [02-quickstart-setup.md](02-quickstart-setup.md) -- project creation, app.json, env vars
2. [01-framework-overview.md](01-framework-overview.md) -- architecture context

### "I need to read app config or system info at runtime"
1. [03-api-app-lifecycle.md](03-api-app-lifecycle.md) -- Constants API

### "I need to handle deep links or URL schemes"
1. [03-api-app-lifecycle.md](03-api-app-lifecycle.md) -- Linking API
2. [02-quickstart-setup.md](02-quickstart-setup.md) -- scheme config in app.json

### "I need to manage splash screen visibility"
1. [03-api-app-lifecycle.md](03-api-app-lifecycle.md) -- SplashScreen API

### "I need to push OTA updates to users"
1. [03-api-app-lifecycle.md](03-api-app-lifecycle.md) -- Updates API
2. [02-quickstart-setup.md](02-quickstart-setup.md) -- updates config in app.json

### "I need to read/write files on device"
1. [04-api-data-storage.md](04-api-data-storage.md) -- FileSystem (OOP API)

### "I need to store secrets or tokens securely"
1. [04-api-data-storage.md](04-api-data-storage.md) -- SecureStore API

### "I need to load custom fonts or bundled assets"
1. [04-api-data-storage.md](04-api-data-storage.md) -- Font and Asset APIs

### "I need camera, photos, or location access"
1. [05-api-device-access.md](05-api-device-access.md) -- Camera, ImagePicker, Location
2. [05-api-device-access.md](05-api-device-access.md) -- Permissions pattern

---

## Module Dependency Graph

```
01-framework-overview (Foundation)
  |
  +-> 02-quickstart-setup (Project Config)
  |     |
  |     +-> 03-api-app-lifecycle (Constants, SplashScreen, Linking, Updates)
  |     +-> 04-api-data-storage (FileSystem, SecureStore, Asset, Font)
  |     +-> 05-api-device-access (Camera, Location, Sensors, Permissions)
  |
  +-> All modules reference 02 for app.json plugin configuration
```

---

## SDK 54 Key Changes

| Area | Change | Impact |
|------|--------|--------|
| React Native | 0.81.5 with precompiled XCFrameworks | ~10s clean iOS builds (was ~120s) |
| React | 19.1 with React Compiler | Concurrent features, automatic memoization |
| New Architecture | Enabled by default | Reanimated v4 requires it; JSC removed |
| FileSystem | `/next` API promoted to default | Import from `expo-file-system` directly |
| Android | Targets API 36 (Android 16) | Edge-to-edge mandatory, cannot disable |
| expo-updates | `downloadProgress` in `useUpdates()` | Track asset download progress 0-1 |
| SplashScreen | `hide()` method added | Synchronous alternative to `hideAsync()` |
| Minimum Node | 20.19.4 | Older Node versions unsupported |
| Minimum Xcode | 16.1 | Required for iOS builds |

---

## Content Schema

Each API module follows a consistent structure:
- **Installation** -- `npx expo install` command
- **Core Methods** -- Parameters table, return type, TypeScript example
- **Types & Interfaces** -- Key type definitions
- **Usage Patterns** -- 20-50 line production-ready examples
- **Footer** -- Version and source URL

---

**Version:** Expo SDK 54 (~54.0.33) | React Native 0.81.5 | React 19.1.0
**Source:** https://docs.expo.dev
