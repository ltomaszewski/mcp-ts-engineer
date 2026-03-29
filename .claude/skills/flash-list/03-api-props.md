# FlashList v2.x - Complete Props Reference

**All props with TypeScript types, defaults, and usage notes.**

**Source:** https://shopify.github.io/flash-list/docs/usage/

---

## Core Props (Required)

### data

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `data` | `ItemT[]` | Yes | -- |

Plain array of items to render.

```typescript
const data: Item[] = [
  { id: '1', title: 'First' },
  { id: '2', title: 'Second' },
];
<FlashList<Item> data={data} renderItem={renderItem} keyExtractor={(item) => item.id} />
```

---

### renderItem

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `renderItem` | `(info: { item: T; index: number; target: string; extraData?: any }) => ReactElement` | Yes | -- |

Render function for each item. The `target` parameter indicates rendering context:
- `'Cell'` -- normal visible rendering
- `'Measurement'` -- size calculation pass (not visible)
- `'StickyHeader'` -- rendering as a sticky header

```typescript
const renderItem = useCallback(({ item, index, target }: {
  item: Item; index: number; target: string;
}) => {
  if (target === 'Measurement') {
    return <View style={{ height: 80 }} />;
  }
  return (
    <View style={{ padding: 16 }}>
      <Text>{item.title}</Text>
    </View>
  );
}, []);
```

---

## Layout Props

### inverted (v2.3.0+)

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `inverted` | `boolean` | No | `false` |

Reverses the direction of the list. Uses CSS transforms (`scaleY(-1)` on iOS/web, `rotate(180deg)` on Android) to flip the list and its contents. Useful for chat-style interfaces where newest content appears at the bottom.

```typescript
<FlashList
  data={messages}
  inverted={true}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  onEndReached={loadOlderMessages}
/>
```

**Note:** On Android, `rotate(180deg)` causes the scrollbar to appear on the left side. Do not combine with `maintainVisibleContentPosition` -- choose one approach.

---

### horizontal

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `horizontal` | `boolean` | No | `false` |

Render items in a horizontal row. Items support any size and are resizable in v2. Automatic height adjustment when nested in vertical FlashLists.

---

### numColumns

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `numColumns` | `number` | No | `1` |

Number of columns for grid layout. Only works with `horizontal={false}`. Items fill in zig-zag order (left-to-right, top-to-bottom). Grid items equalize heights when side-by-side items differ.

```typescript
<FlashList data={data} numColumns={2} renderItem={renderItem} keyExtractor={(item) => item.id} />
```

---

### masonry

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `masonry` | `boolean` | No | `false` |

Enable masonry (Pinterest-style) layout for grid interfaces with varying item heights. Requires `numColumns > 1`. Replaces the deprecated `MasonryFlashList` component from v1.

```typescript
<FlashList data={data} masonry numColumns={2} renderItem={renderItem} keyExtractor={(item) => item.id} />
```

---

### optimizeItemArrangement

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `optimizeItemArrangement` | `boolean` | No | `true` |

When used with masonry layout, reduces differences in column height by reordering items. Enabled by default.

---

## Performance Props

### keyExtractor

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `keyExtractor` | `(item: T, index: number) => string` | Recommended | `index.toString()` |

Extracts a unique key for each item. Required for correct recycling behavior and layout animations. Never use array index as key for mutable data.

```typescript
keyExtractor={(item) => item.id}
```

---

### getItemType

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `getItemType` | `(item: T, index: number, extraData?: any) => string \| number \| undefined` | No | `0` |

Returns a type identifier per item. FlashList maintains separate recycle pools for each type, preventing expensive re-layouts when structurally different cells are swapped. Called frequently during scroll -- keep logic fast.

```typescript
getItemType={(item) => item.type} // 'header' | 'row' | 'ad'
```

---

### overrideItemLayout

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `overrideItemLayout` | `(layout: { span?: number }, item: T, index: number, maxColumns: number, extraData?: any) => void` | No | -- |

Override column span for specific items in grid layouts. **v2 change:** Only `span` is supported; `size` is no longer available (v2 handles sizing automatically).

```typescript
overrideItemLayout={(layout, item, _index, maxColumns) => {
  if (item.type === 'banner') {
    layout.span = maxColumns; // Full-width banner across all columns
  }
}}
```

---

### drawDistance

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `drawDistance` | `number` | No | platform default |

Distance in dp/px beyond the visible area where items are pre-rendered. Higher values reduce blank areas during fast scrolling but increase memory usage.

```typescript
<FlashList drawDistance={500} ... />
```

---

### extraData

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `extraData` | `any` | No | -- |

Marker property that triggers re-render of all items when changed. Use when renderItem depends on external state (FlashList implements PureComponent).

```typescript
<FlashList extraData={selectedId} ... />
```

---

### maxItemsInRecyclePool

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `maxItemsInRecyclePool` | `number` | No | no limit |

Caps the number of recycled item instances. Set to `0` to disable recycling entirely. Useful in scenarios with many item types where the pool grows large.

```typescript
<FlashList maxItemsInRecyclePool={50} ... />
```

---

## Scroll & Position Props

### initialScrollIndex

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `initialScrollIndex` | `number` | No | -- |

Start scrolling at a specific index instead of the top.

---

### initialScrollIndexParams

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `initialScrollIndexParams` | `{ viewOffset?: number }` | No | -- |

Additional configuration for `initialScrollIndex` with optional pixel offset.

---

### maintainVisibleContentPosition

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `maintainVisibleContentPosition` | `object` | No | enabled |

Controls scroll position preservation when content changes. Enabled by default in v2.

| Sub-property | Type | Default | Description |
|--------------|------|---------|-------------|
| `disabled` | `boolean` | `false` | Disable the behavior entirely |
| `autoscrollToTopThreshold` | `number` | -- | Auto-scroll to top when within this threshold |
| `autoscrollToBottomThreshold` | `number` | -- | Auto-scroll to bottom when within this threshold |
| `startRenderingFromBottom` | `boolean` | `false` | Render from the bottom (for chat lists) |
| `animateAutoScrollToBottom` | `boolean` | `true` | Animate auto-scroll to bottom |

```typescript
// Chat list configuration
<FlashList
  maintainVisibleContentPosition={{
    autoscrollToBottomThreshold: 0.2,
    startRenderingFromBottom: true,
  }}
/>

// Disable for data-reordering lists
<FlashList
  maintainVisibleContentPosition={{ disabled: true }}
/>
```

---

## Callback Props

### onEndReached / onEndReachedThreshold

| Property | Type | Default |
|----------|------|---------|
| `onEndReached` | `() => void` | -- |
| `onEndReachedThreshold` | `number` | -- |

`onEndReached` fires when scroll position is within `onEndReachedThreshold` visible lengths from the bottom. Use for infinite scroll / pagination.

---

### onStartReached / onStartReachedThreshold (v2 New)

| Property | Type | Default |
|----------|------|---------|
| `onStartReached` | `() => void` | -- |
| `onStartReachedThreshold` | `number` | -- |

Called when scroll position reaches the start of the list. Use for loading older content in chat-style interfaces (replaces `onEndReached` with `inverted`).

```typescript
<FlashList
  onStartReached={loadOlderMessages}
  onStartReachedThreshold={0.5}
/>
```

---

### onBlankArea

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `onBlankArea` | `(event: { offsetStart: number; offsetEnd: number; blankArea: number }) => void` | No | -- |

Reports visible blank space during scrolling. Values can be negative. Use for performance monitoring.

```typescript
onBlankArea={({ blankArea }) => {
  if (blankArea > 0) console.warn(`Blank: ${blankArea}px`);
}}
```

---

### onLoad

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `onLoad` | `(info: { elapsedTimeInMs: number }) => void` | No | -- |

Fires after items are first rendered. Reports actual draw time.

```typescript
onLoad={({ elapsedTimeInMs }) => {
  analytics.track('list_render_time', { ms: elapsedTimeInMs });
}}
```

---

### onCommitLayoutEffect (v2 New)

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `onCommitLayoutEffect` | `() => void` | No | -- |

Called before layout is committed. Can be used to measure list and make changes before paint. **Caution:** calling `setState` here risks infinite loops.

---

### onViewableItemsChanged

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `onViewableItemsChanged` | `(info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void \| null` | No | -- |

Called when the viewability of rows changes, as defined by `viewabilityConfig`.

---

### onChangeStickyIndex (v2.2.0+)

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `onChangeStickyIndex` | `(current: number, previous: number) => void` | No | -- |

Callback invoked when the currently displayed sticky header changes as you scroll.

---

## Header / Footer / Empty / Separator

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `ListHeaderComponent` | `ComponentType \| ReactElement \| null` | -- | Rendered at the top of all items |
| `ListHeaderComponentStyle` | `StyleProp<ViewStyle>` | -- | Style wrapper for header |
| `ListFooterComponent` | `ComponentType \| ReactElement \| null` | -- | Rendered at the bottom of all items |
| `ListFooterComponentStyle` | `StyleProp<ViewStyle>` | -- | Style wrapper for footer |
| `ListEmptyComponent` | `ComponentType \| ReactElement \| null` | -- | Displayed when `data` is empty |
| `ItemSeparatorComponent` | `ComponentType \| null` | -- | Rendered between items (not at edges). Receives `leadingItem` and `trailingItem` props |

---

## Sticky Header Props

### stickyHeaderIndices

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `stickyHeaderIndices` | `number[]` | No | -- |

Array of item indices that should stick to the top when scrolled past. In v2, sticky headers use the Animated API for seamless transitions.

---

### stickyHeaderConfig (v2.2.0+)

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `stickyHeaderConfig` | `object` | No | -- |

Controls sticky header behavior, animations, and appearance.

| Sub-property | Type | Default | Description |
|--------------|------|---------|-------------|
| `useNativeDriver` | `boolean` | `true` | Use native animations for smoother performance |
| `offset` | `number` | `0` | Distance from top where headers stick (for fixed navigation bars) |
| `backdropComponent` | `ComponentType \| ReactElement \| null` | -- | Visual effect behind sticky headers (e.g., blur) |
| `hideRelatedCell` | `boolean` | `false` | Hide the cell associated with the active sticky header |

```typescript
<FlashList
  stickyHeaderIndices={[0, 10, 20]}
  stickyHeaderConfig={{
    useNativeDriver: true,
    offset: 50,
    backdropComponent: <BlurView style={StyleSheet.absoluteFill} />,
    hideRelatedCell: true,
  }}
/>
```

---

## Refresh Props

| Property | Type | Default |
|----------|------|---------|
| `refreshing` | `boolean` | -- |
| `onRefresh` | `() => void` | -- |
| `refreshControl` | `ReactElement` | -- |
| `progressViewOffset` | `number` (Android only) | -- |

---

## Viewability Props

| Property | Type | Default |
|----------|------|---------|
| `viewabilityConfig` | `ViewabilityConfig` | -- |
| `viewabilityConfigCallbackPairs` | `ViewabilityConfigCallbackPair[]` | -- |

### viewabilityConfig Sub-Properties

| Sub-property | Type | Default | Description |
|--------------|------|---------|-------------|
| `minimumViewTime` | `number` | `250` | Duration (ms) item must be visible |
| `viewAreaCoveragePercentThreshold` | `number` | -- | Percent (0-100) of viewport coverage needed |
| `itemVisiblePercentThreshold` | `number` | -- | Percent of item that must be visible |
| `waitForInteraction` | `boolean` | `false` | Requires user interaction for calculations |

---

## Styling Props

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `style` | `StyleProp<ViewStyle>` | -- | Style for FlashList's parent container. Avoid adding padding |
| `contentContainerStyle` | `ContentStyle` | -- | Padding for entire scrollable content |
| `CellRendererComponent` | `ComponentType<any>` | -- | Custom wrapper around each cell. Receives `onLayout`, `index`, `style` |
| `renderScrollComponent` | `ComponentType<ScrollViewProps>` | -- | Custom ScrollView replacement |

`contentContainerStyle` supports: `backgroundColor`, `padding`, `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`, `paddingHorizontal`, `paddingVertical`.

---

## Advanced Props

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `overrideProps` | `object` | -- | Debug only: override internal props |

---

## Unsupported FlatList Props

These FlatList props are **not supported** in FlashList v2:

| Prop | Reason |
|------|--------|
| `getItemLayout` | FlashList handles layout internally |
| `windowSize` | Auto-calculated |
| `maxToRenderPerBatch` | Auto-optimized |
| `initialNumToRender` | Auto-calculated |
| `updateCellsBatchingPeriod` | Auto-optimized |
| `disableVirtualization` | Contradicts FlashList design |
| `columnWrapperStyle` | Not implemented; use `CellRendererComponent` |
| `debug` | Not implemented |
| `listKey` | Not implemented |
| `onScrollToIndexFailed` | Not implemented |
| `setNativeProps` | Not implemented |

---

## Removed v1 Props (Breaking Changes)

These props existed in v1 but are **removed** in v2:

| Prop | Replacement |
|------|-------------|
| `estimatedItemSize` | Automatic sizing (remove prop) |
| `estimatedListSize` | Automatic sizing (remove prop) |
| `estimatedFirstItemOffset` | Automatic sizing (remove prop) |
| `inverted` | **Re-added in v2.3.0** (uses CSS transforms); alternatively use `maintainVisibleContentPosition` |
| `disableAutoLayout` | Removed (no replacement needed) |
| `disableHorizontalListHeightMeasurement` | Removed (no replacement needed) |

---

**Version:** 2.x (2.3.1) | **Source:** https://shopify.github.io/flash-list/docs/usage/
