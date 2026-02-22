# FlashList v1.7.x - Methods & Ref API

**Imperative scroll methods, ref access patterns**

**Source:** https://shopify.github.io/flash-list/docs/usage

---

## Accessing the FlashList Ref

FlashList exposes imperative methods through a React ref. Use `useRef` to obtain the ref:

```typescript
import React, { useRef } from 'react';
import { FlashList } from '@shopify/flash-list';

interface Item {
  id: string;
  title: string;
}

export function MyList({ data }: { data: Item[] }) {
  const listRef = useRef<FlashList<Item>>(null);

  const scrollToTop = () => {
    listRef.current?.scrollToIndex({ index: 0, animated: true });
  };

  return (
    <FlashList
      ref={listRef}
      data={data}
      renderItem={({ item }) => <Text>{item.title}</Text>}
      estimatedItemSize={80}
      keyExtractor={(item) => item.id}
    />
  );
}
```

---

## Scroll Methods

### scrollToIndex

Scroll to a specific item by its index in the data array.

```typescript
listRef.current?.scrollToIndex({
  index: 10,
  animated: true,
  viewOffset: 0,
  viewPosition: 0,
});
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `index` | `number` | Required | Target item index |
| `animated` | `boolean` | `false` | Smooth scroll animation |
| `viewOffset` | `number` | `0` | Additional offset in pixels from the edge |
| `viewPosition` | `number` | `0` | Position within viewport: 0=top, 0.5=center, 1=bottom |

**Usage notes:**
- Accuracy depends on `estimatedItemSize`. If items vary significantly, use `overrideItemLayout` to provide exact sizes for better precision.
- If the target index is far from the current position, the scroll may not land perfectly. Use `estimatedFirstItemOffset` when headers are present.

```typescript
// Center an item in the viewport
listRef.current?.scrollToIndex({
  index: 50,
  animated: true,
  viewPosition: 0.5,
});

// Scroll with offset (e.g., account for a floating header)
listRef.current?.scrollToIndex({
  index: 10,
  animated: true,
  viewOffset: -64,  // Offset by header height
});
```

---

### scrollToEnd

Scroll to the end of the list.

```typescript
listRef.current?.scrollToEnd({ animated: true });
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `animated` | `boolean` | `false` | Smooth scroll animation |

**Common use case:** Chat applications scrolling to the latest message.

```typescript
// Auto-scroll to bottom when new message arrives
useEffect(() => {
  if (messages.length > 0) {
    listRef.current?.scrollToEnd({ animated: true });
  }
}, [messages.length]);
```

---

### scrollToOffset

Scroll to a specific pixel offset.

```typescript
listRef.current?.scrollToOffset({
  offset: 500,
  animated: true,
});
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `offset` | `number` | Required | Target scroll offset in pixels |
| `animated` | `boolean` | `false` | Smooth scroll animation |

**Use case:** Restoring a previous scroll position.

```typescript
// Save and restore scroll position
const [savedOffset, setSavedOffset] = useState(0);

<FlashList
  ref={listRef}
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
  onScroll={(event) => {
    setSavedOffset(event.nativeEvent.contentOffset.y);
  }}
/>

// Later, restore position
listRef.current?.scrollToOffset({ offset: savedOffset, animated: false });
```

---

### scrollToItem

Scroll to a specific item object (finds it by reference equality or `keyExtractor`).

```typescript
listRef.current?.scrollToItem({
  item: targetItem,
  animated: true,
  viewPosition: 0,
});
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `item` | `T` | Required | The item object to scroll to |
| `animated` | `boolean` | `false` | Smooth scroll animation |
| `viewPosition` | `number` | `0` | Position within viewport |

**Note:** This method scans the data array to find the item's index. For large datasets, prefer `scrollToIndex` if you already know the index.

---

### recordInteraction

Tells FlashList that an interaction has occurred, which can be used to optimize rendering priority.

```typescript
listRef.current?.recordInteraction();
```

This is inherited from the underlying `RecyclerListView`. Calling it signals that the user has interacted with the list, which may adjust internal rendering priorities.

---

### prepareForLayoutAnimationRender

Prepares FlashList for a layout animation. Call this before triggering a state change that causes item additions/removals when you want smooth layout animations.

```typescript
// Prepare before data change that triggers animation
listRef.current?.prepareForLayoutAnimationRender();

// Then update data
setData(newData);
```

**Use case:** Smooth insert/delete animations when combined with React Native's `LayoutAnimation`:

```typescript
import { LayoutAnimation } from 'react-native';

const deleteItem = (id: string) => {
  listRef.current?.prepareForLayoutAnimationRender();
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setData((prev) => prev.filter((item) => item.id !== id));
};
```

---

## Inherited ScrollView Props

FlashList inherits all standard `ScrollView` props from React Native. Common ones used with FlashList:

| Prop | Type | Description |
|------|------|-------------|
| `onScroll` | `(event: NativeScrollEvent) => void` | Scroll position updates |
| `onMomentumScrollEnd` | `(event: NativeScrollEvent) => void` | Fires when momentum scroll ends |
| `scrollEventThrottle` | `number` | How often onScroll fires (ms) |
| `showsVerticalScrollIndicator` | `boolean` | Show/hide vertical scrollbar |
| `showsHorizontalScrollIndicator` | `boolean` | Show/hide horizontal scrollbar |
| `bounces` | `boolean` | iOS bounce effect |
| `overScrollMode` | `string` | Android overscroll mode |
| `keyboardDismissMode` | `string` | Keyboard dismiss behavior |
| `keyboardShouldPersistTaps` | `string` | Tap behavior when keyboard open |

```typescript
<FlashList
  ref={listRef}
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
  scrollEventThrottle={16}
  showsVerticalScrollIndicator={false}
  keyboardDismissMode="on-drag"
  keyboardShouldPersistTaps="handled"
  onScroll={(event) => {
    const { contentOffset } = event.nativeEvent;
    console.log('Scroll Y:', contentOffset.y);
  }}
/>
```

---

## Practical Patterns

### Scroll-to-Top Button

```typescript
import React, { useRef, useState, useCallback } from 'react';
import { View, Pressable, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';

export function ListWithScrollTop({ data }: { data: Item[] }) {
  const listRef = useRef<FlashList<Item>>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 300);
  }, []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        ref={listRef}
        data={data}
        renderItem={renderItem}
        estimatedItemSize={80}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      />
      {showScrollTop && (
        <Pressable
          style={{ position: 'absolute', bottom: 20, right: 20 }}
          onPress={() => {
            listRef.current?.scrollToIndex({ index: 0, animated: true });
          }}
        >
          <Text>Scroll to Top</Text>
        </Pressable>
      )}
    </View>
  );
}
```

### Jump to Section

```typescript
const sectionIndices = { A: 0, B: 15, C: 30 };

const jumpToSection = (letter: string) => {
  const index = sectionIndices[letter];
  if (index !== undefined) {
    listRef.current?.scrollToIndex({ index, animated: true });
  }
};
```

---

## Next Steps

- Read **05-performance-guide.md** for optimization strategies
- Read **06-layouts-advanced.md** for complex layout patterns

---

**Version:** 1.7.x | **Source:** https://shopify.github.io/flash-list/docs/usage
