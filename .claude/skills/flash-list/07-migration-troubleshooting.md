# FlashList v1.7.x - Migration & Troubleshooting

**FlatList migration guide, common issues, recycling pitfalls, debugging**

**Source:** https://shopify.github.io/flash-list/docs/migration

---

## FlatList Migration Guide

### Step-by-Step Migration

**Step 1: Install FlashList**

```bash
# npm
npm install @shopify/flash-list

# yarn
yarn add @shopify/flash-list

# iOS pods
cd ios && pod install && cd ..

# Expo
npx expo install @shopify/flash-list
```

**Step 2: Replace import**

```typescript
// Before
import { FlatList } from 'react-native';

// After
import { FlashList } from '@shopify/flash-list';
```

**Step 3: Change component name**

```typescript
// Before
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>

// After
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>
```

**Step 4: Add estimatedItemSize**

```typescript
// FlashList requires estimatedItemSize
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  estimatedItemSize={80}  // Average item height in pixels
/>
```

**Step 5: Ensure parent has dimensions**

```typescript
// FlashList needs a parent with defined height
<View style={{ flex: 1 }}>
  <FlashList
    data={data}
    renderItem={renderItem}
    estimatedItemSize={80}
  />
</View>
```

**Step 6: Remove unsupported props**

Remove any FlatList-specific props that FlashList does not support (see table below).

---

## Unsupported FlatList Props

These FlatList props have no effect in FlashList v1.7.x:

| Prop | Reason | Alternative |
|------|--------|-------------|
| `getItemLayout` | FlashList handles layout internally | Use `overrideItemLayout` for known sizes |
| `windowSize` | Auto-calculated based on viewport | Use `drawDistance` to control buffer |
| `maxToRenderPerBatch` | Auto-optimized | Not needed |
| `initialNumToRender` | Auto-calculated | Not needed |
| `updateCellsBatchingPeriod` | Auto-optimized | Not needed |
| `disableVirtualization` | Contradicts FlashList design | Not supported |
| `columnWrapperStyle` | Not implemented | Use `CellRendererComponent` |

---

## Common Issues

### Issue 1: "estimatedItemSize is required"

**Warning message:**
```
FlashList requires an estimatedItemSize prop to efficiently render items.
```

**Solution:** Add the prop with the average item height:
```typescript
<FlashList estimatedItemSize={80} ... />
```

---

### Issue 2: State Persists Across Recycled Cells

**Symptom:** Expanding Item A, scrolling away, and coming back finds a different item expanded. Or toggling a checkbox on one item affects another after scrolling.

**Root cause:** `useState` inside rendered items persists because the component instance is reused (recycled), not remounted.

```typescript
// BAD: State persists across recycled cells
const ItemComponent = ({ item }: { item: Item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // isExpanded carries over when cell is recycled to a new item
  return <View>{isExpanded && <Details />}</View>;
};

// GOOD: External state keyed by item ID
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

const renderItem = useCallback(({ item }: { item: Item }) => (
  <View>
    {expandedIds.has(item.id) && <Details data={item} />}
  </View>
), [expandedIds]);

<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
  extraData={expandedIds}  // Required to trigger re-render
/>
```

---

### Issue 3: Blank Cells During Scrolling

**Symptom:** White space visible while scrolling, especially during fast scrolls.

**Root cause:** `estimatedItemSize` is too small, or `renderItem` is too slow.

**Solutions:**

```typescript
// 1. Increase estimatedItemSize
<FlashList estimatedItemSize={120} ... />  // Was 60, try larger

// 2. Monitor blank areas
<FlashList
  onBlankArea={(event) => {
    if (event.blankArea > 0) {
      console.warn(`Blank area: ${event.blankArea}px`);
    }
  }}
  ...
/>

// 3. Increase draw distance
<FlashList drawDistance={500} ... />

// 4. Simplify renderItem (memoize, reduce complexity)
const renderItem = useCallback(({ item }: { item: Item }) => (
  <MemoizedItem item={item} />
), []);
```

---

### Issue 4: Nothing Renders

**Symptom:** FlashList renders empty despite having data.

**Root causes and fixes:**

1. **Parent has no dimensions:**
```typescript
// BAD
<View>
  <FlashList data={data} renderItem={renderItem} estimatedItemSize={80} />
</View>

// GOOD
<View style={{ flex: 1 }}>
  <FlashList data={data} renderItem={renderItem} estimatedItemSize={80} />
</View>
```

2. **Wrapped in ScrollView:**
```typescript
// BAD
<ScrollView>
  <FlashList ... />
</ScrollView>

// GOOD -- use ListHeaderComponent/ListFooterComponent instead
<FlashList
  ListHeaderComponent={<HeaderContent />}
  ...
/>
```

---

### Issue 5: Performance Worse Than FlatList

**Root cause:** Usually testing in development mode.

```bash
# BAD: Dev mode has debugging overhead and smaller render buffer
npx react-native start

# GOOD: Always benchmark in release builds
npx react-native run-android --variant release
npx react-native run-ios --configuration Release
```

Other causes:

| Cause | Fix |
|-------|-----|
| Missing `getItemType` for mixed content | Add `getItemType` |
| Heavy inline renderItem | Memoize with `useCallback` + `React.memo` |
| Array index as key | Use `keyExtractor` with stable unique IDs |
| Very large `drawDistance` | Use platform default or tune gradually |
| Complex nested components | Simplify or use `target === 'Measurement'` shortcut |

---

## Performance Regression Checklist

When FlashList performance degrades, check these in order:

1. **Are you testing in release mode?** Dev mode is not representative.
2. **Is `estimatedItemSize` accurate?** Within 20% of actual average.
3. **Do you have `getItemType`?** Required for mixed item types.
4. **Is `renderItem` memoized?** Use `useCallback`.
5. **Are keys stable?** Use item IDs, not array indices.
6. **Is there `useState` in rendered items?** Move to external state.
7. **Is parent container sized?** Must have `flex: 1` or explicit height.
8. **Is FlashList wrapped in ScrollView?** Remove the wrapper.

---

## Migration Checklist

### From FlatList

- [ ] Install `@shopify/flash-list`
- [ ] Install iOS pods (if applicable)
- [ ] Replace `FlatList` import with `FlashList`
- [ ] Add `estimatedItemSize` prop
- [ ] Remove unsupported props (`getItemLayout`, `windowSize`, etc.)
- [ ] Ensure parent has `flex: 1` or explicit height
- [ ] Replace `useState` in items with external state + `extraData`
- [ ] Add `getItemType` for heterogeneous lists
- [ ] Test in release mode
- [ ] Monitor `onBlankArea` for issues

### Performance Optimization

- [ ] Verify `estimatedItemSize` accuracy
- [ ] Add `getItemType` for mixed items
- [ ] Memoize `renderItem` with `useCallback`
- [ ] Use `keyExtractor` with stable unique keys
- [ ] Wrap complex items in `React.memo`
- [ ] Test in release mode only
- [ ] Check `onBlankArea` for blank space
- [ ] Consider `overrideItemLayout` for known sizes

---

## Official Resources

- **Documentation**: https://shopify.github.io/flash-list/docs/
- **GitHub**: https://github.com/Shopify/flash-list
- **NPM**: https://www.npmjs.com/package/@shopify/flash-list

---

**Version:** 1.7.x | **Source:** https://shopify.github.io/flash-list/docs/migration
