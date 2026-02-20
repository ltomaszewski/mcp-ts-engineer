# React Native 0.83 - Hermes Engine & Build Optimization

**Performance benefits, setup, and bundle size analysis**

---

## 🎯 Hermes Overview

Hermes is an optimized JavaScript engine for React Native, developed by Meta.

### Benefits

| Aspect | V8 | Hermes | Improvement |
|--------|-----|--------|------------|
| **APK Size** | ~5MB | ~2.5MB | 50% smaller |
| **Startup Time** | ~1000ms | ~600ms | 40% faster |
| **Memory Usage** | 100MB | 70MB | 30% less |
| **JS Execution** | Standard | Optimized | 5-15% faster |

### When to Use

✅ **Use Hermes for:**
- Production apps (significant size/performance benefit)
- Android apps (most benefit on Android)
- Apps with limited device specs
- Apps sensitive to startup time

⚠️ **Consider V8 for:**
- Development with Chrome DevTools
- Complex debugging scenarios
- Specific library requirements

---

## 🔧 Enable Hermes on Android

### Step 1: Edit build.gradle

```gradle
// android/app/build.gradle

project.ext.react = [
    enableHermes: true,  // Add this line
    enableFlipper: true,
    // ... other config
]
```

### Step 2: Clean and Rebuild

```bash
# Clean previous build
cd android
./gradlew clean
cd ..

# Reset Metro cache
npm start -- --reset-cache

# Rebuild
npm run android
```

### Step 3: Verify Hermes

Check if Hermes is running:

```typescript
import { View, Text } from 'react-native';

const HermesDetector = () => {
  const isHermes = () => !!global.HermesInternal;

  return (
    <View>
      <Text>Using Hermes: {isHermes() ? 'Yes' : 'No'}</Text>
    </View>
  );
};
```

---

## 🍎 Enable Hermes on iOS

### Step 1: Edit Podfile

```ruby
# ios/Podfile

target 'MyApp' do
  config = use_native_modules!

  use_react_native!(
    :path => config[:reactNativePath],
    :hermes_enabled => true  # Add this line
  )
end
```

### Step 2: Install Pods

```bash
cd ios
rm -rf Pods Podfile.lock
pod install
cd ..
```

### Step 3: Rebuild

```bash
npm start -- --reset-cache
npm run ios
```

---

## 📦 ProGuard/R8 Configuration (Android)

Minify and shrink Android build size.

### Step 1: Enable Minification

```gradle
// android/app/build.gradle

buildTypes {
    release {
        minifyEnabled true        // Enable minification
        shrinkResources true      // Remove unused resources
        proguardFiles getDefaultProguardFile(
            'proguard-android-optimize.txt'
        ), 'proguard-rules.pro'
    }
}
```

### Step 2: Configure Proguard Rules

Create `android/app/proguard-rules.pro`:

```proguard
# Keep React Native classes
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }

# Keep your app classes
-keep class com.myapp.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Remove logging
-assumenosideeffects class android.util.Log {
    public static *** d(...);
    public static *** v(...);
    public static *** i(...);
}
```

---

## 📊 Bundle Size Analysis

### Analyze Android APK

```bash
# Build release APK
cd android
./gradlew bundleRelease
cd ..

# Check APK size
ls -lh android/app/build/outputs/apk/release/

# Extract and analyze
unzip android/app/build/outputs/apk/release/app-release.apk -d apk-analysis
du -sh apk-analysis/*
```

### Analyze JavaScript Bundle

```bash
# Generate bundle analysis
react-native bundle \
  --entry-file index.js \
  --platform android \
  --dev false \
  --bundle-output dist/main.bundle.js \
  --sourcemap-output dist/main.bundle.map

# Check bundle size
ls -lh dist/main.bundle.js

# Use source-map-explorer for detailed analysis
npm install --save-dev source-map-explorer
source-map-explorer 'dist/main.bundle.js' 'dist/main.bundle.map'
```

---

## 🎯 Size Reduction Strategies

### 1. Code Splitting

```typescript
// Split large screens into separate bundles
import { lazy, Suspense } from 'react';

const ProfileScreen = lazy(() => import('./screens/ProfileScreen'));

<Suspense fallback={<Loading />}>
  <ProfileScreen />
</Suspense>
```

### 2. Remove Unused Dependencies

```bash
# Find unused packages
npm audit --production

# Analyze bundle
npm install --save-dev webpack-bundle-analyzer

# List dependencies
npm ls --depth=0
```

### 3. Optimize Images

```bash
# Use appropriate formats and sizes
# Before: 1MB PNG
# After: 200KB WebP at correct resolution

# Use Image.resolveAssetSource() for dimension detection
import { Image } from 'react-native';

Image.getSize(
  uri,
  (width, height) => {
    // Adjust to device resolution
  }
);
```

### 4. Tree Shaking

Ensure your dependencies support tree shaking:

```typescript
// ❌ WRONG - Imports entire library
import * as lodash from 'lodash';

// ✅ CORRECT - Imports specific function (tree-shakeable)
import { debounce } from 'lodash-es';
```

---

## 📈 Performance Metrics

### Measure Startup Time

```typescript
import { PerformanceObserver, performance } from 'react-native';

const logPerformance = () => {
  // TTI: Time to Interactive
  const navigationStart = performance.now();
  console.log('TTI:', navigationStart);

  // React render time
  const observer = new PerformanceObserver((list) => {
    for (const entry of list.getEntries()) {
      console.log(`${entry.name}: ${entry.duration}ms`);
    }
  });

  observer.observe({ entryTypes: ['measure'] });
};
```

### Monitor Memory

```typescript
import { DeviceEventEmitter } from 'react-native';

const logMemory = () => {
  DeviceEventEmitter.addListener('memoryWarning', () => {
    console.warn('Memory warning received');
  });
};
```

---

## 🔍 Comparison: Hermes vs V8 vs JavaScriptCore

| Feature | JavaScriptCore (iOS) | V8 (Android) | Hermes (Both) |
|---------|-----|-----|-----|
| **Bundle Size** | N/A | Large | Small |
| **Startup** | Slow | Medium | Fast |
| **Memory** | High | Medium | Low |
| **Debugging** | Limited | Chrome DevTools | Limited |
| **JIT Compilation** | No | Yes | No |

---

## ✅ Optimization Checklist

Before production release:

- [ ] Hermes enabled on Android
- [ ] ProGuard/R8 minification enabled
- [ ] Unused code removed
- [ ] Large images optimized
- [ ] Code splitting configured (if needed)
- [ ] Tree shaking verified
- [ ] Bundle size < 5MB (with Hermes)
- [ ] Startup time < 2 seconds
- [ ] Memory usage monitored
- [ ] Release builds tested on real device

---

**Source**: https://hermesengine.dev/
**Version**: React Native 0.83
**Last Updated**: December 2025
