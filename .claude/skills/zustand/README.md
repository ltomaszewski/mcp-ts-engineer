# Zustand v5 Knowledge Base

> Lightweight, fast state management with a hook-based API. No providers, no boilerplate.

**Source:** https://zustand.docs.pmnd.rs/

---

## Module Navigation

| Module | File | Purpose |
|--------|------|---------|
| Setup & Basics | `01-setup-basic.md` | Installation, first store, selection patterns, troubleshooting |
| Store Creation API | `02-api-store-creation.md` | `create`, `createStore`, `createWithEqualityFn`, type definitions |
| State Management API | `03-api-state-management.md` | `getState`, `setState`, `subscribe`, mutation patterns |
| Selectors & Performance | `04-api-selectors.md` | `useShallow`, `shallow`, custom equality, performance tips |
| Persist Middleware | `05-middleware-persist.md` | `persist` options, storage backends, migrations, MMKV |
| Core Middleware | `06-middleware-core.md` | `devtools`, `immer`, `combine`, `subscribeWithSelector` |
| Advanced Patterns | `07-advanced-patterns.md` | Slices, async ops, transient updates, reset, debugging |

---

## Quick Start

```typescript
import { create } from 'zustand'

interface BearState {
  bears: number
  addBear: () => void
}

const useBearStore = create<BearState>((set) => ({
  bears: 0,
  addBear: () => set((s) => ({ bears: s.bears + 1 })),
}))

// In component
const bears = useBearStore((s) => s.bears)
```

---

## Version & Compatibility

- **Zustand:** 5.x (^5.0.2)
- **React:** 18+ (React 19 supported)
- **TypeScript:** 4.5+
- **Runtime:** Browser, Node.js (`createStore`), React Native

---

**Source:** https://zustand.docs.pmnd.rs/ | https://github.com/pmndrs/zustand
