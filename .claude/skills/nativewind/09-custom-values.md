# Custom Values & Advanced Styling - NativeWind v4.2.x

**Source:** https://www.nativewind.dev/docs/core-concepts/functions-and-directives
**Last Verified:** February 2026
**Version:** NativeWind v4.2.x

---

## Table of Contents
1. [vars() Function (Recommended)](#vars-function-recommended)
2. [CSS Variable Shorthand](#css-variable-shorthand)
3. [CSS Variables (Custom Properties)](#css-variables-custom-properties)
4. [var() Function](#var-function)
5. [useUnstableNativeVariable Hook](#useunstablenativevariable-hook)
6. [Dynamic Theming](#dynamic-theming)
7. [Arbitrary Values](#arbitrary-values)
8. [Advanced Patterns](#advanced-patterns)

---

## vars() Function (Recommended)

NativeWind 4.2.x provides a `vars()` helper function as the preferred way to set CSS variables from JavaScript. It returns a properly typed style object.

### Basic Usage

```typescript
import { View, Text } from 'react-native';
import { vars } from 'nativewind';

export const VarsExample = () => {
  return (
    <View style={vars({ '--brand': '#3498db', '--spacing': '16px' })}>
      <Text className="text-[--brand]">Branded text</Text>
      <View className="p-[--spacing] bg-[--brand] rounded-lg">
        <Text className="text-white">Themed box</Text>
      </View>
    </View>
  );
};
```

### Dynamic vars() with Props

```typescript
import { View, Text } from 'react-native';
import { vars } from 'nativewind';

interface ThemeProps {
  primaryColor: string;
  accentColor: string;
}

export const ThemedSection = ({ primaryColor, accentColor }: ThemeProps) => {
  return (
    <View style={vars({ '--primary': primaryColor, '--accent': accentColor })}>
      <View className="bg-[--primary] p-4 rounded-lg">
        <Text className="text-white font-bold">Primary Section</Text>
      </View>
      <View className="bg-[--accent] p-4 rounded-lg mt-2">
        <Text className="text-white font-bold">Accent Section</Text>
      </View>
    </View>
  );
};
```

### vars() vs Inline Style

```typescript
// ✅ RECOMMENDED: Use vars() helper (type-safe, no `as any` cast)
import { vars } from 'nativewind';
<View style={vars({ '--color': '#3498db' })}>
  <Text className="text-[--color]">Typed</Text>
</View>

// ⚠️ LEGACY: Inline style with `as any` cast (still works)
<View style={{ '--color': '#3498db' } as any}>
  <Text className="text-[var(--color)]">Untyped</Text>
</View>
```

---

## CSS Variable Shorthand

NativeWind 4.2.x supports a shorthand syntax for referencing CSS variables without `var()`:

```typescript
// ✅ SHORTHAND (4.2.x): Omit var() wrapper
<Text className="text-[--brand]" />
<View className="bg-[--primary] p-[--spacing]" />

// EQUIVALENT TO (verbose):
<Text className="text-[var(--brand)]" />
<View className="bg-[var(--primary)] p-[var(--spacing)]" />
```

### Shorthand with Fallback

When using the shorthand, you can still specify fallback values:

```typescript
// Shorthand does NOT support fallback — use var() for fallbacks
<View className="bg-[var(--brand,#3498db)]" />
```

---

## CSS Variables (Custom Properties)

CSS variables allow you to define reusable values that can be changed at runtime, enabling dynamic theming and configuration.

### Defining CSS Variables

CSS variables can be defined in three ways:

#### 1. vars() Function (Preferred)

```typescript
import { View, Text } from 'react-native';
import { vars } from 'nativewind';

export const VarsFunction = () => {
  return (
    <View style={vars({ '--primary-color': '#3498db', '--spacing-unit': '8px' })}>
      <Text className="text-[--primary-color]">Dynamic themed box</Text>
    </View>
  );
};
```

#### 2. Inline Style Object (Legacy)

```typescript
import { View, Text } from 'react-native';

export const InlineVariables = () => {
  return (
    <View
      style={{
        '--primary-color': '#3498db',
        '--spacing-unit': '8px',
      } as any}
      className="bg-[var(--primary-color)] p-[var(--spacing-unit)]"
    >
      <Text>Dynamic themed box</Text>
    </View>
  );
};
```

#### 2. Theme Configuration

Define variables in your `tailwind.config.js`:

```javascript
module.exports = {
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary, #3498db)',
        secondary: 'var(--color-secondary, #2ecc71)',
      },
      spacing: {
        unit: 'var(--spacing-unit, 8px)',
      },
    },
  },
}
```

#### 3. Global CSS File

Define in `global.css`:

```css
@layer base {
  :root {
    --color-primary: #3498db;
    --color-secondary: #2ecc71;
    --spacing-unit: 8px;
    --border-radius: 8px;
  }
  
  /* Dark mode variables */
  @media (prefers-color-scheme: dark) {
    :root {
      --color-primary: #2980b9;
      --color-secondary: #27ae60;
    }
  }
}
```

### Basic Variable Usage

```typescript
import { View, Text } from 'react-native';

export const VariableExample = () => {
  return (
    <View
      style={{
        '--main-color': '#3498db',
        '--text-color': '#ffffff',
      } as any}
    >
      {/* Reference variables in className using arbitrary values */}
      <View className="bg-[var(--main-color)] p-4 rounded-lg">
        <Text className="text-[var(--text-color)] font-bold">
          Themed with CSS variables
        </Text>
      </View>
    </View>
  );
};
```

---

## var() Function

The `var()` CSS function references custom property values.

### Syntax

```css
var(--property-name)
var(--property-name, fallback-value)
```

### Complete var() Examples

```typescript
import { View, Text } from 'react-native';

export const VarFunction = () => {
  return (
    <View
      style={{
        '--primary': '#3498db',
        '--radius': '8px',
        '--spacing': '16px',
      } as any}
      className="gap-4"
    >
      {/* Simple variable reference */}
      <View className="bg-[var(--primary)]">
        <Text>Box 1</Text>
      </View>
      
      {/* Variable with fallback */}
      <View className="rounded-[var(--radius,4px)]">
        <Text>Box 2 (fallback if --radius undefined)</Text>
      </View>
      
      {/* Multiple variable uses */}
      <View
        className="bg-[var(--primary)] p-[var(--spacing)] rounded-[var(--radius)]"
        style={{
          '--primary': '#2ecc71',  // Override
        } as any}
      >
        <Text>Box 3 (color overridden)</Text>
      </View>
    </View>
  );
};
```

### Important: No Calc() in var()

NativeWind doesn't support calculations inside var() directly:

```typescript
// ❌ NOT SUPPORTED
<View style={{ '--size': 'calc(10px + 20px)' } as any} />

// ✅ SOLUTION: Calculate in JavaScript
const size = 30; // 10 + 20
<View style={{ '--size': `${size}px` } as any} />

// ✅ ALTERNATIVE: Define calculated variable
<View
  style={{
    '--base': '10px',
    '--multiplier': 2,
    '--computed': '20px', // Pre-calculated
  } as any}
  className="w-[var(--computed)]"
/>
```

---

## useUnstableNativeVariable Hook

Read the computed value of a CSS variable in JavaScript. Useful for passing variable values to native components that don't support className.

```typescript
import { View } from 'react-native';
import { vars, useUnstableNativeVariable } from 'nativewind';

export const NativeVariableExample = () => {
  const brandColor = useUnstableNativeVariable('--brand');

  return (
    <View style={vars({ '--brand': '#3498db' })}>
      {/* Use the resolved value for native props that need a color string */}
      <View style={{ shadowColor: brandColor, shadowOpacity: 0.3, shadowRadius: 8 }}>
        <View className="bg-[--brand] p-4 rounded-lg">
          {/* className uses the variable directly */}
        </View>
      </View>
    </View>
  );
};
```

**Note:** This API is marked "unstable" and may change in future versions.

---

## Dynamic Theming

Use CSS variables to implement dynamic theming that updates at runtime.

### Simple Theme Switcher

```typescript
import { View, Text, Pressable } from 'react-native';
import { useState } from 'react';

export const DynamicTheme = () => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  
  const themeVariables = {
    light: {
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f5f5f5',
      '--text-primary': '#000000',
      '--text-secondary': '#666666',
      '--accent': '#3498db',
    },
    dark: {
      '--bg-primary': '#1a1a1a',
      '--bg-secondary': '#2d2d2d',
      '--text-primary': '#ffffff',
      '--text-secondary': '#cccccc',
      '--accent': '#2980b9',
    },
  };
  
  return (
    <View
      style={themeVariables[theme] as any}
      className="flex-1 bg-[var(--bg-primary)]"
    >
      {/* Content respects theme variables */}
      <View className="flex-1 items-center justify-center">
        <Text className="text-[var(--text-primary)] text-2xl font-bold">
          {theme.toUpperCase()} Mode
        </Text>
        <Text className="text-[var(--text-secondary)] mt-2">
          Using CSS variables
        </Text>
      </View>
      
      {/* Theme toggle */}
      <View className="gap-2 p-4 bg-[var(--bg-secondary)]">
        <Pressable
          onPress={() => setTheme('light')}
          className={`p-3 rounded-lg ${
            theme === 'light'
              ? 'bg-[var(--accent)]'
              : 'bg-gray-400'
          }`}
        >
          <Text className="text-white text-center font-bold">Light</Text>
        </Pressable>
        <Pressable
          onPress={() => setTheme('dark')}
          className={`p-3 rounded-lg ${
            theme === 'dark'
              ? 'bg-[var(--accent)]'
              : 'bg-gray-400'
          }`}
        >
          <Text className="text-white text-center font-bold">Dark</Text>
        </Pressable>
      </View>
    </View>
  );
};
```

### Brand Color System

```typescript
import { View, Text } from 'react-native';

export const BrandTheme = ({ brand }: { brand: 'acme' | 'tech' }) => {
  const brands = {
    acme: {
      '--primary': '#ff6b6b',
      '--primary-light': '#ff8787',
      '--primary-dark': '#c92a2a',
      '--secondary': '#339af0',
      '--success': '#51cf66',
      '--warning': '#ffd43b',
    },
    tech: {
      '--primary': '#1976d2',
      '--primary-light': '#42a5f5',
      '--primary-dark': '#1565c0',
      '--secondary': '#00bcd4',
      '--success': '#4caf50',
      '--warning': '#ff9800',
    },
  };
  
  return (
    <View
      style={brands[brand] as any}
      className="flex-1 gap-4 p-4 bg-white"
    >
      {/* Button with primary brand color */}
      <Pressable className="bg-[var(--primary)] p-4 rounded-lg items-center">
        <Text className="text-white font-bold">Primary Button</Text>
      </Pressable>
      
      {/* Secondary button */}
      <Pressable className="bg-[var(--secondary)] p-4 rounded-lg items-center">
        <Text className="text-white font-bold">Secondary Button</Text>
      </Pressable>
      
      {/* Status indicators */}
      <View className="flex-row gap-2">
        <View className="bg-[var(--success)] flex-1 h-12 rounded-lg" />
        <View className="bg-[var(--warning)] flex-1 h-12 rounded-lg" />
      </View>
    </View>
  );
};
```

### Multi-Level Theme Inheritance

```typescript
export const MultiLevelTheme = () => {
  return (
    <View
      style={{
        '--brand-primary': '#3498db',
        '--brand-secondary': '#2ecc71',
        '--spacing-base': '8px',
      } as any}
    >
      {/* Level 1: Use brand variables */}
      <View
        style={{
          '--card-bg': 'var(--brand-primary)',
          '--card-padding': 'calc(var(--spacing-base) * 2)',
        } as any}
      >
        {/* Level 2: Use derived variables */}
        <View
          className="bg-[var(--card-bg)] p-[var(--card-padding)] rounded-lg"
          style={{
            '--text-color': 'rgba(255, 255, 255, 0.9)',
          } as any}
        >
          <Text className="text-[var(--text-color)]">
            Multi-level themed component
          </Text>
        </View>
      </View>
    </View>
  );
};
```

---

## Arbitrary Values

Arbitrary values allow you to use any value not in the Tailwind design system.

### Arbitrary Color Values

```typescript
// Using hex colors
<View className="bg-[#3498db]">Color</View>
<View className="bg-[#f0a343]">Color</View>

// Using rgb
<View className="bg-[rgb(52,152,219)]">Color</View>

// Using hsl
<View className="bg-[hsl(217,71%,53%)]">Color</View>
```

### Arbitrary Sizing

```typescript
// Custom widths
<View className="w-[250px]">Width</View>
<View className="w-[45%]">Half plus margin</View>

// Custom heights
<View className="h-[100px]">Height</View>

// Custom aspect ratio
<View className="aspect-[3/2]">Image container</View>
```

### Arbitrary Spacing

```typescript
// Custom padding
<View className="p-[18px]">Padding</View>
<View className="px-[100px]">Horizontal padding</View>

// Custom margin
<View className="m-[25px]">Margin</View>
<View className="mt-[50px]">Top margin</View>

// Custom gap
<View className="gap-[13px]">Gap between items</View>
```

### Arbitrary Border Radius

```typescript
<View className="rounded-[15px]">Rounded</View>
<View className="rounded-t-[20px]">Top only</View>
```

---

## Advanced Patterns

### 1. Responsive Variables

```typescript
export const ResponsiveVariables = () => {
  return (
    <View
      style={{
        '--padding-mobile': '16px',
        '--padding-tablet': '32px',
        '--text-size-mobile': '14px',
        '--text-size-tablet': '16px',
      } as any}
    >
      <View className="p-[var(--padding-mobile)] md:p-[var(--padding-tablet)]">
        <Text className="text-[var(--text-size-mobile)] md:text-[var(--text-size-tablet)]">
          Responsive sizing with variables
        </Text>
      </View>
    </View>
  );
};
```

### 2. State-Based Variables

```typescript
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

export const StateVariables = () => {
  const [isActive, setIsActive] = useState(false);
  
  return (
    <View
      style={{
        '--active-color': isActive ? '#4caf50' : '#9e9e9e',
        '--active-opacity': isActive ? '1' : '0.5',
      } as any}
    >
      <Pressable
        onPress={() => setIsActive(!isActive)}
        className="bg-[var(--active-color)] p-4 rounded-lg items-center"
        style={{
          opacity: parseFloat(
            (isActive ? 1 : 0.5).toString()
          ),
        }}
      >
        <Text className="text-white font-bold">
          {isActive ? 'Active' : 'Inactive'}
        </Text>
      </Pressable>
    </View>
  );
};
```

### 3. Gradient Variables (Approximation)

While NativeWind doesn't support true gradients, you can fake with variables:

```typescript
export const GradientApproximation = () => {
  return (
    <View
      style={{
        '--grad-start': '#ff6b6b',
        '--grad-end': '#ff8787',
      } as any}
    >
      <View className="gap-1 overflow-hidden rounded-lg">
        <View className="h-4 bg-[var(--grad-start)]" />
        <View className="h-4 bg-[#ff7373]" />
        <View className="h-4 bg-[var(--grad-end)]" />
      </View>
    </View>
  );
};
```

---

## Performance Considerations

### Variables vs Inline Styles

```typescript
// ❌ Less efficient: New object every render
const Component = ({ theme }: any) => {
  return (
    <View
      style={{
        backgroundColor: theme.bg,
        padding: theme.padding,
      }}
    >
      Content
    </View>
  );
};

// ✅ More efficient: Reuse variables
const Component = ({ theme }: any) => {
  return (
    <View
      style={{
        '--bg': theme.bg,
        '--padding': theme.padding,
      } as any}
      className="bg-[var(--bg)] p-[var(--padding)]"
    >
      Content
    </View>
  );
};
```

---

## Related Documentation

- **Dark Mode:** `08-dark-mode.md` - System-provided theming
- **Styling System:** `03-styling-system.md` - Dynamic styles
- **Best Practices:** `11-best-practices.md` - Production patterns

**Source:** https://www.nativewind.dev/docs/core-concepts/functions-and-directives
