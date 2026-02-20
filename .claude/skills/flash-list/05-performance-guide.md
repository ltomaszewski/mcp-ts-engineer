# FlashList - Performance & Optimization

**Performance tuning, getItemType, masonry, best practices**

---

## Performance Benchmarks (Moto G10 - Low-End Device)

| Metric | FlatList | FlashList v2 | Improvement |
|--------|----------|--------------|-------------|
| **UI Thread FPS** | 9.6 FPS | 48 FPS | **5x faster** |
| **JS Thread FPS** | 6 FPS | 60 FPS | **10x faster** |
| **Memory Usage** | 191 MB | 183 MB | **4% reduction** |
| **Frame Time** | 14.0 ms | 9.9 ms | **29% faster** |
| **CPU Usage** | 217% | 148% | **32% lower** |
| **Blank Area** | Baseline | 50% less | **Major improvement** |

**Source:** https://shopify.engineering/flashlist-v2

---

## Core Performance Strategy

### 1. Proper Item Size Estimation (Most Important!)

```typescript
// ❌ WRONG: No estimate - risk of blank cells
<FlashList
  data={data}
  renderItem={renderItem}
/>

// ✅ CORRECT: Provide accurate estimate
<FlashList
  data={data}
  renderItem={renderItem}
  estimatedItemSize={100}  // Set to average item height
/>
```

**How to Determine Correct Size:**

```typescript
// Method 1: Calculate from design
const ITEM_HEIGHT = 16 * 2 + 20 + 16 * 2;  // padding + content
// = 16 (top) + 16 (bottom) + 20 (text) + 16*2 (padding)
// = 84 pixels

// Method 2: Measure live
const ItemComponent = ({ item }) => {
  const [height, setHeight] = useState(0);

  return (
    <View
      onLayout={(e) => setHeight(e.nativeEvent.layout.height)}
      style={{ padding: 16 }}
    >
      <Text>{item.title}</Text>
    </View>
  );
};

// Method 3: Use design tokens
const ITEM_HEIGHT = SPACING.vertical * 2 + TEXT.size + SPACING.content;
```

**Guidelines:**
- Measure a representative item
- Account for padding, margins, borders
- If items vary, use average
- 80% accuracy is sufficient
- Too large → wasted buffer
- Too small → blank cells visible

---

### 2. Use getItemType for Multiple Item Styles

```typescript
// ❌ INEFFICIENT: Single type for all items
interface MixedItem {
  id: string;
  type: 'header' | 'row' | 'footer';
  title: string;
}

<FlashList
  data={mixedItems}
  renderItem={({ item }) => {
    if (item.type === 'header') return <HeaderItem />;
    if (item.type === 'row') return <RowItem />;
    return <FooterItem />;
  }}
  estimatedItemSize={100}
  // Missing getItemType - header cells get recycled to rows
/>

// ✅ EFFICIENT: Type-specific recycling
<FlashList
  data={mixedItems}
  renderItem={({ item }) => {
    if (item.type === 'header') return <HeaderItem />;
    if (item.type === 'row') return <RowItem />;
    return <FooterItem />;
  }}
  estimatedItemSize={100}
  getItemType={(item) => item.type}  // Separate pools per type
/>
```

---

### 3. Optimize renderItem

```typescript
// ❌ SLOW: Heavy calculations in renderItem
const renderItem = ({ item }) => (
  <View>
    <Text>{item.title}</Text>
    <Text>
      {/* Expensive calculation on every render */}
      Price: ${calculateDiscount(item.price, item.discount)}
    </Text>
  </View>
);

// ✅ FAST: Pre-calculate, use memoization
const renderItem = ({ item }) => (
  <MemoizedItem item={item} />
);

const MemoizedItem = memo(({ item }) => (
  <View>
    <Text>{item.title}</Text>
    <Text>Price: ${item.finalPrice}</Text>  // Pre-calculated
  </View>
), (prevProps, nextProps) => {
  // Return true if props are equal (skip render)
  return prevProps.item.id === nextProps.item.id;
});
```

---

## Common Performance Pitfalls

### ❌ Pitfall 1: Unstable Keys

```typescript
// ❌ WRONG: Using index as key with reorderable list
data.forEach((item, index) => {
  // If list reorders, items misalign with keys
});

// ✅ CORRECT: Use stable, unique identifier
<FlashList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}  // Stable ID
/>
```

### ❌ Pitfall 2: Recycling State Issues

```typescript
// ❌ WRONG: useState persists across recycled cells
const BadItem = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  // When cell recycled, isExpanded stays true!
  return (
    <View>
      {isExpanded && <Details />}
    </View>
  );
};

// ✅ CORRECT: Use useRecyclingState
const GoodItem = ({ item }) => {
  const [isExpanded, setIsExpanded] = useRecyclingState(
    false,
    [item.id],  // Reset when item changes
  );

  return (
    <View>
      {isExpanded && <Details />}
    </View>
  );
};
```

### ❌ Pitfall 3: Testing in Dev Mode

```bash
# ❌ WRONG: Performance looks bad
npm start
npx react-native run-android  # Dev mode

# ✅ CORRECT: Test release build
npx react-native run-android --variant release

# Why: Dev mode includes debugging overhead
# FlashList uses smaller render buffer in dev
```

---

## Next Steps

👉 Read **06-layouts-advanced.md** for layout patterns
👉 Read **07-migration-troubleshooting.md** for troubleshooting
