# Troubleshooting & FAQ

**Source:** https://docs.swmansion.com/react-native-reanimated/docs/  
**Version:** 4.2.1  
**Category:** Debugging | Common Issues

---

## 📋 Overview

Quick solutions to common Reanimated errors, performance issues, and platform-specific problems.

---

## 🔧 Installation & Build Issues

### Issue: Metro Bundler Cache Errors

**Symptoms:**
```
Cannot find module 'react-native-reanimated'
Invariant Violation: Native module could not be found
```

**Solutions:**
```bash
# Clear cache completely
npm start -- --reset-cache
yarn start --reset-cache

# Also try clearing node_modules
rm -rf node_modules && npm install
npm start -- --reset-cache
```

---

### Issue: iOS Pod Installation Fails

**Symptoms:**
```
ld: library not found for -lreanimated
Pod install fails
```

**Solutions:**
```bash
# Clean and reinstall pods
cd ios
pod deintegrate
pod install
cd ..

# For Expo projects:
rm -rf ios
npx expo prebuild --clean

# Rebuild Xcode build folder:
cd ios && xcodebuild clean -workspace . -scheme YourApp && cd ..
```

---

### Issue: Android Build Gradle Sync Error

**Symptoms:**
```
Could not find com.swmansion.reanimated:react-native-reanimated
Gradle sync failed
```

**Solutions:**
```bash
# Clean gradle cache
cd android
./gradlew clean
cd ..

# Rebuild
npx react-native run-android

# If still failing, check gradle.properties:
# - Ensure proper React Native version
# - Update gradle wrapper if needed
```

---

### Issue: Babel Plugin Not Applied

**Symptoms:**
```
Worklet functions not being transformed
Animation code seems to execute on JS thread
```

**Check:**
```javascript
// babel.config.js
module.exports = {
  plugins: [
    // ❌ WRONG: Plugin listed first
    ['react-native-worklets/plugin', {}],
    '@babel/plugin-transform-react-jsx',
    
    // ✅ CORRECT: Plugin listed last
    '@babel/plugin-transform-react-jsx',
    ['react-native-worklets/plugin', {}],
  ],
};
```

**Solution:**
```javascript
// Ensure react-native-worklets/plugin is LAST
const workletsOptions = {};

module.exports = {
  presets: ['babel-preset-expo'],
  plugins: [
    ['@babel/plugin-proposal-decorators', { legacy: true }],
    // ... other plugins ...
    ['react-native-worklets/plugin', workletsOptions], // Must be last!
  ],
};
```

---

## 🎬 Animation Issues

### Issue: Animations Not Starting

**Symptoms:**
```javascript
opacity.value = withTiming(0); // Nothing happens
```

**Possible Causes & Solutions:**

1. **Shared value not connected to component:**
```javascript
// ❌ WRONG: Created but not used
const opacity = useSharedValue(1);
return <View style={{ opacity: 0.5 }} />; // Static value

// ✅ CORRECT: Use in useAnimatedStyle
const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));
return <Animated.View style={animatedStyle} />;
```

2. **Animated component not wrapped:**
```javascript
// ❌ WRONG: Regular View won't animate
<View style={animatedStyle} />

// ✅ CORRECT: Use Animated.View
<Animated.View style={animatedStyle} />
```

3. **Animation value already at target:**
```javascript
// ❌ WRONG: Animating to current value
const opacity = useSharedValue(0);
opacity.value = withTiming(0); // Already 0, no animation

// ✅ CORRECT: Animate to different value
opacity.value = withTiming(1); // Animates from 0 to 1
```

---

### Issue: Animation Freezes or Jitters

**Symptoms:**
```
Animation stutters, FPS drops below 60
```

**Possible Causes & Solutions:**

1. **Heavy computation in worklet:**
```javascript
// ❌ BAD: Complex calculation every frame
const animatedStyle = useAnimatedStyle(() => {
  const expensive = JSON.parse(JSON.stringify(data)); // Slow!
  return { opacity: opacity.value };
});

// ✅ GOOD: Precompute outside
const processed = useMemo(() => process(data), [data]);
const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));
```

2. **Too many animations:**
```javascript
// ❌ AVOID: 100+ concurrent animations
for (let i = 0; i < 100; i++) {
  items[i].value = withTiming(1);
}

// ✅ BETTER: Stagger or limit count
items.slice(0, 10).forEach(item => {
  item.value = withTiming(1);
});
```

3. **Gesture handler event flooding:**
```javascript
// ✅ GOOD: Debounce high-frequency updates
const pan = Gesture.Pan()
  .onUpdate((e) => {
    'worklet';
    if (e.translationX % 10 === 0) { // Sample every 10px
      position.value = e.translationX;
    }
  });
```

---

### Issue: Animation Loops Infinitely

**Symptoms:**
```
Shared value mutation in useAnimatedStyle causing infinite updates
```

**Solution:**
```javascript
// ❌ WRONG: Mutating inside useAnimatedStyle
const animatedStyle = useAnimatedStyle(() => {
  opacity.value = withTiming(0); // ⚠️ Causes infinite loop!
  return { opacity: opacity.value };
});

// ✅ CORRECT: Mutate in event handlers only
const animatedStyle = useAnimatedStyle(() => ({
  opacity: opacity.value,
}));

const handlePress = () => {
  opacity.value = withTiming(0); // Mutate here
};
```

---

## 🧵 Thread & Runtime Issues

### Issue: "Cannot access shared value on JS thread"

**Symptoms:**
```
TypeError: Cannot read property 'value' of undefined
Error: Shared value is not accessible
```

**Solution:**
```javascript
// ❌ WRONG: Reading during render
function Component() {
  const sv = useSharedValue(0);
  console.log(sv.value); // ⚠️ Reading during render

  return null;
}

// ✅ CORRECT: Read in useEffect or useAnimatedStyle
function Component() {
  const sv = useSharedValue(0);

  useEffect(() => {
    console.log(sv.value); // ✅ OK in effect
  }, []);

  const style = useAnimatedStyle(() => {
    console.log(sv.value); // ✅ OK in worklet
    return { opacity: sv.value };
  });

  return <Animated.View style={style} />;
}
```

---

### Issue: "Function is not a worklet"

**Symptoms:**
```
Error: Function is not a worklet
scheduleOnUI callback not a worklet
```

**Solution:**
```javascript
// ❌ WRONG: Missing 'worklet' directive
function myFunction() {
  console.log('Hello');
}
scheduleOnUI(myFunction);

// ✅ CORRECT: Add 'worklet' directive
function myFunction() {
  'worklet';
  console.log('Hello');
}
scheduleOnUI(myFunction);
```

---

### Issue: "Cannot find function in schedule scope"

**Symptoms:**
```
scheduleOnRN trying to call undefined function
Function not found in RN Runtime
```

**Solution:**
```javascript
// ❌ WRONG: Function defined inside worklet
const handler = () => {
  'worklet';
  const myFunc = () => { /* ... */ };
  scheduleOnRN(myFunc); // ❌ myFunc not in RN scope
};

// ✅ CORRECT: Function defined in component scope (JS thread)
function Component() {
  const myFunc = () => { /* ... */ }; // ✅ JS thread scope

  const handler = () => {
    'worklet';
    scheduleOnRN(myFunc); // ✅ Can call JS thread function
  };

  return null;
}
```

---

## 👆 Gesture Handler Issues

### Issue: Gestures Not Triggered (Android)

**Symptoms:**
```
Tap/Pan gestures not working on Android
Events not firing
```

**Solution:**
```javascript
// ✅ REQUIRED on Android: Wrap with GestureHandlerRootView
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* Your app */}
    </GestureHandlerRootView>
  );
}
```

---

### Issue: Context Object Undefined

**Symptoms:**
```
context.startX is undefined in onActive
```

**Solution:**
```javascript
// ✅ CORRECT: Initialize context in onStart
const handler = useAnimatedGestureHandler({
  onStart: (event, context) => {
    'worklet';
    context.startX = position.value; // Initialize
  },
  onActive: (event, context) => {
    'worklet';
    // Now context.startX is available
    position.value = context.startX + event.translationX;
  },
});
```

---

## ♿ Accessibility Issues

### Issue: Animations Don't Respect Reduce Motion

**Symptoms:**
```
Animations still play when device has reduce motion enabled
```

**Solution:**
```javascript
import { useReducedMotion } from 'react-native-reanimated';

function MyComponent() {
  const reduceMotion = useReducedMotion();

  const duration = reduceMotion ? 0 : 300;

  const opacity = useSharedValue(1);
  opacity.value = withTiming(0, { duration });

  return null;
}

// Or use reduceMotion parameter:
opacity.value = withTiming(0, {
  duration: 300,
  reduceMotion: ReduceMotion.System, // Respects device setting
});
```

---

## 🌐 Web-Specific Issues

### Issue: "localStorage is not available"

**Symptoms:**
```
SecurityError: access is denied for this document
localStorage/sessionStorage not working
```

**Solution:**
```javascript
// ❌ WRONG: Using browser storage
localStorage.setItem('key', 'value'); // ❌ SecurityError in sandbox

// ✅ CORRECT: Use shared values
const persistedValue = useSharedValue('default');
// Or use AsyncStorage (React Native)
```

---

### Issue: Web Animation Performance Poor

**Symptoms:**
```
FPS drops on web, animations stutter
```

**Solution:**
```javascript
// ✅ GOOD: Reduce number of concurrent animations
const opacity = useSharedValue(1);
opacity.value = withTiming(0); // Single animation

// ❌ BAD: Too many animations
for (let i = 0; i < 50; i++) {
  values[i].value = withTiming(1); // Too many on web
}

// ✅ GOOD: Limit concurrent animations on web
if (Platform.OS === 'web') {
  for (let i = 0; i < 5; i++) {
    values[i].value = withTiming(1); // Fewer on web
  }
} else {
  for (let i = 0; i < 20; i++) {
    values[i].value = withTiming(1); // More on native
  }
}
```

---

## 🔍 Debugging Techniques

### 1. Use React DevTools

```javascript
// Install: npm install --save-dev @react-native/devtools
import { devtools } from '@react-native/devtools';

// Monitor shared values
console.log('Opacity:', opacity.value);
```

### 2. Add Logging to Worklets

```javascript
const animatedStyle = useAnimatedStyle(() => {
  console.log('Rendering with opacity:', opacity.value);
  return { opacity: opacity.value };
});
```

### 3. Use Animated Value Listeners

```javascript
useEffect(() => {
  const listenerID = 0;
  opacity.addListener(listenerID, (newValue) => {
    console.log('Opacity changed to:', newValue);
  });

  return () => opacity.removeListener(listenerID);
}, []);
```

---

## 📋 Debug Checklist

Before posting issues, verify:

- [ ] Animations targeting shared values (not static values)
- [ ] Using Animated.* components (not regular View/Text)
- [ ] GestureHandlerRootView wraps app (Android)
- [ ] Babel plugin configured correctly and listed last
- [ ] useAnimatedStyle callback marked as worklet (optional but recommended)
- [ ] scheduleOnRN functions defined in JS thread scope
- [ ] No mutations of shared values in useAnimatedStyle
- [ ] Cache cleared (Metro/Expo)
- [ ] Correct shared value type (number, string, object)
- [ ] No React state updates in worklets

---

## 📚 Getting Help

**Official Resources:**
- **Documentation:** https://docs.swmansion.com/react-native-reanimated/
- **GitHub Issues:** https://github.com/software-mansion/react-native-reanimated/issues
- **Discord Community:** https://discord.gg/reanimated

**When Filing Issues:**
1. Minimal reproducible example (Expo Snack/GitHub repo)
2. Exact error message and stack trace
3. Platform (iOS/Android/Web)
4. Reanimated version: `npm list react-native-reanimated`
5. React Native version: `npm list react-native`
6. Steps to reproduce

---

## 🔗 Cross-References

- **Best Practices:** See [09-best-practices.md](./09-best-practices.md) for prevention
- **API Reference:** See [08-api-reference-core.md](./08-api-reference-core.md) for exact signatures
- **Worklets:** See [06-worklets-guide.md](./06-worklets-guide.md) for thread execution details
- **Gestures:** See [07-gestures-events.md](./07-gestures-events.md) for gesture patterns

---

**Last Updated:** December 2024  
**Verified For:** Reanimated 4.2.1
