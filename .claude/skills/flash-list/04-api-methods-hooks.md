# FlashList v2.x - Methods, Ref API & Hooks

**Imperative scroll methods, ref access patterns, v2 hooks**

**Source:** https://shopify.github.io/flash-list/docs/usage/

---

## Accessing the FlashList Ref

FlashList v2 uses `FlashListRef<T>` as the ref type (changed from `FlashList<T>` in v1):

```typescript
import React, { useRef, useCallback } from 'react';
import { View, Text } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';

interface Item {
  id: string;
  title: string;
}

export function MyList({ data }: { data: Item[] }): React.ReactElement {
  const listRef = useRef<FlashListRef<Item>>(null);

  const scrollToTop = useCallback(() => {
    listRef.current?.scrollToIndex({ index: 0, animated: true });
  }, []);

  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View style={{ padding: 16 }}>
      <Text>{item.title}</Text>
    </View>
  ), []);

  return (
    <FlashList
      ref={listRef}
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
    />
  );
}
```

---

## Scroll Methods

### scrollToIndex

Scroll to a specific item by its index in the data array. v2 achieves pixel-perfect precision through progressive refinement, measuring neighboring items to refine target positions.

```typescript
listRef.current?.scrollToIndex({
  index: 10,
  animated: true,
  viewOffset: 0,
  viewPosition: 0,
});
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `index` | `number` | Required | Target item index |
| `animated` | `boolean` | `false` | Smooth scroll animation |
| `viewOffset` | `number` | `0` | Additional offset in pixels from the edge |
| `viewPosition` | `number` | `0` | Position within viewport: 0=top, 0.5=center, 1=bottom |

```typescript
// Center an item in the viewport
listRef.current?.scrollToIndex({ index: 50, animated: true, viewPosition: 0.5 });

// Scroll with offset (e.g., account for a floating header)
listRef.current?.scrollToIndex({ index: 10, animated: true, viewOffset: -64 });
```

---

### scrollToEnd

Scroll to the end of the list.

```typescript
listRef.current?.scrollToEnd({ animated: true });
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `animated` | `boolean` | `false` | Smooth scroll animation |

---

### scrollToTop (v2 New)

Scroll to the top of the list.

```typescript
listRef.current?.scrollToTop({ animated: true });
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `animated` | `boolean` | `false` | Smooth scroll animation |

---

### scrollToOffset

Scroll to a specific pixel offset. x-value for horizontal, y-value for vertical.

```typescript
listRef.current?.scrollToOffset({ offset: 500, animated: true });
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `offset` | `number` | Required | Target scroll offset in pixels |
| `animated` | `boolean` | `false` | Smooth scroll animation |

---

### scrollToItem

Scroll to a specific item object.

```typescript
listRef.current?.scrollToItem({ item: targetItem, animated: true, viewPosition: 0 });
```

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `item` | `T` | Required | The item object to scroll to |
| `animated` | `boolean` | `false` | Smooth scroll animation |
| `viewPosition` | `number` | `0` | Position within viewport |

---

## Query Methods (v2 New)

### getVisibleIndices

Returns indices currently visible in the viewport.

```typescript
const visibleIndices: number[] = listRef.current?.getVisibleIndices() ?? [];
```

---

### getLayout

Returns current layout dimensions and position.

```typescript
const layout = listRef.current?.getLayout();
// { x: number; y: number; width: number; height: number }
```

---

### getFirstVisibleIndex

Returns the index of the first visible item.

```typescript
const firstIndex: number = listRef.current?.getFirstVisibleIndex() ?? 0;
```

---

### getFirstItemOffset

Returns the first item offset for header calculations.

```typescript
const offset: number = listRef.current?.getFirstItemOffset() ?? 0;
```

---

### getWindowSize

Returns current rendered dimensions.

```typescript
const windowSize = listRef.current?.getWindowSize();
// { width: number; height: number }
```

---

## Utility Methods

### prepareForLayoutAnimationRender

Prepares FlashList for a layout animation. Call before triggering a state change that causes item additions/removals. Disables recycling for the next frame.

```typescript
import { LayoutAnimation } from 'react-native';

const deleteItem = (id: string): void => {
  listRef.current?.prepareForLayoutAnimationRender();
  LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
  setData((prev) => prev.filter((item) => item.id !== id));
};
```

**Note:** `LayoutAnimation` is experimental on Android. Stability is not guaranteed when used with FlashList.

---

### recordInteraction

Triggers viewability calculations when user interaction occurs. Useful with `viewabilityConfig.waitForInteraction`.

```typescript
listRef.current?.recordInteraction();
```

---

### recomputeViewableItems

Imperatively triggers viewability recalculation.

```typescript
listRef.current?.recomputeViewableItems();
```

---

### flashScrollIndicators

Momentarily displays scroll indicators.

```typescript
listRef.current?.flashScrollIndicators();
```

---

### getNativeScrollRef

Returns underlying scroll view reference.

```typescript
const scrollRef = listRef.current?.getNativeScrollRef();
```

---

### getScrollResponder

Returns scroll responder from underlying scroll view.

```typescript
const responder = listRef.current?.getScrollResponder();
```

---

### getScrollableNode

Returns native scrollable node reference.

```typescript
const node = listRef.current?.getScrollableNode();
```

---

## Hooks

### useRecyclingState

Manages per-item state that resets when the cell is recycled. See `02-core-concepts.md` for details.

```typescript
import { useRecyclingState } from '@shopify/flash-list';

const [liked, setLiked] = useRecyclingState(item.liked, [item.id], () => {
  // Optional reset callback
});
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialState` | `T` | Initial value (used on mount and reset) |
| `dependencies` | `any[]` | State resets when any dependency changes |
| `resetCallback` | `() => void` (optional) | Called when state resets |

**Returns:** `[state, setState]` tuple (same API as `useState`)

---

### useLayoutState

Like `useState` but communicates layout changes to FlashList for smooth resizing.

```typescript
import { useLayoutState } from '@shopify/flash-list';

const [isExpanded, setIsExpanded] = useLayoutState(false);
```

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialState` | `T` | Initial value |

**Returns:** `[state, setState]` tuple

**Use when:** State changes affect the item's dimensions and FlashList needs to adjust layout.

---

### useMappingHelper

Returns a function for creating mapping keys in `.map()` operations inside FlashList items. Ensures consistent key generation that works with FlashList's recycling system.

```typescript
import { useMappingHelper } from '@shopify/flash-list';

const ItemComponent = ({ item }: { item: Item }): React.ReactElement => {
  const { getMappingKey } = useMappingHelper();

  return (
    <View>
      {item.tags.map((tag, index) => (
        <Text key={getMappingKey(tag, index)}>{tag}</Text>
      ))}
    </View>
  );
};
```

| Return | Type | Description |
|--------|------|-------------|
| `getMappingKey` | `(itemKey: string, index: number) => string` | Generates recycling-safe keys |

---

### useFlashListContext

Exposes FlashList and ScrollView refs for use in child components or `CellRendererComponent`.

```typescript
import { useFlashListContext } from '@shopify/flash-list';

const ChildComponent = (): React.ReactElement => {
  const context = useFlashListContext();
  // Access FlashList ref and ScrollView ref

  return <View />;
};
```

---

## Helper Components

### LayoutCommitObserver

Detects when FlashList(s) complete layout commits. Useful when you have multiple nested FlashLists and need to know when all have finished rendering.

```typescript
import { LayoutCommitObserver } from '@shopify/flash-list';

<LayoutCommitObserver onLayoutCommit={() => {
  console.log('All nested lists have committed layout');
}}>
  <FlashList ... />
  <FlashList ... />
</LayoutCommitObserver>
```

---

## Inherited ScrollView Props

FlashList inherits all standard `ScrollView` props. Common ones:

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

---

## Practical Patterns

### Scroll-to-Top Button

```typescript
import React, { useRef, useState, useCallback } from 'react';
import { View, Pressable, Text } from 'react-native';
import { FlashList, FlashListRef } from '@shopify/flash-list';

interface Item {
  id: string;
  title: string;
}

export function ListWithScrollTop({ data }: { data: Item[] }): React.ReactElement {
  const listRef = useRef<FlashListRef<Item>>(null);
  const [showScrollTop, setShowScrollTop] = useState(false);

  const handleScroll = useCallback((event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    setShowScrollTop(offsetY > 300);
  }, []);

  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View style={{ padding: 16 }}>
      <Text>{item.title}</Text>
    </View>
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        ref={listRef}
        data={data}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        onScroll={handleScroll}
        scrollEventThrottle={100}
      />
      {showScrollTop && (
        <Pressable
          style={{ position: 'absolute', bottom: 20, right: 20 }}
          onPress={() => listRef.current?.scrollToTop({ animated: true })}
        >
          <Text>Scroll to Top</Text>
        </Pressable>
      )}
    </View>
  );
}
```

---

## See Also

- [03-api-props.md](03-api-props.md) -- Complete props reference
- [05-performance-guide.md](05-performance-guide.md) -- Optimization strategies
- [06-layouts-advanced.md](06-layouts-advanced.md) -- Complex layout patterns

---

**Version:** 2.x (2.3.1) | **Source:** https://shopify.github.io/flash-list/docs/usage/
