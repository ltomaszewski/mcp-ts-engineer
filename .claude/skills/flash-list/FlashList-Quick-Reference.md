# FlashList v2.x - Quick Reference Card

**Compact cheat sheet for FlashList v2 development**

---

## Installation

```bash
# React Native (New Architecture required)
yarn add @shopify/flash-list@^2.0.0
cd ios && pod install && cd ..

# Expo (SDK 54+)
npx expo install @shopify/flash-list
```

---

## Basic Setup

```typescript
import { FlashList } from '@shopify/flash-list';

<View style={{ flex: 1 }}>
  <FlashList
    data={data}
    renderItem={({ item }) => <Text>{item.title}</Text>}
    keyExtractor={(item) => item.id}
  />
</View>
```

---

## Essential Props

| Prop | Type | Purpose |
|------|------|---------|
| `data` | `T[]` | Items to render |
| `renderItem` | `(info) => ReactElement` | Render each item |
| `keyExtractor` | `(item, index) => string` | Unique key per item |
| `getItemType` | `(item) => string` | Type for separate recycle pools |
| `numColumns` | `number` | Grid columns |
| `masonry` | `boolean` | Masonry (Pinterest) layout |
| `horizontal` | `boolean` | Horizontal scrolling |
| `drawDistance` | `number` | Pre-render buffer (px) |
| `onEndReached` | `() => void` | Called near bottom |
| `onStartReached` | `() => void` | Called near top (chat) |
| `extraData` | `any` | Triggers re-render |
| `maintainVisibleContentPosition` | `object` | Scroll position preservation |
| `maxItemsInRecyclePool` | `number` | Cap recycle pool size |

---

## State in Recycled Cells

```typescript
// BAD: useState persists across recycled cells
const [expanded, setExpanded] = useState(false);

// GOOD: useRecyclingState resets on dependency change (v2)
import { useRecyclingState } from '@shopify/flash-list';
const [expanded, setExpanded] = useRecyclingState(false, [item.id]);

// ALSO GOOD: External state keyed by item ID
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
<FlashList extraData={expandedIds} ... />
```

---

## Scroll Control

```typescript
import { FlashListRef } from '@shopify/flash-list';
const listRef = useRef<FlashListRef<Item>>(null);

// Scroll to item
listRef.current?.scrollToIndex({
  index: 10,
  animated: true,
  viewPosition: 0.5,  // 0=top, 0.5=center, 1=bottom
});

// Scroll to top (v2)
listRef.current?.scrollToTop({ animated: true });

// Scroll to end
listRef.current?.scrollToEnd({ animated: true });

// Scroll to offset
listRef.current?.scrollToOffset({ offset: 500, animated: true });

// Get visible indices (v2)
const indices = listRef.current?.getVisibleIndices();
```

---

## Performance Optimization

```typescript
// 1. Type-based recycling for mixed content
<FlashList getItemType={(item) => item.type} />

// 2. Memoize renderItem
const renderItem = useCallback(({ item }) => (
  <MemoizedItem item={item} />
), []);

// 3. Use target for measurement optimization
const renderItem = useCallback(({ item, target }) => {
  if (target === 'Measurement') return <View style={{ height: 80 }} />;
  return <FullItem item={item} />;
}, []);

// 4. Test in release mode only
// npx react-native run-android --variant release
```

---

## Grid Layout

```typescript
<FlashList
  data={data}
  numColumns={2}
  renderItem={({ item }) => (
    <View style={{ flex: 1, margin: 8 }}>
      <Text>{item.title}</Text>
    </View>
  )}
  keyExtractor={(item) => item.id}
/>
```

---

## Masonry Layout (v2)

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={images}
  masonry
  numColumns={2}
  renderItem={({ item }) => (
    <Image style={{ height: item.height, width: '100%' }} source={{ uri: item.url }} />
  )}
  keyExtractor={(item) => item.id}
  optimizeItemArrangement={true}
/>
```

---

## Pagination

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  onEndReached={() => fetchMore()}
  onEndReachedThreshold={0.3}
  ListFooterComponent={isLoading ? <Spinner /> : null}
/>
```

---

## Chat Pattern (v2)

```typescript
const reversed = [...messages].reverse();

<FlashList
  data={reversed}
  renderItem={({ item }) => <ChatBubble msg={item} />}
  keyExtractor={(item) => item.id}
  maintainVisibleContentPosition={{
    autoscrollToBottomThreshold: 0.2,
    startRenderingFromBottom: true,
  }}
  onStartReached={loadOlderMessages}
  onStartReachedThreshold={0.5}
/>
```

---

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| State persists across cells | Use `useRecyclingState` or external state + `extraData` |
| Blank cells visible | Increase `drawDistance`, add `getItemType` |
| Slow with mixed items | Add `getItemType` |
| Index keys break on reorder | Use `keyExtractor` with unique IDs |
| Dev mode looks slow | Test release builds only |
| Nothing renders | Add `flex: 1` to parent container |
| Wrapped in ScrollView | Remove ScrollView, use `ListHeaderComponent` |
| Item movement on data change | `maintainVisibleContentPosition={{ disabled: true }}` |

---

## Unsupported FlatList Props

`getItemLayout`, `windowSize`, `maxToRenderPerBatch`, `initialNumToRender`, `updateCellsBatchingPeriod`, `disableVirtualization`, `columnWrapperStyle`, `debug`, `listKey`, `onScrollToIndexFailed`, `setNativeProps`

---

## Migration from FlatList

```typescript
// 1. Change import
import { FlashList } from '@shopify/flash-list';

// 2. Wrap in sized parent
<View style={{ flex: 1 }}>
  <FlashList
    data={data}
    renderItem={renderItem}
    keyExtractor={(item) => item.id}
  />
</View>

// 3. Remove unsupported props
// 4. Use useRecyclingState for per-item state
// 5. Test in release mode
```

---

## v2 Hooks

| Hook | Signature | Purpose |
|------|-----------|---------|
| `useRecyclingState` | `(init, deps, onReset?) => [state, setState]` | Per-item state that resets on recycle |
| `useLayoutState` | `(init) => [state, setState]` | State that triggers FlashList re-layout |
| `useMappingHelper` | `() => { getMappingKey }` | Recycling-safe keys for `.map()` |
| `useFlashListContext` | `() => context` | Access FlashList and ScrollView refs |

---

## Resources

- **Docs**: https://shopify.github.io/flash-list/docs/
- **GitHub**: https://github.com/Shopify/flash-list
- **NPM**: https://www.npmjs.com/package/@shopify/flash-list

---

**Version:** 2.x (2.2.2) | **Source:** https://shopify.github.io/flash-list/docs/
