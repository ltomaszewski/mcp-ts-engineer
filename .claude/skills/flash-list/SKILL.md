---
name: flash-list
description: "@shopify/flash-list v1.7.x performant lists - cell recycling, estimatedItemSize, getItemType, overrideItemLayout, grid, horizontal, inverted. Use when implementing large lists, optimizing scroll performance, migrating from FlatList, or building grid/masonry layouts."
---

# FlashList

High-performance list component by Shopify with cell recycling -- drop-in FlatList replacement delivering up to 5x faster UI thread and 10x faster JS thread performance.

**Package:** `@shopify/flash-list`

---

## When to Use

LOAD THIS SKILL when user is:
- Implementing large or infinite scrolling lists
- Optimizing list scroll performance or debugging blank areas
- Creating grid layouts with `numColumns`
- Migrating from React Native `FlatList` to FlashList
- Building chat interfaces with `inverted` lists

---

## Critical Rules

**ALWAYS:**
1. Set `estimatedItemSize` -- FlashList uses this to pre-allocate render buffer; omitting it causes blank areas and a console warning
2. Use `keyExtractor` with stable unique IDs -- prevents recycling bugs when items reorder
3. Memoize `renderItem` with `useCallback` -- avoids re-creating the function every render, which forces all items to re-render
4. Use `getItemType` for heterogeneous lists -- maintains separate recycle pools per type, preventing expensive layout recalculations
5. Ensure parent container has defined dimensions -- FlashList needs `flex: 1` or explicit height on its parent

**NEVER:**
1. Omit `estimatedItemSize` -- causes poor performance, blank cells, and console warnings
2. Use array index as key -- breaks recycling correctness when items are inserted, removed, or reordered
3. Use `useState` for per-item state -- state persists across recycled cells; use external state keyed by item ID instead
4. Wrap FlashList in a `ScrollView` -- FlashList manages its own scroll; nesting causes layout and performance issues
5. Test performance in dev mode -- dev mode adds debugging overhead; always benchmark in release builds

---

## Core Patterns

### Basic List

```typescript
import { FlashList } from '@shopify/flash-list';
import { useCallback } from 'react';
import { View, Text } from 'react-native';

interface Item { id: string; title: string; }

export function MyList({ data }: { data: Item[] }) {
  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View style={{ padding: 16 }}>
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
const renderItem = useCallback(({ item }: { item: ListItem }) => {
  switch (item.type) {
    case 'header': return <HeaderComponent data={item.data} />;
    case 'footer': return <FooterComponent data={item.data} />;
    default: return <ItemComponent data={item.data} />;
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

### Infinite Scroll (Pagination)

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
  onEndReached={fetchNextPage}
  onEndReachedThreshold={0.5}
  ListFooterComponent={isLoading ? <ActivityIndicator /> : null}
/>
```

### Performance Debugging

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
  onBlankArea={(event) => {
    console.warn('Blank area detected:', event);
  }}
  drawDistance={250}
/>
```

---

## Anti-Patterns

**BAD** -- Missing estimatedItemSize:
```typescript
<FlashList data={data} renderItem={renderItem} />
```

**GOOD** -- Always provide estimatedItemSize:
```typescript
<FlashList data={data} renderItem={renderItem} estimatedItemSize={80} />
```

**BAD** -- Inline renderItem (re-created every render):
```typescript
<FlashList
  data={data}
  renderItem={({ item }) => <Text>{item.title}</Text>}
  estimatedItemSize={80}
/>
```

**GOOD** -- Memoized renderItem:
```typescript
const renderItem = useCallback(({ item }) => (
  <Text>{item.title}</Text>
), []);
<FlashList data={data} renderItem={renderItem} estimatedItemSize={80} />
```

**BAD** -- useState for per-item state (persists across recycled cells):
```typescript
const Item = ({ item }) => {
  const [expanded, setExpanded] = useState(false); // Leaks across cells!
  return <View>{expanded && <Details />}</View>;
};
```

**GOOD** -- External state keyed by item ID:
```typescript
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
const renderItem = useCallback(({ item }) => (
  <View>{expandedIds.has(item.id) && <Details />}</View>
), [expandedIds]);
```

---

## Quick Reference

| Task | Prop/Method | Example |
|------|-------------|---------|
| Set item height estimate | `estimatedItemSize` | `estimatedItemSize={80}` |
| Create grid | `numColumns` | `numColumns={2}` |
| Handle multiple types | `getItemType` | `getItemType={(item) => item.type}` |
| Debug blank areas | `onBlankArea` | `onBlankArea={(e) => console.log(e)}` |
| Sticky section headers | `stickyHeaderIndices` | `stickyHeaderIndices={[0, 5]}` |
| Increase draw buffer | `drawDistance` | `drawDistance={250}` |
| Scroll to item | `scrollToIndex()` | `ref.current?.scrollToIndex({ index: 5 })` |
| Scroll to end | `scrollToEnd()` | `ref.current?.scrollToEnd({ animated: true })` |
| Inverted list (chat) | `inverted` | `inverted={true}` |
| Horizontal carousel | `horizontal` | `horizontal={true}` |
| Infinite scroll | `onEndReached` | `onEndReached={fetchMore}` |
| Pull to refresh | `onRefresh` + `refreshing` | `onRefresh={refresh} refreshing={loading}` |
| Custom column span | `overrideItemLayout` | See `03-api-props.md` |
| Empty state | `ListEmptyComponent` | `ListEmptyComponent={<Empty />}` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and setup | [01-setup-installation.md](01-setup-installation.md) |
| Cell recycling explained | [02-core-concepts.md](02-core-concepts.md) |
| All props with types/defaults | [03-api-props.md](03-api-props.md) |
| Ref methods (scroll, etc.) | [04-api-methods-hooks.md](04-api-methods-hooks.md) |
| Performance optimization | [05-performance-guide.md](05-performance-guide.md) |
| Grid, horizontal, chat layouts | [06-layouts-advanced.md](06-layouts-advanced.md) |
| FlatList migration + troubleshooting | [07-migration-troubleshooting.md](07-migration-troubleshooting.md) |

---

**Version:** 1.7.x | **Source:** https://shopify.github.io/flash-list/docs/
