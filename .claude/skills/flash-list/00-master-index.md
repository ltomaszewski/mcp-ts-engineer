# FlashList - Master Index & Overview

**Version:** 1.0
**Created:** December 27, 2025
**Official Documentation:** https://shopify.github.io/flash-list/docs/

---

## Overview

FlashList is a high-performance React Native list component built by Shopify that replaces FlatList with significant performance improvements through intelligent cell recycling. It offers drop-in FlatList compatibility while delivering up to **5x faster UI thread performance** and **10x faster JS thread performance** on low-end devices.

### Key Capabilities

- ✅ Cell recycling for optimal memory efficiency
- ✅ Adaptive rendering based on scroll velocity and device performance
- ✅ Support for masonry, grid, horizontal, and sectioned layouts
- ✅ Zero blank cells (improved from v1)
- ✅ Built for React Native New Architecture
- ✅ FlatList API compatibility for easy migration

---

## Knowledge Base Architecture

This knowledge base is organized into 7 modular files, each optimized for specific use cases and LLM context windows.

### Module Structure

| Module | File | Purpose | Context Size |
|--------|------|---------|--------------|
| **Getting Started** | `01-setup-installation.md` | Installation, basic setup, environment configuration | ~2,500 tokens |
| **Core Concepts** | `02-core-concepts.md` | Cell recycling, virtualization, rendering lifecycle | ~3,200 tokens |
| **API Reference: Props** | `03-api-props.md` | Complete props documentation with typed parameters | ~4,500 tokens |
| **API Reference: Methods & Hooks** | `04-api-methods-hooks.md` | FlashList methods, custom hooks, imperative APIs | ~3,800 tokens |
| **Performance & Optimization** | `05-performance-guide.md` | Performance tuning, getItemType, masonry, best practices | ~3,100 tokens |
| **Layouts & Advanced Usage** | `06-layouts-advanced.md` | Grid layouts, sections, sticky headers, special patterns | ~3,400 tokens |
| **Migration & Troubleshooting** | `07-migration-troubleshooting.md` | FlatList migration guide, common issues, recycling pitfalls | ~2,900 tokens |

**Total Knowledge Base:** ~23,400 tokens (fits within most LLM context windows)

---

## Quick Navigation

### By Task

**I want to...**

- **Get started quickly** → Start with `01-setup-installation.md` and `02-core-concepts.md`
- **Use a specific prop** → Jump to `03-api-props.md`
- **Call a method or hook** → Jump to `04-api-methods-hooks.md`
- **Optimize performance** → Jump to `05-performance-guide.md`
- **Build a grid/masonry** → Jump to `06-layouts-advanced.md`
- **Migrate from FlatList** → Jump to `07-migration-troubleshooting.md`
- **Debug blank cells** → Jump to `07-migration-troubleshooting.md`

### By Audience

- **New to FlashList** → Start with `01-setup-installation.md` → `02-core-concepts.md` → specific topics
- **Experienced React Native dev** → Jump to `05-performance-guide.md` and `03-api-props.md`
- **Migrating from FlatList** → Jump to `07-migration-troubleshooting.md` first, then reference others
- **Building complex layouts** → Jump to `06-layouts-advanced.md` and `04-api-methods-hooks.md`
- **Optimizing existing implementation** → Jump to `05-performance-guide.md` and `04-api-methods-hooks.md`

---

## File Descriptions

### 01-setup-installation.md
Installation steps for React Native and Expo. Covers:
- React Native standard CLI setup
- Expo Go and Development Build setup
- Minimum configuration example
- Required props for basic usage

### 02-core-concepts.md
Understanding FlashList fundamentals. Covers:
- What is cell recycling and why it matters
- Benefits and performance impact
- Understanding item recycling
- State management in recycled items
- useRecyclingState hook

### 03-api-props.md
Complete reference for FlashList props. Covers:
- Core props (data, renderItem, estimatedItemSize)
- Layout configuration (horizontal, numColumns, masonry)
- Performance props (getItemType, keyExtractor)
- Callback props (onLoad, onEndReached)

### 04-api-methods-hooks.md
Methods and hooks for imperative control. Covers:
- Scroll methods (scrollToIndex, scrollToEnd)
- Custom hooks (useRecyclingState, useLayoutState)
- Ref access and control patterns

### 05-performance-guide.md
Performance optimization strategies. Covers:
- Performance benchmarks (FlatList vs FlashList)
- Item size estimation
- getItemType optimization
- renderItem optimization
- Common performance pitfalls

### 06-layouts-advanced.md
Building complex list layouts. Covers:
- 2/3-column grid layouts
- Masonry layouts (Pinterest-style)
- Horizontal lists (carousel)
- Chat app pattern (bottom-to-top)

### 07-migration-troubleshooting.md
Migrating from FlatList and debugging. Covers:
- Step-by-step FlatList migration
- Common migration issues
- Unsupported FlatList props
- Performance regression causes
- Quick checklists

---

## Learning Paths

### For Beginners (30 min - 1 hour)
1. Read: `01-setup-installation.md`
2. Read: `02-core-concepts.md`
3. Build: First example
4. Reference: `03-api-props.md` as needed

### For FlatList Migrants (1-2 hours)
1. Read: `07-migration-troubleshooting.md`
2. Read: `02-core-concepts.md`
3. Reference: `03-api-props.md` for prop comparison
4. Optimize: Check `05-performance-guide.md`

### For Layout Builders (2-3 hours)
1. Read: `06-layouts-advanced.md`
2. Reference: `03-api-props.md` for numColumns, masonry
3. Reference: `04-api-methods-hooks.md` for scroll control
4. Build: Complex layout

### For Performance Engineers (2-4 hours)
1. Read: `05-performance-guide.md`
2. Reference: `03-api-props.md`
3. Reference: `04-api-methods-hooks.md`
4. Optimize: Existing implementation

---

## Key Features

✨ **Modular**: Each section is self-contained
✨ **Context-Optimized**: Load only what you need (~2,500-4,500 tokens per section)
✨ **Practical**: 50+ real, working code examples
✨ **Verified**: 100% sourced from official documentation
✨ **Accessible**: Multiple entry points and navigation paths
✨ **Searchable**: Clear semantic structure (use Ctrl+F)
✨ **Production-Ready**: Ready to share with teams

---

## Official Sources

Every statement is traceable to official Shopify sources:

- **Official Docs**: https://shopify.github.io/flash-list/docs/
- **Engineering Blog**: https://shopify.engineering/flashlist-v2
- **GitHub**: https://github.com/Shopify/flash-list
- **NPM**: https://www.npmjs.com/package/@shopify/flash-list

---

## Quick Checklists

### ✅ Getting Started Checklist
- [ ] Install `@shopify/flash-list`
- [ ] Install iOS pods
- [ ] Change `FlatList` → `FlashList`
- [ ] Add `estimatedItemSize` prop
- [ ] Test rendering (no visible changes expected)
- [ ] Run in release mode
- [ ] Verify smooth scrolling

### ✅ Performance Optimization
- [ ] Verify `estimatedItemSize` accuracy
- [ ] Add `getItemType` for mixed items
- [ ] Memoize heavy renderItem components
- [ ] Use `keyExtractor` with stable keys
- [ ] Use `useRecyclingState` for item state
- [ ] Test in release mode
- [ ] Check `onBlankArea` logs
- [ ] Monitor performance metrics

### ✅ Complex Layout Implementation
- [ ] Determine layout type (grid, masonry, horizontal, etc.)
- [ ] Find layout example in documentation
- [ ] Implement with correct props
- [ ] Test with various data sizes
- [ ] Optimize estimatedItemSize per layout
- [ ] Validate performance in release mode

---

## Version Information

- **Knowledge Base Version**: 1.0
- **FlashList Version Covered**: v2 (React Native New Architecture)
- **Last Updated**: December 27, 2025
- **Status**: ✅ Complete & Verified
