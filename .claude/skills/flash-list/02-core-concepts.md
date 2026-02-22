# FlashList v2.x - Core Concepts

**Cell recycling, virtualization, rendering lifecycle, state management hooks**

**Source:** https://shopify.github.io/flash-list/docs/recycling

---

## What is Cell Recycling?

**Cell recycling** is an optimization technique where FlashList reuses rendered components (cells) as the user scrolls instead of creating new ones or destroying old ones. This is the key architectural difference from React Native's FlatList.

```
Without Recycling (FlatList):
  Visible Viewport
  [Item 1 (React)] [Item 2 (React)] [Item 3 (React)]
  Scrolling -> Item 1 destroyed, Item 4 created (new), Item 5 created (new)

With Cell Recycling (FlashList):
  Recycle Pool: [Cell A, Cell B, Cell C]
  Visible Viewport
  [Cell A (Item 1)] [Cell B (Item 2)] [Cell C (Item 3)]
  Scrolling -> Cell A returned to pool, Cell A reused for Item 4 (only data updated)
```

### Benefits

| Benefit | Impact |
|---------|--------|
| **No component mounting/unmounting** | 5-10x faster JS thread |
| **Reduced memory allocation** | Lower RAM usage |
| **Fewer re-renders** | Smoother scrolling |
| **No garbage collection pauses** | 60 FPS on low-end devices |

---

## How Recycling Works in v2

### Progressive Rendering (v2 Algorithm)

FlashList v2 uses a three-pillar approach:

1. **Progressive rendering**: Items mount incrementally. During initial render, only one or two items mount to avoid drawing too much at once.
2. **Predictions**: For unmeasured items, FlashList uses an estimate which it tracks and updates as items of the same type render. No `estimatedItemSize` prop needed.
3. **Corrections**: Layout adjustments happen synchronously inside `useLayoutEffect` before paint, so users never see layout jumps.

### The Render Cycle

1. **Initial render**: FlashList creates a small pool of cell components (enough to fill the viewport plus a buffer defined by `drawDistance`)
2. **Scroll event**: As the user scrolls, cells that move out of the visible area (plus buffer) are returned to the recycle pool
3. **Reuse**: When new items need to appear, FlashList takes a cell from the pool, updates its props with the new item data, and positions it
4. **Re-render**: React re-renders only the parts of the cell whose props changed

```typescript
// Your component receives the SAME instance but with DIFFERENT item data
const ItemComponent = ({ item }: { item: Item }): React.ReactElement => {
  // This component might render 100+ different items over time
  // but only 5-10 actual component instances exist in the pool
  return (
    <View style={{ padding: 16 }}>
      <Text>{item.title}</Text>
    </View>
  );
};
```

### Type-Based Recycle Pools

When you provide `getItemType`, FlashList maintains **separate recycle pools** for each type. This prevents expensive re-layouts when structurally different cells are swapped:

```typescript
// Without getItemType:
// A header cell (100px tall) might be recycled as a row cell (60px tall)
// This forces expensive layout recalculation

// With getItemType:
// Headers only recycle with headers, rows only with rows
<FlashList
  data={data}
  renderItem={renderItem}
  getItemType={(item) => item.type}  // 'header' | 'row' | 'ad'
/>
```

---

## The renderItem Target Parameter

The `renderItem` callback receives a `target` parameter indicating the rendering context:

| Target Value | Context | Recommendation |
|---|---|---|
| `'Cell'` | Normal visible rendering | Full rendering |
| `'Measurement'` | Size calculation pass (not visible) | Skip expensive operations |
| `'StickyHeader'` | Rendering as a sticky header | Full rendering |

```typescript
import React, { useCallback } from 'react';
import { View, Text, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface Item {
  id: string;
  title: string;
  imageUrl: string;
}

export function OptimizedList({ data }: { data: Item[] }): React.ReactElement {
  const renderItem = useCallback(({ item, target }: {
    item: Item; target: string;
  }) => {
    if (target === 'Measurement') {
      // Return lightweight placeholder for measurement
      return <View style={{ height: 80 }} />;
    }
    return (
      <View style={{ padding: 16 }}>
        <Image source={{ uri: item.imageUrl }} style={{ height: 120 }} />
        <Text>{item.title}</Text>
      </View>
    );
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}
```

---

## State Management in Recycled Cells

### The Critical Recycling Pitfall

When cells are recycled, **React component state does NOT reset**. The component instance persists, and only props change. This means `useState` values carry over to the next item:

```typescript
// BAD: State persists across recycled cells
const BadItemComponent = ({ item }: { item: Item }): React.ReactElement => {
  const [isExpanded, setIsExpanded] = useState(false);
  // Problem: User expands Item A, scrolls away, cell is recycled to Item B
  // isExpanded is still true -- Item B appears expanded unexpectedly
  return (
    <View>
      <Text onPress={() => setIsExpanded(!isExpanded)}>{item.title}</Text>
      {isExpanded && <Text>{item.description}</Text>}
    </View>
  );
};
```

---

### useRecyclingState (v2 Hook)

`useRecyclingState` is the recommended way to manage per-item state in v2. It works like `useState` but accepts a dependency array. When dependencies change (i.e., the cell is recycled to a new item), the state resets automatically without an extra render.

```typescript
import { useRecyclingState } from '@shopify/flash-list';

const ItemComponent = ({ item }: { item: Item }): React.ReactElement => {
  // State resets when item.id changes (cell recycled to different item)
  const [isExpanded, setIsExpanded] = useRecyclingState(false, [item.id]);

  return (
    <View>
      <Text onPress={() => setIsExpanded(!isExpanded)}>{item.title}</Text>
      {isExpanded && <Text>{item.description}</Text>}
    </View>
  );
};
```

**Signature:**
```typescript
useRecyclingState<T>(
  initialState: T,
  dependencies: any[],
  resetCallback?: () => void,
): [T, (newState: T | ((prev: T) => T)) => void]
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialState` | `T` | Initial value (used on mount and on dependency change) |
| `dependencies` | `any[]` | When any value changes, state resets to `initialState` |
| `resetCallback` | `() => void` (optional) | Called when state resets due to dependency change |

---

### useLayoutState (v2 Hook)

`useLayoutState` is similar to `useState` but communicates state changes to FlashList so it can adjust layout accordingly. Use when state changes affect the item's dimensions.

```typescript
import { useLayoutState } from '@shopify/flash-list';

const ExpandableItem = ({ item }: { item: Item }): React.ReactElement => {
  // FlashList knows when this changes and adjusts layout
  const [isExpanded, setIsExpanded] = useLayoutState(false);

  return (
    <View>
      <Text onPress={() => setIsExpanded(!isExpanded)}>{item.title}</Text>
      {isExpanded && (
        <View style={{ padding: 16 }}>
          <Text>{item.description}</Text>
        </View>
      )}
    </View>
  );
};
```

**When to use which:**
| Hook | Use when |
|------|----------|
| `useRecyclingState` | State should reset when cell is recycled to a new item |
| `useLayoutState` | State changes affect item dimensions and FlashList needs to re-layout |
| External state + `extraData` | State is shared across items (e.g., selection set) |

---

### External State Pattern (Still Valid in v2)

For state shared across items, the external state pattern remains the recommended approach:

```typescript
import React, { useState, useCallback } from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface Item {
  id: string;
  title: string;
  description: string;
}

export function SelectableList({ data }: { data: Item[] }): React.ReactElement {
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const toggleSelected = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View style={{ padding: 16, backgroundColor: selectedIds.has(item.id) ? '#e0e0ff' : '#fff' }}>
      <Text onPress={() => toggleSelected(item.id)}>{item.title}</Text>
    </View>
  ), [selectedIds, toggleSelected]);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        extraData={selectedIds}
      />
    </View>
  );
}
```

### Why extraData Matters

When external state changes (like `selectedIds`), FlashList needs to know it should re-render items. The `extraData` prop serves as a change marker -- when its reference changes, all visible items re-render:

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  extraData={selectedId}  // Re-renders all items when selectedId changes
/>
```

---

## Automatic Sizing in v2

FlashList v2 automatically handles all item sizing. No need for `estimatedItemSize`, `estimatedListSize`, or `estimatedFirstItemOffset`. The algorithm:

1. Measures items as they render
2. Tracks size estimates per item type (from `getItemType`)
3. Updates predictions dynamically as more items render
4. Applies corrections synchronously before paint

This eliminates the most common source of blank areas in v1 (incorrect `estimatedItemSize`).

---

## maintainVisibleContentPosition (Enabled by Default)

In v2, `maintainVisibleContentPosition` is enabled by default. This intelligently maintains scroll position when content changes (e.g., items inserted above viewport). This is critical for:

- Chat interfaces where new messages appear
- Infinite scroll where items prepend
- Data updates that change item sizes

To disable if causing unwanted item movement during data reordering:

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  maintainVisibleContentPosition={{ disabled: true }}
/>
```

---

## Next Steps

- Read **03-api-props.md** for the complete props reference
- Read **04-api-methods-hooks.md** for scroll methods and hooks
- Read **05-performance-guide.md** for optimization strategies

---

**Version:** 2.x (2.2.2) | **Source:** https://shopify.github.io/flash-list/docs/recycling
