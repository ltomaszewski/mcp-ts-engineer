# Setup Guide - NativeWind v4

**Source:** https://www.nativewind.dev/docs/getting-started/installation  
**Last Verified:** February 2026  
**Version:** NativeWind v4.2.x

---

## Table of Contents
1. [Installation with Expo](#installation-with-expo)
2. [Manual Setup for Framework-less React Native](#manual-setup-for-framework-less-react-native)
3. [Tailwind CSS Configuration](#tailwind-css-configuration)
4. [TypeScript Setup](#typescript-setup)
5. [Editor Configuration](#editor-configuration)
6. [Verification & Testing](#verification--testing)

---

## Installation with Expo

Expo provides the most streamlined setup experience. This is the recommended approach for most projects.

### Quick Start Command

If you want the fastest setup possible:

```bash
npx create-expo-app --template with-nativewind
```

This initializes a complete Expo project with NativeWind and Tailwind CSS pre-configured.

### Step-by-Step Manual Setup

If you're adding NativeWind to an existing Expo project, follow these steps:

#### Step 1: Install Dependencies

Install NativeWind and its peer dependencies:

```bash
npm install nativewind react-native-reanimated react-native-safe-area-context
npm install --dev tailwindcss@^3.4.17 prettier-plugin-tailwindcss@0.5.11
```

**Dependency Versions (as of Feb 2026):**
- `nativewind`: ^4.2.2
- `tailwindcss`: ^3.4.17 (devDependency)
- `prettier-plugin-tailwindcss`: ^0.5.11 (devDependency)
- `react-native-reanimated`: ^4.2.2
- `react-native-safe-area-context`: ^4.0.0+

#### Step 2: Setup Tailwind CSS

Initialize Tailwind configuration:

```bash
npx tailwindcss init
```

This creates a `tailwind.config.js` file in your project root.

Configure the content paths (critical for Tailwind to find your components):

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

**Important Notes:**
- **content array:** Must include all files where you use Tailwind classes
- **Path patterns:** Use glob patterns to match your file structure
- **Failure mode:** If classes don't appear, check content paths first

#### Step 3: Create Global CSS File

Create a `global.css` file in your project root:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

**File Location:** Typically at project root or in `app/` directory

**Alternative locations:**
```
app/
├── global.css          ← Option 1: Root
├── styles/
│   └── global.css      ← Option 2: Styles folder
```

#### Step 4: Add Babel Preset

Configure Babel to use NativeWind's preset. Update or create `babel.config.js`:

```javascript
module.exports = function(api) {
  api.cache(true);
  return {
    presets: [
      ['babel-preset-expo', { jsxImportSource: 'nativewind' }],
      'nativewind/babel',
    ],
  };
};
```

**What This Does:**
- `jsxImportSource: 'nativewind'` enables the JSX transform for className support
- `nativewind/babel` registers NativeWind's style compilation hooks
- Required for build-time style optimization

#### Step 5: Configure Metro Bundler

Create or modify `metro.config.js` in your project root:

```javascript
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { withNativeWind } = require('nativewind/metro');

module.exports = withNativeWind(config, { input: './global.css' });
```

**What This Does:**
- Integrates NativeWind with Expo's Metro bundler
- `input` option specifies the path to your global CSS file
- Enables CSS processing and style compilation
- Must wrap your Metro config

**withNativeWind Options:**

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `input` | `string` | `undefined` | Path to the global CSS file |
| `disableTypeScriptGeneration` | `boolean` | `false` | Disable auto-generation of `nativewind-env.d.ts` |

**File Structure After This Step:**
```
project-root/
├── app.json
├── babel.config.js
├── metro.config.js          ← New
├── tailwind.config.js       ← New
├── global.css               ← New
├── package.json
└── app/
    └── index.js
```

#### Step 6: Import Global CSS

Import your CSS file in your app's root component (usually `app/index.js` or `app.js`):

```javascript
import './global.css';  // Must be at the very top

import { View, Text } from 'react-native';

export default function App() {
  return (
    <View className="flex-1 items-center justify-center bg-white">
      <Text className="text-xl font-bold">NativeWind Works!</Text>
    </View>
  );
}
```

**Important:** 
- Import must be **before** any other imports
- Should be in the same file as `AppRegistry.registerComponent()` or your root component
- **DO NOT** import in multiple files

#### Step 7: Update app.json

Ensure your `app.json` uses Metro as the bundler:

```json
{
  "expo": {
    "name": "my-app",
    "slug": "my-app",
    "version": "1.0.0",
    "assetBundlePatterns": [
      "**/*"
    ],
    "plugins": [
      "expo-router"
    ],
    "experiments": {
      "typedRoutes": true
    }
  }
}
```

The Metro bundler is the default for Expo projects, so usually no changes needed.

---

## Manual Setup for Framework-less React Native

If you're using React Native without Expo, the setup is similar but requires more manual configuration.

### Prerequisites
- React Native CLI
- Node.js LTS version
- Watchman (macOS) or Node.js build tools (Windows/Linux)

### Installation Steps

#### Step 1: Install Dependencies

```bash
npm install nativewind tailwindcss react-native-reanimated react-native-safe-area-context
```

#### Step 2: Initialize Tailwind

```bash
npx tailwindcss init
```

Edit `tailwind.config.js`:

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

#### Step 3: Create Global CSS

Create `global.css`:

```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```

#### Step 4: Configure Babel

Update `babel.config.js`:

```javascript
module.exports = {
  presets: ['module:metro-react-native-babel-preset', ['nativewind/babel']],
};
```

#### Step 5: Configure Metro

Create/update `metro.config.js`:

```javascript
const { getDefaultConfig } = require('metro-config');
const { withNativeWind } = require('nativewind/metro');

module.exports = withNativeWind(getDefaultConfig(__dirname), { input: './global.css' });
```

Or if using custom config:

```javascript
const { withNativeWind } = require('nativewind/metro');
const config = require('./metro.config');

module.exports = withNativeWind(config, { input: './global.css' });
```

#### Step 6: Handle CSS Processing

For web bundling (if using React Native Web):

```bash
npm install -D @tailwindcss/cli
```

Generate CSS:

```bash
npx tailwindcss -i ./global.css -o ./dist/output.css
```

#### Step 7: Import in Root Component

In your app entry point:

```javascript
import './global.css';

import { AppRegistry } from 'react-native';
import App from './App';

AppRegistry.registerComponent('MyApp', () => App);
```

---

## Tailwind CSS Configuration

### Minimal Configuration

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./app/**/*.{js,jsx,ts,tsx}'],
  theme: {
    extend: {},
  },
  plugins: [],
}
```

### Extended Configuration with Custom Theme

```javascript
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,jsx,ts,tsx}',
    './components/**/*.{js,jsx,ts,tsx}',
    './screens/**/*.{js,jsx,ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        primary: '#3498db',
        secondary: '#2ecc71',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
        serif: ['Georgia', 'serif'],
      },
      spacing: {
        '128': '32rem',
      },
    },
  },
  plugins: [
    require('@tailwindcss/container-queries'),
  ],
}
```

### Important Settings for React Native

```javascript
module.exports = {
  // ... other config
  corePlugins: {
    preflight: false, // Disable web resets
  },
  // Only include used utilities (critical for performance)
  safelist: [
    // Pre-include dynamic classes here if not in content
  ],
}
```

**Source:** https://www.nativewind.dev/docs/getting-started/installation

---

## TypeScript Setup

NativeWind extends React Native types via declaration merging. This setup is **optional but recommended** for type safety.

### Step 1: Create Type Declaration File

Create `nativewind-env.d.ts` in your project root:

```typescript
/// <reference types="nativewind" />
```

**Important Naming Rules:**
- ✅ Name it: `nativewind-env.d.ts`
- ❌ DO NOT name it: `nativewind.d.ts` (conflicts with package)
- ❌ DO NOT name it: `app.d.ts` (if you have `/app` folder)
- ❌ DO NOT name it: `react.d.ts` (if in node_modules)

### Step 2: TypeScript Configuration

Ensure your `tsconfig.json` includes type roots:

```json
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020"],
    "jsx": "react-native",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "moduleResolution": "node",
    "types": ["nativewind/native"],
  },
  "include": ["**/*.ts", "**/*.tsx"],
  "exclude": ["node_modules"]
}
```

### Step 3: Component Type Example

```typescript
import { View, Text } from 'react-native';

interface CardProps {
  title: string;
  children: React.ReactNode;
}

export const Card: React.FC<CardProps> = ({ title, children }) => {
  return (
    <View className="bg-white p-4 rounded-lg shadow-sm">
      <Text className="text-lg font-bold text-gray-900">{title}</Text>
      {children}
    </View>
  );
};
```

**Note:** Type support for `className` is automatic with `nativewind-env.d.ts`

---

## Editor Configuration

### VS Code Setup

#### 1. Install Tailwind CSS IntelliSense

Extension ID: `bradlc.vscode-tailwindcss`

```bash
# Command line install
code --install-extension bradlc.vscode-tailwindcss
```

Or install from Extensions marketplace in VS Code.

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

#### 3. Enable Class Completion

The extension should auto-detect your `tailwind.config.js`.

If not detected:
1. Open Command Palette (`Cmd+Shift+P`)
2. Type "Tailwind CSS: Show Output"
3. Check for errors
4. Verify `tailwind.config.js` path

### WebStorm/JetBrains IDE Setup

1. Go to **Settings** → **Languages & Frameworks** → **Tailwind CSS**
2. Enable Tailwind CSS support
3. Set configuration file path to `tailwind.config.js`
4. Enable code completion

### Cursor/Zed Setup

Most modern editors auto-detect Tailwind configuration. If not:

1. Create `tailwind.config.js` at project root
2. Restart the editor
3. Restart language server (if needed)

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
        NativeWind is Working! ✅
      </Text>
    </View>
  );
};
```

### Test 2: Test in App

Update your main app file:

```typescript
import './global.css';

import { HelloNativeWind } from './components/Hello';

export default function App() {
  return <HelloNativeWind />;
}
```

### Test 3: Run on Device/Simulator

```bash
# iOS
npm run ios

# Android
npm run android

# Web
npm run web
```

### Expected Result

You should see:
- ✅ White background
- ✅ Centered text
- ✅ Text "NativeWind is Working! ✅"
- ✅ Blue-colored text

If styles don't appear:

#### Troubleshooting Checklist

1. **Styles not appearing?**
   - [ ] Check `content` array in `tailwind.config.js`
   - [ ] Verify `global.css` is imported
   - [ ] Ensure Babel preset is added
   - [ ] Confirm Metro config uses `withNativewind`
   - [ ] Clear cache: `npm start -- --reset-cache`

2. **Build errors?**
   - [ ] Verify all peer dependencies are installed
   - [ ] Check `babel.config.js` syntax
   - [ ] Check `metro.config.js` syntax
   - [ ] Try reinstalling: `npm install && npm start -- --reset-cache`

3. **Type errors in TypeScript?**
   - [ ] Create `nativewind-env.d.ts` file
   - [ ] Verify TypeScript compiler includes it
   - [ ] Check `tsconfig.json` settings
   - [ ] Restart TypeScript server in editor

4. **IntelliSense not working?**
   - [ ] Install VS Code Tailwind CSS extension
   - [ ] Restart VS Code completely
   - [ ] Check extension output for errors

---

## Post-Installation

After successful setup, you're ready to:

1. **Learn Styling:** See `03-styling-system.md`
2. **Build Layouts:** See `04-layout-utilities.md`
3. **Responsive Design:** See `05-responsive-design.md`
4. **Best Practices:** See `11-best-practices.md`

---

## Related Documentation

- **Core Concepts:** `02-core-concepts.md` - Understand how NativeWind works
- **Styling System:** `03-styling-system.md` - Learn the className syntax
- **Troubleshooting:** `11-best-practices.md` - Debug common issues

---

## Version Information

- **NativeWind Version:** 4.2.2+
- **Tailwind CSS Version:** 3.4.17
- **Minimum Node Version:** 20
- **Last Updated:** February 2026

**Source:** https://www.nativewind.dev/docs/getting-started/installation
