# FlashList v2.x - Master Index

**Version:** 2.x (2.2.2)
**Package:** `@shopify/flash-list@^2.0.0`
**Source:** https://shopify.github.io/flash-list/docs/

---

## Overview

FlashList v2 is a ground-up rewrite of Shopify's high-performance React Native list component. It is a JS-only solution (no native code) built exclusively for React Native's New Architecture. It delivers up to 5x faster UI thread and 10x faster JS thread performance through intelligent cell recycling, with up to 50% reduced blank area compared to v1.

### Key Changes from v1

- **New Architecture only** -- does not run on old architecture (bridge)
- **No size estimates** -- `estimatedItemSize`, `estimatedListSize`, `estimatedFirstItemOffset` all removed
- **JS-only** -- no native code dependencies, easier maintenance
- **Masonry as prop** -- `MasonryFlashList` replaced by `masonry` prop on `FlashList`
- **`inverted` deprecated** -- replaced by `maintainVisibleContentPosition` with reversed data
- **New hooks** -- `useRecyclingState`, `useLayoutState`, `useMappingHelper`, `useFlashListContext`
- **New props** -- `onStartReached`, `maintainVisibleContentPosition`, `masonry`, `stickyHeaderConfig`, `maxItemsInRecyclePool`
- **Ref type change** -- `FlashList<T>` ref replaced by `FlashListRef<T>`
- **New ref methods** -- `getVisibleIndices()`, `getLayout()`, `scrollToTop()`, `getFirstItemOffset()`, `getWindowSize()`, `getFirstVisibleIndex()`

---

## Knowledge Base Structure

| Module | File | Purpose |
|--------|------|---------|
| **SKILL** | `SKILL.md` | Quick reference, critical rules, core patterns |
| **Master Index** | `00-master-index.md` | Overview, navigation, version notes |
| **Setup** | `01-setup-installation.md` | Installation, New Architecture requirement, minimum example |
| **Core Concepts** | `02-core-concepts.md` | Cell recycling, render lifecycle, state hooks |
| **Props Reference** | `03-api-props.md` | All props with TypeScript types and defaults |
| **Methods & Hooks** | `04-api-methods-hooks.md` | Scroll methods, ref API, hooks |
| **Performance** | `05-performance-guide.md` | Optimization strategies, blank area debugging |
| **Layouts** | `06-layouts-advanced.md` | Grid, masonry, horizontal, chat, sticky headers |
| **Migration** | `07-migration-troubleshooting.md` | v1-to-v2 migration, FlatList migration, common issues |

---

## Quick Navigation

### By Task

| I want to... | Start with |
|---|---|
| Get started quickly | `01-setup-installation.md` then `02-core-concepts.md` |
| Look up a specific prop | `03-api-props.md` |
| Scroll programmatically | `04-api-methods-hooks.md` |
| Manage per-item state | `02-core-concepts.md` (useRecyclingState) |
| Optimize list performance | `05-performance-guide.md` |
| Build a grid or masonry layout | `06-layouts-advanced.md` |
| Build a chat interface | `06-layouts-advanced.md` (Chat section) |
| Migrate from FlatList | `07-migration-troubleshooting.md` |
| Migrate from FlashList v1 | `07-migration-troubleshooting.md` (v1-to-v2 section) |
| Debug blank areas | `05-performance-guide.md` |
| Use sticky headers | `06-layouts-advanced.md` (Sticky Headers section) |
| Use Reanimated with FlashList | `06-layouts-advanced.md` (Reanimated section) |

### By Experience Level

- **New to FlashList**: `01-setup-installation.md` -> `02-core-concepts.md` -> `03-api-props.md`
- **Migrating from FlatList**: `07-migration-troubleshooting.md` -> `02-core-concepts.md` -> `05-performance-guide.md`
- **Migrating from v1**: `07-migration-troubleshooting.md` (v1-to-v2 section) -> `03-api-props.md`
- **Building complex layouts**: `06-layouts-advanced.md` -> `03-api-props.md` -> `04-api-methods-hooks.md`
- **Optimizing performance**: `05-performance-guide.md` -> `03-api-props.md`

---

## Critical Rules Summary

**ALWAYS:**
1. Require React Native New Architecture (v2 does not run on old architecture)
2. Use `keyExtractor` with stable unique IDs
3. Memoize `renderItem` with `useCallback`
4. Use `getItemType` for heterogeneous lists
5. Ensure parent has `flex: 1` or explicit height
6. Use `useRecyclingState` for per-item state

**NEVER:**
1. Use `estimatedItemSize` (removed in v2)
2. Use array index as key for mutable data
3. Use `useState` inside rendered items (state persists across recycled cells)
4. Wrap FlashList in `ScrollView`
5. Benchmark in dev mode
6. Use `MasonryFlashList` (deprecated; use `masonry` prop)

---

## Known Issues (v2.x)

| Issue | Workaround |
|-------|------------|
| Horizontal lists + RTL cannot read padding from `contentContainerStyle` | Apply padding to header component instead |
| Horizontal lists with headers assume fixed height | Render header as first list item with distinct `getItemType` |
| Data re-ordering causes item movement due to `maintainVisibleContentPosition` | Set `maintainVisibleContentPosition={{ disabled: true }}` |

---

## Official Sources

- **Documentation**: https://shopify.github.io/flash-list/docs/
- **GitHub**: https://github.com/Shopify/flash-list
- **NPM**: https://www.npmjs.com/package/@shopify/flash-list
- **v2 Engineering Blog**: https://shopify.engineering/flashlist-v2

---

**Version:** 2.x (2.2.2) | **Source:** https://shopify.github.io/flash-list/docs/
