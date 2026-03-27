---
name: nativewind
description: NativeWind v5 Tailwind CSS styling - className prop, responsive breakpoints, dark mode, platform selectors, cssInterop, safe area utilities. Use when styling React Native components with Tailwind utilities, configuring themes, or integrating third-party components.
---

# NativeWind

Use Tailwind CSS utility classes to style React Native components across iOS, Android, and Web via a single `className` prop.

---

## When to Use

LOAD THIS SKILL when user is:
- Styling React Native components with `className` prop
- Implementing responsive layouts with breakpoints (`sm:`, `md:`, `lg:`)
- Setting up dark mode with `dark:` prefix or `useColorScheme`
- Using platform-specific styles (`ios:`, `android:`, `web:`, `native:`)
- Integrating third-party components via `cssInterop`

---

## Critical Rules

**ALWAYS:**
1. Use `className` prop directly on RN components -- JSX transform handles it, no wrapper needed
2. Use `dark:` prefix for dark mode -- automatically responds to system or manual theme
3. Use `active:` for touch feedback on native -- `hover:` only works on web
4. Wrap Metro config with `withNativewind` -- required for style compilation
5. Import `global.css` once at app root -- before any other imports
6. Use `react-native-css` peer dep (replaces `react-native-css-interop` from v4)
7. New Architecture is required (mandatory in Expo SDK 55+)

**NEVER:**
1. Use `hover:` on native without web fallback -- no pointer events on touch devices
2. Construct class names dynamically with string interpolation -- Tailwind scanner cannot detect `bg-${color}-500`; use lookup objects instead
3. Use `tailwind.config.js` -- v5 uses CSS `@theme` blocks in `global.css`
4. Add `nativewind/babel` preset to `babel.config.js` -- removed in v5
5. Mix `style` and `className` for the same property -- `style` wins, causing confusion
6. Use NativeWind `text-*` classes on `TextInput` for fontSize -- sets lineHeight too, causing iOS descender clipping; use `style={{ fontSize: N }}` instead

---

## Core Patterns

### Basic Component Styling

```typescript
import { View, Text } from 'react-native';

export function Card({ title }: { title: string }) {
  return (
    <View className="p-4 bg-white dark:bg-gray-900 rounded-lg shadow-md">
      <Text className="text-lg font-bold text-gray-900 dark:text-white">
        {title}
      </Text>
    </View>
  );
}
```

### Responsive Layout

```typescript
<View className="flex-col md:flex-row gap-4 p-4">
  <View className="flex-1 bg-blue-500 p-4 rounded-lg" />
  <View className="flex-1 bg-green-500 p-4 rounded-lg" />
</View>
```

### Platform-Specific Styles

```typescript
<View className="p-2 ios:p-4 android:p-3 web:cursor-pointer">
  <Text className="text-base ios:text-lg">Platform-aware</Text>
</View>
```

### Dark Mode Toggle

```typescript
import { useColorScheme } from 'nativewind';

export function ThemeToggle() {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();
  return (
    <Pressable onPress={toggleColorScheme}>
      <Text className="text-black dark:text-white">
        {colorScheme === 'dark' ? 'Light' : 'Dark'}
      </Text>
    </Pressable>
  );
}
```

### Third-Party Component Integration

```typescript
import { cssInterop } from 'nativewind';
import { FlashList } from '@shopify/flash-list';

cssInterop(FlashList, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});
```

### CSS Variables with vars()

```typescript
import { vars } from 'nativewind';

export function BrandSection({ color }: { color: string }) {
  return (
    <View style={vars({ '--brand': color })}>
      <Text className="text-[--brand]">Branded text</Text>
    </View>
  );
}
```

### Safe Area Utilities

```typescript
<View className="pt-safe pb-safe px-4 bg-white dark:bg-slate-900">
  <Text className="text-lg">Content respects notch and home indicator</Text>
</View>
```

---

## Anti-Patterns

**BAD** -- Dynamic class construction (invisible to Tailwind scanner):
```typescript
const color = 'blue';
<View className={`bg-${color}-500`} /> // Never found by purge
```

**GOOD** -- Lookup object with complete class strings:
```typescript
const colorMap = { blue: 'bg-blue-500', red: 'bg-red-500' };
<View className={colorMap[color]} />
```

**BAD** -- Using `text-lg` on TextInput (clips descenders on iOS):
```typescript
<TextInput className="text-lg text-white" />
```

**GOOD** -- Use style prop for fontSize on TextInput:
```typescript
<TextInput className="text-white" style={{ fontSize: 18 }} />
```

**BAD** -- v4 tailwind.config.js theme extension:
```javascript
// tailwind.config.js -- REMOVED in v5
module.exports = { theme: { extend: { colors: { primary: '#3498db' } } } }
```

**GOOD** -- v5 CSS @theme block:
```css
/* global.css */
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";

@theme {
  --color-primary: #3498db;
}
```

---

## Quick Reference

| Task | Pattern | Example |
|------|---------|---------|
| Dark mode | `dark:` prefix | `dark:bg-gray-900` |
| Responsive | `sm:` `md:` `lg:` `xl:` `2xl:` | `md:flex-row` |
| iOS only | `ios:` | `ios:pt-12` |
| Android only | `android:` | `android:pt-4` |
| Web only | `web:` | `web:cursor-pointer` |
| Native (iOS+Android) | `native:` | `native:p-4` |
| Touch feedback | `active:` | `active:opacity-70` |
| Focus (TextInput) | `focus:` | `focus:border-blue-500` |
| Safe area padding | `p*-safe` | `pt-safe pb-safe` |
| Safe area with offset | `p*-safe-offset-[n]` | `pt-safe-offset-4` |
| Container query | `@container` + `@md:` | `@md:flex-row` |
| Arbitrary value | `[value]` | `w-[250px]` `bg-[#3498db]` |
| CSS variable | `[--name]` shorthand | `text-[--brand]` `bg-[--primary]` |
| vars() function | set CSS vars from JS | `style={vars({ '--brand': 'red' })}` |
| Important | `!` prefix | `!text-red-500` (wins over inline) |
| Color opacity | `/` suffix | `bg-blue-500/50` |
| Aspect ratio | `aspect-` | `aspect-square` `aspect-[3/2]` |
| Gap | `gap-` | `gap-4` `gap-x-2` |

---

## Deep Dive References

| When you need | Load |
|---------------|------|
| Installation and Expo/RN CLI setup | [01-setup-guide.md](01-setup-guide.md) |
| How className compiles, architecture | [02-core-concepts.md](02-core-concepts.md) |
| Dynamic styles, clsx, conditional classes | [03-styling-system.md](03-styling-system.md) |
| Flexbox, grid, spacing utilities | [04-layout-utilities.md](04-layout-utilities.md) |
| Breakpoints, platform selectors | [05-responsive-design.md](05-responsive-design.md) |
| Colors, typography, font management | [06-color-typography.md](06-color-typography.md) |
| active, focus, hover, parent state | [07-pseudo-classes.md](07-pseudo-classes.md) |
| Dark mode setup and useColorScheme | [08-dark-mode.md](08-dark-mode.md) |
| CSS variables, var(), arbitrary values | [09-custom-values.md](09-custom-values.md) |
| cssInterop, plugins, advanced config | [10-advanced-features.md](10-advanced-features.md) |
| Performance, debugging, best practices | [11-best-practices.md](11-best-practices.md) |

---

**Version:** 5.0.0-preview.3 + Tailwind 4.1.x | **Source:** https://www.nativewind.dev/v5/
