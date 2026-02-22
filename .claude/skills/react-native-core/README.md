# React Native 0.81.5 -- Knowledge Base

Complete engineering reference for React Native 0.81.5 with React 19.1.0, New Architecture (default), and Hermes engine.

---

## Modules

### Foundation

| File | Topic | When to Use |
|------|-------|-------------|
| [SKILL.md](SKILL.md) | Entry point, critical rules, core patterns | First file to read |
| [00-master-index.md](00-master-index.md) | Navigation hub, dependency graph | Finding the right module |
| [01-framework-overview.md](01-framework-overview.md) | Architecture (JSI, Fabric, TurboModules, Hermes) | Understanding how React Native works |
| [02-quickstart-setup.md](02-quickstart-setup.md) | Environment setup, project creation | Setting up a new project |

### Components and APIs

| File | Topic | When to Use |
|------|-------|-------------|
| [03-core-components.md](03-core-components.md) | View, Text, Image, FlatList, Pressable, TextInput, StyleSheet | Building user interfaces |
| [04-native-modules.md](04-native-modules.md) | TurboModules, Codegen, Kotlin/Obj-C++ implementations | Accessing native platform features |
| [05-data-persistence.md](05-data-persistence.md) | AsyncStorage, SecureStore, SQLite | Storing data on device |
| [06-navigation.md](06-navigation.md) | React Navigation 7.x: Stack, Tab, Deep Linking, Auth | Multi-screen app routing |

### Quality and Operations

| File | Topic | When to Use |
|------|-------|-------------|
| [07-best-practices.md](07-best-practices.md) | Performance, security, accessibility, pitfalls | Writing production-quality code |
| [08-hermes-optimization.md](08-hermes-optimization.md) | Hermes engine, ProGuard/R8, bundle size, startup | Optimizing app performance and size |
| [09-testing-devtools.md](09-testing-devtools.md) | Jest, RNTL, Detox, DevTools, debugging | Testing and debugging apps |
| [10-upgrade-guide.md](10-upgrade-guide.md) | 0.80 to 0.81 migration, React 19.1 features | Upgrading React Native version |

### Project Architecture

| File | Topic | When to Use |
|------|-------|-------------|
| [11-project-architecture.md](11-project-architecture.md) | Monorepo patterns, feature modules, NativeWind, Zustand | Structuring app projects |

---

## Version Information

| Dependency | Version |
|------------|---------|
| React Native | 0.81.5 |
| React | 19.1.0 |
| Hermes | Default engine |
| New Architecture | Default (Fabric + TurboModules) |
| Node.js | 20.19.4+ required |
| Xcode | 16.1+ required |
| TypeScript | ^5.9.3 |

---

## Quick Start Paths

### New to React Native

1. [01-framework-overview.md](01-framework-overview.md) -- understand the architecture
2. [02-quickstart-setup.md](02-quickstart-setup.md) -- set up your environment
3. [03-core-components.md](03-core-components.md) -- build your first UI
4. [06-navigation.md](06-navigation.md) -- add multi-screen routing
5. [07-best-practices.md](07-best-practices.md) -- learn production patterns

### Building a Feature

1. [00-master-index.md](00-master-index.md) -- find the relevant module
2. Load the specific module (e.g., [05-data-persistence.md](05-data-persistence.md))
3. Follow the code examples with TypeScript types and imports

### Optimizing an App

1. [07-best-practices.md](07-best-practices.md) -- FlatList tuning, memoization
2. [08-hermes-optimization.md](08-hermes-optimization.md) -- bundle size, startup time
3. [09-testing-devtools.md](09-testing-devtools.md) -- profiling and measurement

### Upgrading React Native

1. [10-upgrade-guide.md](10-upgrade-guide.md) -- breaking changes, step-by-step migration

---

## Module Dependencies

```
01-framework-overview (Foundation)
  ├── 02-quickstart-setup (Environment)
  │   ├── 03-core-components (UI)
  │   ├── 04-native-modules (Native)
  │   ├── 05-data-persistence (Data)
  │   └── 06-navigation (Routing)
  │
  ├── 07-best-practices (Quality)
  │   ├── 08-hermes-optimization (Performance)
  │   ├── 09-testing-devtools (Testing)
  │   └── 10-upgrade-guide (Maintenance)
  │
  └── 11-project-architecture (Monorepo Patterns)
```

---

## Sources

All content sourced from official documentation:

- React Native: https://reactnative.dev/docs/
- React 19: https://react.dev/
- Hermes Engine: https://hermesengine.dev/
- React Navigation: https://reactnavigation.org/
- Metro Bundler: https://metrobundler.dev/

---

**Version:** React Native 0.81.5 | React 19.1.0 | Hermes (default) | New Architecture (default)
