# React Native 0.83.4 -- Hermes Engine & Build Optimization

Hermes engine details, bytecode precompilation, ProGuard/R8, bundle analysis, and size reduction.

---

## Hermes Overview

Hermes is Meta's JavaScript engine optimized for React Native. It is the **default engine** in RN 0.83.4 -- no configuration needed.

### Performance Comparison

| Metric | Without Hermes | With Hermes | Improvement |
|--------|---------------|-------------|-------------|
| APK size (JS engine) | ~5 MB | ~2.5 MB | ~50% smaller |
| Startup time (TTI) | ~1000 ms | ~600 ms | ~40% faster |
| Memory usage | ~100 MB | ~70 MB | ~30% less |

### How Hermes Optimizes

- **Ahead-of-time bytecode compilation** -- JS compiled to bytecode at build time, not at runtime
- **No JIT compiler** -- smaller binary, predictable performance, no warmup
- **Optimized garbage collector** -- lower memory pressure, fewer pauses
- **Compact bytecode format** -- smaller bundle size on device

---

## Verify Hermes is Active

```typescript
import { View, Text } from 'react-native';

function HermesCheck(): React.ReactElement {
  const isHermes = (): boolean => !!global.HermesInternal;

  return (
    <View style={{ padding: 16 }}>
      <Text>Engine: {isHermes() ? 'Hermes' : 'JSC/V8'}</Text>
    </View>
  );
}
```

---

## JavaScriptCore Removal (RN 0.81+)

The built-in JavaScriptCore (JSC) was removed in React Native 0.81 and is not available in 0.83.4. If you need JSC:

```bash
npm install @react-native-community/javascriptcore
```

Most apps should stay on Hermes. JSC is only needed for specific debugging scenarios or library compatibility issues.

---

## Precompiled iOS Builds

RN 0.81+ introduced precompiled builds that can reduce iOS compile times by up to 10x.

Enable during pod install:

```bash
RCT_USE_RN_DEP=1 RCT_USE_PREBUILT_RNCORE=1 cd ios && pod install && cd ..
```

This feature was developed collaboratively by Expo and Meta.

---

## ProGuard/R8 (Android Release Builds)

Minify and shrink Android builds for production.

### Enable in build.gradle

```gradle
// android/app/build.gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

### ProGuard Rules

```proguard
# android/app/proguard-rules.pro

# React Native
-keep class com.facebook.react.** { *; }
-keep class com.facebook.hermes.** { *; }
-keep class com.facebook.jni.** { *; }

# Keep native methods
-keepclasseswithmembernames class * {
    native <methods>;
}

# Remove debug logging
-assumenosideeffects class android.util.Log {
    public static int d(...);
    public static int v(...);
    public static int i(...);
}

# Keep your app classes
-keep class com.myapp.** { *; }
```

---

## Bundle Size Analysis

### Generate Bundle

```bash
npx react-native bundle \
  --entry-file index.js \
  --platform android \
  --dev false \
  --bundle-output dist/main.bundle.js \
  --sourcemap-output dist/main.bundle.map
```

### Analyze with source-map-explorer

```bash
npm install --save-dev source-map-explorer
npx source-map-explorer dist/main.bundle.js dist/main.bundle.map
```

### Check APK Size

```bash
cd android && ./gradlew assembleRelease && cd ..
ls -lh android/app/build/outputs/apk/release/app-release.apk
```

---

## Size Reduction Strategies

### 1: Tree Shaking Imports

```typescript
// BAD -- imports entire library
import _ from 'lodash';
const result = _.debounce(fn, 300);

// GOOD -- imports only what's needed
import debounce from 'lodash/debounce';
const result = debounce(fn, 300);
```

### 2: Remove Unused Dependencies

```bash
npx depcheck  # Find unused dependencies
```

### 3: Optimize Images

- Use WebP format (30% smaller than PNG)
- Serve appropriate resolution per device density
- Use `Image.getSize()` to verify dimensions match display size
- Consider on-demand loading for image-heavy screens

### 4: Analyze and Reduce node_modules

```bash
npm ls --depth=0          # List direct dependencies
du -sh node_modules/*/ | sort -hr | head -20   # Largest packages
```

### 5: Enable Hermes Bytecode (Default)

Hermes compiles JS to bytecode at build time. The `.hbc` (Hermes bytecode) files in the bundle are smaller and parse faster than raw JS.

---

## Startup Time Optimization

### Reduce JS Bundle Parse Time

- Hermes bytecode eliminates parse time (already compiled)
- Use `require()` lazy loading for rarely-used screens
- Defer non-critical initialization with `InteractionManager`

### Lazy Screen Loading

```typescript
import { lazy, Suspense } from 'react';
import { ActivityIndicator } from 'react-native';

const SettingsScreen = lazy(() => import('./screens/SettingsScreen'));

function SettingsRoute(): React.ReactElement {
  return (
    <Suspense fallback={<ActivityIndicator size="large" />}>
      <SettingsScreen />
    </Suspense>
  );
}
```

### Startup Profiling

```bash
# Android: measure startup
adb shell am start -W com.myapp/.MainActivity

# Output includes:
# TotalTime: total time to display first frame
# WaitTime: time waiting for activity to launch
```

---

## Memory Monitoring

### Runtime Checks

```typescript
if (__DEV__) {
  // Log memory in development
  const memInfo = (global as any).HermesInternal?.getRuntimeProperties?.();
  if (memInfo) {
    console.log('Hermes Memory:', memInfo);
  }
}
```

### Common Memory Issues

| Issue | Cause | Fix |
|-------|-------|-----|
| Growing memory | Event listeners not cleaned up | Return cleanup from useEffect |
| Image memory spikes | Large images loaded simultaneously | Use `Image.prefetch`, lazy load |
| List memory | FlatList without `removeClippedSubviews` | Enable on Android |
| Closure leaks | Captured variables in long-lived closures | Use refs or WeakRef |

---

## Production Build Checklist

- [ ] Hermes enabled (default -- just verify)
- [ ] ProGuard/R8 enabled for Android release
- [ ] `__DEV__` checks guard debug-only code
- [ ] No `console.log` in production
- [ ] Source maps generated for crash reporting
- [ ] Bundle size analyzed and optimized
- [ ] Startup time measured on real devices
- [ ] Release build tested on low-end Android device

---

**Version:** React Native 0.83.4 | Hermes (default engine)
**Source:** https://reactnative.dev/docs/hermes | https://hermesengine.dev
