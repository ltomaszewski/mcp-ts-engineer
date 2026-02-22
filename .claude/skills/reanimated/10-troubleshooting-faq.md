# Troubleshooting and FAQ

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting/

---

## Overview

Quick solutions to common Reanimated 4.x errors, build issues, and platform-specific problems.

---

## Installation and Build Issues

### Metro Bundler Cache Errors

**Symptom:**
```
Cannot find module 'react-native-reanimated'
Invariant Violation: Native module could not be found
```

**Fix:**
```bash
# Clear Metro cache
npm start -- --reset-cache

# Nuclear option: clear everything
rm -rf node_modules && npm install
npm start -- --reset-cache
```

---

### iOS Pod Installation Fails

**Symptom:** `Pod not found`, linking errors, `ld: library not found for -lreanimated`

**Fix:**
```bash
cd ios && pod deintegrate && pod install && cd ..

# For Expo:
rm -rf ios
npx expo prebuild --clean
```

---

### Android Gradle Build Fails

**Symptom:** `Could not find com.swmansion.reanimated`, Gradle sync errors

**Fix:**
```bash
cd android && ./gradlew clean && cd ..
npx react-native run-android
```

---

### Babel Plugin Not Applied

**Symptom:** Worklets not transformed, animations run on JS thread, sluggish performance

**Check:** The plugin must be LAST in the array.

```typescript
// babel.config.js
module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    // other plugins...
    'react-native-worklets/plugin', // MUST be last
  ],
};
```

**Common mistake:** Still using old `react-native-reanimated/plugin` from v3. Change to `react-native-worklets/plugin`.

---

### Missing react-native-worklets

**Symptom:** `Cannot find module 'react-native-worklets'`

**Fix:**
```bash
npm install react-native-worklets
# Then rebuild native
npx expo prebuild --clean  # Expo
cd ios && pod install       # CLI
```

---

## Animation Issues

### Animations Not Starting

**Cause 1:** Shared value not connected to a component via `useAnimatedStyle`.

```typescript
// BAD: Shared value exists but not used in animated style
const opacity = useSharedValue(1);
return <View style={{ opacity: 0.5 }} />;

// GOOD: Connected via useAnimatedStyle
const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));
return <Animated.View style={animatedStyle} />;
```

**Cause 2:** Animated style passed to regular component.

```typescript
// BAD: Regular View ignores animated styles
<View style={animatedStyle} />

// GOOD: Use Animated.View
<Animated.View style={animatedStyle} />
```

**Cause 3:** Animating to current value.

```typescript
const opacity = useSharedValue(0);
opacity.value = withTiming(0); // Already 0, no visible animation
opacity.value = withTiming(1); // Animates from 0 to 1
```

---

### Animation Infinite Loop / Freeze

**Symptom:** App freezes, shared value keeps changing, UI unresponsive.

**Cause:** Mutating shared value inside `useAnimatedStyle`.

```typescript
// BAD: Causes infinite loop
const style = useAnimatedStyle(() => {
  opacity.value = withTiming(0); // Mutation triggers re-evaluation!
  return { opacity: opacity.value };
});

// GOOD: Read only in style, mutate in handlers
const style = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));
const hide = () => { opacity.value = withTiming(0); };
```

---

### Animation Jitters / FPS Drops

**Cause 1:** Heavy computation in worklet.

```typescript
// BAD: Complex operation every frame
const style = useAnimatedStyle(() => {
  const parsed = JSON.parse(someString); // Expensive!
  return { opacity: opacity.value };
});

// GOOD: Precompute
const parsed = useMemo(() => JSON.parse(someString), [someString]);
```

**Cause 2:** Too many concurrent animations (especially on web).

**Cause 3:** Gesture event flooding. Throttle high-frequency updates if needed.

---

## Thread and Runtime Issues

### "Function is not a worklet"

**Symptom:** `Error: Function is not a worklet`, `scheduleOnUI callback not a worklet`

**Fix:** Add `'worklet'` directive.

```typescript
// BAD
function myFunction() {
  console.log('Hello');
}
scheduleOnUI(myFunction); // Error!

// GOOD
function myFunction() {
  'worklet';
  console.log('Hello');
}
scheduleOnUI(myFunction);
```

---

### "Cannot find function in schedule scope"

**Symptom:** `scheduleOnRN` crash, function undefined on JS thread.

**Fix:** Define the callback in component scope (JS thread), not inside a worklet.

```typescript
// BAD: Function defined inside worklet
const pan = Gesture.Pan().onEnd(() => {
  'worklet';
  const localFn = () => console.log('bad');
  scheduleOnRN(localFn); // CRASH

});

// GOOD: Function defined in component scope
function Component() {
  const handleDone = () => console.log('done');

  const pan = Gesture.Pan().onEnd(() => {
    'worklet';
    scheduleOnRN(handleDone); // OK
  });
}
```

---

### Reading Shared Value During Render

**Symptom:** Stale value, console.log shows outdated number.

```typescript
// BAD: Reading during render
function Component() {
  const sv = useSharedValue(0);
  console.log(sv.value); // Stale, not reactive

  // GOOD: Read in useEffect
  useEffect(() => {
    console.log(sv.value);
  }, []);

  // GOOD: Read in useAnimatedStyle
  const style = useAnimatedStyle(() => ({
    opacity: sv.value,
  }));
}
```

---

## Gesture Issues

### Gestures Not Working on Android

**Symptom:** Tap/Pan gestures not responding on Android. Works on iOS.

**Fix:** Wrap app with `GestureHandlerRootView`.

```typescript
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* App */}
    </GestureHandlerRootView>
  );
}
```

---

### Using Removed API: useAnimatedGestureHandler

**Symptom:** Import error or deprecation warning.

**Fix:** Migrate to Gesture Handler v2 API.

```typescript
// OLD (removed in v4)
const handler = useAnimatedGestureHandler({
  onStart: (e, ctx) => { ctx.startX = translateX.value; },
  onActive: (e, ctx) => { translateX.value = ctx.startX + e.translationX; },
});

// NEW (v4)
const contextX = useSharedValue(0);
const pan = Gesture.Pan()
  .onStart(() => { contextX.value = translateX.value; })
  .onUpdate((e) => { translateX.value = contextX.value + e.translationX; });
```

---

## Layout Animation Issues

### Entering/Exiting Animations Not Playing

**Check 1:** Component must be conditionally rendered (mount/unmount).

```typescript
// This triggers entering/exiting
{visible && <Animated.View entering={FadeIn} exiting={FadeOut} />}

// This does NOT (component always mounted)
<Animated.View
  entering={FadeIn}
  style={{ display: visible ? 'flex' : 'none' }}
/>
```

**Check 2:** Custom entering/exiting animations not supported on web.

---

### LayoutAnimationConfig Not Working

**Check:** `LayoutAnimationConfig` with `skipEntering`/`skipExiting` is NOT supported on web. Only Android and iOS.

---

## Accessibility Issues

### Animations Ignore Reduce Motion Setting

**Fix:** Use `ReduceMotion.System` (default) or check with `useReducedMotion()`.

```typescript
import { useReducedMotion, ReduceMotion, withTiming } from 'react-native-reanimated';

// Option 1: Check hook
const reduced = useReducedMotion();
const duration = reduced ? 0 : 300;

// Option 2: Use reduceMotion parameter (automatic)
opacity.value = withTiming(0, {
  duration: 300,
  reduceMotion: ReduceMotion.System, // Already default
});
```

---

## Web-Specific Issues

### Performance Poor on Web

Web has no separate UI thread. Limit concurrent animations.

```typescript
import { Platform } from 'react-native';

const maxAnimations = Platform.OS === 'web' ? 5 : 20;
items.slice(0, maxAnimations).forEach((item) => {
  item.value = withTiming(1);
});
```

### Scroll Handler Events Missing on Web

Only `onScroll` is supported on web. `onBeginDrag`, `onEndDrag`, `onMomentumBegin`, `onMomentumEnd` are native-only.

---

## Debug Checklist

Before filing an issue, verify:

- [ ] Using `Animated.View` (not regular `View`)
- [ ] Shared values connected via `useAnimatedStyle`
- [ ] Not mutating shared values in `useAnimatedStyle`
- [ ] `GestureHandlerRootView` wraps app (Android)
- [ ] Babel plugin is `react-native-worklets/plugin` and listed LAST
- [ ] `react-native-worklets` installed
- [ ] Metro cache cleared
- [ ] No `runOnJS`/`runOnUI` (use `scheduleOnRN`/`scheduleOnUI`)
- [ ] No `useAnimatedGestureHandler` (use Gesture v2 API)
- [ ] `scheduleOnRN` callbacks defined in JS scope
- [ ] Components conditionally rendered for entering/exiting animations
- [ ] Using New Architecture (Fabric)

---

## Getting Help

- **Official docs:** https://docs.swmansion.com/react-native-reanimated/
- **GitHub issues:** https://github.com/software-mansion/react-native-reanimated/issues
- **Troubleshooting guide:** https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting/

When filing issues, include:
1. Minimal reproducible example
2. Exact error message and stack trace
3. Platform (iOS/Android/Web)
4. `npm list react-native-reanimated react-native-worklets react-native`
5. Steps to reproduce

---

## Cross-References

- **Setup and migration:** [01-setup-installation.md](01-setup-installation.md)
- **Best practices:** [09-best-practices.md](09-best-practices.md)
- **Worklets:** [06-worklets-guide.md](06-worklets-guide.md)
- **Gestures:** [07-gestures-events.md](07-gestures-events.md)

---
**Source:** https://docs.swmansion.com/react-native-reanimated/docs/guides/troubleshooting/ | https://docs.swmansion.com/react-native-reanimated/docs/guides/migration-from-3.x/
