# FlashList v2.x - Setup & Installation

**Installation, New Architecture requirement, basic setup, environment configuration**

**Source:** https://shopify.github.io/flash-list/docs/

---

## Prerequisites

FlashList v2 requires **React Native New Architecture** (Fabric). It does not run on the old architecture (bridge). Ensure your project has New Architecture enabled before installing.

| Requirement | Minimum |
|-------------|---------|
| React Native | New Architecture enabled |
| Expo | SDK 54+ with New Architecture |
| Platforms | iOS, Android |

---

## React Native (Standard CLI)

```bash
# Using npm
npm install @shopify/flash-list@^2.0.0

# Using Yarn
yarn add @shopify/flash-list@^2.0.0

# iOS: install pods
cd ios && pod install && cd ..
```

FlashList v2 is a **JS-only** solution -- no native code. The pod install step is for any transitive native dependencies.

---

## Expo Setup

### Expo SDK 54+ (Recommended)

```bash
npx expo install @shopify/flash-list
```

FlashList v2 works with Expo's New Architecture support. From SDK 54, Expo projects use New Architecture by default.

### Expo Development Build

```bash
npx expo install @shopify/flash-list expo-dev-client
npx expo run:ios   # or npx expo run:android
npx expo start --dev-client
```

---

## Minimum Working Example

```typescript
import React, { useCallback } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface Item {
  id: string;
  title: string;
}

const DATA: Item[] = [
  { id: '1', title: 'First Item' },
  { id: '2', title: 'Second Item' },
  { id: '3', title: 'Third Item' },
];

export default function MyList(): React.ReactElement {
  const renderItem = useCallback(({ item }: { item: Item }) => (
    <View style={styles.item}>
      <Text style={styles.title}>{item.title}</Text>
    </View>
  ), []);

  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={DATA}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  item: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#eee' },
  title: { fontSize: 16 },
});
```

**Required for rendering:**
1. `data` -- array of items
2. `renderItem` -- render function
3. `keyExtractor` -- unique key per item (strongly recommended)
4. Parent container with defined dimensions (`flex: 1` or explicit height)

**No longer required in v2:**
- `estimatedItemSize` -- FlashList v2 handles all sizing automatically

---

## Imports

```typescript
// Core component
import { FlashList } from '@shopify/flash-list';

// Ref type (for useRef)
import { FlashList, FlashListRef } from '@shopify/flash-list';

// Hooks
import {
  useRecyclingState,
  useLayoutState,
  useMappingHelper,
  useFlashListContext,
} from '@shopify/flash-list';

// Helper components
import { FlashList, LayoutCommitObserver } from '@shopify/flash-list';
```

---

## TypeScript Configuration

FlashList is fully typed. Use generic type parameter for type-safe data:

```typescript
import { FlashList, FlashListRef } from '@shopify/flash-list';

interface Product {
  id: string;
  name: string;
  price: number;
}

// Typed ref
const listRef = useRef<FlashListRef<Product>>(null);

// Typed component
<FlashList<Product>
  data={products}
  renderItem={({ item }) => <Text>{item.name}</Text>}
  keyExtractor={(item) => item.id}
/>
```

**Note:** In v2, the ref type changed from `FlashList<T>` to `FlashListRef<T>`.

---

## Verification Checklist

- [ ] Package installed (`@shopify/flash-list@^2.0.0` in `node_modules`)
- [ ] React Native New Architecture enabled
- [ ] iOS pods installed (if applicable)
- [ ] Parent `View` has `flex: 1` or explicit height
- [ ] `estimatedItemSize` removed (not needed in v2)
- [ ] No `ScrollView` wrapper around FlashList
- [ ] Using `FlashListRef<T>` for ref type (not `FlashList<T>`)
- [ ] Test in release mode for real performance

---

## See Also

- [02-core-concepts.md](02-core-concepts.md) -- Cell recycling and state hooks
- [07-migration-troubleshooting.md](07-migration-troubleshooting.md) -- Migrating from v1.x or FlatList

---

**Version:** 2.x (2.2.2) | **Source:** https://shopify.github.io/flash-list/docs/
