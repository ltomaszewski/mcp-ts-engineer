# FlashList - API Props Reference

**Complete props documentation with typed parameters**

---

## Core Props (Required & Essential)

### data

**Description**: Array of items to be rendered in the list.

```typescript
interface Props<T> {
  data: T[];
}

// Type-safe usage
const data: Item[] = [
  { id: '1', title: 'Item 1' },
  { id: '2', title: 'Item 2' },
];

<FlashList<Item>
  data={data}
  renderItem={({ item }) => <Text>{item.title}</Text>}
/>
```

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `data` | `T[]` | ✅ Yes | — |

---

### renderItem

**Description**: Render function called for each item in the data array.

```typescript
interface RenderItemProps<T> {
  item: T;
  index: number;
  target?: 'Cell' | 'Measurement' | 'StickyHeader';
  extraData?: any;
}

type RenderItem<T> = (props: RenderItemProps<T>) => React.ReactElement;

// Usage
const renderItem: RenderItem<Item> = ({ item, index, target }) => {
  // target = 'Cell' for normal rendering
  // target = 'Measurement' for size calculation (not visible)
  // target = 'StickyHeader' when used as sticky header

  if (target === 'Measurement') {
    // Skip expensive operations during measurement
    return <SimpleMeasurementPlaceholder />;
  }

  return (
    <View style={{ padding: 16 }}>
      <Text>{item.title}</Text>
      <Text style={{ color: '#666' }}>#{index + 1}</Text>
    </View>
  );
};

<FlashList
  data={data}
  renderItem={renderItem}
/>
```

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `renderItem` | `(props: RenderItemProps<T>) => ReactElement` | ✅ Yes | — |

---

### estimatedItemSize

**Description**: Average height (vertical) or width (horizontal) of list items in pixels. Used for initial scroll position and layout estimation.

```typescript
// For vertical list (most common)
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}  // Average item height in pixels
/>

// For horizontal list
<FlashList
  horizontal={true}
  data={data}
  renderItem={renderItem}
  estimatedItemSize={120}  // Average item width in pixels
/>
```

**Guidelines:**
- Measure your typical item and set accordingly
- 80% accuracy is good enough
- Too large → wasted render buffer
- Too small → potential blank cells
- If items are variable height, use average

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `estimatedItemSize` | `number` | ⚠️ Recommended | — |

**Common Values:**
- Simple text item: `48-60`
- Card with image: `120-150`
- Complex components: `200-300`

---

## Layout Configuration Props

### horizontal

**Description**: Render items horizontally in a row instead of vertically.

```typescript
// Vertical (default)
<FlashList
  data={data}
  horizontal={false}
  renderItem={renderItem}
  estimatedItemSize={100}  // Height
/>

// Horizontal
<FlashList
  data={data}
  horizontal={true}
  renderItem={renderItem}
  estimatedItemSize={120}  // Width
/>
```

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `horizontal` | `boolean` | No | `false` |

---

### numColumns

**Description**: Number of columns in grid layout. Only works with `horizontal={false}`.

```typescript
// Grid with 2 columns
<FlashList
  data={data}
  numColumns={2}
  renderItem={({ item }) => <GridCell item={item} />}
  estimatedItemSize={100}
/>

// Grid with 3 columns
<FlashList
  data={data}
  numColumns={3}
  renderItem={({ item }) => <GridCell item={item} />}
  estimatedItemSize={150}
/>
```

**Requirements:**
- Only works with `horizontal={false}`
- Items must be same height (unless using `masonry`)
- Use `overrideItemLayout` for variable column spans

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `numColumns` | `number` | No | `1` |

---

### masonry

**Description**: Enable masonry layout for grid with variable item heights.

```typescript
import { FlashList } from '@shopify/flash-list';

// Masonry grid (Pinterest-style)
<FlashList
  data={imageryData}
  numColumns={2}
  masonry={true}
  optimizeItemArrangement={true}
  renderItem={({ item }) => (
    <Image
      source={{ uri: item.url }}
      style={{
        height: item.height,  // Variable heights
        width: '100%'
      }}
    />
  )}
  estimatedItemSize={200}
/>
```

**Features:**
- Works with `numColumns > 1`
- Balances column heights
- Use `optimizeItemArrangement={true}` to reduce height differences

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `masonry` | `boolean` | No | `false` |

---

## Performance & Optimization Props

### getItemType

**Description**: Function that returns a unique type identifier for each item. Improves recycling by maintaining separate pools for different item types.

```typescript
interface Item {
  id: string;
  type: 'header' | 'row' | 'footer';
  title: string;
}

<FlashList
  data={mixedItems}
  renderItem={({ item }) => {
    if (item.type === 'header') {
      return <HeaderItem item={item} />;
    }
    return <RowItem item={item} />;
  }}
  estimatedItemSize={100}
  getItemType={(item, index) => item.type}
/>

// Return value can be:
// - string identifier ('header', 'row', etc.)
// - number type code (0, 1, 2, etc.)
// - undefined to use default type (0)
```

**Benefits:**
- Prevents header cells being recycled to row items
- Maintains type-specific render pools
- Significant performance improvement with multiple item types

⚠️ **Note**: This method is called frequently - keep it fast!

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `getItemType` | `(item: T, index: number, extraData?: any) => string \| number \| undefined` | No | — |

---

### keyExtractor

**Description**: Function to extract unique key for each item.

```typescript
interface Item {
  id: string;
  name: string;
}

<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}
  keyExtractor={(item, index) => item.id}
/>

// Default is to use index (not recommended)
// Always provide a stable key!
```

**Why Keys Matter:**
- Layout animations require unique identification
- Recycling works better with stable keys
- Prevents glitches when data reorders

⚠️ **Critical**: Never use array index as key unless data is immutable.

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `keyExtractor` | `(item: T, index: number) => string` | ⚠️ Recommended | `index.toString()` |

---

## Callback Props

### onLoad

**Description**: Called when list has finished rendering items for first time.

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}
  onLoad={({ elapsedTimeInMs }) => {
    console.log(`List loaded in ${elapsedTimeInMs}ms`);
    // Good place for analytics
    logPerformanceMetric('list_load_time', elapsedTimeInMs);
  }}
/>
```

**When Called:**
- After initial render is painted
- Not called if `ListEmptyComponent` renders
- Reports actual elapsed time

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `onLoad` | `(info: { elapsedTimeInMs: number }) => void` | No | — |

---

### onEndReached

**Description**: Called when scroll position reaches bottom of list.

```typescript
const [hasMore, setHasMore] = useState(true);
const [isLoading, setIsLoading] = useState(false);

const handleEndReached = async () => {
  if (isLoading || !hasMore) return;

  setIsLoading(true);
  const newItems = await fetchMoreItems();
  setData([...data, ...newItems]);
  setIsLoading(false);
};

<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}
  onEndReached={handleEndReached}
  onEndReachedThreshold={0.5}  // Trigger 50% before bottom
/>
```

| Property | Type | Required | Default |
|----------|------|----------|---------|
| `onEndReached` | `() => void` | No | — |
| `onEndReachedThreshold` | `number` | No | `0.5` |

---

## Next Steps

👉 Read **04-api-methods-hooks.md** for methods and custom hooks
👉 Read **05-performance-guide.md** for optimization strategies
