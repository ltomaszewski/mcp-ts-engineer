# React Native Reanimated 4.2.1 - Modular Knowledge Base

**Version:** 4.2.1 (React Native New Architecture / Fabric)  
**Last Updated:** December 2024  
**Official Docs:** https://docs.swmansion.com/react-native-reanimated/

---

## 📋 Master Index & Navigation

This knowledge base is organized into self-contained, context-optimized modules. Each file is designed to be retrieved independently based on your specific task.

### Module Directory

#### **1. [01-setup-installation.md](01-setup-installation.md)** — Getting Started & Installation
**What's Inside:** Installation steps for Expo and React Native CLI projects, dependency management, platform-specific setup (iOS, Android, Web), Metro bundler cache clearing, and troubleshooting.
**Use When:** Setting up a new Reanimated project, configuring dependencies, or troubleshooting build issues.
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/

---

#### **2. [02-core-shared-values.md](02-core-shared-values.md)** — Shared Values & State Management
**What's Inside:** `useSharedValue` hook documentation with full type definitions, reading/writing semantics, closure capturing, thread-safety, React Compiler support (`.get()` / `.set()` methods), and common pitfalls with mutable objects.
**Use When:** Understanding how to store and manage animated state, synchronize values between JS and UI threads, or debug reactivity issues.
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useSharedValue/

---

#### **3. [03-core-animated-style.md](03-core-animated-style.md)** — useAnimatedStyle Hook
**What's Inside:** Creating reactive style objects, mapping shared values to component styles, integration with Animated components, parameter dependencies, performance considerations, and anti-patterns (mutation warnings).
**Use When:** Binding shared values to component styles or debugging style animation issues.
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/core/useAnimatedStyle/

---

#### **4. [04-animations-timing-spring.md](04-animations-timing-spring.md)** — Animation Builders: withTiming & withSpring
**What's Inside:** Complete reference for timing-based and physics-based animations, configuration parameters (duration, easing, mass, stiffness, damping), Easing module, interactive examples, and configuration strategies.
**Use When:** Creating or customizing timing-based or spring animations, selecting appropriate easing functions, or tuning spring physics.
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/customizing-animation/

---

#### **5. [05-animations-modifiers.md](05-animations-modifiers.md)** — Animation Modifiers: withSequence, withRepeat, withDecay
**What's Inside:** Combining animations, repeating with delay, decay animations for gesture-driven interactions, callback handling, reduce motion accessibility support.
**Use When:** Chaining multiple animations, creating repeating effects, or handling gesture decay physics.
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/ (animations section)

---

#### **6. [06-worklets-guide.md](06-worklets-guide.md)** — Worklets & Runtime Execution
**What's Inside:** Defining worklets with `'worklet'` directive, workletization by Babel plugin, UI Runtime vs JS Runtime execution, `scheduleOnUI` and `scheduleOnRN` functions, closure capturing, passing data, Web-specific behavior.
**Use When:** Understanding UI thread execution, creating custom worklets, managing cross-thread communication, or debugging runtime errors.
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets/

---

#### **7. [07-gestures-events.md](07-gestures-events.md)** — Gesture Handler Integration & Events
**What's Inside:** Integration with `react-native-gesture-handler`, `useAnimatedGestureHandler` hook, handling tap/pan/scroll events, context objects, Android GestureHandlerRootView setup, event handler worklets.
**Use When:** Responding to user gestures (tap, pan, scroll), handling multi-stage gesture states (onStart, onActive, onEnd), or integrating with gesture handler library.
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/2.x/fundamentals/events/

---

#### **8. [08-api-reference-core.md](08-api-reference-core.md)** — Complete API Reference: Core Hooks
**What's Inside:** Full method signatures, typed parameters, return values, and code examples for: `useSharedValue`, `useAnimatedStyle`, `useAnimatedProps`, `useAnimatedReaction`, `useDerivedValue`, `useFrameCallback`.
**Use When:** Looking up exact function signatures, parameter types, return type specifications, or integration examples.
**Source:** https://www.jsdocs.io/package/react-native-reanimated (v4.2.1)

---

#### **9. [09-best-practices.md](09-best-practices.md)** — Performance, Security & Common Pitfalls
**What's Inside:** Performance optimization strategies, avoiding shared value mutations, closure size management, browser storage restrictions (no localStorage in sandbox), Web platform considerations, reduce motion accessibility.
**Use When:** Optimizing animation performance, debugging unexpected behavior, following security best practices, or supporting accessibility requirements.
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/ (best practices & guides)

---

#### **10. [10-troubleshooting-faq.md](10-troubleshooting-faq.md)** — Troubleshooting & FAQ
**What's Inside:** Common errors, debugging techniques, dependency resolution, platform-specific issues, React Compiler compatibility, Web support gotchas.
**Use When:** Encountering errors or unexpected behavior, or seeking quick solutions to known issues.
**Source:** Community patterns + official documentation

---

## 🎯 Quick Decision Matrix

| **Your Task** | **Start With** | **Then Read** |
|---|---|---|
| **Setting up a new project** | 01-setup-installation.md | 02-core-shared-values.md |
| **Creating an animation** | 04-animations-timing-spring.md | 03-core-animated-style.md |
| **Handling user gestures** | 07-gestures-events.md | 05-animations-modifiers.md |
| **Building reusable animation components** | 06-worklets-guide.md | 09-best-practices.md |
| **Debugging reactivity issues** | 02-core-shared-values.md | 09-best-practices.md |
| **Performance optimization** | 09-best-practices.md | 08-api-reference-core.md |
| **Migrating from Reanimated 3** | 01-setup-installation.md | 10-troubleshooting-faq.md |
| **Understanding architecture** | 06-worklets-guide.md | 02-core-shared-values.md |

---

## 📌 Key Concepts (Quick Reference)

### Shared Values
Store animated state accessible from both JS and UI threads. Use `.value` for direct access or `.get()` / `.set()` for React Compiler compatibility.

### Worklets
Functions marked with `'worklet'` directive that execute on the UI thread, enabling smooth 60/120 fps animations without blocking React renders.

### Animated Components
Wrapped components (via `createAnimatedComponent`) that accept animated styles and props for synchronized UI updates.

### Animation Functions
Built-in functions: `withTiming` (duration-based), `withSpring` (physics-based), `withDecay` (gesture-decay). Combine with `withSequence`, `withRepeat` for complex sequences.

### Event Handlers
Worklet-based callbacks connected to gesture handlers (`useAnimatedGestureHandler`) for responsive, performant interaction handling.

---

## 🔗 Cross-Reference Index

**By Topic:**
- **Animation Types:** See 04-animations-timing-spring.md, 05-animations-modifiers.md
- **State Management:** See 02-core-shared-values.md, 03-core-animated-style.md
- **User Interaction:** See 07-gestures-events.md, 05-animations-modifiers.md
- **Architecture:** See 06-worklets-guide.md, 02-core-shared-values.md
- **Troubleshooting:** See 10-troubleshooting-faq.md, 09-best-practices.md

**By API Hook:**
- `useSharedValue` → 02-core-shared-values.md, 08-api-reference-core.md
- `useAnimatedStyle` → 03-core-animated-style.md, 08-api-reference-core.md
- `useAnimatedGestureHandler` → 07-gestures-events.md, 08-api-reference-core.md
- `withTiming` → 04-animations-timing-spring.md, 05-animations-modifiers.md
- `withSpring` → 04-animations-timing-spring.md, 05-animations-modifiers.md
- Worklet directive → 06-worklets-guide.md, 08-api-reference-core.md

---

## ✅ Module Usage Guidelines

1. **Self-Contained**: Each module includes necessary context and references to prevent forced file-hopping.
2. **Searchable**: Use headers and semantic naming for LLM retrieval (e.g., "what does useSharedValue do?").
3. **Example-Rich**: Every API includes code examples with realistic use cases.
4. **Source-Traceable**: Every claim links to official Reanimated or jsDocs source.
5. **Version-Locked**: All content specific to v4.2.1; cross-reference v3.x patterns where relevant.

---

## 📖 How to Use This Knowledge Base

### For LLM-Assisted Development
1. Identify your task from the Decision Matrix above
2. Retrieve the primary module and any "Then Read" recommendations
3. Search within modules using semantic keywords (e.g., "debounce", "spring", "gesture")
4. Cross-reference using the hyperlinked module headers

### For Human Reference
- Bookmark the **Master Index** (this file)
- Use **ctrl+F** (or cmd+F) to search within a module for keywords
- Follow **Source URLs** to official documentation for the latest updates
- Check **10-troubleshooting-faq.md** if behavior seems unexpected

---

## 📝 Document Structure Convention

Each module follows this schema:

```
# Module Title

**Source:** [Official URL]

## Overview
Brief summary of this module's purpose.

## Concepts
Foundational ideas and terminology.

## API Reference
Method signatures with:
- Description
- Typed Parameters
- Return Values
- Code Examples

## Best Practices
Performance, security, and common pitfalls.

## Cross-References
Links to related modules.

## Examples
Real-world use cases and integrations.
```

---

## 🚀 Version & Maintenance

- **Latest Version:** 4.2.1 (December 2024)
- **Requires:** React Native New Architecture (Fabric)
- **Package:** `react-native-reanimated`, `react-native-worklets`
- **React Compiler:** Supported (use `.get()` / `.set()` API)

For version-specific updates, always cross-check with official docs at https://docs.swmansion.com/react-native-reanimated/

---

**Last Updated:** December 27, 2024  
**Maintainer:** RAG Indexing System  
**Context Window Optimized:** ✅ Modular Design for LLM Efficiency
