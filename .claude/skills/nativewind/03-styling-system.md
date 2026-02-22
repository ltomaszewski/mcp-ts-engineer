# Styling System - NativeWind v4

**Source:** https://www.nativewind.dev/docs  
**Last Verified:** February 2026  
**Version:** NativeWind v4

---

## Table of Contents
1. [className Prop Basics](#classname-prop-basics)
2. [Dynamic Styling](#dynamic-styling)
3. [Conditional Classes](#conditional-classes)
4. [Complex Style Objects](#complex-style-objects)
5. [Style Precedence](#style-precedence)

---

## className Prop Basics

The `className` prop is your primary interface for styling in NativeWind. Every React Native component can accept it.

### Basic Usage

```typescript
import { View, Text } from 'react-native';

export const BasicComponent = () => {
  return (
    <View className="flex-1 items-center justify-center bg-white p-4">
      <Text className="text-2xl font-bold text-slate-900">
        Hello NativeWind
      </Text>
    </View>
  );
};
```

**What Happens:**
1. Build time: `className` string is parsed
2. Tailwind utilities are compiled to `StyleSheet.create()` objects
3. Runtime: Compiled styles are applied to component
4. Zero CSS parsing at runtime

### Commonly Used Utilities

#### Layout (Flexbox)

```typescript
// Direction
<View className="flex-row" /> {/* Horizontal */}
<View className="flex-col" />  {/* Vertical (default) */}

// Flex sizing
<View className="flex-1" />    {/* flex: 1 */}
<View className="flex-none" /> {/* No flex */}

// Alignment
<View className="items-center" />      {/* alignItems: 'center' */}
<View className="items-start" />       {/* alignItems: 'flex-start' */}
<View className="items-end" />         {/* alignItems: 'flex-end' */}
<View className="items-stretch" />     {/* alignItems: 'stretch' */}

// Justification
<View className="justify-center" />    {/* justifyContent: 'center' */}
<View className="justify-between" />   {/* justifyContent: 'space-between' */}
<View className="justify-around" />    {/* justifyContent: 'space-around' */}
<View className="justify-evenly" />    {/* justifyContent: 'space-evenly' */}
```

#### Spacing

```typescript
// Padding
<View className="p-4" />   {/* All sides: 16px */}
<View className="px-4" />  {/* Horizontal: 16px */}
<View className="py-4" />  {/* Vertical: 16px */}
<View className="pt-4" />  {/* Top: 16px */}
<View className="pb-4" />  {/* Bottom: 16px */}
<View className="pl-4" />  {/* Left: 16px */}
<View className="pr-4" />  {/* Right: 16px */}

// Margin
<View className="m-4" />   {/* All sides: 16px */}
<View className="mx-4" />  {/* Horizontal: 16px */}
<View className="my-4" />  {/* Vertical: 16px */}

// Gap (between flex/grid items)
<View className="gap-4" />   {/* All: 16px */}
<View className="gap-x-4" /> {/* Horizontal: 16px */}
<View className="gap-y-4" /> {/* Vertical: 16px */}
```

#### Sizing

```typescript
// Width
<View className="w-1/2" />      {/* width: 50% */}
<View className="w-full" />     {/* width: 100% */}
<View className="w-auto" />     {/* width: auto */}
<View className="w-screen" />   {/* window width */}
<View className="w-[250px]" />  {/* Custom: 250px */}

// Height
<View className="h-1/3" />      {/* height: 33.33% */}
<View className="h-full" />     {/* height: 100% */}
<View className="h-screen" />   {/* window height */}

// Min/Max
<View className="min-w-[100px]" /> {/* minWidth */}
<View className="max-w-lg" />      {/* maxWidth */}
```

#### Colors

```typescript
// Background
<View className="bg-white" />        {/* backgroundColor: white */}
<View className="bg-slate-900" />   {/* backgroundColor: slate-900 */}
<View className="bg-red-500" />     {/* backgroundColor: red-500 */}
<View className="bg-[#3498db]" />   {/* Custom color */}

// Text color
<Text className="text-white" />     {/* color: white */}
<Text className="text-slate-700" /> {/* color: slate-700 */}

// Border color
<View className="border border-gray-300" /> {/* borderColor */}
```

**Cross-Reference:** See `06-color-typography.md` for full color system

#### Typography

```typescript
// Font size
<Text className="text-xs" />   {/* 12px */}
<Text className="text-sm" />   {/* 14px */}
<Text className="text-base" /> {/* 16px */}
<Text className="text-lg" />   {/* 18px */}
<Text className="text-2xl" />  {/* 24px */}

// Font weight
<Text className="font-light" />   {/* 300 */}
<Text className="font-normal" />  {/* 400 */}
<Text className="font-bold" />    {/* 600 */}
<Text className="font-extrabold" /> {/* 800 */}

// Line height
<Text className="leading-tight" />  {/* compact line height */}
<Text className="leading-normal" /> {/* normal line height */}

// Text alignment
<Text className="text-left" />   {/* textAlign: 'left' */}
<Text className="text-center" /> {/* textAlign: 'center' */}
<Text className="text-right" />  {/* textAlign: 'right' */}
```

**Cross-Reference:** See `06-color-typography.md` for typography details

---

## Dynamic Styling

NativeWind supports fully dynamic styles using JavaScript expressions.

### Template Literals

```typescript
import { useState } from 'react';
import { View, Text, Pressable } from 'react-native';

export const DynamicButton = () => {
  const [isPressed, setIsPressed] = useState(false);
  
  return (
    <Pressable
      onPress={() => setIsPressed(!isPressed)}
      className={`px-4 py-2 rounded-lg ${
        isPressed ? 'bg-blue-600' : 'bg-blue-500'
      }`}
    >
      <Text className="text-white font-bold">
        {isPressed ? 'Pressed!' : 'Press me'}
      </Text>
    </Pressable>
  );
};
```

### Helper Functions

```typescript
import { View, Text } from 'react-native';

const getStatusColor = (status: 'active' | 'pending' | 'error') => {
  const colors = {
    active: 'bg-green-500',
    pending: 'bg-yellow-500',
    error: 'bg-red-500',
  };
  return colors[status];
};

export const StatusBadge = ({ status }: { status: 'active' | 'pending' | 'error' }) => {
  return (
    <View className={`px-2 py-1 rounded ${getStatusColor(status)}`}>
      <Text className="text-white text-xs font-bold">
        {status.toUpperCase()}
      </Text>
    </View>
  );
};
```

### Object Spread Pattern

```typescript
interface CardProps {
  variant: 'primary' | 'secondary';
  size: 'sm' | 'lg';
}

export const Card = ({ variant, size }: CardProps) => {
  const baseClasses = 'rounded-lg border p-4';
  
  const variantClasses = {
    primary: 'bg-blue-50 border-blue-200',
    secondary: 'bg-gray-50 border-gray-200',
  };
  
  const sizeClasses = {
    sm: 'p-2',
    lg: 'p-8',
  };
  
  return (
    <View className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]}`}>
      {/* Content */}
    </View>
  );
};
```

### Clsx/Classnames (Recommended)

While not required, using `clsx` is a best practice:

```bash
npm install clsx
```

```typescript
import clsx from 'clsx';
import { View, Text } from 'react-native';

export const Button = ({
  variant = 'primary',
  size = 'md',
  disabled = false,
}: {
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
}) => {
  return (
    <Pressable
      disabled={disabled}
      className={clsx(
        'rounded-lg font-bold',
        {
          'bg-blue-500 text-white': variant === 'primary',
          'bg-gray-200 text-gray-700': variant === 'secondary',
          'px-2 py-1 text-sm': size === 'sm',
          'px-4 py-2 text-base': size === 'md',
          'px-6 py-3 text-lg': size === 'lg',
          'opacity-50': disabled,
        }
      )}
    >
      <Text>Click me</Text>
    </Pressable>
  );
};
```

**Benefits of clsx:**
- Cleaner syntax
- Better readability
- Easier maintenance
- Handles edge cases

---

## Conditional Classes

### If/Else Statements

```typescript
import { View, Text } from 'react-native';

export const WelcomeMessage = ({ isLoggedIn }: { isLoggedIn: boolean }) => {
  let className: string;
  
  if (isLoggedIn) {
    className = 'text-green-600 font-bold text-lg';
  } else {
    className = 'text-gray-600 font-normal text-base';
  }
  
  return (
    <Text className={className}>
      {isLoggedIn ? 'Welcome back!' : 'Please log in'}
    </Text>
  );
};
```

### Ternary Operators

```typescript
<View className={isActive ? 'bg-blue-500' : 'bg-gray-300'} />

{/* Multiple conditions */}
<View
  className={
    isActive && isSelected
      ? 'bg-blue-500 border-blue-700'
      : 'bg-gray-300 border-gray-400'
  }
/>
```

### Logical AND (&& operator)

```typescript
<View className={isVisible && 'flex-1 p-4'} />

{/* Evaluates to: isVisible ? 'flex-1 p-4' : '' */}
```

### Multiple Conditions with Clsx

```typescript
import clsx from 'clsx';

<View
  className={clsx([
    'p-4 rounded-lg',
    isActive && 'bg-blue-500 text-white',
    isHovered && 'shadow-lg',
    isDisabled && 'opacity-50 cursor-not-allowed',
  ])}
/>
```

---

## Complex Style Objects

While NativeWind handles most styling via className, you can combine with style prop for advanced cases.

### Mixing className and style

```typescript
import { View, Text } from 'react-native';

export const MixedStyling = ({ size }: { size: number }) => {
  return (
    <View
      className="p-4 rounded-lg bg-blue-500"
      style={{
        width: size * 10, // Dynamic calculation
        opacity: 0.8,
      }}
    >
      <Text className="text-white font-bold">Dynamic Size</Text>
    </View>
  );
};
```

### Dynamic Transform

```typescript
import { Animated } from 'react-native';

export const ScaleAnimation = ({ scale }: { scale: Animated.Value }) => {
  return (
    <Animated.View
      className="bg-blue-500 w-20 h-20 rounded-lg"
      style={{
        transform: [{ scale }], // Can't be done in className
      }}
    />
  );
};
```

### CSS Variables with var()

```typescript
export const DynamicTheme = ({
  primaryColor,
}: {
  primaryColor: string;
}) => {
  return (
    <View
      style={{
        '--primary-color': primaryColor,
      } as any}
      className="bg-[var(--primary-color)] p-4 rounded-lg"
    >
      <Text>Dynamic colored box</Text>
    </View>
  );
};
```

**Cross-Reference:** See `09-custom-values.md` for CSS variables

---

## Style Precedence

Understanding specificity and precedence is important for debugging.

### Specificity Order (Lowest to Highest)

1. **Default styles** - Base component styling
2. **className utilities** - Tailwind utilities
3. **Inline style prop** - Overrides everything
4. **Pseudo-classes** - (hover, active, focus, etc)
5. **Responsive variants** - (sm:, md:, lg:, etc)

### Example: Precedence in Action

```typescript
import { View, Pressable } from 'react-native';

export const PrecedenceExample = () => {
  return (
    <Pressable
      // 1. Base styles
      // 2. className utilities (applied first)
      className="bg-blue-500 text-white p-4 rounded-lg active:bg-blue-700"
      // 3. style prop (overrides className)
      style={{
        backgroundColor: 'rgb(100, 150, 200)', // This wins!
      }}
    >
      {/* Result: RGB color, not Tailwind blue, but active:bg-blue-700 still works */}
    </Pressable>
  );
};
```

### Best Practice: Avoid Conflicts

```typescript
// ❌ Confusing and hard to maintain
<View
  className="bg-red-500"
  style={{ backgroundColor: 'blue' }} {/* Conflicts! */}
/>

// ✅ Clear and maintainable
<View className={isError ? 'bg-red-500' : 'bg-blue-500'} />
```

---

## Style Composition Patterns

### Component Composition

```typescript
import { View, ViewProps } from 'react-native';

// Base container
const Container = ({ className = '', ...props }: ViewProps & { className?: string }) => (
  <View className={`flex-1 p-4 ${className}`} {...props} />
);

// Specialized card
const Card = ({ className = '', ...props }: ViewProps & { className?: string }) => (
  <Container className={`bg-white rounded-lg shadow-sm ${className}`} {...props} />
);

// Usage
export const App = () => (
  <Card className="m-4">
    {/* Content */}
  </Card>
);
```

### Custom Hook Pattern

```typescript
const useButtonStyles = (variant: 'primary' | 'secondary') => {
  const baseStyles = 'px-4 py-2 rounded-lg font-bold';
  
  const variantStyles = {
    primary: 'bg-blue-500 text-white',
    secondary: 'bg-gray-200 text-gray-900',
  };
  
  return `${baseStyles} ${variantStyles[variant]}`;
};

export const Button = ({ variant = 'primary' }) => {
  const styles = useButtonStyles(variant);
  return <Pressable className={styles}><Text>Button</Text></Pressable>;
};
```

---

## Related Documentation

- **Responsive Design:** `05-responsive-design.md` - Breakpoints and media queries
- **Pseudo Classes:** `07-pseudo-classes.md` - Interactive states
- **Dark Mode:** `08-dark-mode.md` - Theme switching
- **Custom Values:** `09-custom-values.md` - CSS variables and arbitrary values
- **Best Practices:** `11-best-practices.md` - Production patterns

---

## Summary

- **className is primary:** Use it for 99% of styling
- **Dynamic values work seamlessly:** Template literals, functions, clsx library
- **Combine with style when needed:** For dynamic calculations or transforms
- **Avoid conflicts:** Choose one approach per property
- **Use composition:** Extract common patterns into components/hooks

**Source:** https://www.nativewind.dev/docs
