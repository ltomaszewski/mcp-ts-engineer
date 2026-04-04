---
name: flash-list
description: "@shopify/flash-list v2.x performant lists - cell recycling, automatic sizing, masonry, grid, useRecyclingState."
when_to_use: "Use when implementing large lists, optimizing scroll performance, migrating from FlatList/v1, or building grid/masonry layouts."
---

# FlashList v2

> High-performance list component by Shopify with cell recycling -- drop-in FlatList replacement delivering up to 5x faster UI thread and 10x faster JS thread performance. v2 is a ground-up rewrite: JS-only (no native code), automatic sizing, New Architecture required.

**Package:** `@shopify/flash-list@^2.3.0`

---

## When to Use

**LOAD THIS SKILL** when user is:
- Implementing large or infinite scrolling lists
- Optimizing list scroll performance or debugging blank areas
- Creating grid layouts with `numColumns`
- Building masonry (Pinterest-style) layouts
- Migrating from React Native `FlatList` to FlashList
- Migrating from FlashList v1.x to v2.x
- Building chat interfaces with `maintainVisibleContentPosition` or `inverted`
- Managing per-item state in recycled cells with `useRecyclingState`
- Using sticky headers with `stickyHeaderConfig`
- Using inverted lists for chat-style bottom-up rendering

---

## Critical Rules

**ALWAYS:**
1. Require React Native New Architecture -- FlashList v2 does not run on the old architecture (bridge)
2. Use `keyExtractor` with stable unique IDs -- prevents recycling bugs when items reorder
3. Memoize `renderItem` with `useCallback` -- avoids re-creating the function every render, forcing all items to re-render
4. Use `getItemType` for heterogeneous lists -- maintains separate recycle pools per type, preventing expensive layout recalculations
5. Ensure parent container has defined dimensions -- FlashList needs `flex: 1` or explicit height on its parent
6. Use `useRecyclingState` for per-item state -- resets automatically when dependencies change during recycling

**NEVER:**
1. Use `estimatedItemSize` in v2 -- removed; FlashList v2 handles all sizing automatically
2. Use array index as key -- breaks recycling correctness when items are inserted, removed, or reordered
3. Use `useState` for per-item state -- state persists across recycled cells; use `useRecyclingState` or external state keyed by item ID
4. Wrap FlashList in a `ScrollView` -- FlashList manages its own scroll; nesting causes layout and performance issues
5. Test performance in dev mode -- dev mode adds debugging overhead; always benchmark in release builds
6. Use `MasonryFlashList` -- deprecated in v2; use `masonry` prop on `FlashList` instead
7. Use `inverted` with `maintainVisibleContentPosition` simultaneously -- choose one approach for bottom-up lists

---

## Core Patterns

### Basic List

```typescript
import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface Item {
  id: string;
  title: string;
}

export function MyList({ data }: { data: Item[] }): React.ReactElement {
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
      />
    </View>
  );
}
```

### Masonry Layout (v2)

```typescript
import React, { useCallback } from 'react';
import { View, Text, Image } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface GalleryItem {
  id: string;
  url: string;
  title: string;
}

export function MasonryGallery({ data }: { data: GalleryItem[] }): React.ReactElement {
  const renderItem = useCallback(({ item }: { item: GalleryItem }) => (
    <View style={{ margin: 4, borderRadius: 8, overflow: 'hidden' }}>
      <Image source={{ uri: item.url }} style={{ width: '100%', height: 200 }} />
      <Text style={{ padding: 8 }}>{item.title}</Text>
    </View>
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={data}
        masonry
        numColumns={2}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}
```

### Chat List with maintainVisibleContentPosition (v2)

```typescript
import React, { useCallback } from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface Message {
  id: string;
  text: string;
  isOwn: boolean;
}

export function ChatList({ messages }: { messages: Message[] }): React.ReactElement {
  const reversed = [...messages].reverse();

  const renderItem = useCallback(({ item }: { item: Message }) => (
    <View style={{ padding: 8, flexDirection: 'row', justifyContent: item.isOwn ? 'flex-end' : 'flex-start' }}>
      <View style={{ maxWidth: '75%', backgroundColor: item.isOwn ? '#007AFF' : '#e5e5ea', borderRadius: 16, padding: 12 }}>
        <Text style={{ color: item.isOwn ? '#fff' : '#000' }}>{item.text}</Text>
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
}
```

### Recycling-Safe Per-Item State (v2)

```typescript
import React, { useCallback } from 'react';
import { View, Text, Pressable } from 'react-native';
import { FlashList, useRecyclingState } from '@shopify/flash-list';

interface Item {
  id: string;
  title: string;
  liked: boolean;
}

function ItemComponent({ item }: { item: Item }): React.ReactElement {
  const [liked, setLiked] = useRecyclingState(item.liked, [item.id]);

  return (
    <View style={{ padding: 16, flexDirection: 'row', justifyContent: 'space-between' }}>
      <Text>{item.title}</Text>
      <Pressable onPress={() => setLiked(!liked)}>
        <Text>{liked ? 'Unlike' : 'Like'}</Text>
      </Pressable>
    </View>
  );
}

export function LikeableList({ data }: { data: Item[] }): React.ReactElement {
  const renderItem = useCallback(({ item }: { item: Item }) => (
    <ItemComponent item={item} />
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList data={data} renderItem={renderItem} keyExtractor={(item) => item.id} />
    </View>
  );
}
```

---

## Anti-Patterns

**BAD** -- Using estimatedItemSize (removed in v2):
```typescript
<FlashList data={data} renderItem={renderItem} estimatedItemSize={80} />
```

**GOOD** -- v2 handles sizing automatically:
```typescript
<FlashList data={data} renderItem={renderItem} keyExtractor={(item) => item.id} />
```

**BAD** -- Using deprecated MasonryFlashList:
```typescript
import { MasonryFlashList } from '@shopify/flash-list';
<MasonryFlashList data={data} numColumns={2} renderItem={renderItem} estimatedItemSize={200} />
```

**GOOD** -- Using masonry prop on FlashList:
```typescript
import { FlashList } from '@shopify/flash-list';
<FlashList data={data} masonry numColumns={2} renderItem={renderItem} />
```

**BAD** -- Using both inverted and maintainVisibleContentPosition:
```typescript
<FlashList data={messages} renderItem={renderItem} inverted={true}
  maintainVisibleContentPosition={{ startRenderingFromBottom: true }} />
```

**GOOD** -- Use inverted (v2.3.0+, simpler) for chat lists:
```typescript
<FlashList
  data={messages}
  renderItem={renderItem}
  inverted={true}
  onEndReached={loadOlderMessages}
/>
```

**ALSO GOOD** -- Use maintainVisibleContentPosition with reversed data (more control):
```typescript
const reversed = [...messages].reverse();
<FlashList
  data={reversed}
  renderItem={renderItem}
  maintainVisibleContentPosition={{ startRenderingFromBottom: true, autoscrollToBottomThreshold: 0.2 }}
  onStartReached={loadOlderMessages}
/>
```

**BAD** -- useState for per-item state (persists across recycled cells):
```typescript
const Item = ({ item }: { item: Item }) => {
  const [expanded, setExpanded] = useState(false);
  return <View>{expanded && <Details />}</View>;
};
```

**GOOD** -- useRecyclingState resets on dependency change:
```typescript
const Item = ({ item }: { item: Item }) => {
  const [expanded, setExpanded] = useRecyclingState(false, [item.id]);
  return <View>{expanded && <Details />}</View>;
};
```

---

## Quick Reference

| Task | Prop/Method | Example |
|------|-------------|---------|
| Create grid | `numColumns` | `numColumns={2}` |
| Enable masonry | `masonry` | `masonry numColumns={2}` |
| Handle multiple types | `getItemType` | `getItemType={(item) => item.type}` |
| Sticky section headers | `stickyHeaderIndices` | `stickyHeaderIndices={[0, 5]}` |
| Configure sticky headers | `stickyHeaderConfig` | `stickyHeaderConfig={{ offset: 50 }}` |
| Increase draw buffer | `drawDistance` | `drawDistance={250}` |
| Scroll to item | `scrollToIndex()` | `ref.current?.scrollToIndex({ index: 5 })` |
| Scroll to end | `scrollToEnd()` | `ref.current?.scrollToEnd({ animated: true })` |
| Inverted list (v2.3.0+) | `inverted` | `inverted={true}` |
| Chat list (bottom-up) | `maintainVisibleContentPosition` | `maintainVisibleContentPosition={{ startRenderingFromBottom: true }}` |
| Load older content | `onStartReached` | `onStartReached={fetchOlder}` |
| Horizontal carousel | `horizontal` | `horizontal={true}` |
| Infinite scroll | `onEndReached` | `onEndReached={fetchMore}` |
| Pull to refresh | `onRefresh` + `refreshing` | `onRefresh={refresh} refreshing={loading}` |
| Custom column span | `overrideItemLayout` | See `03-api-props.md` |
| Empty state | `ListEmptyComponent` | `ListEmptyComponent={<Empty />}` |
| Per-item state | `useRecyclingState` | `useRecyclingState(init, [item.id])` |
| Layout-aware state | `useLayoutState` | `useLayoutState(initialValue)` |
| Cap recycle pool | `maxItemsInRecyclePool` | `maxItemsInRecyclePool={50}` |
| Get visible items | `getVisibleIndices()` | `ref.current?.getVisibleIndices()` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and setup | [01-setup-installation.md](01-setup-installation.md) |
| Cell recycling and state hooks | [02-core-concepts.md](02-core-concepts.md) |
| All props with types/defaults | [03-api-props.md](03-api-props.md) |
| Ref methods and hooks | [04-api-methods-hooks.md](04-api-methods-hooks.md) |
| Performance optimization | [05-performance-guide.md](05-performance-guide.md) |
| Grid, masonry, chat layouts | [06-layouts-advanced.md](06-layouts-advanced.md) |
| v1-to-v2 migration + troubleshooting | [07-migration-troubleshooting.md](07-migration-troubleshooting.md) |

---

**Version:** 2.x (2.3.1) | **Source:** https://shopify.github.io/flash-list/docs/
