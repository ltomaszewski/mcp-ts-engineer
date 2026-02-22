# FlashList v1.7.x - Layouts & Advanced Usage

**Grid layouts, masonry, horizontal, inverted, sticky headers, sections**

**Source:** https://shopify.github.io/flash-list/docs/usage

---

## Grid Layouts

### Basic Grid (numColumns)

Use `numColumns` for grid layouts. Items fill in zig-zag order (left-to-right, top-to-bottom). Only works with `horizontal={false}`.

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

const ProductGrid = ({ products }: { products: Product[] }) => {
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
        estimatedItemSize={230}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
};
```

### Grid with Full-Width Items (overrideItemLayout)

Use `overrideItemLayout` to make specific items span multiple columns:

```typescript
interface ListItem {
  id: string;
  type: 'banner' | 'product';
  title: string;
}

const MixedGrid = ({ items }: { items: ListItem[] }) => {
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
        estimatedItemSize={150}
        getItemType={(item) => item.type}
        keyExtractor={(item) => item.id}
        overrideItemLayout={(layout, item, _index, maxColumns) => {
          if (item.type === 'banner') {
            layout.span = maxColumns;  // Full width
            layout.size = 120;         // Known height
          }
        }}
      />
    </View>
  );
};
```

---

## Masonry Layouts (MasonryFlashList)

In v1.7.x, masonry (Pinterest-style) layouts use the separate `MasonryFlashList` component, not a prop on `FlashList`.

```typescript
import { MasonryFlashList } from '@shopify/flash-list';

interface GalleryImage {
  id: string;
  url: string;
  height: number;
}

const MasonryGallery = ({ images }: { images: GalleryImage[] }) => {
  const renderItem = useCallback(({ item }: { item: GalleryImage }) => (
    <View style={{ margin: 4, borderRadius: 8, overflow: 'hidden' }}>
      <Image
        source={{ uri: item.url }}
        style={{ width: '100%', height: item.height }}
        resizeMode="cover"
      />
    </View>
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <MasonryFlashList
        data={images}
        numColumns={2}
        renderItem={renderItem}
        estimatedItemSize={200}
        keyExtractor={(item) => item.id}
        optimizeItemArrangement={true}
      />
    </View>
  );
};
```

### MasonryFlashList-Specific Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `optimizeItemArrangement` | `boolean` | `false` | Balances column heights for a more even layout |
| `overrideItemLayout` | `function` | -- | Override estimated size per item (important for masonry) |

**Note:** `MasonryFlashList` shares most props with `FlashList` (data, renderItem, estimatedItemSize, keyExtractor, etc.) but is a separate import.

```typescript
import { MasonryFlashList } from '@shopify/flash-list';

<MasonryFlashList
  data={images}
  numColumns={3}
  renderItem={renderItem}
  estimatedItemSize={150}
  optimizeItemArrangement={true}
  overrideItemLayout={(layout, item) => {
    layout.size = item.height;  // Provide exact height for better layout
  }}
/>
```

---

## Horizontal Lists (Carousel)

Set `horizontal={true}` for horizontal scrolling. When horizontal, `estimatedItemSize` refers to item **width**.

```typescript
import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface CarouselItem {
  id: string;
  title: string;
  color: string;
}

const HorizontalCarousel = ({ items }: { items: CarouselItem[] }) => {
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
        estimatedItemSize={200}
        keyExtractor={(item) => item.id}
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ paddingHorizontal: 16 }}
      />
    </View>
  );
};
```

**Note:** For horizontal lists, the parent must have a defined **height** (not just `flex: 1`).

---

## Chat App Pattern (Inverted List)

Use `inverted={true}` for chat-style lists where newest content appears at the bottom. The list renders bottom-to-top using scale transforms.

```typescript
import React, { useRef, useCallback } from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface Message {
  id: string;
  text: string;
  timestamp: number;
  isOwn: boolean;
}

const ChatList = ({ messages }: { messages: Message[] }) => {
  const listRef = useRef<FlashList<Message>>(null);

  // Data should be in reverse chronological order (newest first)
  const reversedMessages = [...messages].reverse();

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
        ref={listRef}
        data={reversedMessages}
        renderItem={renderItem}
        estimatedItemSize={80}
        keyExtractor={(item) => item.id}
        inverted={true}
      />
    </View>
  );
};
```

**Tips for chat lists:**
- Use `drawDistance={500}` or higher to reduce blank areas when scrolling up
- Pre-sort messages in reverse chronological order
- Use `keyExtractor` with message IDs for correct recycling

---

## Sticky Headers

Use `stickyHeaderIndices` to make specific items stick to the top of the list as the user scrolls past them.

```typescript
interface SectionItem {
  id: string;
  title: string;
  type: 'header' | 'row';
}

const SectionList = ({ items }: { items: SectionItem[] }) => {
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
        estimatedItemSize={50}
        keyExtractor={(item) => item.id}
        getItemType={(item) => item.type}
        stickyHeaderIndices={stickyIndices}
      />
    </View>
  );
};
```

---

## Infinite Scroll (Pagination)

```typescript
const PaginatedList = () => {
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
        estimatedItemSize={60}
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

## Next Steps

- Read **07-migration-troubleshooting.md** for FlatList migration guide
- Read **05-performance-guide.md** for optimization strategies

---

**Version:** 1.7.x | **Source:** https://shopify.github.io/flash-list/docs/usage
