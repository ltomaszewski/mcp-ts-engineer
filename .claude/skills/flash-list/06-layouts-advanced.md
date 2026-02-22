# FlashList v2.x - Layouts & Advanced Usage

**Grid layouts, masonry, horizontal, chat (maintainVisibleContentPosition), sticky headers, sections**

**Source:** https://shopify.github.io/flash-list/docs/usage

---

## Grid Layouts

### Basic Grid (numColumns)

Use `numColumns` for grid layouts. Items fill in zig-zag order (left-to-right, top-to-bottom). Only works with `horizontal={false}`. In v2, grid items equalize heights when side-by-side items differ.

```typescript
import React, { useCallback } from 'react';
import { View, Text, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string;
}

const ProductGrid = ({ products }: { products: Product[] }): React.ReactElement => {
  const renderItem = useCallback(({ item }: { item: Product }) => (
    <View style={{ flex: 1, margin: 8, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
      <Image source={{ uri: item.imageUrl }} style={{ width: '100%', height: 150 }} />
      <View style={{ padding: 12 }}>
        <Text style={{ fontSize: 14 }}>{item.title}</Text>
        <Text style={{ fontSize: 16, fontWeight: 'bold' }}>${item.price.toFixed(2)}</Text>
      </View>
    </View>
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={products}
        numColumns={2}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};
```

### Grid with Full-Width Items (overrideItemLayout)

Use `overrideItemLayout` to make specific items span multiple columns. In v2, only `span` is supported; `size` is no longer available.

```typescript
interface ListItem {
  id: string;
  type: 'banner' | 'product';
  title: string;
}

const MixedGrid = ({ items }: { items: ListItem[] }): React.ReactElement => {
  const renderItem = useCallback(({ item }: { item: ListItem }) => {
    if (item.type === 'banner') {
      return (
        <View style={{ height: 120, backgroundColor: '#007AFF', justifyContent: 'center', padding: 16 }}>
          <Text style={{ color: '#fff', fontSize: 20, fontWeight: 'bold' }}>{item.title}</Text>
        </View>
      );
    }
    return (
      <View style={{ flex: 1, margin: 8, padding: 16, backgroundColor: '#f5f5f5', borderRadius: 8 }}>
        <Text>{item.title}</Text>
      </View>
    );
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={items}
        numColumns={2}
        renderItem={renderItem}
        getItemType={(item) => item.type}
        keyExtractor={(item) => item.id}
        overrideItemLayout={(layout, item, _index, maxColumns) => {
          if (item.type === 'banner') {
            layout.span = maxColumns;  // Full width
          }
        }}
      />
    </View>
  );
};
```

---

## Masonry Layouts (v2: `masonry` prop)

In v2, masonry (Pinterest-style) layouts use the `masonry` prop on `FlashList`. The separate `MasonryFlashList` component from v1 is deprecated.

```typescript
import React, { useCallback } from 'react';
import { View, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface GalleryImage {
  id: string;
  url: string;
}

const MasonryGallery = ({ images }: { images: GalleryImage[] }): React.ReactElement => {
  const renderItem = useCallback(({ item }: { item: GalleryImage }) => (
    <View style={{ margin: 4, borderRadius: 8, overflow: 'hidden' }}>
      <Image
        source={{ uri: item.url }}
        style={{ width: '100%', height: 200 }}
        resizeMode="cover"
      />
    </View>
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={images}
        masonry
        numColumns={2}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};
```

### Masonry with Custom Spans

Use `overrideItemLayout` with `span` to create items that span multiple columns:

```typescript
<FlashList
  data={images}
  masonry
  numColumns={3}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  overrideItemLayout={(layout, item) => {
    if (item.featured) {
      layout.span = 2;  // Item spans 2 of 3 columns
    }
  }}
/>
```

### Masonry-Specific Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `masonry` | `boolean` | `false` | Enable masonry layout |
| `numColumns` | `number` | `1` | Number of columns (must be > 1 for masonry) |
| `optimizeItemArrangement` | `boolean` | `true` | Reorder items to reduce column height differences |
| `overrideItemLayout` | `function` | -- | Override column span per item (`layout.span` only; no `layout.size` in v2) |

**Note:** `getColumnFlex` from v1's `MasonryFlashList` is not supported in v2.

---

## Horizontal Lists (Carousel)

Set `horizontal={true}` for horizontal scrolling. In v2, horizontal items support any size and are resizable. Automatic height adjustment when nested in vertical FlashLists.

```typescript
import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface CarouselItem {
  id: string;
  title: string;
  color: string;
}

const HorizontalCarousel = ({ items }: { items: CarouselItem[] }): React.ReactElement => {
  const renderItem = useCallback(({ item }: { item: CarouselItem }) => (
    <View
      style={{
        width: 200,
        height: 150,
        marginRight: 12,
        backgroundColor: item.color,
        borderRadius: 12,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <Text style={{ color: '#fff', fontSize: 16, fontWeight: 'bold' }}>
        {item.title}
      </Text>
    </View>
  ), []);

  return (
    <View style={{ height: 170 }}>
      <FlashList
        data={items}
        horizontal={true}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
};
```

**Note:** For horizontal lists, the parent must have a defined **height** (not just `flex: 1`).

**Known issue:** Horizontal lists + RTL cannot read padding from `contentContainerStyle`. Apply padding to header component instead.

---

## Chat App Pattern (maintainVisibleContentPosition)

In v2, `inverted` is deprecated. Use `maintainVisibleContentPosition` with reversed data for chat-style lists. This approach is more robust and avoids the scale transform issues of `inverted`.

```typescript
import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  isOwn: boolean;
}

const ChatList = ({ messages }: { messages: Message[] }): React.ReactElement => {
  // Reverse data so newest messages are at the bottom
  const reversed = [...messages].reverse();

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <View
      style={{
        padding: 8,
        flexDirection: 'row',
        justifyContent: item.isOwn ? 'flex-end' : 'flex-start',
      }}
    >
      <View
        style={{
          maxWidth: '75%',
          backgroundColor: item.isOwn ? '#007AFF' : '#e5e5ea',
          borderRadius: 16,
          padding: 12,
        }}
      >
        <Text style={{ color: item.isOwn ? '#fff' : '#000' }}>
          {item.text}
        </Text>
      </View>
    </View>
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={reversed}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        maintainVisibleContentPosition={{
          autoscrollToBottomThreshold: 0.2,
          startRenderingFromBottom: true,
        }}
        onStartReached={() => { /* load older messages */ }}
        onStartReachedThreshold={0.5}
      />
    </View>
  );
};
```

**Tips for chat lists:**
- Use `drawDistance={500}` or higher to reduce blank areas when scrolling up
- Use `onStartReached` to load older messages (replaces `onEndReached` with `inverted`)
- Use `keyExtractor` with message IDs for correct recycling
- If data reordering causes unwanted item movement, set `maintainVisibleContentPosition={{ disabled: true }}`

---

## Sticky Headers

Use `stickyHeaderIndices` to make specific items stick to the top of the list. In v2, sticky headers use the Animated API for seamless transitions.

```typescript
interface SectionItem {
  id: string;
  title: string;
  type: 'header' | 'row';
}

const SectionList = ({ items }: { items: SectionItem[] }): React.ReactElement => {
  // Calculate header indices
  const stickyIndices = items
    .map((item, index) => (item.type === 'header' ? index : -1))
    .filter((index) => index !== -1);

  const renderItem = useCallback(({ item }: { item: SectionItem }) => {
    if (item.type === 'header') {
      return (
        <View style={{ padding: 12, backgroundColor: '#f0f0f0' }}>
          <Text style={{ fontWeight: 'bold', fontSize: 16 }}>{item.title}</Text>
        </View>
      );
    }
    return (
      <View style={{ padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' }}>
        <Text>{item.title}</Text>
      </View>
    );
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={items}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.type}
        stickyHeaderIndices={stickyIndices}
      />
    </View>
  );
};
```

### stickyHeaderConfig (v2.2.0+)

Advanced sticky header configuration:

```typescript
import { BlurView } from 'expo-blur';

<FlashList
  data={items}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  stickyHeaderIndices={stickyIndices}
  stickyHeaderConfig={{
    useNativeDriver: true,
    offset: 50,         // Distance from top where headers stick
    backdropComponent: <BlurView style={StyleSheet.absoluteFill} />,
    hideRelatedCell: true,
  }}
  onChangeStickyIndex={(current, previous) => {
    console.log(`Sticky changed from ${previous} to ${current}`);
  }}
/>
```

---

## Infinite Scroll (Pagination)

```typescript
const PaginatedList = (): React.ReactElement => {
  const [data, setData] = useState<Item[]>([]);
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);

  const fetchMore = useCallback(async () => {
    if (isLoading || !hasMore) return;
    setIsLoading(true);

    const newItems = await api.getItems({ page: page + 1 });
    if (newItems.length === 0) {
      setHasMore(false);
    } else {
      setData((prev) => [...prev, ...newItems]);
      setPage((prev) => prev + 1);
    }
    setIsLoading(false);
  }, [isLoading, hasMore, page]);

  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View style={{ padding: 16 }}>
      <Text>{item.title}</Text>
    </View>
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onEndReached={fetchMore}
        onEndReachedThreshold={0.5}
        ListFooterComponent={
          isLoading ? <ActivityIndicator style={{ padding: 16 }} /> : null
        }
      />
    </View>
  );
};
```

---

## Reanimated Integration

FlashList v2 works with `react-native-reanimated`. Use `renderScrollComponent` to pass an animated scroll view:

```typescript
import Animated from 'react-native-reanimated';

<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  renderScrollComponent={Animated.ScrollView}
/>
```

---

## Next Steps

- Read **07-migration-troubleshooting.md** for FlatList and v1 migration guide
- Read **05-performance-guide.md** for optimization strategies

---

**Version:** 2.x (2.2.2) | **Source:** https://shopify.github.io/flash-list/docs/usage
