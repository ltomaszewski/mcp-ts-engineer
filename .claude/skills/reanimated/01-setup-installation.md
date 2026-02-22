# Setup & Installation

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/
**Version:** react-native-reanimated ^4.2.2 | react-native-worklets ^0.7.x

---

## Overview

Reanimated 4.x requires the React Native New Architecture (Fabric). Apps on the old architecture must use Reanimated 3.x. Two packages are required: `react-native-reanimated` and `react-native-worklets`.

---

## Installation: Expo Projects

### Step 1: Install Packages

```bash
npx expo install react-native-reanimated react-native-worklets
```

### Step 2: Rebuild Native Code

```bash
npx expo prebuild --clean
```

Expo SDK 50+ includes the Worklets Babel plugin by default. No manual `babel.config.js` editing required for Expo.

### Step 3: Clear Metro Cache

```bash
npx expo start --clear
```

---

## Installation: React Native CLI Projects

### Step 1: Install Packages

```bash
npm install react-native-reanimated react-native-worklets
```

### Step 2: Configure Babel Plugin

```typescript
// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    // ... other plugins ...
    'react-native-worklets/plugin', // MUST be listed LAST
  ],
};
```

The `react-native-worklets/plugin` replaces the old `react-native-reanimated/plugin` from v3.

### Step 3: Platform Setup

**iOS:**
```bash
cd ios && pod install && cd ..
```

**Android:** No additional steps required.

**Web (react-native-web):**
```bash
npm install @babel/plugin-proposal-export-namespace-from
```

```typescript
// babel.config.js
module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    '@babel/plugin-proposal-export-namespace-from',
    'react-native-worklets/plugin', // Still last
  ],
};
```

### Step 4: Clear Metro Cache

```bash
npm start -- --reset-cache
```

---

## Version Compatibility

### Reanimated 4.2.x

| React Native | Supported |
|---|---|
| 0.80 | Yes |
| 0.81 | Yes |
| 0.82 | Yes |
| 0.83 | Yes |
| 0.84 | Yes |

**Required worklets version:** react-native-worklets ^0.7.x

### Reanimated 4.1.x

| React Native | Supported |
|---|---|
| 0.78 | Yes |
| 0.79 | Yes |
| 0.80 | Yes |
| 0.81 | Yes |

**Required worklets version:** react-native-worklets ^0.5.x or ^0.6.x or ^0.7.x

### Reanimated 4.0.x

| React Native | Supported |
|---|---|
| 0.78 | Yes |
| 0.79 | Yes |
| 0.80 | Yes |

**Required worklets version:** react-native-worklets ^0.4.x

---

## Migration from Reanimated 3.x to 4.x

### Architecture Requirement

Reanimated 4 supports only the New Architecture (Fabric). Legacy Architecture is dropped entirely.

### Babel Plugin Change

```typescript
// OLD (v3)
plugins: ['react-native-reanimated/plugin']

// NEW (v4)
plugins: ['react-native-worklets/plugin']
```

### New Dependency

Install `react-native-worklets` as a separate package. It was extracted from Reanimated for modularity.

### Renamed Functions

| v3 (Old) | v4 (New) | Notes |
|---|---|---|
| `runOnJS(fn)(args)` | `scheduleOnRN(fn, args)` | Arguments passed directly, not via second invocation |
| `runOnUI(fn)(args)` | `scheduleOnUI(fn, args)` | Same pattern change |
| `executeOnUIRuntimeSync` | `runOnUISync` | Same pattern change |
| `runOnRuntime` | `scheduleOnRuntime` | Same pattern change |
| `useScrollViewOffset` | `useScrollOffset` | Old name deprecated but still works |
| `makeShareableCloneRecursive` | `createSerializable` | Moved to react-native-worklets |

### Removed APIs

| Removed API | Replacement |
|---|---|
| `useAnimatedGestureHandler` | Gesture Handler v2 API (`Gesture.Pan()`, etc.) |
| `useWorkletCallback` | `useCallback` with `'worklet'` directive |
| `addWhitelistedNativeProps` | No-op in v4, remove all usages |
| `addWhitelistedUIProps` | No-op in v4, remove all usages |
| `combineTransition` | `EntryExitTransition.entering(X).exiting(Y)` |

### Spring Animation Default Changes

v4 changed default spring parameters significantly:

| Parameter | v3 Default | v4 Default |
|---|---|---|
| `damping` | `10` | `120` |
| `stiffness` | `100` | `900` |
| `mass` | `1` | `4` |
| `energyThreshold` | N/A (used `restSpeedThreshold`/`restDisplacementThreshold`) | `6e-9` |
| `duration` (spring) | N/A | `550` (perceptual) |
| `dampingRatio` | N/A | `1` (critically damped) |

For backward compatibility, import legacy defaults:
```typescript
import { Reanimated3DefaultSpringConfig } from 'react-native-reanimated';

offset.value = withSpring(100, Reanimated3DefaultSpringConfig);
```

### runOnJS to scheduleOnRN Migration Example

```typescript
// v3
const pan = Gesture.Pan().onEnd(() => {
  'worklet';
  runOnJS(handleDismiss)();
});

// v4
const pan = Gesture.Pan().onEnd(() => {
  'worklet';
  scheduleOnRN(handleDismiss);
});
```

---

## Verification

```typescript
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
} from 'react-native-reanimated';

export default function VerifyReanimated() {
  const rotation = useSharedValue(0);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const startAnimation = () => {
    rotation.value = withTiming(360, { duration: 1000 });
  };

  return <Animated.View style={animatedStyle} />;
}
```

If this component renders without errors, installation is successful.

---

## Common Installation Issues

| Issue | Symptom | Fix |
|---|---|---|
| Metro cache | `Cannot find module 'react-native-reanimated'` | `npm start -- --reset-cache` |
| iOS pods | `Pod not found` or linking errors | `cd ios && pod deintegrate && pod install` |
| Android Gradle | `Could not find com.swmansion.reanimated` | `cd android && ./gradlew clean` |
| Babel plugin order | Worklets not transformed | Ensure `react-native-worklets/plugin` is **last** in plugins |
| Old plugin name | `Cannot resolve react-native-reanimated/plugin` | Change to `react-native-worklets/plugin` |
| Missing worklets | `Cannot find module 'react-native-worklets'` | `npm install react-native-worklets` |

---

## Cross-References

- **Core shared values:** [02-core-shared-values.md](02-core-shared-values.md)
- **Troubleshooting:** [10-troubleshooting-faq.md](10-troubleshooting-faq.md)
- **Worklets deep dive:** [06-worklets-guide.md](06-worklets-guide.md)

---
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/ | https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/ | https://docs.swmansion.com/react-native-reanimated/docs/guides/compatibility/
