# FlashList v1.7.x - Performance & Optimization

**Performance tuning, blank area debugging, getItemType, best practices**

**Source:** https://shopify.github.io/flash-list/docs/fundamentals/performant-components

---

## Performance Benchmarks

FlashList delivers significant improvements over FlatList, especially on low-end devices:

| Metric | FlatList | FlashList | Improvement |
|--------|----------|-----------|-------------|
| **UI Thread FPS** | ~10 FPS | ~48 FPS | **5x faster** |
| **JS Thread FPS** | ~6 FPS | ~60 FPS | **10x faster** |
| **Memory Usage** | Baseline | ~4% less | Lower allocation |
| **Blank Area** | Frequent | Rare | Significant reduction |

Benchmarked on Moto G10 (low-end Android device).

**Source:** https://shopify.github.io/flash-list/docs/

---

## Core Performance Strategy

### 1. Accurate estimatedItemSize (Most Important)

`estimatedItemSize` is the single most impactful prop for performance. It determines how many cells FlashList pre-allocates and how large the render buffer is.

```typescript
// BAD: No estimate -- blank cells and console warning
<FlashList
  data={data}
  renderItem={renderItem}
/>

// GOOD: Accurate estimate
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}
/>
```

**How to determine the correct size:**

```typescript
// Method 1: Calculate from design specs
const ITEM_HEIGHT = 16 + 16 + 20 + 16 + 16;
// padding-top + padding-bottom + text-height + margin-top + margin-bottom
// = 84 pixels

// Method 2: Measure a representative item at runtime
const MeasureItem = ({ item }: { item: Item }) => (
  <View
    onLayout={(e) => {
      console.log('Item height:', e.nativeEvent.layout.height);
    }}
    style={{ padding: 16 }}
  >
    <Text style={{ fontSize: 16 }}>{item.title}</Text>
  </View>
);

// Method 3: Use FlashList's console warning
// FlashList logs the average measured size if estimatedItemSize is missing
// Use that number as your estimate
```

**Guidelines:**

| Content Type | Typical Range |
|---|---|
| Simple text row | 48-60 |
| Text with subtitle | 60-80 |
| Card with image | 120-150 |
| Complex multi-line | 200-300 |

- 80% accuracy is sufficient
- Too large: wasted render buffer, extra memory
- Too small: blank cells visible during fast scrolling

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
  estimatedItemSize={100}
/>

// GOOD: Separate pools per type -- no cross-type recycling
<FlashList
  data={mixedItems}
  renderItem={({ item }) => {
    if (item.type === 'header') return <HeaderItem data={item} />;
    if (item.type === 'ad') return <AdItem data={item} />;
    return <RowItem data={item} />;
  }}
  estimatedItemSize={100}
  getItemType={(item) => item.type}
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
  estimatedItemSize={80}
/>

// GOOD: Memoized function -- stable reference
const renderItem = useCallback(({ item }: { item: Item }) => (
  <Text>{item.title}</Text>
), []);

<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
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
  estimatedItemSize={80}
  // No keyExtractor -- defaults to index.toString()
/>

// GOOD: Stable unique ID
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
  keyExtractor={(item) => item.id}
/>
```

---

### 5. Provide overrideItemLayout for Known Sizes

When you know exact item sizes, providing them improves `scrollToIndex` accuracy and reduces layout recalculations:

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}
  numColumns={2}
  overrideItemLayout={(layout, item, index, maxColumns) => {
    if (item.type === 'banner') {
      layout.span = maxColumns;  // Full-width banner
      layout.size = 200;         // Known height
    } else {
      layout.size = 120;         // Known card height
    }
  }}
/>
```

---

## Blank Area Debugging

Blank areas (white space visible during scrolling) are the primary performance indicator for list quality.

### Using onBlankArea

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
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
| `estimatedItemSize` too small | Frequent blank areas | Increase estimate |
| Heavy `renderItem` | Blank during fast scroll | Memoize, simplify |
| Missing `getItemType` | Blank after mixed content | Add `getItemType` |
| Slow network images | Blank where images load | Use placeholder images |
| Small `drawDistance` | Blank at edges | Increase `drawDistance` |

### Increasing Draw Distance

`drawDistance` controls how far beyond the visible area FlashList pre-renders. Higher values reduce blank areas but use more memory:

```typescript
// Default is platform-dependent
// Increase for content-heavy lists or fast-scrolling scenarios
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
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

// GOOD: External state keyed by item ID
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
  <FlashList data={data} renderItem={renderItem} estimatedItemSize={80} />
</ScrollView>

// GOOD: Use ListHeaderComponent and ListFooterComponent instead
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
  ListHeaderComponent={<HeaderContent />}
  ListFooterComponent={<FooterContent />}
/>
```

### Pitfall 4: Missing Parent Dimensions

```typescript
// BAD: Parent has no height -- FlashList renders nothing
<View>
  <FlashList data={data} renderItem={renderItem} estimatedItemSize={80} />
</View>

// GOOD: Parent has flex: 1 or explicit height
<View style={{ flex: 1 }}>
  <FlashList data={data} renderItem={renderItem} estimatedItemSize={80} />
</View>
```

---

## Performance Checklist

- [ ] `estimatedItemSize` set and accurate (within 20% of actual average)
- [ ] `getItemType` provided for mixed-content lists
- [ ] `renderItem` memoized with `useCallback`
- [ ] `keyExtractor` uses stable unique IDs (not array index)
- [ ] No `useState` inside rendered items (use external state)
- [ ] No `ScrollView` wrapping FlashList
- [ ] Parent container has defined dimensions (`flex: 1`)
- [ ] Performance tested in release build (not dev mode)
- [ ] `onBlankArea` monitored during development
- [ ] Heavy components wrapped in `React.memo`

---

## Next Steps

- Read **06-layouts-advanced.md** for grid, horizontal, and chat patterns
- Read **07-migration-troubleshooting.md** for FlatList migration

---

**Version:** 1.7.x | **Source:** https://shopify.github.io/flash-list/docs/fundamentals/performant-components
