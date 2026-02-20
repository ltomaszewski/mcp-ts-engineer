# NativeWind v4 - Modular Knowledge Base

**Last Updated:** October 14, 2025  
**Framework:** NativeWind v4  
**Target Platform:** React Native, Expo, React Native Web

---

## 📚 Overview

This modular knowledge base provides comprehensive technical documentation for **NativeWind v4**, a styling framework that brings Tailwind CSS to React Native applications. NativeWind allows developers to use Tailwind utility classes across iOS, Android, and web platforms using a unified API.

### Key Value Propositions
- **Universal Styling:** Use Tailwind CSS across all React Native platforms (iOS, Android, Web)
- **Performance-First:** Compiles styles to native `StyleSheet` at build time with zero runtime overhead
- **Developer Experience:** No custom wrappers—works via JSX transform with 3rd-party components
- **Modern Features:** Media queries, container queries, custom CSS variables, pseudo-classes, dark mode

**Official Documentation:** https://www.nativewind.dev/docs

---

## 📑 Module Index & Quick Reference

Use this table to locate specific information within the knowledge base. Each module is self-contained with cross-references.

| Module | File | Purpose | Best For |
|--------|------|---------|----------|
| **Core Setup** | `01-setup-guide.md` | Installation, configuration, TypeScript setup, editor configuration | Getting started, initial project setup |
| **Core Concepts** | `02-core-concepts.md` | Architecture, styling system, how Nativewind differs from StyleSheet.create, compilation process | Understanding framework fundamentals |
| **Styling System** | `03-styling-system.md` | className usage, dynamic styles, conditional logic, complex style objects | Writing component styles |
| **Layout Utilities** | `04-layout-utilities.md` | Flexbox, grid, responsive design, media queries, container queries | Building layouts and responsive UIs |
| **Responsive Design** | `05-responsive-design.md` | Breakpoints, platform selectors (ios/android/web/native), responsive prefixes | Cross-platform and device-specific styling |
| **Color & Typography** | `06-color-typography.md` | Color utilities, fonts, text styling, custom values | Theme colors and text styling |
| **Pseudo Classes** | `07-pseudo-classes.md` | hover, focus, active, parent state styles | Interactive states and focus management |
| **Dark Mode** | `08-dark-mode.md` | System preference mode, manual user toggle, useColorScheme hook | Dark theme implementation |
| **Custom Values** | `09-custom-values.md` | CSS variables, var() function, custom properties, theme configuration | Dynamic theming and custom styling |
| **Advanced Features** | `10-advanced-features.md` | Arbitrary classes, plugins, re-export, platform-specific media queries | Advanced use cases and customization |
| **Best Practices** | `11-best-practices.md` | Performance optimization, security, common pitfalls, debugging | Production-ready applications |

---

## 🎯 Quick Start Navigation

### For New Users
1. Start with **Core Concepts** (`02-core-concepts.md`) - understand what Nativewind is
2. Follow **Setup Guide** (`01-setup-guide.md`) - install and configure
3. Review **Styling System** (`03-styling-system.md`) - learn to style components
4. Explore **Layout Utilities** (`04-layout-utilities.md`) - build your first layouts

### For Specific Tasks
- **"I need to make my app look good on mobile"** → `05-responsive-design.md`
- **"How do I support dark mode?"** → `08-dark-mode.md`
- **"I need platform-specific styles"** → `05-responsive-design.md` (Platform Selectors section)
- **"I want to optimize performance"** → `11-best-practices.md` (Performance section)
- **"How do I create dynamic themes?"** → `09-custom-values.md`
- **"I need to debug styling issues"** → `11-best-practices.md` (Debugging section)

---

## 🔗 Cross-Reference Guide

This guide helps LLMs navigate between modules efficiently:

### Styling Concepts
- **Basic styling** → `03-styling-system.md` (className prop)
- **Responsive styling** → `05-responsive-design.md` (breakpoints, media queries)
- **Platform-specific styling** → `05-responsive-design.md` (platform selectors)
- **Dynamic values** → `09-custom-values.md` (CSS variables and var())
- **Interactive states** → `07-pseudo-classes.md`

### Layout & Spacing
- **Flexbox layouts** → `04-layout-utilities.md` (flex utilities)
- **Grid layouts** → `04-layout-utilities.md` (grid utilities)
- **Responsive layouts** → `04-layout-utilities.md` (responsive examples)
- **Container queries** → `04-layout-utilities.md` (container queries)
- **Spacing utilities** → `04-layout-utilities.md` (margin, padding, gap)

### Theming
- **Color system** → `06-color-typography.md`
- **Dark mode** → `08-dark-mode.md`
- **Custom values** → `09-custom-values.md` (CSS variables)
- **Font families** → `06-color-typography.md`

### Configuration
- **Initial setup** → `01-setup-guide.md`
- **Editor setup** → `01-setup-guide.md`
- **Tailwind config** → `02-core-concepts.md` (configuration section)
- **Custom plugins** → `10-advanced-features.md`

---

## 📋 Content Schema for Each Module

Every module follows this standardized structure:

### For API/Utility References
- **Description:** What this utility does
- **Type Signature:** Parameters and return types (if applicable)
- **Properties/Options:** Detailed parameters with types
- **Return Values:** Expected output and types
- **Code Example:** Practical usage
- **Source URL:** Official documentation link for verification

### For Conceptual Topics
- **Overview:** High-level explanation
- **Key Concepts:** Core ideas
- **Implementation Details:** How it works under the hood
- **Practical Examples:** Real-world use cases
- **Related Topics:** Cross-references to other modules

### For Best Practices
- **Dos:** Recommended approaches
- **Don'ts:** Common pitfalls to avoid
- **Performance Considerations:** Impact on app performance
- **Security Implications:** If applicable
- **Real-world Examples:** Code patterns

---

## 🚀 Key Architecture Decisions

### Compilation Model
NativeWind uses a **two-phase compilation model**:

1. **Build Time:** Tailwind utilities are compiled into `StyleSheet.create()` objects
2. **Runtime:** Efficient system applies compiled styles with conditional logic support

This provides native performance while maintaining full Tailwind CSS features.

### Platform Support
- **iOS:** Uses React Native's native `StyleSheet` system
- **Android:** Uses React Native's native `StyleSheet` system  
- **Web:** Uses React Native Web with Tailwind CSS stylesheet
- **Unified API:** Single `className` prop works across all platforms

### No Runtime Overhead
Unlike CSS-in-JS solutions, NativeWind:
- ✅ Compiles styles statically at build time
- ✅ Zero runtime style evaluation for static classes
- ✅ Efficient conditional logic for pseudo-classes and media queries
- ✅ No style injection during component render

---

## 💡 Version Information

- **Version:** v4 (Latest as of October 2025)
- **Breaking Changes from v2:** See `02-core-concepts.md` > Breaking Changes section
- **Node Version:** Supports modern LTS versions
- **Peer Dependencies:** 
  - `tailwindcss` (4.0+)
  - `react-native-reanimated` (3.0+)
  - `react-native-safe-area-context` (4.0+)

---

## 🔍 How to Use This Knowledge Base

### For LLM Context Window Optimization

**Each module is designed to be:**
- **Self-contained:** Can be read independently
- **Focused:** Single responsibility (e.g., only styling, only layout)
- **Concise:** Information density maximized, padding minimized
- **Traversable:** Clear links to related content

**Optimal Usage Pattern:**
1. Read `02-core-concepts.md` first (foundational understanding)
2. Select 2-3 task-specific modules based on your need
3. Reference `11-best-practices.md` for production considerations
4. Check specific module headers for implementation details

**Context Budget per Module:** ~2,000-3,000 tokens average

---

## 🔐 Information Verification

Every API method and configuration option includes:
- **Source URL:** Direct link to official documentation
- **Version Number:** Which NativeWind version it applies to
- **Last Verified:** Date of documentation verification

This ensures absolute traceability and enables quick validation of current vs. outdated information.

---

## 📚 Related Resources

- **Official Website:** https://www.nativewind.dev
- **Documentation:** https://www.nativewind.dev/docs
- **GitHub:** https://github.com/nativewind/nativewind
- **Tailwind CSS Docs:** https://tailwindcss.com/docs
- **React Native Docs:** https://reactnative.dev/docs
- **React Native Web:** https://necolas.github.io/react-native-web/

---

## 📝 Notes for Secondary LLMs

When using this knowledge base:

1. **Always cite the source module** when answering questions (e.g., "According to `04-layout-utilities.md`...")
2. **Cross-reference related topics** using the Cross-Reference Guide above
3. **For updates:** Check the "Last Updated" timestamp on each module
4. **For code examples:** Run them first in a test environment (provided examples are verified)
5. **For breaking changes:** Always check v2→v4 migration notes in `02-core-concepts.md`

---

**Knowledge Base Status:** ✅ Complete | **Last Generated:** October 2025 | **Maintenance:** Quarterly updates recommended
