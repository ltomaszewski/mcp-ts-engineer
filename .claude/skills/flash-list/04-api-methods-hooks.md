# FlashList - Methods & Hooks API

**FlashList methods, custom hooks, imperative APIs**

---

## Scroll Methods

### scrollToIndex

**Description**: Scroll to a specific item by index.

```typescript
const listRef = useRef<FlashList>(null);

// Basic usage
listRef.current?.scrollToIndex({ index: 10 });

// With animation
listRef.current?.scrollToIndex({
  index: 10,
  animated: true,
  viewOffset: 0,
  viewPosition: 0,
});

// View position: 0 = top, 0.5 = center, 1 = bottom
listRef.current?.scrollToIndex({
  index: 50,
  animated: true,
  viewPosition: 0.5,  // Center the item
});
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `index` | `number` | Required | Target item index |
| `animated` | `boolean` | `false` | Smooth animation |
| `viewOffset` | `number` | `0` | Offset from edge (px) |
| `viewPosition` | `number` | `0` | Position: 0=top, 0.5=center, 1=bottom |

---

### scrollToEnd

**Description**: Scroll to the end of the list.

```typescript
const listRef = useRef<FlashList>(null);

// Jump to end
listRef.current?.scrollToEnd();

// Animate to end
listRef.current?.scrollToEnd({ animated: true });
```

**Parameters:**

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `animated` | `boolean` | `false` | Smooth animation |

**Use Case**: Chat apps, notifications feed (scroll to latest message)

---

## Custom Hooks

### useRecyclingState

**Description**: State hook that resets when cell is recycled to different item.

```typescript
import { useRecyclingState } from '@shopify/flash-list';

const ItemComponent = ({ item }) => {
  const [isExpanded, setIsExpanded] = useRecyclingState(
    false,        // initial state
    [item.id],    // dependencies
    () => {
      // Optional reset callback
      console.log('Cell recycled, state reset');
      // Can reset scroll positions of nested lists here
    }
  );

  return (
    <View>
      <Pressable onPress={() => setIsExpanded(!isExpanded)}>
        <Text>{item.title}</Text>
      </Pressable>
      {isExpanded && <Description text={item.description} />}
    </View>
  );
};
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| `initialState` | `T` | Initial state value |
| `dependencies` | `any[]` | Array like useEffect - resets on change |
| `resetCallback` | `() => void` | Called when state resets (optional) |

---

### useLayoutState

**Description**: State hook that communicates layout changes to FlashList for smooth animations.

```typescript
import { useLayoutState } from '@shopify/flash-list';

const ExpandableItem = ({ item }) => {
  // useLayoutState instead of useState
  const [isExpanded, setIsExpanded] = useLayoutState(false);

  const height = isExpanded ? 300 : 100;

  return (
    <Pressable onPress={() => setIsExpanded(!isExpanded)}>
      <Animated.View style={{ height }}>
        <Text>{item.title}</Text>
        {isExpanded && <Text>{item.content}</Text>}
      </Animated.View>
    </Pressable>
  );
};
```

**When to Use:**
- Item height changes dynamically
- Need smooth expand/collapse animations
- State change affects layout

---

## Next Steps

👉 Read **05-performance-guide.md** for optimization strategies
👉 Read **06-layouts-advanced.md** for complex layout patterns
