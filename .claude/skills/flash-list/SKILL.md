---
name: flash-list
description: "@shopify/flash-list performant lists - recycling, estimatedItemSize, optimization. Use when working with @shopify/flash-list, FlashList, implementing large lists, or optimizing list performance."
---

# FlashList

> High-performance list component by Shopify with cell recycling for buttery-smooth scrolling.

**Package:** `@shopify/flash-list`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Implementing large or infinite lists
- Optimizing list scroll performance
- Creating grid layouts with lists
- Migrating from FlatList to FlashList
- Debugging blank areas or list rendering issues

---

## Critical Rules

**ALWAYS:**
1. Set `estimatedItemSize` prop — FlashList requires this for recycling optimization
2. Use `keyExtractor` with stable unique IDs — prevents recycling bugs and ghost renders
3. Memoize `renderItem` with useCallback — avoids re-creating function on every render
4. Use `getItemType` for heterogeneous lists — enables proper cell recycling per type

**NEVER:**
1. Omit `estimatedItemSize` — causes poor performance and blank areas
2. Use index as key — breaks recycling when items reorder
3. Create inline renderItem functions — forces re-render of all items
4. Wrap FlashList in ScrollView — FlashList handles its own scrolling

---

## Core Patterns

### Basic FlashList

```typescript
import { FlashList } from '@shopify/flash-list';
import { useCallback } from 'react';

interface Item {
  id: string;
  title: string;
}

export function MyList({ data }: { data: Item[] }) {
  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View style={styles.item}>
      <Text>{item.title}</Text>
    </View>
  ), []);

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      estimatedItemSize={80}
      keyExtractor={(item) => item.id}
    />
  );
}
```

### Grid Layout

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={150}
  numColumns={2}
  keyExtractor={(item) => item.id}
/>
```

### Heterogeneous List (Multiple Item Types)

```typescript
interface ListItem {
  id: string;
  type: 'header' | 'item' | 'footer';
  data: unknown;
}

const renderItem = useCallback(({ item }: { item: ListItem }) => {
  switch (item.type) {
    case 'header':
      return <HeaderComponent data={item.data} />;
    case 'footer':
      return <FooterComponent data={item.data} />;
    default:
      return <ItemComponent data={item.data} />;
  }
}, []);

<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}
  getItemType={(item) => item.type}
  keyExtractor={(item) => item.id}
/>
```

### Performance Debugging

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
  // Debug blank areas during scroll
  onBlankArea={(blankAreaEvent) => {
    console.log('Blank area:', blankAreaEvent);
  }}
  // Increase draw distance for faster scrolling
  drawDistance={250}
/>
```

### Sticky Headers

```typescript
const data = [
  { id: '1', title: 'Section A', isHeader: true },
  { id: '2', title: 'Item 1' },
  { id: '3', title: 'Item 2' },
  { id: '4', title: 'Section B', isHeader: true },
  { id: '5', title: 'Item 3' },
];

<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={50}
  stickyHeaderIndices={[0, 3]} // Indices of header items
  getItemType={(item) => (item.isHeader ? 'header' : 'item')}
/>
```

---

## Anti-Patterns

**BAD** — Missing estimatedItemSize:
```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  // Missing estimatedItemSize - poor performance!
/>
```

**GOOD** — Always provide estimatedItemSize:
```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80} // Average item height in pixels
/>
```

**BAD** — Inline renderItem function:
```typescript
<FlashList
  data={data}
  renderItem={({ item }) => <ItemComponent item={item} />} // Re-created every render!
  estimatedItemSize={80}
/>
```

**GOOD** — Memoized renderItem:
```typescript
const renderItem = useCallback(({ item }) => (
  <ItemComponent item={item} />
), []);

<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
/>
```

**BAD** — Using index as key:
```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(_, index) => index.toString()} // Breaks on reorder!
  estimatedItemSize={80}
/>
```

**GOOD** — Stable unique keys:
```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  estimatedItemSize={80}
/>
```

---

## Quick Reference

| Task | Prop | Example |
|------|------|---------|
| Set item height estimate | `estimatedItemSize` | `estimatedItemSize={80}` |
| Create grid | `numColumns` | `numColumns={2}` |
| Handle multiple types | `getItemType` | `getItemType={(item) => item.type}` |
| Debug blank areas | `onBlankArea` | `onBlankArea={(e) => console.log(e)}` |
| Sticky section headers | `stickyHeaderIndices` | `stickyHeaderIndices={[0, 5, 10]}` |
| Increase draw distance | `drawDistance` | `drawDistance={250}` |
| Scroll to item | `scrollToIndex()` | `listRef.current?.scrollToIndex({ index: 5 })` |
| Inverted list | `inverted` | `inverted={true}` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Installation and setup | [01-setup-installation.md](01-setup-installation.md) |
| Cell recycling explained | [02-core-concepts.md](02-core-concepts.md) |
| All available props | [03-api-props.md](03-api-props.md) |
| Ref methods and hooks | [04-api-methods-hooks.md](04-api-methods-hooks.md) |
| Performance optimization | [05-performance-guide.md](05-performance-guide.md) |
| Grid, masonry, sticky headers | [06-layouts-advanced.md](06-layouts-advanced.md) |
| FlatList migration guide | [07-migration-troubleshooting.md](07-migration-troubleshooting.md) |

---

**Version:** 1.7.x | **Source:** https://shopify.github.io/flash-list/
