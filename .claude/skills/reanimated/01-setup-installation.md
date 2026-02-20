# Setup & Installation (Reanimated 4.2.1)

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/  
**Version:** 4.2.1  
**Architecture:** React Native New Architecture (Fabric) required

---

## 📋 Overview

Reanimated 4.x requires the React Native New Architecture (Fabric). If your app uses the old architecture, use Reanimated 3.x instead. This module covers installation for both Expo and React Native CLI projects.

**Key Dependencies:**
- `react-native-reanimated` — Main library
- `react-native-worklets` — Worklet runtime (separated for modularity)
- Babel plugins for worklet transformation

---

## 🚀 Installation: Expo Projects

### Step 1: Install Packages

```bash
# npm
npm install react-native-reanimated react-native-worklets

# yarn
yarn add react-native-reanimated react-native-worklets
```

### Step 2: Rebuild Native Code

```bash
# npm
npx expo prebuild

# yarn
yarn expo prebuild
```

**Note:** Expo SDK 50+ includes the Worklets Babel plugin by default. No manual babel.config.js editing required.

### Step 3: Clear Cache (Recommended)

```bash
# npm
npm start -- --reset-cache

# yarn
yarn start --reset-cache
```

### Verification

Test by importing:
```javascript
import { useSharedValue, useAnimatedStyle } from 'react-native-reanimated';

console.log('✅ Reanimated installed successfully');
```

---

## 🛠️ Installation: React Native CLI Projects

### Step 1: Install Packages

```bash
npm install react-native-reanimated react-native-worklets
```

### Step 2: Configure Babel Plugin

**File:** `babel.config.js`

```javascript
/** @type {import('react-native-worklets/plugin').PluginOptions} */
const workletsPluginOptions = {
  // Your custom options here (optional)
};

module.exports = {
  presets: [
    // ... your other presets
  ],
  plugins: [
    // ... other plugins
    ['react-native-worklets/plugin', workletsPluginOptions],
    // ⚠️ MUST be listed last
  ],
};
```

**Critical:** `react-native-worklets/plugin` must be the **last plugin** in the array.

### Step 3: Platform-Specific Setup

#### iOS

```bash
cd ios && pod install && cd ..
```

**Why:** Install native pods before first build to ensure all dependencies are linked correctly.

#### Android

No additional steps required. Native setup is handled automatically.

#### Web (react-native-web / Next.js)

```bash
npm install @babel/plugin-proposal-export-namespace-from
```

**Update babel.config.js:**

```javascript
module.exports = {
  presets: [
    // ...
  ],
  plugins: [
    '@babel/plugin-proposal-export-namespace-from',
    ['react-native-worklets/plugin', workletsPluginOptions],
    // react-native-worklets/plugin must remain last
  ],
};
```

### Step 4: Clear Cache

```bash
npm start -- --reset-cache
```

For Yarn:
```bash
yarn start --reset-cache
```

---

## 📋 Installation Checklist

- [ ] `react-native-reanimated` installed via npm/yarn
- [ ] `react-native-worklets` installed via npm/yarn
- [ ] Babel config updated with `react-native-worklets/plugin`
- [ ] Plugin is **last** in plugins array
- [ ] `npx expo prebuild` run (Expo) OR `cd ios && pod install` (CLI + iOS)
- [ ] Metro/Expo cache cleared with `--reset-cache`
- [ ] Import test succeeds without errors
- [ ] Device/emulator shows no build errors

---

## ⚙️ Worklets Babel Plugin Options

The `react-native-worklets/plugin` supports custom configuration:

```javascript
const workletsPluginOptions = {
  // Example options (check docs for full list)
  // Most projects can use empty object: {}
};
```

**When to customize:** Only if you need advanced worklet behavior; defaults work for most use cases.

---

## 🔧 Common Installation Issues

### Issue: Metro Bundler Cache Conflicts

**Symptom:** Import errors after installation despite correct setup.

**Solution:**
```bash
npm start -- --reset-cache
# or
yarn start --reset-cache
```

### Issue: iOS Build Fails After Installation

**Symptom:** `Pod not found` or linking errors on iOS.

**Solution:**
```bash
cd ios && pod deintegrate && pod install && cd ..
```

### Issue: Web Build Fails (react-native-web)

**Symptom:** Babel transformation errors on web target.

**Solution:** Ensure `@babel/plugin-proposal-export-namespace-from` is installed and `react-native-worklets/plugin` is listed **last** in plugins.

### Issue: Android Build Fails

**Symptom:** Gradle sync errors or module not found.

**Solution:**
```bash
# Clean and rebuild
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

---

## 📦 Version Compatibility Matrix

| Reanimated | React Native | Architecture | Status |
|---|---|---|---|
| **4.x** | 0.73+ | **Fabric (New)** | ✅ Recommended |
| **3.x** | 0.70+ | Old or New | ✅ Legacy support |
| **2.x** | 0.60+ | Old only | 🚫 Deprecated |

---

## 🎯 Verification Script

Create `testReanimated.js` to verify installation:

```javascript
import { 
  useSharedValue, 
  useAnimatedStyle, 
  withTiming 
} from 'react-native-reanimated';

export default function VerifyReanimated() {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const startAnimation = () => {
    rotation.value = withTiming(360, { duration: 1000 });
  };

  console.log('✅ Reanimated hooks available');
  console.log('✅ Animations ready to use');

  return null;
}
```

If this component loads without errors, your installation is successful.

---

## 🔗 Cross-References

- **Next Steps:** See [02-core-shared-values.md](./02-core-shared-values.md) to start using Reanimated
- **Troubleshooting:** See [10-troubleshooting-faq.md](./10-troubleshooting-faq.md) for build-specific issues
- **Worklets Deep Dive:** See [06-worklets-guide.md](./06-worklets-guide.md)

---

## 📚 Official Resources

- **Getting Started Guide:** https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/
- **Worklets Babel Plugin:** https://docs.swmansion.com/react-native-reanimated/docs/guides/worklets/
- **Web Support Guide:** https://docs.swmansion.com/react-native-reanimated/docs/guides/web-support/
- **GitHub Examples:** https://github.com/software-mansion/react-native-reanimated/tree/main/apps

---

**Last Updated:** December 2024  
**Verified For:** Reanimated 4.2.1
