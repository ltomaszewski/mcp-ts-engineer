# FlashList v2.x - Performance & Optimization

**Performance tuning, blank area reduction, getItemType, best practices**

**Source:** https://shopify.github.io/flash-list/docs/fundamentals/performant-components

---

## Performance Benchmarks

FlashList v2 delivers significant improvements over FlatList, especially on low-end devices:

| Metric | FlatList | FlashList v2 | Improvement |
|--------|----------|--------------|-------------|
| **UI Thread FPS** | ~10 FPS | ~48 FPS | **5x faster** |
| **JS Thread FPS** | ~6 FPS | ~60 FPS | **10x faster** |
| **Memory Usage** | Baseline | ~4% less | Lower allocation |
| **Blank Area** | Frequent | ~50% less than v1 | Significant reduction |

Benchmarked on Moto G10 (low-end Android device).

**Source:** https://shopify.github.io/flash-list/docs/

---

## Core Performance Strategy

### 1. Automatic Sizing (v2 -- No Estimates Needed)

FlashList v2 **automatically handles all item sizing**. The `estimatedItemSize`, `estimatedListSize`, and `estimatedFirstItemOffset` props are removed. The v2 algorithm:

1. Measures items as they render
2. Tracks size estimates per item type (from `getItemType`)
3. Updates predictions dynamically as more items render
4. Applies corrections synchronously before paint

This eliminates the most common source of blank areas in v1 (incorrect `estimatedItemSize`).

```typescript
// v2: No estimatedItemSize needed
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>
```

---

### 2. Use getItemType for Mixed Content

When your list contains structurally different items, `getItemType` maintains separate recycle pools per type. Without it, a header cell might be recycled as a row cell, forcing expensive re-layout.

```typescript
// BAD: Single pool for all types -- expensive re-layouts
<FlashList
  data={mixedItems}
  renderItem={({ item }) => {
    if (item.type === 'header') return <HeaderItem data={item} />;
    if (item.type === 'ad') return <AdItem data={item} />;
    return <RowItem data={item} />;
  }}
/>

// GOOD: Separate pools per type -- no cross-type recycling
<FlashList
  data={mixedItems}
  renderItem={({ item }) => {
    if (item.type === 'header') return <HeaderItem data={item} />;
    if (item.type === 'ad') return <AdItem data={item} />;
    return <RowItem data={item} />;
  }}
  getItemType={(item) => item.type}
  keyExtractor={(item) => item.id}
/>
```

**Performance note:** `getItemType` is called frequently during scroll. Keep the logic fast -- ideally just a property lookup.

---

### 3. Memoize renderItem

Avoid creating the render function inline. Use `useCallback` to memoize it:

```typescript
// BAD: New function created every render -- all items re-render
<FlashList
  data={data}
  renderItem={({ item }) => <Text>{item.title}</Text>}
/>

// GOOD: Memoized function -- stable reference
const renderItem = useCallback(({ item }: { item: Item }) => (
  <Text>{item.title}</Text>
), []);

<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>
```

For complex items, also memoize the item component:

```typescript
const MemoizedItem = memo(({ item }: { item: Item }) => (
  <View style={{ padding: 16 }}>
    <Image source={{ uri: item.imageUrl }} style={{ height: 120 }} />
    <Text>{item.title}</Text>
    <Text>${item.price.toFixed(2)}</Text>
  </View>
), (prevProps, nextProps) => {
  return prevProps.item.id === nextProps.item.id;
});

const renderItem = useCallback(({ item }: { item: Item }) => (
  <MemoizedItem item={item} />
), []);
```

---

### 4. Use keyExtractor with Stable Keys

Stable, unique keys are essential for correct recycling behavior:

```typescript
// BAD: Index as key -- breaks on reorder/insert/delete
<FlashList
  data={data}
  renderItem={renderItem}
  // No keyExtractor -- defaults to index.toString()
/>

// GOOD: Stable unique ID
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>
```

---

### 5. Use overrideItemLayout for Custom Spans

In v2, `overrideItemLayout` supports `span` configuration only. The `size` property is no longer read (v2 handles sizing automatically):

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  numColumns={2}
  keyExtractor={(item) => item.id}
  overrideItemLayout={(layout, item, _index, maxColumns) => {
    if (item.type === 'banner') {
      layout.span = maxColumns;  // Full-width banner across all columns
    }
  }}
/>
```

---

### 6. Use the renderItem `target` Parameter

The `target` parameter lets you skip expensive rendering during measurement passes:

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

## Blank Area Reduction

Blank areas (white space visible during scrolling) are the primary performance indicator for list quality. v2 reduces blank areas by ~50% compared to v1 through automatic sizing and progressive rendering.

### Using onBlankArea

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  onBlankArea={(event) => {
    if (event.blankArea > 0) {
      console.warn(`Blank area: ${event.blankArea}px`);
    }
  }}
/>
```

### Common Causes and Fixes

| Cause | Symptom | Fix |
|-------|---------|-----|
| Heavy `renderItem` | Blank during fast scroll | Memoize, simplify, use `target === 'Measurement'` |
| Missing `getItemType` | Blank after mixed content | Add `getItemType` |
| Slow network images | Blank where images load | Use placeholder images |
| Small `drawDistance` | Blank at edges | Increase `drawDistance` |

### Increasing Draw Distance

`drawDistance` controls how far beyond the visible area FlashList pre-renders. Higher values reduce blank areas but use more memory:

```typescript
// Increase for content-heavy lists or fast-scrolling scenarios
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  drawDistance={500}  // Pre-render 500px beyond viewport
/>
```

---

## Common Performance Pitfalls

### Pitfall 1: useState in Recycled Cells

```typescript
// BAD: State persists across recycled cells
const BadItem = ({ item }: { item: Item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // When cell recycled, isExpanded stays true!
  return <View>{isExpanded && <Details />}</View>;
};

// GOOD: useRecyclingState resets on dependency change (v2)
import { useRecyclingState } from '@shopify/flash-list';

const GoodItem = ({ item }: { item: Item }) => {
  const [isExpanded, setIsExpanded] = useRecyclingState(false, [item.id]);
  return <View>{isExpanded && <Details />}</View>;
};

// ALSO GOOD: External state keyed by item ID
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
const renderItem = useCallback(({ item }: { item: Item }) => (
  <View>{expandedIds.has(item.id) && <Details />}</View>
), [expandedIds]);
```

### Pitfall 2: Testing in Dev Mode

```bash
# BAD: Dev mode adds debugging overhead, smaller render buffer
npm start
npx react-native run-android

# GOOD: Test release build for real performance numbers
npx react-native run-android --variant release
npx react-native run-ios --configuration Release

# Expo
npx expo run:android --variant release
npx expo run:ios --configuration Release
```

### Pitfall 3: Wrapping in ScrollView

```typescript
// BAD: Nested scroll -- layout and performance issues
<ScrollView>
  <FlashList data={data} renderItem={renderItem} />
</ScrollView>

// GOOD: Use ListHeaderComponent and ListFooterComponent instead
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  ListHeaderComponent={<HeaderContent />}
  ListFooterComponent={<FooterContent />}
/>
```

### Pitfall 4: Missing Parent Dimensions

```typescript
// BAD: Parent has no height -- FlashList renders nothing
<View>
  <FlashList data={data} renderItem={renderItem} />
</View>

// GOOD: Parent has flex: 1 or explicit height
<View style={{ flex: 1 }}>
  <FlashList data={data} renderItem={renderItem} keyExtractor={(item) => item.id} />
</View>
```

---

## Performance Checklist

- [ ] `getItemType` provided for mixed-content lists
- [ ] `renderItem` memoized with `useCallback`
- [ ] `keyExtractor` uses stable unique IDs (not array index)
- [ ] No `useState` inside rendered items (use `useRecyclingState` or external state)
- [ ] No `ScrollView` wrapping FlashList
- [ ] Parent container has defined dimensions (`flex: 1`)
- [ ] Performance tested in release build (not dev mode)
- [ ] Heavy components wrapped in `React.memo`
- [ ] Using `target === 'Measurement'` to skip expensive rendering during measurement

---

## Next Steps

- Read **06-layouts-advanced.md** for grid, masonry, horizontal, and chat patterns
- Read **07-migration-troubleshooting.md** for FlatList and v1 migration

---

**Version:** 2.x (2.2.2) | **Source:** https://shopify.github.io/flash-list/docs/fundamentals/performant-components
