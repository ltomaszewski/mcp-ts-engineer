# React Native 0.83 - Core Components API Reference

**Essential components with complete method signatures and performance patterns**

---

## 🎯 Component Overview

React Native provides components that map to native platform views:

| Component | Maps To | Purpose |
|-----------|---------|---------|
| `View` | UIView (iOS), ViewGroup (Android) | Container, layout |
| `Text` | UILabel (iOS), TextView (Android) | Display text |
| `ScrollView` | UIScrollView (iOS), ScrollView (Android) | Scrollable bounded content |
| `FlatList` | Virtualized list | High-performance list (large data) |
| `SectionList` | Grouped list | Sectioned list with headers |
| `Pressable` | Touch handler | Touch interactions |
| `TextInput` | UITextView (iOS), EditText (Android) | User text input |
| `Image` | UIImageView (iOS), ImageView (Android) | Display images |

---

## 📦 View Component

Container element for layout and nesting.

### Basic Usage

```typescript
import { View, StyleSheet } from 'react-native';

const MyContainer = () => (
  <View style={styles.container}>
    {/* Child components */}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
    padding: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
```

### Common Props

| Prop | Type | Purpose | Example |
|------|------|---------|---------|
| `style` | `StyleProp<ViewStyle>` | Component styles | `{ flex: 1, padding: 16 }` |
| `children` | `React.ReactNode` | Child components | `<Text>Content</Text>` |
| `onPress` | `() => void` | Touch handler | `() => console.log('pressed')` |
| `accessible` | `boolean` | Accessibility | `true` |
| `testID` | `string` | Testing identifier | `'my-view'` |
| `pointerEvents` | `'none' \| 'auto' \| 'box-none' \| 'box-only'` | Touch pass-through | `'box-only'` |
| `onLayout` | `(event: LayoutChangeEvent) => void` | On layout | `(e) => setWidth(e.nativeEvent.layout.width)` |

### Real-World Example

```typescript
interface ContainerProps {
  children?: React.ReactNode;
  padding?: number;
  gap?: number;
}

const Container = ({ children, padding = 16, gap = 12 }: ContainerProps) => (
  <View style={[styles.container, { padding, gap }]}>
    {children}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});
```

---

## 📝 Text Component

Display text (must wrap strings in `<Text>`).

### Basic Usage

```typescript
import { Text, StyleSheet } from 'react-native';

const MyText = () => (
  <Text style={styles.heading}>Hello World</Text>
);

const styles = StyleSheet.create({
  heading: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
});
```

### Common Props

| Prop | Type | Purpose | Example |
|------|------|---------|---------|
| `style` | `StyleProp<TextStyle>` | Text styles | `{ fontSize: 16, color: '#000' }` |
| `children` | `string \| React.ReactNode` | Text content | `'Hello'` |
| `numberOfLines` | `number` | Limit lines (0 = unlimited) | `3` |
| `ellipsizeMode` | `'tail' \| 'head' \| 'middle' \| 'clip'` | Truncation style | `'tail'` |
| `selectable` | `boolean` | Allow text selection | `true` |
| `onPress` | `() => void` | Touch handler | `() => {}` |
| `allowFontScaling` | `boolean` | Allow system font scaling | `true` |

### Text-Specific Styles

```typescript
const styles = StyleSheet.create({
  text: {
    // Font
    fontSize: 16,
    fontWeight: '400' | '700' | 'bold' | 'normal',
    fontStyle: 'normal' | 'italic',
    fontFamily: 'Courier New',

    // Color
    color: '#000000',

    // Spacing
    lineHeight: 24,
    letterSpacing: 2,

    // Layout
    textAlign: 'left' | 'center' | 'right' | 'justify',
    textDecorationLine: 'none' | 'underline' | 'line-through',
    textDecorationColor: '#000000',
    textDecorationStyle: 'solid' | 'double' | 'dotted' | 'dashed',
  },
});
```

### Real-World Example

```typescript
interface TextProps {
  variant?: 'heading' | 'body' | 'caption';
  children: string;
}

const ThemedText = ({ variant = 'body', children }: TextProps) => {
  const styles = StyleSheet.create({
    heading: {
      fontSize: 24,
      fontWeight: 'bold',
      color: '#000000',
    },
    body: {
      fontSize: 16,
      fontWeight: '400',
      color: '#333333',
    },
    caption: {
      fontSize: 12,
      fontWeight: '400',
      color: '#666666',
    },
  });

  return <Text style={styles[variant]}>{children}</Text>;
};
```

---

## 📜 ScrollView Component

Scrollable container for bounded content.

### Basic Usage

```typescript
import { ScrollView, View, Text } from 'react-native';

const MyScroll = () => (
  <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={true}>
    {[1, 2, 3, 4, 5].map(i => (
      <View key={i} style={{ padding: 20, borderBottomWidth: 1 }}>
        <Text>Item {i}</Text>
      </View>
    ))}
  </ScrollView>
);
```

### Common Props

| Prop | Type | Purpose | Example |
|------|------|---------|---------|
| `horizontal` | `boolean` | Scroll horizontally | `true` |
| `showsVerticalScrollIndicator` | `boolean` | Show scroll bar | `true` |
| `showsHorizontalScrollIndicator` | `boolean` | Show horizontal scroll bar | `true` |
| `scrollEventThrottle` | `number` | Throttle scroll events (ms) | `16` |
| `onScroll` | `(event: NativeSyntheticEvent) => void` | Scroll event | `(e) => {}` |
| `onScrollEndDrag` | `(event: NativeSyntheticEvent) => void` | End scroll | `(e) => {}` |
| `pagingEnabled` | `boolean` | Snap to page | `true` |
| `scrollEnabled` | `boolean` | Enable scrolling | `true` |

### ⚠️ Important Note

ScrollView renders **all children immediately** (even off-screen). For large lists, use **FlatList** instead.

**When to use ScrollView:**
- Small lists (< 50 items)
- Mixed content (text, images, different layouts)
- Need simple scrolling without performance constraints

**When to use FlatList:**
- Large lists (100+ items)
- Same item layout
- Performance critical

---

## 📋 FlatList Component

High-performance virtualized list. Renders only visible items.

### Basic Usage

```typescript
import { FlatList, View, Text } from 'react-native';

interface Item {
  id: string;
  title: string;
}

const MyList = ({ data }: { data: Item[] }) => (
  <FlatList
    data={data}
    renderItem={({ item }) => (
      <View style={{ padding: 12, borderBottomWidth: 1 }}>
        <Text>{item.title}</Text>
      </View>
    )}
    keyExtractor={(item) => item.id}
    initialNumToRender={10}
    maxToRenderPerBatch={10}
    windowSize={5}
    removeClippedSubviews={true}
  />
);
```

### Core Props

| Prop | Type | Required | Purpose |
|------|------|----------|---------|
| `data` | `T[]` | Yes | List items |
| `renderItem` | `(info: {item: T}) => React.ReactElement` | Yes | Item renderer |
| `keyExtractor` | `(item: T, index: number) => string` | Yes | Unique key per item |

### Performance Props (CRITICAL)

| Prop | Type | Default | Purpose |
|------|------|---------|---------|
| `initialNumToRender` | `number` | 10 | Items to render first |
| `maxToRenderPerBatch` | `number` | 10 | Max items per batch |
| `updateCellsBatchingPeriod` | `number` | 50 | Batch interval (ms) |
| `windowSize` | `number` | 21 | Items ahead/behind |
| `removeClippedSubviews` | `boolean` | false | Remove off-screen (Android) |
| `scrollEventThrottle` | `number` | 50 | Throttle scroll (16 = 60fps) |

### Pagination Props

| Prop | Type | Purpose | Example |
|------|------|---------|---------|
| `onEndReached` | `(info: {distanceFromEnd: number}) => void` | Load more | `() => loadMore()` |
| `onEndReachedThreshold` | `number` | Distance threshold | `0.5` (50% from end) |

### Real-World Example

```typescript
import { FlatList, View, Text, ActivityIndicator } from 'react-native';
import { memo, useCallback } from 'react';

interface Item {
  id: string;
  title: string;
  description: string;
}

// Memoize item renderer
const ListItem = memo(({ item }: { item: Item }) => (
  <View style={{ padding: 12, borderBottomWidth: 1 }}>
    <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.title}</Text>
    <Text style={{ fontSize: 14, color: '#666' }}>{item.description}</Text>
  </View>
));

interface MyListProps {
  data: Item[];
  onLoadMore: () => void;
  loading: boolean;
}

const MyList = ({ data, onLoadMore, loading }: MyListProps) => {
  const handleLoadMore = useCallback(() => {
    if (!loading) {
      onLoadMore();
    }
  }, [loading, onLoadMore]);

  const renderFooter = () => {
    if (!loading) return null;
    return <ActivityIndicator size="large" />;
  };

  return (
    <FlatList
      data={data}
      renderItem={({ item }) => <ListItem item={item} />}
      keyExtractor={(item) => item.id}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      scrollEventThrottle={16}
      onEndReached={handleLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
    />
  );
};

export default MyList;
```

### Best Practices

✅ **DO:**
- Always provide `keyExtractor` (not array index)
- Memoize `renderItem` with `memo` and `useCallback`
- Use performance props above
- Set appropriate `windowSize` for your content

❌ **DON'T:**
- Use inline functions in `renderItem`
- Create new objects/arrays in parent every render
- Skip `keyExtractor`
- Forget `removeClippedSubviews` on Android

---

## 📑 SectionList Component

List with grouped sections.

### Basic Usage

```typescript
import { SectionList, View, Text } from 'react-native';

interface Section {
  title: string;
  data: { id: string; name: string }[];
}

const MySectionList = () => (
  <SectionList
    sections={[
      {
        title: 'Fruits',
        data: [
          { id: '1', name: 'Apple' },
          { id: '2', name: 'Banana' },
        ],
      },
      {
        title: 'Vegetables',
        data: [
          { id: '3', name: 'Carrot' },
        ],
      },
    ]}
    keyExtractor={(item, index) => item.id + index}
    renderItem={({ item }) => <Text>{item.name}</Text>}
    renderSectionHeader={({ section: { title } }) => (
      <Text style={{ fontSize: 18, fontWeight: 'bold' }}>
        {title}
      </Text>
    )}
  />
);
```

### Core Props

| Prop | Type | Required | Purpose |
|------|------|----------|---------|
| `sections` | `T[]` | Yes | Section data |
| `renderItem` | `(info: {item, index, section}) => Element` | Yes | Item renderer |
| `renderSectionHeader` | `(info: {section}) => Element` | No | Section header |
| `renderSectionFooter` | `(info: {section}) => Element` | No | Section footer |
| `keyExtractor` | `(item, index) => string` | Yes | Unique key |

---

## 👆 Pressable Component

Modern touch handling (recommended over TouchableOpacity).

### Basic Usage

```typescript
import { Pressable, Text } from 'react-native';

const MyButton = () => (
  <Pressable
    onPress={() => console.log('Pressed!')}
    style={({ pressed }) => ({
      backgroundColor: pressed ? '#0051D5' : '#007AFF',
      paddingHorizontal: 20,
      paddingVertical: 12,
      borderRadius: 8,
    })}
  >
    <Text style={{ color: 'white', fontWeight: '600' }}>
      Tap me
    </Text>
  </Pressable>
);
```

### Common Props

| Prop | Type | Purpose | Example |
|------|------|---------|---------|
| `onPress` | `() => void` | Single tap | `() => {}` |
| `onLongPress` | `() => void` | Long press | `() => {}` |
| `onPressIn` | `() => void` | Finger down | `() => setPressed(true)` |
| `onPressOut` | `() => void` | Finger up | `() => setPressed(false)` |
| `style` | `StyleProp \| (state) => StyleProp` | Styles | `({ pressed }) => ({})` |
| `android_ripple` | `{color: string, radius?: number}` | Android ripple | `{ color: '#00000020' }` |
| `disabled` | `boolean` | Disable touches | `true` |

### Pressable State in Style

The style function receives press state:

```typescript
<Pressable
  style={({ pressed, hovered }) => ({
    backgroundColor: pressed ? '#0051D5' : hovered ? '#0066FF' : '#007AFF',
    opacity: pressed ? 0.8 : 1,
  })}
>
  <Text>State-based Styling</Text>
</Pressable>
```

### ⚠️ CRITICAL: accessible Prop and E2E Testing

Pressable (and other touchables) have `accessible={true}` by default. This **aggregates all child accessibility info** into a single element, hiding individual `testID`s from E2E testing tools like Maestro.

**Problem:**
```typescript
// ❌ BROKEN - Maestro can't find email_input or password_input
<Pressable onPress={Keyboard.dismiss}>
  <TextInput testID="email_input" />
  <TextInput testID="password_input" />
</Pressable>
// Maestro sees: accessibilityText="email_input, password_input" (merged)
```

**Solution:**
```typescript
// ✅ FIXED - Add accessible={false} to container
<Pressable onPress={Keyboard.dismiss} accessible={false}>
  <TextInput testID="email_input" accessible={true} />
  <TextInput testID="password_input" accessible={true} />
</Pressable>
// Maestro sees: separate elements with their own testIDs
```

**Rule:** When wrapping form elements with `testID`, add `accessible={false}` to the container.

---

### Real-World Button Component

```typescript
import { Pressable, Text, StyleSheet } from 'react-native';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
}

const Button = ({ title, onPress, variant = 'primary', disabled }: ButtonProps) => {
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        isPrimary ? styles.primary : styles.secondary,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <Text style={[styles.text, isPrimary && styles.primaryText]}>
        {title}
      </Text>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  button: {
    borderRadius: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  secondary: {
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  pressed: {
    opacity: 0.8,
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  primaryText: {
    color: '#ffffff',
  },
});

export default Button;
```

---

## ⌨️ TextInput Component

User text input field.

### Basic Usage

```typescript
import { TextInput, View, StyleSheet } from 'react-native';
import { useState } from 'react';

const MyInput = () => {
  const [email, setEmail] = useState('');

  return (
    <TextInput
      style={styles.input}
      placeholder="Enter email"
      placeholderTextColor="#999"
      keyboardType="email-address"
      value={email}
      onChangeText={setEmail}
      returnKeyType="next"
      maxLength={100}
    />
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
  },
});
```

### Common Props

| Prop | Type | Purpose | Example |
|------|------|---------|---------|
| `value` | `string` | Input value | `email` |
| `onChangeText` | `(text: string) => void` | Change handler | `setEmail` |
| `placeholder` | `string` | Placeholder text | `'Enter email'` |
| `placeholderTextColor` | `string` | Placeholder color | `'#999'` |
| `keyboardType` | `KeyboardTypeOptions` | Keyboard type | `'email-address'` |
| `secureTextEntry` | `boolean` | Hide text (password) | `true` |
| `multiline` | `boolean` | Multiple lines | `true` |
| `numberOfLines` | `number` | Line count | `4` |
| `maxLength` | `number` | Character limit | `100` |
| `returnKeyType` | `'done' \| 'go' \| 'next' \| 'search' \| 'send'` | Return key | `'done'` |
| `editable` | `boolean` | Enable editing | `true` |

### Keyboard Types

```typescript
keyboardType:
  | 'default'           // Standard
  | 'email-address'     // Email
  | 'numeric'           // Numbers only
  | 'phone-pad'         // Phone number
  | 'decimal-pad'       // Decimal numbers
  | 'url'               // URL input
```

### Real-World Form Example

```typescript
import { TextInput, View, Pressable, Text, StyleSheet } from 'react-native';
import { useState } from 'react';

const LoginForm = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    try {
      // API call
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <TextInput
        style={styles.input}
        placeholder="Email"
        keyboardType="email-address"
        value={email}
        onChangeText={setEmail}
        editable={!loading}
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        secureTextEntry={true}
        value={password}
        onChangeText={setPassword}
        editable={!loading}
      />
      <Pressable
        style={styles.button}
        onPress={handleLogin}
        disabled={loading || !email || !password}
      >
        <Text style={styles.buttonText}>
          {loading ? 'Logging in...' : 'Log In'}
        </Text>
      </Pressable>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 12,
    fontSize: 16,
  },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
  },
  buttonText: {
    color: '#ffffff',
    textAlign: 'center',
    fontWeight: '600',
  },
});
```

---

## 🖼️ Image Component

Display images (local or remote).

### Basic Usage

```typescript
import { Image, StyleSheet } from 'react-native';

const MyImage = () => (
  <Image
    source={{ uri: 'https://example.com/logo.png' }}
    style={styles.image}
    resizeMode="contain"
  />
);

const styles = StyleSheet.create({
  image: {
    width: 200,
    height: 200,
    borderRadius: 8,
  },
});
```

### Common Props

| Prop | Type | Required | Purpose | Example |
|------|------|----------|---------|---------|
| `source` | `{uri: string} \| number` | Yes | Image source | `{ uri: 'https://...' }` |
| `style` | `StyleProp<ImageStyle>` | No | Styles (width/height required) | `{ width: 200, height: 200 }` |
| `resizeMode` | `'cover' \| 'contain' \| 'stretch' \| 'center'` | No | Fit mode | `'cover'` |
| `onLoad` | `() => void` | No | Load complete | `() => {}` |
| `onError` | `(error: NativeSyntheticEvent) => void` | No | Load error | `(e) => {}` |
| `defaultSource` | `{uri: string, width: number, height: number}` | No | Placeholder | N/A |

### Important Notes

✅ **MUST specify width and height explicitly**

```typescript
// ✅ CORRECT
<Image
  source={{ uri: 'https://...' }}
  style={{ width: 200, height: 200 }}
/>

// ❌ WRONG - No width/height
<Image source={{ uri: 'https://...' }} />
```

### Image Sources

**Remote URL:**
```typescript
source={{ uri: 'https://example.com/image.png' }}
```

**Local File:**
```typescript
source={require('./assets/image.png')}
```

**Data URI:**
```typescript
source={{ uri: 'data:image/png;base64,iVBORw0KGgo...' }}
```

### Resize Modes

```typescript
// cover - Fill space, may crop
resizeMode="cover"

// contain - Fit entirely, may have empty space
resizeMode="contain"

// stretch - Fill space, may distort
resizeMode="stretch"

// center - Center without scaling
resizeMode="center"
```

### Real-World Image Gallery Example

```typescript
import { FlatList, Image, View, StyleSheet } from 'react-native';
import { memo } from 'react';

interface Photo {
  id: string;
  uri: string;
  title: string;
}

const PhotoItem = memo(({ item }: { item: Photo }) => (
  <View style={styles.itemContainer}>
    <Image
      source={{ uri: item.uri }}
      style={styles.image}
      resizeMode="cover"
    />
  </View>
));

const PhotoGallery = ({ photos }: { photos: Photo[] }) => (
  <FlatList
    data={photos}
    renderItem={({ item }) => <PhotoItem item={item} />}
    keyExtractor={(item) => item.id}
    numColumns={2}
    columnWrapperStyle={styles.row}
  />
);

const styles = StyleSheet.create({
  row: {
    flex: 1,
    justifyContent: 'space-around',
    gap: 8,
  },
  itemContainer: {
    flex: 1,
    aspectRatio: 1,
  },
  image: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
});
```

---

## ✅ Component Usage Checklist

Before moving to **[04-native-modules.md](04-native-modules.md)**:

- [ ] Understand View for layout containers
- [ ] Can style components with StyleSheet
- [ ] Know when to use ScrollView vs FlatList
- [ ] Have used FlatList with performance props
- [ ] Can create form inputs with TextInput
- [ ] Understand Pressable for touch handling
- [ ] Know how to display images correctly

---

**Source**: https://reactnative.dev/docs/components-and-apis
**Version**: React Native 0.83
**Last Updated**: December 2025
