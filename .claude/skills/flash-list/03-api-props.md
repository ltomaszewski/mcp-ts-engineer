# FlashList v1.7.x - Complete Props Reference

**All props with TypeScript types, defaults, and usage notes.**

**Source:** https://shopify.github.io/flash-list/docs/usage
**Type source:** https://app.unpkg.com/@shopify/flash-list@1.7.6/files/src/FlashListProps.ts

---

## Core Props (Required / Essential)

### data

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `data` | `ReadonlyArray<T> \| null \| undefined` | Yes | -- |

Array of items to render. Supports `null`/`undefined` for loading states.

```typescript
const data: Item[] = [
  { id: '1', title: 'First' },
  { id: '2', title: 'Second' },
];
<FlashList<Item> data={data} renderItem={renderItem} estimatedItemSize={80} />
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
    return <View style={{ height: 80 }} />; // Skip expensive ops
  }
  return (
    <View style={{ padding: 16 }}>
      <Text>{item.title}</Text>
    </View>
  );
}, []);
```

---

### estimatedItemSize

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `estimatedItemSize` | `number` | Recommended | -- |

Average height (vertical) or width (horizontal) of items in pixels. FlashList uses this to calculate render buffer size and initial scroll positions.

**Guidelines:**
- Simple text row: `48-60`
- Card with image: `120-150`
- Complex multi-line: `200-300`
- 80% accuracy is sufficient
- Too large: wasted render buffer
- Too small: visible blank cells during fast scroll

```typescript
<FlashList data={data} renderItem={renderItem} estimatedItemSize={100} />
```

---

## Layout Props

### horizontal

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `horizontal` | `boolean \| null \| undefined` | No | `false` |

Render items in a horizontal row. When `true`, `estimatedItemSize` refers to item width.

---

### numColumns

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `numColumns` | `number` | No | `1` |

Number of columns for grid layout. Only works with `horizontal={false}`. Items fill in zig-zag order (left-to-right, top-to-bottom).

```typescript
<FlashList data={data} numColumns={2} renderItem={renderItem} estimatedItemSize={150} />
```

---

### inverted

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `inverted` | `boolean \| null \| undefined` | No | `false` |

Reverses scroll direction using scale transforms. Used for chat-style lists where newest content appears at the bottom.

```typescript
<FlashList data={reversedMessages} inverted={true} renderItem={renderItem} estimatedItemSize={80} />
```

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
| `getItemType` | `(item: T, index: number, extraData?: any) => string \| number \| undefined` | No | -- |

Returns a type identifier per item. FlashList maintains separate recycle pools for each type, preventing expensive re-layouts when a header cell is recycled as a row cell.

**Performance note:** Called frequently during scroll -- keep logic fast.

```typescript
getItemType={(item) => item.type} // 'header' | 'row' | 'ad'
```

---

### overrideItemLayout

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `overrideItemLayout` | `(layout: { span?: number; size?: number }, item: T, index: number, maxColumns: number, extraData?: any) => void` | No | -- |

Override estimated size or column span for specific items. Useful for:
- Grid items that span multiple columns
- Known-size items (improves `scrollToIndex` precision)
- Including separator size in estimates

```typescript
overrideItemLayout={(layout, item, index, maxColumns) => {
  if (item.type === 'banner') {
    layout.span = maxColumns; // Full-width banner across all columns
    layout.size = 200;        // Known height
  }
}}
```

---

### drawDistance

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `drawDistance` | `number` | No | platform default |

Distance in dp/px beyond the visible area where items are pre-rendered. Higher values reduce blank areas during fast scrolling but increase memory usage.

**Tip:** For chat apps with frequent top-insertions, use `500-1000`.

```typescript
<FlashList drawDistance={500} ... />
```

---

### extraData

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `extraData` | `any` | No | -- |

Marker property that triggers re-render of all items when changed. Use when renderItem depends on external state.

```typescript
<FlashList extraData={selectedId} ... />
```

---

### estimatedFirstItemOffset

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `estimatedFirstItemOffset` | `number` | No | -- |

Distance of the first item from the start of the list. Required for accurate `initialScrollIndex` behavior when using headers.

---

### estimatedListSize

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `estimatedListSize` | `{ height: number; width: number }` | No | -- |

Pre-define the visible area dimensions. Avoids a layout measurement pass, improving first render time.

---

## Header / Footer / Empty / Separator

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `ListHeaderComponent` | `ComponentType \| ReactElement \| null` | -- | Rendered at the top of all items |
| `ListHeaderComponentStyle` | `StyleProp<ViewStyle>` | -- | Style wrapper for header |
| `ListFooterComponent` | `ComponentType \| ReactElement \| null` | -- | Rendered at the bottom of all items |
| `ListFooterComponentStyle` | `StyleProp<ViewStyle>` | -- | Style wrapper for footer |
| `ListEmptyComponent` | `ComponentType \| ReactElement \| null` | -- | Displayed when `data` is empty |
| `ItemSeparatorComponent` | `ComponentType \| null` | -- | Rendered between items (not at edges) |

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
  ListHeaderComponent={<Header />}
  ListFooterComponent={isLoading ? <Spinner /> : null}
  ListEmptyComponent={<EmptyState />}
  ItemSeparatorComponent={() => <View style={{ height: 1, backgroundColor: '#eee' }} />}
/>
```

---

## Scroll & Interaction Props

### initialScrollIndex

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `initialScrollIndex` | `number \| null \| undefined` | No | -- |

Start rendering at this index instead of the top. Works best with `estimatedFirstItemOffset`.

---

### onEndReached / onEndReachedThreshold

| Property | Type | Default |
|----------|------|---------|
| `onEndReached` | `() => void \| null` | -- |
| `onEndReachedThreshold` | `number \| null` | `0.5` |

`onEndReached` fires when scroll position is within `onEndReachedThreshold` visible lengths from the bottom. Use for infinite scroll / pagination.

```typescript
<FlashList
  onEndReached={fetchMoreItems}
  onEndReachedThreshold={0.3} // Trigger at 30% from bottom
  ...
/>
```

---

### onBlankArea

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `onBlankArea` | `BlankAreaEventHandler` | No | -- |

Reports visible blank space during scrolling. Essential for debugging performance issues.

```typescript
onBlankArea={({ blankArea }) => {
  if (blankArea > 0) console.warn(`Blank: ${blankArea}px`);
}}
```

---

### stickyHeaderIndices

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `stickyHeaderIndices` | `number[]` | No | -- |

Array of item indices that should stick to the top when scrolled past.

```typescript
stickyHeaderIndices={[0, 5, 12]} // Items at these indices stick
```

---

## Refresh Props

| Property | Type | Default |
|----------|------|---------|
| `refreshing` | `boolean \| null` | -- |
| `onRefresh` | `() => void \| null` | -- |
| `refreshControl` | `ReactElement` | -- |
| `progressViewOffset` | `number` (Android only) | -- |

```typescript
<FlashList
  refreshing={isRefreshing}
  onRefresh={handleRefresh}
  ...
/>
```

---

## Viewability Props

| Property | Type | Default |
|----------|------|---------|
| `viewabilityConfig` | `ViewabilityConfig \| null` | -- |
| `onViewableItemsChanged` | `(info: { viewableItems: ViewToken[]; changed: ViewToken[] }) => void` | -- |
| `viewabilityConfigCallbackPairs` | `ViewabilityConfigCallbackPairs` | -- |

---

## Callback Props

### onLoad

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `onLoad` | `(info: { elapsedTimeInMs: number }) => void` | No | -- |

Fires after items are first rendered. Reports actual draw time -- useful for performance monitoring.

```typescript
onLoad={({ elapsedTimeInMs }) => {
  analytics.track('list_render_time', { ms: elapsedTimeInMs });
}}
```

---

## Styling Props

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `contentContainerStyle` | `ContentStyle` | -- | Padding for entire scrollable content |
| `CellRendererComponent` | `ComponentType<any>` | -- | Custom wrapper around each cell |
| `renderScrollComponent` | `ComponentType<ScrollViewProps>` | -- | Custom ScrollView replacement |

`contentContainerStyle` supports: `backgroundColor`, `padding`, `paddingTop`, `paddingBottom`, `paddingLeft`, `paddingRight`, `paddingHorizontal`, `paddingVertical`.

---

## Advanced Props

| Property | Type | Default | Purpose |
|----------|------|---------|---------|
| `disableAutoLayout` | `boolean` | `false` | Disable automatic child layout fixes |
| `disableHorizontalListHeightMeasurement` | `boolean` | `false` | Skip extra measurement for horizontal lists with deterministic height |
| `overrideProps` | `object` | -- | Debug: override internal props |

---

## Unsupported FlatList Props

These FlatList props are **not supported** in FlashList:

| Prop | Reason |
|------|--------|
| `getItemLayout` | FlashList handles layout internally |
| `windowSize` | Auto-calculated |
| `maxToRenderPerBatch` | Auto-optimized |
| `initialNumToRender` | Auto-calculated |
| `updateCellsBatchingPeriod` | Auto-optimized |
| `disableVirtualization` | Contradicts FlashList design |
| `columnWrapperStyle` | Use `CellRendererComponent` instead |

---

**Version:** 1.7.x | **Source:** https://shopify.github.io/flash-list/docs/usage
