# Expo Core: Master Index & Navigation Hub

Complete engineering reference for Expo SDK 55 (React Native 0.83.4, React 19.2.0). Load specific modules based on task requirements.

---

## Module Map

### Core Framework & Setup

| Module | Scope | When to Load |
|--------|-------|--------------|
| [01-framework-overview.md](01-framework-overview.md) | Architecture, SDK 55 changes, New Architecture (mandatory), development loop | Understanding Expo's mental model or SDK 55 migration |
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

## SDK 55 Key Changes

| Area | Change | Impact |
|------|--------|--------|
| React Native | 0.83.4 | Performance improvements, bug fixes |
| React | 19.2.0 | Improved concurrent features |
| New Architecture | **MANDATORY** (cannot be disabled) | `newArchEnabled: false` no longer works |
| React Compiler | Enabled by default (`experiments.reactCompiler: true`) | Automatic memoization, no manual `useMemo`/`useCallback` needed |
| expo-system-ui | New: ~55.0.10 | Manage system UI colors and background |
| expo-splash-screen | Updated to ~55.0.12 | Enhanced splash configuration |
| expo-constants | Updated to ~55.0.9 | Latest platform constants |
| expo-font | Updated to ~55.0.4 | Font loading improvements |
| expo-linking | Updated to ~55.0.8 | Deep linking enhancements |
| expo-router | Now versioned with SDK (~55.0.7) | Expo Router v7 internals |
| FileSystem | `/next` API is default (since SDK 54) | Import from `expo-file-system` directly |

---

## Content Schema

Each API module follows a consistent structure:
- **Installation** -- `npx expo install` command
- **Core Methods** -- Parameters table, return type, TypeScript example
- **Types & Interfaces** -- Key type definitions
- **Usage Patterns** -- 20-50 line production-ready examples
- **Footer** -- Version and source URL

---

**Version:** Expo SDK 55 (~55.0.8) | React Native 0.83.4 | React 19.2.0
**Source:** https://docs.expo.dev
