# Keyboard Controller: Troubleshooting

**Debugging, performance, common issues and solutions.**

---

## Animation Issues

### Stuttering/Laggy Frames

**Symptoms:** Animation not smooth, visible frame drops.

**Solutions:**

1. **Switch to Reanimated** (UI thread, best performance):
```typescript
// Less efficient (bridge thread)
const { height } = useKeyboardAnimation();

// More efficient (UI thread)
const { height } = useReanimatedKeyboardAnimation();
```

2. **Optimize worklet handlers:**
```typescript
// Bad: heavy computation in worklet
useKeyboardHandler({
  onMove: (e) => {
    'worklet';
    const result = expensiveCalculation(e.height);
    height.value = result;
  },
}, []);

// Good: lightweight handler
useKeyboardHandler({
  onMove: (e) => {
    'worklet';
    height.value = e.height;
  },
}, []);
```

3. **Enable ProMotion on iOS:**
```xml
<!-- ios/YourApp/Info.plist -->
<key>CADisableMinimumFrameDurationOnPhone</key>
<true/>
```

---

## Keyboard Not Appearing

**Symptoms:** Tapping TextInput does not show keyboard.

**Solutions:**

1. Verify `KeyboardProvider` wraps the entire app
2. Check Android manifest has correct `windowSoftInputMode`
3. Try setting input mode explicitly:
```typescript
import { KeyboardController, AndroidSoftInputModes } from 'react-native-keyboard-controller';

useEffect(() => {
  KeyboardController.setInputMode(
    AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE
  );
}, []);
```
4. Test on a physical device (simulators can behave differently)

---

## Keyboard Covers Input

**Symptoms:** Focused TextInput is behind the keyboard.

**Solutions:**

1. Use `KeyboardAwareScrollView`:
```typescript
<KeyboardAwareScrollView bottomOffset={50}>
  {/* Form content */}
</KeyboardAwareScrollView>
```

2. Increase `bottomOffset` if input is still partially hidden:
```typescript
<KeyboardAwareScrollView bottomOffset={100}>
```

3. Ensure TextInput is inside the scroll view, not outside it.

---

## Reanimated Issues

### SharedValue Not Updating

1. Ensure `react-native-reanimated` is installed:
```bash
npm list react-native-reanimated
```

2. Check Reanimated babel plugin is configured:
```javascript
// babel.config.js
module.exports = {
  plugins: ['react-native-reanimated/plugin'],
};
```

3. Clean build after adding plugin:
```bash
npx expo start --clear
# or
cd ios && rm -rf Pods && pod install && cd ..
```

### Worklet Not Executing

```typescript
// Missing 'worklet' directive -- will not execute
useKeyboardHandler({
  onMove: (e) => {
    keyboardHeight.value = e.height; // silently fails
  },
}, []);

// With directive -- works correctly
useKeyboardHandler({
  onMove: (e) => {
    'worklet';
    keyboardHeight.value = e.height;
  },
}, []);
```

---

## Build Issues

### Pod Installation Fails (iOS)

```bash
cd ios
rm -rf Pods Podfile.lock
pod repo update
pod install
cd ..
```

### Gradle Build Failure (Android)

```bash
cd android
./gradlew clean
cd ..
npx react-native run-android
```

### Expo Build Issues

```bash
npx expo prebuild --clean
npx expo run:ios
```

**Note:** react-native-keyboard-controller is not compatible with Expo Go. Use `expo run:ios` / `expo run:android` or a custom dev client.

---

## Keyboard Flash on Launch

If the keyboard briefly appears when the app launches, disable preloading:

```typescript
<KeyboardProvider preload={false}>
  <YourApp />
</KeyboardProvider>
```

---

## Debugging Checklist

### Animations not working
- [ ] `KeyboardProvider` wraps entire app
- [ ] Using correct hook (`useReanimatedKeyboardAnimation` preferred)
- [ ] Animated style is applied to an `Animated.View`
- [ ] Testing on iOS or Android (not web)
- [ ] No TypeScript errors

### Keyboard does not show
- [ ] TextInput is not disabled
- [ ] Android manifest has `windowSoftInputMode` configured
- [ ] No console errors in Metro
- [ ] Testing on physical device

### Forms scroll incorrectly
- [ ] Using `KeyboardAwareScrollView` (not `KeyboardAvoidingView`)
- [ ] `bottomOffset` is set to a reasonable value
- [ ] ScrollView content is tall enough to scroll
- [ ] `keyboardShouldPersistTaps="handled"` if taps are not registering

### Toolbar not showing
- [ ] `KeyboardToolbar` is rendered as a sibling of the scroll view (not inside it)
- [ ] Multiple TextInputs exist in the view hierarchy
- [ ] No absolute positioning that covers the toolbar

---

## Getting Help

1. **GitHub Issues:** https://github.com/kirillzyusko/react-native-keyboard-controller/issues
2. **GitHub Discussions:** https://github.com/kirillzyusko/react-native-keyboard-controller/discussions
3. **When filing an issue, include:**
   - React Native version
   - Keyboard Controller version
   - Device/OS version
   - Minimal reproducible example
   - Console errors

---

**Version:** 1.20.x | **Source:** https://kirillzyusko.github.io/react-native-keyboard-controller/
