# React Native 0.83 - Modular Knowledge Base

**Master Index & Navigation Hub**

This modular knowledge base is organized for LLM context window efficiency. Use this index to navigate to specific modules relevant to your task.

---

## 📋 Quick Navigation

### Core Framework & Setup (Start Here)
- **[01-framework-overview.md](01-framework-overview.md)** — React Native architecture, core concepts, development model, and prerequisites for all platforms (macOS, Windows, Linux).

- **[02-quickstart-setup.md](02-quickstart-setup.md)** — Complete environment setup for macOS/Windows/Linux, device configuration, and initial project creation with TypeScript.

### Core Components & UI
- **[03-core-components.md](03-core-components.md)** — Essential React Native components: View, Text, ScrollView, FlatList, SectionList, Pressable, TextInput, Image with performance patterns.

### Native Integration
- **[04-native-modules.md](04-native-modules.md)** — Turbo Modules, type-safe native calls, Android (Java) and iOS (Swift) implementation patterns with complete examples.

### Data & Storage
- **[05-data-persistence.md](05-data-persistence.md)** — AsyncStorage, SecureStore for encrypted data, SQLite for complex queries, and best practices for data management.

### Navigation & Routing
- **[06-navigation.md](06-navigation.md)** — React Navigation setup, Stack navigation, Tab navigation, and deep linking patterns.

### Optimization & Best Practices
- **[07-best-practices.md](07-best-practices.md)** — Performance optimization (FlatList, memoization), security guidelines, accessibility (WCAG 2.1), One Hook Per Screen pattern, and common pitfalls.

- **[08-hermes-optimization.md](08-hermes-optimization.md)** — Hermes engine benefits, enabling on Android/iOS, ProGuard/R8 configuration, and bundle size analysis.

### Testing & Development
- **[09-testing-devtools.md](09-testing-devtools.md)** — React Native DevTools, Jest unit tests, Detox integration testing, and debugging strategies.

- **[10-upgrade-guide.md](10-upgrade-guide.md)** — Version upgrade process, breaking changes, compatibility checks, and migration guidance.

### Project Architecture (Bastion Monorepo)
- **[11-project-architecture.md](11-project-architecture.md)** — Project-specific patterns: NativeWind styling, Zustand stores, TanStack Query, feature modules, file placement rules, and naming conventions. **READ THIS FIRST for project work.**

---

## 🎯 Quick Reference by Use Case

### "I'm working on the Bastion mobile app" (START HERE)
→ **11-project-architecture.md** (NativeWind, Zustand, TanStack Query, One Hook Per Screen)

### "I'm new to React Native"
1. Start with **01-framework-overview.md**
2. Follow **02-quickstart-setup.md**
3. Learn **03-core-components.md**
4. Explore **06-navigation.md**
5. **Read 11-project-architecture.md** for project patterns

### "I need to set up environment on [macOS/Windows/Linux]"
→ **02-quickstart-setup.md** (platform-specific sections)

### "I want to build a UI with components"
→ **03-core-components.md** (View, Text, FlatList, etc. with performance tips)

### "I need to access native platform features"
→ **04-native-modules.md** (Turbo Modules with Java/Swift examples)

### "I need to store data locally"
→ **05-data-persistence.md** (AsyncStorage, SecureStore, SQLite comparison)

### "I need to add navigation between screens"
→ **06-navigation.md** (Stack, Tab, Deep Linking patterns)

### "My app is slow or I need optimization"
→ **07-best-practices.md** (FlatList, memoization, performance patterns)

### "I want to understand Hermes and build optimization"
→ **08-hermes-optimization.md** (Setup, verification, bundle analysis)

### "I need to test my app"
→ **09-testing-devtools.md** (Unit tests, integration tests, debugging)

### "I want to upgrade React Native version"
→ **10-upgrade-guide.md** (0.82 → 0.83, compatibility, steps)

### "How should I style components in this project?"
→ **11-project-architecture.md** (NativeWind, NOT StyleSheet.create)

### "How should I structure a new feature?"
→ **11-project-architecture.md** (Feature modules, One Hook Per Screen)

### "What state management should I use?"
→ **11-project-architecture.md** (Zustand for client, TanStack Query for server)

---

## 📊 Module Dependency Graph

```
11-project-architecture (PROJECT PATTERNS - READ FIRST)
  │
  └→ 01-framework-overview (Foundation)
      ├→ 02-quickstart-setup (Environment & Project)
      │   ├→ 03-core-components (UI Building)
      │   ├→ 06-navigation (Navigation Setup)
      │   ├→ 04-native-modules (Native Integration)
      │   └→ 05-data-persistence (Data Management)
      │
      ├→ 07-best-practices (Performance & Security + One Hook Per Screen)
      │   ├→ 08-hermes-optimization (Build Optimization)
      │   └→ 09-testing-devtools (Testing)
      │
      └→ 10-upgrade-guide (Version Upgrades)
```

---

## 📝 Content Schema Explanation

Each module follows a consistent structure:

### Setup Modules (01, 02)
- **Overview** — What is this and why does it matter?
- **Prerequisites** — What you need before starting
- **Step-by-Step Instructions** — Clear numbered steps
- **Verification** — How to confirm success
- **Troubleshooting** — Common issues and fixes

### Component Modules (03, 06)
- **Overview & Use Cases** — What does this component do?
- **Basic Usage** — Simple example with props
- **Common Props** — Frequently used properties with types
- **Performance Patterns** — Optimization tips
- **Best Practices** — Do's and don'ts

### API Reference Modules (04, 05)
- **Installation** — Required packages and setup
- **Core Methods** — Each includes:
  - Description and use case
  - Parameters (typed, with examples)
  - Return values and types
  - Complete code example
- **Common Patterns** — Real-world scenarios
- **Best Practices** — Performance and security guidance

### Best Practices Modules (07, 08, 09)
- **Core Concept** — The principle explained
- **Implementation** — How to do it correctly
- **Good vs. Bad Examples** — Code comparisons
- **Performance Impact** — Why it matters
- **Common Mistakes** — What to avoid

---

## 🔗 Cross-References

Throughout each module:
- **See: [Module Name](path)** — Related content
- **Prerequisite: [Module Name](path)** — Required reading
- **Compare: [Module Name](path)** — Similar concepts

---

## 📚 Source Attribution

All content is sourced from:
- **Official Docs**: https://reactnative.dev/
- **Latest Version**: React Native 0.83 (December 2025)
- **Platform Support**: iOS, Android, macOS, Linux, Windows

Each module is verified against official React Native documentation.

---

## 🚀 How to Use This Knowledge Base

### For Development Teams
1. **Onboarding**: Direct developers to 01 → 02 → 03 → 06
2. **Reference**: Use specific modules (e.g., 05, 08) as needed
3. **Architecture**: Review dependency graph before major design decisions

### For LLM/RAG Integration
1. **Load modules selectively** based on task intent
2. **Each module is self-contained** with minimal external dependencies
3. **Use cross-references** to pull related context as needed
4. **Modules are chunked for token efficiency** (target: 2500-4000 tokens each)

### For Quick Lookup
- Use the quick reference section to find your use case
- Each module title clearly states its scope
- Use ## and ### headings for section navigation

---

**Last Updated**: December 2025
**React Native Version**: 0.83 (Latest Stable)
**Status**: ✅ Complete & Production Ready
**Maintainer**: RAG Knowledge Base
