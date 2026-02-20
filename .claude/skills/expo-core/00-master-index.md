# Expo Framework: Modular Knowledge Base

**Master Index & Navigation Hub**

This modular knowledge base is designed for LLM context window efficiency. Use this index to navigate to specific modules relevant to your task.

---

## 📋 Quick Navigation

### Core Framework & Setup (Start Here)
- **[01-framework-overview.md](01-framework-overview.md)** — High-level Expo architecture, core concepts, and the mental model of the development loop. Covers file-based routing, EAS services, and universal app development.

- **[02-quickstart-setup.md](02-quickstart-setup.md)** — Step-by-step project creation, environment setup, local development, and running your app on simulators/devices.

### API & SDK Reference
- **[03-api-auth.md](03-api-auth.md)** — Authentication methods including AuthSession, OAuth/OIDC flows, WebBrowser integration, and Crypto utilities with complete method signatures.

- **[04-api-data-storage.md](04-api-data-storage.md)** — Data persistence and real-time solutions: AsyncStorage, Firebase JS SDK, React Native Firebase integration patterns.

- **[05-api-device-access.md](05-api-device-access.md)** — Device capabilities: Camera, Location/Geolocation, Maps, Permissions, and sensor access with typed parameters.

- **[06-api-networking.md](06-api-networking.md)** — Network operations: HTTP client patterns, API routes on web, WebBrowser module, and WebSocket support.

### Development Workflows & Guides
- **[07-guide-routing-navigation.md](07-guide-routing-navigation.md)** — Expo Router fundamentals, file-based routing, hooks API, authentication redirects, and testing strategies.

- **[08-guide-native-modules.md](08-guide-native-modules.md)** — Expo Modules API for building custom native modules, view components, and native code integration.

- **[09-guide-firebase-integration.md](09-guide-firebase-integration.md)** — Firebase integration patterns: JS SDK vs React Native Firebase, service setup, and best practices.

### Build, Deployment & Distribution
- **[10-guide-build-publish.md](10-guide-build-publish.md)** — Creating signed builds (APK/AAB), TestFlight deployment, web deployment, and local release builds.

- **[11-guide-eas-services.md](11-guide-eas-services.md)** — Expo Application Services (EAS) overview, build workflows, automation, and CI/CD integration.

### Quality & Operations
- **[12-guide-debugging-performance.md](12-guide-debugging-performance.md)** — Debugging tools (React Native DevTools, VS Code), profiling, memory inspection, and performance monitoring.

- **[13-best-practices-security.md](13-best-practices-security.md)** — Security guidelines, credential management, API key handling, and common security pitfalls.

- **[14-best-practices-performance.md](14-best-practices-performance.md)** — Performance optimization, code splitting, lazy loading, memory management, and bundle size reduction.

---

## 🎯 Quick Reference by Use Case

### "I'm new to Expo"
1. Start with **01-framework-overview.md**
2. Follow **02-quickstart-setup.md**
3. Explore **07-guide-routing-navigation.md**

### "I need to add authentication"
→ **03-api-auth.md** (complete method reference)
→ **13-best-practices-security.md** (security considerations)

### "I need to persist or sync data"
→ **04-api-data-storage.md** (all options with code examples)
→ **09-guide-firebase-integration.md** (Firebase setup)

### "I need to build and deploy to stores"
→ **10-guide-build-publish.md** (local builds)
→ **11-guide-eas-services.md** (automated EAS builds)

### "My app is slow or has memory issues"
→ **12-guide-debugging-performance.md** (debugging tools)
→ **14-best-practices-performance.md** (optimization patterns)

### "I need to add device capabilities (camera, location, etc.)"
→ **05-api-device-access.md** (all device APIs)

### "I'm building a backend for my app"
→ **06-api-networking.md** (HTTP patterns)
→ **11-guide-eas-services.md** (API routes on web)

---

## 📊 Module Dependency Graph

```
01-framework-overview (Foundation)
  ├→ 02-quickstart-setup (Project Setup)
  │   ├→ 07-guide-routing-navigation (App Structure)
  │   ├→ 03-api-auth.md (Auth Implementation)
  │   ├→ 04-api-data-storage.md (Data Persistence)
  │   └→ 05-api-device-access.md (Feature Integration)
  │
  ├→ 10-guide-build-publish (Local Builds)
  │   └→ 11-guide-eas-services (Cloud Builds & Deployment)
  │
  ├→ 12-guide-debugging-performance (Development Tools)
  │   └→ 14-best-practices-performance (Optimization)
  │
  └→ 13-best-practices-security (Security)
      └→ 03-api-auth.md (Secure Auth Implementation)
```

---

## 📝 Content Schema Explanation

Each module follows a consistent structure:

### API Reference Modules (03, 04, 05, 06)
- **Overview** — What problem does this API solve?
- **Installation** — Required packages and setup
- **Core Methods** — Each includes:
  - Description
  - Typed Parameters (TypeScript notation)
  - Return Values & Types
  - Working Code Example
  - Source URL (for official documentation)
- **Common Patterns** — Real-world usage scenarios
- **Best Practices** — Performance and security guidance

### Guide Modules (07, 08, 09, 11)
- **Concept Overview** — Mental model and architecture
- **Getting Started** — Setup and configuration
- **Workflows & Patterns** — Step-by-step implementations
- **Complete Examples** — Production-ready code
- **Pitfalls** — What to avoid and why

### Best Practices Modules (13, 14)
- **Principle** — Core concept
- **Do's & Don'ts** — Clear guidance
- **Code Examples** — Good vs. bad patterns
- **Performance Impact** — When and why it matters

---

## 🔗 Cross-References

Throughout each module, you'll find references like:
- **See: [Module Name](path)** — Links to related content
- **Cross-ref: [Concept](path#heading)** — Specific section reference
- **Prerequisite: [Module Name](path)** — Required reading before this module

---

## 📚 Source Attribution

All information is sourced directly from:
- **Official Docs**: https://docs.expo.dev/
- **Latest Version**: December 2024
- **Scope**: Expo framework, EAS services, React Native integration

Every API method includes a direct link to its official documentation for verification.

---

## 🚀 How to Use This Knowledge Base

### For Development Teams
1. **Onboarding**: Direct new developers to 01 → 02 → 07
2. **Reference**: Use specific modules (e.g., 03, 04) as needed
3. **Architecture**: Review dependency graph for system design

### For LLM/RAG Integration
1. **Load modules selectively** based on query intent
2. **Each module is self-contained** with minimal external dependencies
3. **Use cross-references** to pull related context as needed
4. **Modules are chunked for token efficiency** (target: 2000-3500 tokens each)

### For Documentation Searches
- Use the quick reference section to find your use case
- Each module title clearly states its scope
- Within modules, use ## and ### headings for section navigation

---

**Last Updated**: December 2024  
**Framework Version**: Expo Latest (2024-2025)  
**Maintainer**: RAG Knowledge Base  
**License**: Based on Official Expo Documentation (https://docs.expo.dev/)
