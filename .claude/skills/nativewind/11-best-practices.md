# Best Practices & Production Patterns - NativeWind v4

**Source:** https://www.nativewind.dev/docs  
**Last Verified:** October 14, 2025  
**Version:** NativeWind v4

---

## Table of Contents
1. [Performance Optimization](#performance-optimization)
2. [Code Organization](#code-organization)
3. [Common Pitfalls](#common-pitfalls)
4. [Debugging Styling Issues](#debugging-styling-issues)
5. [Security Considerations](#security-considerations)
6. [Accessibility Best Practices](#accessibility-best-practices)

---

## Performance Optimization

NativeWind is designed for high performance, but following these patterns ensures optimal results.

### 1. Static Classes Over Dynamic

**Performance Impact:** Build-time styles = Zero runtime overhead

```typescript
// ✅ GOOD: Static classes (compiled at build time)
<View className="bg-blue-500 p-4 rounded-lg" />

// ⚠️ ACCEPTABLE: Simple ternary (still efficient)
<View className={isActive ? "bg-blue-500" : "bg-gray-300"} />

// ❌ AVOID: Complex computed strings
<View className={
  `${condition1 ? "p-4" : "p-2"} 
   ${condition2 ? "bg-red-500" : "bg-blue-500"}
   ${condition3 ? "text-white" : "text-black"}`.trim()
} />
```

### 2. Memoization for Re-render Prevention

```typescript
import { memo } from 'react';
import { View, Text } from 'react-native';

// Memoize components that rarely change
const Card = memo(({ title }: { title: string }) => {
  return (
    <View className="bg-white p-4 rounded-lg shadow-sm">
      <Text className="text-lg font-bold">{title}</Text>
    </View>
  );
});

// Prevent unnecessary re-renders
export const CardList = ({ cards }: { cards: Array<{id: string; title: string}> }) => {
  return (
    <View className="gap-4 p-4">
      {cards.map((card) => (
        <Card key={card.id} title={card.title} />
      ))}
    </View>
  );
};
```

### 3. Extract Style Objects

Move style calculations outside render function:

```typescript
// ❌ AVOID: Recalculates on every render
const BadComponent = ({ size }: { size: number }) => {
  return (
    <View style={{ width: size * 10, height: size * 10 }}>
      Content
    </View>
  );
};

// ✅ GOOD: Calculate once, reuse
const GoodComponent = ({ size }: { size: number }) => {
  const dimensions = {
    width: size * 10,
    height: size * 10,
  };
  return (
    <View style={dimensions}>
      Content
    </View>
  );
};

// ✅ BETTER: Use useMemo for complex calculations
import { useMemo } from 'react';

const BestComponent = ({ size }: { size: number }) => {
  const dimensions = useMemo(
    () => ({
      width: size * 10,
      height: size * 10,
    }),
    [size]
  );
  return (
    <View style={dimensions}>
      Content
    </View>
  );
};
```

### 4. Optimize Content Scanning

Tailwind scans files to find used classes. Optimize your content paths:

```javascript
// tailwind.config.js

module.exports = {
  // ✅ GOOD: Specific paths
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  
  // ❌ AVOID: Overly broad patterns
  content: [
    './**/*.{js,jsx,ts,tsx}', // Scans everything!
  ],
  
  // ⚠️ Consider: Safelist for dynamic classes
  safelist: [
    { pattern: /w-(1\/2|1\/3|1\/4)/ },
    { pattern: /bg-(red|blue|green)-[0-9]+/ },
  ],
};
```

### 5. Lazy Loading and Code Splitting

```typescript
import { lazy, Suspense } from 'react';
import { View, ActivityIndicator } from 'react-native';

// Lazy load heavy components
const HeavyComponent = lazy(() => import('./HeavyComponent'));

export const App = () => {
  return (
    <View className="flex-1">
      <Suspense fallback={<ActivityIndicator size="large" />}>
        <HeavyComponent />
      </Suspense>
    </View>
  );
};
```

---

## Code Organization

### 1. Component Composition Pattern

```typescript
// ✅ GOOD: Composable, reusable components

// Base components
const Container = ({ className = '', children }: any) => (
  <View className={`p-4 ${className}`}>{children}</View>
);

const Card = ({ className = '', children }: any) => (
  <Container className={`bg-white rounded-lg shadow-sm ${className}`}>
    {children}
  </Container>
);

// Specialized components
const PrimaryCard = ({ className = '', children }: any) => (
  <Card className={`bg-blue-50 border border-blue-200 ${className}`}>
    {children}
  </Card>
);

// Usage - clean and semantic
export const App = () => (
  <PrimaryCard>
    <Text>Semantic, reusable component</Text>
  </PrimaryCard>
);
```

### 2. Custom Hook Pattern

```typescript
import { useState, useCallback } from 'react';

// Extract styling logic into hooks
const useButtonVariant = (variant: 'primary' | 'secondary' = 'primary') => {
  const baseClasses = 'px-4 py-2 rounded-lg font-bold transition';
  
  const variants = {
    primary: 'bg-blue-600 text-white active:bg-blue-700',
    secondary: 'bg-gray-200 text-gray-900 active:bg-gray-300',
  };
  
  return `${baseClasses} ${variants[variant]}`;
};

// Usage
const Button = ({ variant = 'primary', onPress }: any) => {
  const className = useButtonVariant(variant);
  return (
    <Pressable className={className} onPress={onPress}>
      <Text>Click me</Text>
    </Pressable>
  );
};
```

### 3. Constants File for Repeated Styles

```typescript
// styles/constants.ts
export const LAYOUT = {
  container: 'flex-1 p-4',
  contentArea: 'flex-1 gap-4',
  padding: {
    xs: 'p-2',
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8',
  },
  gap: {
    xs: 'gap-2',
    sm: 'gap-4',
    md: 'gap-6',
  },
};

export const COLORS = {
  text: 'text-slate-900 dark:text-white',
  border: 'border-gray-300 dark:border-gray-700',
  shadow: 'shadow-sm dark:shadow-lg',
};

// Usage
<View className={`${LAYOUT.container} ${COLORS.shadow}`}>
  Content
</View>
```

---

## Common Pitfalls

### 1. Missing Content Paths

**Problem:** Classes don't appear in built app

```javascript
// ❌ BAD: Missing pattern
module.exports = {
  content: [
    './app/**/*.js',  // Missing .tsx, .ts
  ],
};

// ✅ GOOD: Complete pattern
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
  ],
};
```

### 2. Dynamic Class Names

**Problem:** Runtime-generated classes aren't in content files

```typescript
// ❌ BAD: Dynamic class (not found by Tailwind scanner)
const colorClass = `bg-${color}-500`;
<View className={colorClass} />

// ✅ GOOD: Predefined classes
const colorMap = {
  red: 'bg-red-500',
  blue: 'bg-blue-500',
  green: 'bg-green-500',
};
<View className={colorMap[color]} />

// Or use safelist
// tailwind.config.js
safelist: [
  { pattern: /bg-(red|blue|green)-500/ },
]
```

### 3. Mixing Style and className

**Problem:** Conflicting styles cause confusion

```typescript
// ❌ CONFUSING: Same property in both
<View
  className="bg-red-500"
  style={{ backgroundColor: 'blue' }} {/* Wins! */}
/>

// ✅ CLEAR: One approach per property
<View className={isError ? 'bg-red-500' : 'bg-blue-500'} />
```

### 4. Over-nesting

**Problem:** Overly complex className strings

```typescript
// ❌ BAD: Hard to read
<View className={`flex-1 flex-row items-center justify-between gap-4 px-4 py-2 rounded-lg ${isActive ? 'bg-blue-500 text-white shadow-lg' : 'bg-gray-200 text-gray-900'}`} />

// ✅ GOOD: Extract or use variables
const className = clsx(
  'flex-1 flex-row items-center justify-between gap-4 px-4 py-2 rounded-lg',
  {
    'bg-blue-500 text-white shadow-lg': isActive,
    'bg-gray-200 text-gray-900': !isActive,
  }
);
<View className={className} />
```

### 5. Incorrect breakpoint usage

**Problem:** Using desktop-first instead of mobile-first

```typescript
// ❌ CONFUSING: Desktop-first
<View className="md:p-4 p-8">
  {/* 
    Desktop: p-4 (overrides p-8)
    Mobile: p-8
    This is backwards!
  */}
</View>

// ✅ CORRECT: Mobile-first
<View className="p-4 md:p-8">
  {/*
    Mobile: p-4 (start here)
    Tablet+: p-8 (enhance)
  */}
</View>
```

### 6. TextInput Text Clipping on iOS (CRITICAL)

**Problem:** Text descenders (bottom of g, y, p, q, j) get clipped on iOS

```typescript
// ❌ BAD: Causes text clipping on iOS
<TextInput className="text-lg text-white" />
<TextInput className="text-base text-gray-900" />

// ✅ GOOD: Use style prop for fontSize
<TextInput
  className="text-white font-gotham"
  style={{ fontSize: 18 }}  // No lineHeight = no clipping
/>
```

**Why this happens:**
- NativeWind's `text-*` classes set BOTH `fontSize` AND `lineHeight`
- When `lineHeight` is explicitly set, iOS clips descenders
- Using `style={{ fontSize: X }}` lets iOS calculate optimal lineHeight

**Complete pattern:**

```typescript
// Android-specific props
const androidProps =
  Platform.OS === 'android'
    ? {
        textAlignVertical: 'center' as const,
        includeFontPadding: false,
      }
    : {};

<TextInput
  className="text-white font-gotham py-1.5"
  style={{ fontSize: 18 }}  // ✅ fontSize only, no lineHeight
  {...androidProps}
/>
```

**Test string:** `"gyp jpq yqg"` - if bottom of letters is cut off, you have this issue.

**See also:** `docs/knowledge-base/react-native/11-ios-text-clipping.md`

---

## Debugging Styling Issues

### 1. Styles Not Appearing

**Checklist:**

- [ ] Is the file in `tailwind.config.js` content paths?
- [ ] Did you save the file?
- [ ] Did you import global.css at app root?
- [ ] Is Babel preset configured?
- [ ] Is Metro config wrapped with withNativewind?
- [ ] Try: `npm start -- --reset-cache`

### 2. Class Name Shows But No Styling

```typescript
// Debug: Check if class is recognized
import { useColorScheme } from 'nativewind';

export const Debug = () => {
  const { value } = useColorScheme();
  
  return (
    <View className="bg-blue-500 dark:bg-red-500">
      {/* If not colored, Tailwind didn't process the file */}
      <Text>Color scheme: {value}</Text>
    </View>
  );
};
```

### 3. Unexpected Style Application

```typescript
// Check specificity/precedence
<View
  className="p-4"           // Applied
  style={{ padding: 100 }}  // Overrides className
  // Result: padding 100, not 16px
/>

// Solution: Don't conflict
<View className={isLarge ? 'p-8' : 'p-4'} />
```

### 4. Platform Selector Not Working

```typescript
// ❌ WRONG: Syntax error
<View className="ios::pt-4" /> {/* Double colon */}
<View className="ios-pt-4" /> {/* Dash instead of colon */}

// ✅ CORRECT: Proper syntax
<View className="ios:pt-4" />
```

### 5. Media Query Not Triggering

```typescript
// Check breakpoint values in tailwind.config.js
<View className="p-4 sm:p-6">
  {/* 
    Issue: On device where width < 640px, sm: doesn't apply
    Remember: sm = 640px minimum
    
    Check device width:
    Width: 350px → Uses p-4
    Width: 640px+ → Uses sm:p-6
  */}
</View>
```

---

## Security Considerations

### 1. Avoid Injecting User Input

```typescript
// ❌ DANGEROUS: User input in className
const userInput = props.className; // Could be malicious
<View className={userInput} />

// ✅ SAFE: Whitelist approach
const allowedClasses = {
  small: 'p-2',
  medium: 'p-4',
  large: 'p-6',
};
<View className={allowedClasses[userInput] || 'p-4'} />
```

### 2. Sanitize Dynamic Values

```typescript
// ❌ RISKY: Arbitrary color values
<View style={{ backgroundColor: userProvidedColor }} />

// ✅ SAFE: Predefined color palette
const colors = {
  red: '#ff0000',
  blue: '#0000ff',
  // ...
};
<View style={{ backgroundColor: colors[userColor] || colors.red }} />
```

### 3. Content Security Policy

For web-based React Native apps, ensure CSS is properly scoped.

---

## Accessibility Best Practices

### 1. Color Contrast

```typescript
// ✅ GOOD: Sufficient contrast
<View className="bg-slate-900">
  <Text className="text-white">High contrast (WCAG AA)</Text>
</View>

// ❌ POOR: Insufficient contrast
<View className="bg-gray-100">
  <Text className="text-gray-300">Low contrast (fails)</Text>
</View>
```

### 2. Focus States

```typescript
// ✅ GOOD: Clear focus indicator
<Pressable className="rounded-lg active:bg-blue-700 active:scale-95">
  <Text>Button with active state</Text>
</Pressable>

// For web: use focus:outline
<Pressable className="web:focus:outline web:focus:outline-2 web:focus:outline-blue-500">
  <Text>Focusable button</Text>
</Pressable>
```

### 3. Text Sizing

```typescript
// ✅ GOOD: Readable text
<Text className="text-base">Minimum 14px recommended</Text>
<Text className="text-sm">Secondary info</Text>

// ❌ POOR: Too small
<Text className="text-xs">Captions only</Text>
```

### 4. Alternative Content for Icons

```typescript
// ✅ GOOD: Descriptive text
<Pressable className="p-2">
  <Text className="text-xl">♥</Text>
  <Text className="text-xs">Like</Text>
</Pressable>

// On web, use aria attributes
<Pressable className="web:aria-label='Like this post'">
  <Text>♥</Text>
</Pressable>
```

---

## Production Checklist

Before shipping to production:

- [ ] All styles load correctly on all platforms
- [ ] Dark mode works and persists user preference
- [ ] Responsive design tested on various screen sizes
- [ ] Platform-specific styles work (ios:/android:/web:)
- [ ] Performance is acceptable (no jank, smooth scrolling)
- [ ] Accessibility standards met (contrast, focus states)
- [ ] No console warnings or errors
- [ ] Bundle size is optimized
- [ ] Styles work with code splitting and lazy loading
- [ ] Team follows consistent patterns

---

## Related Documentation

- **Core Concepts:** `02-core-concepts.md` - Architecture
- **Dark Mode:** `08-dark-mode.md` - Theme implementation
- **Custom Values:** `09-custom-values.md` - Dynamic theming

**Source:** https://www.nativewind.dev/docs
