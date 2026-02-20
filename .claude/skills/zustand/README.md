# Zustand State Management - Modular Knowledge Base

> A lightweight, fast, and scalable state management solution with a comfy hook-based API. LLM-optimized modular architecture for context efficiency.

**Source:** [https://zustand.docs.pmnd.rs/getting-started/introduction](https://zustand.docs.pmnd.rs/getting-started/introduction)

---

## Quick Overview

Zustand is a minimalist state management library for JavaScript/TypeScript applications that:
- Uses React hooks as the primary API
- Eliminates boilerplate and complex context providers
- Handles React concurrency, zombie child problems, and context loss
- Supports vanilla (non-React) stores via `createStore`
- Provides flexible middleware ecosystem for persistence, DevTools, immutable updates, and more

**Installation:**
```bash
npm install zustand
```

---

## Module Navigation Guide

This knowledge base is organized into self-contained modules optimized for LLM context windows. Each module is designed to be independently retrievable and includes cross-references for broader context.

### Core Modules

| Module | File | Purpose | Typical Use Case |
|--------|------|---------|------------------|
| **Setup & Basic Concepts** | `01-setup-basic.md` | Installation, first store creation, hook usage, selection patterns | Getting started, creating basic stores, component integration |
| **API Reference: Store Creation** | `02-api-store-creation.md` | `create()` hook, `createStore()` for vanilla stores, type definitions | Building stores, type safety, React and non-React applications |
| **API Reference: State Management** | `03-api-state-management.md` | `getState()`, `setState()`, `subscribe()`, state mutation patterns | Reading state outside components, subscriptions, direct mutations |
| **API Reference: Selectors & Selectors** | `04-api-selectors.md` | Selection patterns, `shallow` equality, `useShallow()`, performance optimization | Component memoization, preventing unnecessary re-renders |
| **Middleware: Persistence** | `05-middleware-persist.md` | `persist` middleware, localStorage, custom storage, versioning, migrations | State persistence, storage strategies, version management |
| **Middleware: Core Features** | `06-middleware-core.md` | `combine`, `subscribeWithSelector`, TypeScript mutators | Advanced middleware composition |
| **Advanced Patterns** | `07-advanced-patterns.md` | Store splitting, composition, debugging, best practices | Large applications, performance optimization, security |

---

## How to Use This Knowledge Base

### For Implementation Tasks
1. **"I need to create a store"** → Start with `01-setup-basic.md`, then reference `02-api-store-creation.md`
2. **"How do I select state efficiently?"** → See `04-api-selectors.md`
3. **"I want to persist state"** → Go to `05-middleware-persist.md`
4. **"I need TypeScript types"** → Check type definitions in `02-api-store-creation.md` and `06-middleware-core.md`

### For API Lookups
Each module contains:
- **Method/Feature Name** as heading
- **Description** of what it does
- **Type Signature** showing parameters and returns
- **Parameters** table with types and descriptions
- **Return Values** specification
- **Code Example** showing real usage
- **Source URL** for official documentation verification

### For Troubleshooting
- **Performance issues?** → `04-api-selectors.md` (selection patterns)
- **Type errors?** → `02-api-store-creation.md` and `06-middleware-core.md`
- **State not persisting?** → `05-middleware-persist.md`
- **Middleware composition?** → `06-middleware-core.md` and `07-advanced-patterns.md`

---

## Core Concepts at a Glance

### State Creators (Curried Functions)
Zustand uses a **state creator function** pattern. The creator receives `set`, `get`, and `store` as arguments:

```typescript
(set, get, store) => {
  return {
    // state properties and actions
  }
}
```

### Two API Styles
- **React Hooks (`create`)**: Components automatically re-render on state changes
- **Vanilla (`createStore`)**: Explicit subscription management, framework-agnostic

### Middleware Composition
Middleware wraps state creators and adds functionality:
```typescript
create(middleware1(middleware2(stateCreator)))
```

**Important:** Middleware order matters for DevTools visibility and state flow.

---

## Best Practices Summary

✅ **DO:**
- Use selectors to subscribe only to needed state slices
- Use `shallow` equality for multi-property selections
- Leverage `combine` middleware for automatic type inference
- Persist only essential state (use `partialize`)
- Handle TypeScript mutators correctly in middleware stacks

❌ **DON'T:**
- Mutate nested objects directly (create new objects instead)
- Forget to wrap arrays/objects with immutable operations
- Use `replace: true` unless replacing entire state
- Ignore middleware order (DevTools should wrap other middlewares)
- Store functions that change frequently in persisted state

---

## Cross-Module Dependencies

```
01-setup-basic
├─ requires: 02-api-store-creation (for create() details)
└─ references: 04-api-selectors (selection patterns)

02-api-store-creation
├─ requires: None (foundational)
└─ referenced by: 01, 03, 06

03-api-state-management
├─ requires: 02-api-store-creation
└─ references: 04-api-selectors (performance tips)

04-api-selectors
├─ requires: 02-api-store-creation, 03-api-state-management
└─ critical for: Performance in all applications

05-middleware-persist
├─ requires: 02-api-store-creation, 03-api-state-management
└─ combines with: 06-middleware-core

06-middleware-core
├─ requires: 02, 03, 05 (previous middleware)
└─ foundation for: 07-advanced-patterns

07-advanced-patterns
├─ requires: All previous modules
└─ references: Best practices from all modules
```

---

## Official Documentation

- **Main Docs:** https://zustand.docs.pmnd.rs/
- **GitHub:** https://github.com/pmndrs/zustand
- **NPM Package:** https://www.npmjs.com/package/zustand

---

## Version & Compatibility

- **Zustand Version:** 4.x
- **TypeScript Support:** Full (4.5+)
- **React Versions:** 16.8+ (hooks required)
- **Runtime:** Works in browser, Node.js (with `createStore`), React Native

---

**Last Updated:** December 2025 | **Status:** Complete with official documentation alignment