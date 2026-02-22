# React Native 0.81.5 -- Core Components API Reference

All essential components with prop tables, usage patterns, and performance guidance.

---

## View

Container for layout. Maps to `UIView` (iOS) / `android.view.ViewGroup` (Android).

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `style` | `StyleProp<ViewStyle>` | Flexbox layout, transforms, colors |
| `onLayout` | `(event: LayoutChangeEvent) => void` | Fires when layout changes |
| `pointerEvents` | `'auto' \| 'none' \| 'box-none' \| 'box-only'` | Controls touch event handling |
| `accessible` | `boolean` | Groups children for screen readers |
| `accessibilityLabel` | `string` | Screen reader label |
| `testID` | `string` | Test identifier |
| `nativeID` | `string` | Native view reference |
| `collapsable` | `boolean` | Android: remove from native hierarchy if layout-only |

```typescript
import { View, type LayoutChangeEvent } from 'react-native';

function Container({ children }: { children: React.ReactNode }): React.ReactElement {
  const handleLayout = (event: LayoutChangeEvent): void => {
    const { width, height } = event.nativeEvent.layout;
    console.log(`Layout: ${width}x${height}`);
  };

  return (
    <View style={{ flex: 1, padding: 16 }} onLayout={handleLayout}>
      {children}
    </View>
  );
}
```

---

## Text

Displays text. Supports nesting, styling, and touch handling. All raw strings must be wrapped in `<Text>`.

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `numberOfLines` | `number` | Truncate after N lines (0 = unlimited) |
| `ellipsizeMode` | `'head' \| 'middle' \| 'tail' \| 'clip'` | Truncation position |
| `selectable` | `boolean` | Allow text selection |
| `onPress` | `() => void` | Touch handler |
| `onLongPress` | `() => void` | Long press handler |
| `allowFontScaling` | `boolean` | Respect system font size (default: true) |
| `adjustsFontSizeToFit` | `boolean` | iOS: shrink text to fit container |
| `minimumFontScale` | `number` | iOS: min scale factor (0-1) when adjusting |
| `maxFontSizeMultiplier` | `number` | Max font scale (for accessibility limits) |

```typescript
import { Text, StyleSheet } from 'react-native';

function Heading({ children }: { children: string }): React.ReactElement {
  return <Text style={styles.heading} numberOfLines={2} ellipsizeMode="tail">{children}</Text>;
}

const styles = StyleSheet.create({
  heading: { fontSize: 24, fontWeight: '700', color: '#111', lineHeight: 32 },
});
```

### Text Style Properties

| Property | Type | Example Values |
|----------|------|----------------|
| `fontSize` | `number` | `16` |
| `fontWeight` | `string` | `'400'`, `'700'`, `'bold'` |
| `fontFamily` | `string` | `'System'`, `'Courier'` |
| `fontStyle` | `'normal' \| 'italic'` | `'italic'` |
| `color` | `string` | `'#000'`, `'rgb(0,0,0)'` |
| `lineHeight` | `number` | `24` |
| `letterSpacing` | `number` | `0.5` |
| `textAlign` | `'left' \| 'center' \| 'right' \| 'justify'` | `'center'` |
| `textDecorationLine` | `'none' \| 'underline' \| 'line-through'` | `'underline'` |
| `textTransform` | `'none' \| 'uppercase' \| 'lowercase' \| 'capitalize'` | `'uppercase'` |

---

## Image

Displays images from local assets, remote URLs, or base64 data.

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `source` | `ImageSourcePropType` | Image source (URI object or `require()`) |
| `style` | `StyleProp<ImageStyle>` | **Must include width and height for remote images** |
| `resizeMode` | `'cover' \| 'contain' \| 'stretch' \| 'repeat' \| 'center'` | How image fits container |
| `onLoad` | `() => void` | Fires when image loads |
| `onError` | `(error) => void` | Fires on load failure |
| `defaultSource` | `ImageSourcePropType` | Placeholder while loading (iOS) |
| `fadeDuration` | `number` | Android: fade-in duration (ms, default 300) |
| `blurRadius` | `number` | Blur filter radius |
| `accessible` | `boolean` | Accessibility support |
| `accessibilityLabel` | `string` | Alt text for screen readers |

### Image Sources

```typescript
import { Image } from 'react-native';

// Remote URL (MUST set width/height)
<Image source={{ uri: 'https://example.com/photo.jpg' }} style={{ width: 200, height: 200 }} />

// Local asset (dimensions inferred from file)
<Image source={require('./assets/logo.png')} style={{ width: 100, height: 100 }} />

// Base64 data
<Image source={{ uri: 'data:image/png;base64,...' }} style={{ width: 50, height: 50 }} />
```

### Resize Modes

| Mode | Behavior |
|------|----------|
| `cover` | Scale to fill, may crop (default) |
| `contain` | Scale to fit entirely, may letterbox |
| `stretch` | Stretch to fill, may distort |
| `repeat` | Tile image (iOS only) |
| `center` | Center without scaling |

### Static Methods

| Method | Signature | Description |
|--------|-----------|-------------|
| `getSize` | `(uri: string, success: (w, h) => void, failure?) => void` | Get remote image dimensions |
| `getSizeWithHeaders` | `(uri, headers, success, failure?) => void` | Get size with custom headers |
| `prefetch` | `(uri: string) => Promise<boolean>` | Prefetch remote image to cache |
| `resolveAssetSource` | `(source) => { uri, width, height }` | Resolve asset to dimensions |

---

## ScrollView

Scrollable container. Renders all children immediately (not virtualized).

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `horizontal` | `boolean` | Horizontal scroll (default: false) |
| `pagingEnabled` | `boolean` | Snap to page boundaries |
| `scrollEnabled` | `boolean` | Enable/disable scrolling |
| `showsVerticalScrollIndicator` | `boolean` | Show vertical scrollbar |
| `showsHorizontalScrollIndicator` | `boolean` | Show horizontal scrollbar |
| `scrollEventThrottle` | `number` | Throttle onScroll (ms, 16 = 60fps) |
| `onScroll` | `(event: NativeSyntheticEvent<NativeScrollEvent>) => void` | Scroll handler |
| `contentContainerStyle` | `StyleProp<ViewStyle>` | Style for inner content container |
| `keyboardShouldPersistTaps` | `'always' \| 'never' \| 'handled'` | Keyboard dismissal on tap |
| `keyboardDismissMode` | `'none' \| 'on-drag' \| 'interactive'` | When to dismiss keyboard |
| `refreshControl` | `React.ReactElement<RefreshControlProps>` | Pull-to-refresh component |
| `stickyHeaderIndices` | `number[]` | Indices of sticky children |
| `bounces` | `boolean` | iOS: elastic bounce |
| `overScrollMode` | `'auto' \| 'always' \| 'never'` | Android: overscroll glow |

**When to use:** Small, bounded content (< 50 items). For large lists, use `FlatList`.

---

## FlatList

Virtualized list. Renders only visible items plus buffer. Cross-platform, high-performance.

### Core Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `data` | `T[]` | Yes | Array of items |
| `renderItem` | `(info: ListRenderItemInfo<T>) => ReactElement` | Yes | Item renderer |
| `keyExtractor` | `(item: T, index: number) => string` | Yes | Unique key per item |

### Performance Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `initialNumToRender` | `number` | `10` | Items in first render batch |
| `maxToRenderPerBatch` | `number` | `10` | Max items per subsequent batch |
| `updateCellsBatchingPeriod` | `number` | `50` | Delay between batches (ms) |
| `windowSize` | `number` | `21` | Viewports to keep rendered (ahead + behind) |
| `removeClippedSubviews` | `boolean` | `false` | Detach off-screen views (set `true` on Android) |
| `getItemLayout` | `(data, index) => { length, offset, index }` | -- | Skip layout measurement (major perf win) |

### Feature Props

| Prop | Type | Description |
|------|------|-------------|
| `ListHeaderComponent` | `ReactElement \| () => ReactElement` | Header above all items |
| `ListFooterComponent` | `ReactElement \| () => ReactElement` | Footer below all items |
| `ListEmptyComponent` | `ReactElement \| () => ReactElement` | Shown when data is empty |
| `ItemSeparatorComponent` | `ReactElement` | Rendered between items |
| `numColumns` | `number` | Grid layout columns |
| `horizontal` | `boolean` | Horizontal scroll |
| `inverted` | `boolean` | Reverse order (chat UIs) |
| `onEndReached` | `(info: { distanceFromEnd: number }) => void` | Fires near end (pagination) |
| `onEndReachedThreshold` | `number` | Distance from end (0-1 ratio) to trigger |
| `refreshControl` | `ReactElement<RefreshControlProps>` | Pull-to-refresh |
| `scrollEventThrottle` | `number` | Throttle scroll events (16 = 60fps) |

### Complete FlatList Example

```typescript
import { FlatList, View, Text, ActivityIndicator, RefreshControl } from 'react-native';
import { memo, useCallback, useState } from 'react';

interface Item { id: string; title: string; subtitle: string }

const ListItem = memo(function ListItem({ item }: { item: Item }) {
  return (
    <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
      <Text style={{ fontSize: 16, fontWeight: '600' }}>{item.title}</Text>
      <Text style={{ fontSize: 14, color: '#666', marginTop: 4 }}>{item.subtitle}</Text>
    </View>
  );
});

export function ItemList({ data, onLoadMore, onRefresh, loading }: {
  data: Item[];
  onLoadMore: () => void;
  onRefresh: () => void;
  loading: boolean;
}): React.ReactElement {
  const [refreshing, setRefreshing] = useState(false);

  const renderItem = useCallback(
    ({ item }: { item: Item }) => <ListItem item={item} />,
    [],
  );

  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    await onRefresh();
    setRefreshing(false);
  }, [onRefresh]);

  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
      scrollEventThrottle={16}
      onEndReached={onLoadMore}
      onEndReachedThreshold={0.5}
      ListFooterComponent={loading ? <ActivityIndicator style={{ padding: 16 }} /> : null}
      ListEmptyComponent={<Text style={{ padding: 32, textAlign: 'center' }}>No items</Text>}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />}
    />
  );
}
```

---

## SectionList

Virtualized list with grouped sections and headers.

### Core Props

| Prop | Type | Required | Description |
|------|------|----------|-------------|
| `sections` | `SectionListData<T>[]` | Yes | `{ title, data: T[] }[]` |
| `renderItem` | `(info) => ReactElement` | Yes | Item renderer |
| `renderSectionHeader` | `(info: { section }) => ReactElement` | No | Section header |
| `renderSectionFooter` | `(info: { section }) => ReactElement` | No | Section footer |
| `keyExtractor` | `(item, index) => string` | Yes | Unique key |
| `stickySectionHeadersEnabled` | `boolean` | No | Sticky headers (default true on iOS) |

---

## TextInput

User text input. Controlled component pattern with `value` + `onChangeText`.

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `value` | `string` | Current text value |
| `onChangeText` | `(text: string) => void` | Text change handler |
| `placeholder` | `string` | Placeholder text |
| `placeholderTextColor` | `string` | Placeholder color |
| `keyboardType` | `KeyboardTypeOptions` | Keyboard layout |
| `secureTextEntry` | `boolean` | Password masking |
| `multiline` | `boolean` | Multi-line input |
| `numberOfLines` | `number` | Visible lines (Android, with multiline) |
| `maxLength` | `number` | Character limit |
| `returnKeyType` | `'done' \| 'go' \| 'next' \| 'search' \| 'send'` | Return key label |
| `autoCapitalize` | `'none' \| 'sentences' \| 'words' \| 'characters'` | Auto-capitalization |
| `autoCorrect` | `boolean` | Auto-correction |
| `autoComplete` | `string` | Autofill hint (`'email'`, `'password'`, `'name'`) |
| `editable` | `boolean` | Enable/disable editing |
| `onSubmitEditing` | `() => void` | Fires on return key press |
| `onFocus` | `() => void` | Focus handler |
| `onBlur` | `() => void` | Blur handler |
| `textContentType` | `string` | iOS autofill type (`'emailAddress'`, `'password'`) |

### Keyboard Types

| Type | Shows | Platform |
|------|-------|----------|
| `'default'` | Standard keyboard | Both |
| `'email-address'` | Email layout (@ key) | Both |
| `'numeric'` | Number pad | Both |
| `'phone-pad'` | Phone dialer | Both |
| `'decimal-pad'` | Numbers with decimal | Both |
| `'url'` | URL keyboard | Both |
| `'number-pad'` | Numbers only (no decimal) | Both |

---

## Pressable

Modern touch handler. Replaces TouchableOpacity, TouchableHighlight.

### Key Props

| Prop | Type | Description |
|------|------|-------------|
| `onPress` | `() => void` | Tap handler |
| `onLongPress` | `() => void` | Long press handler |
| `onPressIn` | `() => void` | Finger down |
| `onPressOut` | `() => void` | Finger up |
| `style` | `StyleProp \| (state: PressableStateCallbackType) => StyleProp` | Style or style function |
| `android_ripple` | `{ color: string; borderless?: boolean; radius?: number }` | Android ripple effect |
| `disabled` | `boolean` | Disable interaction |
| `hitSlop` | `number \| Insets` | Expand touch area |
| `pressRetentionOffset` | `Insets` | Distance before canceling press |
| `delayLongPress` | `number` | Long press delay (ms, default 500) |

### State Callback

```typescript
<Pressable
  style={({ pressed }) => ({
    backgroundColor: pressed ? '#0055cc' : '#007AFF',
    opacity: pressed ? 0.8 : 1,
    padding: 12,
    borderRadius: 8,
  })}
  android_ripple={{ color: 'rgba(0,0,0,0.2)' }}
  onPress={handlePress}
>
  {({ pressed }) => <Text style={{ color: '#fff' }}>{pressed ? 'Pressing...' : 'Press Me'}</Text>}
</Pressable>
```

---

## Additional Core Components

### Modal

| Prop | Type | Description |
|------|------|-------------|
| `visible` | `boolean` | Show/hide modal |
| `animationType` | `'none' \| 'slide' \| 'fade'` | Transition animation |
| `transparent` | `boolean` | Transparent background |
| `onRequestClose` | `() => void` | Android back button / iOS swipe dismiss |
| `presentationStyle` | `'fullScreen' \| 'pageSheet' \| 'formSheet' \| 'overFullScreen'` | iOS presentation |

### ActivityIndicator

| Prop | Type | Description |
|------|------|-------------|
| `size` | `'small' \| 'large' \| number` | Spinner size |
| `color` | `string` | Spinner color |
| `animating` | `boolean` | Show/hide (default true) |

### Switch

| Prop | Type | Description |
|------|------|-------------|
| `value` | `boolean` | Current state |
| `onValueChange` | `(value: boolean) => void` | Toggle handler |
| `trackColor` | `{ false: string; true: string }` | Track colors |
| `thumbColor` | `string` | Thumb color |
| `ios_backgroundColor` | `string` | iOS background when off |
| `disabled` | `boolean` | Disable interaction |

### KeyboardAvoidingView

| Prop | Type | Description |
|------|------|-------------|
| `behavior` | `'height' \| 'position' \| 'padding'` | Avoidance strategy (`'padding'` on iOS) |
| `keyboardVerticalOffset` | `number` | Additional offset (for headers) |
| `enabled` | `boolean` | Enable/disable behavior |

### StatusBar

| Prop | Type | Description |
|------|------|-------------|
| `barStyle` | `'default' \| 'light-content' \| 'dark-content'` | Text/icon color |
| `hidden` | `boolean` | Hide status bar |
| `backgroundColor` | `string` | Android: background color |
| `translucent` | `boolean` | Android: draw under status bar |
| `animated` | `boolean` | Animate changes |

### RefreshControl

| Prop | Type | Description |
|------|------|-------------|
| `refreshing` | `boolean` | Whether refreshing |
| `onRefresh` | `() => void` | Pull-to-refresh handler |
| `colors` | `string[]` | Android: spinner colors |
| `tintColor` | `string` | iOS: spinner color |
| `title` | `string` | iOS: text below spinner |

---

## StyleSheet API

### Methods

| Method | Description |
|--------|-------------|
| `StyleSheet.create(styles)` | Create optimized style objects |
| `StyleSheet.flatten(style)` | Merge array of styles into single object |
| `StyleSheet.compose(a, b)` | Compose two styles (faster than array) |
| `StyleSheet.hairlineWidth` | Thinnest visible line (platform-dependent) |
| `StyleSheet.absoluteFill` | Shortcut for `position: 'absolute', top/right/bottom/left: 0` |

---

## Utility APIs

### Platform

| API | Description |
|-----|-------------|
| `Platform.OS` | `'ios'` or `'android'` |
| `Platform.Version` | OS version (number on Android, string on iOS) |
| `Platform.select({ ios, android, default })` | Return platform-specific value |
| `Platform.isTV` | `true` if running on TV |
| `Platform.isTesting` | `true` if running in test environment |

### Dimensions

```typescript
import { useWindowDimensions } from 'react-native';

function MyComponent(): React.ReactElement {
  const { width, height, fontScale, scale } = useWindowDimensions();
  // Preferred over Dimensions.get('window') -- updates on rotation
}
```

### Keyboard

| Method | Description |
|--------|-------------|
| `Keyboard.dismiss()` | Dismiss keyboard |
| `Keyboard.addListener('keyboardDidShow', handler)` | Listen for keyboard show |
| `Keyboard.addListener('keyboardDidHide', handler)` | Listen for keyboard hide |

### Alert

```typescript
import { Alert } from 'react-native';

Alert.alert(
  'Confirm Delete',
  'Are you sure?',
  [
    { text: 'Cancel', style: 'cancel' },
    { text: 'Delete', style: 'destructive', onPress: () => handleDelete() },
  ],
);
```

### PixelRatio

| Method | Description |
|--------|-------------|
| `PixelRatio.get()` | Device pixel density |
| `PixelRatio.getFontScale()` | Font scale multiplier |
| `PixelRatio.getPixelSizeForLayoutSize(dp)` | Convert dp to px |
| `PixelRatio.roundToNearestPixel(dp)` | Round to nearest pixel |

### Appearance

| Method | Description |
|--------|-------------|
| `Appearance.getColorScheme()` | Returns `'light'`, `'dark'`, or `null` |
| `useColorScheme()` | Hook that updates on theme change |

---

**Version:** React Native 0.81.5 | React 19.1.0
**Source:** https://reactnative.dev/docs/components-and-apis
