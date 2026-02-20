# Core Concepts - NativeWind v4

**Source:** https://www.nativewind.dev/docs  
**Last Verified:** October 14, 2025  
**Version:** NativeWind v4

---

## Table of Contents
1. [What is NativeWind?](#what-is-nativewind)
2. [Architecture Overview](#architecture-overview)
3. [Compilation Model](#compilation-model)
4. [How It Differs from StyleSheet.create](#how-it-differs-from-stylesheetcreate)
5. [Key Features](#key-features)
6. [Breaking Changes from v2](#breaking-changes-from-v2)

---

## What is NativeWind?

NativeWind is a styling framework that brings **Tailwind CSS to React Native**. It allows you to use Tailwind utility classes to style components across all React Native platforms (iOS, Android, Web) using a single, unified API.

### Core Definition

> NativeWind allows you to use Tailwind CSS to style your components in React Native. Styled components can be shared between all React Native platforms, using the best style engine for that platform: CSS StyleSheet on web and StyleSheet.create for native.

**Key Goals:**
- Consistent styling experience across platforms
- Improved Developer UX
- Enhanced component performance
- Better code maintainability

**Official Documentation:** https://www.nativewind.dev/docs

---

## Architecture Overview

### Platform-Specific Rendering

NativeWind adapts to each platform's capabilities:

| Platform | Rendering Engine | Style System |
|----------|------------------|--------------|
| **iOS** | React Native | `StyleSheet.create()` |
| **Android** | React Native | `StyleSheet.create()` |
| **Web** | React Native Web | Tailwind CSS Stylesheet |
| **All** | Unified via `className` prop | Best available for platform |

### Two-Phase Operation

#### Phase 1: Build Time
- Tailwind CSS utilities are compiled into `StyleSheet.create()` objects
- Conditional logic for pseudo-classes (hover, focus, active) is determined
- CSS is optimized and minified for production

**What happens:**
```javascript
// Input: Tailwind utilities in className
<View className="flex-1 items-center justify-center bg-white" />

// Build output: Compiled StyleSheet
const styles = StyleSheet.create({
  flex1ItemsCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff'
  }
});
```

#### Phase 2: Runtime
- Compiled styles are applied to components efficiently
- Conditional styles (media queries, pseudo-classes) are evaluated
- No re-parsing or style injection occurs
- Dynamic styles (from variables) are applied with minimal overhead

**Benefits:**
- ✅ Near-native performance
- ✅ Zero style calculation at render time
- ✅ Efficient re-renders with memoization
- ✅ No CSS-in-JS runtime overhead

---

## Compilation Model

### Static Compilation (Zero Runtime Overhead)

For static utility classes, all compilation happens at build time:

```javascript
// Static class (compiled at build time)
<View className="p-4 bg-blue-500 rounded-lg" />
```

**Compilation Result:**
- No runtime CSS evaluation
- Direct access to pre-computed `StyleSheet` object
- Constant time lookup (O(1))
- Zero performance penalty

### Dynamic Styles with Conditional Logic

For dynamic values, NativeWind uses runtime conditionals with pre-compiled styles:

```javascript
// Dynamic class selection (compiled logic, applied at runtime)
<View className={isActive ? "bg-blue-500" : "bg-gray-300"} />
```

**Runtime Process:**
1. Conditional is evaluated (JavaScript boolean)
2. Pre-compiled style object is selected
3. Style is applied directly (no re-parsing)
4. Component renders with selected style

### Media Queries and Container Queries

Modern responsive features work at both build and runtime:

```javascript
// Media query (compile-time setup, runtime evaluation)
<View className="md:flex-row sm:flex-col p-4" />
```

**How It Works:**
1. Breakpoint thresholds are compiled during build
2. At runtime, device/viewport is checked
3. Correct style variant is applied
4. Re-evaluation occurs only on resize

**Supported Features:**
- Media queries (viewport size)
- Container queries (parent size)
- Device orientation changes
- Color scheme changes

---

## How It Differs from StyleSheet.create

### StyleSheet.create Limitations

React Native's native `StyleSheet.create()` is limited:

| Feature | StyleSheet.create | NativeWind |
|---------|------------------|-----------|
| **Static Styles** | ✅ Full support | ✅ Full support |
| **Responsive Design** | ❌ Manual implementation | ✅ Built-in media queries |
| **Container Queries** | ❌ Not supported | ✅ Full support |
| **Pseudo-Classes** | ❌ Manual state handling | ✅ hover/focus/active |
| **Dark Mode** | ❌ Manual theme switching | ✅ Automatic + manual |
| **CSS Variables** | ❌ Not supported | ✅ Full support |
| **Color Schemes** | ❌ Manual Appearance API | ✅ useColorScheme hook |
| **Browser Compatibility** | N/A | ✅ Works with React Native Web |
| **Code Reusability** | Limited | ✅ Shared components |

### Code Comparison

#### Using StyleSheet.create (Manual)

```javascript
import { StyleSheet, View, Text } from 'react-native';
import { useWindowDimensions, Appearance } from 'react-native';

const MyComponent = () => {
  const { width } = useWindowDimensions();
  const colorScheme = Appearance.getColorScheme();
  
  // Manual responsive logic
  const isSmallScreen = width < 600;
  
  // Manual dark mode logic
  const isDarkMode = colorScheme === 'dark';
  
  const styles = StyleSheet.create({
    container: {
      flex: 1,
      paddingHorizontal: isSmallScreen ? 12 : 24,
      backgroundColor: isDarkMode ? '#1a1a1a' : '#ffffff',
    },
    text: {
      fontSize: isSmallScreen ? 14 : 16,
      color: isDarkMode ? '#ffffff' : '#000000',
    }
  });
  
  return (
    <View style={styles.container}>
      <Text style={styles.text}>Hello</Text>
    </View>
  );
};

export default MyComponent;
```

#### Using NativeWind (Declarative)

```javascript
import { View, Text } from 'react-native';

const MyComponent = () => {
  return (
    <View className="flex-1 px-3 sm:px-6 bg-white dark:bg-slate-900">
      <Text className="text-sm sm:text-base text-black dark:text-white">
        Hello
      </Text>
    </View>
  );
};

export default MyComponent;
```

**Advantages of NativeWind Approach:**
- Declarative (what you see is what you get)
- Reusable across platforms
- Centralized theme management
- Less boilerplate code
- Easier testing and maintenance

---

## Key Features

### 1. Universal Platform Support

Use single codebase for iOS, Android, and Web:

```javascript
// Works identically on all platforms
<View className="flex-1 items-center justify-center bg-blue-500">
  <Text className="text-white text-xl font-bold">Universal</Text>
</View>
```

**Cross-Reference:** See `05-responsive-design.md` for platform-specific styling (ios:/android:/web: selectors)

### 2. Media Queries

Build responsive layouts with breakpoints:

```javascript
<View className="flex-col sm:flex-row gap-4">
  <View className="w-full sm:w-1/2">Left</View>
  <View className="w-full sm:w-1/2">Right</View>
</View>
```

**Breakpoints:**
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

**Cross-Reference:** See `04-layout-utilities.md` for layout examples

### 3. Container Queries

Style children based on parent container size (not viewport):

```javascript
<View className="@container p-4">
  {/* Responsive to @container width, not viewport */}
  <View className="@md:flex-row">Adaptive Layout</View>
</View>
```

**Benefits:**
- Component-centric responsiveness
- Reusable in multiple contexts
- Better encapsulation

### 4. Custom Values (CSS Variables)

Define themes and dynamic styles:

```javascript
const root = {
  '--primary-color': '#3498db',
  '--spacing-unit': '8px'
};

<View style={root} className="p-[var(--spacing-unit)] bg-[var(--primary-color)]">
  Dynamic Theme
</View>
```

**Cross-Reference:** See `09-custom-values.md` for detailed CSS variable usage

### 5. Pseudo Classes

Interactive state styling without manual logic:

```javascript
<Pressable className="bg-blue-500 active:bg-blue-700 hover:opacity-80">
  <Text className="text-white">Interactive</Text>
</Pressable>
```

**Supported States:**
- `hover` - Pointer over element
- `focus` - Element has focus
- `active` - Element is pressed/selected

**Cross-Reference:** See `07-pseudo-classes.md` for comprehensive pseudo-class guide

### 6. Parent State Styles

Automatically style children based on parent state:

```javascript
<Pressable className="active:bg-blue-500 active:scale-95">
  <Text className="active:text-white">Child auto-responds to parent state</Text>
</Pressable>
```

### 7. Dark Mode

Automatic or manual dark mode switching:

```javascript
<View className="bg-white dark:bg-slate-900">
  <Text className="text-black dark:text-white">Adaptive Colors</Text>
</View>
```

**Modes:**
- **System** - Follows device appearance
- **Manual** - User toggle via `colorScheme.set()`

**Cross-Reference:** See `08-dark-mode.md` for implementation details

### 8. Arbitrary Classes

Use custom values without pre-defined classes:

```javascript
<View className="w-[253px] h-[100px] bg-[#f0a343]">
  Custom Values
</View>
```

**Cross-Reference:** See `10-advanced-features.md` for arbitrary syntax

---

## Breaking Changes from v2

### Removal of `styled()` Function

**v2 (Old):**
```javascript
import { styled } from 'nativewind';

const StyledView = styled(View)`
  flex-1 bg-white
`;
```

**v4 (Current):**
```javascript
// Direct className prop - no wrapper needed
<View className="flex-1 bg-white" />
```

**Reason for Removal:**
- New JSX transform eliminates need for wrappers
- Works directly on all components (3rd-party included)
- Simpler mental model
- Better performance

### Base Scaling Modifications

The `rem` unit default has changed:

| Setting | v2 | v4 |
|---------|----|----|
| Default `rem` value | 16px | 14px |
| Calculation | Matched Tailwind | Aligned with mobile |

**Migration:**
```javascript
// v2
<View className="p-4" /> // 16px padding

// v4 (equivalent)
<View className="p-4" /> // 14px padding (default)

// Or override in tailwind.config.js
module.exports = {
  theme: {
    fontSize: {
      base: '16px', // Override default
    }
  }
}
```

### New fontFamily Defaults

Default font families have changed:

**v4 Defaults:**
```javascript
// iOS default system font
// Android default system font
// Web default system font
```

**Override in `tailwind.config.js`:**
```javascript
module.exports = {
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'system-ui'],
        mono: ['Courier New'],
      }
    }
  }
}
```

### Removed APIs

| API | v2 | v4 | Alternative |
|-----|----|----|-------------|
| `setVariables()` | ✅ Supported | ❌ Removed | Use `vars()` function |
| `useUnsafeVariable` | ✅ Supported | ❌ Removed | Use `useUnstableNativeVariables` |
| `setDirection()` | ✅ Supported | ❌ Removed | Use `I18nManager.forceRTL` |
| `odd/even/first/last` | ✅ Supported | ⏳ Temporary | Planned for future |

### Migration Checklist

If upgrading from v2:

- [ ] Replace `styled()` wrapper with direct `className`
- [ ] Update `rem` base size in `tailwind.config.js` if needed
- [ ] Change `setVariables()` calls to `vars()` function
- [ ] Replace `useUnsafeVariable` with `useUnstableNativeVariables`
- [ ] Update RTL logic from `setDirection()` to `I18nManager.forceRTL`
- [ ] Note: `odd/even/first/last` modifiers unavailable in v4.0 (coming later)
- [ ] Test responsive behavior (breakpoints unchanged)
- [ ] Verify dark mode implementation using new hook

---

## Configuration Overview

### Minimal tailwind.config.js

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### With NativeWind Extensions

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3498db',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui'],
      }
    },
  },
  plugins: [],
  // NativeWind-specific options
  corePlugins: {
    preflight: false, // Disable web resets for React Native
  }
}
```

**Source:** https://www.nativewind.dev/docs/getting-started/installation

---

## Related Concepts

- **Setup Process:** See `01-setup-guide.md`
- **Styling Syntax:** See `03-styling-system.md`
- **Layout System:** See `04-layout-utilities.md`
- **Performance:** See `11-best-practices.md` > Performance Optimization

---

## Summary

NativeWind v4 represents a fundamental shift from manual React Native styling to declarative Tailwind-based styling. Key takeaways:

1. **Unified API** - Single `className` prop across all platforms
2. **Build-Time Optimization** - Most styles compiled away, zero runtime cost
3. **Full Feature Parity** - Media queries, dark mode, pseudo-classes, CSS variables
4. **Breaking Changes** - Removal of `styled()`, API updates, but modern and simpler
5. **Production Ready** - Used in production apps with excellent performance

**Next Steps:**
- Read `01-setup-guide.md` for installation
- Review `03-styling-system.md` for styling syntax
- Check `11-best-practices.md` for production patterns
