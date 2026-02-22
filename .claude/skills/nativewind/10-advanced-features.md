# Advanced Features - NativeWind v4

**Source:** https://www.nativewind.dev/docs/api/css-interop
**Last Verified:** February 2026
**Version:** NativeWind v4 (^4.1.23) + Tailwind 3.4.17

---

## Table of Contents
1. [cssInterop API](#cssinterop-api)
2. [Safe Area Utilities](#safe-area-utilities)
3. [Arbitrary Values](#arbitrary-values)
4. [Plugin System](#plugin-system)
5. [Container Queries](#container-queries)
6. [Advanced Configuration](#advanced-configuration)

---

## cssInterop API

`cssInterop` tags a component so NativeWind's runtime resolves `className` strings into style objects. Required for third-party components that do not pass className through the JSX transform.

### When to Use

- Custom native components that accept a `style` prop
- Third-party libraries (FlashList, React Native Maps, etc.)
- Components that accept style sub-props (e.g., `contentContainerStyle`)

### Basic Syntax

```typescript
import { cssInterop } from 'nativewind';
import { FlashList } from '@shopify/flash-list';
import MapView from 'react-native-maps';

// Map className -> style prop
cssInterop(FlashList, { className: 'style' });
cssInterop(MapView, { className: 'style' });
```

### Multiple Prop Mapping

```typescript
import { cssInterop } from 'nativewind';
import { FlashList } from '@shopify/flash-list';

// Map multiple className props to their style counterparts
cssInterop(FlashList, {
  className: 'style',
  contentContainerClassName: 'contentContainerStyle',
});

// Usage after mapping
<FlashList
  className="flex-1 bg-white"
  contentContainerClassName="p-4"
  data={data}
  renderItem={renderItem}
  estimatedItemSize={80}
/>
```

### Advanced: nativeStyleToProp

Extract specific CSS properties and route them to component props:

```typescript
import { cssInterop } from 'nativewind';
import { TextInput } from 'react-native';

cssInterop(TextInput, {
  className: {
    target: 'style',
    nativeStyleToProp: {
      textAlign: true,            // Extract textAlign as a direct prop
      color: 'placeholderTextColor', // Route color to placeholderTextColor
    },
  },
});
```

### Performance Note

Enabling `cssInterop` on a component adds runtime overhead -- NativeWind must resolve styles, add event handlers, and inject context. Only use it when necessary.

### Common Third-Party Integrations

| Library | Configuration |
|---------|--------------|
| `@shopify/flash-list` | `cssInterop(FlashList, { className: 'style', contentContainerClassName: 'contentContainerStyle' })` |
| `react-native-maps` | `cssInterop(MapView, { className: 'style' })` |
| `react-native-svg` | `cssInterop(Svg, { className: 'style' })` |

---

## Safe Area Utilities

NativeWind provides safe area inset utilities that adapt to device notches, home indicators, and rounded corners. Requires `react-native-safe-area-context`.

### Padding Safe Area

```typescript
// Pad all sides by safe area insets
<View className="p-safe">Content</View>

// Individual sides
<View className="pt-safe pb-safe">
  <Text>Respects top notch and bottom home indicator</Text>
</View>

// Horizontal safe areas (useful for landscape)
<View className="px-safe">Horizontal safe</View>
```

### Available Safe Area Classes

| Category | Classes |
|----------|---------|
| **Margin** | `m-safe` `mx-safe` `my-safe` `mt-safe` `mr-safe` `mb-safe` `ml-safe` `ms-safe` `me-safe` |
| **Padding** | `p-safe` `px-safe` `py-safe` `pt-safe` `pr-safe` `pb-safe` `pl-safe` `ps-safe` `pe-safe` |
| **Position** | `inset-safe` `inset-x-safe` `inset-y-safe` `top-safe` `right-safe` `bottom-safe` `left-safe` |
| **Height** | `h-screen-safe` `min-h-screen-safe` `max-h-screen-safe` |

### Variants: safe-or and safe-offset

```typescript
// Use the GREATER of safe area inset or specified spacing
<View className="pt-safe-or-4">
  {/* If safe area top = 0, uses p-4 (16px). If safe area top = 47px, uses 47px */}
</View>

// ADD spacing ON TOP OF the safe area inset
<View className="pt-safe-offset-4">
  {/* safe area top + 16px */}
</View>
```

### Full Screen Safe Layout

```typescript
import { View, Text } from 'react-native';

export function SafeScreen() {
  return (
    <View className="flex-1 bg-white dark:bg-slate-900 pt-safe pb-safe">
      <View className="px-4 flex-1">
        <Text className="text-xl font-bold text-slate-900 dark:text-white">
          Safe content area
        </Text>
      </View>
    </View>
  );
}
```

**How it works:** On native, these use CSS `env()` functions with values from `react-native-safe-area-context`. On web, standard CSS `env(safe-area-inset-*)` variables are used.

**Source:** https://www.nativewind.dev/docs/tailwind/new-concepts/safe-area-insets

---

## Arbitrary Values

Use any value not in the Tailwind design system with bracket syntax.

### Supported Categories

```typescript
// Colors
<View className="bg-[#3498db]" />
<View className="bg-[rgb(52,152,219)]" />
<View className="bg-[hsl(217,71%,53%)]" />

// Sizing
<View className="w-[250px] h-[100px]" />
<View className="w-[45%]" />
<View className="aspect-[3/2]" />

// Spacing
<View className="p-[18px] m-[25px] gap-[13px]" />

// Border radius
<View className="rounded-[15px]" />

// Color with opacity (slash syntax)
<View className="bg-blue-500/50" />   {/* 50% opacity */}
<View className="bg-blue-500/75" />   {/* 75% opacity */}
<Text className="text-red-600/80" />  {/* 80% opacity */}
```

### CSS Variable References

```typescript
<View
  style={{ '--brand': '#3498db' } as any}
  className="bg-[var(--brand)] p-[var(--spacing,16px)]"
/>
```

### Safelist for Dynamic Patterns

When classes are generated dynamically and Tailwind cannot detect them, add a safelist:

```javascript
// tailwind.config.js
module.exports = {
  safelist: [
    { pattern: /bg-(red|blue|green)-[0-9]+/ },
    { pattern: /w-(1\/2|1\/3|1\/4)/ },
  ],
};
```

---

## Plugin System

### Container Queries Plugin

```bash
npm install -D @tailwindcss/container-queries
```

```javascript
// tailwind.config.js
module.exports = {
  plugins: [require('@tailwindcss/container-queries')],
};
```

```typescript
<View className="@container p-4">
  <View className="flex-col @md:flex-row gap-4">
    <View className="@md:flex-1">Left</View>
    <View className="@md:flex-1">Right</View>
  </View>
</View>
```

### Container Query Breakpoints

| Prefix | Min Width |
|--------|-----------|
| `@sm:` | 384px |
| `@md:` | 448px |
| `@lg:` | 512px |
| `@xl:` | 576px |
| `@2xl:` | 672px |

### Custom Plugin

```javascript
// tailwind.config.js
module.exports = {
  plugins: [
    function ({ addUtilities }) {
      addUtilities({
        '.card-shadow': {
          shadowColor: '#000',
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.1,
          shadowRadius: 8,
          elevation: 3,
        },
      });
    },
  ],
};
```

Usage: `<View className="card-shadow p-4 rounded-lg" />`

---

## Container Queries

Style children based on parent container size instead of viewport.

```typescript
import { View, Text } from 'react-native';

export function AdaptiveCard({ title, desc }: { title: string; desc: string }) {
  return (
    <View className="@container bg-white rounded-lg p-4 shadow-sm">
      <View className="gap-4 @md:flex-row @md:gap-6">
        <View className="w-full @md:w-32 h-32 bg-gray-300 rounded-lg" />
        <View className="flex-1 justify-center">
          <Text className="text-lg font-bold">{title}</Text>
          <Text className="text-gray-600 text-sm">{desc}</Text>
        </View>
      </View>
    </View>
  );
}
```

**Benefits:** Component-level responsiveness, reusable across different container widths.

---

## Advanced Configuration

### Theme Extension

```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}', './components/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: { DEFAULT: '#3498db', dark: '#2980b9' },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui'],
      },
      spacing: { '128': '32rem' },
      fontSize: { xxs: '10px' },
      borderRadius: { xl: '20px' },
    },
  },
  corePlugins: {
    preflight: false, // Disable web resets for React Native
  },
};
```

### Brand-Specific Builds

```javascript
const brands = {
  acme: { primary: '#ff6b6b', secondary: '#339af0' },
  tech: { primary: '#1976d2', secondary: '#00bcd4' },
};
const brand = process.env.REACT_APP_BRAND || 'acme';

module.exports = {
  theme: {
    extend: {
      colors: {
        'brand-primary': brands[brand].primary,
        'brand-secondary': brands[brand].secondary,
      },
    },
  },
};
```

### Platform-Specific CSS Variables

```css
/* global.css */
@layer base {
  :root {
    --font-sans: 'Segoe UI', sans-serif;
  }
  @media ios {
    :root { --font-sans: -apple-system, BlinkMacSystemFont; }
  }
  @media android {
    :root { --font-sans: 'Roboto', sans-serif; }
  }
}
```

---

## Related Documentation

- **Core Concepts:** `02-core-concepts.md`
- **CSS Variables:** `09-custom-values.md`
- **Best Practices:** `11-best-practices.md`

---

**Version:** NativeWind 4.x (^4.1.23) + Tailwind 3.4.17 | **Source:** https://www.nativewind.dev/docs/api/css-interop
