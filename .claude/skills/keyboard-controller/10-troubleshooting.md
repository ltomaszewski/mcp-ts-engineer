# Keyboard Controller: Troubleshooting

**Debugging, performance, common issues**

---

## Animation Issues

### Stuttering/Laggy Frames

**Symptoms:** Animation not smooth, visible frame drops.

**Solutions:**

1. **Switch to Reanimated** (best performance):
```typescript
// ❌ Less efficient
const { height } = useKeyboardAnimation();

// ✅ More efficient
const { height } = useReanimatedKeyboardAnimation();
```

2. **Optimize onMove handler:**
```typescript
// ❌ Heavy computation
useKeyboardHandler({
  onMove: (e) => {
    'worklet';
    const result = expensiveCalculation(e.height);
    height.value = result;
  },
}, []);

// ✅ Lightweight handler
useKeyboardHandler({
  onMove: (e) => {
    'worklet';
    height.value = e.height;
  },
}, []);
```

---

## Keyboard Not Appearing

**Symptoms:** Tapping TextInput doesn't show keyboard.

**Solutions:**

1. Verify `KeyboardProvider` is at app root
2. Check Android manifest has soft input mode
3. Explicitly set input mode:
```typescript
import { KeyboardController, AndroidSoftInputModes } from 'react-native-keyboard-controller';

useEffect(() => {
  KeyboardController.setInputMode(
    AndroidSoftInputModes.SOFT_INPUT_ADJUST_RESIZE
  );
}, []);
```

---

## Keyboard Covers Input

**Symptoms:** Focused TextInput is behind keyboard.

**Solutions:**

1. Use `KeyboardAwareScrollView`:
```typescript
<KeyboardAwareScrollView bottomOffset={50}>
  {/* Form content */}
</KeyboardAwareScrollView>
```

2. Increase `bottomOffset`:
```typescript
<KeyboardAwareScrollView bottomOffset={100}>
```

---

## Reanimated Issues

### SharedValue Not Updating

1. Ensure Reanimated is installed:
```bash
npm install react-native-reanimated
```

2. Check babel plugin:
```javascript
// babel.config.js
module.exports = {
  plugins: ['react-native-reanimated/plugin'],
};
```

### Worklet Not Executing

```typescript
// ❌ Missing worklet directive
useKeyboardHandler({
  onMove: (e) => {
    // This won't execute
  },
}, []);

// ✅ With worklet directive
useKeyboardHandler({
  onMove: (e) => {
    'worklet';
    // This executes on native thread
  },
}, []);
```

---

## Build Issues

### Pod Installation Fails
```bash
cd ios
rm -rf Pods Podfile.lock
pod repo update
pod install
cd ..
```

### Gradle Build Failure
```bash
cd android
./gradlew clean
./gradlew build
cd ..
npm run android
```

---

## Debugging Checklist

### Animations don't work
- [ ] `KeyboardProvider` wraps entire app
- [ ] Using correct hook
- [ ] Style is applied correctly
- [ ] Platform is iOS/Android (not web)
- [ ] No TypeScript errors

### Keyboard doesn't show
- [ ] TextInput is not disabled
- [ ] Android manifest configured
- [ ] No console errors
- [ ] Try on physical device

### Forms scroll incorrectly
- [ ] Using `KeyboardAwareScrollView`
- [ ] `bottomOffset` is set
- [ ] ScrollView is scrollable

---

## FPS Monitoring

```typescript
function PerformanceMonitor() {
  useEffect(() => {
    let frameCount = 0;
    let lastTime = Date.now();

    const checkFPS = () => {
      frameCount++;
      const now = Date.now();
      const elapsed = now - lastTime;

      if (elapsed >= 1000) {
        console.log(`FPS: ${frameCount}`);
        frameCount = 0;
        lastTime = now;
      }

      requestAnimationFrame(checkFPS);
    };

    checkFPS();
  }, []);

  return null;
}
```

---

## Getting Help

1. **Check issues:** https://github.com/kirillzyusko/react-native-keyboard-controller/issues
2. **Open new issue with:**
   - React Native version
   - Device/OS version
   - Minimal reproducible example
   - Console errors
3. **Discussions:** https://github.com/kirillzyusko/react-native-keyboard-controller/discussions

---

**See Also**: [Setup](01-setup.md) | [Implementation Guides](06-implementation-guides.md)
