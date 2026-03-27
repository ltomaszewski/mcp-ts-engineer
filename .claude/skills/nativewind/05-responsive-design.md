# Responsive Design & Platform-Specific Styling - NativeWind v5

**Source:** https://www.nativewind.dev/v5/
**Last Verified:** March 2026
**Version:** NativeWind v5.0.0-preview.3

---

## Table of Contents
1. [Platform Selectors](#platform-selectors)
2. [Responsive Breakpoints](#responsive-breakpoints)
3. [Device Characteristics](#device-characteristics)
4. [Platform-Specific Examples](#platform-specific-examples)

---

## Platform Selectors

Platform selectors allow you to apply styles conditionally based on the runtime platform (iOS, Android, Web).

### Basic Syntax

Use the `platform:utility` syntax directly in className:

```typescript
<View className="ios:bg-red-500 android:bg-blue-500 web:bg-green-500">
  <Text className="ios:text-white android:text-white web:text-black">
    Platform-specific styling
  </Text>
</View>
```

### Supported Platform Selectors

#### iOS Specific

```typescript
// Applies only on iOS
<View className="ios:pt-12" /> {/* Safe area top padding */}
<View className="ios:mb-6" /> {/* iOS-specific margin */}
<Text className="ios:font-system-ui" /> {/* iOS system font */}
```

#### Android Specific

```typescript
// Applies only on Android
<View className="android:pt-4" />
<View className="android:px-6" />
<Text className="android:text-center" />
```

#### Web Specific

```typescript
// Applies only on web (React Native Web)
<View className="web:cursor-pointer" />
<View className="web:hover:bg-gray-100" />
<Text className="web:select-none" />
```

#### Native (iOS + Android)

```typescript
// Applies on both iOS and Android (not web)
<View className="native:p-4 web:p-2" />
{/* 
  - 4px padding on iOS/Android
  - 2px padding on web
*/}
```

### Why Platform Selectors Over Platform.select()

**Platform.select() approach (not recommended):**

```typescript
import { Platform } from 'react-native';
import { View } from 'react-native';

<View
  className={Platform.select({
    ios: 'bg-red-500 text-white',
    android: 'bg-blue-500 text-white',
    web: 'bg-green-500 text-black',
  })}
/>
```

**Problems:**
- Requires importing Platform API
- More verbose syntax
- Can't easily combine with other utilities
- Less readable in JSX

**Platform selector approach (recommended):**

```typescript
<View className="ios:bg-red-500 ios:text-white android:bg-blue-500 android:text-white web:bg-green-500 web:text-black" />
```

**Benefits:**
- Declarative syntax
- No extra imports
- Easily combined with Tailwind utilities
- Better readability
- Works with hover, focus, and other modifiers

### Complex Platform-Specific Examples

#### Safe Area Handling

```typescript
export const SafeHeader = () => {
  return (
    <View className="bg-slate-900 px-4 py-6 ios:pt-12 android:pt-6">
      {/* 
        - 12px top padding on iOS (safe area)
        - 6px top padding on Android
        Default: py-6 (24px) on both
      */}
      <Text className="text-white font-bold text-lg">Header</Text>
    </View>
  );
};
```

#### Font Stack by Platform

```typescript
export const ResponsiveText = () => {
  return (
    <Text className="ios:font-system android:font-sans web:font-serif text-lg">
      Platform-aware typography
    </Text>
  );
};
```

#### Button Styling Variation

```typescript
export const PlatformButton = () => {
  return (
    <Pressable className="ios:px-6 ios:py-3 ios:rounded-lg android:px-4 android:py-2 android:rounded ios:bg-blue-600 android:bg-blue-500 web:hover:bg-blue-700">
      <Text className="ios:text-white android:text-white web:text-blue-600">
        Press Me
      </Text>
    </Pressable>
  );
};
```

#### Navigation Bar Styling

```typescript
export const NavigationBar = () => {
  return (
    <View className="bg-white border-b border-gray-200 ios:pt-2 android:pt-3 pb-3 px-4">
      <View className="flex-row justify-between items-center">
        <Text className="ios:text-lg android:text-base font-bold">
          My App
        </Text>
        
        {/* iOS: show more compact icons */}
        <View className="ios:flex android:hidden flex-row gap-2">
          <Text className="text-gray-600">⚙️</Text>
        </View>
      </View>
    </View>
  );
};
```

---

## Responsive Breakpoints

Responsive design adapts styling based on screen size using breakpoint prefixes.

### Breakpoint System

| Breakpoint | Min Width | Device Type | Use Case |
|-----------|-----------|------------|----------|
| (none) | 0px | Mobile first | Default styles |
| `sm:` | 640px | Small tablets | Phablets, small tablets |
| `md:` | 768px | Medium tablets | iPad mini, small tablets |
| `lg:` | 1024px | Large tablets | iPad, large tablets |
| `xl:` | 1280px | Extra large | iPad Pro, large screens |
| `2xl:` | 1536px | Very large | External monitors |

### Mobile-First Approach

NativeWind follows mobile-first design:

```typescript
// Mobile: small
// tablet (640px+): medium
// Large tablet (1024px+): large

<View className="p-4 sm:p-6 md:p-8 lg:p-12">
  {/*
    Default (mobile): p-4 (16px)
    640px+: p-6 (24px)
    768px+: p-8 (32px)
    1024px+: p-12 (48px)
  */}
</View>
```

### Combining Platform & Responsive

```typescript
<View className="p-4 ios:pt-8 sm:p-6 md:p-8 md:ios:pt-12">
  {/*
    Complex: platform + responsive + nested
    - Base: p-4, ios:pt-8
    - 640px+: p-6
    - 768px+: p-8 and ios:pt-12 (medium tablet iOS)
  */}
</View>
```

### Common Responsive Patterns

#### Layout Shift

```typescript
export const ResponsiveGrid = () => {
  return (
    <View className="gap-4 p-4">
      {/* Mobile: flex-col, Tablet: flex-row */}
      <View className="flex-col md:flex-row gap-4">
        <View className="w-full md:w-1/2 bg-blue-500 h-48 rounded-lg" />
        <View className="w-full md:w-1/2 bg-red-500 h-48 rounded-lg" />
      </View>
    </View>
  );
};
```

#### Text Size Scaling

```typescript
<Text className="text-lg sm:text-xl md:text-2xl lg:text-3xl font-bold">
  {/* 
    Mobile: 18px
    640px+: 20px
    768px+: 24px
    1024px+: 30px
  */}
  Responsive Heading
</Text>
```

#### Spacing Adjustments

```typescript
<View className="px-4 sm:px-6 md:px-8 py-4 sm:py-6 md:py-8">
  {/* Padding scales with screen size */}
</View>
```

---

## Device Characteristics

Beyond screen size, you can style based on other device characteristics.

### Orientation Handling

While NativeWind doesn't have direct orientation selectors, you can use `useWindowDimensions`:

```typescript
import { useWindowDimensions } from 'react-native';

export const OrientationAware = () => {
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  
  return (
    <View className={isLandscape ? 'flex-row' : 'flex-col'}>
      {/* Content adapts to orientation */}
    </View>
  );
};
```

### Dark Mode Support

NativeWind supports system dark mode and manual toggling:

```typescript
import { View, Text } from 'react-native';

export const DarkModeAware = () => {
  return (
    <View className="bg-white dark:bg-slate-900 p-4 rounded-lg">
      <Text className="text-slate-900 dark:text-white">
        Adapts to dark mode
      </Text>
    </View>
  );
};
```

**Cross-Reference:** See `08-dark-mode.md` for dark mode implementation

---

## Platform-Specific Examples

### Complete Responsive Layout

```typescript
import { View, Text, ScrollView } from 'react-native';

export const ProductListing = () => {
  return (
    <ScrollView className="bg-white">
      {/* Header */}
      <View className="bg-slate-900 px-4 py-6 ios:pt-12 android:pt-4">
        <Text className="text-white font-bold text-xl">Products</Text>
      </View>
      
      {/* Grid */}
      <View className="gap-4 p-4">
        <View className="flex-row flex-wrap gap-4 justify-between">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <View
              key={i}
              className="w-[calc(50%-8px)] sm:w-[calc(33.333%-12px)] md:w-[calc(25%-12px)] bg-gray-100 rounded-lg overflow-hidden"
            >
              {/* Product card */}
              <View className="bg-gray-300 h-40" />
              <View className="p-3 ios:p-4">
                <Text className="font-bold text-sm sm:text-base">Product {i}</Text>
                <Text className="text-gray-600 text-xs">$19.99</Text>
              </View>
            </View>
          ))}
        </View>
      </View>
    </ScrollView>
  );
};
```

### Navigation Pattern (Mobile vs Desktop)

```typescript
export const ResponsiveNav = () => {
  return (
    <View className="bg-slate-900 flex-row items-center justify-between px-4 py-3 ios:pt-2">
      {/* Logo */}
      <Text className="text-white font-bold text-lg">Logo</Text>
      
      {/* Desktop Navigation (hidden on small, shown on md+) */}
      <View className="hidden md:flex flex-row gap-8">
        <Text className="text-white">Home</Text>
        <Text className="text-white">About</Text>
        <Text className="text-white">Contact</Text>
      </View>
      
      {/* Mobile Menu Button */}
      <View className="md:hidden">
        <Text className="text-white text-xl">☰</Text>
      </View>
    </View>
  );
};
```

### Form Layout (Single Column Mobile, Two Column Tablet+)

```typescript
export const ContactForm = () => {
  return (
    <View className="bg-white p-4 md:p-8">
      {/* Single field on mobile, two column on tablet+ */}
      <View className="gap-4 flex-col md:flex-row">
        <View className="md:flex-1">
          <Text className="font-bold mb-2">First Name</Text>
          <View className="border border-gray-300 rounded-lg p-3 bg-white">
            <Text>Input field</Text>
          </View>
        </View>
        <View className="md:flex-1">
          <Text className="font-bold mb-2">Last Name</Text>
          <View className="border border-gray-300 rounded-lg p-3 bg-white">
            <Text>Input field</Text>
          </View>
        </View>
      </View>
      
      {/* Full width on all sizes */}
      <View className="mt-4">
        <Text className="font-bold mb-2">Message</Text>
        <View className="border border-gray-300 rounded-lg p-3 bg-white h-40">
          <Text>Textarea</Text>
        </View>
      </View>
    </View>
  );
};
```

---

## Best Practices

### 1. Mobile-First Design

```typescript
// ✅ Good: Start with mobile, enhance with breakpoints
<View className="p-4 md:p-8 lg:p-12" />

// ❌ Avoid: Thinking in desktop-first
// (harder to read and maintain)
```

### 2. Consistent Spacing

```typescript
// ✅ Good: Consistent scale
<View className="p-4 gap-4 md:p-6 md:gap-6" />

// ❌ Avoid: Random values
<View className="p-4 gap-3 md:p-7 md:gap-5" />
```

### 3. Platform and Responsive Together

```typescript
// ✅ Good: Combine when needed
<View className="ios:pt-12 android:pt-4 md:pt-16" />

// Mobile iOS: 12px top
// Mobile Android: 4px top
// Tablet iOS/Android: 16px top
```

---

## Related Documentation

- **Dark Mode:** `08-dark-mode.md` - Color scheme switching
- **Core Concepts:** `02-core-concepts.md` - Architecture
- **Best Practices:** `11-best-practices.md` - Optimization patterns

**Source:** https://www.nativewind.dev/v5/
