# FlashList - Core Concepts

**Cell recycling, virtualization, rendering lifecycle**

---

## What is Cell Recycling?

**Cell recycling** is an optimization technique where FlashList reuses rendered components (cells) as the user scrolls instead of creating new ones or destroying old ones.

```
Without Recycling (Traditional Approach):
┌──────────────────────────────────────┐
│ Visible Viewport                     │
│ ┌────────────────┐                   │
│ │ Item 1 (React) │                   │
│ │ Item 2 (React) │                   │
│ │ Item 3 (React) │                   │
│ └────────────────┘                   │
│ Scrolling → Item 1 destroyed         │
│            Item 4 created            │
│            Item 5 created            │
└──────────────────────────────────────┘

With Cell Recycling (FlashList Approach):
┌──────────────────────────────────────┐
│ Recycle Pool: [Cell A, Cell B, Cell C]│
│ Visible Viewport                     │
│ ┌────────────────┐                   │
│ │ Cell A (Item 1)│                   │
│ │ Cell B (Item 2)│                   │
│ │ Cell C (Item 3)│                   │
│ └────────────────┘                   │
│ Scrolling → Cell A reused            │
│            Cell A assigned Item 4    │
│            Data updated inline       │
└──────────────────────────────────────┘
```

### Benefits

| Benefit | Impact |
|---------|--------|
| **No component mounting/unmounting** | 5-10x faster JS thread |
| **Reduced memory allocation** | Lower RAM usage |
| **Fewer re-renders** | Smoother scrolling |
| **No garbage collection pauses** | 60 FPS on low-end devices |

---

## Understanding Item Recycling

```typescript
// When an item is recycled, FlashList:
// 1. Takes a Cell from the recycle pool
// 2. Updates the Cell with new item data
// 3. Re-renders only the updated parts
// 4. Returns the old Cell to the pool

// Your component receives the SAME instance
// but with DIFFERENT item data
const ItemComponent = ({ item }) => {
  // This component might be rendered 100+ times
  // but only 5-10 actual component instances exist

  return (
    <View>
      <Text>{item.title}</Text>
      {/* ^^ This will update when cell is recycled */}
    </View>
  );
};
```

---

## State Management in Recycled Items

### ⚠️ The Critical Recycling Pitfall

When cells are recycled, **component state does NOT reset by default**:

```typescript
// ❌ WRONG: State persists across recycled cells
const BadItemComponent = ({ item }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <View>
      <Text onPress={() => setIsExpanded(!isExpanded)}>
        {item.title}
      </Text>
      {isExpanded && <Text>{item.description}</Text>}
    </View>
  );

  // Problem: If cell is recycled to Item B,
  // isExpanded stays true!
  // User sees Item B's description expanded unexpectedly
};
```

### ✅ Correct: Use useRecyclingState

```typescript
// ✅ CORRECT: State resets when cell is recycled
import { useRecyclingState } from '@shopify/flash-list';

const GoodItemComponent = ({ item }) => {
  const [isExpanded, setIsExpanded] = useRecyclingState(
    false,  // initial state
    [item.id],  // dependency array - resets on change
    () => {
      // Optional reset callback
      // Useful for resetting scroll positions
    }
  );

  return (
    <View>
      <Text onPress={() => setIsExpanded(!isExpanded)}>
        {item.title}
      </Text>
      {isExpanded && <Text>{item.description}</Text>}
    </View>
  );

  // Now when cell is recycled, state resets to false
};
```

---

## Next Steps

👉 Read **03-api-props.md** for complete props reference
👉 Read **04-api-methods-hooks.md** for methods and hooks
