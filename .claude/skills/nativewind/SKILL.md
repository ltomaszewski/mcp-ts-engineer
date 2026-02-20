---
name: nativewind
description: NativeWind Tailwind CSS styling - className, responsive design, dark mode, custom values. Use when styling React Native components with Tailwind utilities.
---

# NativeWind

> Tailwind CSS for React Native. Use `className` prop with Tailwind utilities, compiled to StyleSheet at build time.

---

## When to Use

**LOAD THIS SKILL** when user is:
- Styling React Native components with `className`
- Implementing responsive layouts with breakpoints
- Setting up dark mode theming
- Using platform-specific styles (ios:, android:)
- Configuring Tailwind theme or custom values

---

## Critical Rules

**ALWAYS:**
1. Use `className` prop — works on any RN component via JSX transform
2. Use `dark:` prefix for dark mode — automatically responds to system theme
3. Use breakpoints for responsive — `sm:`, `md:`, `lg:` work on RN
4. Use platform selectors — `ios:`, `android:`, `native:`, `web:`

**NEVER:**
1. Mix `style` and `className` carelessly — `className` wins for same properties
2. Use web-only utilities — some Tailwind classes don't work on native
3. Forget to wrap app in `<ThemeProvider>` — required for dark mode
4. Use `hover:` on native — use `active:` for touch feedback instead

---

## Core Patterns

### Basic Component Styling

```typescript
import { View, Text } from 'react-native';

export function Card() {
  return (
    <View className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <Text className="text-lg font-bold text-gray-900 dark:text-white">
        Title
      </Text>
      <Text className="mt-2 text-gray-600 dark:text-gray-300">
        Description text
      </Text>
    </View>
  );
}
```

### Responsive Layout

```typescript
// Stack on mobile, row on tablet+
<View className="flex-col md:flex-row gap-4">
  <View className="flex-1 p-4 bg-blue-500" />
  <View className="flex-1 p-4 bg-green-500" />
</View>

// Different sizes per breakpoint
<Text className="text-sm md:text-base lg:text-lg">
  Responsive text
</Text>
```

### Platform-Specific Styles

```typescript
// Different padding per platform
<View className="p-2 ios:p-4 android:p-3">
  <Text className="text-base ios:text-lg android:text-sm">
    Platform-aware text
  </Text>
</View>
```

### Dark Mode Toggle

```typescript
import { useColorScheme } from 'nativewind';
import { Pressable, Text, View } from 'react-native';

export function ThemeToggle() {
  const { colorScheme, setColorScheme } = useColorScheme();

  return (
    <View className="flex-row gap-2">
      <Pressable
        onPress={() => setColorScheme('light')}
        className="p-2 bg-gray-200 dark:bg-gray-700 rounded"
      >
        <Text>Light</Text>
      </Pressable>
      <Pressable
        onPress={() => setColorScheme('dark')}
        className="p-2 bg-gray-200 dark:bg-gray-700 rounded"
      >
        <Text>Dark</Text>
      </Pressable>
      <Pressable
        onPress={() => setColorScheme('system')}
        className="p-2 bg-gray-200 dark:bg-gray-700 rounded"
      >
        <Text>System</Text>
      </Pressable>
    </View>
  );
}
```

---

## Anti-Patterns

**BAD** — Using hover on native:
```typescript
<Pressable className="hover:bg-blue-500"> // Won't work on native
```

**GOOD** — Using active for touch:
```typescript
<Pressable className="active:bg-blue-500"> // Works on native touch
```

**BAD** — Forgetting dark mode prefix:
```typescript
<View className="bg-white text-black"> // No dark mode support
```

**GOOD** — Including dark variants:
```typescript
<View className="bg-white dark:bg-gray-900 text-black dark:text-white">
```

---

## Quick Reference

| Task | Pattern | Example |
|------|---------|---------|
| Dark mode | `dark:` | `dark:bg-gray-900` |
| Responsive | `sm:` `md:` `lg:` | `md:flex-row` |
| iOS only | `ios:` | `ios:p-4` |
| Android only | `android:` | `android:p-3` |
| Touch feedback | `active:` | `active:opacity-70` |
| Focus | `focus:` | `focus:border-blue-500` |
| Spacing | `p-` `m-` `gap-` | `p-4 gap-2` |
| Flexbox | `flex-` | `flex-row flex-1` |
| Text | `text-` `font-` | `text-lg font-bold` |
| Colors | `bg-` `text-` | `bg-blue-500 text-white` |
| Border | `border-` `rounded-` | `border border-gray-300 rounded-lg` |
| Shadow | `shadow-` | `shadow-md` |

---

## Deep Dive References

Load additional context when needed:

| When you need | Load |
|---------------|------|
| Installation and config | [01-setup-guide.md](01-setup-guide.md) |
| How className compiles | [02-core-concepts.md](02-core-concepts.md) |
| Dynamic and conditional styles | [03-styling-system.md](03-styling-system.md) |
| Flexbox and spacing | [04-layout-utilities.md](04-layout-utilities.md) |
| Breakpoints and platform selectors | [05-responsive-design.md](05-responsive-design.md) |
| Color and typography tokens | [06-color-typography.md](06-color-typography.md) |
| Pseudo-classes (active, focus) | [07-pseudo-classes.md](07-pseudo-classes.md) |
| Dark mode setup | [08-dark-mode.md](08-dark-mode.md) |
| CSS variables and custom values | [09-custom-values.md](09-custom-values.md) |
| Arbitrary values and plugins | [10-advanced-features.md](10-advanced-features.md) |
| Performance and debugging | [11-best-practices.md](11-best-practices.md) |

---

**Version:** 4.x | **Source:** https://www.nativewind.dev/
