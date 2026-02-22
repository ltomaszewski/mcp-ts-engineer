# FlashList v1.7.x - Setup & Installation

**Installation, basic setup, environment configuration**

**Source:** https://shopify.github.io/flash-list/docs/

---

## React Native (Standard CLI)

```bash
# Using npm
npm install @shopify/flash-list

# Using Yarn
yarn add @shopify/flash-list

# iOS: install pods
cd ios && pod install && cd ..
```

**Supported Versions:**
- React Native 0.63 or higher (v1.x)
- All platforms: iOS, Android, Windows, macOS

---

## Expo Setup

### Expo SDK 54+ (Expo Go supported)

```bash
npx expo install @shopify/flash-list
```

FlashList is included in Expo Go from SDK 54 onwards -- no config plugin or development build required for basic usage.

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

export default function MyList() {
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
        estimatedItemSize={50}
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
3. `estimatedItemSize` -- average item height/width in pixels
4. Parent container with defined dimensions (`flex: 1` or explicit height)

---

## Verification Checklist

- [ ] Package installed (`@shopify/flash-list` in `node_modules`)
- [ ] iOS pods installed (if applicable)
- [ ] Parent `View` has `flex: 1` or explicit height
- [ ] `estimatedItemSize` set to approximate average item height
- [ ] No `ScrollView` wrapper around FlashList
- [ ] Test in release mode for real performance

---

**Version:** 1.7.x | **Source:** https://shopify.github.io/flash-list/docs/
