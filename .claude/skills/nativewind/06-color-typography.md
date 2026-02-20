# Color & Typography System - NativeWind v4

**Source:** https://www.nativewind.dev/docs  
**Last Verified:** October 14, 2025  
**Version:** NativeWind v4

---

## Table of Contents
1. [Color System](#color-system)
2. [Color Utilities](#color-utilities)
3. [Typography System](#typography-system)
4. [Font Management](#font-management)
5. [Text Styling Examples](#text-styling-examples)

---

## Color System

NativeWind uses Tailwind CSS's comprehensive color palette with 500+ colors organized by hue and shade.

### Color Scale

Each color comes in 11 shades (50, 100, 200, 300, 400, 500, 600, 700, 800, 900, 950):

```typescript
// Using different shades of blue
<View className="bg-blue-50" />    // Lightest
<View className="bg-blue-100" />
<View className="bg-blue-200" />
<View className="bg-blue-300" />
<View className="bg-blue-400" />
<View className="bg-blue-500" />   // Primary shade
<View className="bg-blue-600" />
<View className="bg-blue-700" />
<View className="bg-blue-800" />
<View className="bg-blue-900" />
<View className="bg-blue-950" />   // Darkest
```

### Color Families

**Primary Colors:**
- `slate`, `gray`, `zinc`, `neutral`, `stone` (neutrals)
- `red`, `orange`, `amber`, `yellow` (warm)
- `lime`, `green`, `emerald`, `teal` (cool)
- `cyan`, `sky`, `blue`, `indigo`, `violet` (blue)
- `purple`, `fuchsia`, `pink`, `rose` (pink)

### Color Utilities

| Property | Utilities | Use Case |
|----------|-----------|----------|
| **Background** | `bg-[color]` | Container backgrounds |
| **Text** | `text-[color]` | Text color |
| **Border** | `border-[color]` | Border colors |
| **Divide** | `divide-[color]` | Divider colors |
| **Ring** | `ring-[color]` | Focus rings (web) |

### Color Usage Examples

```typescript
import { View, Text } from 'react-native';

export const ColorExamples = () => {
  return (
    <View className="gap-4 p-4">
      {/* Background colors */}
      <View className="bg-red-500 p-4 rounded-lg">
        <Text className="text-white">Red background</Text>
      </View>
      
      {/* Text colors */}
      <View className="bg-blue-100 p-4 rounded-lg">
        <Text className="text-blue-900">Dark blue text on light blue</Text>
      </View>
      
      {/* Border colors */}
      <View className="border-2 border-green-500 p-4 rounded-lg">
        <Text className="text-green-700">Green border</Text>
      </View>
      
      {/* Opacity with colors */}
      <View className="bg-purple-500 bg-opacity-50 p-4 rounded-lg">
        <Text className="text-white">Semi-transparent purple</Text>
      </View>
    </View>
  );
};
```

---

## Color Utilities

### Background Colors

```typescript
<View className="bg-white" />         // White
<View className="bg-black" />         // Black
<View className="bg-slate-500" />     // Specific color
<View className="bg-blue-500" />      // Most used blue
<View className="bg-[#3498db]" />     // Custom hex color
<View className="bg-[rgb(52,152,219)]" /> // RGB color
```

### Text Colors

```typescript
<Text className="text-white" />       // White text
<Text className="text-slate-900" />   // Dark text
<Text className="text-gray-600" />    // Medium gray
<Text className="text-blue-500" />    // Colored text
<Text className="text-[#ff6b6b]" />   // Custom color
```

### Border Colors

```typescript
<View className="border border-gray-300" />
<View className="border-2 border-blue-500" />
<View className="border-t-2 border-red-500" /> {/* Top only */}
<View className="border-l border-green-400" /> {/* Left only */}
```

### Color Opacity

```typescript
{/* Opacity utility */}
<View className="bg-blue-500 opacity-50" /> {/* 50% opacity */}
<View className="bg-blue-500 opacity-75" /> {/* 75% opacity */}

{/* Or use opacity in color */}
<View className="bg-blue-500 bg-opacity-50" /> {/* Equivalent */}

{/* Text opacity */}
<Text className="text-blue-600 text-opacity-75">75% opacity text</Text>
```

---

## Typography System

### Font Sizes

| Class | Size | Usage |
|-------|------|-------|
| `text-xs` | 12px | Very small text, captions |
| `text-sm` | 14px | Small text, secondary info |
| `text-base` | 16px | Body text (default) |
| `text-lg` | 18px | Large text |
| `text-xl` | 20px | Extra large text |
| `text-2xl` | 24px | Heading level 6 |
| `text-3xl` | 30px | Heading level 5 |
| `text-4xl` | 36px | Heading level 4 |
| `text-5xl` | 48px | Heading level 3 |
| `text-6xl` | 60px | Heading level 2 |
| `text-7xl` | 72px | Heading level 1 |

### Font Weight

```typescript
<Text className="font-thin">100 weight</Text>      // Extra light
<Text className="font-light">300 weight</Text>     // Light
<Text className="font-normal">400 weight</Text>    // Normal (default)
<Text className="font-medium">500 weight</Text>    // Medium
<Text className="font-semibold">600 weight</Text>  // Semi-bold
<Text className="font-bold">700 weight</Text>      // Bold
<Text className="font-extrabold">800 weight</Text> // Extra bold
<Text className="font-black">900 weight</Text>     // Black
```

### Line Height

```typescript
<Text className="leading-tight">1.25 line height</Text>
<Text className="leading-normal">1.5 line height</Text>
<Text className="leading-relaxed">1.625 line height</Text>
<Text className="leading-loose">2 line height</Text>

{/* Custom line height */}
<Text className="leading-[1.8]">Custom line height</Text>
```

### Text Alignment

```typescript
<Text className="text-left">Aligned left</Text>
<Text className="text-center">Centered</Text>
<Text className="text-right">Aligned right</Text>
<Text className="text-justify">Justified (limited support)</Text>
```

### Letter Spacing

```typescript
<Text className="tracking-tight">-0.025em</Text>
<Text className="tracking-normal">0em (default)</Text>
<Text className="tracking-wide">0.025em</Text>
<Text className="tracking-wider">0.05em</Text>
<Text className="tracking-widest">0.1em</Text>
```

---

## Font Management

### System Fonts

Default fonts depend on platform:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        // System UI font stack
        sans: ['system-ui', '-apple-system', 'BlinkMacSystemFont'],
        
        // Serif fonts
        serif: ['Georgia', 'serif'],
        
        // Monospace
        mono: ['Courier New', 'monospace'],
      },
    },
  },
}
```

### Custom Fonts

#### iOS (Built-in System Fonts)

```typescript
<Text className="font-system">San Francisco (iOS)</Text>
<Text className="ios:font-['Helvetica']">Helvetica</Text>
```

#### Android (System Fonts)

```typescript
<Text className="font-sans">Roboto (Android default)</Text>
<Text className="android:font-['monospace']">Monospace</Text>
```

#### Custom Font Files

1. **Add font files** to your project
2. **Configure** in Tailwind config

```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        custom: ['MyCustomFont'],
      },
    },
  },
}
```

Usage:

```typescript
<Text className="font-custom">Custom font text</Text>
```

### Font Variant Settings (Platform Specific)

```typescript
<Text className="ios:font-['System']">iOS system font</Text>
<Text className="android:font-['Roboto']">Android Roboto</Text>
<Text className="web:font-sans">Web fallback</Text>
```

---

## Text Styling Examples

### Typographic Hierarchy

```typescript
import { View, Text } from 'react-native';

export const TypographyHierarchy = () => {
  return (
    <View className="gap-6 p-6 bg-white">
      {/* Heading 1 */}
      <Text className="text-4xl font-bold text-slate-900">
        Main Headline
      </Text>
      
      {/* Heading 2 */}
      <Text className="text-2xl font-semibold text-slate-800 mt-4">
        Section Title
      </Text>
      
      {/* Heading 3 */}
      <Text className="text-xl font-semibold text-slate-700">
        Subsection
      </Text>
      
      {/* Body text */}
      <Text className="text-base text-slate-600 leading-relaxed">
        This is body text with proper line height for readability.
        It has comfortable spacing between lines.
      </Text>
      
      {/* Secondary text */}
      <Text className="text-sm text-slate-500 mt-2">
        This is secondary information or metadata.
      </Text>
      
      {/* Captions */}
      <Text className="text-xs text-slate-400 uppercase tracking-wide">
        Image Caption or Small Label
      </Text>
    </View>
  );
};
```

### Styled Paragraph

```typescript
export const StyledParagraph = () => {
  return (
    <View className="p-6 bg-blue-50 rounded-lg border border-blue-200">
      {/* Title */}
      <Text className="text-2xl font-bold text-blue-900 mb-4">
        Tips for Success
      </Text>
      
      {/* Content with good line height */}
      <Text className="text-base text-blue-800 leading-relaxed mb-3">
        This paragraph demonstrates proper typography. The line height
        is set to relaxed (1.625em) for comfortable reading.
      </Text>
      
      {/* Highlighted text */}
      <Text className="text-sm text-blue-700 font-semibold bg-blue-100 px-2 py-1 rounded">
        Pro Tip: Good typography improves readability
      </Text>
    </View>
  );
};
```

### Card with Typography

```typescript
export const CardTypography = () => {
  return (
    <View className="bg-white rounded-lg shadow-md p-6 gap-3">
      {/* Header */}
      <Text className="text-lg font-bold text-slate-900">
        Post Title
      </Text>
      
      {/* Meta information */}
      <Text className="text-sm text-slate-500">
        By John Doe • 5 minutes ago
      </Text>
      
      {/* Divider line */}
      <View className="h-px bg-slate-200" />
      
      {/* Content */}
      <Text className="text-slate-700 leading-relaxed">
        This is the main content. It uses a comfortable font size and
        line height for excellent readability across devices.
      </Text>
      
      {/* Action/Link text */}
      <Text className="text-blue-600 font-semibold text-sm mt-2">
        Read More →
      </Text>
    </View>
  );
};
```

### Tag/Badge Styling

```typescript
export const Tags = () => {
  const tags = ['Design', 'Development', 'Mobile'];
  
  return (
    <View className="flex-row gap-2 flex-wrap">
      {tags.map((tag) => (
        <View
          key={tag}
          className="bg-blue-100 px-3 py-1 rounded-full border border-blue-300"
        >
          <Text className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
            {tag}
          </Text>
        </View>
      ))}
    </View>
  );
};
```

---

## Best Practices

### 1. Contrast and Accessibility

```typescript
// ✅ GOOD: High contrast
<View className="bg-slate-900">
  <Text className="text-white">Good contrast (WCAG AA)</Text>
</View>

// ❌ POOR: Low contrast
<View className="bg-gray-100">
  <Text className="text-gray-300">Bad contrast</Text>
</View>
```

### 2. Consistent Color Usage

```typescript
// ✅ Use color palette consistently
const COLORS = {
  primary: 'bg-blue-500 text-blue-500',
  secondary: 'bg-gray-500 text-gray-500',
  success: 'bg-green-500 text-green-500',
  error: 'bg-red-500 text-red-500',
};

// ❌ Avoid random colors
<View className="bg-[#3498db]" />
<View className="bg-[#2c3e50]" />
<View className="bg-[#27ae60]" />
```

### 3. Readable Text Sizes

```typescript
// ✅ GOOD: Minimum 16px for body text
<Text className="text-base">Body text</Text>
<Text className="text-sm">Secondary text</Text>

// ❌ AVOID: Too small
<Text className="text-xs">Body text (too small)</Text>
```

---

## Related Documentation

- **Styling System:** `03-styling-system.md` - Dynamic styles
- **Dark Mode:** `08-dark-mode.md` - Color scheme switching
- **Best Practices:** `11-best-practices.md` - Production patterns

**Source:** https://www.nativewind.dev/docs
