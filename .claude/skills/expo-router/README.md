# Expo Router 6.0.19 — Modular Knowledge Base

> File-based routing for React Native. Production-grade reference with modular, LLM-optimized architecture.

**Source:** [https://docs.expo.dev/router/introduction/](https://docs.expo.dev/router/introduction/)
**Version:** 6.0.19 (SDK 53+)
**Last Updated:** December 2025

---

## Quick Overview

Expo Router is a **file-based routing library** for React Native and web that provides:
- Automatic deep linking from your app structure
- Native navigation with type-safe routing
- Protected routes with `Stack.Protected` (SDK 53+)
- Server-side rendering compatibility
- Web support with React Navigation

---

## Module Navigation Guide

This knowledge base is organized into self-contained modules optimized for LLM context windows. Each module is designed to be independently retrievable.

### 📋 **Core Setup & Installation**
**Module:** `01-setup-guide.md`
**Summary:** Project creation, dependency installation, entry point configuration, deep linking setup, and verification steps.
**Best for:** New projects, environment setup, troubleshooting installation issues.

---

### 🛣️ **Routing Fundamentals**
**Module:** `02-routing-basics.md`
**Summary:** File-based routing conventions, directory structure, dynamic routes, groups, optional segments, layouts, and modals.
**Best for:** Understanding folder structure, creating new routes, organizing layouts.

---

### 🔗 **Navigation API Reference**
**Module:** `03-api-navigation.md`
**Summary:** Complete `useRouter()` API with all router methods (`push`, `replace`, `navigate`, `back`, `dismiss`, etc.) and typed parameters.
**Best for:** Implementing imperative navigation, understanding navigation control flow.

---

### 🎣 **Hooks Reference**
**Module:** `04-api-hooks.md`
**Summary:** All navigation hooks (`useLocalSearchParams`, `useGlobalSearchParams`, `usePathname`, `useSegments`, `useFocusEffect`, etc.) with parameters and examples.
**Best for:** Managing route state, handling focus events, extracting route parameters.

---

### 🎨 **Components Reference**
**Module:** `05-api-components.md`
**Summary:** Navigation components (`Stack`, `Tabs`, `Link`, `Redirect`, `Slot`, `ErrorBoundary`) with full props and composition patterns.
**Best for:** Building navigation structure, creating links, handling redirects and error states.

---

### 🔐 **Authentication & Protected Routes**
**Module:** `06-auth-protected-routes.md`
**Summary:** SessionProvider pattern, `Stack.Protected` guards, auth state management, role-based protection, deep linking with auth, and splash screens.
**Best for:** Building login flows, protecting routes, implementing authentication context.

---

## Quick Navigation by Task

| **Task** | **Module** | **Key Sections** |
|----------|-----------|-----------------|
| Set up new Expo Router project | `01-setup-guide.md` | Quick start, manual install, babel config |
| Understand routing structure | `02-routing-basics.md` | File mapping, dynamic routes, groups, layouts |
| Navigate programmatically | `03-api-navigation.md` | `useRouter()`, `router.push()`, `router.replace()` |
| Extract route parameters | `04-api-hooks.md` | `useLocalSearchParams()`, `usePathname()` |
| Build navigation UI | `05-api-components.md` | Stack, Tabs, Link components |
| Implement authentication | `06-auth-protected-routes.md` | AuthProvider, Stack.Protected, role-based access |

---

## How to Use This Knowledge Base

### **For Implementations:**
1. **Start with README.md** (this file) — Understand architecture and find your module
2. **Jump to relevant module** — Each is 8-15K tokens, fits one context window
3. **Follow cross-references** — Jump to related modules as needed
4. **Check "Best for"** section — Confirm module matches your task

### **For Context Window Efficiency:**
- Each module is designed to fit within a single LLM context (~8-15K tokens)
- Summary paragraphs at module starts enable quick relevance checking
- Code examples use real-world patterns, not pseudo-code
- Direct source URLs enable fact-checking and deeper research

### **Reading Order:**
1. **Getting Started:** `01-setup-guide.md` → `02-routing-basics.md`
2. **Implementation:** `03-api-navigation.md` → `04-api-hooks.md` → `05-api-components.md`
3. **Advanced:** `06-auth-protected-routes.md`

---

## Core Concepts at a Glance

### File-Based Routing
Your app structure **automatically becomes your routes**:
```
app/
├── _layout.tsx          // Root layout
├── index.tsx            // / (home)
├── about.tsx            // /about
└── users/
    └── [id].tsx         // /users/123 (dynamic)
```

### Navigation Patterns
- **Declarative:** `<Link href="/profile" />`
- **Imperative:** `router.push('/profile')`
- **Protected:** `<Stack.Protected guard={isLoggedIn}>`

### Key Features
- ✅ Type-safe routing (TypeScript support built-in)
- ✅ Deep linking (every route has a URL)
- ✅ Native navigation (Android, iOS, web)
- ✅ Route protection (SDK 53+)
- ✅ Async routes (bundle splitting)

---

## Module Dependency Graph

```
01-setup-guide.md (Foundation)
  ├→ 02-routing-basics.md (Core Routing)
  │   ├→ 03-api-navigation.md (Imperative API)
  │   │   └→ 04-api-hooks.md (State Management)
  │   └→ 05-api-components.md (Declarative UI)
  │       └→ 06-auth-protected-routes.md (Security)
```

**Independent paths:**
- Just need navigation? → `03-api-navigation.md` + `04-api-hooks.md`
- Just need components? → `05-api-components.md`
- Just need auth? → `06-auth-protected-routes.md`

---

## Conventions Used in Modules

```markdown
# Heading 1 (Module Title)
## Heading 2 (Major Sections)
### Heading 3 (Subsections)

**Signature:**          # Method/hook type definition
**Parameters:**         # Table of inputs
**Return Type:**        # What it returns
**Example:**            # Code usage
**Official Source:**    # Direct docs URL
**Best for:**           # When to use this
```

### Code Examples
- TypeScript with full type annotations
- Real-world patterns (production-ready)
- Runnable without modifications
- Consistent import statements

---

## Best Practices Summary

### ✅ DO:
- Read modules sequentially for learning
- Use `Stack.Protected` for route guards
- Store tokens in `SecureStore` (encrypted)
- Use `Link` for simple navigation (web-friendly)
- Type-check route parameters
- Use `useFocusEffect` for data refresh

### ❌ DON'T:
- Store tokens in AsyncStorage (plain text)
- Nest multiple Stack navigators deeply
- Forget ErrorBoundary on error-prone routes
- Pass sensitive data in URLs
- Log tokens in console
- Skip authentication validation

---

## Official Resources

- **Main Docs:** https://docs.expo.dev/router/introduction/
- **API Reference:** https://docs.expo.dev/versions/latest/sdk/router/
- **GitHub:** https://github.com/expo/expo/tree/main/packages/expo-router
- **Changelog:** https://github.com/expo/expo/blob/main/packages/expo-router/CHANGELOG.md

---

## Troubleshooting Quick Links

- **"Cannot find module 'expo-router'"** → `01-setup-guide.md` / Common Setup Issues
- **Route not found** → `02-routing-basics.md` / Troubleshooting
- **Navigation not working** → `03-api-navigation.md` / Troubleshooting
- **Parameters always strings** → `04-api-hooks.md` / Common Mistakes
- **Link not navigating** → `05-api-components.md` / Troubleshooting
- **Auth redirect failing** → `06-auth-protected-routes.md` / Troubleshooting

---

## Content License & Attribution

This knowledge base is:
- ✅ Compiled from official Expo Router documentation
- ✅ Verified against GitHub source code
- ✅ Documented with direct source URLs
- ✅ Created for educational and production use
- ✅ Following Expo's open-source licensing

All source URLs enable fact-checking and deeper research.

---

## Module Statistics

| Module | Status | Topics | Size |
|--------|--------|--------|------|
| 01-setup-guide.md | ✅ Complete | Installation, configuration, verification | ~395 lines |
| 02-routing-basics.md | ✅ Complete | File structure, dynamic routes, layouts | ~516 lines |
| 03-api-navigation.md | ✅ Complete | useRouter, push/replace/navigate, methods | ~691 lines |
| 04-api-hooks.md | ✅ Complete | Hooks, parameters, focus events | ~712 lines |
| 05-api-components.md | ✅ Complete | Stack, Tabs, Link, Redirect, Slot | ~687 lines |
| 06-auth-protected-routes.md | ✅ Complete | Authentication, SessionProvider, protection | ~556 lines |

**Total Knowledge Base:** ~3,600 lines, ~60K tokens (all modules)

---

## Version & Maintenance

- **Knowledge Base Version:** 1.0
- **Target Framework Version:** Expo Router ~6.0.19 (SDK 53+)
- **Last Updated:** December 2025
- **Next Review:** When Expo Router 7.0 releases

---

**Start with a module based on your task above, or read sequentially for comprehensive mastery.**

---

*Knowledge Base Version 1.0*
*Framework: Expo Router ~6.0.19*
*Status: Production-Ready*
