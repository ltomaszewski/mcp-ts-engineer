# Core Concepts - NativeWind v5

**Source:** https://www.nativewind.dev/v5/
**Last Verified:** March 2026
**Version:** NativeWind v5.0.0-preview.3

---

## Table of Contents
1. [What is NativeWind?](#what-is-nativewind)
2. [Architecture Overview](#architecture-overview)
3. [Compilation Model](#compilation-model)
4. [How It Differs from StyleSheet.create](#how-it-differs-from-stylesheetcreate)
5. [Key Features](#key-features)
6. [Breaking Changes from v4](#breaking-changes-from-v4)

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

**Official Documentation:** https://www.nativewind.dev/v5/

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

Define themes and dynamic styles using the `vars()` function:

```javascript
import { vars } from 'nativewind';

<View style={vars({ '--primary-color': '#3498db', '--spacing-unit': '8px' })}>
  <View className="p-[var(--spacing-unit)] bg-[--primary-color]">
    Dynamic Theme
  </View>
</View>
```

**Shorthand syntax:** Use `text-[--variable]` instead of `text-[var(--variable)]` for cleaner code.

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

## Breaking Changes from v4

### Removed: Babel Integration

**v4 (Old):**
```javascript
// babel.config.js
module.exports = {
  presets: [
    ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
    'nativewind/babel',
  ],
};
```

**v5 (Current):**
```javascript
// babel.config.js
module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // No nativewind/babel, no jsxImportSource
  };
};
```

**Reason:** v5 uses a different JSX transform path that no longer needs the Babel preset.

### Removed: tailwind.config.js

**v4 (Old):**
```javascript
// tailwind.config.js
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: { primary: '#3498db' },
    },
  },
}
```

**v5 (Current) — CSS @theme:**
```css
/* global.css */
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";

@theme {
  --color-primary: #3498db;
}
```

**Reason:** Tailwind v4 adopted CSS-first config. No `tailwind.config.js` is needed or supported.

### Replaced: react-native-css-interop → react-native-css

**v4:** `react-native-css-interop` was a peer dependency
**v5:** Replaced by `react-native-css@^3.0.5`

Update `package.json`:
```json
{
  "dependencies": {
    "react-native-css": "^3.0.5"
  }
}
```

### Changed: TypeScript Reference

**v4 (Old):**
```typescript
// nativewind-env.d.ts
/// <reference types="nativewind" />
```

**v5 (Current):**
```typescript
// nativewind-env.d.ts
/// <reference types="react-native-css/types" />
```

### Changed: Metro Config

**v4 (Old):**
```javascript
module.exports = withNativeWind(config, { input: './global.css' });
```

**v5 (Current):**
```javascript
module.exports = withNativewind(config); // no second argument
```

### Changed: global.css Imports

**v4 (Old):**
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**v5 (Current):**
```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";
```

### New Requirement: New Architecture

v5 requires the New Architecture (Fabric renderer + TurboModules). This is mandatory in Expo SDK 55+, so no additional configuration is needed.

### Migration Checklist (v4 → v5)

- [ ] Remove `nativewind/babel` from presets
- [ ] Remove `jsxImportSource: 'nativewind'` from babel options
- [ ] Remove second argument from `withNativewind(config)` in metro.config.js
- [ ] Replace `tailwind.config.js` with `@theme` blocks in `global.css`
- [ ] Update `global.css` imports to v5 format
- [ ] Add `postcss.config.mjs` with `@tailwindcss/postcss`
- [ ] Replace `react-native-css-interop` dep with `react-native-css@^3.0.5`
- [ ] Update `nativewind-env.d.ts` type reference
- [ ] Add `lightningcss: "1.30.1"` override in `package.json`
- [ ] Verify New Architecture is enabled (auto in Expo SDK 55)

---

## Configuration Overview

### global.css (v5 — replaces tailwind.config.js for theme)

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";

@theme {
  --color-primary: #3498db;
  --font-family-sans: 'Inter', system-ui, sans-serif;
}
```

**Note:** The `className` prop API is unchanged from v4 — component usage is fully backward compatible.

**Source:** https://www.nativewind.dev/v5/

---

## Related Concepts

- **Setup Process:** See `01-setup-guide.md`
- **Styling Syntax:** See `03-styling-system.md`
- **Layout System:** See `04-layout-utilities.md`
- **Performance:** See `11-best-practices.md` > Performance Optimization

---

## Summary

NativeWind v5 continues the Tailwind-in-React-Native paradigm with a major infrastructure overhaul. Key takeaways:

1. **Unified API** - Single `className` prop across all platforms (unchanged from v4)
2. **Build-Time Optimization** - Most styles compiled away, zero runtime cost
3. **Full Feature Parity** - Media queries, dark mode, pseudo-classes, CSS variables
4. **Tailwind v4 CSS-first** - No `tailwind.config.js`; use `@theme` in `global.css`
5. **New Architecture Required** - Mandatory Fabric renderer (auto in Expo SDK 55+)
6. **Component API Unchanged** - `className` usage is fully backward compatible

**Next Steps:**
- Read `01-setup-guide.md` for installation
- Review `03-styling-system.md` for styling syntax
- Check `11-best-practices.md` for production patterns
