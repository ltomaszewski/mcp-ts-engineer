# Dark Mode & Theme Management - NativeWind v4

**Source:** https://www.nativewind.dev/docs/core-concepts/dark-mode  
**Last Verified:** October 14, 2025  
**Version:** NativeWind v4

---

## Table of Contents
1. [Dark Mode Overview](#dark-mode-overview)
2. [System Preference Mode (Automatic)](#system-preference-mode-automatic)
3. [Manual Selection Mode (User Toggle)](#manual-selection-mode-user-toggle)
4. [useColorScheme Hook](#usecolorscheme-hook)
5. [Styling with Dark Mode](#styling-with-dark-mode)
6. [Implementation Examples](#implementation-examples)

---

## Dark Mode Overview

NativeWind supports two primary approaches for implementing dark mode:

1. **System Preference (Automatic)** - Follows device appearance setting
2. **Manual Selection (User Toggle)** - User chooses light/dark/auto

Both approaches use the unified `colorScheme` API from NativeWind.

### How It Works

**Under the Hood:**
- **Native platforms (iOS/Android):** Uses React Native's `Appearance` API
- **Web:** Uses CSS media query `prefers-color-scheme`
- **Unified API:** `useColorScheme` hook works identically across all platforms

---

## System Preference Mode (Automatic)

Automatically follow the device's appearance setting.

### Basic Setup

No special setup required. NativeWind follows system preference by default on most platforms.

**Expo Note:** In Expo apps, ensure `app.json` has:

```json
{
  "expo": {
    "plugins": [
      [
        "expo-system-ui",
        {
          "userInterfaceStyle": "automatic"
        }
      ]
    ]
  }
}
```

### Reading System Preference

Use `useColorScheme()` hook to read current color scheme:

```typescript
import { View, Text } from 'react-native';
import { useColorScheme } from 'nativewind';

export const SystemPreferenceExample = () => {
  const colorScheme = useColorScheme();
  
  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg">
        Current scheme: {colorScheme || 'not-set'}
      </Text>
      {/* 
        Possible values:
        - 'light' - System is in light mode
        - 'dark' - System is in dark mode
        - null - System has no preference
      */}
    </View>
  );
};
```

### Auto-Update on System Change

The component automatically re-renders when system appearance changes:

```typescript
import { View, Text } from 'react-native';
import { useColorScheme } from 'nativewind';

export const AdaptiveTheme = () => {
  const colorScheme = useColorScheme();
  
  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      {/* 
        If system is in dark mode:
        - Uses `dark:bg-slate-900`
        
        If system is in light mode:
        - Uses `bg-white`
        
        Changes automatically when system preference changes
      */}
      <Text className="text-black dark:text-white">
        {colorScheme === 'dark' ? '🌙 Dark Mode' : '☀️ Light Mode'}
      </Text>
    </View>
  );
};
```

---

## Manual Selection Mode (User Toggle)

Allow users to manually choose between light, dark, or automatic mode.

### useColorScheme.set() Function

Use `colorScheme.set()` to manually set the color scheme:

```typescript
import { useColorScheme } from 'nativewind';
import { View, Text, Pressable } from 'react-native';

export const ManualToggle = () => {
  const colorScheme = useColorScheme();
  
  return (
    <View className="flex-1 gap-4 p-4">
      {/* Display current mode */}
      <Text className="text-lg font-bold">
        Current: {colorScheme || 'auto'}
      </Text>
      
      {/* Light mode button */}
      <Pressable
        onPress={() => colorScheme.set('light')}
        className={`p-4 rounded-lg ${
          colorScheme === 'light'
            ? 'bg-blue-500'
            : 'bg-gray-200'
        }`}
      >
        <Text className="font-bold">☀️ Light</Text>
      </Pressable>
      
      {/* Dark mode button */}
      <Pressable
        onPress={() => colorScheme.set('dark')}
        className={`p-4 rounded-lg ${
          colorScheme === 'dark'
            ? 'bg-blue-500'
            : 'bg-gray-200'
        }`}
      >
        <Text className="font-bold">🌙 Dark</Text>
      </Pressable>
      
      {/* Auto/System button */}
      <Pressable
        onPress={() => colorScheme.set(null)}
        className={`p-4 rounded-lg ${
          colorScheme === null
            ? 'bg-blue-500'
            : 'bg-gray-200'
        }`}
      >
        <Text className="font-bold">🔄 Auto</Text>
      </Pressable>
    </View>
  );
};
```

### Valid Values for set()

```typescript
colorScheme.set('light')  // Force light mode
colorScheme.set('dark')   // Force dark mode
colorScheme.set(null)     // Auto (follow system)
```

### Return Values

```typescript
const colorScheme = useColorScheme();

// Reading returns string or null
if (colorScheme === 'light') { /* light mode */ }
if (colorScheme === 'dark') { /* dark mode */ }
if (colorScheme === null) { /* auto mode */ }

// Setting accepts 'light' | 'dark' | null
colorScheme.set('light')
colorScheme.set('dark')
colorScheme.set(null)
```

---

## useColorScheme Hook

Complete API reference for the hook:

### Hook Signature

```typescript
const colorScheme = useColorScheme();
```

### Return Type

```typescript
interface ColorScheme {
  // Current color scheme value
  value: 'light' | 'dark' | null;
  
  // Set new color scheme
  set: (scheme: 'light' | 'dark' | null) => void;
  
  // Direct string value (shorthand)
  // colorScheme === 'light' // works!
}

// Can be used as:
// - colorScheme (as string)
// - colorScheme.value (explicit)
// - colorScheme.set() (setter)
```

### Import

```typescript
import { useColorScheme } from 'nativewind';

// OR

import { useColorScheme } from 'nativewind/core';
```

### Example Hook Usage

```typescript
import { useColorScheme } from 'nativewind';
import { View, Text } from 'react-native';

export const HookExample = () => {
  const colorScheme = useColorScheme();
  
  // Implicit string conversion
  if (colorScheme === 'dark') {
    // In dark mode
  }
  
  // Explicit value access
  const isDark = colorScheme.value === 'dark';
  
  // Setting
  const toggleDarkMode = () => {
    colorScheme.set(colorScheme === 'dark' ? 'light' : 'dark');
  };
  
  return (
    <View className="flex-1">
      <Text>Current: {colorScheme}</Text>
      <Pressable onPress={toggleDarkMode}>
        <Text>Toggle</Text>
      </Pressable>
    </View>
  );
};
```

**Source:** https://www.nativewind.dev/docs/core-concepts/dark-mode

---

## Styling with Dark Mode

Use the `dark:` prefix to apply dark mode specific styles.

### Dark Prefix Syntax

```typescript
<View className="bg-white dark:bg-slate-900">
  {/* 
    Light mode: white background
    Dark mode: slate-900 background
  */}
</View>

<Text className="text-slate-900 dark:text-white">
  {/* 
    Light mode: dark text
    Dark mode: light text
  */}
</Text>
```

### Colors for Dark Mode

```typescript
// Background colors
<View className="bg-white dark:bg-slate-900" />
<View className="bg-gray-50 dark:bg-slate-800" />
<View className="bg-blue-100 dark:bg-blue-900" />

// Text colors
<Text className="text-gray-900 dark:text-gray-50" />
<Text className="text-gray-600 dark:text-gray-400" />

// Border colors
<View className="border border-gray-300 dark:border-gray-700" />

// Shadow colors (context-based)
<View className="shadow-sm dark:shadow-lg" />
```

### Complete Dark Mode Styling Example

```typescript
import { View, Text, Pressable } from 'react-native';

export const Card = () => {
  return (
    <View className="bg-white dark:bg-slate-800 rounded-lg shadow-md dark:shadow-lg p-4 my-4">
      {/* Header */}
      <Text className="text-2xl font-bold text-slate-900 dark:text-white mb-2">
        Card Title
      </Text>
      
      {/* Subtitle */}
      <Text className="text-gray-600 dark:text-gray-400 mb-4">
        Subtitle or description
      </Text>
      
      {/* Content */}
      <View className="bg-gray-50 dark:bg-slate-700 p-3 rounded-lg mb-4">
        <Text className="text-gray-700 dark:text-gray-200">
          Content goes here
        </Text>
      </View>
      
      {/* Footer with button */}
      <View className="flex-row gap-2 border-t border-gray-200 dark:border-gray-700 pt-4">
        <Pressable className="flex-1 bg-blue-500 dark:bg-blue-600 rounded-lg p-2">
          <Text className="text-white text-center font-bold">
            Action
          </Text>
        </Pressable>
        <Pressable className="flex-1 bg-gray-200 dark:bg-gray-700 rounded-lg p-2">
          <Text className="text-gray-900 dark:text-gray-100 text-center font-bold">
            Cancel
          </Text>
        </Pressable>
      </View>
    </View>
  );
};
```

---

## Implementation Examples

### Complete Theme Toggle Screen

```typescript
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useColorScheme } from 'nativewind';

export const ThemeSettings = () => {
  const colorScheme = useColorScheme();
  
  const themeOptions = [
    { label: '☀️ Light Mode', value: 'light' as const },
    { label: '🌙 Dark Mode', value: 'dark' as const },
    { label: '🔄 System', value: null as const },
  ];
  
  return (
    <ScrollView className="flex-1 bg-white dark:bg-slate-900">
      {/* Header */}
      <View className="bg-slate-100 dark:bg-slate-800 px-6 py-6 ios:pt-12">
        <Text className="text-2xl font-bold text-slate-900 dark:text-white">
          Theme Settings
        </Text>
        <Text className="text-gray-600 dark:text-gray-400 mt-1">
          Choose your preferred appearance
        </Text>
      </View>
      
      {/* Options */}
      <View className="p-6 gap-3">
        {themeOptions.map(({ label, value }) => (
          <Pressable
            key={label}
            onPress={() => colorScheme.set(value)}
            className={`flex-row items-center p-4 rounded-lg border-2 ${
              colorScheme === value
                ? 'bg-blue-50 dark:bg-blue-900 border-blue-500'
                : 'bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-600'
            }`}
          >
            <View className="flex-1">
              <Text className={`text-lg font-bold ${
                colorScheme === value
                  ? 'text-blue-600 dark:text-blue-400'
                  : 'text-slate-900 dark:text-white'
              }`}>
                {label}
              </Text>
            </View>
            {colorScheme === value && (
              <Text className="text-2xl">✓</Text>
            )}
          </Pressable>
        ))}
      </View>
      
      {/* Info box */}
      <View className="mx-6 mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
        <Text className="text-blue-900 dark:text-blue-100 text-sm">
          Current theme: {colorScheme === null ? 'System' : colorScheme}
        </Text>
      </View>
    </ScrollView>
  );
};
```

### Persisting User Theme Preference

```typescript
import { useEffect, useState } from 'react';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const usePersistedTheme = () => {
  const colorScheme = useColorScheme();
  const [isLoaded, setIsLoaded] = useState(false);
  
  // Load saved preference on mount
  useEffect(() => {
    loadTheme();
  }, []);
  
  // Save preference when it changes
  useEffect(() => {
    if (isLoaded && colorScheme) {
      saveTheme(colorScheme);
    }
  }, [colorScheme, isLoaded]);
  
  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme-preference');
      if (saved) {
        const value = saved === 'null' ? null : saved;
        colorScheme.set(value as any);
      }
      setIsLoaded(true);
    } catch (error) {
      console.error('Failed to load theme:', error);
      setIsLoaded(true);
    }
  };
  
  const saveTheme = async (scheme: typeof colorScheme) => {
    try {
      await AsyncStorage.setItem('theme-preference', String(scheme));
    } catch (error) {
      console.error('Failed to save theme:', error);
    }
  };
  
  return { colorScheme, isLoaded };
};

// Usage
export const App = () => {
  const { colorScheme, isLoaded } = usePersistedTheme();
  
  if (!isLoaded) {
    return <View className="flex-1 bg-white dark:bg-slate-900" />;
  }
  
  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      {/* App content */}
    </View>
  );
};
```

---

## Related Documentation

- **Styling System:** `03-styling-system.md` - Dynamic styles
- **Custom Values:** `09-custom-values.md` - CSS variables for themes
- **Best Practices:** `11-best-practices.md` - Theme patterns

**Source:** https://www.nativewind.dev/docs/core-concepts/dark-mode
