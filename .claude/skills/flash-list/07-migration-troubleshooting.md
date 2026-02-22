# FlashList v2.x - Migration & Troubleshooting

**FlatList migration, v1-to-v2 migration, common issues, recycling pitfalls, debugging**

**Source:** https://shopify.github.io/flash-list/docs/v2-migration/

---

## v1-to-v2 Migration Guide

### Prerequisites

FlashList v2 requires **React Native New Architecture** (Fabric). It does not run on the old architecture (bridge). Ensure your project has New Architecture enabled before upgrading.

### Step-by-Step Migration

**Step 1: Upgrade package**

```bash
npm install @shopify/flash-list@^2.0.0
# or
yarn add @shopify/flash-list@^2.0.0
```

**Step 2: Remove size estimation props**

```typescript
// v1
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}        // REMOVE
  estimatedListSize={{ width: 375, height: 800 }}  // REMOVE
  estimatedFirstItemOffset={50}  // REMOVE
/>

// v2 -- automatic sizing
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>
```

**Step 3: Replace MasonryFlashList with masonry prop**

```typescript
// v1
import { MasonryFlashList } from '@shopify/flash-list';
<MasonryFlashList
  data={data}
  numColumns={2}
  renderItem={renderItem}
  estimatedItemSize={200}
/>

// v2
import { FlashList } from '@shopify/flash-list';
<FlashList
  data={data}
  masonry
  numColumns={2}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
/>
```

**Note:** `getColumnFlex` from v1's `MasonryFlashList` is not supported in v2.

**Step 4: Replace inverted with maintainVisibleContentPosition**

```typescript
// v1
<FlashList
  data={messages}
  renderItem={renderItem}
  inverted={true}
/>

// v2
const reversed = [...messages].reverse();
<FlashList
  data={reversed}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  maintainVisibleContentPosition={{
    autoscrollToBottomThreshold: 0.2,
    startRenderingFromBottom: true,
  }}
  onStartReached={loadOlderMessages}
  onStartReachedThreshold={0.5}
/>
```

**Step 5: Update ref type**

```typescript
// v1
import { FlashList } from '@shopify/flash-list';
const listRef = useRef<FlashList<Item>>(null);

// v2
import { FlashList, FlashListRef } from '@shopify/flash-list';
const listRef = useRef<FlashListRef<Item>>(null);
```

**Step 6: Update overrideItemLayout (remove `size`)**

```typescript
// v1
overrideItemLayout={(layout, item, _index, maxColumns) => {
  if (item.type === 'banner') {
    layout.span = maxColumns;
    layout.size = 200;  // REMOVE -- not supported in v2
  }
}}

// v2 -- only span is supported
overrideItemLayout={(layout, item, _index, maxColumns) => {
  if (item.type === 'banner') {
    layout.span = maxColumns;
  }
}}
```

**Step 7: Replace CellContainer with View**

```typescript
// v1
import { CellContainer } from '@shopify/flash-list';

// v2 -- CellContainer is no longer exported
import { View } from 'react-native';
```

**Step 8: Use new v2 hooks for per-item state**

```typescript
// v1: External state pattern (still works in v2)
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

// v2: New hook for per-item state
import { useRecyclingState } from '@shopify/flash-list';
const [isExpanded, setIsExpanded] = useRecyclingState(false, [item.id]);
```

---

## Removed v1 Props (Breaking Changes)

| Removed Prop | Replacement in v2 |
|---|---|
| `estimatedItemSize` | Automatic sizing (remove prop) |
| `estimatedListSize` | Automatic sizing (remove prop) |
| `estimatedFirstItemOffset` | Automatic sizing (remove prop) |
| `inverted` | Reverse data + `maintainVisibleContentPosition` |
| `disableAutoLayout` | Removed (no replacement needed) |
| `disableHorizontalListHeightMeasurement` | Removed (no replacement needed) |

## Deprecated Components

| Component | Replacement in v2 |
|---|---|
| `MasonryFlashList` | `FlashList` with `masonry` prop |
| `CellContainer` | React Native `View` |

---

## FlatList-to-FlashList v2 Migration Guide

### Step-by-Step

**Step 1: Install FlashList**

```bash
npm install @shopify/flash-list@^2.0.0
# Expo
npx expo install @shopify/flash-list
```

**Step 2: Replace import and component**

```typescript
// Before
import { FlatList } from 'react-native';
<FlatList data={data} renderItem={renderItem} keyExtractor={(item) => item.id} />

// After
import { FlashList } from '@shopify/flash-list';
<FlashList data={data} renderItem={renderItem} keyExtractor={(item) => item.id} />
```

**Step 3: Ensure parent has dimensions**

```typescript
// FlashList needs a parent with defined height
<View style={{ flex: 1 }}>
  <FlashList data={data} renderItem={renderItem} keyExtractor={(item) => item.id} />
</View>
```

**Step 4: Remove unsupported FlatList props**

| FlatList Prop | FlashList Alternative |
|---|---|
| `getItemLayout` | Not needed; use `overrideItemLayout` for spans |
| `windowSize` | Use `drawDistance` to control buffer |
| `maxToRenderPerBatch` | Auto-optimized |
| `initialNumToRender` | Auto-calculated |
| `updateCellsBatchingPeriod` | Auto-optimized |
| `disableVirtualization` | Not supported |
| `columnWrapperStyle` | Use `CellRendererComponent` |
| `debug` | Not implemented |
| `listKey` | Not implemented |
| `onScrollToIndexFailed` | Not implemented |
| `setNativeProps` | Not implemented |

**Step 5: Handle per-item state correctly**

```typescript
// FlatList: useState works (items remount)
// FlashList: useState persists across recycled cells!

// Use useRecyclingState for per-item state
import { useRecyclingState } from '@shopify/flash-list';
const [isExpanded, setIsExpanded] = useRecyclingState(false, [item.id]);

// Or use external state + extraData
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
<FlashList extraData={expandedIds} ... />
```

---

## Common Issues

### Issue 1: State Persists Across Recycled Cells

**Symptom:** Expanding Item A, scrolling away, and coming back finds a different item expanded. Or toggling a checkbox on one item affects another after scrolling.

**Root cause:** `useState` inside rendered items persists because the component instance is reused (recycled), not remounted.

```typescript
// BAD: State persists across recycled cells
const ItemComponent = ({ item }: { item: Item }): React.ReactElement => {
  const [isExpanded, setIsExpanded] = useState(false);
  return <View>{isExpanded && <Details />}</View>;
};

// GOOD: useRecyclingState resets on dependency change
import { useRecyclingState } from '@shopify/flash-list';

const ItemComponent = ({ item }: { item: Item }): React.ReactElement => {
  const [isExpanded, setIsExpanded] = useRecyclingState(false, [item.id]);
  return <View>{isExpanded && <Details />}</View>;
};
```

---

### Issue 2: Blank Cells During Scrolling

**Symptom:** White space visible while scrolling, especially during fast scrolls.

**Solutions:**

```typescript
// 1. Add getItemType for mixed content
<FlashList getItemType={(item) => item.type} ... />

// 2. Increase draw distance
<FlashList drawDistance={500} ... />

// 3. Simplify renderItem (memoize, reduce complexity)
const renderItem = useCallback(({ item }: { item: Item }) => (
  <MemoizedItem item={item} />
), []);

// 4. Use target parameter to skip expensive rendering during measurement
const renderItem = useCallback(({ item, target }: { item: Item; target: string }) => {
  if (target === 'Measurement') return <View style={{ height: 80 }} />;
  return <FullItem item={item} />;
}, []);
```

---

### Issue 3: Nothing Renders

**Symptom:** FlashList renders empty despite having data.

**Root causes and fixes:**

1. **Parent has no dimensions:**
```typescript
// BAD
<View>
  <FlashList data={data} renderItem={renderItem} />
</View>

// GOOD
<View style={{ flex: 1 }}>
  <FlashList data={data} renderItem={renderItem} keyExtractor={(item) => item.id} />
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

### Issue 4: Performance Worse Than Expected

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
| Complex nested components | Simplify or use `target === 'Measurement'` shortcut |

---

### Issue 5: Data Reordering Causes Item Movement

**Symptom:** Items visually jump when data is reordered.

**Root cause:** `maintainVisibleContentPosition` is enabled by default in v2 and tries to preserve scroll position.

```typescript
// Disable for lists where data reordering is expected
<FlashList
  data={data}
  renderItem={renderItem}
  maintainVisibleContentPosition={{ disabled: true }}
/>
```

---

## Migration Checklists

### From v1 to v2

- [ ] React Native New Architecture enabled
- [ ] Package upgraded to `@shopify/flash-list@^2.0.0`
- [ ] `estimatedItemSize` removed
- [ ] `estimatedListSize` removed
- [ ] `estimatedFirstItemOffset` removed
- [ ] `MasonryFlashList` replaced with `FlashList` + `masonry` prop
- [ ] `inverted` replaced with `maintainVisibleContentPosition`
- [ ] Ref type changed from `FlashList<T>` to `FlashListRef<T>`
- [ ] `overrideItemLayout` updated (remove `layout.size`, keep `layout.span`)
- [ ] `CellContainer` replaced with React Native `View`
- [ ] `disableAutoLayout` removed
- [ ] `disableHorizontalListHeightMeasurement` removed
- [ ] Consider using `useRecyclingState` for per-item state
- [ ] Test in release mode

### From FlatList to FlashList v2

- [ ] Install `@shopify/flash-list@^2.0.0`
- [ ] Replace `FlatList` import with `FlashList`
- [ ] Remove unsupported FlatList props
- [ ] Ensure parent has `flex: 1` or explicit height
- [ ] Replace `useState` in items with `useRecyclingState` or external state + `extraData`
- [ ] Add `getItemType` for heterogeneous lists
- [ ] Add `keyExtractor` with stable unique IDs
- [ ] Test in release mode

---

## Official Resources

- **Documentation**: https://shopify.github.io/flash-list/docs/
- **v2 Migration**: https://shopify.github.io/flash-list/docs/v2-migration/
- **What's New in v2**: https://shopify.github.io/flash-list/docs/v2-changes/
- **GitHub**: https://github.com/Shopify/flash-list
- **NPM**: https://www.npmjs.com/package/@shopify/flash-list

---

**Version:** 2.x (2.2.2) | **Source:** https://shopify.github.io/flash-list/docs/v2-migration/
