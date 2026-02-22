# Dark Mode & Theme Management - NativeWind v4.2.x

**Source:** https://www.nativewind.dev/docs/core-concepts/dark-mode
**Last Verified:** February 2026
**Version:** NativeWind v4.2.x

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
  const { colorScheme } = useColorScheme();

  return (
    <View className="flex-1 items-center justify-center">
      <Text className="text-lg">
        Current scheme: {colorScheme}
      </Text>
      {/*
        Possible values:
        - 'light' - System is in light mode
        - 'dark' - System is in dark mode
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
  const { colorScheme } = useColorScheme();

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
        {colorScheme === 'dark' ? 'Dark Mode' : 'Light Mode'}
      </Text>
    </View>
  );
};
```

---

## Manual Selection Mode (User Toggle)

Allow users to manually choose between light, dark, or automatic mode.

### setColorScheme and toggleColorScheme

Use `setColorScheme()` to manually set the scheme, or `toggleColorScheme()` to flip between light and dark:

```typescript
import { useColorScheme } from 'nativewind';
import { View, Text, Pressable } from 'react-native';

export const ManualToggle = () => {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();

  return (
    <View className="flex-1 gap-4 p-4">
      {/* Display current mode */}
      <Text className="text-lg font-bold">
        Current: {colorScheme}
      </Text>

      {/* Quick toggle button */}
      <Pressable
        onPress={toggleColorScheme}
        className="p-4 rounded-lg bg-blue-500"
      >
        <Text className="text-white font-bold text-center">
          Toggle (currently {colorScheme})
        </Text>
      </Pressable>

      {/* Light mode button */}
      <Pressable
        onPress={() => setColorScheme('light')}
        className={`p-4 rounded-lg ${
          colorScheme === 'light'
            ? 'bg-blue-500'
            : 'bg-gray-200'
        }`}
      >
        <Text className="font-bold">Light</Text>
      </Pressable>

      {/* Dark mode button */}
      <Pressable
        onPress={() => setColorScheme('dark')}
        className={`p-4 rounded-lg ${
          colorScheme === 'dark'
            ? 'bg-blue-500'
            : 'bg-gray-200'
        }`}
      >
        <Text className="font-bold">Dark</Text>
      </Pressable>

      {/* System/Auto button */}
      <Pressable
        onPress={() => setColorScheme('system')}
        className="p-4 rounded-lg bg-gray-200"
      >
        <Text className="font-bold">System</Text>
      </Pressable>
    </View>
  );
};
```

### Valid Values for setColorScheme()

```typescript
setColorScheme('light')   // Force light mode
setColorScheme('dark')    // Force dark mode
setColorScheme('system')  // Follow system preference
```

### Return Values

```typescript
const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();

// colorScheme is 'light' | 'dark'
if (colorScheme === 'light') { /* light mode */ }
if (colorScheme === 'dark') { /* dark mode */ }

// setColorScheme accepts 'light' | 'dark' | 'system'
setColorScheme('light')
setColorScheme('dark')
setColorScheme('system')

// toggleColorScheme flips between light and dark
toggleColorScheme()
```

---

## useColorScheme Hook

Complete API reference for the hook:

### Hook Signature

```typescript
const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();
```

### Return Type

```typescript
interface UseColorSchemeReturn {
  // Current resolved color scheme: 'light' | 'dark'
  colorScheme: 'light' | 'dark';

  // Set color scheme explicitly or follow system
  setColorScheme: (scheme: 'light' | 'dark' | 'system') => void;

  // Toggle between light and dark
  toggleColorScheme: () => void;
}
```

### Import

```typescript
import { useColorScheme } from 'nativewind';
```

### Module-Level colorScheme Export

For setting theme outside of components (e.g., in navigation config):

```typescript
import { colorScheme } from 'nativewind';

// Set theme before component renders
colorScheme.set('dark');
```

### Example Hook Usage

```typescript
import { useColorScheme } from 'nativewind';
import { View, Text, Pressable } from 'react-native';

export const HookExample = () => {
  const { colorScheme, setColorScheme, toggleColorScheme } = useColorScheme();

  const isDark = colorScheme === 'dark';

  return (
    <View className="flex-1 bg-white dark:bg-slate-900">
      <Text className="text-slate-900 dark:text-white">
        Current: {colorScheme}
      </Text>
      <Pressable onPress={toggleColorScheme}>
        <Text className="text-blue-500">Toggle</Text>
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
  const { colorScheme, setColorScheme } = useColorScheme();

  const themeOptions: Array<{ label: string; value: 'light' | 'dark' | 'system' }> = [
    { label: 'Light Mode', value: 'light' },
    { label: 'Dark Mode', value: 'dark' },
    { label: 'System', value: 'system' },
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
            onPress={() => setColorScheme(value)}
            className="flex-row items-center p-4 rounded-lg border-2 bg-white dark:bg-slate-800 border-gray-300 dark:border-gray-600"
          >
            <View className="flex-1">
              <Text className="text-lg font-bold text-slate-900 dark:text-white">
                {label}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      {/* Info box */}
      <View className="mx-6 mb-6 p-4 bg-blue-50 dark:bg-blue-900 rounded-lg border border-blue-200 dark:border-blue-700">
        <Text className="text-blue-900 dark:text-blue-100 text-sm">
          Current resolved theme: {colorScheme}
        </Text>
      </View>
    </ScrollView>
  );
};
```

### Persisting User Theme Preference

```typescript
import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useColorScheme } from 'nativewind';
import AsyncStorage from '@react-native-async-storage/async-storage';

type ThemePreference = 'light' | 'dark' | 'system';

export const usePersistedTheme = () => {
  const { colorScheme, setColorScheme } = useColorScheme();
  const [isLoaded, setIsLoaded] = useState(false);

  // Load saved preference on mount
  useEffect(() => {
    loadTheme();
  }, []);

  const loadTheme = async () => {
    try {
      const saved = await AsyncStorage.getItem('theme-preference');
      if (saved && ['light', 'dark', 'system'].includes(saved)) {
        setColorScheme(saved as ThemePreference);
      }
      setIsLoaded(true);
    } catch (error) {
      setIsLoaded(true);
    }
  };

  const setAndPersist = async (scheme: ThemePreference) => {
    setColorScheme(scheme);
    try {
      await AsyncStorage.setItem('theme-preference', scheme);
    } catch (error) {
      // Storage write failed, theme still applied in memory
    }
  };

  return { colorScheme, setColorScheme: setAndPersist, isLoaded };
};

// Usage
export const App = () => {
  const { isLoaded } = usePersistedTheme();

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
