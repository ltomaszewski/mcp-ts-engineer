# FlashList Quick Reference Card

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
  estimatedItemSize={100}  // Average item height
  keyExtractor={(item) => item.id}
/>
```

---

## Critical Props

| Prop | Type | Purpose |
|------|------|---------|
| `data` | `T[]` | Items to render |
| `renderItem` | `function` | Render each item |
| `estimatedItemSize` | `number` | Average item height (px) |
| `keyExtractor` | `function` | Unique key per item |
| `getItemType` | `function` | Type for different item styles |
| `numColumns` | `number` | Grid columns (0-based) |
| `masonry` | `boolean` | Pinterest-style layout |
| `horizontal` | `boolean` | Horizontal scrolling |
| `onEndReached` | `function` | Called at bottom |
| `onLoad` | `function` | Called when loaded |

---

## State Management

```typescript
import { useRecyclingState } from '@shopify/flash-list';

// ✅ CORRECT: For item-specific state
const [isExpanded, setIsExpanded] = useRecyclingState(
  false,
  [item.id],  // Dependency - resets on change
  () => {
    // Optional reset callback
  }
);

// ❌ WRONG: Regular useState persists across recycled cells
const [isExpanded, setIsExpanded] = useState(false);
```

---

## Scroll Control

```typescript
const listRef = useRef<FlashList>(null);

// Scroll to item
listRef.current?.scrollToIndex({
  index: 10,
  animated: true,
  viewPosition: 0.5,  // 0=top, 0.5=center, 1=bottom
});

// Scroll to end
listRef.current?.scrollToEnd({ animated: true });

// Get visible items
const visibleIndices = listRef.current?.getVisibleIndices() || [];
```

---

## Performance Optimization

```typescript
// 1. Accurate estimate size
<FlashList estimatedItemSize={100} />

// 2. Use getItemType for mixed content
<FlashList
  getItemType={(item) => item.type}  // Separate pools
/>

// 3. Memoize expensive components
const MemoizedItem = memo(({ item }) => (
  <View>{item.title}</View>
), (prev, next) => prev.item.id === next.item.id);

// 4. Monitor blank areas
<FlashList
  onBlankArea={({ blankArea }) => {
    if (blankArea > 0) console.warn('Blank area detected');
  }}
/>

// 5. Test in release mode
npx react-native run-android --variant release
```

---

## Grid Layout

```typescript
// 2-column grid
<FlashList
  data={data}
  numColumns={2}
  renderItem={({ item }) => (
    <View style={{ flex: 1 }}>
      {/* Item content */}
    </View>
  )}
  estimatedItemSize={200}
/>

// Masonry (variable heights)
<FlashList
  numColumns={2}
  masonry={true}
  optimizeItemArrangement={true}
  renderItem={({ item }) => (
    <Image
      style={{ height: item.height, width: '100%' }}
    />
  )}
  estimatedItemSize={250}
/>
```

---

## Pagination

```typescript
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}
  onEndReached={() => fetchMore()}
  onEndReachedThreshold={0.3}  // Trigger 30% before bottom
  ListFooterComponent={isLoading ? <Spinner /> : null}
/>
```

---

## Chat App Pattern

```typescript
const reversedMessages = [...messages].reverse();

<FlashList
  data={reversedMessages}
  renderItem={({ item }) => <ChatBubble msg={item} />}
  estimatedItemSize={80}
  inverted={true}
  maintainVisibleContentPosition={{
    autoscrollToBottomThreshold: 0.1,
    startRenderingFromBottom: true,
  }}
  scrollToEnd({ animated: true })  // Jump to latest
/>
```

---

## Performance Benchmarks

| Metric | Improvement |
|--------|-------------|
| UI Thread FPS | **5x faster** |
| JS Thread FPS | **10x faster** |
| Memory | **4% less** |
| Blank Area | **50% less** |

Device tested: Moto G10 (low-end Android)

---

## Common Pitfalls

| Problem | Solution |
|---------|----------|
| **useState state persists** | Use `useRecyclingState` with dependencies |
| **Blank cells visible** | Increase `estimatedItemSize` |
| **Slow with mixed items** | Add `getItemType` prop |
| **Index keys fail on reorder** | Use stable `keyExtractor` |
| **Dev mode looks slow** | Test in release mode only |
| **No type pool separation** | Use `getItemType` for different item types |

---

## Hooks

```typescript
import {
  useRecyclingState,     // State that resets on recycle
  useLayoutState,        // State for layout changes
  useMappingHelper,      // Helper for safe .map()
  useBlankAreaTracker,   // Track blank areas
  useFlashListContext,   // Access list from children
} from '@shopify/flash-list';
```

---

## Migration from FlatList

```typescript
// Before
import { FlatList } from 'react-native';
<FlatList data={data} renderItem={renderItem} />

// After
import { FlashList } from '@shopify/flash-list';
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}  // ADD THIS
  keyExtractor={(item) => item.id}  // Make stable
/>
```

---

## Unsupported Props

❌ `disableVirtualization`  
❌ `getItemLayout`  
❌ `initialNumToRender`  
❌ `maxToRenderPerBatch`  
❌ `windowSize`  
❌ `updateCellsBatchingPeriod`  

---

## Resources

- **Docs**: https://shopify.github.io/flash-list/docs/
- **Blog**: https://shopify.engineering/flashlist-v2
- **GitHub**: https://github.com/Shopify/flash-list
- **NPM**: https://www.npmjs.com/package/@shopify/flash-list

---

## Pro Tips

✅ Use `estimatedItemSize` = average item height  
✅ Use `getItemType` for mixed content types  
✅ Always use stable `keyExtractor`  
✅ Use `useRecyclingState` for item-level state  
✅ Test performance in release mode  
✅ Monitor `onBlankArea` for issues  
✅ Memoize expensive renderItem components  

---

**Version**: 1.0 | **Updated**: December 27, 2025  
**Official Authority**: Shopify Engineering
