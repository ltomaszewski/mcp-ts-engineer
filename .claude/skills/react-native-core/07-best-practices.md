# React Native 0.81.5 -- Best Practices

Performance optimization, security, accessibility, and common pitfalls.

---

## Performance: FlatList Optimization

### Recommended Configuration

```typescript
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  // Performance props
  initialNumToRender={10}
  maxToRenderPerBatch={10}
  updateCellsBatchingPeriod={50}
  windowSize={5}
  removeClippedSubviews={true}  // Important on Android
  scrollEventThrottle={16}       // 60fps
  // Pagination
  onEndReached={loadMore}
  onEndReachedThreshold={0.5}
/>
```

### Performance Props Explained

| Prop | Default | Recommended | Effect |
|------|---------|-------------|--------|
| `initialNumToRender` | 10 | 10 | Items in first render pass |
| `maxToRenderPerBatch` | 10 | 10 | Items per subsequent batch |
| `updateCellsBatchingPeriod` | 50 | 50 | Delay between batches (ms) |
| `windowSize` | 21 | 5 | Viewports to keep rendered |
| `removeClippedSubviews` | false | true (Android) | Detach off-screen native views |
| `getItemLayout` | -- | Provide if possible | Skip async layout measurement |

### getItemLayout (Major Optimization)

If items have fixed height, provide `getItemLayout` to skip measurement:

```typescript
<FlatList
  data={data}
  renderItem={renderItem}
  keyExtractor={(item) => item.id}
  getItemLayout={(data, index) => ({
    length: ITEM_HEIGHT,
    offset: ITEM_HEIGHT * index,
    index,
  })}
/>
```

---

## Performance: Memoization

### Memoize Components

```typescript
import { memo, useCallback, useMemo } from 'react';

// Memoize item component
const ListItem = memo(function ListItem({ item, onPress }: { item: Item; onPress: (id: string) => void }) {
  return (
    <Pressable onPress={() => onPress(item.id)}>
      <Text>{item.title}</Text>
    </Pressable>
  );
});

// Custom comparator for complex props
const ExpensiveItem = memo(
  function ExpensiveItem({ item }: { item: Item }) { return <View />; },
  (prev, next) => prev.item.id === next.item.id && prev.item.updatedAt === next.item.updatedAt,
);
```

### Memoize Callbacks and Values

```typescript
function ParentComponent({ items }: { items: Item[] }): React.ReactElement {
  // Memoize callback (stable reference)
  const handlePress = useCallback((id: string) => {
    console.log('Pressed:', id);
  }, []);

  // Memoize expensive computation
  const sortedItems = useMemo(
    () => [...items].sort((a, b) => a.name.localeCompare(b.name)),
    [items],
  );

  const renderItem = useCallback(
    ({ item }: { item: Item }) => <ListItem item={item} onPress={handlePress} />,
    [handlePress],
  );

  return <FlatList data={sortedItems} renderItem={renderItem} keyExtractor={(i) => i.id} />;
}
```

---

## Performance: Images

```typescript
// ALWAYS set dimensions for remote images
<Image source={{ uri: remoteUrl }} style={{ width: 200, height: 200 }} resizeMode="cover" />

// Use cache control
<Image source={{ uri: remoteUrl, cache: 'force-cache' }} style={{ width: 200, height: 200 }} />

// Prefetch images for smoother UX
Image.prefetch('https://example.com/image.jpg');
```

---

## Performance: Deferred Work

### InteractionManager

Schedule heavy work after animations/interactions complete:

```typescript
import { InteractionManager } from 'react-native';

useEffect(() => {
  const task = InteractionManager.runAfterInteractions(() => {
    // Expensive computation runs after transition animation
    processLargeDataset();
  });

  return () => task.cancel();
}, []);
```

### Animated API: useNativeDriver

Offload animations to native thread:

```typescript
import { Animated } from 'react-native';

const fadeAnim = new Animated.Value(0);
Animated.timing(fadeAnim, {
  toValue: 1,
  duration: 300,
  useNativeDriver: true, // Runs on native thread, not JS
}).start();
```

---

## Security

### Token Storage

```typescript
// WRONG -- unencrypted
import AsyncStorage from '@react-native-async-storage/async-storage';
await AsyncStorage.setItem('token', accessToken); // Never do this

// CORRECT -- encrypted
import * as SecureStore from 'expo-secure-store';
await SecureStore.setItemAsync('token', accessToken);
```

### API Key Management

```typescript
// WRONG -- hardcoded
const API_KEY = 'sk_live_abc123';

// CORRECT -- environment variable
import { API_KEY } from '@env'; // via react-native-dotenv
```

### Input Validation

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('Invalid email'),
  password: z.string().min(8, 'Password too short'),
});

function validateLogin(input: unknown): { email: string; password: string } {
  return loginSchema.parse(input);
}
```

### Network Security

- Always use HTTPS
- Pin SSL certificates for sensitive APIs
- Validate response data before using
- Implement token refresh with retry logic
- Set request timeouts

---

## Accessibility (WCAG 2.1)

### Labels and Roles

```typescript
<Pressable
  accessible={true}
  accessibilityLabel="Add item to cart"
  accessibilityHint="Double tap to add this item to your shopping cart"
  accessibilityRole="button"
  accessibilityState={{ disabled: isDisabled }}
  onPress={handleAddToCart}
>
  <Text>Add to Cart</Text>
</Pressable>
```

### Accessibility Props

| Prop | Type | Description |
|------|------|-------------|
| `accessible` | `boolean` | Mark as accessible element |
| `accessibilityLabel` | `string` | Screen reader label |
| `accessibilityHint` | `string` | Describes result of action |
| `accessibilityRole` | `string` | `'button'`, `'header'`, `'link'`, `'image'`, `'text'` etc. |
| `accessibilityState` | `object` | `{ disabled, selected, checked, busy, expanded }` |
| `accessibilityValue` | `object` | `{ min, max, now, text }` for sliders/progress |
| `importantForAccessibility` | `string` | `'auto'`, `'yes'`, `'no'`, `'no-hide-descendants'` |

### Checklist

- Color contrast ratio >= 4.5:1 for text
- Touch targets >= 44x44 dp
- All interactive elements have `accessibilityLabel`
- Form errors announced to screen readers
- Focus order follows visual layout

---

## Common Pitfalls

### 1: Inline Functions in renderItem

```typescript
// BAD -- new function on every render
<FlatList renderItem={({ item }) => <ListItem item={item} />} />

// GOOD -- stable reference
const renderItem = useCallback(({ item }) => <ListItem item={item} />, []);
<FlatList renderItem={renderItem} />
```

### 2: Memory Leaks from Subscriptions

```typescript
// BAD -- no cleanup
useEffect(() => {
  const sub = eventEmitter.addListener('event', handler);
  // Missing return cleanup!
}, []);

// GOOD -- proper cleanup
useEffect(() => {
  const sub = eventEmitter.addListener('event', handler);
  return () => sub.remove();
}, []);
```

### 3: State Updates After Unmount

```typescript
// BAD -- may warn after unmount
useEffect(() => {
  fetchData().then(setData);
}, []);

// GOOD -- abort on cleanup
useEffect(() => {
  const controller = new AbortController();
  fetchData({ signal: controller.signal })
    .then(setData)
    .catch((e) => { if (!controller.signal.aborted) console.error(e); });
  return () => controller.abort();
}, []);
```

### 4: Array Index as Key

```typescript
// BAD -- causes incorrect reordering/animation
keyExtractor={(item, index) => index.toString()}

// GOOD -- stable unique ID
keyExtractor={(item) => item.id}
```

### 5: Blocking JS Thread

```typescript
// BAD -- freezes UI
function heavySort(data: Item[]): Item[] {
  return data.sort(/* expensive comparator */);
}

// GOOD -- defer after interactions
InteractionManager.runAfterInteractions(() => {
  const sorted = heavySort(data);
  setData(sorted);
});
```

### 6: Deprecated SafeAreaView

```typescript
// BAD -- deprecated in RN 0.81
import { SafeAreaView } from 'react-native';

// GOOD -- community package
import { SafeAreaView } from 'react-native-safe-area-context';
// Or use hooks:
import { useSafeAreaInsets } from 'react-native-safe-area-context';
```

---

## Pre-Production Checklist

**Performance:**
- [ ] FlatList has performance props configured
- [ ] renderItem is memoized with useCallback
- [ ] Item components wrapped with memo
- [ ] Images have explicit dimensions
- [ ] No console.log in production (use `__DEV__` guard)
- [ ] Animations use `useNativeDriver: true`

**Security:**
- [ ] Tokens stored in SecureStore
- [ ] No hardcoded API keys
- [ ] HTTPS for all network requests
- [ ] User input validated
- [ ] Error messages do not leak sensitive info

**Accessibility:**
- [ ] Color contrast >= 4.5:1
- [ ] Touch targets >= 44x44 dp
- [ ] All buttons have accessibilityLabel
- [ ] Screen reader tested (VoiceOver/TalkBack)

---

**Version:** React Native 0.81.5
**Source:** https://reactnative.dev/docs/performance | https://reactnative.dev/docs/accessibility
