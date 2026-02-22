# Layout Utilities & Responsive Design - NativeWind v4

**Source:** https://www.nativewind.dev/docs  
**Last Verified:** February 2026  
**Version:** NativeWind v4

---

## Table of Contents
1. [Flexbox Fundamentals](#flexbox-fundamentals)
2. [Grid Layouts](#grid-layouts)
3. [Media Queries](#media-queries)
4. [Container Queries](#container-queries)
5. [Responsive Examples](#responsive-examples)

---

## Flexbox Fundamentals

Flexbox is the primary layout model in React Native. NativeWind provides utilities for all Flexbox properties.

### Direction

Controls the direction of flex items (main axis):

```typescript
// Column (default, vertical stacking)
<View className="flex-col">
  <View className="bg-red-500">Item 1</View>
  <View className="bg-blue-500">Item 2</View>
</View>

// Row (horizontal stacking)
<View className="flex-row">
  <View className="bg-red-500">Item 1</View>
  <View className="bg-blue-500">Item 2</View>
</View>

// Row reverse
<View className="flex-row-reverse">
  <View>Item 1</View> {/* Appears last */}
  <View>Item 2</View> {/* Appears first */}
</View>

// Column reverse
<View className="flex-col-reverse">
  <View>Item 1</View> {/* Appears below */}
  <View>Item 2</View> {/* Appears above */}
</View>
```

### Flex Sizing

Controls how items grow/shrink within available space:

```typescript
// Flex: 1 (grows to fill space equally)
<View className="flex-1 bg-red-500" />
<View className="flex-1 bg-blue-500" /> {/* Same size */}

// Flex: none (doesn't grow)
<View className="flex-none w-20 bg-red-500" />

// Different flex ratios
<View className="flex-row gap-4">
  <View className="flex-1 bg-red-500" />   {/* 1/3 of space */}
  <View className="flex-2 bg-blue-500" />  {/* 2/3 of space */}
</View>
```

### Main Axis Alignment (justify-content)

Controls alignment along the main axis (direction):

```typescript
// Center items along main axis
<View className="flex-row justify-center">
  {/* Items centered horizontally */}
</View>

// Distribute evenly with space between
<View className="flex-row justify-between">
  <Item />
  <Item />
  <Item />
</View>

// Distribute with equal spacing around
<View className="flex-row justify-around">
  <Item /> <Item /> <Item />
</View>

// Distribute with equal spacing between
<View className="flex-row justify-evenly">
  <Item /> <Item /> <Item />
</View>

// Align to start (flex-start)
<View className="flex-row justify-start" />

// Align to end (flex-end)
<View className="flex-row justify-end" />
```

### Cross Axis Alignment (items-*)

Controls alignment perpendicular to main axis:

```typescript
// Center items on cross axis
<View className="flex-row items-center h-20">
  <Text>Centered vertically</Text>
</View>

// Stretch to fill cross axis
<View className="flex-row items-stretch h-20">
  <View className="bg-red-500 flex-1" /> {/* Stretches to h-20 */}
</View>

// Align to start (flex-start)
<View className="flex-row items-start h-20" />

// Align to end (flex-end)
<View className="flex-row items-end h-20" />

// Baseline alignment (for text)
<View className="flex-row items-baseline" />
```

### Flexbox Layout Examples

#### Centered Box

```typescript
import { View, Text } from 'react-native';

export const CenteredBox = () => {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <View className="bg-blue-500 p-8 rounded-lg">
        <Text className="text-white font-bold text-lg">Centered</Text>
      </View>
    </View>
  );
};
```

#### Header + Content + Footer

```typescript
export const PageLayout = () => {
  return (
    <View className="flex-1 flex-col bg-white">
      {/* Header */}
      <View className="bg-slate-900 px-4 py-6 ios:pt-12">
        <Text className="text-white font-bold text-xl">My App</Text>
      </View>
      
      {/* Content (grows) */}
      <View className="flex-1 p-4">
        <Text>Main content here</Text>
      </View>
      
      {/* Footer */}
      <View className="bg-slate-100 p-4 border-t border-slate-300">
        <Text className="text-center text-slate-600">© 2025</Text>
      </View>
    </View>
  );
};
```

#### Two-Column Layout

```typescript
export const TwoColumn = () => {
  return (
    <View className="flex-1 flex-row gap-4 p-4">
      {/* Sidebar */}
      <View className="w-1/4 bg-slate-100 rounded-lg p-4">
        <Text className="font-bold mb-4">Navigation</Text>
      </View>
      
      {/* Main content */}
      <View className="flex-1 bg-white rounded-lg p-4">
        <Text>Main content</Text>
      </View>
    </View>
  );
};
```

---

## Grid Layouts

While React Native doesn't have built-in grid, you can create grid-like layouts with flexbox.

### Simple Grid

```typescript
export const SimpleGrid = () => {
  const items = Array.from({ length: 9 }, (_, i) => i + 1);
  
  return (
    <View className="flex-row flex-wrap gap-4 p-4">
      {items.map((item) => (
        <View
          key={item}
          className="w-[calc(33.333%-12px)] aspect-square bg-blue-500 rounded-lg items-center justify-center"
        >
          <Text className="text-white font-bold">{item}</Text>
        </View>
      ))}
    </View>
  );
};
```

### Responsive Grid (2 columns on mobile, 3 on tablet)

```typescript
import { useWindowDimensions } from 'react-native';

export const ResponsiveGrid = () => {
  const { width } = useWindowDimensions();
  const cols = width > 768 ? 3 : 2;
  const gap = 16;
  const itemWidth = (width - 32 - gap * (cols - 1)) / cols;
  
  return (
    <View className="flex-row flex-wrap gap-4 p-4">
      {Array.from({ length: 12 }, (_, i) => (
        <View
          key={i}
          style={{ width: itemWidth }}
          className="aspect-square bg-blue-500 rounded-lg"
        />
      ))}
    </View>
  );
};
```

---

## Media Queries

Media queries allow you to apply styles based on viewport/device characteristics.

### Breakpoints

| Prefix | Min Width | Use Case |
|--------|-----------|----------|
| (none) | - | Mobile first (always applied) |
| `sm:` | 640px | Small tablets |
| `md:` | 768px | Tablets |
| `lg:` | 1024px | Large tablets / iPads |
| `xl:` | 1280px | Extra large screens |
| `2xl:` | 1536px | Very large screens |

### Basic Media Query Syntax

```typescript
// Mobile first approach
<View className="w-full sm:w-1/2 md:w-1/3">
  {/* 
    Full width on mobile
    50% on tablets (sm: 640px)
    33% on larger tablets (md: 768px)
  */}
</View>
```

### Responsive Layouts

#### Single Column to Two Column

```typescript
export const ResponsiveCard = () => {
  return (
    <View className="flex-col md:flex-row gap-6 p-4">
      {/* Image: full width on mobile, 50% on tablet+ */}
      <View className="w-full md:w-1/2 bg-gray-300 h-48 rounded-lg" />
      
      {/* Content: full width on mobile, 50% on tablet+ */}
      <View className="w-full md:w-1/2 justify-center">
        <Text className="text-2xl font-bold mb-2">Title</Text>
        <Text className="text-gray-600">Description text here</Text>
      </View>
    </View>
  );
};
```

#### Grid to List

```typescript
export const AdaptiveGrid = () => {
  return (
    <View className="gap-4 p-4">
      {/* Mobile: 1 column, Tablet: 2 columns, Desktop: 3 columns */}
      <View className="flex-row flex-wrap gap-4">
        {Array.from({ length: 6 }, (_, i) => (
          <View
            key={i}
            className="w-full sm:w-1/2 md:w-1/3 bg-blue-500 h-32 rounded-lg"
          />
        ))}
      </View>
    </View>
  );
};
```

#### Navigation Responsive

```typescript
export const ResponsiveNav = () => {
  return (
    <View className="bg-slate-900 px-4 py-3 flex-row items-center justify-between">
      <Text className="text-white font-bold text-lg">Logo</Text>
      
      {/* Hidden on mobile, shown on tablet+ */}
      <View className="hidden md:flex flex-row gap-6">
        <Text className="text-white">Home</Text>
        <Text className="text-white">About</Text>
        <Text className="text-white">Contact</Text>
      </View>
      
      {/* Hamburger menu (shown on mobile, hidden on tablet+) */}
      <Pressable className="md:hidden">
        <Text className="text-white text-xl">☰</Text>
      </Pressable>
    </View>
  );
};
```

---

## Container Queries

Container queries style elements based on their **container's** size, not the viewport.

### Container Query Basics

```typescript
// Mark as container
<View className="@container p-4 gap-4">
  {/* Children respond to this container's size */}
  
  // Single column on small container
  // Multi-column on large container
  <View className="flex-col @md:flex-row gap-4">
    <View className="@md:flex-1">Left</View>
    <View className="@md:flex-1">Right</View>
  </View>
</View>
```

### Container Query Breakpoints

| Prefix | Min Width | Notes |
|--------|-----------|-------|
| `@sm:` | 384px | Small containers |
| `@md:` | 448px | Medium containers |
| `@lg:` | 512px | Large containers |
| `@xl:` | 576px | Extra large |
| `@2xl:` | 672px | 2XL containers |

### Practical Container Query Example

```typescript
export const Card = ({ title, description }: any) => {
  return (
    // Mark as container
    <View className="@container bg-white rounded-lg p-4 shadow-sm">
      {/* On small containers: column layout */}
      {/* On large containers: row layout */}
      <View className="gap-4 @md:flex-row @md:gap-6">
        {/* Image */}
        <View className="w-full @md:w-32 h-32 bg-gray-300 rounded-lg flex-shrink-0" />
        
        {/* Content */}
        <View className="flex-1 justify-center">
          <Text className="text-lg font-bold mb-1">{title}</Text>
          <Text className="text-gray-600 text-sm">{description}</Text>
        </View>
      </View>
    </View>
  );
};

// Usage
export const CardGrid = () => {
  return (
    <View className="flex-row flex-wrap gap-4 p-4">
      {/* Narrow: card shows column layout */}
      <View className="w-full sm:w-1/2">
        <Card title="Card 1" description="Description 1" />
      </View>
      
      {/* Wide: card shows row layout */}
      <View className="w-full sm:w-1/2">
        <Card title="Card 2" description="Description 2" />
      </View>
    </View>
  );
};
```

---

## Responsive Examples

### Complete Product Card

```typescript
import { View, Text, Pressable, Image } from 'react-native';

export const ProductCard = () => {
  return (
    <View className="flex-col md:flex-row gap-6 bg-white rounded-lg p-6 shadow-md">
      {/* Product Image */}
      <View className="w-full md:w-48 h-48 bg-gray-300 rounded-lg overflow-hidden">
        <Image
          source={{ uri: 'https://via.placeholder.com/300' }}
          className="w-full h-full"
        />
      </View>
      
      {/* Product Info */}
      <View className="flex-1 justify-between">
        <View className="gap-2">
          <Text className="text-xs text-gray-500 uppercase tracking-wide">
            ELECTRONICS
          </Text>
          <Text className="text-2xl md:text-3xl font-bold text-slate-900">
            Wireless Headphones
          </Text>
          <Text className="text-lg text-gray-700 line-clamp-2">
            Premium noise-canceling headphones with 30-hour battery life
          </Text>
        </View>
        
        {/* Rating and Price */}
        <View className="gap-4 mt-4">
          <View className="flex-row items-center gap-2">
            <Text className="text-yellow-500">★★★★★</Text>
            <Text className="text-sm text-gray-600">(342 reviews)</Text>
          </View>
          
          <View className="flex-row items-baseline gap-2">
            <Text className="text-3xl font-bold text-slate-900">$299</Text>
            <Text className="text-lg line-through text-gray-400">$399</Text>
          </View>
        </View>
        
        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-6">
          <Pressable className="flex-1 bg-blue-600 rounded-lg py-3 items-center">
            <Text className="text-white font-bold">Add to Cart</Text>
          </Pressable>
          <Pressable className="px-4 py-3 border border-blue-600 rounded-lg items-center">
            <Text className="text-blue-600">♥</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
};
```

---

## Gap Utilities

Gap controls spacing between flex/grid children without margins.

### Gap Reference

| Class | Property | Value |
|-------|----------|-------|
| `gap-0` | gap | 0 |
| `gap-1` | gap | 4px (0.25rem) |
| `gap-2` | gap | 8px (0.5rem) |
| `gap-4` | gap | 16px (1rem) |
| `gap-6` | gap | 24px (1.5rem) |
| `gap-8` | gap | 32px (2rem) |
| `gap-x-4` | columnGap | 16px |
| `gap-y-4` | rowGap | 16px |
| `gap-[13px]` | gap | 13px (arbitrary) |

```typescript
<View className="flex-row flex-wrap gap-4">
  <View className="w-20 h-20 bg-blue-500 rounded" />
  <View className="w-20 h-20 bg-blue-500 rounded" />
  <View className="w-20 h-20 bg-blue-500 rounded" />
</View>
```

**Note:** In NativeWind v4, `gap` compiles to native `columnGap` and `rowGap` styles. The previous `space-*` utilities were temporarily removed in v4 -- use `gap-*` instead.

**Source:** https://www.nativewind.dev/docs/tailwind/flexbox/gap

---

## Aspect Ratio

Control the aspect ratio of elements.

### Aspect Ratio Classes

| Class | Value |
|-------|-------|
| `aspect-auto` | auto |
| `aspect-square` | 1 / 1 |
| `aspect-video` | 16 / 9 |
| `aspect-[3/2]` | 3 / 2 (arbitrary) |

```typescript
// Square image container
<View className="w-full aspect-square bg-gray-300 rounded-lg overflow-hidden">
  <Image source={{ uri: imageUrl }} className="w-full h-full" />
</View>

// Video player container
<View className="w-full aspect-video bg-black rounded-lg" />

// Custom ratio
<View className="w-full aspect-[4/3] bg-gray-200 rounded-lg" />
```

**Source:** https://www.nativewind.dev/docs/tailwind/layout/aspect-ratio

---

## Related Documentation

- **Core Concepts:** `02-core-concepts.md` - Understand architecture
- **Styling System:** `03-styling-system.md` - className usage
- **Safe Area:** `10-advanced-features.md` - Safe area utilities
- **Best Practices:** `11-best-practices.md` - Optimization patterns

**Source:** https://www.nativewind.dev/docs
