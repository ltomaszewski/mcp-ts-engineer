# React Native 0.83.4 -- Master Index

Navigation hub for the react-native-core skill knowledge base.

---

## Quick Navigation

### Foundation
- **[01-framework-overview.md](01-framework-overview.md)** -- Architecture (JSI, Fabric, TurboModules), New Architecture as mandatory, Hermes engine, Metro bundler, platform support.
- **[02-quickstart-setup.md](02-quickstart-setup.md)** -- Environment setup (macOS/Windows/Linux), project creation via CLI, first run, device configuration.

### Core Components & UI
- **[03-core-components.md](03-core-components.md)** -- View, Text, Image, ScrollView, FlatList, SectionList, TextInput, Pressable, Modal, ActivityIndicator, Switch, KeyboardAvoidingView, StatusBar, RefreshControl. Full prop tables and performance patterns.

### Native Integration
- **[04-native-modules.md](04-native-modules.md)** -- Turbo Native Modules: TypeScript spec, Codegen, Android (Kotlin/Java), iOS (Objective-C++), cross-platform C++ modules.

### Data & Storage
- **[05-data-persistence.md](05-data-persistence.md)** -- AsyncStorage, SecureStore (Keychain/EncryptedSharedPreferences), SQLite. Comparison table and security guidance.

### Navigation
- **[06-navigation.md](06-navigation.md)** -- React Navigation: Stack, Tab, Drawer navigators. Deep linking, auth flow patterns, TypeScript typing.

### Quality & Performance
- **[07-best-practices.md](07-best-practices.md)** -- FlatList optimization, memoization, accessibility (WCAG 2.1), security, common pitfalls with fixes.
- **[08-hermes-optimization.md](08-hermes-optimization.md)** -- Hermes engine (default), bytecode precompilation, ProGuard/R8, bundle analysis, size reduction.

### Testing & DevTools
- **[09-testing-devtools.md](09-testing-devtools.md)** -- React Native DevTools, Jest + React Native Testing Library, Detox E2E, performance profiling.

### Maintenance
- **[10-upgrade-guide.md](10-upgrade-guide.md)** -- Upgrade from 0.81 to 0.83, breaking changes (New Architecture mandatory, Bridgeless mode), React 19.2 features.

### Project Patterns
- **[11-project-architecture.md](11-project-architecture.md)** -- Monorepo patterns: NativeWind, Zustand, TanStack Query, Expo Router, feature modules, One Hook Per Screen.

### Platform-Specific Fixes
- **[12-ios-text-clipping.md](12-ios-text-clipping.md)** -- iOS TextInput descender clipping when NativeWind sets lineHeight.

---

## By Use Case

| I need to... | Load |
|--------------|------|
| Understand RN architecture | 01-framework-overview.md |
| Set up dev environment | 02-quickstart-setup.md |
| Build UI with core components | 03-core-components.md |
| Access native platform APIs | 04-native-modules.md |
| Store data locally | 05-data-persistence.md |
| Add screen navigation | 06-navigation.md |
| Optimize performance | 07-best-practices.md + 08-hermes-optimization.md |
| Test my app | 09-testing-devtools.md |
| Upgrade RN version | 10-upgrade-guide.md |
| Structure a feature module | 11-project-architecture.md |
| Fix iOS text clipping | 12-ios-text-clipping.md |

---

## Module Dependency Graph

```
01-framework-overview (Foundation)
  ├── 02-quickstart-setup (Environment)
  │   ├── 03-core-components (UI)
  │   ├── 04-native-modules (Native)
  │   ├── 05-data-persistence (Storage)
  │   └── 06-navigation (Routing)
  │
  ├── 07-best-practices (Quality)
  │   ├── 08-hermes-optimization (Build)
  │   └── 09-testing-devtools (Testing)
  │
  ├── 10-upgrade-guide (Maintenance)
  └── 11-project-architecture (Project Patterns)
```

---

## Version Info

| Dependency | Version |
|------------|---------|
| React Native | 0.83.4 |
| React | 19.2.0 |
| TypeScript | ^5.9.3 |
| Node.js | 24+ (minimum 20.19.4) |
| Hermes | Default engine |
| New Architecture | Mandatory (legacy removed) |

---

**Version:** React Native 0.83.4 | React 19.2.0 | Hermes (default) | New Architecture (mandatory)
**Source:** https://reactnative.dev/docs/components-and-apis
