# FlashList - Migration & Troubleshooting

**FlatList migration guide, common issues, recycling pitfalls**

---

## FlatList Migration Guide

### Step-by-Step Migration (4 Steps)

**Step 1: Install FlashList**

```bash
yarn add @shopify/flash-list
cd ios && pod install && cd ..
```

**Step 2: Replace Import**

```typescript
// Before
import { FlatList } from 'react-native';

// After
import { FlashList } from '@shopify/flash-list';
```

**Step 3: Change Component Name**

```typescript
// Before
<FlatList
  data={data}
  renderItem={renderItem}
/>

// After
<FlashList
  data={data}
  renderItem={renderItem}
/>
```

**Step 4: Add estimatedItemSize**

```typescript
// FlashList will warn: "estimatedItemSize is required"
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}  // ← Add this
/>
```

---

## Common Migration Issues

### Issue 1: "estimatedItemSize is required"

**Error Message:**
```
Warning: estimatedItemSize is required to be a non-zero value.
Please check the height of your items.
```

**Solution:** Add the prop with average item height

---

### Issue 2: useState in renderItem Issues

```typescript
// ❌ WRONG: State doesn't reset with recycling
const BadComponent = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  // State persists when cell is recycled to different item!
};

// ✅ CORRECT: Use useRecyclingState
import { useRecyclingState } from '@shopify/flash-list';

const GoodComponent = ({ item }) => {
  const [isExpanded, setIsExpanded] = useRecyclingState(false, [item.id]);
  // State resets when cell is recycled
};
```

---

### Issue 3: Blank Cells Appearing

**Symptom**: White space visible while scrolling

**Root Cause**: Inaccurate `estimatedItemSize`

**Solution:**

```typescript
// Monitor blank areas
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}
  onBlankArea={({ blankArea }) => {
    if (blankArea > 0) {
      console.warn(`Blank area: ${blankArea}px`);
    }
  }}
/>

// Increase estimatedItemSize
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={120}  // Increase from 100
/>
```

---

## Unsupported FlatList Props

These props **don't work** in FlashList:

```typescript
// ❌ Not supported:
disableVirtualization={false}      // Contradicts design
getItemLayout={() => {}}           // Not needed in v2
initialNumToRender={10}            // Auto-calculated
maxToRenderPerBatch={10}           // Auto-optimized
onScrollToIndexFailed={() => {}}   // Handle via try-catch
updateCellsBatchingPeriod={50}     // Auto-optimized
windowSize={21}                    // Auto-calculated
```

---

## Performance Regressions

| Cause | Solution |
|-------|----------|
| Missing `getItemType` | Add it for mixed content |
| Bad `estimatedItemSize` | Measure actual items |
| Heavy render functions | Memoize components |
| No `keyExtractor` | Add stable keys |
| Dev mode testing | Test release build |
| Large `drawDistance` | Use defaults |
| Disabled recycling | Only for debugging |

---

## Quick Checklists

### ✅ Getting Started Checklist
- [ ] Install `@shopify/flash-list`
- [ ] Install iOS pods
- [ ] Change `FlatList` → `FlashList`
- [ ] Add `estimatedItemSize` prop
- [ ] Test rendering (no visible changes expected)
- [ ] Run in release mode
- [ ] Verify smooth scrolling

### ✅ Performance Optimization
- [ ] Verify `estimatedItemSize` accuracy
- [ ] Add `getItemType` for mixed items
- [ ] Memoize heavy renderItem components
- [ ] Use `keyExtractor` with stable keys
- [ ] Use `useRecyclingState` for item state
- [ ] Test in release mode
- [ ] Check `onBlankArea` logs
- [ ] Monitor performance metrics

### ✅ Complex Layout Implementation
- [ ] Determine layout type (grid, masonry, horizontal, etc.)
- [ ] Find layout example in documentation
- [ ] Implement with correct props
- [ ] Test with various data sizes
- [ ] Optimize estimatedItemSize per layout
- [ ] Validate performance in release mode

---

## Official Resources

- **Main Documentation**: https://shopify.github.io/flash-list/docs/
- **v2 Engineering Blog**: https://shopify.engineering/flashlist-v2
- **GitHub Repository**: https://github.com/Shopify/flash-list
- **NPM Package**: https://www.npmjs.com/package/@shopify/flash-list

---

## Next Steps

👉 Go back to **00-master-index.md** for complete navigation
