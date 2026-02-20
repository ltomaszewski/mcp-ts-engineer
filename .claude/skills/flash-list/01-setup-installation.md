# FlashList - Setup & Installation

**Installation, basic setup, environment configuration**

---

## React Native (Standard CLI)

**Description**: Install FlashList for standard React Native projects using Yarn or npm.

### Installation Steps

```bash
# Using Yarn (recommended)
yarn add @shopify/flash-list

# Using npm
npm install @shopify/flash-list

# For iOS, install pods
cd ios && pod install && cd ..
```

**Supported Versions:**
- React Native 0.71.0 or higher
- All platforms (iOS, Android, Windows, macOS)

**Source:** https://shopify.github.io/flash-list/docs/

---

## Expo Setup

**Description**: Install FlashList in Expo projects with support for Expo Go and Development Builds.

### Option 1: Expo Go (SDK 46+)

```bash
# Install the package
npx expo install @shopify/flash-list

# FlashList is built-in support for Expo Go from SDK 46 onwards
# No additional configuration needed
```

### Option 2: Expo Development Build (Recommended for complex projects)

```bash
# Install the package
npx expo install @shopify/flash-list expo-dev-client

# Create a new development build
npx expo run:ios
# or
npx expo run:android

# Start development server
npx expo start --dev-client
```

**Key Points:**
- ✅ No config plugin required
- ✅ Works with Development Builds from SDK 46+
- ✅ Fully compatible with Expo Go from SDK 46+

---

## Minimum Configuration (Required)

```typescript
import React from 'react';
import { View, Text } from 'react-native';
import { FlashList } from '@shopify/flash-list';

interface ItemType {
  id: string;
  title: string;
}

const DATA: ItemType[] = [
  { id: '1', title: 'First Item' },
  { id: '2', title: 'Second Item' },
  { id: '3', title: 'Third Item' },
];

const MyList = () => {
  return (
    <View style={{ flex: 1 }}>
      <FlashList
        data={DATA}
        renderItem={({ item }) => (
          <Text style={{ padding: 16 }}>{item.title}</Text>
        )}
        estimatedItemSize={50}
      />
    </View>
  );
};

export default MyList;
```

**What's Required:**
- `data` prop: Array of items
- `renderItem` prop: Function that renders each item
- Parent container with defined dimensions (height/width)

---

## Next Steps

👉 Read **02-core-concepts.md** to understand how FlashList works
👉 Jump to **03-api-props.md** for specific prop reference
