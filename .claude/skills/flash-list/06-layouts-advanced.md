# FlashList - Layouts & Advanced Usage

**Grid layouts, sections, sticky headers, special patterns**

---

## Grid Layouts

### 2-Column Grid

```typescript
import { FlashList } from '@shopify/flash-list';

interface Product {
  id: string;
  title: string;
  price: number;
  image: string;
}

const ProductGrid = ({ products }: { products: Product[] }) => {
  return (
    <FlashList
      data={products}
      numColumns={2}
      renderItem={({ item }) => (
        <View
          style={{
            flex: 1,
            margin: 8,
            padding: 12,
            backgroundColor: '#f5f5f5',
            borderRadius: 8,
          }}
        >
          <Image
            source={{ uri: item.image }}
            style={{ width: '100%', height: 150 }}
          />
          <Text style={{ fontSize: 14, marginTop: 8 }}>{item.title}</Text>
          <Text style={{ fontSize: 16, fontWeight: 'bold' }}>
            ${item.price.toFixed(2)}
          </Text>
        </View>
      )}
      estimatedItemSize={250}
      getItemType={(item) => 'product'}
    />
  );
};
```

---

## Masonry Layouts (Pinterest-Style)

### Variable Height Masonry

```typescript
import { FlashList } from '@shopify/flash-list';

interface Image {
  id: string;
  url: string;
  height: number;  // Natural height of image
}

const MasonryGallery = ({ images }: { images: Image[] }) => {
  return (
    <FlashList
      data={images}
      numColumns={2}
      masonry={true}
      optimizeItemArrangement={true}  // Balance column heights
      renderItem={({ item }) => (
        <View style={{ margin: 4, overflow: 'hidden' }}>
          <Image
            source={{ uri: item.url }}
            style={{
              width: '100%',
              height: item.height,  // Variable heights
              resizeMode: 'cover',
            }}
          />
        </View>
      )}
      estimatedItemSize={250}
    />
  );
};
```

---

## Horizontal Lists (Carousel)

```typescript
const HorizontalList = ({ items }) => {
  return (
    <FlashList
      data={items}
      horizontal={true}
      renderItem={({ item }) => (
        <View
          style={{
            width: 200,
            height: 150,
            marginRight: 12,
            backgroundColor: '#007AFF',
            borderRadius: 8,
            justifyContent: 'center',
            alignItems: 'center',
          }}
        >
          <Text style={{ color: '#fff', fontSize: 16 }}>
            {item.title}
          </Text>
        </View>
      )}
      estimatedItemSize={200}
      contentContainerStyle={{ paddingHorizontal: 8 }}
    />
  );
};
```

---

## Chat App Pattern (Bottom-to-Top)

```typescript
interface Message {
  id: string;
  text: string;
  timestamp: number;
  isOwn: boolean;
}

const ChatApp = ({ messages }: { messages: Message[] }) => {
  const listRef = useRef<FlashList>(null);

  // Reverse messages for bottom-to-top rendering
  const reversedMessages = [...messages].reverse();

  useEffect(() => {
    // Scroll to newest message
    listRef.current?.scrollToIndex({
      index: 0,
      animated: true,
    });
  }, [messages.length]);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        ref={listRef}
        data={reversedMessages}
        renderItem={({ item }) => (
          <ChatBubble
            message={item}
            isOwn={item.isOwn}
          />
        )}
        estimatedItemSize={80}
        keyExtractor={(item) => item.id}
        maintainVisibleContentPosition={{
          minIndexForVisible: 0,
          autoscrollToBottomThreshold: 0.1,
          startRenderingFromBottom: true,
        }}
        inverted={true}  // Flip layout
      />
      <MessageInput />
    </View>
  );
};

const ChatBubble = ({ message, isOwn }) => (
  <View
    style={{
      padding: 12,
      flexDirection: 'row',
      justifyContent: isOwn ? 'flex-end' : 'flex-start',
    }}
  >
    <View
      style={{
        maxWidth: '80%',
        backgroundColor: isOwn ? '#007AFF' : '#e5e5ea',
        borderRadius: 12,
        padding: 12,
      }}
    >
      <Text style={{ color: isOwn ? '#fff' : '#000' }}>
        {message.text}
      </Text>
    </View>
  </View>
);
```

---

## Next Steps

👉 Read **07-migration-troubleshooting.md** for migration and debugging
