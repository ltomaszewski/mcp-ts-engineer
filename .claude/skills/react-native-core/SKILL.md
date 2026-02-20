---
name: react-native-core
description: React Native fundamentals - core components, native modules, navigation, best practices. Use when working with RN basics, platform-specific code, or performance optimization.
---

# React Native Core

> Cross-platform mobile development with native performance using core components, Hermes, and platform-specific optimizations.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Working with core RN components (View, Text, FlatList, Pressable, TextInput, Image)
- Implementing platform-specific code (iOS/Android differences)
- Optimizing list performance or component rendering
- Creating native modules or TurboModules
- Debugging React Native apps or using Flipper

---

## Project-Specific Architecture (PRIORITY)

**For this monorepo, these standards OVERRIDE generic RN patterns:**

| Category | Technology | Rule |
|----------|------------|------|
| Styling | NativeWind | Use `className`, NOT `StyleSheet.create` |
| State | Zustand | Client state in `src/stores/` |
| Server State | TanStack Query | `useQuery`/`useMutation` in feature hooks |
| Storage | MMKV | NOT AsyncStorage |
| Navigation | Expo Router | File-based in `app/` |
| Screen Pattern | One Hook Per Screen | ALL logic in `use*Screen` hook (MANDATORY) |

---

## Critical Rules

**ALWAYS:**
1. Use `FlatList` for lists > 50 items — ScrollView renders all children immediately
2. Provide `keyExtractor` returning stable unique IDs — never use array index
3. Memoize `renderItem` with `React.memo` — prevents unnecessary re-renders
4. Set FlatList performance props (`initialNumToRender`, `maxToRenderPerBatch`, `windowSize`)
5. Specify `width` and `height` for `Image` components — required for remote images
6. Use `Pressable` over TouchableOpacity — modern API with better state handling

**NEVER:**
1. Put business logic in screen components — use `use*Screen` hook pattern
2. Use `StyleSheet.create` in this project — use NativeWind `className`
3. Create inline functions in `renderItem` — causes re-renders every frame
4. Skip `removeClippedSubviews={true}` on Android FlatLists — memory leak
5. Use `accessible={true}` on containers with testID children — breaks Maestro E2E testing

---

## Core Patterns

### One Hook Per Screen (MANDATORY)

```typescript
// src/features/auth/screens/LoginScreen.tsx
import { View, Text, Pressable } from 'react-native';
import { Input } from '@/shared/components/ui';
import { useLoginScreen } from '../hooks/useLoginScreen';

export function LoginScreen(): React.ReactElement {
  const {
    email, setEmail,
    password, setPassword,
    handleLogin,
    isLoading,
    error,
  } = useLoginScreen();

  return (
    <View className="flex-1 p-4">
      <Input value={email} onChangeText={setEmail} placeholder="Email" />
      <Input value={password} onChangeText={setPassword} secureTextEntry />
      {error && <Text className="text-red-500">{error}</Text>}
      <Pressable onPress={handleLogin} disabled={isLoading} className="bg-primary-500 p-4 rounded-lg">
        <Text className="text-white text-center">{isLoading ? 'Loading...' : 'Login'}</Text>
      </Pressable>
    </View>
  );
}
```

### NativeWind Component

```typescript
import { Pressable, Text } from 'react-native';
import { cn } from '@/shared/utils/cn';

interface ButtonProps {
  title: string;
  variant?: 'primary' | 'secondary';
  onPress: () => void;
  disabled?: boolean;
  className?: string;
}

export function Button({
  title, variant = 'primary', onPress, disabled, className,
}: ButtonProps): React.ReactElement {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      className={cn(
        'items-center justify-center rounded-lg px-4 py-3',
        variant === 'primary' && 'bg-primary-500 active:bg-primary-600',
        variant === 'secondary' && 'bg-gray-200 active:bg-gray-300',
        disabled && 'opacity-50',
        className
      )}
    >
      <Text className={cn(
        'font-semibold',
        variant === 'primary' ? 'text-white' : 'text-gray-900'
      )}>
        {title}
      </Text>
    </Pressable>
  );
}
```

### Optimized FlatList

```typescript
import { FlatList, View, Text } from 'react-native';
import { memo, useCallback } from 'react';

interface Item { id: string; title: string }

const ListItem = memo(({ item }: { item: Item }) => (
  <View className="p-4 border-b border-gray-200">
    <Text className="text-lg">{item.title}</Text>
  </View>
));

export function ItemList({ data }: { data: Item[] }) {
  const renderItem = useCallback(
    ({ item }: { item: Item }) => <ListItem item={item} />,
    []
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
      scrollEventThrottle={16}
    />
  );
}
```

### E2E-Safe Pressable Container

```typescript
// When wrapping inputs with Pressable for keyboard dismiss
<Pressable onPress={Keyboard.dismiss} accessible={false}>
  <TextInput testID="email_input" accessible={true} />
  <TextInput testID="password_input" accessible={true} />
</Pressable>
```

---

## Anti-Patterns

**BAD** — Business logic in screen:
```typescript
export function LoginScreen() {
  const [email, setEmail] = useState(''); // NO - put in hook
  const handleLogin = async () => { }; // NO - put in hook
  return <View>...</View>;
}
```

**GOOD** — One Hook Per Screen:
```typescript
export function LoginScreen() {
  const { email, setEmail, handleLogin } = useLoginScreen();
  return <View>...</View>; // Pure JSX only
}
```

**BAD** — StyleSheet.create (project uses NativeWind):
```typescript
const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
});
<View style={styles.container} />
```

**GOOD** — NativeWind className:
```typescript
<View className="flex-1 p-4" />
```

**BAD** — Inline renderItem function:
```typescript
<FlatList
  renderItem={({ item }) => <ListItem item={item} />} // Re-created every render
/>
```

**GOOD** — Memoized renderItem:
```typescript
const renderItem = useCallback(({ item }) => <ListItem item={item} />, []);
<FlatList renderItem={renderItem} />
```

---

## Quick Reference

| Task | Component | Key Props |
|------|-----------|-----------|
| Container | `View` | `className`, `onLayout` |
| Text display | `Text` | `numberOfLines`, `ellipsizeMode` |
| Touch handler | `Pressable` | `onPress`, `disabled`, `android_ripple` |
| Text input | `TextInput` | `value`, `onChangeText`, `keyboardType`, `secureTextEntry` |
| Image | `Image` | `source`, `resizeMode` (MUST set width/height) |
| Small list | `ScrollView` | `showsVerticalScrollIndicator`, `keyboardShouldPersistTaps` |
| Large list | `FlatList` | `data`, `renderItem`, `keyExtractor`, performance props |
| Sectioned list | `SectionList` | `sections`, `renderSectionHeader` |

### FlatList Performance Props

| Prop | Default | Recommended | Purpose |
|------|---------|-------------|---------|
| `initialNumToRender` | 10 | 10 | First render items |
| `maxToRenderPerBatch` | 10 | 10 | Items per batch |
| `windowSize` | 21 | 5 | Viewport multiplier |
| `removeClippedSubviews` | false | true (Android) | Remove off-screen |
| `scrollEventThrottle` | 50 | 16 | 60fps scroll events |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Framework architecture overview | [01-framework-overview.md](01-framework-overview.md) |
| Project setup and CLI | [02-quickstart-setup.md](02-quickstart-setup.md) |
| Core component APIs | [03-core-components.md](03-core-components.md) |
| Native modules and TurboModules | [04-native-modules.md](04-native-modules.md) |
| Data persistence (MMKV, SQLite) | [05-data-persistence.md](05-data-persistence.md) |
| Navigation patterns | [06-navigation.md](06-navigation.md) |
| Best practices and patterns | [07-best-practices.md](07-best-practices.md) |
| Hermes engine optimization | [08-hermes-optimization.md](08-hermes-optimization.md) |
| Testing and debugging | [09-testing-devtools.md](09-testing-devtools.md) |
| Version upgrade guide | [10-upgrade-guide.md](10-upgrade-guide.md) |
| **Project architecture (PRIORITY)** | [11-project-architecture.md](11-project-architecture.md) |
| iOS text clipping issues | [12-ios-text-clipping.md](12-ios-text-clipping.md) |

---

**Version:** React Native 0.83 | **Source:** https://reactnative.dev/docs
