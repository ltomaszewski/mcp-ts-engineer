# FlashList v1.7.x - Quick Reference Card

**Compact cheat sheet for FlashList development**

---

## Installation

```bash
# React Native
yarn add @shopify/flash-list
cd ios && pod install && cd ..

# Expo
npx expo install @shopify/flash-list
```

---

## Basic Setup

```typescript
import { FlashList } from '@shopify/flash-list';

<FlashList
  data={data}
  renderItem={({ item }) => <Text>{item.title}</Text>}
  estimatedItemSize={80}
  keyExtractor={(item) => item.id}
/>
```

---

## Essential Props

| Prop | Type | Purpose |
|------|------|---------|
| `data` | `T[]` | Items to render |
| `renderItem` | `(info) => ReactElement` | Render each item |
| `estimatedItemSize` | `number` | Average item height (px) |
| `keyExtractor` | `(item, index) => string` | Unique key per item |
| `getItemType` | `(item) => string` | Type for different item styles |
| `numColumns` | `number` | Grid columns |
| `horizontal` | `boolean` | Horizontal scrolling |
| `inverted` | `boolean` | Bottom-to-top (chat) |
| `drawDistance` | `number` | Pre-render buffer (px) |
| `onEndReached` | `() => void` | Called near bottom |
| `onBlankArea` | `(event) => void` | Blank space detected |
| `extraData` | `any` | Triggers re-render |

---

## State in Recycled Cells

```typescript
// BAD: useState persists across recycled cells
const [expanded, setExpanded] = useState(false);

// GOOD: External state keyed by item ID
const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
const renderItem = useCallback(({ item }) => (
  <View>{expandedIds.has(item.id) && <Details />}</View>
), [expandedIds]);

<FlashList extraData={expandedIds} ... />
```

---

## Scroll Control

```typescript
const listRef = useRef<FlashList<Item>>(null);

// Scroll to item
listRef.current?.scrollToIndex({
  index: 10,
  animated: true,
  viewPosition: 0.5,  // 0=top, 0.5=center, 1=bottom
});

// Scroll to end
listRef.current?.scrollToEnd({ animated: true });

// Scroll to offset
listRef.current?.scrollToOffset({ offset: 500, animated: true });
```

---

## Performance Optimization

```typescript
// 1. Accurate estimated size
<FlashList estimatedItemSize={100} />

// 2. Type-based recycling for mixed content
<FlashList getItemType={(item) => item.type} />

// 3. Memoize renderItem
const renderItem = useCallback(({ item }) => (
  <MemoizedItem item={item} />
), []);

// 4. Monitor blank areas
<FlashList onBlankArea={(e) => console.warn(e.blankArea)} />

// 5. Test in release mode only
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
  estimatedItemSize={200}
/>
```

---

## Masonry Layout

```typescript
import { MasonryFlashList } from '@shopify/flash-list';

<MasonryFlashList
  data={images}
  numColumns={2}
  renderItem={({ item }) => (
    <Image style={{ height: item.height, width: '100%' }} source={{ uri: item.url }} />
  )}
  estimatedItemSize={200}
  optimizeItemArrangement={true}
/>
```

---

## Pagination

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
  onEndReached={() => fetchMore()}
  onEndReachedThreshold={0.3}
  ListFooterComponent={isLoading ? <Spinner /> : null}
/>
```

---

## Chat Pattern (Inverted)

```typescript
const reversed = [...messages].reverse();

<FlashList
  data={reversed}
  renderItem={({ item }) => <ChatBubble msg={item} />}
  estimatedItemSize={80}
  inverted={true}
  keyExtractor={(item) => item.id}
/>
```

---

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| State persists across cells | Use external state + `extraData` |
| Blank cells visible | Increase `estimatedItemSize` or `drawDistance` |
| Slow with mixed items | Add `getItemType` |
| Index keys break on reorder | Use `keyExtractor` with unique IDs |
| Dev mode looks slow | Test release builds only |
| Nothing renders | Add `flex: 1` to parent container |
| Wrapped in ScrollView | Remove ScrollView, use ListHeaderComponent |

---

## Unsupported FlatList Props

`getItemLayout`, `windowSize`, `maxToRenderPerBatch`, `initialNumToRender`, `updateCellsBatchingPeriod`, `disableVirtualization`, `columnWrapperStyle`

---

## Migration from FlatList

```typescript
// 1. Change import
import { FlashList } from '@shopify/flash-list';

// 2. Add estimatedItemSize
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}  // ADD THIS
  keyExtractor={(item) => item.id}
/>

// 3. Ensure parent has flex: 1
// 4. Remove unsupported props
// 5. Test in release mode
```

---

## Resources

- **Docs**: https://shopify.github.io/flash-list/docs/
- **GitHub**: https://github.com/Shopify/flash-list
- **NPM**: https://www.npmjs.com/package/@shopify/flash-list

---

**Version:** 1.7.x | **Source:** https://shopify.github.io/flash-list/docs/
