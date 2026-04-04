---
name: react-native-core
description: "React Native 0.83.4 fundamentals - core components, native modules, navigation, Fabric, TurboModules, best practices."
when_to_use: "Use when working with RN basics, platform-specific code, or performance optimization."
---

# React Native Core

> Cross-platform mobile development with native performance using React Native 0.83.4, Fabric renderer, TurboModules, and Hermes engine.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Building or modifying UI with core RN components (View, Text, FlatList, Pressable, TextInput, Image)
- Implementing platform-specific code (iOS/Android differences, `.ios.ts`/`.android.ts` files)
- Optimizing list rendering, component performance, or app startup time
- Creating Turbo Native Modules or working with Fabric components
- Debugging React Native apps using DevTools or profiling tools

---

## Critical Rules

**ALWAYS:**
1. Use `FlatList` for lists > 50 items -- `ScrollView` renders all children immediately, causing memory issues
2. Provide `keyExtractor` returning stable unique IDs -- never use array index as key
3. Memoize `renderItem` callbacks with `useCallback` and item components with `React.memo` -- prevents re-renders on every frame
4. Specify `width` and `height` for `Image` components -- required for remote images to render
5. Use `Pressable` over `TouchableOpacity` -- modern API with `pressed`/`hovered` state callbacks
6. New Architecture (Fabric + TurboModules) is mandatory since SDK 55/RN 0.83 -- legacy architecture is removed

**NEVER:**
1. Create inline functions in `renderItem` -- causes item re-creation every render cycle
2. Skip `removeClippedSubviews={true}` on Android FlatLists -- leads to memory leaks with large lists
3. Block the JS thread with synchronous heavy computation -- use `InteractionManager.runAfterInteractions` or offload to native
4. Use deprecated `SafeAreaView` from react-native -- use `react-native-safe-area-context` instead (removed in 0.83)

---

## Core Patterns

### Optimized FlatList

```typescript
import { FlatList, View, Text } from 'react-native';
import { memo, useCallback } from 'react';

interface Item { id: string; title: string }

const ListItem = memo(({ item }: { item: Item }) => (
  <View style={{ padding: 16, borderBottomWidth: 1, borderColor: '#eee' }}>
    <Text style={{ fontSize: 16 }}>{item.title}</Text>
  </View>
));

export function ItemList({ data }: { data: Item[] }): React.ReactElement {
  const renderItem = useCallback(
    ({ item }: { item: Item }) => <ListItem item={item} />,
    [],
  );
  return (
    <FlatList
      data={data}
      renderItem={renderItem}
      keyExtractor={(item) => item.id}
      initialNumToRender={10}
      maxToRenderPerBatch={10}
      windowSize={5}
      removeClippedSubviews={true}
    />
  );
}
```

### Platform-Specific Code

```typescript
import { Platform, StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  shadow: Platform.select({
    ios: { shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 },
    android: { elevation: 4 },
    default: {},
  }),
});

// File-based: MyComponent.ios.tsx / MyComponent.android.tsx
```

### Turbo Native Module Spec

```typescript
import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface Spec extends TurboModule {
  getDeviceName(): Promise<string>;
  multiply(a: number, b: number): number;
}

export default TurboModuleRegistry.getEnforcing<Spec>('MyModule');
```

### Pressable with State Feedback

```typescript
import { Pressable, Text } from 'react-native';

export function Button({ title, onPress }: { title: string; onPress: () => void }): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: pressed ? '#005bb5' : '#007AFF',
        paddingVertical: 12,
        paddingHorizontal: 20,
        borderRadius: 8,
      })}
    >
      <Text style={{ color: '#fff', fontWeight: '600', textAlign: 'center' }}>{title}</Text>
    </Pressable>
  );
}
```

---

## Anti-Patterns

**BAD** -- Inline renderItem function (re-created every render):
```typescript
<FlatList
  data={data}
  renderItem={({ item }) => <ListItem item={item} />}
/>
```

**GOOD** -- Memoized renderItem:
```typescript
const renderItem = useCallback(({ item }) => <ListItem item={item} />, []);
<FlatList data={data} renderItem={renderItem} />
```

**BAD** -- Deprecated SafeAreaView from react-native:
```typescript
import { SafeAreaView } from 'react-native';
```

**GOOD** -- Community safe area context:
```typescript
import { SafeAreaView } from 'react-native-safe-area-context';
```

---

## Quick Reference

| Task | API | Key Detail |
|------|-----|------------|
| Container layout | `View` | Flexbox, `column` default direction |
| Display text | `Text` | Must wrap all strings |
| Touch handler | `Pressable` | `style` accepts `({ pressed }) => style` |
| Text input | `TextInput` | `onChangeText` (not `onChange`) |
| Remote image | `Image` | Must set explicit `width`/`height` |
| Large list | `FlatList` | Virtualized, set performance props |
| Sectioned list | `SectionList` | `sections` array with `renderSectionHeader` |
| Scrollable content | `ScrollView` | Only for small/bounded content |
| Loading spinner | `ActivityIndicator` | `size="large"` or `"small"` |
| Toggle switch | `Switch` | `value` + `onValueChange` |
| Keyboard avoidance | `KeyboardAvoidingView` | `behavior="padding"` (iOS) |
| Status bar control | `StatusBar` | `barStyle`, `backgroundColor` (Android) |
| Platform detection | `Platform.OS` | Returns `'ios'` or `'android'` |
| Screen dimensions | `useWindowDimensions()` | Preferred over `Dimensions.get()` |
| Deferred work | `InteractionManager` | `runAfterInteractions()` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Architecture overview, New Architecture, Fabric, JSI | [01-framework-overview.md](01-framework-overview.md) |
| Environment setup, project creation, CLI | [02-quickstart-setup.md](02-quickstart-setup.md) |
| Core component APIs with full prop tables | [03-core-components.md](03-core-components.md) |
| Turbo Native Modules (Android/iOS/C++) | [04-native-modules.md](04-native-modules.md) |
| Data persistence (AsyncStorage, SecureStore, SQLite) | [05-data-persistence.md](05-data-persistence.md) |
| React Navigation (Stack, Tab, Deep Linking) | [06-navigation.md](06-navigation.md) |
| Performance, security, accessibility patterns | [07-best-practices.md](07-best-practices.md) |
| Hermes engine, bundle optimization, ProGuard | [08-hermes-optimization.md](08-hermes-optimization.md) |
| Testing (Jest, RNTL, Detox), DevTools, debugging | [09-testing-devtools.md](09-testing-devtools.md) |
| Version upgrade guide (0.81 to 0.83) | [10-upgrade-guide.md](10-upgrade-guide.md) |
| Project architecture patterns for monorepo apps | [11-project-architecture.md](11-project-architecture.md) |
| iOS TextInput text clipping fix | [12-ios-text-clipping.md](12-ios-text-clipping.md) |

---

**Version:** React Native 0.83.4 | React 19.2.0 | Hermes (default) | New Architecture (mandatory)
**Source:** https://reactnative.dev/docs/components-and-apis
