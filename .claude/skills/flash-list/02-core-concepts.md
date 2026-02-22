# FlashList v1.7.x - Core Concepts

**Cell recycling, virtualization, rendering lifecycle**

**Source:** https://shopify.github.io/flash-list/docs/recycling

---

## What is Cell Recycling?

**Cell recycling** is an optimization technique where FlashList reuses rendered components (cells) as the user scrolls instead of creating new ones or destroying old ones. This is the key architectural difference from React Native's FlatList.

```
Without Recycling (FlatList):
┌──────────────────────────────────────┐
│ Visible Viewport                     │
│ ┌────────────────┐                   │
│ │ Item 1 (React) │                   │
│ │ Item 2 (React) │                   │
│ │ Item 3 (React) │                   │
│ └────────────────┘                   │
│ Scrolling → Item 1 destroyed         │
│            Item 4 created (new)      │
│            Item 5 created (new)      │
└──────────────────────────────────────┘

With Cell Recycling (FlashList):
┌──────────────────────────────────────┐
│ Recycle Pool: [Cell A, Cell B, Cell C]│
│ Visible Viewport                     │
│ ┌────────────────┐                   │
│ │ Cell A (Item 1)│                   │
│ │ Cell B (Item 2)│                   │
│ │ Cell C (Item 3)│                   │
│ └────────────────┘                   │
│ Scrolling → Cell A returned to pool  │
│            Cell A reused for Item 4  │
│            Only data updated         │
└──────────────────────────────────────┘
```

### Benefits

| Benefit | Impact |
|---------|--------|
| **No component mounting/unmounting** | 5-10x faster JS thread |
| **Reduced memory allocation** | Lower RAM usage |
| **Fewer re-renders** | Smoother scrolling |
| **No garbage collection pauses** | 60 FPS on low-end devices |

---

## How Recycling Works

### The Render Cycle

1. **Initial render**: FlashList creates a small pool of cell components (roughly enough to fill the viewport plus a buffer defined by `drawDistance`)
2. **Scroll event**: As the user scrolls, cells that move out of the visible area (plus buffer) are returned to the recycle pool
3. **Reuse**: When new items need to appear, FlashList takes a cell from the pool, updates its props with the new item data, and positions it
4. **Re-render**: React re-renders only the parts of the cell whose props changed

```typescript
// Your component receives the SAME instance but with DIFFERENT item data
const ItemComponent = ({ item }: { item: Item }) => {
  // This component might render 100+ different items over time
  // but only 5-10 actual component instances exist in the pool

  return (
    <View style={{ padding: 16 }}>
      <Text>{item.title}</Text>
      {/* Text updates when cell is recycled with new item data */}
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
  estimatedItemSize={80}
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
```

---

## State Management in Recycled Cells

### The Critical Recycling Pitfall

When cells are recycled, **React component state does NOT reset**. The component instance persists, and only props change. This means `useState` values carry over to the next item:

```typescript
// BAD: State persists across recycled cells
const BadItemComponent = ({ item }: { item: Item }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View>
      <Text onPress={() => setIsExpanded(!isExpanded)}>
        {item.title}
      </Text>
      {isExpanded && <Text>{item.description}</Text>}
    </View>
  );

  // Problem: User expands Item A, scrolls away, cell is recycled to Item B
  // isExpanded is still true -- Item B appears expanded unexpectedly
};
```

### Correct Pattern: External State Keyed by Item ID

In v1.7.x, manage per-item state **externally**, keyed by the item's unique identifier:

```typescript
// GOOD: External state keyed by item ID
const MyList = ({ data }: { data: Item[] }) => {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = useCallback((id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  }, []);

  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View>
      <Text onPress={() => toggleExpanded(item.id)}>
        {item.title}
      </Text>
      {expandedIds.has(item.id) && <Text>{item.description}</Text>}
    </View>
  ), [expandedIds, toggleExpanded]);

  return (
    <FlashList
      data={data}
      renderItem={renderItem}
      estimatedItemSize={80}
      keyExtractor={(item) => item.id}
      extraData={expandedIds}  // Trigger re-render when state changes
    />
  );
};
```

### Why extraData Matters

When external state changes (like `expandedIds`), FlashList needs to know it should re-render items. The `extraData` prop serves as a change marker -- when its reference changes, all visible items re-render:

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
  extraData={selectedId}  // Re-renders all items when selectedId changes
/>
```

---

## estimatedItemSize and the Render Buffer

`estimatedItemSize` tells FlashList the approximate height (or width for horizontal lists) of each item. FlashList uses this to:

1. **Calculate how many cells to pre-allocate** in the recycle pool
2. **Determine the render buffer** (how far beyond the viewport to render)
3. **Estimate scroll positions** for `scrollToIndex`

```typescript
// Too small: Insufficient cells in pool → blank areas during fast scroll
<FlashList estimatedItemSize={20} />  // If actual items are ~100px

// Too large: Too many cells pre-rendered → wasted memory
<FlashList estimatedItemSize={500} />  // If actual items are ~100px

// Just right: ~80% accuracy is sufficient
<FlashList estimatedItemSize={100} />  // Actual items average ~90-110px
```

### Size Guidelines by Content Type

| Content Type | Typical Range |
|---|---|
| Simple text row | 48-60 |
| Text with subtitle | 60-80 |
| Card with image | 120-150 |
| Complex multi-line | 200-300 |

---

## Auto Layout

FlashList includes an **auto layout** system that corrects common layout issues in rendered cells. This system automatically adjusts child element positions when cell content changes size after recycling.

You can disable this with `disableAutoLayout={true}` if you handle all layout yourself, but it is recommended to leave it enabled.

---

## Next Steps

- Read **03-api-props.md** for the complete props reference
- Read **04-api-methods-hooks.md** for scroll methods
- Read **05-performance-guide.md** for optimization strategies

---

**Version:** 1.7.x | **Source:** https://shopify.github.io/flash-list/docs/recycling
