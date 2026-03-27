# Setup Guide - NativeWind v5

**Source:** https://www.nativewind.dev/v5/
**Last Verified:** March 2026
**Version:** NativeWind v5.0.0-preview.3

---

## Table of Contents
1. [Prerequisites](#prerequisites)
2. [Installation with Expo](#installation-with-expo)
3. [Manual Setup for Framework-less React Native](#manual-setup-for-framework-less-react-native)
4. [Configuration Files Reference](#configuration-files-reference)
5. [TypeScript Setup](#typescript-setup)
6. [Theme Configuration (CSS @theme)](#theme-configuration-css-theme)
7. [Editor Configuration](#editor-configuration)
8. [Verification & Testing](#verification--testing)

---

## Prerequisites

NativeWind v5 requires:
- **New Architecture** (mandatory — bridgeless Fabric renderer)
- **Expo SDK 55+** or React Native 0.83+
- Node.js 20+

**New Architecture is automatically enabled in Expo SDK 55.** No opt-in needed.

---

## Installation with Expo

### Quick Start Command

```bash
npx create-expo-app --template with-nativewind
```

This initializes a complete Expo project with NativeWind v5 and Tailwind CSS v4 pre-configured.

### Step-by-Step Manual Setup

#### Step 1: Install Dependencies

```bash
npm install nativewind@5.0.0-preview.3 react-native-css@^3.0.5 react-native-reanimated react-native-safe-area-context
npm install --save-dev tailwindcss@^4.1.0 @tailwindcss/postcss@^4.1.0
```

**Add the lightningcss override** to `package.json` (required for Tailwind v4):

```json
{
  "overrides": {
    "lightningcss": "1.30.1"
  }
}
```

**Dependency Versions (as of March 2026):**
- `nativewind`: 5.0.0-preview.3
- `react-native-css`: ^3.0.5 (replaces `react-native-css-interop`)
- `tailwindcss`: ^4.1.0 (devDependency)
- `@tailwindcss/postcss`: ^4.1.0 (devDependency)
- `react-native-reanimated`: 4.2.1+

**Key change from v4:** `react-native-css-interop` is replaced by `react-native-css`. Do NOT install `react-native-css-interop` separately.

#### Step 2: Create Global CSS File

Create `global.css` in your project root with the v5 4-line import block:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";
```

**Important:** This replaces the v4 `@tailwind base; @tailwind components; @tailwind utilities;` directives. Do NOT use `@tailwind` directives in v5.

#### Step 3: Configure Metro Bundler

Create or modify `metro.config.js` in your project root:

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
```

**Key changes from v4:**
- `withNativewind` is lowercase `w` in the import path (same path `nativewind/metro`)
- No second argument — do NOT pass `{ input: './global.css' }` in v5
- The global.css is auto-discovered

#### Step 4: Configure Babel

Create or update `babel.config.js`:

```javascript
module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [['module-resolver', { alias: { '@': './src' } }]],
  };
};
```

**Key changes from v4:**
- Remove `nativewind/babel` from presets — it no longer exists
- Remove `jsxImportSource: 'nativewind'` from babel-preset-expo options
- Plain `babel-preset-expo` is all that's needed

#### Step 5: Add PostCSS Config

Create `postcss.config.mjs` (new file, required in v5):

```javascript
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

#### Step 6: Import Global CSS

Import your CSS file in your app's root component (usually `app/_layout.tsx` or `app/index.tsx`):

```typescript
import '../global.css';  // Must be at the very top

import { View, Text } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold">NativeWind Works!</Text>
    </View>
  );
}
```

**File Structure After Setup:**
```
project-root/
├── app.json
├── babel.config.js
├── metro.config.js          ← Updated (no second arg)
├── postcss.config.mjs       ← NEW
├── global.css               ← Updated (new import block)
├── nativewind-env.d.ts      ← Updated (new type reference)
├── package.json
└── app/
    └── _layout.tsx          ← Imports global.css
```

---

## Manual Setup for Framework-less React Native

If using React Native CLI without Expo:

### Step 1: Install Dependencies

```bash
npm install nativewind@5.0.0-preview.3 react-native-css@^3.0.5 react-native-reanimated react-native-safe-area-context
npm install --save-dev tailwindcss@^4.1.0 @tailwindcss/postcss@^4.1.0
```

### Step 2: Create Global CSS

Create `global.css`:

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";
```

### Step 3: Configure Babel

Update `babel.config.js`:

```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset'],
};
```

No `nativewind/babel` preset. No `jsxImportSource`.

### Step 4: Configure Metro

Create/update `metro.config.js`:

```javascript
const { getDefaultConfig } = require('metro-config');
const { withNativewind } = require('nativewind/metro');

module.exports = withNativewind(getDefaultConfig(__dirname));
```

### Step 5: Add PostCSS Config

Create `postcss.config.mjs`:

```javascript
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

### Step 6: Import in Root Component

```typescript
import './global.css';

import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('MyApp', () => App);
```

---

## Configuration Files Reference

### metro.config.js (v5)

```javascript
const { getDefaultConfig } = require('expo/metro-config');
const { withNativewind } = require('nativewind/metro');

const config = getDefaultConfig(__dirname);

module.exports = withNativewind(config);
// Note: no { input: './global.css' } in v5
```

### babel.config.js (v5)

```javascript
module.exports = (api) => {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    // No nativewind/babel
    // No jsxImportSource: 'nativewind'
  };
};
```

### global.css (v5)

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";
```

### postcss.config.mjs (v5 — new file)

```javascript
const config = { plugins: { "@tailwindcss/postcss": {} } };
export default config;
```

---

## TypeScript Setup

### nativewind-env.d.ts (v5)

Create `nativewind-env.d.ts` in your project root:

```typescript
/// <reference types="react-native-css/types" />
```

**Breaking change from v4:** The type reference changed from `/// <reference types="nativewind" />` to `/// <reference types="react-native-css/types" />`.

**Important Naming Rules:**
- Name it: `nativewind-env.d.ts`
- DO NOT name it: `nativewind.d.ts` (conflicts with package)
- DO NOT name it: `app.d.ts` (if you have `/app` folder)

### TypeScript Configuration

Ensure your `tsconfig.json` includes:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "jsx": "react-native",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "moduleResolution": "node"
  },
  "include": ["**/*.ts", "**/*.tsx", "nativewind-env.d.ts"],
  "exclude": ["node_modules"]
}
```

---

## Theme Configuration (CSS @theme)

In v5, all theme customization is done via CSS `@theme` blocks in `global.css`. There is no `tailwind.config.js`.

### Custom Colors

```css
@import "tailwindcss/theme.css" layer(theme);
@import "tailwindcss/preflight.css" layer(base);
@import "tailwindcss/utilities.css";
@import "nativewind/theme";

@theme {
  --color-primary: #3498db;
  --color-secondary: #2ecc71;
  --color-brand-light: #85c1e9;
  --color-brand-dark: #1a5276;
}
```

Usage:
```typescript
<View className="bg-primary text-secondary" />
```

### Custom Spacing

```css
@theme {
  --spacing-18: 4.5rem;
  --spacing-128: 32rem;
}
```

### Custom Font Families

```css
@theme {
  --font-family-display: 'Inter', system-ui, sans-serif;
  --font-family-mono: 'Courier New', monospace;
}
```

### Dark Mode Variables

```css
@theme {
  --color-surface: #ffffff;
  --color-on-surface: #000000;
}

@media (prefers-color-scheme: dark) {
  @theme {
    --color-surface: #1a1a1a;
    --color-on-surface: #ffffff;
  }
}
```

### Platform-Specific CSS Variables

```css
/* global.css */
@theme {
  --font-sans: 'Segoe UI', sans-serif;
}

@media ios {
  @theme {
    --font-sans: -apple-system, BlinkMacSystemFont;
  }
}

@media android {
  @theme {
    --font-sans: 'Roboto', sans-serif;
  }
}
```

---

## Editor Configuration

### VS Code Setup

#### 1. Install Tailwind CSS IntelliSense

Extension ID: `bradlc.vscode-tailwindcss`

#### 2. Configure VS Code Settings

Create or edit `.vscode/settings.json`:

```json
{
  "tailwindCSS.experimental.classRegex": [
    ["clsx\\(([^)]*)\\)", "(?:'|\"|`)(.[^']*)(?:'|\"|`)"]
  ],
  "editor.quickSuggestions": {
    "strings": true
  },
  "[typescript]": {
    "editor.defaultFormatter": "esbenp.prettier-vscode"
  }
}
```

**Note:** With Tailwind v4, the extension auto-detects via `postcss.config.mjs` instead of `tailwind.config.js`.

---

## Verification & Testing

### Test 1: Create a Simple Component

Create `components/Hello.tsx`:

```typescript
import { View, Text } from 'react-native';

export const HelloNativeWind = () => {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold text-blue-500">
        NativeWind Works!
      </Text>
    </View>
  );
};
```

### Test 2: Run on Device/Simulator

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### Troubleshooting Checklist

1. **Styles not appearing?**
   - [ ] Verify `global.css` uses the v5 `@import` block (not `@tailwind` directives)
   - [ ] Verify `global.css` is imported in app root
   - [ ] Ensure `metro.config.js` uses `withNativewind(config)` with no second argument
   - [ ] Ensure `postcss.config.mjs` exists
   - [ ] Ensure `babel.config.js` does NOT have `nativewind/babel` or `jsxImportSource`
   - [ ] Clear cache: `npm start -- --reset-cache`

2. **Build errors about nativewind/babel?**
   - Remove `'nativewind/babel'` from your Babel presets — it was removed in v5

3. **Build errors about react-native-css-interop?**
   - Replace with `react-native-css@^3.0.5` in your dependencies

4. **Type errors on className prop?**
   - Create/update `nativewind-env.d.ts`: `/// <reference types="react-native-css/types" />`
   - Verify `tsconfig.json` includes the file

5. **lightningcss version errors?**
   - Add `"overrides": { "lightningcss": "1.30.1" }` to `package.json`

---

## Post-Installation

After successful setup, you're ready to:

1. **Learn Styling:** See `03-styling-system.md`
2. **Build Layouts:** See `04-layout-utilities.md`
3. **Responsive Design:** See `05-responsive-design.md`
4. **Theme Customization:** See this file, Theme Configuration section
5. **Best Practices:** See `11-best-practices.md`

---

## Related Documentation

- **Core Concepts:** `02-core-concepts.md` - Understand how NativeWind works
- **Styling System:** `03-styling-system.md` - Learn the className syntax
- **Troubleshooting:** `11-best-practices.md` - Debug common issues

---

## Version Information

- **NativeWind Version:** 5.0.0-preview.3
- **Tailwind CSS Version:** ^4.1.0
- **react-native-css Version:** ^3.0.5
- **Minimum Node Version:** 20
- **Last Updated:** March 2026

**Source:** https://www.nativewind.dev/v5/
