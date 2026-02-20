# Pseudo-Classes & Interactive States - NativeWind v4

**Source:** https://www.nativewind.dev/docs/core-concepts/pseudo-classes  
**Last Verified:** October 14, 2025  
**Version:** NativeWind v4

---

## Table of Contents
1. [Pseudo-Class Overview](#pseudo-class-overview)
2. [Individual Pseudo-Classes](#individual-pseudo-classes)
3. [Parent State Styles](#parent-state-styles)
4. [Practical Examples](#practical-examples)

---

## Pseudo-Class Overview

Pseudo-classes in NativeWind allow you to style interactive states without manual state management. They work on compatible components like `Pressable`, `TextInput`, and `TouchableOpacity`.

### Supported Pseudo-Classes

| Pseudo-Class | Trigger | Use Case |
|-------------|---------|----------|
| `hover:` | Pointer over element (web/mouse) | Hover effects |
| `focus:` | Element has input focus | Focus indicators |
| `active:` | Element is pressed/selected | Press feedback |

### Browser-Specific Behavior

- **Native (iOS/Android):** active: works on press, hover: limited
- **Web (React Native Web):** All pseudo-classes work fully
- **Best practice:** Test on all platforms

---

## Individual Pseudo-Classes

### active: Pseudo-Class

Triggered when element is pressed (all platforms):

```typescript
import { Pressable, Text } from 'react-native';

export const ActiveExample = () => {
  return (
    <Pressable className="bg-blue-500 active:bg-blue-700 active:scale-95 p-4 rounded-lg">
      <Text className="text-white font-bold">
        Press me
      </Text>
    </Pressable>
  );
};

// What happens:
// 1. Normal: bg-blue-500 (blue background)
// 2. Press down: bg-blue-700 + scale-95 (darker, scaled down)
// 3. Release: Returns to bg-blue-500
```

### Active with Multiple Styling

```typescript
<Pressable className="active:bg-blue-700 active:shadow-lg active:opacity-80 active:scale-95 p-4 rounded-lg">
  <Text className="active:text-opacity-90">
    Multi-state press
  </Text>
</Pressable>

// Multiple properties can change on active:
// - Background color
// - Shadow
// - Opacity
// - Scale
// - Text properties
```

### focus: Pseudo-Class

Triggered when element has input focus (mainly web, works on TextInput):

```typescript
import { TextInput, View } from 'react-native';

export const FocusExample = () => {
  return (
    <View className="web:focus-within:border-blue-500">
      <TextInput
        className="border border-gray-300 focus:border-blue-500 focus:bg-blue-50 p-3 rounded-lg web:focus:outline-2 web:focus:outline-blue-500"
        placeholder="Focus on me"
      />
    </View>
  );
};

// Focus behavior:
// - border changes from gray to blue
// - Background lightens to blue-50
// - Web gets an outline
```

### hover: Pseudo-Class

Triggered when pointer hovers over element (primarily web):

```typescript
import { Pressable, Text } from 'react-native';

export const HoverExample = () => {
  return (
    <Pressable className="bg-white hover:bg-gray-50 hover:shadow-lg p-4 rounded-lg border border-gray-200 hover:border-blue-300">
      <Text className="text-gray-900 hover:text-blue-600 font-bold">
        Hover over me (web)
      </Text>
    </Pressable>
  );
};

// Hover behavior (mainly on web):
// - Background becomes slightly gray
// - Shadow appears
// - Border changes color
// - Text becomes blue
```

---

## Parent State Styles

Child elements can automatically style based on parent's pseudo-class state.

### Syntax

Use group-[pseudo]: prefix to style based on parent:

```typescript
<Pressable className="active:bg-blue-500">
  {/* Child inherits parent's active state */}
  <Text className="group-active:text-white">
    Child changes when parent is pressed
  </Text>
</Pressable>
```

### How It Works

When parent is in pseudo-state, all children with `group-[pseudo]:` classes are styled:

```typescript
import { Pressable, Text, View } from 'react-native';

export const ParentStateExample = () => {
  return (
    <Pressable className="active:bg-blue-500 active:shadow-lg rounded-lg overflow-hidden">
      <View className="p-6">
        {/* Title changes on parent press */}
        <Text className="text-2xl font-bold text-gray-900 active:text-white">
          Title
        </Text>
        
        {/* Subtitle changes on parent press */}
        <Text className="text-gray-600 active:text-gray-100">
          Subtitle
        </Text>
        
        {/* Icon animation on parent press */}
        <View className="active:scale-110 mt-4">
          <Text className="text-3xl">→</Text>
        </View>
      </View>
    </Pressable>
  );
};

// Behavior:
// - Normal: gray text, gray background, normal icon
// - Pressed: white text, blue background, scaled icon
// - Release: Returns to normal
```

### Advanced Parent State Styling

```typescript
export const AdvancedParentState = () => {
  return (
    <Pressable className="gap-3 active:bg-gradient-to-r active:from-blue-500 active:to-blue-600 p-4 rounded-lg">
      {/* Header responds to parent press */}
      <View className="flex-row items-center gap-2 active:gap-4">
        <Text className="text-2xl active:scale-125">✓</Text>
        <Text className="text-lg font-bold active:text-white">
          Checked
        </Text>
      </View>
      
      {/* Description hides on parent press */}
      <Text className="text-gray-600 active:hidden active:h-0">
        Full description here
      </Text>
      
      {/* Alternative content shows on parent press */}
      <Text className="hidden active:flex text-white text-sm">
        Item selected!
      </Text>
    </Pressable>
  );
};
```

---

## Practical Examples

### Interactive Button Collection

```typescript
import { Pressable, Text, View } from 'react-native';

export const ButtonShowcase = () => {
  return (
    <View className="gap-4 p-4">
      {/* Primary Button */}
      <Pressable className="bg-blue-500 active:bg-blue-700 active:shadow-lg p-4 rounded-lg items-center">
        <Text className="text-white font-bold active:opacity-75">
          Primary Button
        </Text>
      </Pressable>
      
      {/* Secondary Button */}
      <Pressable className="bg-gray-200 active:bg-gray-300 active:shadow p-4 rounded-lg items-center">
        <Text className="text-gray-900 font-bold">Secondary Button</Text>
      </Pressable>
      
      {/* Ghost Button (outline style) */}
      <Pressable className="border-2 border-blue-500 active:bg-blue-50 p-4 rounded-lg items-center">
        <Text className="text-blue-600 font-bold active:text-blue-700">
          Ghost Button
        </Text>
      </Pressable>
      
      {/* Icon Button */}
      <Pressable className="active:bg-gray-100 p-3 rounded-full items-center justify-center w-12 h-12">
        <Text className="text-2xl active:scale-110">♥</Text>
      </Pressable>
    </View>
  );
};
```

### Interactive Card Component

```typescript
export const InteractiveCard = ({
  title,
  description,
  onPress,
}: {
  title: string;
  description: string;
  onPress: () => void;
}) => {
  return (
    <Pressable
      onPress={onPress}
      className="bg-white active:bg-blue-50 border border-gray-200 active:border-blue-300 rounded-lg p-4 gap-2 active:shadow-lg"
    >
      {/* Icon with scale animation */}
      <View className="active:scale-110 mb-2">
        <Text className="text-3xl">📱</Text>
      </View>
      
      {/* Title with color change */}
      <Text className="text-lg font-bold text-gray-900 active:text-blue-600">
        {title}
      </Text>
      
      {/* Description */}
      <Text className="text-gray-600 active:text-gray-700">
        {description}
      </Text>
      
      {/* CTA with visibility toggle */}
      <View className="flex-row justify-between items-center mt-2">
        <Text className="text-blue-600 font-bold active:hidden">
          Tap to expand →
        </Text>
        <Text className="hidden text-green-600 font-bold active:flex">
          Loading... ✓
        </Text>
      </View>
    </Pressable>
  );
};
```

### Checkbox Component

```typescript
import { useState } from 'react';

export const Checkbox = ({
  label,
  defaultChecked = false,
}: {
  label: string;
  defaultChecked?: boolean;
}) => {
  const [checked, setChecked] = useState(defaultChecked);
  
  return (
    <Pressable
      onPress={() => setChecked(!checked)}
      className="flex-row items-center gap-3 p-3 active:bg-gray-100 rounded-lg"
    >
      {/* Checkbox square */}
      <View
        className={`w-6 h-6 border-2 rounded items-center justify-center transition-all ${
          checked
            ? 'bg-blue-500 border-blue-500'
            : 'border-gray-300 bg-white'
        }`}
      >
        {checked && <Text className="text-white font-bold">✓</Text>}
      </View>
      
      {/* Label */}
      <Text className={`flex-1 ${checked ? 'text-blue-600' : 'text-gray-900'}`}>
        {label}
      </Text>
    </Pressable>
  );
};
```

### Expandable Item with Animations

```typescript
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

export const ExpandableItem = ({
  title,
  content,
}: {
  title: string;
  content: string;
}) => {
  const [expanded, setExpanded] = useState(false);
  
  return (
    <View className="border border-gray-200 rounded-lg overflow-hidden">
      <Pressable
        onPress={() => setExpanded(!expanded)}
        className="flex-row items-center justify-between p-4 active:bg-gray-50"
      >
        <Text className="text-lg font-bold flex-1">{title}</Text>
        
        {/* Chevron rotates on expand */}
        <View
          className={`transform ${expanded ? 'rotate-180' : 'rotate-0'}`}
        >
          <Text className="text-xl">▼</Text>
        </View>
      </Pressable>
      
      {/* Content appears when expanded */}
      {expanded && (
        <View className="bg-gray-50 p-4 border-t border-gray-200">
          <Text className="text-gray-700">{content}</Text>
        </View>
      )}
    </View>
  );
};
```

### Tab Navigation

```typescript
export const TabNav = ({
  tabs,
  activeTab,
  onTabChange,
}: {
  tabs: string[];
  activeTab: string;
  onTabChange: (tab: string) => void;
}) => {
  return (
    <View className="flex-row border-b border-gray-200">
      {tabs.map((tab) => (
        <Pressable
          key={tab}
          onPress={() => onTabChange(tab)}
          className={`flex-1 py-4 px-2 items-center justify-center active:bg-gray-100 ${
            activeTab === tab
              ? 'border-b-2 border-blue-500'
              : 'border-b-2 border-transparent'
          }`}
        >
          <Text
            className={`font-bold ${
              activeTab === tab
                ? 'text-blue-600'
                : 'text-gray-600 active:text-gray-900'
            }`}
          >
            {tab}
          </Text>
        </Pressable>
      ))}
    </View>
  );
};
```

---

## Web-Specific Focus Styling

For web targets, you can add detailed focus styling:

```typescript
export const WebAccessibleButton = () => {
  return (
    <Pressable className="bg-blue-500 active:bg-blue-700 web:focus:outline-2 web:focus:outline-offset-2 web:focus:outline-blue-500 p-4 rounded-lg">
      <Text className="text-white font-bold">
        Web-Accessible Button
      </Text>
    </Pressable>
  );
};

// Focus outline is only applied on web
// Native platforms have different focus indicators
```

---

## Performance Notes

Pseudo-classes are efficient:
- ✅ Pre-compiled at build time
- ✅ No runtime style calculation
- ✅ Native performance on all platforms
- ✅ Minimal re-render impact

---

## Related Documentation

- **Core Concepts:** `02-core-concepts.md` - How styles work
- **Styling System:** `03-styling-system.md` - Dynamic styles
- **Best Practices:** `11-best-practices.md` - Production patterns

**Source:** https://www.nativewind.dev/docs
