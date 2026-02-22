# FlashList v1.7.x - Master Index

**Version:** 1.7.x
**Package:** `@shopify/flash-list`
**Source:** https://shopify.github.io/flash-list/docs/

---

## Overview

FlashList is a high-performance React Native list component built by Shopify. It is a drop-in replacement for FlatList that delivers up to 5x faster UI thread and 10x faster JS thread performance through intelligent cell recycling.

### Key Capabilities

- Cell recycling for optimal memory efficiency
- Automatic render buffer management
- Grid layouts with `numColumns`
- Masonry layouts with `MasonryFlashList`
- Horizontal and inverted list modes
- Sticky section headers
- FlatList API compatibility for easy migration

---

## Knowledge Base Structure

| Module | File | Purpose |
|--------|------|---------|
| **Setup** | `01-setup-installation.md` | Installation, Expo/CLI config, minimum working example |
| **Core Concepts** | `02-core-concepts.md` | Cell recycling, render lifecycle, state management |
| **Props Reference** | `03-api-props.md` | All props with TypeScript types and defaults |
| **Methods & Ref API** | `04-api-methods-hooks.md` | Scroll methods, ref access patterns |
| **Performance** | `05-performance-guide.md` | Optimization strategies, blank area debugging |
| **Layouts** | `06-layouts-advanced.md` | Grid, masonry, horizontal, inverted, sticky headers |
| **Migration** | `07-migration-troubleshooting.md` | FlatList migration, common issues, debugging |

---

## Quick Navigation

### By Task

| I want to... | Start with |
|---|---|
| Get started quickly | `01-setup-installation.md` then `02-core-concepts.md` |
| Look up a specific prop | `03-api-props.md` |
| Scroll programmatically | `04-api-methods-hooks.md` |
| Optimize list performance | `05-performance-guide.md` |
| Build a grid or masonry layout | `06-layouts-advanced.md` |
| Build a chat interface | `06-layouts-advanced.md` (Inverted section) |
| Migrate from FlatList | `07-migration-troubleshooting.md` |
| Debug blank areas | `05-performance-guide.md` then `07-migration-troubleshooting.md` |
| Handle per-item state | `02-core-concepts.md` (State Management section) |

### By Experience Level

- **New to FlashList**: `01-setup-installation.md` -> `02-core-concepts.md` -> `03-api-props.md`
- **Migrating from FlatList**: `07-migration-troubleshooting.md` -> `02-core-concepts.md` -> `05-performance-guide.md`
- **Building complex layouts**: `06-layouts-advanced.md` -> `03-api-props.md` -> `04-api-methods-hooks.md`
- **Optimizing performance**: `05-performance-guide.md` -> `03-api-props.md`

---

## Critical Rules Summary

**ALWAYS:**
1. Set `estimatedItemSize` -- required for render buffer calculation
2. Use `keyExtractor` with stable unique IDs
3. Memoize `renderItem` with `useCallback`
4. Use `getItemType` for heterogeneous lists
5. Ensure parent has `flex: 1` or explicit height

**NEVER:**
1. Omit `estimatedItemSize`
2. Use array index as key for mutable data
3. Use `useState` inside rendered items (state persists across recycled cells)
4. Wrap FlashList in `ScrollView`
5. Benchmark in dev mode

---

## Version Notes

This knowledge base covers **FlashList v1.7.x** (`@shopify/flash-list@~1.7.x`). Key differences from FlashList v2:

| Feature | v1.7.x | v2.x |
|---------|--------|------|
| `estimatedItemSize` | Required | Optional |
| Masonry layout | `MasonryFlashList` component | `masonry` prop on `FlashList` |
| `useRecyclingState` hook | Not available | Available |
| `useLayoutState` hook | Not available | Available |
| `onStartReached` callback | Not available | Available |
| `inverted` prop | Available | Deprecated |
| `onBlankArea` callback | Available | Deprecated |

---

## Official Sources

- **Documentation**: https://shopify.github.io/flash-list/docs/
- **GitHub**: https://github.com/Shopify/flash-list
- **NPM**: https://www.npmjs.com/package/@shopify/flash-list
- **Type Source**: https://app.unpkg.com/@shopify/flash-list@1.7.6/files/src/FlashListProps.ts

---

**Version:** 1.7.x | **Source:** https://shopify.github.io/flash-list/docs/
